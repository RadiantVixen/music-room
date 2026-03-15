import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import AuthLayout from "../../../components/layout/AuthLayout";
import AuthInput from "../components/AuthInput";
import Button from "../../../components/Button";

export default function ResetPasswordScreen() {
  const navigation = useNavigation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdatePassword = () => {
    console.log("Update password:", password);

    // after success navigate back to login
    navigation.navigate("Login" as never);
  };

  return (
    <AuthLayout>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="lock-closed-outline" size={32} color="#9956F5" />
        </View>

        <Text style={styles.title}>Set New Password</Text>

        <Text style={styles.subtitle}>
          Your new password must be different from your previous password.
        </Text>
      </View>

      {/* Form */}
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
          title="Update Password"
          onPress={handleUpdatePassword}
        />

      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Remember your password?
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login" as never)}
        >
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