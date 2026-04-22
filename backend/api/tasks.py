# api/tasks.py
from celery import shared_task
from django.utils import timezone

from api.models import Room
from api.models_playback import RoomPlaybackState, PlaybackStatus
from api.playback import get_elapsed_ms, skip_room_track
from api.playback_broadcast import broadcast_playback_state, serialize_playback_state
from api.playback import get_elapsed_ms, skip_room_track, get_track_playback_duration_ms


@shared_task
def advance_active_rooms():
    states = (
        RoomPlaybackState.objects
        .select_related("room", "current_track")
        .filter(status=PlaybackStatus.PLAYING, current_track__isnull=False)
    )

    for state in states:
        duration_ms = get_track_playback_duration_ms(state.current_track)

        if duration_ms <= 0:
            continue

        elapsed_ms = get_elapsed_ms(state)
        if elapsed_ms >= duration_ms:
            new_state = skip_room_track(state.room)
            payload = serialize_playback_state(new_state)
            broadcast_playback_state(state.room_id, payload)