"""
Serializers for the Music Playlist Editor service.
"""

from rest_framework import serializers
from .models import PlaylistTrack


class PlaylistTrackSerializer(serializers.ModelSerializer):
    """Read/write serializer for playlist tracks."""
    added_by_id = serializers.IntegerField(source='added_by.id', read_only=True)
    added_by_username = serializers.CharField(source='added_by.username', read_only=True)

    class Meta:
        model = PlaylistTrack
        fields = [
            'id', 'room', 'title', 'artist', 'external_url',
            'added_by_id', 'added_by_username',
            'position', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'room', 'position', 'created_at', 'updated_at',
            'added_by_id', 'added_by_username',
        ]


class PlaylistStateSerializer(serializers.Serializer):
    """Response wrapper that includes the playlist version for optimistic concurrency."""
    version = serializers.IntegerField(help_text='Playlist mutation version. Increments on every change.')
    tracks = PlaylistTrackSerializer(many=True)


class PlaylistTrackCreateSerializer(serializers.Serializer):
    """Input when adding a new track to a playlist."""
    title = serializers.CharField(max_length=255, help_text='Track title')
    artist = serializers.CharField(max_length=255, help_text='Artist / band name')
    external_url = serializers.URLField(
        required=False,
        allow_blank=True,
        help_text='Optional link to Spotify / YouTube',
    )


class MoveTrackSerializer(serializers.Serializer):
    """Input when moving a track to a new position."""
    new_position = serializers.IntegerField(
        min_value=0,
        help_text='The 0-based target position to move the track to.',
    )
