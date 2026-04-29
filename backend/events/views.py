"""
Views for the Music Track Vote service.

Endpoints:
  GET    /api/events/<room_id>/tracks/                 — ranked track list
  POST   /api/events/<room_id>/tracks/                 — suggest a track
  POST   /api/events/<room_id>/tracks/<track_id>/vote/ — vote for a track
  DELETE /api/events/<room_id>/tracks/<track_id>/       — remove a track (owner only)
"""

from django.db import transaction, IntegrityError
from django.db.models import F, Window, Exists, OuterRef
from django.db.models.functions import RowNumber
from django.shortcuts import get_object_or_404
from api.playback import get_or_create_playback_state
from rest_framework import serializers, status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.settings import api_settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_spectacular.utils import extend_schema, OpenApiResponse


from api.license_utils import check_license
from api.logging_utils import log_action
from api.models import Room

from .models import Track, Vote
from .serializers import TrackSerializer, TrackCreateSerializer, VoteResponseSerializer


# ── Helpers ──────────────────────────────────────────────────────────────────

def _is_premium_user(user):
    if getattr(user, 'role', None) in ('STAFF', 'ADMIN'):
        return True
    profile = getattr(user, 'profile', None)
    return bool(profile and getattr(profile, 'is_premium', False))


def _require_premium(user):
    if _is_premium_user(user):
        return True, ''
    return False, 'Voting is a premium feature. Upgrade to vote or suggest tracks.'


# def _get_vote_room(room_id):
#     room = get_object_or_404(Room, pk=room_id)
#     if room.room_type != 'vote':
#         return None, Response(
#             {'detail': 'This room is not a vote-type room.'},
#             status=status.HTTP_400_BAD_REQUEST,
#         )
#     return room, None

def _get_vote_room(room_id):
    room = get_object_or_404(Room, pk=room_id)
    
    return room, None

def _broadcast(room_id, event_type, extra=None):
    """
    Broadcast an event to all WebSocket clients in a vote room.
    Best-effort — no crash if the channel layer is unavailable.
    """
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            tracks_qs = Track.objects.filter(
                room_id=room_id,
                is_played=False,
            ).select_related('suggested_by')
            tracks_data = TrackSerializer(tracks_qs, many=True).data
            message = {'type': event_type, 'tracks': tracks_data}
            if extra:
                message.update(extra)
            async_to_sync(channel_layer.group_send)(f'vote_{room_id}', message)
    except Exception:
        pass


# ── Views ────────────────────────────────────────────────────────────────────

