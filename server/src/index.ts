import type { ServerWebSocket } from "bun";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";

const { upgradeWebSocket, websocketHandler } = createBunWebSocket<ServerWebSocket>();

const app = new Hono();

app.get("/", (c) => { return c.text("Hannah is a twig!");});

app.get(
    "/ws",
    upgradeWebSocket((c) => {
        return {
            onMessage(event, ws) {
                console.log(`Message from client: ${event.data}`);
                ws.send("Hello from server!");
            },
            onClose: () => {
                console.log("Connection closed");
            },
        };
    })
);

export default {
    port: 8080,
    fetch: app.fetch,
    websocket,
};