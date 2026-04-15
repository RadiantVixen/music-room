"""WebSocket routing for the Music Playlist Editor service."""

from django.urls import re_path
from .consumers import PlaylistConsumer

websocket_urlpatterns = [
    re_path(r'ws/playlists/(?P<room_id>\d+)/$', PlaylistConsumer.as_asgi()),
]
