"""
ASGI config for auth project.

Routes both HTTP and WebSocket connections.
HTTP → standard Django ASGI app
WebSocket → Django Channels consumers (with JWT auth middleware)

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

from api.ws_auth import JWTAuthMiddleware

import events.routing
import playlists.routing
import delegation.routing

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': JWTAuthMiddleware(
        URLRouter(
            events.routing.websocket_urlpatterns
            + playlists.routing.websocket_urlpatterns
            + delegation.routing.websocket_urlpatterns
        )
    ),
})
