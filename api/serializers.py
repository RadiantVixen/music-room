from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser, Profile, MusicPreferences, FriendRequest, Room, RoomMembership
from django.utils.text import slugify
from django.db.models import Q
import re


def validate_password_strength(password: str) -> str:
    """
    Shared password strength validator used by Register, ChangePassword, and ResetPassword.
    Rules:
      - At least 8 characters
      - At least one uppercase letter (A-Z)
      - At least one lowercase letter (a-z)
      - At least one digit (0-9)
      - At least one special character (!@#$%^&* etc.)
    """
    errors = []
    if len(password) < 8:
        errors.append('at least 8 characters')
    if not re.search(r'[A-Z]', password):
        errors.append('at least one uppercase letter')
    if not re.search(r'[a-z]', password):
        errors.append('at least one lowercase letter')
    if not re.search(r'\d', password):
        errors.append('at least one number')
    if not re.search(r'[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\/;\'\'`~]', password):
        errors.append('at least one special character (!@#$%^&* …)')
    if errors:
        raise serializers.ValidationError(
            'Password must contain: ' + ', '.join(errors) + '.'
        )
    return password


class LoginSerializer(serializers.Serializer):
    """Used for login endpoint — email + password."""
    email = serializers.EmailField(help_text='Your registered email address')
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Your password',
    )


class TokenResponseSerializer(serializers.Serializer):
    """JWT token pair returned after login or social login."""
    access = serializers.CharField(help_text='JWT access token — lifetime: 1 day. Add as: Authorization: Bearer <access>')
    refresh = serializers.CharField(help_text='JWT refresh token — lifetime: 30 days. Send to /api/token/refresh/ to get a new access token')


class RegisterSerializer(serializers.ModelSerializer):
    """User registration — requires full name + phone + email + password confirmation."""
    full_name = serializers.CharField(
        write_only=True,
        help_text='Your full name (used to generate username).',
    )
    # phone = serializers.CharField(
    #     write_only=True,
    #     help_text='Your phone number (required).',
    # )
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Min 8 chars, must include uppercase, lowercase, number and special character.',
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Must match password.',
    )

    class Meta:
        model = CustomUser
        fields = ['full_name', 'email', 'password', 'confirm_password']

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        full_name = validated_data.pop('full_name')
        # phone = validated_data.pop('phone', '')
        validated_data.pop('confirm_password', None)
        email = validated_data['email']

        # create with a provisional unique username (email) to satisfy constraints
        user = CustomUser(
            email=email,
            username=email,
            first_name=full_name,
        )
        user.set_password(validated_data['password'])
        user.save()

        safe_name = slugify(full_name) or 'user'
        user.username = f"{user.id}{safe_name}"
        user.save(update_fields=['username'])

        profile, _ = Profile.objects.get_or_create(user=user)
        # profile.phone = phone
        # profile.save(update_fields=['phone'])

        return user


class LogoutSerializer(serializers.Serializer):
    """Send the refresh token to blacklist it."""
    refresh_token = serializers.CharField(help_text='The refresh token received at login')


class TokenRefreshSerializer(serializers.Serializer):
    """Used to get a new access token using a refresh token."""
    refresh = serializers.CharField(help_text='A valid, non-blacklisted refresh token')


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text='The email address linked to your account')


class VerifyResetCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text='The email address linked to your account')
    code = serializers.CharField(
        min_length=6,
        max_length=6,
        help_text='6-digit reset code sent by email',
    )

    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('Code must contain only digits.')
        return value


class ResetPasswordSerializer(serializers.Serializer):
    reset_token = serializers.UUIDField(help_text='Temporary reset token returned after code verification')
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Min 8 chars, must include uppercase, lowercase, number and special character.',
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Must match password',
    )

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

class UpdateProfileSerializer(serializers.Serializer):
    """Patch the authenticated user's profile. All fields optional."""
    username = serializers.CharField(required=False, help_text='New display name')
    bio = serializers.CharField(required=False, allow_blank=True, help_text='Short bio')
    phone = serializers.CharField(required=False, allow_blank=True, help_text='Phone number')
    location = serializers.CharField(required=False, allow_blank=True, help_text='City / country')
    avatar = serializers.ImageField(required=False, help_text='Profile picture — JPEG/PNG/WEBP, max 2 MB (multipart/form-data)')

    def validate_avatar(self, image):
        # Max 2 MB
        max_size = 2 * 1024 * 1024
        if image.size > max_size:
            raise serializers.ValidationError('Avatar image must be smaller than 2 MB.')
        # Only allow safe image types
        allowed_types = ('image/jpeg', 'image/png', 'image/webp')
        if image.content_type not in allowed_types:
            raise serializers.ValidationError('Only JPEG, PNG, and WEBP images are allowed.')
        return image


