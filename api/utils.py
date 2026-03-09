"""
Utility views / helper functions for internal service calls and
convenience endpoints used by other micro-services (chat, payment…).
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import CustomUser, Profile, ChatAccess
from .permissions import IsChatService, IsPaymentService


# ─── Chat service helpers ─────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsChatService])
def grant_chat_access(request):
    """
    Called by the chat micro-service to grant / update chat access for a user.

    Body:
        user_id     : int
        max_price   : decimal
        expires_at  : ISO-8601 datetime
    """
    user_id = request.data.get('user_id')
    max_price = request.data.get('max_price')
    expires_at = request.data.get('expires_at')

    if not all([user_id, max_price, expires_at]):
        return Response({'error': 'user_id, max_price and expires_at are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = get_object_or_404(CustomUser, pk=user_id)

    chat_access, _ = ChatAccess.objects.update_or_create(
        user=user,
        defaults={
            'enabled': True,
            'max_price': max_price,
            'expires_at': expires_at,
        }
    )
    return Response({
        'user_id': user.id,
        'enabled': chat_access.enabled,
        'max_price': str(chat_access.max_price),
        'expires_at': chat_access.expires_at,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsChatService])
def get_chat_access(request):
    """
    Returns the current chat access status for a user.
    Query param: ?user_id=<id>
    """
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({'error': 'user_id query param is required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = get_object_or_404(CustomUser, pk=user_id)
    try:
        chat_access = user.chat_access
        expired = chat_access.expires_at < timezone.now()
        return Response({
            'user_id': user.id,
            'enabled': chat_access.enabled and not expired,
            'max_price': str(chat_access.max_price),
            'expires_at': chat_access.expires_at,
            'expired': expired,
        })
    except ChatAccess.DoesNotExist:
        return Response({'user_id': user.id, 'enabled': False})


# ─── Payment / subscription helpers ──────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsPaymentService])
def get_my_subscription(request):
    """
    Returns subscription info for the authenticated user.
    Query param: ?user_id=<id>
    """
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({'error': 'user_id query param is required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = get_object_or_404(CustomUser, pk=user_id)
    return Response({
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
    })


# ─── Generic user-info endpoints (used by other services) ────────────────────

@api_view(['GET'])
@permission_classes([IsChatService | IsPaymentService])
def get_user_info(request):
    """
    Minimal user info for internal service consumption.
    Query param: ?user_id=<id>
    """
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({'error': 'user_id query param is required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = get_object_or_404(CustomUser, pk=user_id)
    return Response({
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'first_name': user.first_name,
        'role': user.role,
    })


@api_view(['GET'])
@permission_classes([IsChatService | IsPaymentService])
def get_owner_phone(request):
    """
    Returns the owner's phone number for internal use.
    Query param: ?user_id=<id>
    """
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({'error': 'user_id query param is required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = get_object_or_404(CustomUser, pk=user_id)
    try:
        phone = user.profile.phone
    except Profile.DoesNotExist:
        phone = None
    return Response({'user_id': user.id, 'phone': phone})
