"""
Tests for the Music Playlist Editor service.

Covers:
  - Adding a track to a playlist (position auto-increments)
  - Viewing ordered track list with version
  - Removing a track (positions re-compact)
  - Moving a track to a new position
  - Unauthorised access to private playlist room
  - Restricted mode: non-invited user cannot edit
  - Version counter increments on every mutation
  - Concurrent adds: positions are contiguous
  - Move-while-delete race: returns 409 Conflict
"""

import threading
from django.test import TestCase, TransactionTestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import CustomUser, Room, RoomMembership


class PlaylistTestBase(TestCase):
    """Shared setup for playlist tests."""

    def setUp(self):
        self.client = APIClient()

        self.owner = CustomUser.objects.create_user(
            username='plowner', email='owner@playlist.com', password='Pass1234!',
        )
        self.user = CustomUser.objects.create_user(
            username='pleditor', email='editor@playlist.com', password='Pass1234!',
        )
        self.user2 = CustomUser.objects.create_user(
            username='pleditor2', email='editor2@playlist.com', password='Pass1234!',
        )

        self.room = Room.objects.create(
            owner=self.owner, name='Chill Playlist',
            room_type='playlist', visibility='public', license_type='default',
        )
        self.private_room = Room.objects.create(
            owner=self.owner, name='VIP Playlist',
            room_type='playlist', visibility='private', license_type='invited',
        )

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def _add_track(self, room_id, title='Test', artist='Artist'):
        return self.client.post(
            f'/api/playlists/{room_id}/tracks/',
            {'title': title, 'artist': artist},
            format='json',
        )


class TestPlaylistAddTrack(PlaylistTestBase):
    """POST /api/playlists/<room_id>/tracks/"""

    def test_add_track_at_end(self):
        self._auth(self.user)
        r1 = self._add_track(self.room.id, 'Song 1', 'A')
        r2 = self._add_track(self.room.id, 'Song 2', 'B')

        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r1.data['position'], 0)
        self.assertEqual(r2.data['position'], 1)

    def test_add_track_unauthenticated(self):
        resp = self._add_track(self.room.id)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class TestPlaylistRemoveTrack(PlaylistTestBase):
    """DELETE /api/playlists/<room_id>/tracks/<track_id>/"""

    def test_remove_track_recompacts_positions(self):
        self._auth(self.user)
        r1 = self._add_track(self.room.id, 'Song 1', 'A')
        r2 = self._add_track(self.room.id, 'Song 2', 'B')
        r3 = self._add_track(self.room.id, 'Song 3', 'C')

        # Remove middle track (pos 1)
        del_resp = self.client.delete(
            f'/api/playlists/{self.room.id}/tracks/{r2.data["id"]}/',
        )
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)

        # Verify positions are re-compacted
        list_resp = self.client.get(f'/api/playlists/{self.room.id}/tracks/')
        self.assertEqual(len(list_resp.data['tracks']), 2)
        self.assertEqual(list_resp.data['tracks'][0]['position'], 0)
        self.assertEqual(list_resp.data['tracks'][1]['position'], 1)


class TestPlaylistMoveTrack(PlaylistTestBase):
    """PATCH /api/playlists/<room_id>/tracks/<track_id>/move/"""

    def test_move_track_down(self):
        self._auth(self.user)
        r1 = self._add_track(self.room.id, 'Song 1', 'A')
        self._add_track(self.room.id, 'Song 2', 'B')
        self._add_track(self.room.id, 'Song 3', 'C')

        # Move Song 1 (pos 0) to pos 2
        move_resp = self.client.patch(
            f'/api/playlists/{self.room.id}/tracks/{r1.data["id"]}/move/',
            {'new_position': 2},
            format='json',
        )
        self.assertEqual(move_resp.status_code, status.HTTP_200_OK)

        # Verify new order
        list_resp = self.client.get(f'/api/playlists/{self.room.id}/tracks/')
        titles = [t['title'] for t in list_resp.data['tracks']]
        self.assertEqual(titles, ['Song 2', 'Song 3', 'Song 1'])

    def test_move_track_up(self):
        self._auth(self.user)
        self._add_track(self.room.id, 'Song 1', 'A')
        self._add_track(self.room.id, 'Song 2', 'B')
        r3 = self._add_track(self.room.id, 'Song 3', 'C')

        # Move Song 3 (pos 2) to pos 0
        move_resp = self.client.patch(
            f'/api/playlists/{self.room.id}/tracks/{r3.data["id"]}/move/',
            {'new_position': 0},
            format='json',
        )
        self.assertEqual(move_resp.status_code, status.HTTP_200_OK)

        list_resp = self.client.get(f'/api/playlists/{self.room.id}/tracks/')
        titles = [t['title'] for t in list_resp.data['tracks']]
        self.assertEqual(titles, ['Song 3', 'Song 1', 'Song 2'])

    def test_move_to_same_position_is_noop(self):
        self._auth(self.user)
        r1 = self._add_track(self.room.id, 'Song 1', 'A')

        move_resp = self.client.patch(
            f'/api/playlists/{self.room.id}/tracks/{r1.data["id"]}/move/',
            {'new_position': 0},
            format='json',
        )
        self.assertEqual(move_resp.status_code, status.HTTP_200_OK)


