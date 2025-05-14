import { WSMessage } from "@auri/shared";

export const deserializeMessage = (message: string): WSMessage => {
  const parsedMessage = JSON.parse(message);
  return parsedMessage;
};