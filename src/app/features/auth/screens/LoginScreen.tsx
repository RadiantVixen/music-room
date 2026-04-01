import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/RootNavigator";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import AuthLayout from "../../../components/layout/AuthLayout";
import AuthInput from "../components/AuthInput";
import Button from "../../../components/Button";
import SocialButton from "../../../components/SocialButton";

import { useAuthStore } from "../../../store/authStore";

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

    navigation.replace("Home");
  } catch (error: any) {
    console.log(error?.response?.data);
  }
};

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
        <SocialButton title="Google" icon="google" />
        <SocialButton title="Facebook" icon="facebook" />
      </View>

      {/* Footer */}
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