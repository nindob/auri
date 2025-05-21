"use client";
import { useGlobalStore } from "@/store/global";
import { useRoomStore } from "@/store/room";
import { AnimatePresence, motion } from "framer-motion";
import { Hash, Users } from "lucide-react";
import { SyncProgress } from "../ui/SyncProgress";

export const TopBar = () => {
  const isLoadingAudio = useGlobalStore((state) => state.isLoadingAudio);
  const isSynced = useGlobalStore((state) => state.isSynced);
  const offsetEstimate = useGlobalStore((state) => state.offsetEstimate);
  const roundTripEstimate = useGlobalStore((state) => state.roundTripEstimate);
  const sendNTPRequest = useGlobalStore((state) => state.sendNTPRequest);
  const resetNTPConfig = useGlobalStore((state) => state.resetNTPConfig);
  const pauseAudio = useGlobalStore((state) => state.pauseAudio);
  const connectedClients = useGlobalStore((state) => state.connectedClients);
  const setIsLoadingAudio = useGlobalStore((state) => state.setIsLoadingAudio);
  const roomId = useRoomStore((state) => state.roomId);

  const resync = () => {
    try {
      pauseAudio({ when: 0 });
    } catch (error) {
      console.error("Failed to pause audio:", error);
    }
    resetNTPConfig();
    sendNTPRequest();
    setIsLoadingAudio(true);
  };

  // Show minimal nav bar when synced and not loading
  if (!isLoadingAudio && isSynced) {
    return (
      <div className="h-8 bg-black/80 backdrop-blur-md z-50 flex items-center px-4 border-b border-zinc-800">
        <div className="flex items-center space-x-3 text-xs text-neutral-400">
          <div className="flex items-center">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
            <span>Synced</span>
          </div>
          <div className="flex items-center">
            <Hash size={12} className="mr-1.5" />
            <span className="flex items-center">{roomId}</span>
          </div>
          <div className="flex items-center">
            <Users size={12} className="mr-1.5" />
            <span className="flex items-center">
              <span className="mr-1">
                {connectedClients.length}{" "}
                {connectedClients.length === 1 ? "user" : "users"}
              </span>
            </span>
          </div>

          <div>|</div>
          <div className="flex items-center space-x-2">
            <span>
              Offset: <span>{offsetEstimate.toFixed(2)}</span>ms
            </span>
            <span>RTT: {roundTripEstimate.toFixed(2)} ms</span>
          </div>
          <div>|</div>

          <button
            onClick={resync}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Full Sync
          </button>
        </div>
      </div>
    );
  }

  // Use the existing SyncProgress component for loading/syncing states
  return (
    <AnimatePresence>
      {isLoadingAudio && (
        <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <SyncProgress />
        </motion.div>
      )}
    </AnimatePresence>
  );
};