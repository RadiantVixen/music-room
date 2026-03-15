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

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  VerifyEmail: { type: "signup" | "resetPassword" };

  Home: undefined;
  Profile : { userId: string };
  EditProfile: undefined;
  CreateRoom: undefined;
  RoomsList: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />

        {/* Home */}
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* Profile */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfile} />

        {/* Rooms */}
        <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
        <Stack.Screen name="RoomsList" component={RoomsListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}