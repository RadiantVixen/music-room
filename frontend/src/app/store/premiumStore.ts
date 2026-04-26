import { create } from "zustand";
import {
  getPremiumStatus,
  activatePremium,
  deactivatePremium,
  getPlaylists,
  getPlaylistDetail,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderTrack,
  addCollaborator,
  removeCollaborator,
  type PremiumStatus,
  type Playlist,
  type PlaylistTrack,
  type PlaylistCollaborator,
} from "../api/premium";

type PremiumState = {
  // Premium status
  status: PremiumStatus | null;
  isPremium: boolean;
  statusLoading: boolean;

  // Playlists
  playlists: Playlist[];
  selectedPlaylist: Playlist | null;
  playlistsLoading: boolean;

  // Actions — subscription
  fetchPremiumStatus: () => Promise<void>;
  activatePremium: () => Promise<void>;
  deactivatePremium: () => Promise<void>;

  // Actions — playlists
  fetchPlaylists: () => Promise<void>;
  fetchPlaylistDetail: (id: number) => Promise<void>;
  createPlaylist: (data: {
    name: string;
    description?: string;
    cover_url?: string;
    is_collaborative?: boolean;
  }) => Promise<Playlist>;
  updatePlaylist: (
    id: number,
    data: Partial<{ name: string; description: string; cover_url: string; is_collaborative: boolean }>
  ) => Promise<void>;
  deletePlaylist: (id: number) => Promise<void>;
  clearSelectedPlaylist: () => void;

  // Actions — tracks
  addTrack: (
    playlistId: number,
    track: {
      deezer_id: string;
      title: string;
      artist: string;
      album?: string;
      album_art?: string;
      duration?: number;
      audio_url?: string;
    }
  ) => Promise<void>;
  removeTrack: (playlistId: number, trackId: number) => Promise<void>;
  reorderTrack: (playlistId: number, trackId: number, position: number) => Promise<void>;

  // Actions — collaborators
  addCollaborator: (playlistId: number, userId: number) => Promise<void>;
  removeCollaborator: (playlistId: number, userId: number) => Promise<void>;
};

export const usePremiumStore = create<PremiumState>((set, get) => ({
  status: null,
  isPremium: false,
  statusLoading: false,
  playlists: [],
  selectedPlaylist: null,
  playlistsLoading: false,

  fetchPremiumStatus: async () => {
    set({ statusLoading: true });
    try {
      const status = await getPremiumStatus();
      set({ status, isPremium: status.is_premium });
    } finally {
      set({ statusLoading: false });
    }
  },

  activatePremium: async () => {
    const status = await activatePremium();
    set({ status, isPremium: status.is_premium });
  },

  deactivatePremium: async () => {
    await deactivatePremium();
    set({ isPremium: false, status: { ...get().status!, plan_type: "free", is_active: false, is_premium: false } });
  },

  fetchPlaylists: async () => {
    set({ playlistsLoading: true });
    try {
      const playlists = await getPlaylists();
      set({ playlists });
    } finally {
      set({ playlistsLoading: false });
    }
  },

  fetchPlaylistDetail: async (id) => {
    set({ playlistsLoading: true });
    try {
      const playlist = await getPlaylistDetail(id);
      set({ selectedPlaylist: playlist });
    } finally {
      set({ playlistsLoading: false });
    }
  },

  createPlaylist: async (data) => {
    const playlist = await createPlaylist(data);
    set({ playlists: [playlist, ...get().playlists] });
    return playlist;
  },

  updatePlaylist: async (id, data) => {
    const updated = await updatePlaylist(id, data);
    set({
      playlists: get().playlists.map((p) => (p.id === id ? updated : p)),
      selectedPlaylist: get().selectedPlaylist?.id === id ? updated : get().selectedPlaylist,
    });
  },

  deletePlaylist: async (id) => {
    await deletePlaylist(id);
    set({
      playlists: get().playlists.filter((p) => p.id !== id),
      selectedPlaylist: get().selectedPlaylist?.id === id ? null : get().selectedPlaylist,
    });
  },

  clearSelectedPlaylist: () => set({ selectedPlaylist: null }),

  addTrack: async (playlistId, track) => {
    const newTrack = await addTrackToPlaylist(playlistId, track);
    const selected = get().selectedPlaylist;
    if (selected?.id === playlistId) {
      set({
        selectedPlaylist: {
          ...selected,
          tracks: [...(selected.tracks ?? []), newTrack],
          track_count: (selected.track_count ?? 0) + 1,
        },
      });
    }
  },

  removeTrack: async (playlistId, trackId) => {
    await removeTrackFromPlaylist(playlistId, trackId);
    const selected = get().selectedPlaylist;
    if (selected?.id === playlistId) {
      set({
        selectedPlaylist: {
          ...selected,
          tracks: (selected.tracks ?? []).filter((t) => t.id !== trackId),
          track_count: Math.max(0, (selected.track_count ?? 1) - 1),
        },
      });
    }
  },

  reorderTrack: async (playlistId, trackId, position) => {
    const updated = await reorderTrack(playlistId, trackId, position);
    const selected = get().selectedPlaylist;
    if (selected?.id === playlistId) {
      set({
        selectedPlaylist: {
          ...selected,
          tracks: (selected.tracks ?? [])
            .map((t) => (t.id === trackId ? updated : t))
            .sort((a, b) => a.position - b.position),
        },
      });
    }
  },

  addCollaborator: async (playlistId, userId) => {
    const collab = await addCollaborator(playlistId, userId);
    const selected = get().selectedPlaylist;
    if (selected?.id === playlistId) {
      set({
        selectedPlaylist: {
          ...selected,
          collaborators: [...(selected.collaborators ?? []), collab],
          is_collaborative: true,
        },
      });
    }
  },

  removeCollaborator: async (playlistId, userId) => {
    await removeCollaborator(playlistId, userId);
    const selected = get().selectedPlaylist;
    if (selected?.id === playlistId) {
      set({
        selectedPlaylist: {
          ...selected,
          collaborators: (selected.collaborators ?? []).filter((c) => c.user_id !== userId),
        },
      });
    }
  },
}));
