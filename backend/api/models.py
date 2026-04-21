from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserRole(models.TextChoices):
    USER = 'USER', 'User'
    STAFF = 'STAFF', 'Staff'
    ADMIN = 'ADMIN', 'Admin'


class CustomUser(AbstractUser):
    role = models.CharField(
        max_length=10,
        choices=UserRole.choices,
        default=UserRole.USER
    )

    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email



class Profile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    provider = models.CharField(max_length=50, blank=True, null=True)  # 'google', 'facebook', etc.
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    phone_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile of {self.user.username}"


import uuid
from datetime import timedelta
from django.conf import settings

class PasswordResetCode(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_reset_codes'
    )
    email = models.EmailField()
    code = models.CharField(max_length=6)
    reset_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    is_verified = models.BooleanField(default=False)
    is_used = models.BooleanField(default=False)

    attempts = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    used_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.email} - {self.code}"
# ─── Music Preferences ────────────────────────────────────────────────────────

class MusicPreferences(models.Model):
    """Stores a user's music taste — linked 1-to-1 to Profile."""
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='music_preferences')
    favorite_genres = models.JSONField(default=list, blank=True,
                                       help_text='List of genre strings, e.g. ["rock", "jazz"]')
    favorite_artists = models.JSONField(default=list, blank=True,
                                        help_text='List of artist name strings')
    favorite_tracks = models.JSONField(default=list, blank=True,
                                       help_text='List of track identifiers or names')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"MusicPrefs of {self.profile.user.username}"


# ─── Friend system ────────────────────────────────────────────────────────────

class FriendRequestStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    ACCEPTED = 'accepted', 'Accepted'
    DECLINED = 'declined', 'Declined'
    BLOCKED = 'blocked', 'Blocked'


class FriendRequest(models.Model):
    """
    Directional friend request: sender → receiver.
    An accepted request means both users are "friends".
    """
    sender = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='sent_friend_requests'
    )
    receiver = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='received_friend_requests'
    )
    status = models.CharField(
        max_length=10,
        choices=FriendRequestStatus.choices,
        default=FriendRequestStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('sender', 'receiver')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sender} → {self.receiver} [{self.status}]"


# ─── Rooms ────────────────────────────────────────────────────────────────────

class RoomVisibility(models.TextChoices):
    PUBLIC = 'public', 'Public'
    PRIVATE = 'private', 'Private'


class RoomLicenseType(models.TextChoices):
    DEFAULT = 'default', 'Default (everyone)'
    INVITED = 'invited', 'Invited users only'
    LOCATION = 'location', 'Location / time restricted'


class RoomType(models.TextChoices):
    VOTE = 'vote', 'Music Track Vote'
    DELEGATION = 'delegation', 'Music Control Delegation'
    PLAYLIST = 'playlist', 'Music Playlist Editor'


class Room(models.Model):
    """
    Generic room that can host any of the three music services.
    The `room_type` field determines which service this room belongs to.
    """
    owner = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='owned_rooms'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    room_type = models.CharField(max_length=20, choices=RoomType.choices)
    visibility = models.CharField(
        max_length=10,
        choices=RoomVisibility.choices,
        default=RoomVisibility.PUBLIC,
    )
    license_type = models.CharField(
        max_length=20,
        choices=RoomLicenseType.choices,
        default=RoomLicenseType.DEFAULT,
    )
    # Location / time restriction (used when license_type == LOCATION)
    geo_lat = models.FloatField(null=True, blank=True, help_text='Latitude for location restriction')
    geo_lon = models.FloatField(null=True, blank=True, help_text='Longitude for location restriction')
    geo_radius_meters = models.PositiveIntegerField(null=True, blank=True,
                                                     help_text='Radius in meters for geo-fencing')
    active_from = models.DateTimeField(null=True, blank=True, help_text='Voting/editing allowed from')
    active_until = models.DateTimeField(null=True, blank=True, help_text='Voting/editing allowed until')

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.room_type}] {self.name}"

    def is_open(self):
        """Returns True if the room is currently within its active time window."""
        now = timezone.now()
        if self.active_from and now < self.active_from:
            return False
        if self.active_until and now > self.active_until:
            return False
        return self.is_active


class RoomMembershipStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    ACCEPTED = 'accepted', 'Accepted'
    DECLINED = 'declined', 'Declined'
    KICKED = 'kicked', 'Kicked'


class RoomMembership(models.Model):
    """Tracks who is a member (invited / accepted) of a private room."""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='room_memberships')
    status = models.CharField(
        max_length=10,
        choices=RoomMembershipStatus.choices,
        default=RoomMembershipStatus.PENDING,
    )
    invited_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_invitations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('room', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} in {self.room} [{self.status}]"


# ─── Action Logging ───────────────────────────────────────────────────────────

class ActionLog(models.Model):
    """
    Security / audit log — records every meaningful API action.
    Fields align with subject requirement IV.6:
      Log every action: Platform, Device, App Version.
    """
    user = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='action_logs'
    )
    action = models.CharField(max_length=100, help_text='Short action identifier, e.g. "login", "room_created"')
    detail = models.TextField(blank=True, help_text='JSON or human-readable extra context')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    platform = models.CharField(max_length=50, blank=True, help_text='e.g. "iOS", "Android", "Web"')
    device = models.CharField(max_length=100, blank=True, help_text='Device model or identifier')
    app_version = models.CharField(max_length=20, blank=True, help_text='Client app version, e.g. "1.2.3"')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.action}] user={self.user_id} @ {self.created_at}"


@receiver(post_save, sender=CustomUser)
def ensure_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)


@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    Profile.objects.get_or_create(user=instance)


# ===== BONUS FEATURES MODELS =====

class Notification(models.Model):
    """User notifications for friend activity, room invites, and system events."""
    
    NOTIFICATION_TYPES = [
        ('friend_request', 'Friend Request'),
        ('room_invite', 'Room Invitation'),
        ('song_added', 'Song Added to Room'),
        ('friend_online', 'Friend Came Online'),
        ('system', 'System Notification'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bonus_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    from_user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    is_read = models.BooleanField(default=False)
    related_room_id = models.IntegerField(null=True, blank=True)
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
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='bonus_analytics')
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
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bonus_listening_history')
    song_id = models.IntegerField()
    song_title = models.CharField(max_length=255)
    artist_name = models.CharField(max_length=255)
    genre = models.CharField(max_length=100, null=True, blank=True)
    listened_at = models.DateTimeField(auto_now_add=True)
    duration_listened = models.DurationField(default=timezone.timedelta(seconds=0))
    
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
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bonus_smart_playlists')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    playlist_type = models.CharField(max_length=20, choices=PLAYLIST_TYPES)
    songs = models.JSONField(default=list)
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
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bonus_recommendation_logs')
    recommendation_type = models.CharField(max_length=100)
    recommended_items = models.JSONField()
    was_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Recommendation - {self.recommendation_type} for {self.user.username}"

