import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export const trimFileName = (fileName: string) => {
  // Remove file extensions like .mp3, .wav, etc.
  return fileName.replace(/\.[^/.]+$/, "");
};