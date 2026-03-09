"""
Room management views
  - CRUD for rooms
  - Invite users to private rooms
  - Accept / decline invitations
  - List members, kick members
  - List public rooms / my rooms
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import CustomUser, Room, RoomMembership, RoomVisibility, RoomMembershipStatus, RoomLicenseType
from .serializers import (
    RoomSerializer,
    RoomCreateSerializer,
    RoomMembershipSerializer,
    InviteToRoomSerializer,
    RoomMembershipActionSerializer,
)
from .logging_utils import log_action


def _user_can_access_room(user, room):
    """Returns True if the user is allowed to see/join this room."""
    if room.visibility == RoomVisibility.PUBLIC:
        return True
    # Private room: must be the owner or an accepted/pending member
    if room.owner == user:
        return True
    return room.memberships.filter(user=user).exclude(status='kicked').exists()


def _user_can_act_in_room(user, room):
    """
    Returns True if the user is allowed to perform actions (vote, edit, etc.)
    according to the room's license_type.
    Geo-restriction is checked client-side by sending coordinates; we trust
    the client here for the time being and only verify the time window.
    """
    if not room.is_open():
        return False

    if room.license_type == RoomLicenseType.DEFAULT:
        # For public rooms anyone can act; for private rooms must be a member
        if room.visibility == RoomVisibility.PUBLIC:
            return True
        return room.memberships.filter(user=user, status='accepted').exists() or room.owner == user

    if room.license_type == RoomLicenseType.INVITED:
        return room.memberships.filter(user=user, status='accepted').exists() or room.owner == user

    if room.license_type == RoomLicenseType.LOCATION:
        # Time window is enforced by is_open(); geo-enforcement is done client-side
        return True

    return False


class RoomListCreateView(APIView):
    """
    GET  /api/rooms/          — list all public rooms + rooms where user is owner/member
    POST /api/rooms/          — create a new room
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        room_type = request.query_params.get('type')  # optional filter by room_type
        qs = Room.objects.filter(
            Q(visibility=RoomVisibility.PUBLIC) |
            Q(owner=request.user) |
            Q(memberships__user=request.user, memberships__status='accepted')
        ).distinct().select_related('owner')

        if room_type:
            qs = qs.filter(room_type=room_type)

        serializer = RoomSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = RoomCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        room = serializer.save(owner=request.user)
        log_action(request, 'room_created', f'Room id={room.id} name={room.name}')
        return Response(RoomSerializer(room, context={'request': request}).data, status=status.HTTP_201_CREATED)


class RoomDetailView(APIView):
    """
    GET    /api/rooms/<pk>/  — room details
    PATCH  /api/rooms/<pk>/  — update room (owner only)
    DELETE /api/rooms/<pk>/  — delete room (owner only)
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def _get_room(self, pk):
        return get_object_or_404(Room, pk=pk)

    def get(self, request, pk):
        room = self._get_room(pk)
        if not _user_can_access_room(request.user, room):
            return Response({'detail': 'You do not have access to this room.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(RoomSerializer(room, context={'request': request}).data)

    def patch(self, request, pk):
        room = self._get_room(pk)
        if room.owner != request.user:
            return Response({'detail': 'Only the room owner can update this room.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = RoomSerializer(room, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(request, 'room_updated', f'Room id={pk}')
        return Response(RoomSerializer(room, context={'request': request}).data)

    def delete(self, request, pk):
        room = self._get_room(pk)
        if room.owner != request.user:
            return Response({'detail': 'Only the room owner can delete this room.'}, status=status.HTTP_403_FORBIDDEN)
        room.delete()
        log_action(request, 'room_deleted', f'Room id={pk}')
        return Response(status=status.HTTP_204_NO_CONTENT)


class RoomMembersView(APIView):
    """
    GET  /api/rooms/<pk>/members/  — list members (owner only)
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, pk):
        room = get_object_or_404(Room, pk=pk)
        if not _user_can_access_room(request.user, room):
            return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        memberships = room.memberships.select_related('user__profile', 'invited_by')
        return Response(RoomMembershipSerializer(memberships, many=True).data)


