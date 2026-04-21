# Music Room Bonus Features

This folder contains bonus features for the Music Room application, including notifications, analytics, smart playlists, and recommendation systems.

## Folder Structure

```
bonus/
├── backend/                 # Django backend bonus models, serializers, views
│   ├── models.py           # Notification, Analytics, Playlist models
│   ├── serializers.py      # REST API serializers
│   └── views.py            # ViewSets for bonus API endpoints
├── frontend/               # React Native bonus screens
│   ├── NotificationCenterScreen.tsx    # Notification center UI
│   ├── AnalyticsDashboardScreen.tsx    # Analytics dashboard UI
│   ├── SmartPlaylistsScreen.tsx        # Smart playlists UI
│   └── useBonusFeatures.ts             # Hook for bonus API calls
└── INTEGRATION_GUIDE.md    # Step-by-step integration instructions
```

## Features

### 1. **Notifications System** 📬
- Real-time user notifications for friend requests, room invites, song additions
- Mark notifications as read
- Track unread notification count
- Notification types: friend_request, room_invite, song_added, friend_online, system

### 2. **Analytics Dashboard** 📊
- Track user activity metrics:
  - Total songs added
  - Total rooms created/joined
  - Total playlists created
  - Login count and last active timestamp
- Visual stats cards with icons
- Activity insights and personalized recommendations

### 3. **Smart Playlists** ✨
- AI-generated playlists:
  - Daily Mix (personalized daily music)
  - Genre/Mood Mix
  - Discovery Playlist (new music recommendations)
  - Friends' Favorites
  - Trending Now
- Regenerate playlists to get fresh songs
- Visual playlist management interface

### 4. **Recommendation Engine** 🎯
- Get recommendations based on listening history
- Track recommendation acceptance
- Support for multiple recommendation types:
  - Similar artists
  - Genre mood
  - Discovery based on listening patterns
- Feedback logging to improve recommendations

### 5. **Listening History** 📝
- Track every song the user listens to
- Log song duration and genre
- Use for personalized recommendations
- Export listening patterns

## Quick Start

### Backend Setup

1. Copy bonus models to your Django API app:
```bash
cp bonus/backend/models.py backend/api/bonus_models.py
cp bonus/backend/serializers.py backend/api/bonus_serializers.py
cp bonus/backend/views.py backend/api/bonus_views.py
```

2. Register the models in Django `admin.py` (if you want admin interface access)

3. Add to your `urls.py`:
```python
from rest_framework.routers import DefaultRouter
from api.bonus_views import NotificationViewSet, UserAnalyticsViewSet, ListeningHistoryViewSet, SmartPlaylistViewSet, RecommendationViewSet

router = DefaultRouter()
router.register(r'bonus/notifications', NotificationViewSet)
router.register(r'bonus/analytics', UserAnalyticsViewSet)
router.register(r'bonus/listening-history', ListeningHistoryViewSet)
router.register(r'bonus/smart-playlists', SmartPlaylistViewSet)
router.register(r'bonus/recommendations', RecommendationViewSet)

urlpatterns = [...] + router.urls
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Frontend Setup

1. Copy bonus screens to your app:
```bash
cp bonus/frontend/*.tsx src/app/features/bonus/
cp bonus/frontend/*.ts src/app/hooks/
```

2. Add bonus routes to your navigation stack (see INTEGRATION_GUIDE.md)

3. Use the `useBonusFeatures` hook in your components:
```typescript
import { useBonusFeatures } from '../bonus/useBonusFeatures';

function MyComponent() {
  const { logActivity, logSongListen } = useBonusFeatures();
  
  // Log activities automatically
  await logActivity('song_added');
}
```

## API Endpoints

### Notifications
- `GET /api/bonus/notifications/` - List notifications
- `POST /api/bonus/notifications/mark_all_read/` - Mark all as read
- `GET /api/bonus/notifications/unread_count/` - Get unread count

### Analytics
- `GET /api/bonus/analytics/` - Get user analytics
- `POST /api/bonus/analytics/log_activity/` - Log activity

### Listening History
- `GET /api/bonus/listening-history/` - Get listening history
- `POST /api/bonus/listening-history/` - Add listen entry

### Smart Playlists
- `GET /api/bonus/smart-playlists/` - List playlists
- `POST /api/bonus/smart-playlists/{id}/regenerate/` - Regenerate

### Recommendations
- `POST /api/bonus/recommendations/get_recommendations/` - Get recommendations
- `POST /api/bonus/recommendations/feedback/` - Log feedback

## Database Schema

### Models

**Notification**
- user (ForeignKey)
- notification_type (CharField)
- title, message (TextField)
- from_user (ForeignKey, optional)
- is_read (BooleanField)
- created_at, updated_at

**UserAnalytics**
- user (OneToOneField)
- total_songs_added
- total_rooms_created/joined
- total_playlists_created
- total_login_count
- last_active

**UserListeningHistory**
- user (ForeignKey)
- song_id, song_title, artist_name
- genre (CharField)
- listened_at (DateTimeField)
- duration_listened

**SmartPlaylist**
- user (ForeignKey)
- name, description
- playlist_type (CharField)
- songs (JSONField - array of song IDs)
- is_active (BooleanField)
- last_regenerated

**RecommendationLog**
- user (ForeignKey)
- recommendation_type
- recommended_items (JSONField)
- was_accepted (BooleanField)

## Usage Examples

### Log User Activity
```typescript
const { logActivity } = useBonusFeatures();

// When user adds a song
await logActivity('song_added');

// When user creates a room
await logActivity('room_created');

// When user joins a room
await logActivity('room_joined');
```

### Log Song Listen
```typescript
const { logSongListen } = useBonusFeatures();

await logSongListen(
  123,                    // songId
  "Blinding Lights",     // songTitle
  "The Weeknd",          // artistName
  "Electronic",          // genre (optional)
  180                    // durationListened in seconds (optional)
);
```

### Get Recommendations
```typescript
const { getRecommendations } = useBonusFeatures();

const recommendations = await getRecommendations(
  'similar_artists',     // type
  10                     // limit
);
```

## Performance Considerations

- Analytics updates are batched (not real-time)
- Listening history can be pruned monthly to save storage
- Smart playlists are regenerated on-demand (not real-time)
- Indexes on `user` and `listened_at` for fast queries

## Future Enhancements

- [ ] Real-time notifications using WebSockets
- [ ] Machine learning-based recommendation engine
- [ ] Social sharing of playlists
- [ ] Analytics export (CSV/PDF)
- [ ] Advanced filtering on listening history
- [ ] Collaborative playlists
- [ ] Push notifications for important events
- [ ] Listening stats by time period (weekly, monthly)

## Testing

Run API tests:
```bash
python manage.py test api.tests.test_bonus_features
```

## Support

For issues or questions about bonus features, please refer to INTEGRATION_GUIDE.md or open an issue in the repository.
