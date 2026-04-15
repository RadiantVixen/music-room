from django.contrib import admin
from .models import Track, Vote


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'room', 'vote_count', 'suggested_by', 'created_at']
    list_filter = ['room']
    search_fields = ['title', 'artist']
    raw_id_fields = ['room', 'suggested_by']
    readonly_fields = ['created_at']


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'track', 'room', 'created_at']
    list_filter = ['room']
    search_fields = ['user__email', 'track__title']
    raw_id_fields = ['track', 'user', 'room']
    readonly_fields = ['created_at']