class TrackListCreateView(generics.GenericAPIView):
    """
    GET  — List tracks in a vote room, ordered by vote count (descending).
           Deterministic ordering: vote_count DESC → created_at DESC → id DESC.
    POST — Suggest a new track in a vote room.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    

    @extend_schema(
        tags=['Events – Track Vote'],
        operation_id='events_tracks_list',
        responses={200: TrackSerializer(many=True)},
    )
    def get(self, request, room_id):
        room, err = _get_vote_room(room_id)
        if err:
            return err

        # Read access: check basic room visibility
        allowed, reason = check_license(request.user, room)
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        tracks = Track.objects.filter(room=room, is_played=False).annotate(
            _rank=Window(
                expression=RowNumber(),
                order_by=[F('vote_count').desc(), F('created_at').desc(), F('id').desc()]
            ),
            _has_voted=Exists(
                Vote.objects.filter(track=OuterRef('pk'), user=request.user)
            )
        ).select_related('suggested_by')
    
        page = self.paginate_queryset(tracks)
        if page is not None:
             serializer = TrackSerializer(page, many=True, context={'request': request})
             return self.get_paginated_response(serializer.data)
             
        return Response(TrackSerializer(tracks, many=True, context={'request': request}).data)

    @extend_schema(
        tags=['Events – Track Vote'],
        operation_id='events_tracks_create',
        request=TrackCreateSerializer,
        responses={201: TrackSerializer},
    )
    def post(self, request, room_id):
        room, err = _get_vote_room(room_id)
        if err:
            return err

        allowed, reason = _require_premium(request.user)
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        user_lat = request.data.get('lat')
        user_lon = request.data.get('lon')
        allowed, reason = check_license(
            request.user, room,
            user_lat=float(user_lat) if user_lat else None,
            user_lon=float(user_lon) if user_lon else None,
        )
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        serializer = TrackCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            track = Track.objects.create(
                room=room,
                deezer_id=serializer.validated_data['deezerId'],
                title=serializer.validated_data['title'],
                artist=serializer.validated_data['artist'],
                album=serializer.validated_data.get('album', ''),
                album_art=serializer.validated_data.get('albumArt', ''),
                duration=serializer.validated_data.get('duration', 0),
                audio_url=serializer.validated_data.get('audioUrl', ''),
                suggested_by=request.user,
            )

            # ── ADD THIS BLOCK ──────────────────────────────────────────
            from api.playback import get_or_create_playback_state, start_room_playback
            from api.playback_broadcast import (
                serialize_playback_state,
                broadcast_playback_state,
            )

            state = get_or_create_playback_state(room)

            # start playback automatically if nothing is currently playing
            if not state.current_track and track.audio_url:
                state = start_room_playback(room)
                playback_payload = serialize_playback_state(state)
                broadcast_playback_state(room.id, playback_payload)
            # ────────────────────────────────────────────────────────────

        except IntegrityError:
            return Response(
                {'detail': 'This track already exists in this room.'},
                status=status.HTTP_409_CONFLICT,
            )

        log_action(request, 'track_suggested', f'Track id={track.id} in room {room_id}')

        _broadcast(room_id, 'track.added')

        return Response(
            TrackSerializer(track, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

class TrackVoteView(APIView):
    """
    POST — Vote for a track.

    Concurrency guarantees:
      1. select_for_update() locks the Track row for the duration of the tx
      2. F('vote_count') + 1 ensures atomic increment (no read-modify-write)
      3. Vote.unique_together acts as a DB-level safety net against double votes
      4. IntegrityError catch prevents crashes if the unique constraint fires
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
   

    @extend_schema(
        tags=['Events – Track Vote'],
        operation_id='events_tracks_vote',
        request=None,
        responses={
            200: VoteResponseSerializer,
            400: OpenApiResponse(description='Already voted or invalid track'),
        },
    )
    def post(self, request, room_id, track_id):
        room, err = _get_vote_room(room_id)
        if err:
            return err

        allowed, reason = _require_premium(request.user)
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        # License check — enforced at vote time per the spec
        user_lat = request.data.get('lat')
        user_lon = request.data.get('lon')
        allowed, reason = check_license(
            request.user, room,
            user_lat=float(user_lat) if user_lat else None,
            user_lon=float(user_lon) if user_lon else None,
        )
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        # ── Atomic vote with row-level locking ──────────────────────────
        try:
            with transaction.atomic():
                # 1. Try to create vote (DB enforces uniqueness)
                Vote.objects.create(
                    track_id=track_id,
                    user=request.user,
                    room=room
                )

                # 2. Atomic increment (no lock)
                updated = Track.objects.filter(
                    pk=track_id,
                    room=room
                ).update(vote_count=F('vote_count') + 1)

                if updated == 0:
                    transaction.set_rollback(True)
                    return Response(
                        {'detail': 'Track not found in this room.'},
                        status=status.HTTP_404_NOT_FOUND,
                    )

        except IntegrityError:
            return Response(
                {'detail': 'You have already voted for this track.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
    
        # Fetch updated track (single query, no refresh)
        track = get_object_or_404(Track, pk=track_id)
    
        log_action(request, 'track_voted', f'Track id={track_id} in room {room_id}')
    
        _broadcast(room_id, 'vote.update')
    
        return Response({
            'detail': 'Vote recorded.',
            'track': TrackSerializer(track, context={'request': request}).data,
        })


class TrackDeleteView(APIView):
    """
    DELETE — Remove a track from the vote room.
    Only the room owner or the user who suggested the track can delete it.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        tags=['Events – Track Vote'],
        operation_id='events_tracks_delete',
        responses={204: OpenApiResponse(description='Track deleted')},
    )
    def delete(self, request, room_id, track_id):
        room, err = _get_vote_room(room_id)
        if err:
            return err

        track = get_object_or_404(Track, pk=track_id, room=room)

        # Only room owner or the track's suggester can delete
        if request.user != room.owner and request.user != track.suggested_by:
            return Response(
                {'detail': 'Only the room owner or the track suggester can delete this track.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        track.delete()
        log_action(request, 'track_deleted', f'Track id={track_id} in room {room_id}')

        # Broadcast removal to all connected clients
        _broadcast(room_id, 'track.removed')

        return Response(status=status.HTTP_204_NO_CONTENT)
