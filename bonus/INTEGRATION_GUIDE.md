/**
 * BONUS FEATURES INTEGRATION GUIDE
 * 
 * This document describes how to integrate the bonus features
 * (Notifications, Analytics, Smart Playlists, Recommendations)
 * into the main Music Room application.
 */

// 1. ADD BONUS ROUTES TO YOUR NAVIGATION STACK
// In frontend/src/app/navigation/RootNavigator.tsx or MainNavigator.tsx:

/*
import NotificationCenterScreen from '../bonus/NotificationCenterScreen';
import AnalyticsDashboardScreen from '../bonus/AnalyticsDashboardScreen';
import SmartPlaylistsScreen from '../bonus/SmartPlaylistsScreen';

// Add to your stack navigator:
<Stack.Screen
  name="NotificationCenter"
  component={NotificationCenterScreen}
  options={{ title: 'Notifications' }}
/>
<Stack.Screen
  name="AnalyticsDashboard"
  component={AnalyticsDashboardScreen}
  options={{ title: 'Analytics' }}
/>
<Stack.Screen
  name="SmartPlaylists"
  component={SmartPlaylistsScreen}
  options={{ title: 'Smart Playlists' }}
/>
*/

// 2. USE THE BONUS HOOK IN YOUR COMPONENTS
// In any screen component:

/*
import { useBonusFeatures } from '../bonus/useBonusFeatures';

function MyComponent() {
  const { logActivity, logSongListen, getRecommendations } = useBonusFeatures();
  
  // Log when user adds a song
  const handleAddSong = async () => {
    // ... add song logic ...
    await logActivity('song_added');
  };
  
  // Log when song is played
  const handlePlaySong = async (song) => {
    await logSongListen(
      song.id,
      song.title,
      song.artist,
      song.genre,
      song.duration
    );
  };
}
*/

// 3. BACKEND INTEGRATION
// The bonus models and views are in bonus/backend/ folder.
// To integrate them into your Django project:

// a) Copy the models to your main API app:
//    - bonus/backend/models.py → backend/api/bonus_models.py

// b) Copy the serializers:
//    - bonus/backend/serializers.py → backend/api/bonus_serializers.py

// c) Copy the views:
//    - bonus/backend/views.py → backend/api/bonus_views.py

// d) Add to backend/api/urls.py:
/*
from rest_framework.routers import DefaultRouter
from .bonus_views import (
    NotificationViewSet,
    UserAnalyticsViewSet,
    ListeningHistoryViewSet,
    SmartPlaylistViewSet,
    RecommendationViewSet,
)

router = DefaultRouter()
router.register(r'bonus/notifications', NotificationViewSet, basename='notification')
router.register(r'bonus/analytics', UserAnalyticsViewSet, basename='analytics')
router.register(r'bonus/listening-history', ListeningHistoryViewSet, basename='listening-history')
router.register(r'bonus/smart-playlists', SmartPlaylistViewSet, basename='smart-playlist')
router.register(r'bonus/recommendations', RecommendationViewSet, basename='recommendation')

urlpatterns = [
    # ... existing patterns ...
] + router.urls
*/

// e) Run migrations:
//    python manage.py makemigrations
//    python manage.py migrate

// 4. ADD NOTIFICATION BADGE TO APP HEADER
// In AppHeader.tsx:

/*
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';

function AppHeader() {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useFocusEffect(
    useCallback(() => {
      const fetchUnreadCount = async () => {
        try {
          const response = await api.get('/bonus/notifications/unread_count/');
          setUnreadCount(response.data.unread_count);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };
      
      fetchUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }, [])
  );
  
  return (
    <View>
      {/* ... existing header content ... */}
      <TouchableOpacity onPress={() => navigation.navigate('NotificationCenter')}>
        <Ionicons name="notifications" size={24} color="#9956F5" />
        {unreadCount > 0 && (
          <View style={{ position: 'absolute', top: -8, right: -8 }}>
            <Text style={{ backgroundColor: '#FF6B9D', color: 'white', borderRadius: 8 }}>
              {unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
*/

// 5. ADD BONUS FEATURES TO MAIN NAVIGATION MENU
// In BottomNavbar.tsx or appropriate menu:

/*
<NavigationButton
  label="Notifications"
  icon="notifications"
  onPress={() => navigation.navigate('NotificationCenter')}
/>
<NavigationButton
  label="Analytics"
  icon="stats-chart"
  onPress={() => navigation.navigate('AnalyticsDashboard')}
/>
<NavigationButton
  label="Smart Playlists"
  icon="sparkles"
  onPress={() => navigation.navigate('SmartPlaylists')}
/>
*/

// 6. API ENDPOINTS REFERENCE
/*
NOTIFICATIONS:
  GET    /api/bonus/notifications/              - List user's notifications
  GET    /api/bonus/notifications/{id}/         - Get single notification
  PATCH  /api/bonus/notifications/{id}/         - Mark as read
  POST   /api/bonus/notifications/mark_all_read/ - Mark all as read
  GET    /api/bonus/notifications/unread_count/ - Get unread count

ANALYTICS:
  GET    /api/bonus/analytics/                  - Get user's analytics
  POST   /api/bonus/analytics/log_activity/     - Log user activity

LISTENING HISTORY:
  GET    /api/bonus/listening-history/          - Get listening history
  POST   /api/bonus/listening-history/          - Log a song listen

SMART PLAYLISTS:
  GET    /api/bonus/smart-playlists/            - List smart playlists
  POST   /api/bonus/smart-playlists/            - Create smart playlist
  POST   /api/bonus/smart-playlists/{id}/regenerate/ - Regenerate playlist

RECOMMENDATIONS:
  POST   /api/bonus/recommendations/get_recommendations/ - Get recommendations
  POST   /api/bonus/recommendations/feedback/   - Log recommendation feedback
*/

// 7. ACTIVITY TYPES FOR LOGGING
/*
logActivity('song_added')      - When user adds a song to a room
logActivity('room_created')    - When user creates a new room
logActivity('room_joined')     - When user joins a room
logActivity('playlist_created') - When user creates a playlist
logActivity('login')           - When user logs in (call on app startup)
*/

export default {};
