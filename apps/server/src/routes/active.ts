import { jsonResponse, errorResponse } from "../utils/responses";
import { globalManager } from "../managers/GlobalManager";
import { GetActiveRoomsType } from "@auri/shared";

export async function getActiveRooms(_req: Request) {
  const response: GetActiveRoomsType = await globalManager.getActiveUserCount();
  return jsonResponse(response);
}