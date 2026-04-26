"""
Models for the Music Track Vote service.

A Room with room_type='vote' acts as a voting event.
Users suggest tracks and vote on them. The track list is
ranked by vote_count (descending).
"""

from django.db import models
from django.conf import settings
from api.models import Room

class Track(models.Model):
    room = models.ForeignKey(
        Room, on_delete=models.CASCADE, related_name='tracks',
        help_text='The vote-type room this track belongs to.'
    )

    deezer_id = models.CharField(max_length=255, help_text='Deezer track ID')
    title = models.CharField(max_length=255, help_text='Track title')
    artist = models.CharField(max_length=255, help_text='Artist / band name')
    album = models.CharField(max_length=255, blank=True, help_text='Album name')

    album_art = models.URLField(
        max_length=1000,
        blank=True,
        null=True,
        help_text='URL to album cover'
    )
    duration = models.IntegerField(default=0, help_text='Duration in seconds')
    audio_url = models.URLField(
        max_length=2000,
        blank=True,
        null=True,
        help_text='Deezer 30s preview_url'
    )

    suggested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='suggested_tracks'
    )
    vote_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    is_played = models.BooleanField(default=False)

    class Meta:
        unique_together = ('room', 'deezer_id')
        ordering = ['-vote_count', '-created_at', '-id']

    def __str__(self):
        return f'{self.title} by {self.artist} ({self.vote_count} votes)'

class Vote(models.Model):
    """
    Records a single vote from a user for a track.
    The unique_together constraint prevents double-voting.
    """
    track = models.ForeignKey(
        Track,
        on_delete=models.CASCADE,
        related_name='votes',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='track_votes',
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='votes',
        help_text='Denormalised FK for fast per-room queries.',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('track', 'user')  # one vote per user per track
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} → {self.track} in room {self.room_id}'