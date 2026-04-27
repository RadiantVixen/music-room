import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PremiumStatus = {
  id: number | null;
  plan_type: "free" | "premium";
  is_active: boolean;
  is_premium: boolean;
  started_at: string | null;
  expires_at: string | null;
};

export type Playlist = {
  id: number;
  name: string;
  description: string;
  cover_url: string | null;
  is_collaborative: boolean;
  owner_username: string;
  owner_id: number;
  track_count: number;
  tracks?: PlaylistTrack[];
  collaborators?: PlaylistCollaborator[];
  created_at: string;
  updated_at: string;
};

export type PlaylistTrack = {
  id: number;
  deezer_id: string;
  title: string;
  artist: string;
  album: string;
  album_art: string | null;
  duration: number | null;
  audio_url: string | null;
  position: number;
  added_by_username: string | null;
  added_at: string;
};

export type PlaylistCollaborator = {
  id: number;
  user_id: number;
  username: string;
  added_at: string;
};

// ─── Subscription ─────────────────────────────────────────────────────────────

export const getPremiumStatus = async (): Promise<PremiumStatus> => {
  const res = await api.get("/premium/status/");
  return res.data;
};

export const activatePremium = async (): Promise<PremiumStatus> => {
  const res = await api.post("/premium/activate/");
  return res.data;
};

export const deactivatePremium = async (): Promise<void> => {
  await api.post("/premium/deactivate/");
};

// ─── Playlists ────────────────────────────────────────────────────────────────

export const getPlaylists = async (): Promise<Playlist[]> => {
  const res = await api.get("/premium/playlists/");
  return res.data?.results ?? res.data;
};

export const getPlaylistDetail = async (id: number): Promise<Playlist> => {
  const res = await api.get(`/premium/playlists/${id}/`);
  return res.data;
};

export const createPlaylist = async (data: {
  name: string;
  description?: string;
  cover_url?: string;
  is_collaborative?: boolean;
}): Promise<Playlist> => {
  const res = await api.post("/premium/playlists/", data);
  return res.data;
};

export const updatePlaylist = async (
  id: number,
  data: Partial<{ name: string; description: string; cover_url: string; is_collaborative: boolean }>
): Promise<Playlist> => {
  const res = await api.patch(`/premium/playlists/${id}/`, data);
  return res.data;
};

export const deletePlaylist = async (id: number): Promise<void> => {
  await api.delete(`/premium/playlists/${id}/`);
};

// ─── Tracks ───────────────────────────────────────────────────────────────────

export const getPlaylistTracks = async (playlistId: number): Promise<PlaylistTrack[]> => {
  const res = await api.get(`/premium/playlists/${playlistId}/tracks/`);
  return res.data;
};

export const addTrackToPlaylist = async (
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
): Promise<PlaylistTrack> => {
  const res = await api.post(`/premium/playlists/${playlistId}/tracks/`, track);
  return res.data;
};

export const removeTrackFromPlaylist = async (
  playlistId: number,
  trackId: number
): Promise<void> => {
  await api.delete(`/premium/playlists/${playlistId}/tracks/${trackId}/`);
};

export const reorderTrack = async (
  playlistId: number,
  trackId: number,
  position: number
): Promise<Playlist> => {
  const res = await api.patch(`/premium/playlists/${playlistId}/tracks/${trackId}/`, { position });
  return res.data;
};

// ─── Collaborators ────────────────────────────────────────────────────────────

export const getCollaborators = async (playlistId: number): Promise<PlaylistCollaborator[]> => {
  const res = await api.get(`/premium/playlists/${playlistId}/collaborators/`);
  return res.data;
};

export const addCollaborator = async (
  playlistId: number,
  userId: number
): Promise<PlaylistCollaborator> => {
  const res = await api.post(`/premium/playlists/${playlistId}/collaborators/`, { user_id: userId });
  return res.data;
};

export const removeCollaborator = async (
  playlistId: number,
  collabId: number
): Promise<void> => {
  console.log(`[API] DELETE /premium/playlists/${playlistId}/collaborators/${collabId}/`);
  await api.delete(`/premium/playlists/${playlistId}/collaborators/${collabId}/`);
};
