import requests

def search_deezer_tracks(query: str, limit: int = 10):
    """
    Searches Deezer for tracks. 
    Deezer is amazing because it DOES NOT require an access token for public searches!
    """
    response = requests.get(
        "https://api.deezer.com/search",
        params={
            "q": query,
            "limit": min(limit, 10),
        },
        timeout=15,
    )

    response.raise_for_status()
    
    # Deezer returns tracks inside a 'data' array
    items = response.json().get("data", [])

    return [
        {
            "deezerId": str(track.get("id", "")),
            "title": track.get("title", ""),
            "artist": track.get("artist", {}).get("name", ""),
            "album": track.get("album", {}).get("title", ""),
            # cover_xl gives high-quality album art
            "albumArt": track.get("album", {}).get("cover_xl", ""),
            "duration": int(track.get("duration", 0)),
            # 'preview' is Deezer's guaranteed 30-second mp3 snippet!
            "audioUrl": track.get("preview", ""),
            "deezerUrl": track.get("link", ""),
        }
        for track in items
    ]