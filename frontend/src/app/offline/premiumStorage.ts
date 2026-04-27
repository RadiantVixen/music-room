import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { Playlist } from "../api/premium";

const PLAYLISTS_CACHE_KEY = "@premium_playlists_cache";
const SYNC_QUEUE_KEY = "@premium_sync_queue";

export type OfflineAction = {
  id: string;
  type: "create_playlist" | "update_playlist" | "delete_playlist" | "add_track" | "remove_track" | "reorder_track" | "ADD_TRACK" | "REMOVE_TRACK" | "REORDER_TRACK";
  playlistId?: number;
  data?: any;
  payload?: any;
  timestamp: number;
};

let documentDirectory: string | null = null;
let cacheDirectory: string | null = null;

const initFileSystem = async () => {
  try {
    const fs = await import("expo-file-system/legacy");
    documentDirectory = fs.documentDirectory;
    cacheDirectory = fs.cacheDirectory;
    console.log(`[downloadStorage] Inited: docDir=${documentDirectory}, cacheDir=${cacheDirectory}, platform=${Platform.OS}`);
  } catch (err) {
    console.error("[downloadStorage] Failed to import expo-file-system:", err);
  }
};

const isWeb = Platform.OS === "web" || typeof window !== "undefined";

initFileSystem();

const getDownloadsDir = (): string => {
  console.log(`[getDownloadsDir] docDir=${documentDirectory}, cacheDir=${cacheDirectory}, platform=${Platform.OS}`);
  
  if (isWeb || !documentDirectory) {
    const fallback = cacheDirectory;
    console.log(`[getDownloadsDir] Using fallback: ${fallback}`);
    return fallback ? `${fallback}music_downloads/` : "";
  }
  
  return `${documentDirectory}music_downloads/`;
};

export const ensureDownloadsDir = async (): Promise<boolean> => {
  const downloadsDir = getDownloadsDir();
  
  if (!downloadsDir) {
    console.log("[ensureDownloadsDir] No dir available");
    return false;
  }
  
  try {
    const fs = await import("expo-file-system/legacy");
    const dirInfo = await fs.getInfoAsync(downloadsDir);
    console.log(`[ensureDownloadsDir] dirInfo:`, dirInfo);
    if (!dirInfo.exists) {
      await fs.makeDirectoryAsync(downloadsDir, { intermediates: true });
    }
    return true;
  } catch (err) {
    console.error("[ensureDownloadsDir] error:", err);
    return false;
  }
};

export const downloadTrackFile = async (id: string | number, url: string): Promise<string | null> => {
  console.log(`[downloadTrackFile] START id=${id}, url=${url.substring(0, 80)}...`);
  
  if (isWeb) {
    console.log("[downloadTrackFile] Web - returning mock path");
    return `mock_local_${id}.mp3`;
  }
  
  const downloadsDir = getDownloadsDir();
  
  if (!downloadsDir) {
    console.error("[downloadTrackFile] No downloads directory");
    return null;
  }
  
  try {
    const dirReady = await ensureDownloadsDir();
    if (!dirReady) {
      console.error("[downloadTrackFile] Could not create directory");
      return null;
    }
    
    const fs = await import("expo-file-system/legacy");
    const fileUri = `${downloadsDir}${id}.mp3`;
    console.log(`[downloadTrackFile] Saving to ${fileUri}`);
    
    const downloadRes = await fs.downloadAsync(url, fileUri, { md5: false });
    console.log(`[downloadTrackFile] Result:`, downloadRes);
    
    if (downloadRes.uri) {
      console.log(`[downloadTrackFile] SUCCESS: ${downloadRes.uri}`);
      return downloadRes.uri;
    }
    
    console.error("[downloadTrackFile] No URI in result");
    return null;
  } catch (e: any) {
    console.error("[downloadTrackFile] FAIL:", e.message || String(e));
    return null;
  }
};

export const getLocalTrackUri = async (id: string | number): Promise<string | null> => {
  const downloadsDir = getDownloadsDir();
  if (!downloadsDir) return null;
  
  try {
    const fs = await import("expo-file-system/legacy");
    const fileUri = `${downloadsDir}${id}.mp3`;
    const info = await fs.getInfoAsync(fileUri);
    return info.exists ? info.uri : null;
  } catch {
    return null;
  }
};

export const removeDownloadedTrack = async (id: string | number) => {
  const downloadsDir = getDownloadsDir();
  if (!downloadsDir) return;
  
  try {
    const fs = await import("expo-file-system/legacy");
    const fileUri = `${downloadsDir}${id}.mp3`;
    await fs.deleteAsync(fileUri, { idempotent: true });
  } catch (err) {
    console.error("[removeDownloadedTrack] error:", err);
  }
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

const DOWNLOAD_PROGRESS_KEY = "@premium_download_progress";

export const saveDownloadProgress = async (progress: Record<string | number, number>) => {
  try {
    await AsyncStorage.setItem(DOWNLOAD_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Error saving download progress", e);
  }
};

export const getDownloadProgress = async (): Promise<Record<string | number, number>> => {
  try {
    const data = await AsyncStorage.getItem(DOWNLOAD_PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};
