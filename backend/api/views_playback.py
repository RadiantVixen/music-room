from api.playback_broadcast import serialize_playback_state
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404

from api.models import Room
from api.playback import (
    get_or_create_playback_state,
    start_room_playback,
    pause_room_playback,
    resume_room_playback,
    skip_room_track,
)
from api.playback_broadcast import broadcast_playback_state, serialize_playback_state

class RoomPlaybackStateView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        state = get_or_create_playback_state(room)
        return Response(serialize_playback_state(state))

class RoomPlaybackPlayView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        state = start_room_playback(room)
        payload = serialize_playback_state(state)
        broadcast_playback_state(room.id, payload)
        return Response(payload)

class RoomPlaybackPauseView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        state = pause_room_playback(room)
        payload = serialize_playback_state(state)
        broadcast_playback_state(room.id, payload)
        return Response(payload)

class RoomPlaybackResumeView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        state = resume_room_playback(room)
        payload = serialize_playback_state(state)
        broadcast_playback_state(room.id, payload)
        return Response(payload)

class RoomPlaybackSkipView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        state = skip_room_track(room)
        payload = serialize_playback_state(state)
        broadcast_playback_state(room.id, payload)
        return Response(payload)