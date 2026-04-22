"""
Friend system views
  - Send / cancel friend requests
  - Accept / decline / block requests
  - List friends, pending requests, blocked users
  - Remove a friend
  - Search users by username / email
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .friends_schema import *

from .models import CustomUser, FriendRequest, FriendRequestStatus, ActionLog
from .serializers import (
    FriendRequestSerializer,
    SendFriendRequestSerializer,
    FriendRequestActionSerializer,
    PublicUserSerializer,
)
from .logging_utils import log_action

@send_request_schema
class SendFriendRequestView(APIView):
    """POST /api/friends/request/ — send a friend request to another user."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        serializer = SendFriendRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        receiver_id = serializer.validated_data['receiver_id']

        if receiver_id == request.user.id:
            return Response({'detail': 'You cannot send a friend request to yourself.'},
                            status=status.HTTP_400_BAD_REQUEST)

        receiver = get_object_or_404(CustomUser, pk=receiver_id)

        # Check for existing requests in either direction
        existing = FriendRequest.objects.filter(
            Q(sender=request.user, receiver=receiver) |
            Q(sender=receiver, receiver=request.user)
        ).first()

        if existing:
            if existing.status == FriendRequestStatus.ACCEPTED:
                return Response({'detail': 'You are already friends.'}, status=status.HTTP_400_BAD_REQUEST)
            if existing.status == FriendRequestStatus.BLOCKED:
                return Response({'detail': 'Cannot send request to/from a blocked user.'},
                                status=status.HTTP_400_BAD_REQUEST)
            if existing.status == FriendRequestStatus.PENDING:
                return Response({'detail': 'A friend request already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            # Declined — allow re-sending (reset to pending)
            existing.status = FriendRequestStatus.PENDING
            existing.sender = request.user
            existing.receiver = receiver
            existing.save(update_fields=['status', 'sender', 'receiver', 'updated_at'])
            log_action(request, 'friend_request_sent', f'To user {receiver_id}')
            return Response(FriendRequestSerializer(existing).data, status=status.HTTP_200_OK)

        fr = FriendRequest.objects.create(sender=request.user, receiver=receiver)
        log_action(request, 'friend_request_sent', f'To user {receiver_id}')
        return Response(FriendRequestSerializer(fr).data, status=status.HTTP_201_CREATED)

@respond_request_schema
class FriendRequestDetailView(APIView):
    """
    GET    /api/friends/request/<pk>/  — get request detail
    PATCH  /api/friends/request/<pk>/  — accept / decline / block
    DELETE /api/friends/request/<pk>/  — cancel (sender only)
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def _get_request(self, pk, user):
        return get_object_or_404(
            FriendRequest,
            Q(sender=user) | Q(receiver=user),
            pk=pk
        )

    def get(self, request, pk):
        fr = self._get_request(pk, request.user)
        return Response(FriendRequestSerializer(fr).data)

    def patch(self, request, pk):
        """Receiver accepts / declines / blocks; sender can only cancel via DELETE."""
        fr = get_object_or_404(FriendRequest, pk=pk, receiver=request.user)
        serializer = FriendRequestActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']

        status_map = {
            'accept': FriendRequestStatus.ACCEPTED,
            'decline': FriendRequestStatus.DECLINED,
            'block': FriendRequestStatus.BLOCKED,
        }
        fr.status = status_map[action]
        fr.save(update_fields=['status', 'updated_at'])
        log_action(request, f'friend_request_{action}d', f'Request id={pk}')
        return Response(FriendRequestSerializer(fr).data)

    def delete(self, request, pk):
        """Sender cancels a pending request."""
        fr = get_object_or_404(FriendRequest, pk=pk, sender=request.user, status=FriendRequestStatus.PENDING)
        fr.delete()
        log_action(request, 'friend_request_cancelled', f'Request id={pk}')
        return Response(status=status.HTTP_204_NO_CONTENT)

@friends_list_schema
class FriendListView(APIView):
    """GET /api/friends/ — list all accepted friends."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        accepted_requests = FriendRequest.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user),
            status=FriendRequestStatus.ACCEPTED,
        ).select_related('sender__profile', 'receiver__profile')

        friends = []
        for fr in accepted_requests:
            friend = fr.receiver if fr.sender == request.user else fr.sender
            friends.append(friend)

        serializer = PublicUserSerializer(friends, many=True, context={'request': request})
        return Response(serializer.data)

@pending_requests_schema
class PendingFriendRequestsView(APIView):
    """GET /api/friends/requests/pending/ — incoming pending requests."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        pending = FriendRequest.objects.filter(
            receiver=request.user,
            status=FriendRequestStatus.PENDING,
        ).select_related('sender__profile')
        return Response(FriendRequestSerializer(pending, many=True).data)

@sent_requests_schema
class SentFriendRequestsView(APIView):
    """GET /api/friends/requests/sent/ — requests sent by the current user."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        sent = FriendRequest.objects.filter(
            sender=request.user,
            status=FriendRequestStatus.PENDING,
        ).select_related('receiver__profile')
        return Response(FriendRequestSerializer(sent, many=True).data)

@remove_friend_schema
class RemoveFriendView(APIView):
    """DELETE /api/friends/<user_id>/ — remove a friend (unfriend)."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def delete(self, request, user_id):
        fr = FriendRequest.objects.filter(
            Q(sender=request.user, receiver_id=user_id) |
            Q(sender_id=user_id, receiver=request.user),
            status=FriendRequestStatus.ACCEPTED,
        ).first()

        if not fr:
            return Response({'detail': 'Friend relationship not found.'}, status=status.HTTP_404_NOT_FOUND)

        fr.delete()
        log_action(request, 'friend_removed', f'Removed user {user_id}')
        return Response(status=status.HTTP_204_NO_CONTENT)

@search_users_schema
class UserSearchView(APIView):
    """
    GET /api/users/search/?q=<query>
    Searches users by username, first_name or email (case-insensitive).
    Returns public profile info only.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < 2:
            return Response({'detail': 'Query must be at least 2 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        users = CustomUser.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(email__icontains=query)
        ).exclude(pk=request.user.pk).select_related('profile')[:20]

        serializer = PublicUserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)
