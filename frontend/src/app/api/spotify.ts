const SPOTIFY_CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID";
const SPOTIFY_REDIRECT_URI = "musicroom://spotify-callback";

export type SpotifyTrackResult = {
  id: string;
  name: string;
  artists: { name: string }[];
  album?: {
    name?: string;
    images?: { url: string }[];
  };
  duration_ms?: number;
  preview_url?: string | null;
  external_urls?: {
    spotify?: string;
  };
};

export function mapSpotifyTrackToSuggestion(track: SpotifyTrackResult) {
  return {
    trackId: track.id,
    title: track.name,
    artist: track.artists?.map((a) => a.name).join(", ") || "",
    album: track.album?.name || "",
    albumArt: track.album?.images?.[0]?.url || "",
    duration: Math.floor((track.duration_ms || 0) / 1000),
    audioUrl: track.preview_url || "",
    spotifyUrl: track.external_urls?.spotify || "",
  };
}

export async function searchSpotifyTracks(accessToken: string, query: string) {
  if (!query.trim()) return [];

  const url =
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}` +
    `&type=track&limit=20`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Spotify search failed");
  }

  const data = await response.json();
  return data?.tracks?.items || [];
}
