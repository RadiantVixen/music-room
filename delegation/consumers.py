"""
WebSocket consumer for the Music Control Delegation service.

Clients connect to: ws://host/ws/delegation/<room_id>/?token=<jwt>
They join a group named 'delegation_<room_id>' and receive real-time
notifications when control is delegated, revoked, or a control action is sent.

Events sent to clients:
  - type: 'initial_state'       → all devices on connect
  - type: 'delegation_update'   → event + device data on delegation/revocation
  - type: 'control_action'      → action details + device data
"""

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class DelegationConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for real-time delegation updates.
    All mutations are done via REST — this consumer is read-only.
    """

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.group_name = f'delegation_{self.room_id}'
        user = self.scope.get('user', AnonymousUser())

        if not user or not user.is_authenticated:
            await self.close()
            return

        has_access = await self._check_access(user, self.room_id)
        if not has_access:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send current device list on connect
        devices = await self._get_devices()
        await self.send_json({'type': 'initial_state', 'devices': devices})

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Delegation actions are done via REST
        pass

    # ── Group message handlers ───────────────────────────────────────────

    async def delegation_update(self, event):
        """Handler for delegation/revocation updates."""
        await self.send_json({
            'type': 'delegation_update',
            'event': event.get('event'),
            'device': event.get('device'),
            'action': event.get('action'),
        })

    # ── Database helpers ─────────────────────────────────────────────────

    @database_sync_to_async
    def _check_access(self, user, room_id):
        from api.models import Room
        from api.views_rooms import _user_can_access_room
        try:
            room = Room.objects.get(pk=room_id, room_type='delegation')
            return _user_can_access_room(user, room)
        except Room.DoesNotExist:
            return False

    @database_sync_to_async
    def _get_devices(self):
        from delegation.models import DeviceDelegation
        from delegation.serializers import DeviceDelegationSerializer
        devices = DeviceDelegation.objects.filter(room_id=self.room_id).select_related(
            'owner', 'delegated_to',
        )
        return DeviceDelegationSerializer(devices, many=True).data
