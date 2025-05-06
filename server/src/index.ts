import type { ServerWebSocket } from "bun";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";

const { upgradeWebSocket } = createBunWebSocket<ServerWebSocket>();

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`);
        ws.send(event.data.toString()); // send the same message back to the client
      },
      onClose: () => {
        console.log("Connection closed");
      },
      onOpen: () => {
        console.log(`Connection opened from`);
      },
      onError: (error) => {
        console.error("Error", error);
      },
    };
  })
);

export default {
  port: 8080,
  fetch: app.fetch,
};