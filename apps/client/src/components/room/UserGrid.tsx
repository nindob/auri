"use client";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/store/global";
import { useRoomStore } from "@/store/room";
import { ClientType, GRID } from "@auri/shared";
import { HeadphonesIcon, Rotate3D } from "lucide-react";
import { motion } from "motion/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

// Add custom scrollbar styles
import "./scrollbar.css";

// Define prop types for components
interface ClientAvatarProps {
  client: ClientType;
  isActive: boolean;
  isFocused: boolean;
  isCurrentUser: boolean;
  animationSyncKey: number;
  generateColor: (username: string) => string;
}

interface ConnectedUserItemProps {
  client: ClientType;
  isActive: boolean;
  isFocused: boolean;
  isCurrentUser: boolean;
  generateColor: (username: string) => string;
}

// Separate Client Avatar component for better performance
const ClientAvatar = memo<ClientAvatarProps>(
  ({
    client,
    isActive,
    isFocused,
    isCurrentUser,
    animationSyncKey,
    generateColor,
  }) => {
    return (
      <Tooltip key={client.clientId}>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
              isFocused ? "z-30" : isActive ? "z-20" : "z-10"
            )}
            style={{
              left: `${client.position.x}%`,
              top: `${client.position.y}%`,
            }}
            initial={{ opacity: 0.8 }}
            animate={{
              opacity: 1,
              scale: isFocused ? 1.2 : isActive ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={cn(
                "relative",
                isFocused ? "ring-2 ring-primary ring-offset-2" : "",
                isActive ? "ring-1 ring-secondary" : ""
              )}
            >
              <Avatar
                className={cn(
                  "size-12 border-2",
                  isFocused
                    ? "border-primary"
                    : isActive
                    ? "border-secondary"
                    : "border-border"
                )}
              >
                <AvatarImage />
                <AvatarFallback className={generateColor(client.username)}>
                  {client.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isFocused && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
              )}
              {isActive && !isFocused && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-secondary" />
              )}
              {/* Add ping effect to all clients */}
              <span
                key={`ping-${animationSyncKey}`}
                className={cn(
                  "absolute inset-0 rounded-full opacity-75 animate-ping",
                  isFocused
                    ? "bg-emerald-400/40"
                    : isActive
                    ? "bg-indigo-500/40"
                    : "bg-gray-400/30"
                )}
              ></span>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs font-medium">{client.username}</div>
          <div>
            {isFocused
              ? "Focused"
              : isActive
              ? "Active"
              : isCurrentUser
              ? "You"
              : "Connected"}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
);

ClientAvatar.displayName = "ClientAvatar";

