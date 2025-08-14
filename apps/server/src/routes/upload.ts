import {
  GetUploadUrlSchema,
  UploadCompleteResponseType,
  UploadCompleteSchema,
  UploadUrlResponseType,
} from "@auri/shared";
import { Server } from "bun";
import {
  generateAudioFileName,
  generatePresignedUploadUrl,
  getPublicAudioUrl,
  validateR2Config,
} from "../lib/r2";
import { errorResponse, jsonResponse, sendBroadcast } from "../utils/responses";

// New endpoint to get presigned upload URL
export const handleGetPresignedURL = async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    // Validate R2 configuration first
    const r2Validation = validateR2Config();
    if (!r2Validation.isValid) {
      console.error("R2 configuration errors:", r2Validation.errors);
      return errorResponse("R2 configuration not complete", 500);
    }

    const body = await req.json();
    const parseResult = GetUploadUrlSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(
        `Invalid request data: ${parseResult.error.message}`,
        400
      );
    }

    const { roomId, fileName, contentType } = parseResult.data;

    // Generate unique filename
    const uniqueFileName = generateAudioFileName(fileName);
    const r2Key = `room-${roomId}/${uniqueFileName}`;

    // Generate presigned URL for upload
    const uploadUrl = await generatePresignedUploadUrl(
      roomId,
      uniqueFileName,
      contentType
    );
    const publicUrl = getPublicAudioUrl(roomId, uniqueFileName);

    console.log(`Generated presigned URL for upload - R2 key: (${r2Key})`);

    const response: UploadUrlResponseType = {
      uploadUrl,
      publicUrl,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return errorResponse("Failed to generate upload URL", 500);
  }
};

// Endpoint to confirm successful upload and broadcast to room
export const handleUploadComplete = async (req: Request, server: Server) => {
  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const body = await req.json();
    const parseResult = UploadCompleteSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(
        `Invalid request data: ${parseResult.error.message}`,
        400
      );
    }

    const { roomId, originalName, publicUrl } = parseResult.data;

    console.log(
      `✅ Audio upload completed - broadcasting to room ${roomId}: (${publicUrl})`
    );

    // Broadcast to room that new audio is available
    sendBroadcast({
      server,
      roomId,
      message: {
        type: "ROOM_EVENT",
        event: {
          type: "NEW_AUDIO_SOURCE",
          id: publicUrl,
          title: originalName,
          duration: 1, // TODO: calculate this properly later
          addedAt: Date.now(),
          addedBy: roomId,
        },
      },
    });

    const response: UploadCompleteResponseType = { success: true };
    return jsonResponse(response);
  } catch (error) {
    console.error("Error confirming upload:", error);
    return errorResponse("Failed to confirm upload", 500);
  }
};