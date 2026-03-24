"""
Music Preferences views
  - GET / PUT /api/music-preferences/
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import MusicPreferences
from .serializers import MusicPreferencesSerializer
from .logging_utils import log_action


class MusicPreferencesView(APIView):
    """
    GET  /api/music-preferences/  — retrieve the current user's music preferences
    PUT  /api/music-preferences/  — replace (or create) music preferences
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def _get_or_create_prefs(self, request):
        profile = request.user.profile
        prefs, _ = MusicPreferences.objects.get_or_create(profile=profile)
        return prefs

    def get(self, request):
        prefs = self._get_or_create_prefs(request)
        return Response(MusicPreferencesSerializer(prefs).data)

    def put(self, request):
        prefs = self._get_or_create_prefs(request)
        serializer = MusicPreferencesSerializer(prefs, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(request, 'music_preferences_updated', '')
        return Response(serializer.data)

    def patch(self, request):
        prefs = self._get_or_create_prefs(request)
        serializer = MusicPreferencesSerializer(prefs, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(request, 'music_preferences_updated', '')
        return Response(serializer.data)
