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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

return (
  <NavigationContainer>
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
        </>
      )}
    </Stack.Navigator>
  </NavigationContainer>
);
}