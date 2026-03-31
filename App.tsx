import React, { useEffect } from "react";
import RootNavigator from "./src/app/navigation/RootNavigator";
import { useAuthStore } from "./src/app/store/authStore";
import SplashScreen from "./src/app/features/auth/screens/SplashScreen";

export default function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    restoreSession();
  }, []);

  if (isLoading) {
    return <SplashScreen />; // 👈 instead of null
  }

  return <RootNavigator />;
}