import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AuthLayout from "../../../components/layout/AuthLayout";
import Button from "../../../components/Button";
import { useAppNavigation } from "../../../hooks/useAppNavigation";
import { useAppRoute } from "../../../hooks/useAppRoute";
import { useAuthStore } from "../../../store/authStore";

export default function VerifyEmailScreen() {
  const navigation = useAppNavigation();
  const route = useAppRoute<"VerifyEmail">();
  const { type, email } = route.params;

  const verifyResetCode = useAuthStore((state) => state.verifyResetCode);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, "").slice(0, 1);

    const updatedCode = [...code];
    updatedCode[index] = cleanValue;
    setCode(updatedCode);

    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = code.join("");

    if (otp.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code.");
      return;
    }

    if (type === "resetPassword") {
      if (!email) {
        Alert.alert("Error", "Email is missing.");
        return;
      }

      try {
        const response = await verifyResetCode(email, otp);
        const resetToken = response?.data?.reset_token;

        if (!resetToken) {
          Alert.alert("Error", "Reset token not received.");
          return;
        }

        navigation.navigate("ResetPassword", { resetToken });
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.response?.data?.error || "Invalid or expired code."
        );
      }
    } else {
      navigation.navigate("Login");
    }
  };

  const handleResend = async () => {
    if (type === "resetPassword" && email) {
      try {
        await forgotPassword(email);
        Alert.alert("Code sent", "A new 6-digit code was sent to your email.");
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.response?.data?.message || "Could not resend code."
        );
      }
    }
  };

  return (
    <AuthLayout>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="musical-notes" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.brandText}>Music Room</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.heroIconWrapper}>
          <Ionicons name="mail-unread-outline" size={34} color="#9956F5" />
        </View>

        <Text style={styles.title}>Verify Email</Text>

        <Text style={styles.description}>
          We sent a 6-digit code to your email. Please enter it below to continue.
        </Text>

        <View style={styles.otpRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              value={digit}
              onChangeText={(value) => handleChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              style={styles.otpInput}
              selectionColor="#9956F5"
            />
          ))}
        </View>

        <Button
          title={isLoading ? "Verifying..." : "Verify"}
          onPress={handleVerify}
        />

        <View style={styles.resendWrapper}>
          <Text style={styles.resendText}>Didn&apos;t receive the code?</Text>
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}> Resend Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.waveCard}>
          <View style={styles.waveBars}>
            <View style={[styles.bar, { height: 64, opacity: 0.35 }]} />
            <View style={[styles.bar, { height: 86, opacity: 0.55 }]} />
            <View style={[styles.bar, { height: 72, opacity: 0.75 }]} />
            <View style={[styles.bar, { height: 100, opacity: 1 }]} />
            <View style={[styles.bar, { height: 68, opacity: 0.6 }]} />
            <View style={[styles.bar, { height: 56, opacity: 0.35 }]} />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2024 Music Room Premium. All rights reserved.
        </Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 4,
    marginBottom: 28,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#9956F5",
    alignItems: "center",
    justifyContent: "center",
  },

  brandText: {
    color: "#F3F4F6",
    fontSize: 18,
    fontWeight: "700",
  },

  content: {
    flex: 1,
    alignItems: "center",
  },

  heroIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(153,86,245,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    marginTop: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },

  description: {
    fontSize: 16,
    lineHeight: 26,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 28,
    flexWrap: "wrap",
  },

  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#334155",
    backgroundColor: "rgba(30,41,59,0.35)",
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },

  resendWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 40,
    flexWrap: "wrap",
  },

  resendText: {
    color: "#9CA3AF",
    fontSize: 14,
  },

  resendLink: {
    color: "#9956F5",
    fontSize: 14,
    fontWeight: "600",
  },

  waveCard: {
    marginTop: "auto",
    width: "100%",
    height: 170,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(153,86,245,0.08)",
    justifyContent: "center",
    paddingHorizontal: 28,
    marginBottom: 28,
  },

  waveBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bar: {
    width: 5,
    borderRadius: 999,
    backgroundColor: "#9956F5",
  },

  footer: {
    alignItems: "center",
    paddingBottom: 22,
  },

  footerText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
});