"""
Spotify API Request Tests — events/tests_spotify.py
=====================================================

Verifies every aspect of how the Music Room backend accepts, validates,
stores, and returns Spotify track data submitted by the frontend.

The backend never calls the Spotify API directly.  Instead, the frontend
fetches track metadata from Spotify and POSTs it to:

    POST /api/events/<room_id>/tracks/

These tests confirm that:
  1. spotifyId is REQUIRED — it is the non-negotiable unique identifier
  2. Full Spotify payloads (all optional fields) are stored faithfully
  3. Partial payloads (only required fields) still succeed
  4. Duplicate spotifyId in the same room is rejected with 409
  5. Same spotifyId in different rooms is allowed (unique_together is room-scoped)
  6. Blank / empty spotifyId is rejected with 400
  7. All camelCase ↔ snake_case field mappings are serialised correctly
  8. The response exposes spotifyId, albumArt, audioUrl in camelCase
  9. Unauthenticated requests are rejected with 401
 10. Non-vote-type rooms refuse track suggestions (400)
 11. The spotify track data is correctly DELETE-able and the room list updates
 12. The spotifyId survives a list → retrieve round-trip without corruption
"""

from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.test import TestCase

from api.models import CustomUser, Room
from events.models import Track


# ── Shared fixtures ───────────────────────────────────────────────────────────

VALID_SPOTIFY_PAYLOAD = {
    "spotifyId": "4iV5W9uYEdYUVa79Axb7Rh",
    "title": "Blinding Lights",
    "artist": "The Weeknd",
    "album": "After Hours",
    "albumArt": "https://i.scdn.co/image/ab67616d0000b273ef017e899c0547c32c834991",
    "duration": 200,
    "audioUrl": "https://p.scdn.co/mp3-preview/b61b3c0b0c49d73e0b8c4a12d3c1d1f9a5f3a2b1",
}

MINIMAL_SPOTIFY_PAYLOAD = {
    "spotifyId": "3n3Ppam7vgaVa1iaRUIOKE",
    "title": "Shape of You",
    "artist": "Ed Sheeran",
}


class SpotifyTrackTestBase(TestCase):
    """
    Common setUp shared by all Spotify test classes.

    Creates:
      • self.owner  — room creator / owner account
      • self.user   — regular authenticated user
      • self.room   — public vote-type room
      • self.delegation_room — non-vote room (delegation type) for type-check tests
      • self.client — DRF test client
    """

    BASE_URL = "/api/events/{room_id}/tracks/"

    def setUp(self):
        self.client = APIClient()

        self.owner = CustomUser.objects.create_user(
            username="spotowner",
            email="spotowner@music.test",
            password="Secure1234!",
        )
        self.user = CustomUser.objects.create_user(
            username="spotuser",
            email="spotuser@music.test",
            password="Secure1234!",
        )

        # Public vote-type room — the happy path room
        self.room = Room.objects.create(
            owner=self.owner,
            name="Spotify Night",
            room_type="vote",
            visibility="public",
            license_type="default",
        )

        # Second vote room — used to test cross-room duplicate allowance
        self.other_room = Room.objects.create(
            owner=self.owner,
            name="Spotify Night 2",
            room_type="vote",
            visibility="public",
            license_type="default",
        )

        # Delegation room — used to verify type-guard
        self.delegation_room = Room.objects.create(
            owner=self.owner,
            name="DJ Booth",
            room_type="delegation",
            visibility="public",
            license_type="default",
        )

    # ── Auth helpers ──────────────────────────────────────────────────────────

    def _auth(self, user):
        """Authenticate the test client as `user`."""
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

    def _deauth(self):
        """Remove any authentication credentials."""
        self.client.credentials()

    # ── Request helpers ───────────────────────────────────────────────────────

    def _post_track(self, payload, room=None):
        """POST a track to `room` (defaults to self.room)."""
        room_id = (room or self.room).id
        return self.client.post(
            self.BASE_URL.format(room_id=room_id),
            payload,
            format="json",
        )

    def _list_tracks(self, room=None):
        """GET the ranked track list for `room`."""
        room_id = (room or self.room).id
        return self.client.get(self.BASE_URL.format(room_id=room_id))


# ─────────────────────────────────────────────────────────────────────────────
# 1. VALIDATION — Required & Optional Fields
# ─────────────────────────────────────────────────────────────────────────────

