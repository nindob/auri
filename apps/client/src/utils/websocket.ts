import { WSRequest } from "@auri/shared";

export const deserializeMessage = (message: string): WSRequest => {
  const parsedMessage = JSON.parse(message);
  return parsedMessage;
};