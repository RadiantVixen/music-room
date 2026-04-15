"""
WebSocket consumer for the Music Playlist Editor service.

Clients connect to: ws://host/ws/playlists/<room_id>/?token=<jwt>
They join a group named 'playlist_<room_id>' and receive real-time
updates whenever the playlist is edited.
"""

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class PlaylistConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for real-time playlist updates.

    Events sent to clients:
      - type: 'playlist.update'  → full ordered track list after any edit
    """

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.group_name = f'playlist_{self.room_id}'
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

        # Send current playlist on connect
        tracks = await self._get_tracks()
        await self.send_json({'type': 'initial_state', 'tracks': tracks})

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Edits are done via REST — this consumer is read-only for clients
        pass

    async def playlist_update(self, event):
        """Handler for 'playlist.update' messages from the channel layer."""
        await self.send_json({
            'type': 'playlist_update',
            'tracks': event['tracks'],
        })

    @database_sync_to_async
    def _check_access(self, user, room_id):
        from api.models import Room
        from api.views_rooms import _user_can_access_room
        try:
            room = Room.objects.get(pk=room_id, room_type='playlist')
            return _user_can_access_room(user, room)
        except Room.DoesNotExist:
            return False

    @database_sync_to_async
    def _get_tracks(self):
        from playlists.models import PlaylistTrack
        from playlists.serializers import PlaylistTrackSerializer
        tracks = PlaylistTrack.objects.filter(room_id=self.room_id).select_related('added_by')
        return PlaylistTrackSerializer(tracks, many=True).data
