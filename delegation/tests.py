"""
Tests for the Music Control Delegation service.

Covers:
  - Registering a device
  - Delegating control to a friend (with select_for_update)
  - Revoking delegation
  - Checking device status
  - Non-owner cannot delegate or revoke
  - Duplicate device prevention
  - Control actions: owner, delegate, and stranger permissions
  - Action idempotency (same action_id only executes once)
  - Concurrent delegation safety
"""

import threading
import uuid
from django.test import TestCase, TransactionTestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import CustomUser, Room


class DelegationTestBase(TestCase):
    """Shared setup for delegation tests."""

    def setUp(self):
        self.client = APIClient()

        self.owner = CustomUser.objects.create_user(
            username='devowner', email='owner@delegation.com', password='Pass1234!',
        )
        self.friend = CustomUser.objects.create_user(
            username='friend1', email='friend@delegation.com', password='Pass1234!',
        )
        self.stranger = CustomUser.objects.create_user(
            username='stranger', email='stranger@delegation.com', password='Pass1234!',
        )

        self.room = Room.objects.create(
            owner=self.owner, name='Delegation Room',
            room_type='delegation', visibility='public', license_type='default',
        )

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def _register_device(self, room=None, ident='uuid-123', name='Speaker'):
        room = room or self.room
        return self.client.post(
            f'/api/delegation/{room.id}/devices/',
            {'device_identifier': ident, 'device_name': name},
            format='json',
        )


