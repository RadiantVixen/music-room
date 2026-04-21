"""
Serializers for bonus features (notifications, analytics, recommendations).
"""

from rest_framework import serializers
from .models import (
    Notification,
    UserAnalytics,
    UserListeningHistory,
    SmartPlaylist,
    RecommendationLog,
)


class NotificationSerializer(serializers.ModelSerializer):
    """Serialize notification objects for API responses."""
    
    from_user_username = serializers.CharField(source='from_user.username', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'from_user',
            'from_user_username',
            'is_read',
            'related_room_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserAnalyticsSerializer(serializers.ModelSerializer):
    """Serialize user analytics for dashboard."""
    
    class Meta:
        model = UserAnalytics
        fields = [
            'total_songs_added',
            'total_rooms_created',
            'total_rooms_joined',
            'total_playlists_created',
            'average_session_duration',
            'last_active',
            'total_login_count',
            'created_at',
        ]
        read_only_fields = ['created_at', 'last_active']


class UserListeningHistorySerializer(serializers.ModelSerializer):
    """Serialize listening history for recommendations."""
    
    class Meta:
        model = UserListeningHistory
        fields = [
            'id',
            'song_id',
            'song_title',
            'artist_name',
            'genre',
            'listened_at',
            'duration_listened',
        ]
        read_only_fields = ['id', 'listened_at']


class SmartPlaylistSerializer(serializers.ModelSerializer):
    """Serialize smart playlist objects."""
    
    song_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SmartPlaylist
        fields = [
            'id',
            'name',
            'description',
            'playlist_type',
            'songs',
            'song_count',
            'cover_image',
            'is_active',
            'last_regenerated',
            'created_at',
        ]
        read_only_fields = ['id', 'last_regenerated', 'created_at']
    
    def get_song_count(self, obj):
        return len(obj.songs) if obj.songs else 0


class RecommendationLogSerializer(serializers.ModelSerializer):
    """Serialize recommendation logs for tracking."""
    
    class Meta:
        model = RecommendationLog
        fields = [
            'id',
            'recommendation_type',
            'recommended_items',
            'was_accepted',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
