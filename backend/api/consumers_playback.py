from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

class RoomPlaybackConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.group_name = f"room_playback_{self.room_id}"
        user = self.scope.get("user", AnonymousUser())

        if not user or not user.is_authenticated:
            await self.close()
            return

        has_access = await self._check_access(user, self.room_id)
        if not has_access:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        state = await self._get_state()
        await self.send_json({
            "type": "playback_state",
            "payload": state,
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        pass

    async def playback_update(self, event):
        await self.send_json({
            "type": "playback_state",
            "payload": event["payload"],
        })

    @database_sync_to_async
    def _check_access(self, user, room_id):
        from api.models import Room
        from api.views_rooms import _user_can_access_room
        try:
            room = Room.objects.get(pk=room_id)
            return _user_can_access_room(user, room)
        except Room.DoesNotExist:
            return False

    @database_sync_to_async
    def _get_state(self):
        from api.models import Room
        from api.playback import get_or_create_playback_state
        from api.playback_broadcast import serialize_playback_state
        room = Room.objects.get(pk=self.room_id)
        state = get_or_create_playback_state(room)
        return serialize_playback_state(state)