class TestRegisterDevice(DelegationTestBase):
    """POST /api/delegation/<room_id>/devices/"""

    def test_register_device_success(self):
        self._auth(self.owner)
        resp = self._register_device(name='Living Room Speaker')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['device_name'], 'Living Room Speaker')
        self.assertEqual(resp.data['status'], 'active')

    def test_duplicate_device_rejected(self):
        self._auth(self.owner)
        self._register_device(ident='uuid-dup')
        resp = self._register_device(ident='uuid-dup', name='Speaker 2')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class TestDelegateControl(DelegationTestBase):
    """POST /api/delegation/<room_id>/devices/<device_id>/delegate/"""

    def test_delegate_control_success(self):
        self._auth(self.owner)
        cr = self._register_device(ident='uuid-456', name='Kitchen Speaker')
        device_id = cr.data['id']

        resp = self.client.post(
            f'/api/delegation/{self.room.id}/devices/{device_id}/delegate/',
            {'friend_id': self.friend.id}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['delegated_to_id'], self.friend.id)
        self.assertEqual(resp.data['status'], 'active')

    def test_delegate_to_self_rejected(self):
        self._auth(self.owner)
        cr = self._register_device(ident='uuid-self')
        device_id = cr.data['id']

        resp = self.client.post(
            f'/api/delegation/{self.room.id}/devices/{device_id}/delegate/',
            {'friend_id': self.owner.id}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_owner_cannot_delegate(self):
        self._auth(self.owner)
        cr = self._register_device(ident='uuid-notmine')
        device_id = cr.data['id']

        self._auth(self.stranger)
        resp = self.client.post(
            f'/api/delegation/{self.room.id}/devices/{device_id}/delegate/',
            {'friend_id': self.friend.id}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class TestRevokeControl(DelegationTestBase):
    """POST /api/delegation/<room_id>/devices/<device_id>/revoke/"""

    def test_revoke_delegation(self):
        self._auth(self.owner)
        cr = self._register_device(ident='uuid-revoke')
        device_id = cr.data['id']

        # Delegate first
        self.client.post(
            f'/api/delegation/{self.room.id}/devices/{device_id}/delegate/',
            {'friend_id': self.friend.id}, format='json',
        )
        # Then revoke
        resp = self.client.post(
            f'/api/delegation/{self.room.id}/devices/{device_id}/revoke/',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsNone(resp.data['delegated_to_id'])
        self.assertEqual(resp.data['status'], 'revoked')

    def test_non_owner_cannot_revoke(self):
        self._auth(self.owner)
        cr = self._register_device(ident='uuid-norevoke')
        device_id = cr.data['id']
        self.client.post(
            f'/api/delegation/{self.room.id}/devices/{device_id}/delegate/',
            {'friend_id': self.friend.id}, format='json',
        )

        # Friend tries to revoke
        self._auth(self.friend)
        resp = self.client.post(
            f'/api/delegation/{self.room.id}/devices/{device_id}/revoke/',
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class TestDeviceStatus(DelegationTestBase):
    """GET /api/delegation/<room_id>/devices/<device_id>/status/"""

    def test_get_device_status(self):
        self._auth(self.owner)
        cr = self._register_device(ident='uuid-status')
        device_id = cr.data['id']

        resp = self.client.get(
            f'/api/delegation/{self.room.id}/devices/{device_id}/status/',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['device_name'], 'Speaker')


class TestControlAction(DelegationTestBase):
    """POST /api/delegation/<room_id>/devices/<device_id>/control/"""

    def setUp(self):
        super().setUp()
        self._auth(self.owner)
        cr = self._register_device(ident='uuid-ctrl', name='Control Speaker')
        self.device_id = cr.data['id']

    def test_owner_can_control(self):
        """Device owner can always send control actions."""
        self._auth(self.owner)
        resp = self.client.post(
            f'/api/delegation/{self.room.id}/devices/{self.device_id}/control/',
            {'action_id': str(uuid.uuid4()), 'action_type': 'play'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['action_type'], 'play')

    def test_delegated_user_can_control(self):
        """Delegated friend can send control actions."""
        self._auth(self.owner)
        self.client.post(
            f'/api/delegation/{self.room.id}/devices/{self.device_id}/delegate/',
            {'friend_id': self.friend.id}, format='json',
        )
        self._auth(self.friend)
        resp = self.client.post(
            f'/api/delegation/{self.room.id}/devices/{self.device_id}/control/',
            {'action_id': str(uuid.uuid4()), 'action_type': 'skip'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['action_type'], 'skip')

    def test_stranger_cannot_control(self):
        """Non-owner, non-delegate cannot control."""
        self._auth(self.stranger)
        resp = self.client.post(
            f'/api/delegation/{self.room.id}/devices/{self.device_id}/control/',
            {'action_id': str(uuid.uuid4()), 'action_type': 'pause'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_revoked_delegate_cannot_control(self):
        """After revocation, the friend loses control."""
        self._auth(self.owner)
        self.client.post(
            f'/api/delegation/{self.room.id}/devices/{self.device_id}/delegate/',
            {'friend_id': self.friend.id}, format='json',
        )
        self.client.post(
            f'/api/delegation/{self.room.id}/devices/{self.device_id}/revoke/',
        )
        self._auth(self.friend)
        resp = self.client.post(
            f'/api/delegation/{self.room.id}/devices/{self.device_id}/control/',
            {'action_id': str(uuid.uuid4()), 'action_type': 'play'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_idempotency_same_action_id(self):
        """Same action_id on same device returns 200, does not re-execute."""
        self._auth(self.owner)
        aid = str(uuid.uuid4())
        r1 = self.client.post(
            f'/api/delegation/{self.room.id}/devices/{self.device_id}/control/',
            {'action_id': aid, 'action_type': 'skip'}, format='json',
        )
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)

        r2 = self.client.post(
            f'/api/delegation/{self.room.id}/devices/{self.device_id}/control/',
            {'action_id': aid, 'action_type': 'skip'}, format='json',
        )
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        # Same action returned — not a new one
        self.assertEqual(r1.data['id'], r2.data['id'])

    def test_all_action_types(self):
        """Verify all four action types work."""
        self._auth(self.owner)
        for action in ['play', 'pause', 'skip', 'previous']:
            resp = self.client.post(
                f'/api/delegation/{self.room.id}/devices/{self.device_id}/control/',
                {'action_id': str(uuid.uuid4()), 'action_type': action},
                format='json',
            )
            self.assertEqual(resp.status_code, status.HTTP_201_CREATED, f'{action} failed')
            self.assertEqual(resp.data['action_type'], action)


class TestConcurrentDelegation(TransactionTestCase):
    """Verify concurrent delegation safety with select_for_update."""

    def setUp(self):
        self.client = APIClient()
        self.owner = CustomUser.objects.create_user(
            username='devowner', email='owner@delegation.com', password='Pass1234!',
        )
        self.friend1 = CustomUser.objects.create_user(
            username='friend1', email='f1@d.com', password='Pass1234!',
        )
        self.friend2 = CustomUser.objects.create_user(
            username='friend2', email='f2@d.com', password='Pass1234!',
        )
        self.room = Room.objects.create(
            owner=self.owner, name='Delegation Room',
            room_type='delegation', visibility='public', license_type='default',
        )

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_concurrent_delegation_no_corruption(self):
        """Two concurrent delegates: one wins, final state is consistent."""
        self._auth(self.owner)
        cr = self.client.post(
            f'/api/delegation/{self.room.id}/devices/',
            {'device_identifier': 'uuid-race', 'device_name': 'Race Speaker'},
            format='json',
        )
        device_id = cr.data['id']

        # Pre-generate tokens
        token = str(RefreshToken.for_user(self.owner).access_token)

        results = {}

        def delegate_to(friend_id, label):
            c = APIClient()
            c.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            r = c.post(
                f'/api/delegation/{self.room.id}/devices/{device_id}/delegate/',
                {'friend_id': friend_id}, format='json',
            )
            results[label] = r.status_code

        t1 = threading.Thread(target=delegate_to, args=(self.friend1.id, 'f1'))
        t2 = threading.Thread(target=delegate_to, args=(self.friend2.id, 'f2'))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        # Both should succeed (one after the other due to locking)
        self.assertEqual(results.get('f1'), 200, f'Results: {results}')
        self.assertEqual(results.get('f2'), 200, f'Results: {results}')

        # Final state: delegated_to should be one of the two (not corrupted)
        from delegation.models import DeviceDelegation
        device = DeviceDelegation.objects.get(pk=device_id)
        self.assertIn(device.delegated_to_id, [self.friend1.id, self.friend2.id])
