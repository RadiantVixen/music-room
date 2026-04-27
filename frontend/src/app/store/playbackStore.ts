import { create } from "zustand";

export type Track = {
  id?: string | number;
  deezerId?: string;
  title: string;
  artist: string;
  albumArt?: string;
  audioUrl?: string;
  duration?: number;
};

type PlaybackState = {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentIndex: number;

  setQueue: (tracks: Track[], startIndex?: number) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  stop: () => void;
};

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  currentIndex: -1,

  setQueue: (tracks, startIndex = 0) => {
    const validTracks = tracks.filter(t => !!t.audioUrl);
    if (validTracks.length === 0) return;
    
    set({
      queue: validTracks,
      currentIndex: startIndex,
      currentTrack: validTracks[startIndex],
      isPlaying: true,
    });
  },

  playTrack: (track) => {
    if (!track.audioUrl) return;
    set({
      currentTrack: track,
      isPlaying: true,
      queue: [track],
      currentIndex: 0,
    });
  },

  togglePlay: () => {
    if (!get().currentTrack) return;
    set({ isPlaying: !get().isPlaying });
  },

  nextTrack: () => {
    const { queue, currentIndex } = get();
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      set({
        currentIndex: nextIndex,
        currentTrack: queue[nextIndex],
        isPlaying: true,
      });
    }
  },

  previousTrack: () => {
    const { queue, currentIndex } = get();
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      set({
        currentIndex: prevIndex,
        currentTrack: queue[prevIndex],
        isPlaying: true,
      });
    }
  },

  stop: () => {
    set({
      currentTrack: null,
      queue: [],
      isPlaying: false,
      currentIndex: -1,
    });
  },
}));
