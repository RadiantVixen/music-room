from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class Command(BaseCommand):
    help = "Creates a default admin user if it doesn't exist"

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_ADMIN_EMAIL")
        password = os.getenv("DJANGO_ADMIN_PASSWORD")

        if not email or not password:
            self.stdout.write(self.style.ERROR(
                "DJANGO_ADMIN_EMAIL or DJANGO_ADMIN_PASSWORD not set in environment."
            ))
            return

        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(
                email=email,
                password=password,
                username="Hubbyadmin",
                role="ADMIN"  # or 'ADMIN' if that’s in your choices
            )
            self.stdout.write(self.style.SUCCESS("✅ Default admin user created!"))
        else:
            self.stdout.write(self.style.WARNING("⚠️ Default admin user already exists."))
