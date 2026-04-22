from rest_framework.permissions import BasePermission
from django.conf import settings


class IsSuperUser(BasePermission):
    """Only Django superusers (is_superuser=True) can access."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsStaffRoleUser(BasePermission):
    """Users with role STAFF or ADMIN, or superusers."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ('STAFF', 'ADMIN') or request.user.is_superuser


class IsChatService(BasePermission):
    """
    Internal service-to-service authentication.
    The caller must send:  Authorization: Bearer <CHAT_SERVICE_TOKEN>
    """

    def has_permission(self, request, view):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return False
        token = auth_header.removeprefix('Bearer ').strip()
        return token == settings.CHAT_SERVICE_TOKEN


class IsPaymentService(BasePermission):
    """
    Internal service-to-service authentication for the payment service.
    The caller must send:  Authorization: Bearer <PAYMENT_SERVICE_TOKEN>
    """

    def has_permission(self, request, view):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return False
        token = auth_header.removeprefix('Bearer ').strip()
        return token == settings.PAYMENT_SERVICE_TOKEN


class IsRoomOwner(BasePermission):
    """Object-level permission — only the Room owner can modify the room."""

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user


class IsRoomMember(BasePermission):
    """
    Object-level permission — user must be the owner or an accepted member
    of the room to access it.
    """

    def has_object_permission(self, request, view, obj):
        if obj.owner == request.user:
            return True
        return obj.memberships.filter(user=request.user, status='accepted').exists()
