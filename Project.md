# 1. Project Overview & Architecture
- Music Room: Collaborative real-time music app featuring live track voting, multi-user playlists, and device control delegation.
- Architecture: React Native Web + Mobile multi-platform approach utilizing Feature-Sliced Design (FSD) for modularity.

# 2. Tech Stack
- UI/Framework: React Native, Expo, React Navigation.
- State Management: Global stores in `store/`.
- API/Networking: Axios/Fetch API + WebSockets for real-time room sync.
- Styling: Custom theme system in `theme/`.

# 3. Condensed File Structure
- `src/app/api/`: REST API clients (`auth`, `rooms`, `friends`, `spotify`).
- `src/app/components/`: Shared global UI (`AppLayout`, `MiniPlayer`, `BottomNavbar`).
- `src/app/features/`: Domain-specific modules encapsulating their own screens and components:
  - `/auth`: Login and Signup flows.
  - `/friends`: Friend lists and user profiles.
  - `/home`: Dashboard and featured rooms.
  - `/profile`: User settings and preferences.
  - `/rooms`: Core domain logic (voting, delegation, queues, playback).
  - `/search`: Track search and details.
- `src/app/navigation/`: App routing flows (`AuthNavigator`, `MainNavigator`, `RootNavigator`).
- `src/app/services/`: Real-time WebSocket hooks (`useVoteRoomSocket`, `useDelegationRoomSocket`).
- `src/app/store/`: Global state managers (`authStore`, `friendsStore`, `roomsStore`).
- `src/app/theme/`: Global styling tokens (`colors`, `spacing`, `typography`).
- `src/app/utils/`: Global helpers (`useAudioPlayer`).

# 4. Core Workflows
- Authentication: Routed via `AuthNavigator`; state and JWTs managed by `authStore` and injected into API clients.
- Real-Time Rooms: Screens mount WebSocket hooks from `services/` to listen for live vote/queue events and dispatch updates to `roomsStore`.
- Multi-Platform UI: Leverages responsive layouts (`useWindowDimensions`) and web fallbacks to ensure seamless parity between Desktop Web and Mobile.

# 5. Developer Rules & LLM Guidelines
1. Ensure code is compatible with BOTH React Native Web and Mobile (avoid native-only packages without web fallbacks; use `useWindowDimensions`).
2. Strictly follow the feature-based folder structure.
3. Utilize existing state stores instead of deep prop-drilling.
4. NEVER suggest `npm audit fix`; rely exclusively on `npx expo install --fix`.
