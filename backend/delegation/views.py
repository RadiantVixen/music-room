"""
Views for the Music Control Delegation service.

Endpoints:
  GET    /api/delegation/<room_id>/devices/                          — list devices
  POST   /api/delegation/<room_id>/devices/                          — register device
  POST   /api/delegation/<room_id>/devices/<device_id>/delegate/     — delegate control
  POST   /api/delegation/<room_id>/devices/<device_id>/revoke/       — revoke delegation
  GET    /api/delegation/<room_id>/devices/<device_id>/status/       — who has control
  POST   /api/delegation/<room_id>/devices/<device_id>/control/      — send playback action

Conflict Resolution Strategy:
  All mutations use ``select_for_update()`` to lock the device row during
  the transaction, serialising concurrent delegation/control requests.
  This prevents two users from simultaneously delegating to different friends,
  and ensures control actions are validated against the current delegation state.
"""

from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.settings import api_settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_spectacular.utils import extend_schema, OpenApiResponse


from api.license_utils import check_license
from api.logging_utils import log_action
from api.models import Room, CustomUser

from .models import DeviceDelegation, DelegationStatus, ControlAction
from .serializers import (
    DeviceDelegationSerializer,
    RegisterDeviceSerializer,
    DelegateControlSerializer,
    ControlActionSerializer,
    ControlActionResponseSerializer,
)
from api.playback import start_room_playback, pause_room_playback, resume_room_playback, skip_room_track
from api.playback_broadcast import broadcast_playback_state, serialize_playback_state