class SocialLoginSerializer(serializers.Serializer):
    """Social login via Google or Facebook."""
    provider = serializers.ChoiceField(
        choices=['google', 'facebook'],
        help_text='"google" → send the id_token from Google Sign-In. "facebook" → send the access_token from Facebook Login.',
    )
    token = serializers.CharField(
        help_text='ID token (Google) or access token (Facebook)',
    )

class ProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Profile
        fields = [
            'avatar',
            'bio',
            'location',
            'provider',
            'phone',
            'phone_verified',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['phone_verified']
        read_only_fields = ['created_at', 'updated_at']

    def get_avatar(self, obj):
        request = self.context.get('request')
        if obj.avatar and hasattr(obj.avatar, 'url'):
            return request.build_absolute_uri(obj.avatar.url)
        return None

class UserStatsSerializer(serializers.Serializer):
    rooms_count = serializers.IntegerField()
    friends_count = serializers.IntegerField()
    vibes_count = serializers.IntegerField()


class NestedMusicPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = MusicPreferences
        fields = ['favorite_genres', 'favorite_artists', 'favorite_tracks', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    username = serializers.CharField(required=False)
    first_name = serializers.CharField(required=False, allow_blank=True)

    music_preferences = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'first_name',
            'email',
            'password',
            'role',
            'profile',
            'music_preferences',
            'stats',
        ]
        read_only_fields = ['id', 'role', 'music_preferences', 'stats']

    def get_music_preferences(self, obj):
        try:
            prefs = obj.profile.music_preferences
            return NestedMusicPreferencesSerializer(prefs).data
        except MusicPreferences.DoesNotExist:
            return {
                'favorite_genres': [],
                'favorite_artists': [],
                'favorite_tracks': [],
                'updated_at': None,
            }

    def get_stats(self, obj):
        rooms_count = Room.objects.filter(owner=obj).count()

        friends_count = FriendRequest.objects.filter(
            status='accepted'
        ).filter(
            Q(sender=obj) | Q(receiver=obj)
        ).count()

        return {
            'rooms_count': rooms_count,
            'friends_count': friends_count,
            'vibes_count': 0,
        }
    def update(self, instance, validated_data):
        # ===== Update user fields =====
        if 'username' in validated_data:
            instance.username = validated_data['username']

        if 'email' in validated_data:
            instance.email = validated_data['email']

        if 'first_name' in validated_data:
            instance.first_name = validated_data['first_name']

        instance.save()

        # ===== 🔥 Extract profile data manually =====
        request = self.context.get('request')
        profile_data = {}

        if request:
            # Case 1: "profile.bio"
            for key, value in request.data.items():
                if key.startswith('profile.'):
                    field = key.split('profile.')[1]
                    profile_data[field] = value

            # Case 2: nested JSON { profile: { bio: ... } }
            if 'profile' in request.data and isinstance(request.data['profile'], dict):
                profile_data.update(request.data['profile'])

        # ===== Update profile =====
        profile = instance.profile

        for field in ['bio', 'phone', 'location']:
            if field in profile_data:
                setattr(profile, field, profile_data[field])

        if 'avatar' in profile_data and profile_data['avatar']:
            profile.avatar = profile_data['avatar']

        profile.save()

        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='Min 8 chars, must include uppercase, lowercase, number and special character.',
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
    )

    def validate_new_password(self, value):
        return validate_password_strength(value)

    def validate(self, attrs):
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        return attrs


# ─── Custom JWT claims ────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        return token


# ─── Music Preferences ────────────────────────────────────────────────────────

class MusicPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = MusicPreferences
        fields = ['favorite_genres', 'favorite_artists', 'favorite_tracks', 'updated_at']
        read_only_fields = ['updated_at']


# ─── Friend System ────────────────────────────────────────────────────────────

class FriendRequestSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_id = serializers.IntegerField(source='receiver.id', read_only=True)
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = FriendRequest
        fields = [
            'id', 'sender_id', 'sender_email', 'sender_username',
            'receiver_id', 'receiver_email', 'receiver_username',
            'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at',
                            'sender_id', 'sender_email', 'sender_username',
                            'receiver_id', 'receiver_email', 'receiver_username']


class SendFriendRequestSerializer(serializers.Serializer):
    receiver_id = serializers.IntegerField(help_text='ID of the user to send a friend request to')

    def validate_receiver_id(self, value):
        if not CustomUser.objects.filter(pk=value).exists():
            raise serializers.ValidationError('User not found.')
        return value


class FriendRequestActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=['accept', 'decline', 'block'],
        help_text='"accept", "decline" or "block"',
    )


