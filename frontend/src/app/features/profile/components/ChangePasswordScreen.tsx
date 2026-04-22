import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import AppLayout from "../../../components/layout/AppLayout";
import { useAuthStore } from "../../../store/authStore";
import { useNavigation } from "@react-navigation/native";

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const changePassword = useAuthStore((state) => state.changePassword);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Alert.alert("Error", "All fields are required");
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      Alert.alert("Success", "Password updated successfully");

      navigation.goBack();
    } catch (e: any) {
      console.log(e);
      Alert.alert("Error", e?.response?.data?.errors?.old_password || "Failed to update password");
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Change Password</Text>

        <Input
          label="Current Password"
          value={oldPassword}
          onChangeText={setOldPassword}
          secure
        />

        <Input
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secure
        />

        <Input
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secure
        />

        <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
          <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

function Input({
  label,
  value,
  onChangeText,
  secure,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        style={styles.input}
        placeholder={label}
        placeholderTextColor="#666"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  label: {
    color: "#aaa",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#9956f5",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});