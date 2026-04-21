"""Deezer integration tests for events track endpoints."""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import CustomUser, Room
from events.models import Track


VALID_DEEZER_PAYLOAD = {
    "deezerId": "3135556",
    "title": "Harder, Better, Faster, Stronger",
    "artist": "Daft Punk",
    "album": "Discovery",
    "albumArt": "https://e-cdns-images.dzcdn.net/images/cover/mock/1000x1000-000000-80-0-0.jpg",
    "duration": 224,
    "audioUrl": "https://cdns-preview-m.dzcdn.net/stream/c-mock.mp3",
}


class DeezerTrackTestBase(TestCase):
    BASE_URL = "/api/events/{room_id}/tracks/"

    def setUp(self):
        self.client = APIClient()
        self.owner = CustomUser.objects.create_user(
            username="deezer-owner",
            email="deezer-owner@music.test",
            password="Secure1234!",
        )
        self.user = CustomUser.objects.create_user(
            username="deezer-user",
            email="deezer-user@music.test",
            password="Secure1234!",
        )
        self.room = Room.objects.create(
            owner=self.owner,
            name="Deezer Night",
            room_type="vote",
            visibility="public",
            license_type="default",
        )
        self.other_room = Room.objects.create(
            owner=self.owner,
            name="Deezer Night 2",
            room_type="vote",
            visibility="public",
            license_type="default",
        )

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

    def _post_track(self, payload, room=None):
        room_id = (room or self.room).id
        return self.client.post(self.BASE_URL.format(room_id=room_id), payload, format="json")


class TestDeezerTrackValidation(DeezerTrackTestBase):
    def test_minimal_required_fields(self):
        self._auth(self.user)
        resp = self._post_track({"deezerId": "mock-id-123", "title": "Song", "artist": "Artist"})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

    def test_missing_deezer_id_returns_400(self):
        self._auth(self.user)
        payload = {k: v for k, v in VALID_DEEZER_PAYLOAD.items() if k != "deezerId"}
        resp = self._post_track(payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("deezerId", resp.data)


class TestDeezerTrackUniqueness(DeezerTrackTestBase):
    def test_duplicate_deezer_id_same_room_returns_409(self):
        self._auth(self.user)
        first = self._post_track(VALID_DEEZER_PAYLOAD)
        second = self._post_track(VALID_DEEZER_PAYLOAD)
        self.assertEqual(first.status_code, status.HTTP_201_CREATED, first.data)
        self.assertEqual(second.status_code, status.HTTP_409_CONFLICT)

    def test_same_deezer_id_different_rooms_allowed(self):
        self._auth(self.user)
        r1 = self._post_track(VALID_DEEZER_PAYLOAD, room=self.room)
        r2 = self._post_track(VALID_DEEZER_PAYLOAD, room=self.other_room)
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED, r1.data)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED, r2.data)


class TestDeezerFieldMapping(DeezerTrackTestBase):
    def setUp(self):
        super().setUp()
        self._auth(self.user)

    def test_response_uses_deezer_id_camel_case(self):
        resp = self._post_track(VALID_DEEZER_PAYLOAD)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertIn("deezerId", resp.data)

    def test_db_stores_deezer_id(self):
        resp = self._post_track(VALID_DEEZER_PAYLOAD)
        track = Track.objects.get(pk=resp.data["id"])
        self.assertEqual(track.deezer_id, VALID_DEEZER_PAYLOAD["deezerId"])