class PublicUserSerializer(serializers.ModelSerializer):
    """Minimal public info about a user — used in friend lists."""
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'email', 'avatar']

    def get_avatar(self, obj):
        request = self.context.get('request')
        try:
            if obj.profile.avatar:
                return request.build_absolute_uri(obj.profile.avatar.url) if request else obj.profile.avatar.url
        except Exception:
            pass
        return None

class FriendProfileSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    music_preferences = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    relationship = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'first_name',
            'email',
            'profile',
            'music_preferences',
            'stats',
            'relationship',
        ]

    def get_music_preferences(self, obj):
        try:
            prefs = obj.profile.music_preferences
            return NestedMusicPreferencesSerializer(prefs).data
        except MusicPreferences.DoesNotExist:
            return {
                'favorite_genres': [],
                'favorite_artists': [],
                'favorite_tracks': [],
                'updated_at': None,
            }

    def get_stats(self, obj):
        rooms_count = Room.objects.filter(owner=obj).count()

        friends_count = FriendRequest.objects.filter(
            status='accepted'
        ).filter(
            Q(sender=obj) | Q(receiver=obj)
        ).count()

        return {
            'rooms_count': rooms_count,
            'friends_count': friends_count,
            'vibes_count': 0,
        }

    def get_relationship(self, obj):
        request = self.context.get('request')
        me = request.user if request else None

        if not me or me.id == obj.id:
            return {
                'status': 'self',
                'request_id': None,
                'is_friend': False,
                'can_add_friend': False,
                'can_unfriend': False,
                'can_block': False,
            }

        relation = FriendRequest.objects.filter(
            Q(sender=me, receiver=obj) | Q(sender=obj, receiver=me)
        ).order_by('-updated_at').first()

        if not relation:
            return {
                'status': 'none',
                'request_id': None,
                'is_friend': False,
                'can_add_friend': True,
                'can_unfriend': False,
                'can_block': True,
            }

        if relation.status == 'accepted':
            return {
                'status': 'friends',
                'request_id': relation.id,
                'is_friend': True,
                'can_add_friend': False,
                'can_unfriend': True,
                'can_block': True,
            }

        if relation.status == 'pending':
            if relation.sender_id == me.id:
                status_value = 'request_sent'
            else:
                status_value = 'request_received'

            return {
                'status': status_value,
                'request_id': relation.id,
                'is_friend': False,
                'can_add_friend': False,
                'can_unfriend': False,
                'can_block': True,
            }

        if relation.status == 'blocked':
            return {
                'status': 'blocked',
                'request_id': relation.id,
                'is_friend': False,
                'can_add_friend': False,
                'can_unfriend': False,
                'can_block': False,
            }

        return {
            'status': relation.status,
            'request_id': relation.id,
            'is_friend': False,
            'can_add_friend': False,
            'can_unfriend': False,
            'can_block': True,
        }
# ─── Rooms ────────────────────────────────────────────────────────────────────

class RoomMembershipSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    invited_by_id = serializers.IntegerField(source='invited_by.id', read_only=True, allow_null=True)

    class Meta:
        model = RoomMembership
        fields = [
            'id', 'user_id', 'user_email', 'user_username',
            'status', 'invited_by_id', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class RoomSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    member_count = serializers.SerializerMethodField()
    is_open = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'owner_id', 'owner_username', 'name', 'description',
            'room_type', 'visibility', 'license_type',
            'geo_lat', 'geo_lon', 'geo_radius_meters',
            'active_from', 'active_until',
            'is_active', 'is_open', 'member_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner_id', 'owner_username', 'created_at', 'updated_at', 'is_open', 'member_count']

    def get_member_count(self, obj):
        return obj.memberships.filter(status='accepted').count()

    def get_is_open(self, obj):
        return obj.is_open()

    def validate(self, attrs):
        license_type = attrs.get('license_type', 'default')
        if license_type == 'location':
            if not all([attrs.get('geo_lat'), attrs.get('geo_lon'), attrs.get('geo_radius_meters')]):
                raise serializers.ValidationError(
                    'geo_lat, geo_lon and geo_radius_meters are required for location-restricted rooms.'
                )
        return attrs


class RoomCreateSerializer(RoomSerializer):
    class Meta(RoomSerializer.Meta):
        read_only_fields = ['id', 'owner_id', 'owner_username', 'created_at', 'updated_at', 'is_open', 'member_count']


class InviteToRoomSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(help_text='ID of the user to invite to the room')

    def validate_user_id(self, value):
        if not CustomUser.objects.filter(pk=value).exists():
            raise serializers.ValidationError('User not found.')
        return value


class RoomMembershipActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=['accept', 'decline'],
        help_text='"accept" or "decline" the invitation',
    )
