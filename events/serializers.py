"""
Serializers for the Music Track Vote service.
"""

from rest_framework import serializers
from .models import Track, Vote
from api.models import Room


class TrackSerializer(serializers.ModelSerializer):

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
        return getattr(obj, '_rank', None)  

    def get_has_voted(self, obj):
        if not self.context.get('request') or not self.context['request'].user.is_authenticated:
            return False
        return getattr(obj, '_has_voted', False)



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
