import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AuthLayout from "../../../components/layout/AuthLayout";
import AuthInput from "../components/AuthInput";
import Button from "../../../components/Button";
import { useAuthStore } from "../../../store/authStore";
import { useAppRoute } from "../../../hooks/useAppRoute";

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const route = useAppRoute<"ResetPassword">();
  const { resetToken } = route.params;

  const handleUpdatePassword = async () => {
    if (!resetToken) {
      Alert.alert("Error", "Reset session is missing or invalid.");
      return;
    }

    try {
      await resetPassword(resetToken, password, confirmPassword);

      Alert.alert("Success", "Your password has been updated.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Login" as never),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Could not reset password."
      );
    }
  };

  return (
    <AuthLayout>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="lock-closed-outline" size={32} color="#9956F5" />
        </View>

        <Text style={styles.title}>Set New Password</Text>

        <Text style={styles.subtitle}>
          Your new password must be different from your previous password.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>New Password</Text>
        <AuthInput
          placeholder="Enter new password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>Confirm Password</Text>
        <AuthInput
          placeholder="Confirm password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Button
          title={isLoading ? "Updating..." : "Update Password"}
          onPress={handleUpdatePassword}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Remember your password?</Text>

        <TouchableOpacity onPress={() => navigation.navigate("Login" as never)}>
          <Text style={styles.loginText}> Log in</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  iconBox: {
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
    marginBottom: 8,
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
  },
  footerText: {
    color: "#9CA3AF",
  },
  loginText: {
    color: "#9956F5",
    fontWeight: "600",
  },
});