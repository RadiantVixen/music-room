import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

export default function AuthInput(props: TextInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    height: 56,
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  input: {
    color: colors.text,
    fontSize: 15,
  },
});