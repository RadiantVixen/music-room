from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FREE_PLAYLIST_LIMIT, Playlist, PlaylistCollaborator, PlaylistTrack, PremiumSubscription
from .permissions import IsPremiumUser
from .serializers import (
    PlaylistCollaboratorSerializer,
    PlaylistListSerializer,
    PlaylistSerializer,
    PlaylistTrackSerializer,
    PremiumSubscriptionSerializer,
)


# ─── Premium Status ───────────────────────────────────────────────────────────

class PremiumStatusView(APIView):
    """
    GET /api/premium/status/
    Returns the authenticated user's premium status.
    Available to all authenticated users (not just premium ones).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sub = request.user.premiumsubscription
            serializer = PremiumSubscriptionSerializer(sub)
            return Response(serializer.data)
        except PremiumSubscription.DoesNotExist:
            return Response(
                {
                    "id": None,
                    "plan_type": "free",
                    "is_active": False,
                    "is_premium": False,
                    "started_at": None,
                    "expires_at": None,
                }
            )


class ActivatePremiumView(APIView):
    """
    POST /api/premium/activate/
    Activates (or reactivates) premium for the authenticated user.
    In production this would be called by the payment service after a successful charge.
    For now it is open to any authenticated user (mock activation).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        sub, _ = PremiumSubscription.objects.get_or_create(user=request.user)
        sub.plan_type = "premium"
        sub.is_active = True
        sub.started_at = timezone.now()
        sub.expires_at = None  # lifetime until cancelled
        sub.save()
        serializer = PremiumSubscriptionSerializer(sub)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DeactivatePremiumView(APIView):
    """
    POST /api/premium/deactivate/
    Cancels premium — downgrades the user back to free.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            sub = request.user.premiumsubscription
            sub.plan_type = "free"
            sub.is_active = False
            sub.save()
            return Response({"detail": "Premium cancelled."})
        except PremiumSubscription.DoesNotExist:
            return Response({"detail": "No subscription found."}, status=status.HTTP_404_NOT_FOUND)


# ─── Playlists ────────────────────────────────────────────────────────────────

class PlaylistListCreateView(ListCreateAPIView):
    """
    GET  /api/premium/playlists/        — list the user's own playlists + collaborative ones
    POST /api/premium/playlists/        — create a new playlist (premium required for >3)
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return PlaylistListSerializer
        return PlaylistSerializer

    def get_queryset(self):
        user = self.request.user
        # Own playlists + playlists where user is a collaborator
        owned = Playlist.objects.filter(owner=user)
        collab_ids = PlaylistCollaborator.objects.filter(user=user).values_list("playlist_id", flat=True)
        collab = Playlist.objects.filter(id__in=collab_ids)
        return (owned | collab).distinct()

    def perform_create(self, serializer):
        user = self.request.user

        # Free-user playlist limit
        try:
            is_premium = user.premiumsubscription.is_premium
        except PremiumSubscription.DoesNotExist:
            is_premium = False

        if not is_premium:
            count = Playlist.objects.filter(owner=user).count()
            if count >= FREE_PLAYLIST_LIMIT:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    f"Free users can only create up to {FREE_PLAYLIST_LIMIT} playlists. "
                    "Upgrade to Premium for unlimited playlists."
                )

        serializer.save(owner=user)


class PlaylistDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET    /api/premium/playlists/<id>/   — retrieve with nested tracks & collaborators
    PATCH  /api/premium/playlists/<id>/   — update name/description/cover/collaborative flag
    DELETE /api/premium/playlists/<id>/   — delete (owner only)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PlaylistSerializer

    def get_queryset(self):
        user = self.request.user
        collab_ids = PlaylistCollaborator.objects.filter(user=user).values_list("playlist_id", flat=True)
        return Playlist.objects.filter(owner=user) | Playlist.objects.filter(id__in=collab_ids)

    def perform_destroy(self, instance):
        if instance.owner != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the playlist owner can delete it.")
        instance.delete()

    def perform_update(self, serializer):
        playlist = self.get_object()
        # Collaborative flag can only be set by premium users
        if serializer.validated_data.get("is_collaborative"):
            try:
                if not self.request.user.premiumsubscription.is_premium:
                    raise ValueError()
            except (AttributeError, ValueError, PremiumSubscription.DoesNotExist):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Real-time collaboration is a Premium feature.")
        serializer.save()


# ─── Playlist Tracks ──────────────────────────────────────────────────────────

