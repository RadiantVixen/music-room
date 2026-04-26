from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from api.models import Room
from api.models_playback import RoomPlaybackState, PlaybackStatus
from events.models import Track

def get_track_playback_duration_ms(track):
    if not track:
        return 0

    # Deezer preview playback
    if track.audio_url:
        return 30 * 1000

    return (track.duration or 0) * 1000

def get_or_create_playback_state(room):
    state, _ = RoomPlaybackState.objects.get_or_create(room=room)
    return state

def get_vote_next_track(room, current_track=None):
    qs = Track.objects.filter(room=room, is_played=False)

    if current_track:
        qs = qs.exclude(id=current_track.id)

    return qs.order_by("-vote_count", "-created_at", "-id").first()

def get_delegation_next_track(room, current_track=None):
    qs = Track.objects.filter(room=room).order_by("created_at", "id")

    if not current_track:
        return qs.first()

    next_track = qs.filter(created_at__gt=current_track.created_at).first()
    if next_track:
        return next_track

    return None

def pick_next_track(room, current_track=None):
    if room.room_type == "vote":
        return get_vote_next_track(room, current_track=current_track)
    if room.room_type == "delegation":
        return get_delegation_next_track(room, current_track=current_track)
    return None

def get_elapsed_ms(state):
    if state.status != PlaybackStatus.PLAYING or not state.started_at:
        return state.position_ms
    delta = timezone.now() - state.started_at
    return state.position_ms + int(delta.total_seconds() * 1000)

def start_room_playback(room):
    with transaction.atomic():
        state, _ = RoomPlaybackState.objects.get_or_create(room=room)
        state = RoomPlaybackState.objects.select_for_update().get(pk=state.pk)

        if not state.current_track:
            state.current_track = pick_next_track(room)

        if not state.current_track:
            state.status = PlaybackStatus.STOPPED
            state.started_at = None
            state.paused_at = None
            state.position_ms = 0
            state.save(update_fields=["current_track", "status", "started_at", "paused_at", "position_ms", "updated_at"])
            return state

        state.status = PlaybackStatus.PLAYING
        state.started_at = timezone.now()
        state.paused_at = None
        state.position_ms = 0
        state.save(update_fields=["current_track", "status", "started_at", "paused_at", "position_ms", "updated_at"])
        return state

def pause_room_playback(room):
    with transaction.atomic():
        state = RoomPlaybackState.objects.select_for_update().get(room=room)
        if state.status != PlaybackStatus.PLAYING:
            return state

        state.position_ms = get_elapsed_ms(state)
        state.status = PlaybackStatus.PAUSED
        state.paused_at = timezone.now()
        state.started_at = None
        state.save(update_fields=["position_ms", "status", "paused_at", "started_at", "updated_at"])
        return state

def resume_room_playback(room):
    with transaction.atomic():
        state = RoomPlaybackState.objects.select_for_update().get(room=room)
        if not state.current_track:
            state.current_track = pick_next_track(room)

        if not state.current_track:
            state.status = PlaybackStatus.STOPPED
            state.position_ms = 0
            state.started_at = None
            state.save(update_fields=["current_track", "status", "position_ms", "started_at", "updated_at"])
            return state

        state.status = PlaybackStatus.PLAYING
        state.started_at = timezone.now()
        state.paused_at = None
        state.save(update_fields=["status", "started_at", "paused_at", "updated_at"])
        return state

def skip_room_track(room):
    with transaction.atomic():
        state = RoomPlaybackState.objects.select_for_update().get(room=room)
        current_track = state.current_track

        if room.room_type == "vote" and current_track:
            current_track.is_played = True
            current_track.save(update_fields=["is_played"])

        next_track = pick_next_track(room, current_track=current_track)

        state.current_track = next_track
        if next_track:
            state.status = PlaybackStatus.PLAYING
            state.started_at = timezone.now()
            state.paused_at = None
            state.position_ms = 0
        else:
            state.status = PlaybackStatus.STOPPED
            state.started_at = None
            state.paused_at = None
            state.position_ms = 0

        state.save(update_fields=[
            "current_track",
            "status",
            "started_at",
            "paused_at",
            "position_ms",
            "updated_at",
        ])
        return state