"use client";
import { Button } from "@/components/ui/button";
import { Action, ClientMessage, ServerMessage } from "@shared/types";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import LocalIPFinder from "./IPFinder";

const deserializeMessage = (message: string): ServerMessage => {
  const parsedMessage = JSON.parse(message);
  return parsedMessage;
};

const serializeMessage = (message: ClientMessage): string => {
  return JSON.stringify(message);
};

const waitForOpenSocket = (socket: WebSocket) => {
  return new Promise<void>((resolve) => {
    if (socket.readyState !== WebSocket.OPEN) {
      socket.onopen = () => {
        resolve();
      };
    } else {
      resolve();
    }
  });
};

const getWebSocketUrl = () => {
  // Use environment variable if available, otherwise fallback to localhost
  return process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
};

export const Syncer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    console.log("Connecting to WebSocket at:", wsUrl);
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log("Connected to WebSocket");
      setIsConnected(true);
    };

    newSocket.onmessage = (event) => {
      console.log("Message from server ", event.data);
      const message = deserializeMessage(event.data);
      if (message.type === Action.Play) {
        audioRef.current!.play();
      } else if (message.type === Action.Pause) {
        audioRef.current!.pause();
      }
    };

    newSocket.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    setSocket(newSocket);

    // Preload audio
    audioRef.current = new Audio("/alien.mp3");

    return () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, []);

  const handlePlay = async () => {
    if (socket) {
      await waitForOpenSocket(socket);
      socket.send(serializeMessage({ type: Action.Play }));
    }
  };

  const handlePause = async () => {
    if (socket) {
      await waitForOpenSocket(socket);
      socket.send(serializeMessage({ type: Action.Pause }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <LocalIPFinder />
      <div className="mb-4">
        Status: {isConnected ? "Connected" : "Disconnected"}
      </div>
      <div className="flex gap-2">
        <Button onClick={handlePlay} variant="default" size="default">
          <Play className="mr-2 h-4 w-4" />
          Play
        </Button>
        <Button onClick={handlePause} variant="default" size="default">
          <Pause className="mr-2 h-4 w-4" />
          Pause
        </Button>
      </div>
    </div>
  );
};