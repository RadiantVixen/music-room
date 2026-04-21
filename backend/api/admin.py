from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Profile,
    MusicPreferences,
    FriendRequest,
    Room, RoomMembership,
    ActionLog,
)


# ─── CustomUser ───────────────────────────────────────────────────────────────

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'username', 'role', 'is_superuser', 'is_active']
    list_filter = ['role', 'is_superuser', 'is_active']
    search_fields = ['email', 'username']
    ordering = ['email']
    fieldsets = UserAdmin.fieldsets + (
        ('Role', {'fields': ('role',)}),
    )

    def save_model(self, request, obj, form, change):
        if obj.role == 'STAFF' and not request.user.is_superuser:
            raise PermissionError("Only superusers can assign the STAFF role.")
        super().save_model(request, obj, form, change)


admin.site.register(CustomUser, CustomUserAdmin)


# ─── Profile ──────────────────────────────────────────────────────────────────

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'phone_verified', 'provider', 'location']
    search_fields = ['user__email', 'user__username', 'phone']
    list_filter = ['phone_verified', 'provider']
    raw_id_fields = ['user']


# ─── MusicPreferences ─────────────────────────────────────────────────────────

@admin.register(MusicPreferences)
class MusicPreferencesAdmin(admin.ModelAdmin):
    list_display = ['profile']
    search_fields = ['profile__user__email']
    raw_id_fields = ['profile']


# ─── FriendRequest ────────────────────────────────────────────────────────────

@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['sender__email', 'receiver__email']
    raw_id_fields = ['sender', 'receiver']
    readonly_fields = ['created_at', 'updated_at']


# ─── Room ─────────────────────────────────────────────────────────────────────

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'room_type', 'visibility', 'license_type', 'is_active', 'created_at']
    list_filter = ['room_type', 'visibility', 'license_type', 'is_active']
    search_fields = ['name', 'owner__email']
    raw_id_fields = ['owner']
    readonly_fields = ['created_at']


# ─── RoomMembership ───────────────────────────────────────────────────────────

@admin.register(RoomMembership)
class RoomMembershipAdmin(admin.ModelAdmin):
    list_display = ['room', 'user', 'status', 'invited_by', 'created_at']
    list_filter = ['status']
    search_fields = ['room__name', 'user__email']
    raw_id_fields = ['room', 'user', 'invited_by']
    readonly_fields = ['created_at']


# ─── ActionLog ────────────────────────────────────────────────────────────────

@admin.register(ActionLog)
class ActionLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'platform', 'device', 'app_version', 'ip_address', 'created_at']
    list_filter = ['action', 'platform']
    search_fields = ['user__email', 'action', 'ip_address']
    raw_id_fields = ['user']
    readonly_fields = ['created_at']

    def has_add_permission(self, request):
        return False  # logs are created programmatically only

    def has_change_permission(self, request, obj=None):
        return False  # logs are immutable



