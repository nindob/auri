import { WSRequestSchema } from "@auri/shared";

export interface WSData {
  roomId: string;
  userId: string;
  username: string;
}

export const deserializeMessage = (message: string) => {
  return WSRequestSchema.parse(JSON.parse(message));
};