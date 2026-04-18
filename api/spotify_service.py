import base64
import requests
from django.conf import settings


SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search"


def get_spotify_access_token():
    client_id = settings.SPOTIFY_CLIENT_ID
    client_secret = settings.SPOTIFY_CLIENT_SECRET

    print("CLIENT_ID repr:", repr(client_id))
    print("CLIENT_SECRET repr:", repr(client_secret))

    credentials = f"{client_id}:{client_secret}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()

    response = requests.post(
        SPOTIFY_TOKEN_URL,
        headers={
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"grant_type": "client_credentials"},
        timeout=15,
    )

    # ← Add this to see exactly what Spotify rejects
    print("Token response status:", response.status_code)
    print("Token response body:", response.text)

    response.raise_for_status()
    return response.json()["access_token"]


def search_spotify_tracks(query: str, limit: int = 10):
    token = get_spotify_access_token()

    response = requests.get(
        "https://api.spotify.com/v1/search",
        headers={"Authorization": f"Bearer {token}"},
        params={
            "q": query,
            "type": "track",
            "limit": min(limit, 10),
            "market": "MA",
        },
        timeout=15,
    )

    print("Spotify search URL:", response.url)
    print("Spotify search status:", response.status_code)
    print("Spotify search body:", response.text)


    response.raise_for_status()

    items = response.json().get("tracks", {}).get("items", [])

    return [
        {
            "spotifyId": track.get("id", ""),
            "title": track.get("name", ""),
            "artist": ", ".join(a["name"] for a in track.get("artists", [])),
            "album": track.get("album", {}).get("name", "") or "",
            "albumArt": ((track.get("album", {}).get("images") or [{}])[0].get("url", "")),
            "duration": int((track.get("duration_ms") or 0) / 1000),
            "audioUrl": track.get("preview_url") or "",
            "spotifyUrl": track.get("external_urls", {}).get("spotify", "") or "",
        }
        for track in items
    ]