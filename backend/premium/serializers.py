from rest_framework import serializers
from .models import PremiumSubscription, Playlist, PlaylistTrack, PlaylistCollaborator


class PremiumSubscriptionSerializer(serializers.ModelSerializer):
    is_premium = serializers.BooleanField(read_only=True)

    class Meta:
        model = PremiumSubscription
        fields = ["id", "plan_type", "is_active", "is_premium", "started_at", "expires_at"]
        read_only_fields = ["id", "started_at", "expires_at"]


class PlaylistTrackSerializer(serializers.ModelSerializer):
    added_by_username = serializers.CharField(
        source="added_by.username", read_only=True, default=None
    )

    class Meta:
        model = PlaylistTrack
        fields = [
            "id", "deezer_id", "title", "artist", "album",
            "album_art", "duration", "audio_url", "position",
            "added_by_username", "added_at",
        ]
        read_only_fields = ["id", "added_by_username", "added_at"]


class PlaylistCollaboratorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = PlaylistCollaborator
        fields = ["id", "user_id", "username", "added_at"]
        read_only_fields = ["id", "username", "user_id", "added_at"]


class PlaylistSerializer(serializers.ModelSerializer):
    tracks = PlaylistTrackSerializer(many=True, read_only=True)
    collaborators = PlaylistCollaboratorSerializer(many=True, read_only=True)
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    owner_id = serializers.IntegerField(source="owner.id", read_only=True)
    track_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Playlist
        fields = [
            "id", "name", "description", "cover_url", "is_collaborative",
            "owner_username", "owner_id", "track_count", "tracks", "collaborators",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner_username", "owner_id", "track_count", "created_at", "updated_at"]

    @property
    def data(self):
        # Override to manually order tracks
        ret = super().data
        if 'tracks' in ret and ret['tracks']:
            ret['tracks'] = sorted(ret['tracks'], key=lambda x: (x.get('position', 0), x.get('added_at', '')))
        return ret


class PlaylistListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — no nested tracks."""
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    owner_id = serializers.IntegerField(source="owner.id", read_only=True)
    track_count = serializers.IntegerField(source="tracks.count", read_only=True)

    class Meta:
        model = Playlist
        fields = [
            "id", "name", "description", "cover_url", "is_collaborative",
            "owner_username", "owner_id", "track_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner_username", "owner_id", "track_count", "created_at", "updated_at"]
