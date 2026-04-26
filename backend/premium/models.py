from django.db import models
from django.conf import settings
from django.utils import timezone

CustomUser = settings.AUTH_USER_MODEL


# ─── Premium Subscription ─────────────────────────────────────────────────────

class PlanType(models.TextChoices):
    FREE = "free", "Free"
    PREMIUM = "premium", "Premium"


class PremiumSubscription(models.Model):
    """
    Tracks whether a user has an active premium plan.
    Stored separately from CustomUser so this app stays self-contained.
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="premiumsubscription",
    )
    plan_type = models.CharField(
        max_length=10,
        choices=PlanType.choices,
        default=PlanType.FREE,
    )
    is_active = models.BooleanField(default=False)
    started_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Premium Subscription"

    @property
    def is_premium(self) -> bool:
        """True when the subscription is active and not expired."""
        if not self.is_active:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True

    def __str__(self):
        return f"{self.user} — {self.plan_type} (active={self.is_active})"


# ─── Playlist ─────────────────────────────────────────────────────────────────

FREE_PLAYLIST_LIMIT = 3


class Playlist(models.Model):
    """User-owned playlist. Premium users can have unlimited; free users max 3."""
    owner = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="premium_playlists",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    cover_url = models.URLField(blank=True, null=True)
    is_collaborative = models.BooleanField(
        default=False,
        help_text="Premium feature — allows invited collaborators to edit.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"[Playlist] {self.name} by {self.owner}"


class PlaylistTrack(models.Model):
    """A single track inside a Playlist."""
    playlist = models.ForeignKey(
        Playlist,
        on_delete=models.CASCADE,
        related_name="tracks",
    )
    added_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="premium_added_tracks",
    )
    deezer_id = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    album = models.CharField(max_length=255, blank=True)
    album_art = models.URLField(blank=True, null=True)
    duration = models.PositiveIntegerField(null=True, blank=True, help_text="Duration in seconds")
    audio_url = models.URLField(blank=True, null=True)
    position = models.PositiveIntegerField(default=0, help_text="Order within the playlist")
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "added_at"]
        unique_together = ("playlist", "deezer_id")

    def __str__(self):
        return f"{self.title} – {self.artist} (pos {self.position})"


class PlaylistCollaborator(models.Model):
    """
    Tracks who (besides the owner) can edit a collaborative playlist.
    Premium-only feature.
    """
    playlist = models.ForeignKey(
        Playlist,
        on_delete=models.CASCADE,
        related_name="collaborators",
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="premium_collaborations",
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("playlist", "user")

    def __str__(self):
        return f"{self.user} → {self.playlist}"
