"""
Models for the Music Track Vote service.

A Room with room_type='vote' acts as a voting event.
Users suggest tracks and vote on them.  The track list is
ranked by vote_count (descending).
"""

from django.db import models
from django.conf import settings
from api.models import Room


class Track(models.Model):
    """
    A music track suggested inside a vote-type room.
    The vote_count field is incremented atomically via F() expressions
    to prevent race conditions under concurrent voting.
    """
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='tracks',
        help_text='The vote-type room this track belongs to.',
    )
    title = models.CharField(max_length=255, help_text='Track title')
    artist = models.CharField(max_length=255, help_text='Artist / band name')
    external_url = models.URLField(
        blank=True,
        help_text='Optional link to Spotify, YouTube, etc.',
    )
    suggested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='suggested_tracks',
        help_text='The user who suggested this track.',
    )
    vote_count = models.IntegerField(
        default=0,
        help_text='Total number of votes — updated atomically.',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-vote_count', '-created_at', '-id']
        # ── Deterministic tie-breaking ────────────────────────────────
        # 1. vote_count DESC → most voted track first
        # 2. created_at DESC → when votes are equal, the newer track wins
        # 3. id DESC        → absolute tiebreaker when timestamps collide
        # This guarantees every client produces the exact same order.

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
