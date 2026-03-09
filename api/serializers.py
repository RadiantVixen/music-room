from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser, Profile
from django.utils.text import slugify
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
    phone = serializers.CharField(
        write_only=True,
        help_text='Your phone number (required).',
    )
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
        fields = ['full_name', 'phone', 'email', 'password', 'confirm_password']

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
        phone = validated_data.pop('phone', '')
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

        # Save phone to profile
        try:
            profile = user.profile
            profile.phone = phone
            profile.save(update_fields=['phone'])
        except Exception:
            pass  # Profile may not exist yet in all edge cases

        return user


class LogoutSerializer(serializers.Serializer):
    """Send the refresh token to blacklist it."""
    refresh_token = serializers.CharField(help_text='The refresh token received at login')


class TokenRefreshSerializer(serializers.Serializer):
    """Used to get a new access token using a refresh token."""
    refresh = serializers.CharField(help_text='A valid, non-blacklisted refresh token')


class ForgotPasswordSerializer(serializers.Serializer):
    """Send password reset email."""
    email = serializers.EmailField(help_text='The email address linked to your account')


class ResetPasswordSerializer(serializers.Serializer):
    """Reset password using the link from the email."""
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


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)
    password = serializers.CharField(write_only=True, required=False)
    username = serializers.CharField(required=False)
    first_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'email', 'password', 'role', 'profile']
        read_only_fields = ['id', 'role']

    def to_internal_value(self, data):
        """
        Multipart form sends profile fields as 'profile.phone', 'profile.avatar' etc.
        Rebuild the nested 'profile' dict before standard validation runs.
        """
        mutable = data.copy() if hasattr(data, 'copy') else dict(data)
        profile_dict = {}
        keys_to_remove = []
        for key in list(mutable.keys()):
            if key.startswith('profile.'):
                field_name = key[len('profile.'):]
                profile_dict[field_name] = mutable[key]
                keys_to_remove.append(key)
        for k in keys_to_remove:
            del mutable[k]
        if profile_dict:
            # Merge with any already-nested profile dict
            existing = mutable.get('profile', {})
            if not isinstance(existing, dict):
                existing = {}
            existing.update(profile_dict)
            mutable['profile'] = existing
        return super().to_internal_value(mutable)

    # CREATE
    def create(self, validated_data):
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)

        # Prevent users from setting privileged roles
        if validated_data.get('role') in ['ADMIN', 'STAFF']:
            raise serializers.ValidationError("You cannot assign this role manually.")

        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)
        user.save()

        # Auto-create profile
        # Profile.objects.create(user=user, **(profile_data or {}))
        return user

    # UPDATE
    def update(self, instance, validated_data):
        # Update top-level user fields
        username = validated_data.get('username')
        if username:
            instance.username = username
        email = validated_data.get('email')
        if email:
            instance.email = email
        first_name = validated_data.get('first_name')
        if first_name is not None:
            instance.first_name = first_name
        instance.save()

        # Update profile fields (nested dict from to_internal_value)
        profile_data = validated_data.get('profile', {})
        profile = instance.profile
        for field in ('bio', 'phone', 'location'):
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


