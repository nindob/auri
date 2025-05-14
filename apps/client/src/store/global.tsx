import { LocalAudioSource } from "@/lib/localTypes";
import {
  NTPMeasurement,
  _sendNTPRequest,
  calculateOffsetEstimate,
  calculateWaitTimeMilliseconds,
} from "@/utils/ntp";
import { ClientActionEnum, WSMessage } from "@auri/shared";
import { create } from "zustand";

const MAX_NTP_MEASUREMENTS = 50;

// https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch02.html

interface StaticAudioSource {
  name: string;
  url: string;
}

interface AudioPlayerState {
  audioContext: AudioContext;
  sourceNode: AudioBufferSourceNode;
  gainNode: GainNode;
}

enum AudioPlayerError {
  NotInitialized = "NOT_INITIALIZED",
}

interface GlobalState {
  // Audio Sources
  audioSources: LocalAudioSource[];
  isLoadingAudio: boolean;
  selectedSourceIndex: number;
  setAudioSources: (sources: LocalAudioSource[]) => void;
  addAudioSource: (source: LocalAudioSource) => void;
  setIsLoadingAudio: (isLoading: boolean) => void;
  setSelectedSourceIndex: (index: number) => void;
  schedulePlay: (data: {
    trackTimeSeconds: number;
    targetServerTime: number;
  }) => void;
  schedulePause: (data: { targetServerTime: number }) => void;

  // Websocket
  socket: WebSocket | null; // Use WebSocket.readyState read-only property returns the current state of the WebSocket connection
  setSocket: (socket: WebSocket) => void;
  // Commands to broadcast
  // trackTimeSeconds is the number of seconds into the track to play at (ie. location of the slider)
  broadcastPlay: (trackTimeSeconds?: number) => void;
  broadcastPause: () => void;

  // NTP
  sendNTPRequest: () => void;
  ntpMeasurements: NTPMeasurement[];
  addNTPMeasurement: (measurement: NTPMeasurement) => void;
  offsetEstimate: number;
  roundTripEstimate: number;

  // Audio Player
  audioPlayer: AudioPlayerState | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playAudio: (data: { offset: number; when: number }) => void; // time in seconds
  pauseAudio: (data: { when: number }) => void;
  // reset: () => void;
  // seekTo: (time: number) => void;
  // setVolume: (volume: number) => void; // Set volume out of 1
}

// Audio sources
const STATIC_AUDIO_SOURCES: StaticAudioSource[] = [
  { name: "4EVA - Ordley", url: "/4EVA.mp3" },
  { name: "Love for You - loveli lori & ovg!", url: "/love for you.mp3" },
  { name: "New Patek - Lil Uzi Vert", url: "/New Patek.mp3" },
];

const getAudioPlayer = (state: GlobalState) => {
  if (!state.audioPlayer) {
    throw new Error(AudioPlayerError.NotInitialized);
  }
  return state.audioPlayer;
};

const getSocket = (state: GlobalState) => {
  if (!state.socket) {
    throw new Error("Socket not initialized");
  }
  return {
    socket: state.socket,
  };
};

const getWaitTimeSeconds = (state: GlobalState, targetServerTime: number) => {
  const { offsetEstimate } = state;
  return calculateWaitTimeMilliseconds(targetServerTime, offsetEstimate) / 1000;
};

