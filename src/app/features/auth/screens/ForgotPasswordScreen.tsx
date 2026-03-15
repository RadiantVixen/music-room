import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import AuthLayout from "../../../components/layout/AuthLayout";
import AuthInput from "../components/AuthInput";
import Button from "../../../components/Button";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../../navigation/RootNavigator";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  type NavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "ForgotPassword"
  >;

  const navigation = useNavigation<NavigationProp>();
  const handleSendCode = () => {
    // later this will call your API
    console.log("Send reset code to:", email);

    navigation.navigate("VerifyEmail", { type: "resetPassword" });
  };

  return (
    <AuthLayout>
      <View style={styles.iconBox}>
        <Ionicons name="lock-closed-outline" size={32} color="#9956F5" />
      </View>

      <Text style={styles.title}>Reset Password</Text>

      <Text style={styles.description}>
        Enter your email address to receive a verification code to your
        registered Music Room account.
      </Text>

      <Text style={styles.label}>Email Address</Text>

      <AuthInput
        placeholder="yourname@example.com"
        value={email}
        onChangeText={setEmail}
      />

      <Button title="Send Code" onPress={handleSendCode} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Remember your password?</Text>

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