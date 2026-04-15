"""
WebSocket consumer for the Music Track Vote service.

Clients connect to: ws://host/ws/events/<room_id>/?token=<jwt>
They join a group named 'vote_<room_id>' and receive real-time
updates whenever a vote is cast, a track is added, or removed.

Events sent to clients:
  - type: 'initial_state' → full ranked track list on connect
  - type: 'vote_update'   → after a vote is cast
  - type: 'track_added'   → after a new track is suggested
  - type: 'track_removed' → after a track is deleted
"""

import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class VoteConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for real-time vote updates.

    All playlist mutations are done via REST — this consumer is read-only.
    It receives group messages from the views and forwards them to clients.
    """

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.group_name = f'vote_{self.room_id}'
        user = self.scope.get('user', AnonymousUser())

        # Reject unauthenticated connections
        if not user or not user.is_authenticated:
            await self.close()
            return

        # Verify room access
        has_access = await self._check_access(user, self.room_id)
        if not has_access:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send current ranked track list on connect
        tracks = await self._get_tracks()
        await self.send_json({'type': 'initial_state', 'tracks': tracks})

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Clients don't send messages in this consumer — voting is done via REST
        pass

    # ── Group message handlers ───────────────────────────────────────────

    async def vote_update(self, event):
        """Handler for 'vote.update' messages — sent after a vote is cast."""
        await self.send_json({
            'type': 'vote_update',
            'tracks': event['tracks'],
        })

    async def track_added(self, event):
        """Handler for 'track.added' messages — sent after a new track is suggested."""
        await self.send_json({
            'type': 'track_added',
            'tracks': event['tracks'],
        })

    async def track_removed(self, event):
        """Handler for 'track.removed' messages — sent after a track is deleted."""
        await self.send_json({
            'type': 'track_removed',
            'tracks': event['tracks'],
        })

    # ── Database helpers ─────────────────────────────────────────────────

    @database_sync_to_async
    def _check_access(self, user, room_id):
        """Check if the user can access this vote room."""
        from api.models import Room
        from api.views_rooms import _user_can_access_room
        try:
            room = Room.objects.get(pk=room_id, room_type='vote')
            return _user_can_access_room(user, room)
        except Room.DoesNotExist:
            return False

    @database_sync_to_async
    def _get_tracks(self):
        """Fetch current ranked track list."""
        from events.models import Track
        from events.serializers import TrackSerializer
        tracks = Track.objects.filter(room_id=self.room_id).select_related('suggested_by')
        return TrackSerializer(tracks, many=True).data
