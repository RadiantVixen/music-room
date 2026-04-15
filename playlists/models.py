"""
Models for the Music Playlist Editor service.

A Room with room_type='playlist' acts as a collaborative playlist.
Users add, remove, and reorder tracks.  The position field
determines playback order.

Consistency Model: Strict Server Ordering
─────────────────────────────────────────
All mutations are serialised through:
  1. ``transaction.atomic()`` — each mutation is a single DB transaction
  2. ``select_for_update()`` — locks ALL tracks in the room during mutation
  3. Server-authoritative ordering — clients never decide positions

This means:
  - Concurrent adds always produce contiguous, non-overlapping positions
  - Concurrent moves are serialised: second move sees the result of the first
  - Delete-while-move: if a track is deleted while another user moves it,
    the move returns 409 Conflict (not silent corruption)
  - The ``version`` counter increments on every mutation, letting clients
    detect stale state (optimistic concurrency for UI purposes)

This is NOT OT or CRDT — it is strict server ordering.
The server is the single source of truth.
"""

from django.db import models
from django.conf import settings
from api.models import Room


class PlaylistTrack(models.Model):
    """
    A single track entry in a playlist-type room.
    The position field is maintained atomically when tracks are
    added, removed, or moved to avoid race conditions.
    """
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='playlist_tracks',
        help_text='The playlist-type room this track belongs to.',
    )
    title = models.CharField(max_length=255, help_text='Track title')
    artist = models.CharField(max_length=255, help_text='Artist / band name')
    external_url = models.URLField(
        blank=True,
        help_text='Optional link to Spotify, YouTube, etc.',
    )
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='playlist_tracks_added',
        help_text='The user who added this track.',
    )
    position = models.PositiveIntegerField(
        help_text='Playback order (0-based). Lower = earlier.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position']
        # Ensure no two tracks share the same position in a room
        unique_together = ('room', 'position')

    def __str__(self):
        return f'[{self.position}] {self.title} by {self.artist}'


class PlaylistVersion(models.Model):
    """
    Tracks the mutation version counter for each playlist room.
    Incremented on every add, delete, or move operation.
    Clients receive this version in every response and WS broadcast,
    enabling optimistic concurrency detection.
    """
    room = models.OneToOneField(
        Room,
        on_delete=models.CASCADE,
        related_name='playlist_version',
        primary_key=True,
    )
    version = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f'Playlist v{self.version} for room {self.room_id}'
