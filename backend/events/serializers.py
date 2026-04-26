from rest_framework import serializers
from .models import Track, Vote
from api.models import CustomUser


class UserMiniSerializer(serializers.ModelSerializer):
    """Matches the { name: '...', avatar: '...' } format for the frontend"""
    name = serializers.CharField(source='username', read_only=True)
    avatar = serializers.CharField(source='profile.avatar_url', read_only=True, default='https://i.pravatar.cc/100')

    class Meta:
        model = CustomUser
        fields = ['name', 'avatar']


def models_q_higher_vote(track):
    """Helper to calculate deterministic ranking."""
    from django.db.models import Q
    return (
        Q(vote_count__gt=track.vote_count)
        | Q(vote_count=track.vote_count, created_at__gt=track.created_at)
        | Q(vote_count=track.vote_count, created_at=track.created_at, id__gt=track.id)
    )


class TrackSerializer(serializers.ModelSerializer):
    """
    Read serializer — returns the full track state to the frontend.
    
    Maps backend snake_case to frontend camelCase:
            deezer_id → deezerId
      album_art  → albumArt
      audio_url  → audioUrl
      vote_count → votes (+ raw vote_count for backend tests)
      suggested_by → addedBy (nested user mini)
    """
    id = serializers.CharField(read_only=True)
    deezerId = serializers.CharField(source='deezer_id', read_only=True)
    albumArt = serializers.URLField(source='album_art', read_only=True)
    audioUrl = serializers.URLField(source='audio_url', read_only=True)
    addedBy = UserMiniSerializer(source='suggested_by', read_only=True)
    
    # Map the backend 'vote_count' integer to the frontend 'votes' key
    votes = serializers.IntegerField(source='vote_count', read_only=True)
    
    # We keep vote_count here so the backend tests don't break
    vote_count = serializers.IntegerField(read_only=True)
    
    # Restored dynamic logic for the tests
    rank = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = [
            'id', 'deezerId', 'title', 'artist', 'album', 'albumArt',
            'duration', 'votes', 'vote_count', 'addedBy', 'audioUrl',
            'rank', 'has_voted',
        ]

    def get_rank(self, obj):
        # Allow view annotations to override this for performance
        if hasattr(obj, '_rank'):
            return obj._rank
        higher = Track.objects.filter(room=obj.room).filter(models_q_higher_vote(obj)).count()
        return higher + 1

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if not request or not getattr(request, 'user', None) or not request.user.is_authenticated:
            # Check if annotated by the view
            return getattr(obj, '_has_voted', False)
        # Fallback if not annotated
        return Vote.objects.filter(track=obj, user=request.user).exists()


class TrackCreateSerializer(serializers.Serializer):
    """What the frontend POSTs to the backend when adding a Deezer track"""
    deezerId = serializers.CharField(max_length=255)
    title = serializers.CharField(max_length=255)
    artist = serializers.CharField(max_length=255)
    album = serializers.CharField(max_length=255, required=False, allow_blank=True)
    albumArt = serializers.URLField(required=False, allow_blank=True)
    duration = serializers.IntegerField(required=False, default=0)
    audioUrl = serializers.URLField(required=False, allow_blank=True)
    

class VoteResponseSerializer(serializers.Serializer):
    """Response after a successful vote."""
    detail = serializers.CharField()
    track = TrackSerializer()