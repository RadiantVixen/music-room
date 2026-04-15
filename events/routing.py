"""WebSocket routing for the Music Track Vote service."""

from django.urls import re_path
from .consumers import VoteConsumer

websocket_urlpatterns = [
    re_path(r'ws/events/(?P<room_id>\d+)/$', VoteConsumer.as_asgi()),
]
