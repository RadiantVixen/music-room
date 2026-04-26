import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../features/auth/screens/SplashScreen";
import LoginScreen from "../features/auth/screens/LoginScreen";
import SignupScreen from "../features/auth/screens/SignupScreen";
import ForgotPasswordScreen from "../features/auth/screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../features/auth/screens/ResetPasswordScreen";
import VerifyEmailScreen from "../features/auth/screens/VerifyEmailScreen";
import HomeScreen from "../features/home/screens/HomeScreen";
import ProfileScreen from "../features/profile/screens/ProfileScreen";
import EditProfile from "../features/profile/screens/EditProfileScreen";
import CreateRoomScreen from "../features/rooms/screens/CreateRoomScreen";
import RoomsListScreen from "../features/rooms/screens/RoomsListScreen";
import RoomScreen from "../features/rooms/screens/RoomScreen";
import { useAuthStore } from "../store/authStore";
import ChangePasswordScreen from "../features/profile/components/ChangePasswordScreen";
import FriendsListScreen from "../features/friends/screens/FriendsListScreen";
import FriendProfileScreen from "../features/friends/screens/FriendProfileScreen";
import AllUsersScreen from "../features/friends/screens/AllUsersScreen";
import SearchTracksScreen from "../features/search/screens/SearchTracksScreen";
import TrackDetailsScreen from "../features/search/screens/TrackDetailsScreen";
import RoomSettingsScreen from "../features/rooms/screens/RoomSettingsScreen";
import RoomInvitationsScreen from "../features/rooms/screens/RoomInvitationsScreen";
import EditMusicPreferencesScreen from "../features/profile/screens/EditMusicPreferencesScreen";

// ── Premium (bonus) ──────────────────────────────────────────────────────────
import PremiumGateScreen from "../features/premium/screens/PremiumGateScreen";
import PlaylistListScreen from "../features/premium/screens/PlaylistListScreen";
import PlaylistEditorScreen from "../features/premium/screens/PlaylistEditorScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { resetToken: string };
  ChangePassword: undefined;
  VerifyEmail: { type: "signup" | "resetPassword"; email?: string };

  Home: undefined;
  Profile : { userId: string };
  EditProfile: undefined;
  
  CreateRoom: undefined;
  RoomsList: undefined;
  Room: { roomId: string };
  
  FriendsList: undefined;
  FriendProfile: { userId: number };
  AllUsers: undefined;

  SearchTracks: undefined;
  TrackDetails: { track: any };
  RoomSettings: { roomId: string };
  RoomInvitations: undefined;
  EditMusicPreferences: undefined;

  // ── Premium (bonus) ────────────────────────────────────────────────────────
  PremiumGate: undefined;
  PlaylistList: undefined;
  PlaylistEditor: { playlistId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['http://localhost:8081', 'musicroom://'],
  config: {
    screens: {
      Login: 'login',
      Signup: 'signup',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password/:resetToken',
      VerifyEmail: 'verify-email',

      Home: '',
      Profile: 'profile/:userId',
      EditProfile: 'edit-profile',
      ChangePassword: 'change-password',
      
      CreateRoom: 'create-room',
      RoomsList: 'rooms',
      Room: 'room/:roomId',
      RoomSettings: 'room/:roomId/settings',
      RoomInvitations: 'invitations',
      
      FriendsList: 'friends',
      FriendProfile: 'user/:userId',
      AllUsers: 'users',

      SearchTracks: 'search',
      TrackDetails: 'track',
      EditMusicPreferences: 'music-preferences',
    },
  },
};

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

return (
  <NavigationContainer linking={linking}>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
          <Stack.Screen name="RoomsList" component={RoomsListScreen} />
          <Stack.Screen name="Room" component={RoomScreen} />

          <Stack.Screen name="FriendsList" component={FriendsListScreen} />
          <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
          <Stack.Screen name="AllUsers" component={AllUsersScreen} />
          <Stack.Screen name="SearchTracks" component={SearchTracksScreen} />
          <Stack.Screen name="TrackDetails" component={TrackDetailsScreen} />
          <Stack.Screen name="RoomSettings" component={RoomSettingsScreen} />
          <Stack.Screen name="RoomInvitations" component={RoomInvitationsScreen} />
          <Stack.Screen name="EditMusicPreferences" component={EditMusicPreferencesScreen} />

          {/* ── Premium (bonus) ─────────────────────────────────────────── */}
          <Stack.Screen name="PremiumGate" component={PremiumGateScreen} />
          <Stack.Screen name="PlaylistList" component={PlaylistListScreen} />
          <Stack.Screen name="PlaylistEditor" component={PlaylistEditorScreen} />
        </>
      )}
    </Stack.Navigator>
  </NavigationContainer>
);
}