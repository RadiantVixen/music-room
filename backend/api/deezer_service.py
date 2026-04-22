import requests


def search_deezer_tracks(query: str, limit: int = 10):
    response = requests.get(
        "https://api.deezer.com/search",
        params={
            "q": query,
            "limit": min(limit, 10),
        },
        timeout=15,
    )
    response.raise_for_status()

    items = response.json().get("data", [])
    return [
        {
            "deezerId": str(track.get("id", "")),
            "title": track.get("title", ""),
            "artist": track.get("artist", {}).get("name", ""),
            "album": track.get("album", {}).get("title", ""),
            "albumArt": track.get("album", {}).get("cover_xl", ""),
            "duration": int(track.get("duration", 0)),
            "audioUrl": track.get("preview", ""),
            "deezerUrl": track.get("link", ""),
        }
        for track in items
    ]