import { formatTime } from "@/lib/utils";
import { useGlobalStore } from "@/store/global";
import {
  Pause,
  Play,
  RefreshCw,
  Repeat,
  RocketIcon,
  Shuffle,
  SkipBack,
  SkipForward,
  StopCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
export const Player = () => {
  const broadcastPlay = useGlobalStore((state) => state.broadcastPlay);
  const broadcastPause = useGlobalStore((state) => state.broadcastPause);
  const startSpatialAudio = useGlobalStore((state) => state.startSpatialAudio);
  const stopSpatialAudio = useGlobalStore((state) => state.stopSpatialAudio);
  const isPlaying = useGlobalStore((state) => state.isPlaying);
  const getCurrentTrackPosition = useGlobalStore(
    (state) => state.getCurrentTrackPosition
  );
  const selectedAudioId = useGlobalStore((state) => state.selectedAudioId);
  const audioSources = useGlobalStore((state) => state.audioSources);
  const currentTime = useGlobalStore((state) => state.currentTime);

  // Local state for slider
  const [sliderPosition, setSliderPosition] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [spatialAudioActive, setSpatialAudioActive] = useState(false);

  // Find the selected audio source and its duration
  useEffect(() => {
    if (!selectedAudioId) return;

    const audioSource = audioSources.find(
      (source) => source.id === selectedAudioId
    );
    if (audioSource?.audioBuffer) {
      setTrackDuration(audioSource.audioBuffer.duration);
      // Reset slider position when track changes
      setSliderPosition(0);
    }
  }, [selectedAudioId, audioSources]);

  // Sync with currentTime when it changes (e.g., after pausing)
  useEffect(() => {
    if (!isPlaying) {
      setSliderPosition(currentTime);
    }
  }, [currentTime, isPlaying]);

  // Update slider position during playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const currentPosition = getCurrentTrackPosition();
      setSliderPosition(currentPosition);
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isPlaying, getCurrentTrackPosition]);

  // Handle slider change
  const handleSliderChange = useCallback((value: number[]) => {
    const position = value[0];
    setSliderPosition(position);
  }, []);

  // Handle slider release - seek to that position
  const handleSliderCommit = (value: number[]) => {
    console.log(value);
  };

  const handleSpatialAudioToggle = () => {
    if (spatialAudioActive) {
      stopSpatialAudio();
      setSpatialAudioActive(false);
    } else {
      startSpatialAudio();
      setSpatialAudioActive(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className="w-full">
        <div className="flex items-center justify-center gap-6 mb-2">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Shuffle className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <SkipBack className="w-6 h-6" />
          </button>
          <button className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform">
            <Play className="w-6 h-6 fill-current" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <SkipForward className="w-6 h-6" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Repeat className="w-5 h-5" />
          </button>
        </div>
        <Slider
          value={[sliderPosition]}
          min={0}
          max={trackDuration}
          step={0.1}
          onValueChange={handleSliderChange}
          onValueCommit={handleSliderCommit}
          className="my-3"
          disabled={isPlaying}
        />
        {isPlaying && (
          <div className="text-xs text-yellow-500 mt-1 text-center">
            You must pause to seek
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(sliderPosition)}</span>
          <span>{formatTime(trackDuration)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => broadcastPlay(sliderPosition)}
          variant={isPlaying ? "secondary" : "default"}
          disabled={!selectedAudioId}
          size="sm"
          className="flex-1 min-w-[80px]"
        >
          {isPlaying ? (
            <RefreshCw className="h-4 w-4 mr-1" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          {isPlaying ? "Resync" : "Play"}
        </Button>
        <Button
          onClick={broadcastPause}
          variant="outline"
          disabled={!isPlaying || !selectedAudioId}
          size="sm"
          className="flex-1 min-w-[80px]"
        >
          <Pause className="h-4 w-4 mr-1" />
          Pause
        </Button>
        <Button
          onClick={handleSpatialAudioToggle}
          variant="outline"
          size="sm"
          className="flex-1 min-w-[140px] mt-2 sm:mt-0"
        >
          {spatialAudioActive ? (
            <>
              <StopCircleIcon className="h-4 w-4 mr-1" />
              Stop Spatial
            </>
          ) : (
            <>
              <RocketIcon className="h-4 w-4 mr-1" />
              Start Spatial
            </>
          )}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Especially on mobile devices, syncing is unstable. If you experience
        issues, try pressing <span className="font-semibold">Resync</span> a few
        times
      </div>
    </div>
  );
};