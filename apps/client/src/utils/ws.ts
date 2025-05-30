import { WSRequestType } from "@auri/shared";

export const sendWSRequest = ({
  ws,
  request,
}: {
  ws: WebSocket;
  request: WSRequestType;
}) => {
  ws.send(JSON.stringify(request));
};