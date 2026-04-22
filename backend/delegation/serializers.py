"""
Serializers for the Music Control Delegation service.
"""

from rest_framework import serializers
from .models import DeviceDelegation, ControlAction


class DeviceDelegationSerializer(serializers.ModelSerializer):
    """Read serializer — full delegation info."""
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    delegated_to_id = serializers.IntegerField(
        source='delegated_to.id', read_only=True, allow_null=True,
    )
    delegated_to_username = serializers.CharField(
        source='delegated_to.username', read_only=True, allow_null=True,
    )

    class Meta:
        model = DeviceDelegation
        fields = [
            'id', 'room', 'device_identifier', 'device_name',
            'owner_id', 'owner_username',
            'delegated_to_id', 'delegated_to_username',
            'status', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class RegisterDeviceSerializer(serializers.Serializer):
    """Input when registering a new device in a delegation room."""
    device_identifier = serializers.CharField(
        max_length=255,
        help_text='Unique device ID from the mobile app (e.g. UUID).',
    )
    device_name = serializers.CharField(
        max_length=255,
        help_text='Human-readable name (e.g. "Living Room Speaker").',
    )


class DelegateControlSerializer(serializers.Serializer):
    """Input when delegating control to a friend."""
    friend_id = serializers.IntegerField(
        help_text='User ID of the friend to delegate control to.',
    )


class ControlActionSerializer(serializers.Serializer):
    """Input for sending a playback control action."""
    action_id = serializers.CharField(
        max_length=64,
        help_text='Unique idempotency key (UUID recommended). Same action_id on same device = no re-execution.',
    )
    action_type = serializers.ChoiceField(
        choices=['play', 'pause', 'skip', 'previous'],
        help_text='The playback action to perform.',
    )


class ControlActionResponseSerializer(serializers.ModelSerializer):
    """Response after a control action is executed."""
    performed_by_id = serializers.IntegerField(source='performed_by.id', read_only=True)
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)

    class Meta:
        model = ControlAction
        fields = [
            'id', 'device', 'action_id', 'action_type',
            'performed_by_id', 'performed_by_username',
            'created_at',
        ]
        read_only_fields = fields


class RevokeControlSerializer(serializers.Serializer):
    """
    No body required — the device is identified by URL.
    Exists for documentation purposes.
    """
    pass
