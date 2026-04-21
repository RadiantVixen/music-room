"""
Bonus feature views (notifications, analytics, recommendations, smart playlists)
integrated into the main API app.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import (
    Notification,
    UserAnalytics,
    UserListeningHistory,
    SmartPlaylist,
    RecommendationLog,
)
from .serializers import (
    NotificationSerializer,
    UserAnalyticsSerializer,
    UserListeningHistorySerializer,
    SmartPlaylistSerializer,
    RecommendationLogSerializer,
)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoints for user notifications.
    - GET /notifications/ - List user's notifications
    - GET /notifications/{id}/ - Get single notification
    - PATCH /notifications/{id}/ - Mark as read
    - POST /notifications/mark_all_read/ - Mark all as read
    """
    
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})
    
    @action(detail=True, methods=['patch'])
    def mark_as_read(self, request, pk=None):
        """Mark specific notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


class UserAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for user analytics.
    - GET /analytics/ - Get current user's analytics
    - POST /analytics/log_activity/ - Log user activity
    """
    
    serializer_class = UserAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserAnalytics.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def log_activity(self, request):
        """Log user activity (song added, room created, etc.)."""
        activity_type = request.data.get('activity_type')
        
        analytics, _ = UserAnalytics.objects.get_or_create(user=request.user)
        
        # Update corresponding counter
        if activity_type == 'song_added':
            analytics.total_songs_added += 1
        elif activity_type == 'room_created':
            analytics.total_rooms_created += 1
        elif activity_type == 'room_joined':
            analytics.total_rooms_joined += 1
        elif activity_type == 'playlist_created':
            analytics.total_playlists_created += 1
        elif activity_type == 'login':
            analytics.total_login_count += 1
        
        analytics.save()
        return Response(UserAnalyticsSerializer(analytics).data)


class ListeningHistoryViewSet(viewsets.ModelViewSet):
    """
    API endpoints for listening history.
    - GET /listening-history/ - Get user's listening history
    - POST /listening-history/ - Log a song listen
    """
    
    serializer_class = UserListeningHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserListeningHistory.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SmartPlaylistViewSet(viewsets.ModelViewSet):
    """
    API endpoints for smart playlists.
    - GET /smart-playlists/ - List user's smart playlists
    - POST /smart-playlists/regenerate/{id}/ - Regenerate playlist
    """
    
    serializer_class = SmartPlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SmartPlaylist.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """
        Regenerate a smart playlist based on current user data.
        In production, this would call an ML service to generate new songs.
        """
        playlist = self.get_object()
        playlist.last_regenerated = timezone.now()
        playlist.save()
        return Response({
            'status': 'playlist regenerated',
            'playlist': SmartPlaylistSerializer(playlist).data
        })


class RecommendationViewSet(viewsets.ModelViewSet):
    """
    API endpoints for recommendations and recommendation logs.
    - GET /recommendations/get/ - Get recommendations for user
    - POST /recommendations/feedback/ - Log if user accepted/used recommendation
    """
    
    serializer_class = RecommendationLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return RecommendationLog.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def get_recommendations(self, request):
        """
        Generate recommendations based on user's listening history.
        Returns recommended songs/artists based on user preferences.
        """
        rec_type = request.data.get('type', 'similar_artists')
        limit = request.data.get('limit', 10)
        
        # Placeholder: In production, this would use ML model
        recommendations = {
            'type': rec_type,
            'items': [],
            'message': 'Recommendations generating...'
        }
        
        # Log this recommendation request
        RecommendationLog.objects.create(
            user=request.user,
            recommendation_type=rec_type,
            recommended_items=recommendations['items'],
            was_accepted=False
        )
        
        return Response(recommendations)
    
    @action(detail=False, methods=['post'])
    def feedback(self, request):
        """Log whether user accepted/used a recommendation."""
        rec_id = request.data.get('recommendation_id')
        was_accepted = request.data.get('was_accepted', False)
        
        try:
            rec_log = RecommendationLog.objects.get(id=rec_id, user=request.user)
            rec_log.was_accepted = was_accepted
            rec_log.save()
            return Response({'status': 'feedback recorded', 'recommendation': RecommendationLogSerializer(rec_log).data})
        except RecommendationLog.DoesNotExist:
            return Response({'error': 'Recommendation not found'}, status=status.HTTP_404_NOT_FOUND)
