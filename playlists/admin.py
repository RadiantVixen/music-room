from django.contrib import admin
from .models import PlaylistTrack


@admin.register(PlaylistTrack)
class PlaylistTrackAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'room', 'position', 'added_by', 'created_at']
    list_filter = ['room']
    search_fields = ['title', 'artist']
    raw_id_fields = ['room', 'added_by']
    readonly_fields = ['created_at', 'updated_at']