class TestSpotifyTrackValidation(SpotifyTrackTestBase):
    """
    Verifies the input validation layer of the Spotify track submission
    endpoint (TrackCreateSerializer + TrackListCreateView.post).
    """

    def test_full_spotify_payload_returns_201(self):
        """A complete Spotify payload with all optional fields succeeds."""
        self._auth(self.user)
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

    def test_minimal_spotify_payload_returns_201(self):
        """Only spotifyId + title + artist are required; the rest can be omitted."""
        self._auth(self.user)
        resp = self._post_track(MINIMAL_SPOTIFY_PAYLOAD)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

    def test_missing_spotifyId_returns_400(self):
        """spotifyId is required — omitting it must return 400."""
        self._auth(self.user)
        payload = {k: v for k, v in VALID_SPOTIFY_PAYLOAD.items() if k != "spotifyId"}
        resp = self._post_track(payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("spotifyId", resp.data)

    def test_blank_spotifyId_returns_400(self):
        """An empty string for spotifyId must be rejected."""
        self._auth(self.user)
        resp = self._post_track({**VALID_SPOTIFY_PAYLOAD, "spotifyId": ""})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("spotifyId", resp.data)

    def test_missing_title_returns_400(self):
        """title is required — omitting it must return 400."""
        self._auth(self.user)
        payload = {k: v for k, v in VALID_SPOTIFY_PAYLOAD.items() if k != "title"}
        resp = self._post_track(payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", resp.data)

    def test_missing_artist_returns_400(self):
        """artist is required — omitting it must return 400."""
        self._auth(self.user)
        payload = {k: v for k, v in VALID_SPOTIFY_PAYLOAD.items() if k != "artist"}
        resp = self._post_track(payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("artist", resp.data)

    def test_unauthenticated_request_returns_401(self):
        """No token → 401 Unauthorized."""
        self._deauth()
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_vote_room_returns_400(self):
        """Submitting a track to a delegation-type room must be rejected."""
        self._auth(self.user)
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD, room=self.delegation_room)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not a vote-type room", resp.data.get("detail", ""))


# ─────────────────────────────────────────────────────────────────────────────
# 2. DUPLICATE / UNIQUENESS — same spotifyId in same vs. different rooms
# ─────────────────────────────────────────────────────────────────────────────

class TestSpotifyTrackUniqueness(SpotifyTrackTestBase):
    """
    Ensures the (room, spotify_id) unique_together constraint is enforced
    at the API level and returns the correct status code (409 Conflict).
    """

    def test_duplicate_spotifyId_same_room_returns_409(self):
        """
        Suggesting the same Spotify track twice in the same room must fail
        with 409 Conflict, not a 500 IntegrityError.
        """
        self._auth(self.user)
        first = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        second = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(second.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("already exists", second.data.get("detail", "").lower())

    def test_same_spotifyId_in_different_rooms_is_allowed(self):
        """
        The unique_together constraint is scoped to (room, spotify_id).
        The same Spotify track can exist in two separate rooms simultaneously.
        """
        self._auth(self.user)
        resp1 = self._post_track(VALID_SPOTIFY_PAYLOAD, room=self.room)
        resp2 = self._post_track(VALID_SPOTIFY_PAYLOAD, room=self.other_room)
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED, resp1.data)
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED, resp2.data)

    def test_multiple_different_spotifyIds_same_room_allowed(self):
        """
        Multiple distinct Spotify tracks can coexist in the same room.
        Each must be created successfully.
        """
        self._auth(self.user)
        tracks = [
            {"spotifyId": "track_001", "title": "Song One", "artist": "Artist A"},
            {"spotifyId": "track_002", "title": "Song Two", "artist": "Artist B"},
            {"spotifyId": "track_003", "title": "Song Three", "artist": "Artist C"},
        ]
        for payload in tracks:
            resp = self._post_track(payload)
            self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

        # All three tracks must be in the DB
        self.assertEqual(Track.objects.filter(room=self.room).count(), 3)


# ─────────────────────────────────────────────────────────────────────────────
# 3. FIELD MAPPING — camelCase in, camelCase out
# ─────────────────────────────────────────────────────────────────────────────

class TestSpotifyFieldMapping(SpotifyTrackTestBase):
    """
    Verifies that the TrackSerializer correctly maps between the internal
    snake_case DB columns and the camelCase frontend contract.

    Backend DB column → Frontend JSON key:
      spotify_id  → spotifyId
      album_art   → albumArt
      audio_url   → audioUrl
      vote_count  → votes  (also exposed as vote_count for backward compat)
      suggested_by → addedBy
    """

    def setUp(self):
        super().setUp()
        self._auth(self.user)

    def test_response_contains_spotifyId_camelCase(self):
        """The 201 response must expose `spotifyId`, NOT `spotify_id`."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertIn("spotifyId", resp.data)
        self.assertNotIn("spotify_id", resp.data)

    def test_spotifyId_value_matches_submitted_value(self):
        """The returned spotifyId must equal the one we submitted."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(resp.data["spotifyId"], VALID_SPOTIFY_PAYLOAD["spotifyId"])

    def test_response_contains_albumArt_camelCase(self):
        """The 201 response must expose `albumArt`, not `album_art`."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertIn("albumArt", resp.data)
        self.assertNotIn("album_art", resp.data)

    def test_albumArt_url_round_trips_correctly(self):
        """The album art URL stored in the DB must be returned verbatim."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(resp.data["albumArt"], VALID_SPOTIFY_PAYLOAD["albumArt"])

    def test_response_contains_audioUrl_camelCase(self):
        """The 201 response must expose `audioUrl`, not `audio_url`."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertIn("audioUrl", resp.data)
        self.assertNotIn("audio_url", resp.data)

    def test_audioUrl_round_trips_correctly(self):
        """The 30-second preview URL must survive the serialisation round-trip."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(resp.data["audioUrl"], VALID_SPOTIFY_PAYLOAD["audioUrl"])

    def test_duration_stored_as_integer_seconds(self):
        """Duration (in seconds) must be an integer in the response."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(resp.data["duration"], VALID_SPOTIFY_PAYLOAD["duration"])
        self.assertIsInstance(resp.data["duration"], int)

    def test_response_contains_votes_field(self):
        """New tracks must start with `votes: 0` (the camelCase alias)."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertIn("votes", resp.data)
        self.assertEqual(resp.data["votes"], 0)

    def test_response_contains_vote_count_field(self):
        """vote_count (snake_case alias) must also be present for backend compat."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertIn("vote_count", resp.data)
        self.assertEqual(resp.data["vote_count"], 0)

    def test_response_contains_addedBy_field(self):
        """The nested `addedBy` object must be serialised correctly."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertIn("addedBy", resp.data)
        self.assertIn("name", resp.data["addedBy"])
        self.assertIn("avatar", resp.data["addedBy"])

    def test_addedBy_name_matches_submitting_user(self):
        """The `addedBy.name` must match the username of the submitting user."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(resp.data["addedBy"]["name"], self.user.username)

    def test_optional_fields_default_gracefully_when_omitted(self):
        """
        When optional Spotify fields (album, albumArt, duration, audioUrl)
        are not provided, the response must still contain all keys without
        crashing — defaults apply.
        """
        resp = self._post_track(MINIMAL_SPOTIFY_PAYLOAD)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # duration defaults to 0
        self.assertEqual(resp.data["duration"], 0)
        # votes starts at 0
        self.assertEqual(resp.data["votes"], 0)
        # These will be None/null when not provided
        self.assertIn("albumArt", resp.data)
        self.assertIn("audioUrl", resp.data)

    def test_title_and_artist_round_trip_correctly(self):
        """title and artist must be stored and returned exactly as submitted."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(resp.data["title"], VALID_SPOTIFY_PAYLOAD["title"])
        self.assertEqual(resp.data["artist"], VALID_SPOTIFY_PAYLOAD["artist"])

    def test_album_round_trips_correctly(self):
        """album name must survive the serialisation round-trip."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(resp.data["album"], VALID_SPOTIFY_PAYLOAD["album"])


# ─────────────────────────────────────────────────────────────────────────────
# 4. DB INTEGRITY — verify the ORM layer stores what the API accepts
# ─────────────────────────────────────────────────────────────────────────────

class TestSpotifyTrackDatabaseIntegrity(SpotifyTrackTestBase):
    """
    Goes below the API surface to verify that the Django ORM correctly
    persisted all Spotify fields into the Track model.
    """

    def setUp(self):
        super().setUp()
        self._auth(self.user)

    def test_track_stored_in_db_with_correct_spotifyId(self):
        """After a successful POST, the DB row must have the correct spotify_id."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track = Track.objects.get(pk=resp.data["id"])
        self.assertEqual(track.spotify_id, VALID_SPOTIFY_PAYLOAD["spotifyId"])

    def test_track_stored_with_correct_album_art(self):
        """The album_art URL must be persisted correctly."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track = Track.objects.get(pk=resp.data["id"])
        self.assertEqual(track.album_art, VALID_SPOTIFY_PAYLOAD["albumArt"])

    def test_track_stored_with_correct_audio_url(self):
        """The preview audio URL (audio_url) must be persisted correctly."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track = Track.objects.get(pk=resp.data["id"])
        self.assertEqual(track.audio_url, VALID_SPOTIFY_PAYLOAD["audioUrl"])

    def test_track_stored_with_correct_duration(self):
        """Duration (in seconds) must be persisted as an integer."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track = Track.objects.get(pk=resp.data["id"])
        self.assertEqual(track.duration, VALID_SPOTIFY_PAYLOAD["duration"])

    def test_track_stored_with_correct_album_name(self):
        """Album name must be persisted correctly."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track = Track.objects.get(pk=resp.data["id"])
        self.assertEqual(track.album, VALID_SPOTIFY_PAYLOAD["album"])

    def test_track_belongs_to_correct_room(self):
        """The Track FK to Room must point to the room we submitted to."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track = Track.objects.get(pk=resp.data["id"])
        self.assertEqual(track.room_id, self.room.id)

    def test_track_suggested_by_correct_user(self):
        """suggested_by must be the authenticated user who submitted the track."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track = Track.objects.get(pk=resp.data["id"])
        self.assertEqual(track.suggested_by_id, self.user.id)

    def test_track_initial_vote_count_is_zero(self):
        """New tracks must start with vote_count = 0."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track = Track.objects.get(pk=resp.data["id"])
        self.assertEqual(track.vote_count, 0)


# ─────────────────────────────────────────────────────────────────────────────
# 5. LIST ENDPOINT — spotifyId survives in the paginated list response
# ─────────────────────────────────────────────────────────────────────────────

class TestSpotifyTrackListEndpoint(SpotifyTrackTestBase):
    """
    Verifies that GET /api/events/<room_id>/tracks/ correctly returns
    Spotify-sourced fields for every track in the paginated response.
    """

    def setUp(self):
        super().setUp()
        self._auth(self.user)

    def test_list_response_is_paginated(self):
        """The list response must be wrapped in a pagination envelope."""
        self._post_track(VALID_SPOTIFY_PAYLOAD)
        resp = self._list_tracks()
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("results", resp.data)
        self.assertIn("count", resp.data)

    def test_spotifyId_present_in_list_results(self):
        """Every track in the list must expose `spotifyId`."""
        self._post_track(VALID_SPOTIFY_PAYLOAD)
        resp = self._list_tracks()
        self.assertTrue(len(resp.data["results"]) > 0)
        for track in resp.data["results"]:
            self.assertIn("spotifyId", track)

    def test_spotifyId_value_correct_in_list(self):
        """The spotifyId in the list must match what was submitted."""
        self._post_track(VALID_SPOTIFY_PAYLOAD)
        resp = self._list_tracks()
        result = resp.data["results"][0]
        self.assertEqual(result["spotifyId"], VALID_SPOTIFY_PAYLOAD["spotifyId"])

    def test_albumArt_present_in_list_results(self):
        """The albumArt URL must appear in every list entry."""
        self._post_track(VALID_SPOTIFY_PAYLOAD)
        resp = self._list_tracks()
        result = resp.data["results"][0]
        self.assertIn("albumArt", result)
        self.assertEqual(result["albumArt"], VALID_SPOTIFY_PAYLOAD["albumArt"])

    def test_audioUrl_present_in_list_results(self):
        """The audioUrl (preview URL) must appear in the list results."""
        self._post_track(VALID_SPOTIFY_PAYLOAD)
        resp = self._list_tracks()
        result = resp.data["results"][0]
        self.assertIn("audioUrl", result)
        self.assertEqual(result["audioUrl"], VALID_SPOTIFY_PAYLOAD["audioUrl"])

    def test_has_voted_false_before_voting(self):
        """has_voted must be False for the user before they vote."""
        self._post_track(VALID_SPOTIFY_PAYLOAD)
        resp = self._list_tracks()
        result = resp.data["results"][0]
        self.assertFalse(result["has_voted"])

    def test_rank_field_present_and_starts_at_one(self):
        """A single track must have rank = 1."""
        self._post_track(VALID_SPOTIFY_PAYLOAD)
        resp = self._list_tracks()
        result = resp.data["results"][0]
        self.assertIn("rank", result)
        self.assertEqual(result["rank"], 1)

    def test_list_unauthenticated_returns_401(self):
        """GET on the track list without a token must be rejected."""
        self._post_track(VALID_SPOTIFY_PAYLOAD)
        self._deauth()
        resp = self._list_tracks()
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────────────────────
# 6. DELETE — track removal cleans up Spotify data correctly
# ─────────────────────────────────────────────────────────────────────────────

class TestSpotifyTrackDeletion(SpotifyTrackTestBase):
    """
    Verifies that deleting a Spotify track via the API removes it from
    the DB and from subsequent list responses.
    """

    def setUp(self):
        super().setUp()
        self._auth(self.user)

    def _delete_track(self, track_id, room=None):
        room_id = (room or self.room).id
        return self.client.delete(
            f"/api/events/{room_id}/tracks/{track_id}/"
        )

    def test_owner_can_delete_spotify_track(self):
        """Room owner can delete any Spotify track in their room."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track_id = resp.data["id"]

        self._auth(self.owner)
        del_resp = self._delete_track(track_id)
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_suggester_can_delete_own_spotify_track(self):
        """The user who suggested a track can also delete it."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track_id = resp.data["id"]

        del_resp = self._delete_track(track_id)
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_deleted_track_removed_from_db(self):
        """After deletion, the Track row must not exist in the database."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track_id = resp.data["id"]
        self._delete_track(track_id)
        self.assertFalse(Track.objects.filter(pk=track_id).exists())

    def test_deleted_track_absent_from_list(self):
        """After deletion, the track must not appear in the GET list."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track_id = resp.data["id"]
        self._delete_track(track_id)

        list_resp = self._list_tracks()
        ids = [t["id"] for t in list_resp.data["results"]]
        self.assertNotIn(track_id, ids)

    def test_same_spotifyId_can_be_re_added_after_deletion(self):
        """
        After a track is deleted, the same spotifyId must be addable again
        (the unique_together constraint is released by the DELETE).
        """
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track_id = resp.data["id"]
        self._delete_track(track_id)

        re_add = self._post_track(VALID_SPOTIFY_PAYLOAD)
        self.assertEqual(re_add.status_code, status.HTTP_201_CREATED)

    def test_third_party_cannot_delete_spotify_track(self):
        """A user who is neither the owner nor the suggester gets 403."""
        resp = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track_id = resp.data["id"]

        # create a third party
        stranger = CustomUser.objects.create_user(
            username="stranger", email="stranger@music.test", password="Secure1234!"
        )
        self._auth(stranger)
        del_resp = self._delete_track(track_id)
        self.assertEqual(del_resp.status_code, status.HTTP_403_FORBIDDEN)


# ─────────────────────────────────────────────────────────────────────────────
# 7. VOTE INTEGRATION — voting updates the Spotify track's vote_count
# ─────────────────────────────────────────────────────────────────────────────

class TestSpotifyTrackVoteIntegration(SpotifyTrackTestBase):
    """
    End-to-end smoke tests that confirm voting interacts correctly with
    Spotify track data (the spotifyId etc. must survive the vote cycle).
    """

    def setUp(self):
        super().setUp()
        self._auth(self.owner)

    def _vote(self, track_id, room=None):
        room_id = (room or self.room).id
        return self.client.post(f"/api/events/{room_id}/tracks/{track_id}/vote/")

    def test_vote_increments_spotify_track_vote_count(self):
        """Voting increments the vote_count on the Spotify track."""
        submit = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track_id = submit.data["id"]

        self._auth(self.user)
        vote_resp = self._vote(track_id)
        self.assertEqual(vote_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(vote_resp.data["track"]["vote_count"], 1)

    def test_vote_response_preserves_spotifyId(self):
        """The vote response `track` object must still carry `spotifyId`."""
        submit = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track_id = submit.data["id"]

        self._auth(self.user)
        vote_resp = self._vote(track_id)
        self.assertIn("spotifyId", vote_resp.data["track"])
        self.assertEqual(
            vote_resp.data["track"]["spotifyId"],
            VALID_SPOTIFY_PAYLOAD["spotifyId"],
        )

    def test_vote_response_preserves_albumArt(self):
        """The vote response must still carry the albumArt URL."""
        submit = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track_id = submit.data["id"]

        self._auth(self.user)
        vote_resp = self._vote(track_id)
        self.assertEqual(
            vote_resp.data["track"]["albumArt"],
            VALID_SPOTIFY_PAYLOAD["albumArt"],
        )

    def test_has_voted_true_after_voting(self):
        """has_voted must be True in the list after the user votes."""
        submit = self._post_track(VALID_SPOTIFY_PAYLOAD)
        track_id = submit.data["id"]

        self._auth(self.user)
        self._vote(track_id)

        list_resp = self._list_tracks()
        track_data = next(
            t for t in list_resp.data["results"] if t["id"] == track_id
        )
        self.assertTrue(track_data["has_voted"])
