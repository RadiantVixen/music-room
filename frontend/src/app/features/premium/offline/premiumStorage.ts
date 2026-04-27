import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Playlist } from "../api/premium";

const KEY_PLAYLISTS = "@premium/playlists_cache";
const KEY_OFFLINE_QUEUE = "@premium/sync_queue";

export type OfflineAction = {
  id: string;
  type: "ADD_TRACK" | "REMOVE_TRACK" | "REORDER_TRACK" | "UPDATE_SETTINGS";
  playlistId: number;
  data: any;
  timestamp: number;
};

/**
 * Persists the list of playlists for offline viewing.
 */
export const savePlaylistsCache = async (playlists: Playlist[]) => {
  try {
    await AsyncStorage.setItem(KEY_PLAYLISTS, JSON.stringify(playlists));
  } catch (e) {
    console.error("[OfflineStorage] Failed to save playlists cache:", e);
  }
};

/**
 * Retrieves the cached playlists from last session.
 */
export const getPlaylistsCache = async (): Promise<Playlist[]> => {
  try {
    const data = await AsyncStorage.getItem(KEY_PLAYLISTS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("[OfflineStorage] Failed to load playlists cache:", e);
    return [];
  }
};

/**
 * Persists a pending action queue for later synchronization.
 */
export const saveSyncQueue = async (queue: OfflineAction[]) => {
  try {
    await AsyncStorage.setItem(KEY_OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error("[OfflineStorage] Failed to save sync queue:", e);
  }
};

/**
 * Retrieves the pending action queue.
 */
export const getSyncQueue = async (): Promise<OfflineAction[]> => {
  try {
    const data = await AsyncStorage.getItem(KEY_OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("[OfflineStorage] Failed to load sync queue:", e);
    return [];
  }
};
