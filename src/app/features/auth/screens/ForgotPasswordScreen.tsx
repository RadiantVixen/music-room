import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AuthLayout from "../../../components/layout/AuthLayout";
import AuthInput from "../components/AuthInput";
import Button from "../../../components/Button";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/RootNavigator";
import { useAuthStore } from "../../../store/authStore";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  type NavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "ForgotPassword"
  >;

  const navigation = useNavigation<NavigationProp>();
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleSendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }

    try {
      await forgotPassword(normalizedEmail);

      Alert.alert("Check your email", "We sent you a 6-digit password reset code.", [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("VerifyEmail", {
              type: "resetPassword",
              email: normalizedEmail,
            }),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <AuthLayout>
      <View style={styles.iconBox}>
        <Ionicons name="lock-closed-outline" size={32} color="#9956F5" />
      </View>

      <Text style={styles.title}>Reset Password</Text>

      <Text style={styles.description}>
        Enter your email address and we’ll send you a 6-digit reset code.
      </Text>

      <Text style={styles.label}>Email Address</Text>

      <AuthInput
        placeholder="yourname@example.com"
        value={email}
        onChangeText={setEmail}
      />

      <Button
        title={isLoading ? "Sending..." : "Send Code"}
        onPress={handleSendCode}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Remember your password?</Text>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}> Log in</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: "rgba(153,86,245,0.15)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#9CA3AF",
    lineHeight: 24,
    marginBottom: 32,
  },
  label: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    paddingBottom: 40,
  },
  footerText: {
    color: "#9CA3AF",
  },
  loginText: {
    color: "#9956F5",
    fontWeight: "600",
  },
});