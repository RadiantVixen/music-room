import {
  savePlaylistsCache,
  getPlaylistsCache,
  saveSyncQueue,
  getSyncQueue,
  type OfflineAction,
  downloadTrackFile,
  removeDownloadedTrack,
  getLocalTrackUri,
} from "../offline/premiumStorage";
import {
  getPremiumStatus as apiGetPremiumStatus,
  activatePremium as apiActivatePremium,
  deactivatePremium as apiDeactivatePremium,
  getPlaylists as apiGetPlaylists,
  getPlaylistDetail as apiGetPlaylistDetail,
  createPlaylist as apiCreatePlaylist,
  updatePlaylist as apiUpdatePlaylist,
  deletePlaylist as apiDeletePlaylist,
  addTrackToPlaylist as apiAddTrackToPlaylist,
  removeTrackFromPlaylist as apiRemoveTrackFromPlaylist,
  reorderTrack as apiReorderTrack,
  addCollaborator as apiAddCollaborator,
  removeCollaborator as apiRemoveCollaborator,
  type PremiumStatus,
  type Playlist,
  type PlaylistTrack,
  type PlaylistCollaborator,
} from "../api/premium";
import { create } from "zustand";

type PremiumState = {
  // Premium status
  status: PremiumStatus | null;
  isPremium: boolean;
  statusLoading: boolean;

  // Playlists
  playlists: Playlist[];
  selectedPlaylist: Playlist | null;
  playlistsLoading: boolean;
  isOnline: boolean;
  offlineQueue: OfflineAction[];
  downloadProgress: Record<string | number, number>; // trackId -> progress (0-1)

  // Actions — subscription
  fetchPremiumStatus: () => Promise<void>;
  activatePremium: () => Promise<void>;
  deactivatePremium: () => Promise<void>;

  // Actions — playlists
  fetchPlaylists: () => Promise<void>;
  fetchPlaylistDetail: (id: number) => Promise<void>;
  initializeOffline: () => Promise<void>;
  processQueue: () => Promise<void>;
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
  toggleDownload: (track: PlaylistTrack) => Promise<void>;
  checkLocalTracks: (tracks: PlaylistTrack[]) => Promise<void>;

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
  isOnline: typeof window !== "undefined" ? window.navigator.onLine : true,
  offlineQueue: [],
  downloadProgress: {},

  initializeOffline: async () => {
    const cached = await getPlaylistsCache();
    const queue = await getSyncQueue();
    set({ playlists: cached, offlineQueue: queue });

    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        set({ isOnline: true });
        get().processQueue();
      });
      window.addEventListener("offline", () => set({ isOnline: false }));
    }
    
    if (window.navigator.onLine) {
      get().processQueue();
    }
  },

  processQueue: async () => {
    const { offlineQueue, isOnline, isPremium } = get();
    if (!isOnline || !isPremium || offlineQueue.length === 0) return;

    console.log(`[Offline] Processing ${offlineQueue.length} pending actions...`);
    const newQueue = [...offlineQueue];
    
    for (const action of offlineQueue) {
      try {
        if (action.type === "REMOVE_TRACK") {
          await apiRemoveTrackFromPlaylist(action.playlistId, action.data.trackId);
        } else if (action.type === "REORDER_TRACK") {
          await apiReorderTrack(action.playlistId, action.data.trackId, action.data.position);
        } else if (action.type === "ADD_TRACK") {
          await apiAddTrackToPlaylist(action.playlistId, action.data);
        }
        // Remove from queue on success
        const idx = newQueue.findIndex(a => a.id === action.id);
        if (idx > -1) newQueue.splice(idx, 1);
      } catch (e) {
        console.error(`[Offline] Failed to sync action ${action.id}:`, e);
      }
    }

    set({ offlineQueue: newQueue });
    await saveSyncQueue(newQueue);
    // Refresh data after sync
    await get().fetchPlaylists();
  },

  fetchPremiumStatus: async () => {
    set({ statusLoading: true });
    try {
      const status = await apiGetPremiumStatus();
      set({ status, isPremium: status.is_premium });
    } finally {
      set({ statusLoading: false });
    }
  },

  activatePremium: async () => {
    const status = await apiActivatePremium();
    set({ status, isPremium: status.is_premium });
  },

  deactivatePremium: async () => {
    await apiDeactivatePremium();
    set({ isPremium: false, status: { ...get().status!, plan_type: "free", is_active: false, is_premium: false } });
  },

  fetchPlaylists: async () => {
    set({ playlistsLoading: true });
    try {
      const playlists = await apiGetPlaylists();
      set({ playlists });
      await savePlaylistsCache(playlists);
    } catch (error) {
      console.error("[PremiumStore] fetchPlaylists failed:", error);
    } finally {
      set({ playlistsLoading: false });
    }
  },

  fetchPlaylistDetail: async (id) => {
    set({ playlistsLoading: true });
    try {
      const playlist = await apiGetPlaylistDetail(id);
      if (playlist.tracks) {
        await get().checkLocalTracks(playlist.tracks);
      }
      set({ selectedPlaylist: playlist });
    } finally {
      set({ playlistsLoading: false });
    }
  },

  checkLocalTracks: async (tracks) => {
    const progress = { ...get().downloadProgress };
    for (const track of tracks) {
      const localUri = await getLocalTrackUri(track.deezer_id || track.id);
      if (localUri) {
        progress[track.deezer_id || track.id] = 1;
        // Also update track in local state to use local URI
        track.audio_url = localUri;
      }
    }
    set({ downloadProgress: progress });
  },

  toggleDownload: async (track) => {
    const trackId = track.deezer_id || track.id;
    const { downloadProgress } = get();

    if (downloadProgress[trackId] === 1) {
      // Remove download
      await removeDownloadedTrack(trackId);
      set({
        downloadProgress: { ...downloadProgress, [trackId]: 0 },
      });
      console.log(`[Offline] Removed track ${trackId}`);
    } else {
      // Start download
      if (!track.audio_url) return;
      console.log(`[Offline] Downloading track ${trackId}...`);
      set({
        downloadProgress: { ...downloadProgress, [trackId]: 0.1 },
      });

      const localUri = await downloadTrackFile(trackId, track.audio_url);
      if (localUri) {
        set({
          downloadProgress: { ...get().downloadProgress, [trackId]: 1 },
        });
        // Update selected playlist tracks if active
        const selected = get().selectedPlaylist;
        if (selected) {
          const updatedTracks = selected.tracks?.map(t => 
            (t.deezer_id || t.id) === trackId ? { ...t, audio_url: localUri } : t
          );
          set({ selectedPlaylist: { ...selected, tracks: updatedTracks } });
        }
      } else {
        set({
          downloadProgress: { ...get().downloadProgress, [trackId]: 0 },
        });
      }
    }
  },

  createPlaylist: async (data) => {
    const playlist = await apiCreatePlaylist(data);
    set({ playlists: [playlist, ...get().playlists] });
    return playlist;
  },

  updatePlaylist: async (id, data) => {
    const updated = await apiUpdatePlaylist(id, data);
    set({
      playlists: get().playlists.map((p) => (p.id === id ? updated : p)),
      selectedPlaylist: get().selectedPlaylist?.id === id ? updated : get().selectedPlaylist,
    });
  },

  deletePlaylist: async (id) => {
    await apiDeletePlaylist(id);
    set({
      playlists: get().playlists.filter((p) => p.id !== id),
      selectedPlaylist: get().selectedPlaylist?.id === id ? null : get().selectedPlaylist,
    });
  },

  clearSelectedPlaylist: () => set({ selectedPlaylist: null }),

  addTrack: async (playlistId, track) => {
    const newTrack = await apiAddTrackToPlaylist(playlistId, track);
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
    if (!get().isOnline && get().isPremium) {
      const action: OfflineAction = {
        id: Math.random().toString(36).substr(2, 9),
        type: "REMOVE_TRACK",
        playlistId,
        data: { trackId },
        timestamp: Date.now(),
      };
      const newQueue = [...get().offlineQueue, action];
      set({ offlineQueue: newQueue });
      await saveSyncQueue(newQueue);

      // Optimistic UI update
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
      return;
    }

    await apiRemoveTrackFromPlaylist(playlistId, trackId);
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
    if (!get().isOnline && get().isPremium) {
      const action: OfflineAction = {
        id: Math.random().toString(36).substr(2, 9),
        type: "REORDER_TRACK",
        playlistId,
        data: { trackId, position },
        timestamp: Date.now(),
      };
      const newQueue = [...get().offlineQueue, action];
      set({ offlineQueue: newQueue });
      await saveSyncQueue(newQueue);

      // Optimistic UI update
      const selected = get().selectedPlaylist;
      if (selected?.id === playlistId) {
        const tracks = [...(selected.tracks ?? [])];
        const idx = tracks.findIndex(t => t.id === trackId);
        if (idx > -1) {
          const [moved] = tracks.splice(idx, 1);
          tracks.splice(position, 0, { ...moved, position });
          set({
            selectedPlaylist: {
              ...selected,
              tracks: tracks.map((t, i) => ({ ...t, position: i })),
            },
          });
        }
      }
      return;
    }

    const updated = await apiReorderTrack(playlistId, trackId, position);
    const selected = get().selectedPlaylist;
    if (selected?.id === playlistId) {
      // Re-fetch to be safe because backend reordering is complex
      await get().fetchPlaylistDetail(playlistId);
    }
  },

  addCollaborator: async (playlistId, userId) => {
    set({ playlistsLoading: true });
    try {
      await apiAddCollaborator(playlistId, userId);
      await get().fetchPlaylistDetail(playlistId);
    } finally {
      set({ playlistsLoading: false });
    }
  },

  removeCollaborator: async (playlistId, userId) => {
    set({ playlistsLoading: true });
    try {
      await apiRemoveCollaborator(playlistId, userId);
      await get().fetchPlaylistDetail(playlistId);
    } finally {
      set({ playlistsLoading: false });
    }
  },
}));