def _get_delegation_room(room_id):
    """Fetch a room and verify it is a delegation-type room."""
    room = get_object_or_404(Room, pk=room_id)
    if room.room_type != 'delegation':
        return None, Response(
            {'detail': 'This room is not a delegation-type room.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return room, None


def _broadcast_delegation(room_id, event_type, extra=None):
    """Best-effort WebSocket broadcast of delegation changes."""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            message = {
                'type': 'delegation.update',
                'event': event_type,
            }
            if extra:
                message.update(extra)
            async_to_sync(channel_layer.group_send)(
                f'delegation_{room_id}', message,
            )
    except Exception:
        pass


class DeviceListCreateView(generics.GenericAPIView):
    """
    GET  — List all devices in a delegation room.
    POST — Register a new device.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    

    @extend_schema(
        tags=['Delegation'],
        operation_id='delegation_devices_list',
        responses={200: DeviceDelegationSerializer(many=True)},
    )
    def get(self, request, room_id):
        room, err = _get_delegation_room(room_id)
        if err:
            return err

        allowed, reason = check_license(request.user, room)
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        devices = DeviceDelegation.objects.filter(room=room).select_related(
            'owner', 'delegated_to',
        )
        
        page = self.paginate_queryset(devices)
        if page is not None:
             return self.get_paginated_response(DeviceDelegationSerializer(page, many=True).data)
             
        return Response(DeviceDelegationSerializer(devices, many=True).data)

    @extend_schema(
        tags=['Delegation'],
        operation_id='delegation_devices_create',
        request=RegisterDeviceSerializer,
        responses={201: DeviceDelegationSerializer},
    )
    def post(self, request, room_id):
        room, err = _get_delegation_room(room_id)
        if err:
            return err

        allowed, reason = check_license(request.user, room)
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        serializer = RegisterDeviceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        device_id = serializer.validated_data['device_identifier']

        # Check for duplicate device in this room
        if DeviceDelegation.objects.filter(room=room, device_identifier=device_id).exists():
            return Response(
                {'detail': 'This device is already registered in this room.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        device = DeviceDelegation.objects.create(
            room=room,
            owner=request.user,
            device_identifier=device_id,
            device_name=serializer.validated_data['device_name'],
        )

        log_action(request, 'device_registered', f'Device {device_id} in room {room_id}')
        device_data = DeviceDelegationSerializer(device).data
        _broadcast_delegation(room_id, 'device_registered', {'device': device_data})
        return Response(device_data, status=status.HTTP_201_CREATED)


class DelegateControlView(APIView):
    """
    POST — Delegate music control of a device to a friend.

    Uses select_for_update() to prevent two concurrent delegation
    requests from writing simultaneously.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        tags=['Delegation'],
        operation_id='delegation_delegate',
        request=DelegateControlSerializer,
        responses={200: DeviceDelegationSerializer},
    )
    def post(self, request, room_id, device_id):
        room, err = _get_delegation_room(room_id)
        if err:
            return err

        serializer = DelegateControlSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        friend_id = serializer.validated_data['friend_id']

        with transaction.atomic():
            # Lock the device row to prevent concurrent delegation
            device = get_object_or_404(
                DeviceDelegation.objects.select_for_update(),
                pk=device_id, room=room,
            )

            # Only the device owner can delegate
            if device.owner != request.user:
                return Response(
                    {'detail': 'Only the device owner can delegate control.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

            friend = get_object_or_404(CustomUser, pk=friend_id)
            if friend == request.user:
                return Response(
                    {'detail': 'You cannot delegate control to yourself.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            device.delegated_to = friend
            device.status = DelegationStatus.ACTIVE
            device.save(update_fields=['delegated_to', 'status', 'updated_at'])

        log_action(
            request, 'control_delegated',
            f'Device {device_id} → user {friend_id} in room {room_id}',
        )
        device_data = DeviceDelegationSerializer(device).data
        _broadcast_delegation(room_id, 'delegated', {'device': device_data})
        return Response(device_data)


class RevokeControlView(APIView):
    """
    POST — Revoke delegation and return control to owner.

    Uses select_for_update() for atomic revocation.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        tags=['Delegation'],
        operation_id='delegation_revoke',
        request=None,
        responses={200: DeviceDelegationSerializer},
    )
    def post(self, request, room_id, device_id):
        room, err = _get_delegation_room(room_id)
        if err:
            return err

        with transaction.atomic():
            device = get_object_or_404(
                DeviceDelegation.objects.select_for_update(),
                pk=device_id, room=room,
            )

            # Only the device owner can revoke
            if device.owner != request.user:
                return Response(
                    {'detail': 'Only the device owner can revoke control.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

            device.delegated_to = None
            device.status = DelegationStatus.REVOKED
            device.save(update_fields=['delegated_to', 'status', 'updated_at'])

        log_action(
            request, 'control_revoked',
            f'Device {device_id} in room {room_id}',
        )
        device_data = DeviceDelegationSerializer(device).data
        _broadcast_delegation(room_id, 'revoked', {'device': device_data})
        return Response(device_data)


class DeviceStatusView(APIView):
    """GET — Check who currently has control of a device."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        tags=['Delegation'],
        operation_id='delegation_status',
        responses={200: DeviceDelegationSerializer},
    )
    def get(self, request, room_id, device_id):
        room, err = _get_delegation_room(room_id)
        if err:
            return err

        allowed, reason = check_license(request.user, room)
        if not allowed:
            return Response({'detail': reason}, status=status.HTTP_403_FORBIDDEN)

        device = get_object_or_404(
            DeviceDelegation,
            pk=device_id, room=room,
        )
        return Response(DeviceDelegationSerializer(device).data)


class ControlActionView(APIView):
    """
    POST — Send a playback control action (play/pause/skip/previous)
    to a specific device.

    Permissions:
      - The device owner can always send actions
      - A delegated user can send actions ONLY while delegation is active
      - Everyone else is rejected

    Idempotency:
      - The client provides an ``action_id`` (UUID recommended)
      - If the same ``action_id`` is sent again for the same device,
        the action is NOT re-executed — the existing response is returned
      - This prevents duplicate skips/plays from network retries

    Conflict Resolution:
      - ``select_for_update()`` on the device row serialises concurrent actions
      - Only one action at a time can execute per device
      - No lost updates, no duplicate executions
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    

    @extend_schema(
        tags=['Delegation'],
        operation_id='delegation_control_action',
        request=ControlActionSerializer,
        responses={
            200: ControlActionResponseSerializer,
            201: ControlActionResponseSerializer,
            403: OpenApiResponse(description='Not authorised to control this device'),
        },
    )
    def post(self, request, room_id, device_id):
        room, err = _get_delegation_room(room_id)
        if err:
            return err

        serializer = ControlActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_id = serializer.validated_data['action_id']
        action_type = serializer.validated_data['action_type']

        playback_payload = None

        try:
            with transaction.atomic():
                device = DeviceDelegation.objects.select_for_update().get(
                    pk=device_id, room=room,
                )

                is_owner = (device.owner == request.user)
                is_delegate = (
                    device.delegated_to == request.user
                    and device.status == DelegationStatus.ACTIVE
                )
                if not is_owner and not is_delegate:
                    return Response(
                        {'detail': 'You do not have control of this device.'},
                        status=status.HTTP_403_FORBIDDEN,
                    )

                existing = ControlAction.objects.filter(
                    device=device, action_id=action_id,
                ).select_related('performed_by').first()
                if existing:
                    return Response(
                        ControlActionResponseSerializer(existing).data,
                        status=status.HTTP_200_OK,
                    )

                action = ControlAction.objects.create(
                    device=device,
                    action_id=action_id,
                    action_type=action_type,
                    performed_by=request.user,
                )

                # ── ADD THIS BLOCK ──────────────────────────────────────────
                from api.playback import (
                    get_or_create_playback_state,
                    resume_room_playback,
                    pause_room_playback,
                    skip_room_track,
                )
                from api.playback_broadcast import serialize_playback_state

                if action_type == "play":
                    state = resume_room_playback(room)
                elif action_type == "pause":
                    state = pause_room_playback(room)
                elif action_type == "skip":
                    state = skip_room_track(room)
                elif action_type == "previous":
                    state = get_or_create_playback_state(room)  # placeholder for now
                else:
                    state = get_or_create_playback_state(room)

                playback_payload = serialize_playback_state(state)
                # ────────────────────────────────────────────────────────────

        except DeviceDelegation.DoesNotExist:
            return Response(
                {'detail': 'Device not found in this room.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        except IntegrityError:
            existing = ControlAction.objects.filter(
                device_id=device_id, action_id=action_id,
            ).select_related('performed_by').first()
            if existing:
                return Response(
                    ControlActionResponseSerializer(existing).data,
                    status=status.HTTP_200_OK,
                )
            return Response(
                {'detail': 'Action could not be processed.'},
                status=status.HTTP_409_CONFLICT,
            )

        log_action(
            request, 'control_action',
            f'{action_type} on device {device_id} in room {room_id}',
        )

        _broadcast_delegation(room_id, 'control_action', {
            'action': ControlActionResponseSerializer(action).data,
            'device': DeviceDelegationSerializer(device).data,
        })

        # ADD THIS TOO
        if playback_payload:
            from api.playback_broadcast import broadcast_playback_state
            broadcast_playback_state(room.id, playback_payload)

        return Response(
            ControlActionResponseSerializer(action).data,
            status=status.HTTP_201_CREATED,
        )