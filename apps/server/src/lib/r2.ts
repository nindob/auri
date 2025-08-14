import {
    DeleteObjectsCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
  } from "@aws-sdk/client-s3";
  import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
  import { config } from "dotenv";
  import sanitize = require("sanitize-filename");
  
  config();
  
  const S3_CONFIG = {
    BUCKET_NAME: process.env.S3_BUCKET_NAME!,
    PUBLIC_URL: process.env.S3_PUBLIC_URL!,
    ENDPOINT: process.env.S3_ENDPOINT!,
    ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID!,
    SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY!,
  };
  
  const r2Client = new S3Client({
    region: "auto",
    endpoint: S3_CONFIG.ENDPOINT,
    credentials: {
      accessKeyId: S3_CONFIG.ACCESS_KEY_ID,
      secretAccessKey: S3_CONFIG.SECRET_ACCESS_KEY,
    },
  });
  
  export interface AudioFileMetadata {
    roomId: string;
    fileName: string;
    originalName: string;
    contentType: string;
    fileSize: number;
    uploadedAt: string;
  }
  
  /**
   * Generate a presigned URL for uploading audio files to R2
   */
  export async function generatePresignedUploadUrl(
    roomId: string,
    fileName: string,
    contentType: string,
    expiresIn: number = 3600 // 1 hour
  ): Promise<string> {
    const key = `room-${roomId}/${fileName}`;
  
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Metadata: {
        roomId,
        uploadedAt: new Date().toISOString(),
      },
    });
  
    return await getSignedUrl(r2Client, command, { expiresIn });
  }
  
  /**
   * Get the public URL for an audio file (if public access is enabled)
   */
  export function getPublicAudioUrl(roomId: string, fileName: string): string {
    return `${S3_CONFIG.PUBLIC_URL}/room-${roomId}/${fileName}`;
  }
  
  /**
   * Generate a unique file name for audio uploads
   */
  export function generateAudioFileName(originalName: string): string {
    // Extract extension
    const extension = originalName.split(".").pop() || "mp3";
  
    // Remove extension from name for processing
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  
    // Sanitize filename using the library
    let safeName = sanitize(nameWithoutExt, { replacement: "-" });
  
    // Truncate if too long (leave room for timestamp and extension)
    const maxNameLength = 400;
    if (safeName.length > maxNameLength) {
      safeName = safeName.substring(0, maxNameLength);
    }
  
    // Fallback if name becomes empty after sanitization
    if (!safeName) {
      safeName = "audio";
    }
  
    // Generate timestamp with date and random component
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const randomComponent = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
  
    return `${safeName}-${dateStr}-${randomComponent}.${extension}`;
  }
  
  /**
   * Validate R2 configuration
   */
  export function validateR2Config(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
  
    for (const [key, value] of Object.entries(S3_CONFIG)) {
      if (!value) {
        errors.push(`S3 CONFIG: ${key} is not defined`);
      }
    }
  
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * List all objects with a given prefix
   */
  export async function listObjectsWithPrefix(prefix: string) {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Prefix: prefix,
      });
  
      const listResponse = await r2Client.send(listCommand);
      return listResponse.Contents;
    } catch (error) {
      console.error(`Failed to list objects with prefix "${prefix}":`, error);
      throw error;
    }
  }
  
  /**
   * Delete all objects with a given prefix
   */
  export async function deleteObjectsWithPrefix(
    prefix: string = ""
  ): Promise<{ deletedCount: number }> {
    let deletedCount = 0;
  
    try {
      const objects = await listObjectsWithPrefix(prefix);
  
      if (!objects || objects.length === 0) {
        console.log(`No objects found with prefix "${prefix}"`);
        return { deletedCount: 0 };
      }
  
      console.log(
        `Deleting ${objects.length} objects with prefix "${prefix}: ${objects}"`
      );
  
      // Prepare objects for batch deletion
      const objectsToDelete = objects.map((obj) => ({
        Key: obj.Key!,
      }));
  
      // Delete objects in batches (R2/S3 supports up to 1000 objects per batch)
      const batchSize = 1000;
      for (let i = 0; i < objectsToDelete.length; i += batchSize) {
        const batch = objectsToDelete.slice(i, i + batchSize);
  
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: S3_CONFIG.BUCKET_NAME,
          Delete: {
            Objects: batch,
            Quiet: true, // Only return errors, not successful deletions
          },
        });
  
        const deleteResponse = await r2Client.send(deleteCommand);
  
        // Count successful deletions
        const batchDeletedCount =
          batch.length - (deleteResponse.Errors?.length || 0);
        deletedCount += batchDeletedCount;
  
        // Throw on first error
        if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
          const firstError = deleteResponse.Errors[0];
          throw new Error(
            `Failed to delete ${firstError.Key}: ${firstError.Message}`
          );
        }
      }
  
      console.log(
        `R2 cleanup with prefix "${prefix}": ${deletedCount} files deleted successfully`
      );
  
      return { deletedCount };
    } catch (error) {
      const errorMessage = `Failed to delete objects with prefix "${prefix}": ${error}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }