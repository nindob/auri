import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocalAudioSource } from "@/lib/localTypes";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/store/global";
import { MoreHorizontal, Pause, Play, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePostHog } from "posthog-js/react";

export const Queue = ({ className, ...rest }: React.ComponentProps<"div">) => {
  const posthog = usePostHog();
  const audioSources = useGlobalStore((state) => state.audioSources);
  const selectedAudioId = useGlobalStore((state) => state.selectedAudioId);
  const setSelectedAudioId = useGlobalStore((state) => state.setSelectedAudioId);
  const broadcastPlay = useGlobalStore((state) => state.broadcastPlay);
  const broadcastPause = useGlobalStore((state) => state.broadcastPause);
  const isPlaying = useGlobalStore((state) => state.isPlaying);
  const deleteAudioSource = useGlobalStore((state) => state.deleteAudioSource);

  const handleItemClick = (source: LocalAudioSource) => {
    if (source.id === selectedAudioId) {
      if (isPlaying) {
        broadcastPause();
        posthog.capture("pause_track", { track_id: source.id });
      } else {
        broadcastPlay(0); // Always start from beginning when resuming
        posthog.capture("play_track", { track_id: source.id });
      }
    } else {
      // Track selection event
      posthog.capture("select_track", {
        track_id: source.id,
        track_name: source.name,
        previous_track_id: selectedAudioId,
      });

      setSelectedAudioId(source.id);
      broadcastPlay(0);
    }
  };

  const handleDelete = (sourceId: string, sourceName: string) => {
    // If this is the currently playing track, pause it first
    if (sourceId === selectedAudioId && isPlaying) {
      broadcastPause();
    }
    
    deleteAudioSource(sourceId);
    
    // Track delete event
    posthog.capture("delete_track", {
      track_id: sourceId,
      track_name: sourceName,
    });
  };

  return (
    <div className={cn("", className)} {...rest}>
      {/* <h2 className="text-xl font-bold mb-2 select-none">Auri</h2> */}
      <div className="space-y-1">
        {audioSources.length > 0 ? (
          <AnimatePresence initial={true}>
            {audioSources.map((source, index) => {
              const isSelected = source.id === selectedAudioId;
              const isPlayingThis = isSelected && isPlaying;

              return (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.05 * index,
                    ease: "easeOut",
                  }}
                  className={cn(
                    "flex items-center pl-2 pr-4 py-3 rounded-md group transition-colors select-none",
                    isSelected
                      ? "text-white hover:bg-neutral-700/20"
                      : "text-neutral-300 hover:bg-neutral-700/20"
                  )}
                >
                  {/* Track number / Play icon */}
                  <div 
                    className="w-6 h-6 flex-shrink-0 flex items-center justify-center relative cursor-pointer select-none"
                    onClick={() => handleItemClick(source)}
                  >
                    {/* Play/Pause button (shown on hover) */}
                    <button 
                      className="text-white text-sm hover:scale-110 transition-transform w-full h-full flex items-center justify-center absolute inset-0 opacity-0 group-hover:opacity-100 select-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(source);
                      }}
                    >
                      {isSelected && isPlaying ? (
                        <Pause className="fill-current size-3.5 stroke-1" />
                      ) : (
                        <Play className="fill-current size-3.5" />
                      )}
                    </button>

                    {/* Playing indicator or track number (hidden on hover) */}
                    <div className="w-full h-full flex items-center justify-center group-hover:opacity-0 select-none">
                      {isPlayingThis ? (
                        <div className="flex items-end justify-center h-4 w-4 gap-[2px]">
                          <div className="bg-primary-500 w-[2px] h-[40%] animate-[sound-wave-1_1.2s_ease-in-out_infinite]"></div>
                          <div className="bg-primary-500 w-[2px] h-[80%] animate-[sound-wave-2_1.4s_ease-in-out_infinite]"></div>
                          <div className="bg-primary-500 w-[2px] h-[60%] animate-[sound-wave-3_1s_ease-in-out_infinite]"></div>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "text-sm group-hover:opacity-0 select-none",
                            isSelected ? "text-primary-400" : "text-neutral-400"
                          )}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Track name */}
                  <div 
                    className="flex-1 min-w-0 ml-3 select-none cursor-pointer"
                    onClick={() => handleItemClick(source)}
                  >
                    <div
                      className={cn(
                        "font-medium text-sm truncate select-none",
                        isSelected ? "text-primary-400" : ""
                      )}
                    >
                      {source.name}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-md hover:bg-neutral-700/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleDelete(source.id, source.name)}
                          className="cursor-pointer text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-neutral-400"
          >
            <div className="space-y-2">
              <p className="text-sm">No tracks in your library</p>
              <p className="text-xs">Upload your own music or search for tracks to get started</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};