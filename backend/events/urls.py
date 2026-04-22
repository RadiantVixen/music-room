"""URL patterns for the Music Track Vote service."""

from django.urls import path
from .views import TrackListCreateView, TrackVoteView, TrackDeleteView

urlpatterns = [
    path('<int:room_id>/tracks/', TrackListCreateView.as_view(), name='event-tracks'),
    path('<int:room_id>/tracks/<int:track_id>/vote/', TrackVoteView.as_view(), name='event-vote'),
    path('<int:room_id>/tracks/<int:track_id>/', TrackDeleteView.as_view(), name='event-track-delete'),
]
