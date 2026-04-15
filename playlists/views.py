"""
Views for the Music Playlist Editor service.

Endpoints:
  GET    /api/playlists/<room_id>/tracks/                       — ordered track list + version
  POST   /api/playlists/<room_id>/tracks/                       — add a track
  DELETE /api/playlists/<room_id>/tracks/<track_id>/             — remove a track
  PATCH  /api/playlists/<room_id>/tracks/<track_id>/move/        — move a track

Consistency Model: Strict Server Ordering
─────────────────────────────────────────
Every mutation:
  1. Opens ``transaction.atomic()``
  2. Locks ALL tracks in the room via ``select_for_update()``
  3. This serialises ALL concurrent edits — even on different tracks
  4. Increments the room's ``version`` counter
  5. Broadcasts the full playlist state via WebSocket

Conflict handling:
  - Two users adding simultaneously: both succeed — positions never collide
  - Two users moving the same track: second move sees result of first
  - Move while delete: returns 409 Conflict (not 404)
  - Two users deleting the same track: second delete returns 404
"""

from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_spectacular.utils import extend_schema, OpenApiResponse

from api.license_utils import check_license
from api.logging_utils import log_action
from api.models import Room

from .models import PlaylistTrack, PlaylistVersion
from .serializers import (
    PlaylistTrackSerializer,
    PlaylistTrackCreateSerializer,
    MoveTrackSerializer,
)


