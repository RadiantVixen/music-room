from django.contrib import admin
from .models import PremiumSubscription, Playlist, PlaylistTrack, PlaylistCollaborator


@admin.register(PremiumSubscription)
class PremiumSubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "plan_type", "is_active", "is_premium", "started_at", "expires_at"]
    list_filter = ["plan_type", "is_active"]
    search_fields = ["user__username", "user__email"]
    readonly_fields = ["created_at", "updated_at"]

    @admin.display(boolean=True, description="Premium active?")
    def is_premium(self, obj):
        return obj.is_premium


class PlaylistTrackInline(admin.TabularInline):
    model = PlaylistTrack
    extra = 0
    fields = ["position", "title", "artist", "deezer_id", "duration"]
    ordering = ["position"]


class PlaylistCollaboratorInline(admin.TabularInline):
    model = PlaylistCollaborator
    extra = 0
    fields = ["user", "added_at"]
    readonly_fields = ["added_at"]


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "is_collaborative", "track_count", "created_at"]
    list_filter = ["is_collaborative"]
    search_fields = ["name", "owner__username"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [PlaylistTrackInline, PlaylistCollaboratorInline]

    @admin.display(description="# Tracks")
    def track_count(self, obj):
        return obj.tracks.count()


@admin.register(PlaylistTrack)
class PlaylistTrackAdmin(admin.ModelAdmin):
    list_display = ["title", "artist", "playlist", "position", "added_by"]
    list_filter = ["playlist"]
    search_fields = ["title", "artist", "deezer_id"]


@admin.register(PlaylistCollaborator)
class PlaylistCollaboratorAdmin(admin.ModelAdmin):
    list_display = ["user", "playlist", "added_at"]
    search_fields = ["user__username", "playlist__name"]
