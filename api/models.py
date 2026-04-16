from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid
from datetime import timedelta
from django.conf import settings


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
    
    # Standard image upload for local avatars
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    # Added for easy frontend mock data & external Spotify/Google avatars
    avatar_url = models.URLField(blank=True, null=True, default='https://i.pravatar.cc/100')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    phone_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile of {self.user.username}"


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
    
    # --- New fields added to support Frontend Mock Data ---
    cover_image = models.URLField(blank=True, null=True, help_text="URL for the room's cover art")
    is_live = models.BooleanField(default=False, help_text="Is the room currently active/live?")
    genres = models.JSONField(default=list, blank=True, help_text='List of genres e.g., ["Pop", "EDM"]')
    participant_count = models.IntegerField(default=0, help_text="Number of listeners currently in the room")
    # ------------------------------------------------------

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