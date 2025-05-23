import { Server } from "bun";
import { errorResponse, jsonResponse } from "../utils/responses";
import { SEARCH_SERVICE } from "../download/download";

export const handleSearch = async (req: Request, server: Server) => {
  try {
    // Check if it's a GET request
    if (req.method !== "GET") {
      return errorResponse("Method not allowed", 405);
    }

    // Parse and validate the request query param
    const url = new URL(req.url); // Create a URL object from the request URL string
    const query = url.searchParams.get("query"); // Get the value of the 'query' parameter

    // Validate if the 'query' parameter exists and is not empty
    if (!query) {
      // Return a 400 Bad Request error if 'query' is missing or empty
      return errorResponse("Missing or empty 'query' parameter", 400);
    }

    // Generate unique filename with timestamp
    const result = await SEARCH_SERVICE.search(query);

    // Return success response with the file details
    return jsonResponse(result); // Wait for the broadcast to be received.
  } catch (error) {
    console.error("Error handling search:", error);
    return errorResponse("Failed to process upload", 500);
  }
};