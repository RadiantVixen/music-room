import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/RootNavigator";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import AuthLayout from "../../../components/layout/AuthLayout";
import AuthInput from "../components/AuthInput";
import Button from "../../../components/Button";
import SocialButton from "../../../components/SocialButton";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useAuthStore } from "../../../store/authStore";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  type NavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "Login"
  >;

  const navigation = useNavigation<NavigationProp>();

  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      console.log("Login button pressed with email:", email);
      await login({
        email,
        password,
      });
      console.log("Login successful, navigating to Home1");

      navigation.replace("Home");
      console.log("Login successful, navigating to Home");
    } catch (error: any) {
      console.log(error?.response?.data);
    }
  };

  const socialLogin = useAuthStore((state) => state.socialLogin);
  
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID || "128725109709-mqh05ibekghkpd9kjufj0ngk4c7gka22.apps.googleusercontent.com";
  const googleExtraIds = (process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_IDS || "128725109709-kclrsis87u7trjbbmcqugkb942i0pl3k.apps.googleusercontent.com").split(",");
  const googleAndroidClientId = googleExtraIds[0]?.trim?.() || googleExtraIds[0];
  const googleIosClientId = googleExtraIds[1]?.trim?.() || googleExtraIds[1];

  const isGoogleConfigured = true; // Force true since we have fallbacks
  
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "musicroom",
    path: "redirect",
  });
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleWebClientId || "placeholder-web-client-id",
    androidClientId: googleAndroidClientId,
    iosClientId: googleIosClientId,
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken;

      if (!idToken) return;

      socialLogin("google", idToken);
    }
  }, [response]);

  const handleGoogleLogin = async () => {
    console.log("Google Login button clicked");
    console.log("Configuration status:", {
      isGoogleConfigured,
      googleWebClientId,
      googleAndroidClientId,
      googleIosClientId,
      redirectUri
    });

    if (!promptAsync) {
      console.error("promptAsync is not defined!");
      alert("Google Auth is not ready yet. Please wait a moment or refresh.");
      return;
    }

    try {
      console.log("Calling promptAsync...");
      const result = await promptAsync();
      console.log("promptAsync result:", result);
    } catch (e) {
      console.error("Error calling promptAsync:", e);
      alert("Error starting Google Login: " + e.message);
    }
  };

  const handleFacebookLogin = () => {
    console.log("Facebook login pressed");
  };


  console.log("Google Client ID:", googleWebClientId);

  return (
    <AuthLayout showBackButton={false} showDecorations={false}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Ionicons name="musical-notes" size={36} color="#9956F5" />
        </View>

        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>
          Log in to your Music Room account
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>

        <Text style={styles.label}>Email Address</Text>
        <AuthInput
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>

        <AuthInput
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button
          title="Login to Room"
          onPress={handleLogin}
        />

      </View>

      {/* Footer - Sign Up Link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={styles.signupText}> Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>
          OR CONTINUE WITH
        </Text>
        <View style={styles.line} />
      </View>

      {/* Social */}
      <View style={styles.socialRow}>
        <SocialButton
          title="Google"
          icon="google"
          onPress={handleGoogleLogin}
          // disabled={!isGoogleConfigured}
        />
        <SocialButton
          title="Facebook"
          icon="facebook"
          // onPress={handleFacebookLogin}
        />
      </View>

    </AuthLayout>
  );
}

const styles = StyleSheet.create({

  header: {
    alignItems: "center",
    marginTop: 80,
    marginBottom: 40,
  },

  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(153,86,245,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },

  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    textAlign: "center",
  },

  form: {
    marginBottom: 20,
  },

  label: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginLeft: 4,
  },

  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  forgotText: {
    color: "#9956F5",
    fontSize: 13,
    fontWeight: "600",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#2A2338",
  },

  dividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    color: "#7E7A90",
    fontWeight: "600",
    letterSpacing: 1,
  },

  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
  },

  footerText: {
    color: "#9CA3AF",
  },

  signupText: {
    color: "#9956F5",
    fontWeight: "600",
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 0,
    marginBottom: 20,
  },

});