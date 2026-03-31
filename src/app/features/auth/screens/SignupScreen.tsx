import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import AuthLayout from "../../../components/layout/AuthLayout";
import AuthInput from "../components/AuthInput";
import Button from "../../../components/Button";
import SocialButton from "../../../components/SocialButton";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/RootNavigator";

import { useAuthStore } from "../../../store/authStore";

export default function SignupScreen() {
  type NavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "Signup"
    >;

  const navigation = useNavigation<NavigationProp>();
  const signup = useAuthStore((state) => state.signup);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async () => {
  try {
    await signup({
      full_name: fullName,
      email,
      password,
      confirm_password: confirmPassword,
    });
    Alert.alert("Success", "Account created successfully");

    navigation.navigate("Login");
  } catch (error: any) {
    console.log(error?.response?.data);
    Alert.alert("Signup failed", JSON.stringify(error?.response?.data || {}));
  }
};

  return (
    <AuthLayout showDecorations={false}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Ionicons name="musical-notes" size={36} color="#9956F5" />
        </View>

        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>
          Join Music Room and start collaborative listening
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
        <AuthInput
          placeholder="John Doe"
          value={fullName}
          onChangeText={setFullName}
        />

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

        <Text style={styles.label}>Confirm Password</Text>
        <AuthInput
          placeholder="••••••••"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Button
          title="Create Account"
          onPress={handleSignup}
        />

      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
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
          Already have an account?
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login" as never)}
        >
          <Text style={styles.loginText}> Log In</Text>
        </TouchableOpacity>
      </View>

    </AuthLayout>
  );
}

const styles = StyleSheet.create({

  header: {
    alignItems: "center",
    marginTop: 20,
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

  loginText: {
    color: "#9956F5",
    fontWeight: "600",
  },

});