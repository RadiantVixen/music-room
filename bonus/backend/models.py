"""
Bonus feature models for notifications, analytics, and recommendations.
These models extend the core Music Room functionality.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Notification(models.Model):
    """User notifications for friend activity, room invites, and system events."""
    
    NOTIFICATION_TYPES = [
        ('friend_request', 'Friend Request'),
        ('room_invite', 'Room Invitation'),
        ('song_added', 'Song Added to Room'),
        ('friend_online', 'Friend Came Online'),
        ('system', 'System Notification'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bonus_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    from_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    is_read = models.BooleanField(default=False)
    related_room_id = models.IntegerField(null=True, blank=True)  # Link to room if applicable
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class UserAnalytics(models.Model):
    """Track user activity metrics for analytics dashboard."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='bonus_analytics')
    total_songs_added = models.IntegerField(default=0)
    total_rooms_created = models.IntegerField(default=0)
    total_rooms_joined = models.IntegerField(default=0)
    total_playlists_created = models.IntegerField(default=0)
    average_session_duration = models.DurationField(default=timezone.timedelta(minutes=0))
    last_active = models.DateTimeField(auto_now=True)
    total_login_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Analytics - {self.user.username}"


class UserListeningHistory(models.Model):
    """Track user's listening history for recommendations."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bonus_listening_history')
    song_id = models.IntegerField()  # Reference to song from music service
    song_title = models.CharField(max_length=255)
    artist_name = models.CharField(max_length=255)
    genre = models.CharField(max_length=100, null=True, blank=True)
    listened_at = models.DateTimeField(auto_now_add=True)
    duration_listened = models.DurationField(default=timezone.timedelta(seconds=0))  # How long they listened
    
    class Meta:
        ordering = ['-listened_at']
        indexes = [
            models.Index(fields=['user', '-listened_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.song_title}"


class SmartPlaylist(models.Model):
    """AI-generated playlists based on user preferences and listening history."""
    
    PLAYLIST_TYPES = [
        ('daily_mix', 'Daily Mix'),
        ('genre_mood', 'Genre/Mood Mix'),
        ('discovery', 'Discovery Playlist'),
        ('friend_favorites', 'Friends\' Favorites'),
        ('trending', 'Trending Now'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bonus_smart_playlists')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    playlist_type = models.CharField(max_length=20, choices=PLAYLIST_TYPES)
    songs = models.JSONField(default=list)  # Store song IDs as JSON array
    cover_image = models.URLField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    last_regenerated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-last_regenerated']
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"


class RecommendationLog(models.Model):
    """Log recommendations shown to users for tracking effectiveness."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bonus_recommendation_logs')
    recommendation_type = models.CharField(max_length=100)  # e.g., 'similar_artists', 'trending_genre'
    recommended_items = models.JSONField()  # Array of recommended song/artist IDs
    was_accepted = models.BooleanField(default=False)  # Did user click/use recommendation?
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Recommendation - {self.recommendation_type} for {self.user.username}"