export const initializeAudioSources = async (
  audioContext: AudioContext
): Promise<Array<LocalAudioSource>> => {
  // Get the ArrayBuffers for each source
  return Promise.all(
    STATIC_AUDIO_SOURCES.map(async (source) => {
      const response = await fetch(source.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return {
        name: source.name,
        audioBuffer,
      };
    })
  );
};

// Web audio API
const initializeAudioContext = () => {
  const audioContext = new AudioContext();
  return audioContext;
};

export const useGlobalStore = create<GlobalState>((set, get) => {
  // Load audio sources if we're in the browser
  if (typeof window !== "undefined") {
    const initializeAudio = async () => {
      const audioContext = initializeAudioContext();
      const sources = await initializeAudioSources(audioContext);
      console.log(`Loaded initial audio sources ${sources.length}`);

      // Create master gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.5; // Default volume
      gainNode.connect(audioContext.destination);
      const sourceNode = audioContext.createBufferSource();

      // Decode initial first audio source
      sourceNode.buffer = sources[0].audioBuffer;
      sourceNode.connect(gainNode);
      gainNode.connect(audioContext.destination);
      console.log("Initialized audio context in state:", audioContext.state);

      set({
        audioSources: sources,
        isLoadingAudio: false,
        audioPlayer: {
          audioContext,
          sourceNode,
          gainNode,
        },
      });
    };

    initializeAudio();
  }

  return {
    // Audio Sources
    audioSources: [],
    isLoadingAudio: true,
    selectedSourceIndex: 0,
    setAudioSources: (sources) => set({ audioSources: sources }),
    addAudioSource: (source: LocalAudioSource) =>
      set((state) => ({
        audioSources: [...state.audioSources, source],
      })),
    setIsLoadingAudio: (isLoading) => set({ isLoadingAudio: isLoading }),
    setSelectedSourceIndex: (index) => {
      set({ selectedSourceIndex: index });
    },
    schedulePlay: ({
      trackTimeSeconds,
      targetServerTime,
    }: {
      trackTimeSeconds: number;
      targetServerTime: number;
    }) => {
      const state = get();
      const waitTimeSeconds = getWaitTimeSeconds(state, targetServerTime);
      console.log(
        `Playing track at ${trackTimeSeconds} seconds in ${waitTimeSeconds}`
      );

      state.playAudio({
        offset: trackTimeSeconds,
        when: waitTimeSeconds,
      });
    },
    schedulePause: ({ targetServerTime }: { targetServerTime: number }) => {
      const state = get();
      const waitTimeSeconds = getWaitTimeSeconds(state, targetServerTime);
      console.log(`Pausing track in ${waitTimeSeconds}`);

      state.pauseAudio({
        when: waitTimeSeconds,
      });
    },

    // Websocket
    socket: null,
    setSocket: (socket) => set({ socket }),

    // Commands to broadcast
    broadcastPlay: (trackTimeSeconds?: number) => {
      const state = get();
      const { socket } = getSocket(state);
      const { audioContext } = getAudioPlayer(state);

      const message: WSMessage = {
        type: ClientActionEnum.enum.PLAY,
        trackTimeSeconds: trackTimeSeconds || audioContext.currentTime,
        trackIndex: state.selectedSourceIndex,
      };

      socket.send(JSON.stringify(message));
    },

    broadcastPause: () => {
      const state = get();
      const { socket } = getSocket(state);

      const message: WSMessage = {
        type: ClientActionEnum.enum.PAUSE,
      };

      socket.send(JSON.stringify(message));
    },

    // NTP
    sendNTPRequest: () => {
      const state = get();
      if (state.ntpMeasurements.length >= MAX_NTP_MEASUREMENTS) {
        const { averageOffset, averageRoundTrip } = calculateOffsetEstimate(
          state.ntpMeasurements
        );
        set({
          offsetEstimate: averageOffset,
          roundTripEstimate: averageRoundTrip,
        });
        return;
      }

      // Otherwise not done, keep sending
      const { socket } = getSocket(state);

      // Send the first one
      _sendNTPRequest(socket);
    },

    // NTP
    ntpMeasurements: [],
    addNTPMeasurement: (measurement) =>
      set((state) => ({
        ntpMeasurements: [...state.ntpMeasurements, measurement],
      })),
    offsetEstimate: 0,
    roundTripEstimate: 0,

    // Audio Player
    audioPlayer: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.5,

    // Play the current source
    playAudio: async ({ offset, when }: { offset: number; when: number }) => {
      const state = get();
      const { sourceNode, audioContext, gainNode } = getAudioPlayer(state);

      // Stop any existing source node before creating a new one
      try {
        sourceNode.stop();
        // If node hasn't been started stop will throw an error
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {}

      const startTime = audioContext.currentTime + when;

      // Create a new source node
      const newSourceNode = audioContext.createBufferSource();
      newSourceNode.buffer =
        state.audioSources[state.selectedSourceIndex].audioBuffer;
      newSourceNode.connect(gainNode);
      newSourceNode.start(startTime, offset);
      console.log("Started playback");

      // Update the state with the new source node
      set((state) => ({
        ...state,
        audioPlayer: {
          ...state.audioPlayer!,
          sourceNode: newSourceNode,
        },
      }));
    },

    // Pause playback
    pauseAudio: ({ when }: { when: number }) => {
      const state = get();
      const { sourceNode } = getAudioPlayer(state);

      sourceNode.stop(when);
    },
  };
});