class PlaylistTrackListCreateView(APIView):
    """
    GET  /api/premium/playlists/<playlist_id>/tracks/   — list tracks
    POST /api/premium/playlists/<playlist_id>/tracks/   — add a track
    """
    permission_classes = [IsAuthenticated]

    def _get_playlist(self, playlist_id, user):
        try:
            playlist = Playlist.objects.get(pk=playlist_id)
        except Playlist.DoesNotExist:
            return None, Response({"detail": "Playlist not found."}, status=status.HTTP_404_NOT_FOUND)

        is_owner = playlist.owner == user
        is_collaborator = playlist.collaborators.filter(user=user).exists()
        if not (is_owner or is_collaborator):
            return None, Response({"detail": "You do not have access to this playlist."}, status=status.HTTP_403_FORBIDDEN)

        return playlist, None

    def get(self, request, playlist_id):
        playlist, err = self._get_playlist(playlist_id, request.user)
        if err:
            return err
        tracks = playlist.tracks.all()
        serializer = PlaylistTrackSerializer(tracks, many=True)
        return Response(serializer.data)

    def post(self, request, playlist_id):
        playlist, err = self._get_playlist(playlist_id, request.user)
        if err:
            return err

        # Collaborators need premium on the playlist
        if playlist.owner != request.user and not playlist.is_collaborative:
            return Response({"detail": "This playlist is not collaborative."}, status=status.HTTP_403_FORBIDDEN)

        serializer = PlaylistTrackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Auto-position at the end
        last_pos = playlist.tracks.count()
        serializer.save(playlist=playlist, added_by=request.user, position=last_pos)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PlaylistTrackDetailView(APIView):
    """
    DELETE /api/premium/playlists/<playlist_id>/tracks/<track_id>/
    PATCH  /api/premium/playlists/<playlist_id>/tracks/<track_id>/  — reorder (position)
    """
    permission_classes = [IsAuthenticated]

    def _get_track(self, playlist_id, track_id, user):
        try:
            playlist = Playlist.objects.get(pk=playlist_id)
            track = PlaylistTrack.objects.get(pk=track_id, playlist=playlist)
        except (Playlist.DoesNotExist, PlaylistTrack.DoesNotExist):
            return None, None, Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        is_owner = playlist.owner == user
        is_collaborator = playlist.collaborators.filter(user=user).exists()
        if not (is_owner or is_collaborator):
            return None, None, Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        return playlist, track, None

    def delete(self, request, playlist_id, track_id):
        playlist, track, err = self._get_track(playlist_id, track_id, request.user)
        if err:
            return err
        track.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, playlist_id, track_id):
        playlist, track, err = self._get_track(playlist_id, track_id, request.user)
        if err:
            return err
        new_pos = request.data.get("position")
        if new_pos is None:
            return Response({"detail": "position is required."}, status=status.HTTP_400_BAD_REQUEST)
        track.position = int(new_pos)
        track.save()
        return Response(PlaylistTrackSerializer(track).data)


# ─── Collaborators ────────────────────────────────────────────────────────────

class PlaylistCollaboratorView(APIView):
    """
    GET    /api/premium/playlists/<playlist_id>/collaborators/
    POST   /api/premium/playlists/<playlist_id>/collaborators/   { "user_id": <int> }
    DELETE /api/premium/playlists/<playlist_id>/collaborators/<user_id>/
    """
    permission_classes = [IsAuthenticated, IsPremiumUser]

    def _get_playlist(self, playlist_id, user):
        try:
            playlist = Playlist.objects.get(pk=playlist_id, owner=user)
            return playlist, None
        except Playlist.DoesNotExist:
            return None, Response({"detail": "Playlist not found or you are not the owner."}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, playlist_id):
        playlist, err = self._get_playlist(playlist_id, request.user)
        if err:
            return err
        collabs = playlist.collaborators.all()
        return Response(PlaylistCollaboratorSerializer(collabs, many=True).data)

    def post(self, request, playlist_id):
        playlist, err = self._get_playlist(playlist_id, request.user)
        if err:
            return err

        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        collab, created = PlaylistCollaborator.objects.get_or_create(playlist=playlist, user=target_user)
        if not created:
            return Response({"detail": "Already a collaborator."}, status=status.HTTP_409_CONFLICT)

        # Mark playlist as collaborative
        if not playlist.is_collaborative:
            playlist.is_collaborative = True
            playlist.save()

        return Response(PlaylistCollaboratorSerializer(collab).data, status=status.HTTP_201_CREATED)

    def delete(self, request, playlist_id, user_id):
        playlist, err = self._get_playlist(playlist_id, request.user)
        if err:
            return err
        deleted, _ = PlaylistCollaborator.objects.filter(playlist=playlist, user_id=user_id).delete()
        if not deleted:
            return Response({"detail": "Collaborator not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
