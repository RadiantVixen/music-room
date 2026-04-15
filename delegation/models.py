"""
Models for the Music Control Delegation service.

A Room with room_type='delegation' lets users register devices
and delegate music playback control to friends.

Consistency Model: Strict Server Ordering
─────────────────────────────────────────
All delegation mutations (delegate, revoke, control actions) are
serialised through ``select_for_update()`` + ``transaction.atomic()``.
This guarantee means:
  - No two users can simultaneously modify the same device's delegation state
  - Control actions are validated against the CURRENT delegation state
  - Idempotency is guaranteed via ``action_id`` on ControlAction
"""

from django.db import models
from django.conf import settings
from api.models import Room


class DelegationStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    REVOKED = 'revoked', 'Revoked'


class DeviceDelegation(models.Model):
    """
    Represents a device registered in a delegation-type room.
    The owner can delegate control to a friend, who then
    controls playback via the mobile app.
    """
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='delegations',
        help_text='The delegation-type room.',
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_delegations',
        help_text='The user who owns this device.',
    )
    device_identifier = models.CharField(
        max_length=255,
        help_text='Unique device ID (e.g. UUID from the mobile app).',
    )
    device_name = models.CharField(
        max_length=255,
        help_text='Human-readable device name (e.g. "Living Room Speaker").',
    )
    delegated_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='delegated_controls',
        help_text='The friend who currently has control (null = owner controls).',
    )
    status = models.CharField(
        max_length=10,
        choices=DelegationStatus.choices,
        default=DelegationStatus.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('room', 'device_identifier')
        ordering = ['-created_at']

    def __str__(self):
        delegate = self.delegated_to or 'owner'
        return f'{self.device_name} → {delegate} [{self.status}]'


class ActionType(models.TextChoices):
    PLAY = 'play', 'Play'
    PAUSE = 'pause', 'Pause'
    SKIP = 'skip', 'Skip Next'
    PREVIOUS = 'previous', 'Previous'


class ControlAction(models.Model):
    """
    Records a single playback control action on a device.

    Idempotency: The ``action_id`` field is unique per device.
    If a client sends the same action_id twice, the second request
    returns 200 with the existing action (no re-execution).
    This prevents duplicate plays/skips from network retries.
    """
    device = models.ForeignKey(
        DeviceDelegation,
        on_delete=models.CASCADE,
        related_name='actions',
    )
    action_id = models.CharField(
        max_length=64,
        help_text='Client-provided idempotency key (e.g. UUID). Unique per device.',
    )
    action_type = models.CharField(
        max_length=10,
        choices=ActionType.choices,
    )
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='control_actions',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('device', 'action_id')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action_type} on {self.device.device_name} by {self.performed_by}'
