"""
Serializers for the Music Track Vote service.
"""

from rest_framework import serializers
from .models import Track, Vote
from api.models import Room


class TrackSerializer(serializers.ModelSerializer):
    """
    Read serializer — exposes full track info including vote count,
    deterministic rank, and whether the requesting user has voted.
    """
    suggested_by_id = serializers.IntegerField(source='suggested_by.id', read_only=True)
    suggested_by_username = serializers.CharField(source='suggested_by.username', read_only=True)
    rank = serializers.SerializerMethodField(
        help_text='1-based rank in the playlist. Deterministic: vote_count DESC → created_at DESC → id DESC.',
    )
    has_voted = serializers.SerializerMethodField(
        help_text='True if the requesting user has already voted for this track.',
    )

    class Meta:
        model = Track
        fields = [
            'id', 'room', 'title', 'artist', 'external_url',
            'suggested_by_id', 'suggested_by_username',
            'vote_count', 'rank', 'has_voted', 'created_at',
        ]
        read_only_fields = [
            'id', 'vote_count', 'created_at',
            'suggested_by_id', 'suggested_by_username',
            'rank', 'has_voted',
        ]

    def get_rank(self, obj):
        """
        Compute rank by comparing against all tracks in the same room.
        Uses the same ordering as Track.Meta.ordering so every client
        gets an identical rank for the same data.
        """
        # If the queryset was already ordered (which it is by Meta.ordering),
        # we compute rank from the queryset position.
        view = self.context.get('view')
        request = self.context.get('request')

        # For list serialization, use annotation if available
        if hasattr(obj, '_rank'):
            return obj._rank

        # Fallback: count how many tracks rank higher
        higher = Track.objects.filter(
            room=obj.room,
        ).filter(
            # tracks that rank ABOVE this one
            models_q_higher_vote(obj)
        ).count()
        return higher + 1

    def get_has_voted(self, obj):
        """Check if the current request user has voted for this track."""
        request = self.context.get('request')
        if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
            # When serialized without request context (e.g. WS broadcast), return None
            return None
        # Use prefetched votes if available, otherwise query
        if hasattr(obj, '_prefetched_objects_cache') and 'votes' in obj._prefetched_objects_cache:
            return any(v.user_id == request.user.id for v in obj.votes.all())
        return Vote.objects.filter(track=obj, user=request.user).exists()


def models_q_higher_vote(track):
    """
    Return a Q object matching tracks that rank HIGHER than the given track
    using the deterministic ordering: -vote_count, -created_at, -id.
    """
    from django.db.models import Q
    return (
        Q(vote_count__gt=track.vote_count)
        | Q(vote_count=track.vote_count, created_at__gt=track.created_at)
        | Q(vote_count=track.vote_count, created_at=track.created_at, id__gt=track.id)
    )


class TrackCreateSerializer(serializers.Serializer):
    """Validates input when suggesting a new track in a vote room."""
    title = serializers.CharField(max_length=255, help_text='Track title')
    artist = serializers.CharField(max_length=255, help_text='Artist / band name')
    external_url = serializers.URLField(
        required=False,
        allow_blank=True,
        help_text='Optional link to Spotify / YouTube',
    )


class VoteSerializer(serializers.Serializer):
    """
    No input needed — the track_id comes from the URL
    and the user from the request.
    This serializer exists for documentation clarity.
    """
    pass


class VoteResponseSerializer(serializers.Serializer):
    """Response after a successful vote."""
    detail = serializers.CharField()
    track = TrackSerializer()
