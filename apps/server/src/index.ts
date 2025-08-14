import { handleRoot } from "./routes/root";
import { handleStats } from "./routes/stats";
import { handleGetPresignedURL, handleUploadComplete } from "./routes/upload";
import { handleWebSocketUpgrade } from "./routes/websocket";
import {
  handleClose,
  handleMessage,
  handleOpen,
} from "./routes/websocketHandlers";
import { corsHeaders, errorResponse } from "./utils/responses";
import { WSData } from "./utils/websocket";

// Bun.serve with WebSocket support
const server = Bun.serve<WSData, undefined>({
  hostname: "0.0.0.0",
  port: 8080,
  async fetch(req, server) {
    const url = new URL(req.url);

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (url.pathname) {
        case "/":
          return handleRoot(req);

        case "/ws":
          return handleWebSocketUpgrade(req, server);

        case "/upload/get-presigned-url":
          return handleGetPresignedURL(req);

        case "/upload/complete":
          return handleUploadComplete(req, server);

        case "/stats":
          return handleStats(req);

        default:
          return errorResponse("Not found", 404);
      }
    } catch (err) {
      return errorResponse("Internal server error", 500);
    }
  },

  websocket: {
    open(ws) {
      handleOpen(ws, server);
    },

    message(ws, message) {
      handleMessage(ws, message, server);
    },

    close(ws) {
      handleClose(ws, server);
    },
  },
});

console.log(`HTTP listening on http://${server.hostname}:${server.port}`);