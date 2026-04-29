import React, { useEffect } from "react";
import RootNavigator from "./src/app/navigation/RootNavigator";
import { useAuthStore } from "./src/app/store/authStore";
import SplashScreen from "./src/app/features/auth/screens/SplashScreen";
import { injectScrollbarStyles } from "./src/app/utils/scrollbarStyle";
import { SafeAreaProvider } from "react-native-safe-area-context";
import OfflineNotice from "./src/app/components/common/OfflineNotice";

// import { Toaster } from "react-hot-toast";
// import { Platform } from "react-native";

export default function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  useEffect(() => {
    injectScrollbarStyles();
    restoreSession();
  }, []);

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <OfflineNotice />
      <RootNavigator />
      
    </SafeAreaProvider>
  );
}
