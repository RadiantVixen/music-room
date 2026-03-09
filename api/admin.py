from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'username', 'role', 'is_superuser']
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role',)}),
    )

    def save_model(self, request, obj, form, change):
        if obj.role == 'STAFF' and not request.user.is_superuser:
            raise PermissionError("Only superusers can assign staff role.")
        super().save_model(request, obj, form, change)

admin.site.register(CustomUser, CustomUserAdmin)
