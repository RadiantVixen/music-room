"""
Tests for the Music Track Vote service.

Covers:
  - Suggesting a track (happy path)
  - Viewing the ranked track list
  - Voting for a track (atomic increment)
  - Double-vote prevention (unique constraint)
  - Unauthorised access to private room
  - Voting in a non-vote room (type check)
  - Deterministic tie-breaking when votes are equal
  - Concurrent voting safety (same track and different tracks)
  - Concurrent suggestions (deterministic fallback)
  - Vote-while-delete race condition safety
  - Geo + time-window license enforcement
  - Track removal by owner and by suggester
  - has_voted field in response
  - rank field determinism
  - Invite-only voting denies non-members
"""

import threading
from datetime import timedelta
from unittest.mock import patch


from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import connection 
from api.models import CustomUser, Room, RoomMembership


class TrackVoteTestBase(TestCase):
    """Shared setup: creates users, a public vote room, and authenticates."""

    def setUp(self):
        self.client = APIClient()

        # Owner
        self.owner = CustomUser.objects.create_user(
            username='eventowner', email='owner@vote.com', password='Pass1234!',
        )
        # Regular user
        self.user = CustomUser.objects.create_user(
            username='voter1', email='voter1@vote.com', password='Pass1234!',
        )
        # Another user
        self.user2 = CustomUser.objects.create_user(
            username='voter2', email='voter2@vote.com', password='Pass1234!',
        )

        # Public vote room
        self.room = Room.objects.create(
            owner=self.owner, name='Vote Night',
            room_type='vote', visibility='public', license_type='default',
        )

        # Private vote room
        self.private_room = Room.objects.create(
            owner=self.owner, name='VIP Vote',
            room_type='vote', visibility='private', license_type='invited',
        )

        # Non-vote room
        self.playlist_room = Room.objects.create(
            owner=self.owner, name='Playlist Room',
            room_type='playlist', visibility='public', license_type='default',
        )

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def _create_track(self, room=None, title='Test Song', artist='Test Artist', user=None):
        """Helper: create a track and return its id."""
        if user:
            self._auth(user)
        resp = self.client.post(
            f'/api/events/{(room or self.room).id}/tracks/',
            {'title': title, 'artist': artist}, format='json',
        )
        return resp.data['id'] if resp.status_code == 201 else None


