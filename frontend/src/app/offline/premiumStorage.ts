import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Playlist } from "../api/premium";

const PLAYLISTS_CACHE_KEY = "@premium_playlists_cache";
const SYNC_QUEUE_KEY = "@premium_sync_queue";
const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`;

export type OfflineAction = {
  id: string;
  type: "create_playlist" | "update_playlist" | "delete_playlist" | "add_track" | "remove_track" | "reorder_track";
  payload: any;
  timestamp: number;
};

export const ensureDownloadsDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  }
};

export const downloadTrackFile = async (id: string | number, url: string): Promise<string | null> => {
  try {
    await ensureDownloadsDir();
    const fileUri = `${DOWNLOADS_DIR}${id}.mp3`;
    const downloadRes = await FileSystem.downloadAsync(url, fileUri);
    return downloadRes.uri;
  } catch (e) {
    console.error("Download failed", e);
    return null;
  }
};

export const getLocalTrackUri = async (id: string | number): Promise<string | null> => {
  const fileUri = `${DOWNLOADS_DIR}${id}.mp3`;
  const info = await FileSystem.getInfoAsync(fileUri);
  return info.exists ? info.uri : null;
};

export const removeDownloadedTrack = async (id: string | number) => {
  const fileUri = `${DOWNLOADS_DIR}${id}.mp3`;
  await FileSystem.deleteAsync(fileUri, { idempotent: true });
};

export const savePlaylistsCache = async (playlists: Playlist[]) => {
  try {
    await AsyncStorage.setItem(PLAYLISTS_CACHE_KEY, JSON.stringify(playlists));
  } catch (e) {
    console.error("Error saving playlists cache", e);
  }
};

export const getPlaylistsCache = async (): Promise<Playlist[]> => {
  try {
    const data = await AsyncStorage.getItem(PLAYLISTS_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveSyncQueue = async (queue: OfflineAction[]) => {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Error saving sync queue", e);
  }
};

export const getSyncQueue = async (): Promise<OfflineAction[]> => {
  try {
    const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};