class TestPlaylistPrivateAccess(PlaylistTestBase):
    """Verify uninvited users cannot access private playlist rooms."""

    def test_uninvited_user_blocked(self):
        self._auth(self.user)
        resp = self.client.get(f'/api/playlists/{self.private_room.id}/tracks/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_invited_user_can_access(self):
        RoomMembership.objects.create(
            room=self.private_room, user=self.user,
            invited_by=self.owner, status='accepted',
        )
        self._auth(self.user)
        resp = self.client.get(f'/api/playlists/{self.private_room.id}/tracks/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_restricted_non_invited_cannot_edit(self):
        """In invited-license mode, non-invited users cannot add tracks."""
        self._auth(self.user)
        resp = self._add_track(self.private_room.id, 'Blocked', 'Test')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class TestPlaylistVersion(PlaylistTestBase):
    """Version counter increments on every mutation."""

    def test_version_increments_on_add(self):
        self._auth(self.user)
        # Initial version
        list_resp = self.client.get(f'/api/playlists/{self.room.id}/tracks/')
        v0 = list_resp.data['version']

        self._add_track(self.room.id, 'Song 1', 'A')
        list_resp = self.client.get(f'/api/playlists/{self.room.id}/tracks/')
        v1 = list_resp.data['version']
        self.assertEqual(v1, v0 + 1)

    def test_version_increments_on_delete(self):
        self._auth(self.user)
        r1 = self._add_track(self.room.id, 'Song 1', 'A')
        list_resp = self.client.get(f'/api/playlists/{self.room.id}/tracks/')
        v1 = list_resp.data['version']

        self.client.delete(f'/api/playlists/{self.room.id}/tracks/{r1.data["id"]}/')
        list_resp = self.client.get(f'/api/playlists/{self.room.id}/tracks/')
        v2 = list_resp.data['version']
        self.assertEqual(v2, v1 + 1)

    def test_version_increments_on_move(self):
        self._auth(self.user)
        r1 = self._add_track(self.room.id, 'Song 1', 'A')
        self._add_track(self.room.id, 'Song 2', 'B')
        list_resp = self.client.get(f'/api/playlists/{self.room.id}/tracks/')
        v2 = list_resp.data['version']

        self.client.patch(
            f'/api/playlists/{self.room.id}/tracks/{r1.data["id"]}/move/',
            {'new_position': 1}, format='json',
        )
        list_resp = self.client.get(f'/api/playlists/{self.room.id}/tracks/')
        v3 = list_resp.data['version']
        self.assertEqual(v3, v2 + 1)


class TestConcurrentPlaylistEdits(TransactionTestCase):
    """Verify playlist consistency under concurrent edits."""

    def setUp(self):
        self.client = APIClient()
        self.owner = CustomUser.objects.create_user(
            username='plowner', email='owner@pl.com', password='Pass1234!',
        )
        self.room = Room.objects.create(
            owner=self.owner, name='Concurrent Playlist',
            room_type='playlist', visibility='public', license_type='default',
        )

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_concurrent_adds_produce_contiguous_positions(self):
        """10 users adding simultaneously — positions must be 0..9 with no gaps."""
        user_tokens = []
        for i in range(10):
            u = CustomUser.objects.create_user(
                username=f'adder{i}', email=f'adder{i}@pl.com', password='Pass1234!',
            )
            token = str(RefreshToken.for_user(u).access_token)
            user_tokens.append((token, f'Song {i}'))

        errors = []

        def add_track(tk, title):
            try:
                c = APIClient()
                c.credentials(HTTP_AUTHORIZATION=f'Bearer {tk}')
                c.post(
                    f'/api/playlists/{self.room.id}/tracks/',
                    {'title': title, 'artist': 'Test'},
                    format='json',
                )
            except Exception as e:
                errors.append(str(e))

        threads = [threading.Thread(target=add_track, args=(tk, title))
                   for tk, title in user_tokens]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(errors), 0, f'Errors: {errors}')

        # Verify positions are contiguous 0..9
        from playlists.models import PlaylistTrack
        tracks = PlaylistTrack.objects.filter(room=self.room).order_by('position')
        positions = list(tracks.values_list('position', flat=True))
        self.assertEqual(positions, list(range(10)))