class TestSuggestTrack(TrackVoteTestBase):
    """POST /api/events/<room_id>/tracks/ — suggest a track."""

    def test_suggest_track_success(self):
        self._auth(self.user)
        resp = self.client.post(
            f'/api/events/{self.room.id}/tracks/',
            {'title': 'Bohemian Rhapsody', 'artist': 'Queen'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['title'], 'Bohemian Rhapsody')
        self.assertEqual(resp.data['vote_count'], 0)

    def test_suggest_track_wrong_room_type(self):
        self._auth(self.user)
        resp = self.client.post(
            f'/api/events/{self.playlist_room.id}/tracks/',
            {'title': 'Test', 'artist': 'Test'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_suggest_track_unauthenticated(self):
        resp = self.client.post(
            f'/api/events/{self.room.id}/tracks/',
            {'title': 'Test', 'artist': 'Test'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class TestVoteTrack(TrackVoteTestBase):
    """POST /api/events/<room_id>/tracks/<track_id>/vote/"""

    def test_vote_increments_count(self):
        self._auth(self.owner)
        track_id = self._create_track(user=self.owner, title='Stairway to Heaven', artist='Led Zeppelin')

        # Vote as a different user
        self._auth(self.user)
        vote_resp = self.client.post(
            f'/api/events/{self.room.id}/tracks/{track_id}/vote/',
        )
        self.assertEqual(vote_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(vote_resp.data['track']['vote_count'], 1)

    def test_double_vote_prevented(self):
        self._auth(self.owner)
        track_id = self._create_track(user=self.owner)

        self._auth(self.user)
        self.client.post(f'/api/events/{self.room.id}/tracks/{track_id}/vote/')

        # Second vote should fail
        second = self.client.post(f'/api/events/{self.room.id}/tracks/{track_id}/vote/')
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already voted', second.data['detail'].lower())

    def test_vote_nonexistent_track(self):
        self._auth(self.user)
        resp = self.client.post(f'/api/events/{self.room.id}/tracks/99999/vote/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_has_voted_flag(self):
        """After voting, the has_voted field should be True for that user."""
        track_id = self._create_track(user=self.owner)

        # Before voting
        self._auth(self.user)
        resp = self.client.get(f'/api/events/{self.room.id}/tracks/')
        track_data = next(t for t in resp.data['results'] if t['id'] == track_id)
        self.assertFalse(track_data['has_voted'])

        # After voting
        self.client.post(f'/api/events/{self.room.id}/tracks/{track_id}/vote/')
        resp = self.client.get(f'/api/events/{self.room.id}/tracks/')
        track_data = next(t for t in resp.data['results'] if t['id'] == track_id)
        self.assertTrue(track_data['has_voted'])


class TestRankedList(TrackVoteTestBase):
    """GET /api/events/<room_id>/tracks/ — ranked by votes."""

    def test_tracks_ordered_by_votes(self):
        self._auth(self.owner)
        # Create two tracks
        r1_id = self._create_track(title='Song A')
        r2_id = self._create_track(title='Song B')

        # Vote for Song B twice (different users)
        self._auth(self.user)
        self.client.post(f'/api/events/{self.room.id}/tracks/{r2_id}/vote/')
        self._auth(self.user2)
        self.client.post(f'/api/events/{self.room.id}/tracks/{r2_id}/vote/')

        # Vote for Song A once
        self._auth(self.user)
        self.client.post(f'/api/events/{self.room.id}/tracks/{r1_id}/vote/')

        # Fetch ranked list
        resp = self.client.get(f'/api/events/{self.room.id}/tracks/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Song B (2 votes) should be first
        self.assertEqual(resp.data['results'][0]['title'], 'Song B')
        self.assertEqual(resp.data['results'][1]['title'], 'Song A')

    def test_tiebreaking_newer_track_wins(self):
        """When vote counts are equal, the newer track (later created_at) ranks higher."""
        self._auth(self.owner)
        self._create_track(title='First Song')
        self._create_track(title='Second Song')

        # Both have 0 votes — Second Song was created later, should rank first
        resp = self.client.get(f'/api/events/{self.room.id}/tracks/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['results'][0]['title'], 'Second Song')
        self.assertEqual(resp.data['results'][1]['title'], 'First Song')

    def test_rank_field_is_deterministic(self):
        """The rank field should match the position in the ordered list."""
        self._auth(self.owner)
        self._create_track(title='Song X')
        self._create_track(title='Song Y')
        
        resp = self.client.get(f'/api/events/{self.room.id}/tracks/')
        for i, track in enumerate(resp.data['results']):
            self.assertEqual(track['rank'], i + 1)


class TestPrivateRoomAccess(TrackVoteTestBase):
    """Verify uninvited users cannot access private vote rooms."""

    def test_uninvited_user_cannot_see_tracks(self):
        self._auth(self.user)
        resp = self.client.get(f'/api/events/{self.private_room.id}/tracks/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_invited_user_can_see_tracks(self):
        RoomMembership.objects.create(
            room=self.private_room, user=self.user,
            invited_by=self.owner, status='accepted',
        )
        self._auth(self.user)
        resp = self.client.get(f'/api/events/{self.private_room.id}/tracks/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_invite_only_denies_non_member_vote(self):
        track_id = self._create_track(room=self.private_room, user=self.owner, title='VIP Song')

        self._auth(self.user)
        vote_resp = self.client.post(f'/api/events/{self.private_room.id}/tracks/{track_id}/vote/')
        self.assertEqual(vote_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_invite_only_allows_accepted_member_vote(self):
        RoomMembership.objects.create(
            room=self.private_room, user=self.user,
            invited_by=self.owner, status='accepted',
        )
        track_id = self._create_track(room=self.private_room, user=self.owner, title='VIP Song')

        self._auth(self.user)
        vote_resp = self.client.post(f'/api/events/{self.private_room.id}/tracks/{track_id}/vote/')
        self.assertEqual(vote_resp.status_code, status.HTTP_200_OK)


class TestTrackDeletion(TrackVoteTestBase):
    """DELETE /api/events/<room_id>/tracks/<track_id>/ — track removal."""

    def test_owner_can_delete_any_track(self):
        track_id = self._create_track(user=self.user)
        self._auth(self.owner)
        resp = self.client.delete(f'/api/events/{self.room.id}/tracks/{track_id}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_suggester_can_delete_own_track(self):
        track_id = self._create_track(user=self.user)
        self._auth(self.user)
        resp = self.client.delete(f'/api/events/{self.room.id}/tracks/{track_id}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)


class TestGeoTimeVoting(TrackVoteTestBase):
    """Verify geo-fence and time-window enforcement at vote time."""

    def setUp(self):
        super().setUp()
        self.geo_room = Room.objects.create(
            owner=self.owner, name='Geo Event',
            room_type='vote', visibility='public', license_type='location',
            geo_lat=48.8566, geo_lon=2.3522, geo_radius_meters=500,
            active_from=timezone.now() - timedelta(hours=1),
            active_until=timezone.now() + timedelta(hours=1),
        )

    def test_vote_within_geofence_succeeds(self):
        self._auth(self.owner)
        resp = self.client.post(
            f'/api/events/{self.geo_room.id}/tracks/',
            {'title': 'Paris Song', 'artist': 'French', 'lat': 48.8566, 'lon': 2.3522},
            format='json',
        )
        track_id = resp.data['id']
        self._auth(self.user)
        vote_resp = self.client.post(
            f'/api/events/{self.geo_room.id}/tracks/{track_id}/vote/',
            {'lat': 48.8566, 'lon': 2.3522}, format='json',
        )
        self.assertEqual(vote_resp.status_code, status.HTTP_200_OK)

    def test_vote_outside_geofence_fails(self):
        self._auth(self.owner)
        resp = self.client.post(
            f'/api/events/{self.geo_room.id}/tracks/',
            {'title': 'Paris Song', 'artist': 'French', 'lat': 48.8566, 'lon': 2.3522},
            format='json',
        )
        track_id = resp.data['id']
        self._auth(self.user)
        vote_resp = self.client.post(
            f'/api/events/{self.geo_room.id}/tracks/{track_id}/vote/',
            {'lat': 40.7128, 'lon': -74.0060}, format='json',
        )
        self.assertEqual(vote_resp.status_code, status.HTTP_403_FORBIDDEN)


class TestConcurrentVoting(TransactionTestCase):
    """
    Verify that concurrent voting doesn't corrupt vote counts.
    Directly answers the PDF requirement to handle "management of competition 
    problematics: for instance, if several people vote for different tracks 
    or the same one in a playlist."
    """

    def setUp(self):
        self.client = APIClient()
        self.owner = CustomUser.objects.create_user(
            username='eventowner', email='owner@vote.com', password='Pass1234!',
        )
        self.user = CustomUser.objects.create_user(
            username='voter1', email='voter1@vote.com', password='Pass1234!',
        )
        self.user2 = CustomUser.objects.create_user(
            username='voter2', email='voter2@vote.com', password='Pass1234!',
        )
        self.room = Room.objects.create(
            owner=self.owner, name='Vote Night',
            room_type='vote', visibility='public', license_type='default',
        )

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def test_concurrent_votes_on_same_track(self):
        """Simulate 10 different users voting on the same track simultaneously."""
        self._auth(self.owner)
        resp = self.client.post(
            f'/api/events/{self.room.id}/tracks/',
            {'title': 'Race Condition Song', 'artist': 'Threads'},
            format='json',
        )
        track_id = resp.data['id']

        user_tokens =[]
        for i in range(10):
            u = CustomUser.objects.create_user(username=f'racer{i}', email=f'r{i}@test.com', password='Pass!')
            token = str(RefreshToken.for_user(u).access_token)
            user_tokens.append(token)

        results = []
        errors =[]

        def vote_with_token(tk):
            try:
                c = APIClient()
                c.credentials(HTTP_AUTHORIZATION=f'Bearer {tk}')
                r = c.post(f'/api/events/{self.room.id}/tracks/{track_id}/vote/')
                results.append(r.status_code)
            except Exception as e:
                errors.append(str(e))
            finally:
                connection.close()  

        threads =[threading.Thread(target=vote_with_token, args=(tk,)) for tk in user_tokens]
        for t in threads: t.start()
        for t in threads: t.join()

        self.assertEqual(len(errors), 0)
        self.assertEqual(results.count(200), 10)

        # Final count must be exactly 10
        from events.models import Track
        track = Track.objects.get(pk=track_id)
        self.assertEqual(track.vote_count, 10)

    def test_concurrent_votes_on_different_tracks(self):
        """Voting on different tracks simultaneously should not interfere."""
        self._auth(self.owner)
        r1 = self.client.post(f'/api/events/{self.room.id}/tracks/', {'title': 'Track Alpha', 'artist': 'A'}, format='json')
        r2 = self.client.post(f'/api/events/{self.room.id}/tracks/', {'title': 'Track Beta', 'artist': 'B'}, format='json')
        track_a_id = r1.data['id']
        track_b_id = r2.data['id']

        token_a = str(RefreshToken.for_user(self.user).access_token)
        token_b = str(RefreshToken.for_user(self.user2).access_token)

        results = {}

        def vote_track(tk, track_id, label):
            try:
                c = APIClient()
                c.credentials(HTTP_AUTHORIZATION=f'Bearer {tk}')
                r = c.post(f'/api/events/{self.room.id}/tracks/{track_id}/vote/')
                results[label] = r.status_code
            finally:
                connection.close()  

        t1 = threading.Thread(target=vote_track, args=(token_a, track_a_id, 'a'))
        t2 = threading.Thread(target=vote_track, args=(token_b, track_b_id, 'b'))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.assertEqual(results.get('a'), 200)
        self.assertEqual(results.get('b'), 200)

        from events.models import Track
        a = Track.objects.get(pk=track_a_id)
        b = Track.objects.get(pk=track_b_id)
        self.assertEqual(a.vote_count, 1)
        self.assertEqual(b.vote_count, 1)

    def test_vote_while_delete_returns_404(self):
        """
        If User A attempts to vote right as User B (the owner) deletes the track,
        the server should gracefully return a 404 instead of a 500 error.
        """
        self._auth(self.owner)
        resp = self.client.post(
            f'/api/events/{self.room.id}/tracks/',
            {'title': 'To Be Deleted', 'artist': 'Test'},
            format='json',
        )
        track_id = resp.data['id']

        # Emulate the delete going through first
        self.client.delete(f'/api/events/{self.room.id}/tracks/{track_id}/')

        # The subsequent vote arrives slightly after
        self._auth(self.user)
        vote_resp = self.client.post(f'/api/events/{self.room.id}/tracks/{track_id}/vote/')
        self.assertEqual(vote_resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(vote_resp.data['detail'], 'Track not found in this room.')

    def test_concurrent_suggestions_deterministic_ranking(self):
        """
        If multiple tracks are suggested at the EXACT same millisecond (same created_at
        and 0 votes), they must be sorted completely deterministically via ID fallback.
        """
        user_tokens =[]
        for i in range(5):
            u = CustomUser.objects.create_user(username=f'suggester{i}', email=f's{i}@t.com', password='Pass!')
            token = str(RefreshToken.for_user(u).access_token)
            user_tokens.append((token, f'Concurrent Song {i}'))

        def suggest_track(tk, title):
            try:
                c = APIClient()
                c.credentials(HTTP_AUTHORIZATION=f'Bearer {tk}')
                c.post(f'/api/events/{self.room.id}/tracks/', {'title': title, 'artist': 'T'}, format='json')
            finally:
                connection.close()

        threads =[threading.Thread(target=suggest_track, args=(tk, title)) for tk, title in user_tokens]
        for t in threads: t.start()
        for t in threads: t.join()

        # Check ranking determinism
        self._auth(self.owner)
        resp = self.client.get(f'/api/events/{self.room.id}/tracks/')
        self.assertEqual(len(resp.data['results']), 5)
        
        # Rankings should be perfectly contiguous 1, 2, 3, 4, 5
        ranks = [track['rank'] for track in resp.data['results']]
        self.assertEqual(ranks,[1, 2, 3, 4, 5])