from django.urls import path
from .views import (
    PremiumStatusView,
    ActivatePremiumView,
    DeactivatePremiumView,
    PlaylistListCreateView,
    PlaylistDetailView,
    PlaylistTrackListCreateView,
    PlaylistTrackDetailView,
    PlaylistCollaboratorView,
)

urlpatterns = [
    # ── Subscription status & management ──────────────────────────────────────
    path("status/", PremiumStatusView.as_view(), name="premium-status"),
    path("activate/", ActivatePremiumView.as_view(), name="premium-activate"),
    path("deactivate/", DeactivatePremiumView.as_view(), name="premium-deactivate"),

    # ── Playlists CRUD ────────────────────────────────────────────────────────
    path("playlists/", PlaylistListCreateView.as_view(), name="premium-playlist-list"),
    path("playlists/<int:pk>/", PlaylistDetailView.as_view(), name="premium-playlist-detail"),

    # ── Playlist Tracks ───────────────────────────────────────────────────────
    path("playlists/<int:playlist_id>/tracks/", PlaylistTrackListCreateView.as_view(), name="premium-track-list"),
    path("playlists/<int:playlist_id>/tracks/<int:track_id>/", PlaylistTrackDetailView.as_view(), name="premium-track-detail"),

    # ── Collaborators ─────────────────────────────────────────────────────────
    path("playlists/<int:playlist_id>/collaborators/", PlaylistCollaboratorView.as_view(), name="premium-collaborator-list"),
    path("playlists/<int:playlist_id>/collaborators/<int:user_id>/", PlaylistCollaboratorView.as_view(), name="premium-collaborator-detail"),
]
