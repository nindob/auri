import {
    ClientActionEnum,
    NTPRequestMessage,
    WSMessage,
    WSResponse,
  } from "@shared/types";
  import { deserializeMessage, WSData } from "../utils/websocket";
  import { Server, ServerWebSocket } from "bun";
  
  export const handleOpen = (ws: ServerWebSocket<WSData>, server: Server) => {
    const { roomId } = ws.data;
    ws.subscribe(roomId);
    const message: WSResponse = {
      type: "ROOM_EVENT",
      event: {
        type: ClientActionEnum.Enum.JOIN,
        username: ws.data.username,
        userId: ws.data.userId,
      },
    };
    server.publish(roomId, JSON.stringify(message));
  };
  
  export const handleMessage = (
    ws: ServerWebSocket<WSData>,
    message: string | Buffer,
    server: Server
  ) => {
    const { roomId, userId, username } = ws.data;
    const t1 = Date.now();
    const parsedMessage = deserializeMessage(message.toString());
    console.log(
      `Room: ${roomId} | User: ${username} | Message: ${JSON.stringify(
        parsedMessage
      )}`
    );
  
    // NTP Request
    if (parsedMessage.type === ClientActionEnum.Enum.NTP_REQUEST) {
      const ntpRequest = parsedMessage as NTPRequestMessage;
      const ntpResponse: WSResponse = {
        type: "NTP_RESPONSE",
        t0: ntpRequest.t0, // Echo back the client's t0
        t1, // Server receive time
        t2: Date.now(), // Server send time
      };
  
      ws.send(JSON.stringify(ntpResponse));
      return;
    } else if (parsedMessage.type === "PLAY" || parsedMessage.type === "PAUSE") {
      const scheduledMessage: WSResponse = {
        type: "SCHEDULED_ACTION",
        scheduledAction: parsedMessage,
        timeToExecute: Date.now() + 500, // 500 ms from now
      };
      ws.send(JSON.stringify(scheduledMessage));
      return;
    }
  
    // Others are just events
    const event: WSResponse = {
      type: "ROOM_EVENT",
      event: parsedMessage,
    };
  
    server.publish(roomId, JSON.stringify(event));
  };
  
  export const handleClose = (ws: any) => {
    console.log(`Connection closed`);
    ws.unsubscribe(ws.data.roomId);
  };