def _get_playlist_room(room_id):
    """Fetch a room and verify it is a playlist-type room."""
    room = get_object_or_404(Room, pk=room_id)
    if room.room_type != 'playlist':
        return None, Response(
            {'detail': 'This room is not a playlist-type room.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return room, None


def _get_version(room):
    """Get or create the version counter for a playlist room."""
    pv, _ = PlaylistVersion.objects.get_or_create(room=room)
    return pv.version


def _lock_playlist(room):
    """
    Acquire an exclusive row-level lock on the PlaylistVersion row.
    This is the single serialisation point for ALL concurrent playlist
    mutations.  Unlike locking PlaylistTrack rows (which can be empty),
    this row is guaranteed to exist via get_or_create.
    Must be called inside ``transaction.atomic()``.
    """
    pv, _ = PlaylistVersion.objects.get_or_create(room=room)
    PlaylistVersion.objects.select_for_update().get(room=room)


def _bump_version(room):
    """Atomically increment the version counter. Returns the new version."""
    PlaylistVersion.objects.filter(room=room).update(version=F('version') + 1)
    pv = PlaylistVersion.objects.get(room=room)
    return pv.version


def _broadcast_playlist(room_id, room):
    """Best-effort WebSocket broadcast of the full playlist state + version."""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            tracks = PlaylistTrack.objects.filter(room_id=room_id).select_related('added_by')
            data = PlaylistTrackSerializer(tracks, many=True).data
            version = _get_version(room)
            async_to_sync(channel_layer.group_send)(
                f'playlist_{room_id}',
                {'type': 'playlist.update', 'tracks': data, 'version': version},
            )
    except Exception:
        pass


class PlaylistTrackListCreateView(APIView):
    """
    GET  — Ordered track list for a playlist room (includes version).
    POST — Add a new track at the end of the playlist.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        tags=['Playlists'],
        operation_id='playlists_tracks_list',
        responses={200: PlaylistTrackSerializer(many=True)},
    )
    def get(self, request, room_id):
        room, err = _get_playlist_room(room_id)
        if err:
            return err

        allowed, reason = check_license(request.user, room)
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        tracks = PlaylistTrack.objects.filter(room=room).select_related('added_by')
        version = _get_version(room)
        return Response({
            'version': version,
            'tracks': PlaylistTrackSerializer(tracks, many=True).data,
        })

    @extend_schema(
        tags=['Playlists'],
        operation_id='playlists_tracks_create',
        request=PlaylistTrackCreateSerializer,
        responses={201: PlaylistTrackSerializer},
    )
    def post(self, request, room_id):
        room, err = _get_playlist_room(room_id)
        if err:
            return err

        user_lat = request.data.get('lat')
        user_lon = request.data.get('lon')
        allowed, reason = check_license(
            request.user, room,
            user_lat=float(user_lat) if user_lat else None,
            user_lon=float(user_lon) if user_lon else None,
        )
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        serializer = PlaylistTrackCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Lock the playlist version row — serialises ALL concurrent mutations
            _lock_playlist(room)

            # Calculate next position (append to end)
            last = (
                PlaylistTrack.objects
                .filter(room=room)
                .order_by('-position')
                .first()
            )
            next_pos = (last.position + 1) if last else 0

            track = PlaylistTrack.objects.create(
                room=room,
                title=serializer.validated_data['title'],
                artist=serializer.validated_data['artist'],
                external_url=serializer.validated_data.get('external_url', ''),
                added_by=request.user,
                position=next_pos,
            )
            version = _bump_version(room)

        log_action(request, 'playlist_track_added', f'Track id={track.id} at pos {next_pos} in room {room_id}')
        _broadcast_playlist(room_id, room)
        return Response(PlaylistTrackSerializer(track).data, status=status.HTTP_201_CREATED)


class PlaylistTrackDeleteView(APIView):
    """DELETE — Remove a track from the playlist and re-compact positions."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        tags=['Playlists'],
        operation_id='playlists_tracks_delete',
        responses={204: OpenApiResponse(description='Track removed')},
    )
    def delete(self, request, room_id, track_id):
        room, err = _get_playlist_room(room_id)
        if err:
            return err

        allowed, reason = check_license(request.user, room)
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            # Lock the playlist version row
            _lock_playlist(room)

            track = get_object_or_404(PlaylistTrack, pk=track_id, room=room)
            removed_pos = track.position
            track.delete()

            # Shift positions of all tracks after the removed one
            PlaylistTrack.objects.filter(
                room=room, position__gt=removed_pos,
            ).update(position=F('position') - 1)

            _bump_version(room)

        log_action(request, 'playlist_track_removed', f'Track id={track_id} from room {room_id}')
        _broadcast_playlist(room_id, room)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlaylistTrackMoveView(APIView):
    """
    PATCH — Move a track to a new position.

    Conflict handling:
      - If the track was deleted by another user during the move,
        returns 409 Conflict (not 404) to signal the race condition.
      - Uses sentinel position pattern to avoid unique constraint violations.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        tags=['Playlists'],
        operation_id='playlists_tracks_move',
        request=MoveTrackSerializer,
        responses={200: PlaylistTrackSerializer},
    )
    def patch(self, request, room_id, track_id):
        room, err = _get_playlist_room(room_id)
        if err:
            return err

        allowed, reason = check_license(request.user, room)
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        serializer = MoveTrackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_pos = serializer.validated_data['new_position']

        with transaction.atomic():
            # Lock the playlist version row — serialises concurrent moves
            _lock_playlist(room)

            # Try to get the track — if deleted during the move, return 409
            try:
                track = PlaylistTrack.objects.get(pk=track_id, room=room)
            except PlaylistTrack.DoesNotExist:
                return Response(
                    {'detail': 'Track was deleted by another user (conflict).'},
                    status=status.HTTP_409_CONFLICT,
                )

            old_pos = track.position

            # Clamp new_pos to valid range
            max_pos = PlaylistTrack.objects.filter(room=room).count() - 1
            new_pos = min(new_pos, max_pos)

            if old_pos == new_pos:
                return Response(PlaylistTrackSerializer(track).data)

            # Temporarily set to a sentinel to avoid unique constraint violation
            track.position = max_pos + 1000
            track.save(update_fields=['position'])

            if old_pos < new_pos:
                # Moving down: shift tracks between (old, new] up by 1
                affected = list(
                    PlaylistTrack.objects
                    .filter(room=room, position__gt=old_pos, position__lte=new_pos)
                    .order_by('position')
                    .values_list('pk', flat=True)
                )
                for pk in affected:
                    PlaylistTrack.objects.filter(pk=pk).update(position=F('position') - 1)
            else:
                # Moving up: shift tracks between [new, old) down by 1
                affected = list(
                    PlaylistTrack.objects
                    .filter(room=room, position__gte=new_pos, position__lt=old_pos)
                    .order_by('-position')
                    .values_list('pk', flat=True)
                )
                for pk in affected:
                    PlaylistTrack.objects.filter(pk=pk).update(position=F('position') + 1)

            track.position = new_pos
            track.save(update_fields=['position', 'updated_at'])
            version = _bump_version(room)

        log_action(request, 'playlist_track_moved', f'Track id={track_id} {old_pos}→{new_pos} in room {room_id}')
        _broadcast_playlist(room_id, room)
        return Response(PlaylistTrackSerializer(track).data)
