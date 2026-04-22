from django.db import models
from django.utils import timezone
from api.models import Room
from events.models import Track

class PlaybackStatus(models.TextChoices):
    PLAYING = "playing", "Playing"
    PAUSED = "paused", "Paused"
    STOPPED = "stopped", "Stopped"

class RoomPlaybackState(models.Model):
    room = models.OneToOneField(
        Room,
        on_delete=models.CASCADE,
        related_name="playback_state",
    )
    current_track = models.ForeignKey(
        Track,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    status = models.CharField(
        max_length=20,
        choices=PlaybackStatus.choices,
        default=PlaybackStatus.STOPPED,
    )
    started_at = models.DateTimeField(null=True, blank=True)
    paused_at = models.DateTimeField(null=True, blank=True)
    position_ms = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"PlaybackState(room={self.room_id}, status={self.status})"