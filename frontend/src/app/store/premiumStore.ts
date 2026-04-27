import {
  savePlaylistsCache,
  getPlaylistsCache,
  saveSyncQueue,
  getSyncQueue,
  type OfflineAction,
  downloadTrackFile,
  removeDownloadedTrack,
  getLocalTrackUri,
  saveDownloadProgress,
  getDownloadProgress,
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
  toggleDownload: (track: PlaylistTrack) => Promise<boolean | undefined>;
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
    const dlProgress = await getDownloadProgress();
    console.log(`[initializeOffline] Loaded download progress:`, dlProgress);
    set({ playlists: cached, offlineQueue: queue, downloadProgress: dlProgress });

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
        if (action.type === "remove_track" || action.type === "REMOVE_TRACK") {
          await apiRemoveTrackFromPlaylist(action.playlistId!, action.data!.trackId);
        } else if (action.type === "reorder_track" || action.type === "REORDER_TRACK") {
          await apiReorderTrack(action.playlistId!, action.data!.trackId, action.data!.position);
        } else if (action.type === "add_track" || action.type === "ADD_TRACK") {
          await apiAddTrackToPlaylist(action.playlistId!, action.data!);
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
    console.log(`[fetchPlaylistDetail] START id=${id}`);
    set({ playlistsLoading: true });
    try {
      const playlist = await apiGetPlaylistDetail(id);
      console.log(`[fetchPlaylistDetail] Got playlist:`, playlist?.name);
      console.log(`[fetchPlaylistDetail] Tracks from API:`, playlist?.tracks?.map((t: any) => `${t.title}:pos${t.position}`));
      set({ selectedPlaylist: playlist });
      console.log(`[fetchPlaylistDetail] selectedPlaylist tracks:`, get().selectedPlaylist?.tracks?.map((t: any) => `${t.title}:pos${t.position}`));
    } catch (e) {
      console.error("[fetchPlaylistDetail] Error:", e);
    } finally {
      set({ playlistsLoading: false });
    }
  },

  checkLocalTracks: async (tracks) => {
    console.log(`[checkLocalTracks] START with ${tracks.length} tracks`);
    console.log(`[checkLocalTracks] positions before:`, tracks.map(t => t.position));
    
    // Just log and return tracks as-is - don't modify order
    const withPositions = tracks.map((t, i) => ({ ...t, position: i }));
    console.log(`[checkLocalTracks] positions after:`, withPositions.map(t => t.position));
    
    set({ selectedPlaylist: { ...get().selectedPlaylist!, tracks: withPositions } });
  },

  toggleDownload: async (track) => {
    const trackId = track.deezer_id || track.id;
    console.log(`===== TOGGLE DOWNLOAD START =====`);
    console.log(`trackId=${trackId}`);
    console.log(`track.audio_url=`, track.audio_url);
    const { downloadProgress, isOnline } = get();

    if (!isOnline) {
      console.log(`[toggleDownload] OFFLINE - cannot download`);
      return false;
    }

    if (downloadProgress[trackId] === 1) {
      console.log(`Already downloaded, removing...`);
      await removeDownloadedTrack(trackId);
      downloadProgress[trackId] = 0;
      set({ downloadProgress: { ...downloadProgress } });
      await saveDownloadProgress(downloadProgress);
      console.log(`[Offline] Removed track ${trackId}`);
    } else {
      const audioUrl = track.audio_url;
      console.log(`audioUrl value: "${audioUrl}"`);
      
      if (!audioUrl) {
        console.error(`NO AUDIO URL - cannot download`);
        return false;
      }
      
      console.log(`Starting download from ${audioUrl}...`);
      downloadProgress[trackId] = 0.1;
      set({ downloadProgress: { ...downloadProgress } });

      try {
        const localUri = await downloadTrackFile(trackId, audioUrl);
        console.log(`Download result:`, localUri);
        
        if (localUri) {
          downloadProgress[trackId] = 1;
          set({ downloadProgress: { ...downloadProgress } });
          await saveDownloadProgress(downloadProgress);
          
          const selected = get().selectedPlaylist;
          if (selected) {
            const updatedTracks = selected.tracks?.map(t => 
              (t.deezer_id || t.id) === trackId ? { ...t, audio_url: localUri } : t
            );
            set({ selectedPlaylist: { ...selected, tracks: updatedTracks } });
          }
          console.log(`SUCCESS: downloaded to ${localUri}`);
          return true;
        } else {
          downloadProgress[trackId] = 0;
          set({ downloadProgress: { ...downloadProgress } });
          await saveDownloadProgress(downloadProgress);
          console.error(`Download returned null`);
          return false;
        }
      } catch (err) {
        console.error(`EXCEPTION:`, err);
        downloadProgress[trackId] = 0;
        set({ downloadProgress: { ...downloadProgress } });
        await saveDownloadProgress(downloadProgress);
        return false;
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
        type: "remove_track",
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
    const { isOnline, isPremium, offlineQueue, selectedPlaylist } = get();
    
    console.log(`[reorderTrack] START playlistId=${playlistId}, trackId=${trackId}, newPos=${position}`);
    console.log(`[reorderTrack] isOnline=${isOnline}, isPremium=${isPremium}`);
    
    // Get current tracks and reorder locally first - ALWAYS do this
    const tracks = [...(selectedPlaylist?.tracks ?? [])];
    const idx = tracks.findIndex(t => t.id === trackId);
    console.log(`[reorderTrack] Found track at idx=${idx}`);
    
    if (idx > -1) {
      const [moved] = tracks.splice(idx, 1);
      tracks.splice(position, 0, moved);
      const reorderedTracks = tracks.map((t, i) => ({ ...t, position: i }));
      set({ selectedPlaylist: { ...selectedPlaylist!, tracks: reorderedTracks } });
      console.log(`[reorderTrack] Local reordered:`, reorderedTracks.map(t => `${t.title}:p${t.position}`));
    }

    // Offline: queue action
    if (!isOnline && isPremium) {
      console.log(`[reorderTrack] Queuing for offline`);
      const action: OfflineAction = {
        id: Math.random().toString(36).substr(2, 9),
        type: "reorder_track",
        playlistId,
        data: { trackId, position },
        timestamp: Date.now(),
      };
      set({ offlineQueue: [...offlineQueue, action] });
      await saveSyncQueue([...offlineQueue, action]);
      return;
    }

    // Online: sync to server
    if (isOnline) {
      console.log(`[reorderTrack] Calling API...`);
      try {
        const updatedPlaylist = await apiReorderTrack(playlistId, trackId, position);
        console.log(`[reorderTrack] API success:`, updatedPlaylist?.tracks?.map(t => `${t.title}:p${t.position}`));
        // Use returned data directly
        if (updatedPlaylist?.tracks) {
          set({ selectedPlaylist: updatedPlaylist });
        }
      } catch (e) {
        console.error("[reorderTrack] API Error:", e);
      }
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