class InviteToRoomView(APIView):
    """POST /api/rooms/<pk>/invite/ — owner invites a user."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, pk):
        room = get_object_or_404(Room, pk=pk)
        if room.owner != request.user:
            return Response({'detail': 'Only the room owner can invite users.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = InviteToRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data['user_id']
        user = get_object_or_404(CustomUser, pk=user_id)

        if user == request.user:
            return Response({'detail': 'You are already the owner.'}, status=status.HTTP_400_BAD_REQUEST)

        membership, created = RoomMembership.objects.get_or_create(
            room=room, user=user,
            defaults={'invited_by': request.user, 'status': RoomMembershipStatus.PENDING}
        )
        if not created and membership.status == RoomMembershipStatus.KICKED:
            return Response({'detail': 'This user was kicked from the room.'}, status=status.HTTP_400_BAD_REQUEST)
        if not created:
            return Response({'detail': 'User is already a member or has a pending invitation.'},
                            status=status.HTTP_400_BAD_REQUEST)

        log_action(request, 'room_invite_sent', f'Room id={pk} to user {user_id}')
        return Response(RoomMembershipSerializer(membership).data, status=status.HTTP_201_CREATED)


class RoomInvitationResponseView(APIView):
    """PATCH /api/rooms/<pk>/invitation/ — invited user accepts or declines."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def patch(self, request, pk):
        membership = get_object_or_404(
            RoomMembership, room_id=pk, user=request.user, status=RoomMembershipStatus.PENDING
        )
        serializer = RoomMembershipActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']

        if action == 'accept':
            membership.status = RoomMembershipStatus.ACCEPTED
        else:
            membership.status = RoomMembershipStatus.DECLINED

        membership.save(update_fields=['status', 'updated_at'])
        log_action(request, f'room_invitation_{action}d', f'Room id={pk}')
        return Response(RoomMembershipSerializer(membership).data)


class KickMemberView(APIView):
    """DELETE /api/rooms/<pk>/members/<user_id>/ — owner kicks a member."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def delete(self, request, pk, user_id):
        room = get_object_or_404(Room, pk=pk)
        if room.owner != request.user:
            return Response({'detail': 'Only the room owner can kick members.'}, status=status.HTTP_403_FORBIDDEN)

        membership = get_object_or_404(RoomMembership, room=room, user_id=user_id)
        membership.status = RoomMembershipStatus.KICKED
        membership.save(update_fields=['status', 'updated_at'])
        log_action(request, 'room_member_kicked', f'Room id={pk} user {user_id}')
        return Response({'detail': 'User kicked from room.'})


class LeaveRoomView(APIView):
    """DELETE /api/rooms/<pk>/leave/ — member leaves a room voluntarily."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def delete(self, request, pk):
        room = get_object_or_404(Room, pk=pk)
        if room.owner == request.user:
            return Response({'detail': 'Room owner cannot leave. Delete the room instead.'},
                            status=status.HTTP_400_BAD_REQUEST)
        membership = get_object_or_404(RoomMembership, room=room, user=request.user)
        membership.delete()
        log_action(request, 'room_left', f'Room id={pk}')
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyRoomsView(APIView):
    """GET /api/rooms/mine/ — rooms created by the current user."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        rooms = Room.objects.filter(owner=request.user).select_related('owner')
        room_type = request.query_params.get('type')
        if room_type:
            rooms = rooms.filter(room_type=room_type)
        return Response(RoomSerializer(rooms, many=True, context={'request': request}).data)


class MyInvitationsView(APIView):
    """GET /api/rooms/invitations/ — pending invitations for the current user."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        memberships = RoomMembership.objects.filter(
            user=request.user, status=RoomMembershipStatus.PENDING
        ).select_related('room__owner', 'invited_by')
        return Response(RoomMembershipSerializer(memberships, many=True).data)
