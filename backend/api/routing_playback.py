from django.urls import re_path
from api.consumers_playback import RoomPlaybackConsumer

websocket_urlpatterns = [
    re_path(r"ws/playback/(?P<room_id>\d+)/$", RoomPlaybackConsumer.as_asgi()),
]