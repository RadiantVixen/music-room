from api.playback import get_elapsed_ms

def serialize_playback_state(state):
    track = state.current_track
    return {
        "room_id": state.room_id,
        "status": state.status,
        "position_ms": state.position_ms if state.status != "playing" else get_elapsed_ms(state),
        "started_at": state.started_at.isoformat() if state.started_at else None,
        "current_track": None if not track else {
            "id": str(track.id),
            "title": track.title,
            "artist": track.artist,
            "albumArt": track.album_art,
            "audioUrl": track.audio_url,
            "duration": track.duration,
        },
    }

def broadcast_playback_state(room_id, payload):
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        async_to_sync(channel_layer.group_send)(
            f"room_playback_{room_id}",
            {
                "type": "playback.update",
                "payload": payload,
            },
        )
    except Exception:
        pass