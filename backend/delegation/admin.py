from django.contrib import admin
from .models import DeviceDelegation


@admin.register(DeviceDelegation)
class DeviceDelegationAdmin(admin.ModelAdmin):
    list_display = ['device_name', 'device_identifier', 'room', 'owner', 'delegated_to', 'status', 'created_at']
    list_filter = ['status', 'room']
    search_fields = ['device_name', 'device_identifier', 'owner__email']
    raw_id_fields = ['room', 'owner', 'delegated_to']
    readonly_fields = ['created_at', 'updated_at']
