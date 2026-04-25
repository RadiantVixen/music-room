import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

type Props = {
  title: string;
  icon: "google" | "facebook";
  onPress?: () => void;
  disabled?: boolean;
};

export default function SocialButton({ title, icon, onPress, disabled }: Props) {
  return (
    <TouchableOpacity 
      style={[styles.button, disabled && styles.buttonDisabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.content}>
        <FontAwesome name={icon} size={18} color={disabled ? "#8D86A5" : "#fff"} />
        <Text style={[styles.text, disabled && styles.textDisabled]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2338",
    backgroundColor: "#1B1629",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: "#0F0B16",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  textDisabled: {
    color: "#8D86A5",
  },
});