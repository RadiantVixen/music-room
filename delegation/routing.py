"""WebSocket routing for the Music Control Delegation service."""

from django.urls import re_path
from .consumers import DelegationConsumer

websocket_urlpatterns = [
    re_path(r'ws/delegation/(?P<room_id>\d+)/$', DelegationConsumer.as_asgi()),
]