// Separate connected user list item component
const ConnectedUserItem = memo<ConnectedUserItemProps>(
  ({ client, isActive, isFocused, isCurrentUser, generateColor }) => {
    return (
      <motion.div
        className={cn(
          "flex items-center gap-2 p-1.5 rounded-md transition-all duration-300 text-sm",
          isFocused
            ? "bg-primary/20 shadow-sm shadow-primary/20"
            : isActive
            ? "bg-primary/5"
            : "bg-transparent"
        )}
        initial={{ opacity: 0.8 }}
        animate={{
          opacity: 1,
          scale: isFocused ? 1.02 : isActive ? 1.01 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Avatar className="h-5 w-5 md:h-6 md:w-6">
          <AvatarImage />
          <AvatarFallback className={generateColor(client.username)}>
            {client.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium truncate">
            {client.username}
          </span>
        </div>
        <Badge
          variant={
            isFocused
              ? "default"
              : isActive
              ? "secondary"
              : isCurrentUser
              ? "secondary"
              : "outline"
          }
          className={cn(
            "ml-auto text-xs shrink-0 min-w-[60px] text-center py-0 h-5",
            isFocused ? "bg-primary animate-pulse" : ""
          )}
        >
          {isFocused
            ? "Focused"
            : isActive
            ? "Active"
            : isCurrentUser
            ? "You"
            : "Connected"}
        </Badge>
      </motion.div>
    );
  }
);

ConnectedUserItem.displayName = "ConnectedUserItem";

export const UserGrid = () => {
  const userId = useRoomStore((state) => state.userId);
  const spatialConfig = useGlobalStore((state) => state.spatialConfig);
  const listeningSource = useGlobalStore(
    (state) => state.listeningSourcePosition
  );
  const setListeningSourcePosition = useGlobalStore(
    (state) => state.setListeningSourcePosition
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const updateListeningSourceSocket = useGlobalStore(
    (state) => state.updateListeningSource
  );

  // Use clients from global store
  const clients = useGlobalStore((state) => state.connectedClients);

  // State to track dragging status
  const isDraggingListeningSource = useGlobalStore(
    (state) => state.isDraggingListeningSource
  );
  const setIsDraggingListeningSource = useGlobalStore(
    (state) => state.setIsDraggingListeningSource
  );

  // Add animation sync timestamp
  const [animationSyncKey, setAnimationSyncKey] = useState(Date.now());

  // Reference to track last execution time
  const lastLogTimeRef = useRef(0);
  const animationFrameRef = useRef(0);

  // Manual throttle implementation for position logging
  const throttleUpdateSourcePosition = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - lastLogTimeRef.current >= 100) {
        console.log("Listening source update:", { position: { x, y } });
        updateListeningSourceSocket({ x, y });
        lastLogTimeRef.current = now;
      }
    },
    [updateListeningSourceSocket]
  );

  // Update animation sync key when clients change
  useEffect(() => {
    setAnimationSyncKey(Date.now());
  }, [clients]);

  // Function to update listening source position
  const onMouseMoveSource = useCallback(
    (x: number, y: number) => {
      // Ensure values are within grid bounds
      const boundedX = Math.max(0, Math.min(GRID.SIZE, x));
      const boundedY = Math.max(0, Math.min(GRID.SIZE, y));

      // Update position immediately for smooth visual feedback
      setListeningSourcePosition({
        x: boundedX,
        y: boundedY,
      });

      // Throttled network update
      throttleUpdateSourcePosition(boundedX, boundedY);
    },
    [setListeningSourcePosition, throttleUpdateSourcePosition]
  );

  // Handlers for dragging the listening source
  const handleSourceMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent grid click handler from firing
      setIsDraggingListeningSource(true);
    },
    [setIsDraggingListeningSource]
  );

  const handleSourceTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation(); // Prevent grid touch handler from firing
      setIsDraggingListeningSource(true);
    },
    [setIsDraggingListeningSource]
  );

  const handleSourceMouseUp = useCallback(() => {
    setIsDraggingListeningSource(false);
  }, [setIsDraggingListeningSource]);

  const handleSourceTouchEnd = useCallback(() => {
    setIsDraggingListeningSource(false);
  }, [setIsDraggingListeningSource]);

  const handleSourceMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingListeningSource || !gridRef.current) return;

      // Cancel any existing animation frame to prevent queuing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use requestAnimationFrame for smoother updates
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!gridRef.current) return;

        const rect = gridRef.current.getBoundingClientRect();
        const gridWidth = rect.width;
        const gridHeight = rect.height;

        // Calculate position as percentage of grid size
        const x = Math.round(((e.clientX - rect.left) / gridWidth) * GRID.SIZE);
        const y = Math.round(((e.clientY - rect.top) / gridHeight) * GRID.SIZE);

        onMouseMoveSource(x, y);
      });
    },
    [isDraggingListeningSource, onMouseMoveSource]
  );

  // Effect to handle non-passive touchmove listener for dragging
  useEffect(() => {
    const gridElement = gridRef.current;

    const touchMoveHandler = (e: TouchEvent) => {
      // Replicate the logic from the original handleSourceTouchMove
      if (!isDraggingListeningSource || !gridElement || !e.touches[0]) return;

      // Prevent scrolling while dragging
      e.preventDefault();

      // Cancel any existing animation frame to prevent queuing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use requestAnimationFrame for smoother updates
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!gridElement || !e.touches[0]) return;

        const touch = e.touches[0];
        const rect = gridElement.getBoundingClientRect();
        const gridWidth = rect.width;
        const gridHeight = rect.height;

        // Calculate position as percentage of grid size
        const x = Math.round(
          ((touch.clientX - rect.left) / gridWidth) * GRID.SIZE
        );
        const y = Math.round(
          ((touch.clientY - rect.top) / gridHeight) * GRID.SIZE
        );

        // Call the existing position update function
        onMouseMoveSource(x, y);
      });
    };

    if (isDraggingListeningSource && gridElement) {
      // Add listener explicitly with passive: false
      gridElement.addEventListener("touchmove", touchMoveHandler, {
        passive: false,
      });
    }

    // Cleanup function
    return () => {
      if (gridElement) {
        gridElement.removeEventListener("touchmove", touchMoveHandler);
      }
      // Clean up any pending animation frames on drag end or unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDraggingListeningSource, onMouseMoveSource]); // Dependencies: run when dragging state changes or updater changes

  // Add event listeners for mouse/touch up even outside the grid
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingListeningSource(false);
    };

    const handleGlobalTouchEnd = () => {
      setIsDraggingListeningSource(false);
    };

    if (isDraggingListeningSource) {
      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("touchend", handleGlobalTouchEnd);
    }

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalTouchEnd);

      // Clean up any pending animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDraggingListeningSource, setIsDraggingListeningSource]);

  // Generate a color based on username for avatar fallback
  const generateColor = useCallback((username: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];

    // Simple hash function to get a consistent color for the same username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Memoize client data to avoid unnecessary recalculations
  const clientsWithData = useMemo(
    () =>
      clients.map((client) => {
        const user = spatialConfig?.gains[client.clientId];
        const isActive = user?.gain === 1;
        const isFocused = user?.gain === 0; // The focused/active device in spatial audio
        const isCurrentUser = client.clientId === userId;
        return { client, isActive, isFocused, isCurrentUser };
      }),
    [clients, spatialConfig?.gains, userId]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 font-medium">
          <Rotate3D size={18} />
          <span>Spatial Audio Map</span>
        </div>
        <Badge variant="outline">{clients.length}</Badge>
      </div>

      <div className="flex-1 px-4 flex flex-col min-h-0 overflow-hidden">
        {clients.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No other users connected
          </div>
        ) : (
          <>
            {/* 2D Grid Layout */}
            <div
              ref={gridRef}
              className="relative w-full aspect-square bg-muted/30 rounded-lg border border-border mb-4 overflow-hidden bg-[size:10%_10%] bg-[position:0_0] bg-[image:linear-gradient(to_right,rgba(55,65,81,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(55,65,81,0.1)_1px,transparent_1px)] select-none touch-none"
              onMouseMove={handleSourceMouseMove}
            >
              <TooltipProvider>
                {clientsWithData.map(
                  ({ client, isActive, isFocused, isCurrentUser }) => (
                    <ClientAvatar
                      key={client.clientId}
                      client={client}
                      isActive={isActive}
                      isFocused={isFocused}
                      isCurrentUser={isCurrentUser}
                      animationSyncKey={animationSyncKey}
                      generateColor={generateColor}
                    />
                  )
                )}

                {/* Listening Source Indicator with drag capability */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      className="absolute z-40 cursor-move"
                      style={{
                        left: `${listeningSource.x}%`,
                        top: `${listeningSource.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      {...(!isDraggingListeningSource && {
                        animate: {
                          left: `${listeningSource.x}%`,
                          top: `${listeningSource.y}%`,
                        },
                        transition: {
                          type: "tween",
                          duration: 0.15,
                          ease: "linear",
                        },
                      })}
                      onMouseDown={handleSourceMouseDown}
                      onMouseUp={handleSourceMouseUp}
                      onTouchStart={handleSourceTouchStart}
                      onTouchEnd={handleSourceTouchEnd}
                    >
                      <div className="relative flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-emerald-400/20 p-1">
                        <span className="relative flex h-2.5 w-2.5 md:h-3 md:w-3">
                          <span
                            key={`source-ping-${animationSyncKey}`}
                            className="absolute inline-flex h-full w-full rounded-full bg-primary-200 opacity-75 animate-ping"
                          ></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-primary-400"></span>
                        </span>
                        <HeadphonesIcon className="absolute h-1.5 w-1.5 md:h-2 md:w-2 text-primary-800 opacity-80" />
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-xs font-medium">Listening Source</div>
                    <div className="text-xs text-muted-foreground">
                      Drag to reposition
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* List of connected users - Constrained height */}
            <div className="space-y-2 max-h-24 md:max-h-32 overflow-y-auto pr-2 flex-shrink-0 scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-muted-foreground/10 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/20">
              {clientsWithData.map(
                ({ client, isActive, isFocused, isCurrentUser }) => (
                  <ConnectedUserItem
                    key={client.clientId}
                    client={client}
                    isActive={isActive}
                    isFocused={isFocused}
                    isCurrentUser={isCurrentUser}
                    generateColor={generateColor}
                  />
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};