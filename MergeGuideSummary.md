# 🏁 Premium Bonus Feature: Merge Guide (v2.0)

This guide summarizes all modifications made to implement the **Premium Bonus Features** (Playlists, Collaborative Editing, Global Playback, and Offline Mode).

## 🚀 Overview of Added Features
- **Premium Playlists**: Full CRUD for user playlists.
- **Collaborative Mode**: Real-time playlist editing with other users.
- **Global Playback**: A persistent `MiniPlayer` that stays active across all screens.
- **Offline Mode**: Local caching of playlists and track downloading for offline listening.

---

## 📁 1. New Isolated Directories
*No detailed merge needed for these; just copy the entire folders.*

### Backend
- `backend/premium/`: Contains models, views, and serializers for the premium system.

### Frontend
- `frontend/src/app/features/premium/`: Contains all screens and components for Playlists, Premium Gating, and Collaborators.

---

## 📄 2. New Supporting Files (Outside Premium Folders)
*These files were added to support global functionality but reside in shared directories.*

### State & Logic
- `frontend/src/app/store/premiumStore.ts`: Zustand store for premium state (playlists/offline).
- `frontend/src/app/store/playbackStore.ts`: Global audio queue and status manager.
- `frontend/src/app/utils/useAudioPlayer.ts`: Custom hook for `expo-av` audio management.
- `frontend/src/app/offline/premiumStorage.ts`: Local file system and cache logic (`AsyncStorage` + `FileSystem`).

### UI Components
- `frontend/src/app/components/MiniPlayer.tsx`: The persistent playback control bar.

### API Services
- `frontend/src/app/api/premium.ts`: API client for the premium backend endpoints.

---

## 🛠️ 3. Modifications to Existing Files
*All changes in these files are encapsulated within `START MODIFICATION - PREMIUM BONUS` and `END MODIFICATION` comment blocks.*

### 🟢 Frontend
1. **`frontend/src/app/navigation/RootNavigator.tsx`**
   - Added imports and route definitions for Premium screens.
   - Wrapped the entire navigation stack in a `View` to support the global `MiniPlayer`.
2. **`frontend/src/app/features/home/screens/HomeScreen.tsx`**
   - Added a "Quick Access" banner for My Playlists.
3. **`frontend/src/app/features/profile/components/ProfileSettings.tsx`**
   - Added the "PREMIUM" settings section for upgrading and playlist management.
4. **`frontend/package.json`**
   - Added dependencies: `expo-file-system`, `expo-av`.

### 🔵 Backend
1. **`backend/auth/settings.py`** (Main auth service)
   - Added `'premium'` to `INSTALLED_APPS`.
   - Added throttle rates for `'search'`, `'social'`, `'premium'`, and `'playlists'`.
2. **`backend/auth/urls.py`**
   - Added the premium URLs: `path('api/premium/', include('premium.urls'))`.
3. **`backend/api/` (Core API Views)**
   - Added `throttle_classes` to global search and social views (Friends, Room Invites, Deezer Search).

---

## 🏁 How to Merge
1. **Filesystem**: Copy the `backend/premium` and `frontend/src/app/features/premium` folders.
2. **Dependencies**: Run `npm install` in the frontend directory.
3. **Scan for Comments**: In your IDE, search for `PREMIUM BONUS` to find every specific line modified in existing files and verify they match your parent branch.
4. **Database**: Run `python manage.py makemigrations premium` and `python manage.py migrate` on the backend.

**Merge Status**: Ready for integration.