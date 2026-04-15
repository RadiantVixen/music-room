"""URL patterns for the Music Playlist Editor service."""

from django.urls import path
from .views import (
    PlaylistTrackListCreateView,
    PlaylistTrackDeleteView,
    PlaylistTrackMoveView,
)

urlpatterns = [
    path('<int:room_id>/tracks/', PlaylistTrackListCreateView.as_view(), name='playlist-tracks'),
    path('<int:room_id>/tracks/<int:track_id>/', PlaylistTrackDeleteView.as_view(), name='playlist-track-delete'),
    path('<int:room_id>/tracks/<int:track_id>/move/', PlaylistTrackMoveView.as_view(), name='playlist-track-move'),
]
