import React, { ReactNode } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import GoBackButton from "../GoBackButton";

type Props = {
  children: ReactNode;
  showBackButton?: boolean;
  showDecorations?: boolean;
};

export default function AuthLayout({
  children,
  showBackButton = true,
  showDecorations = true,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      
      {showBackButton && (
        <View style={styles.topBar}>
          <GoBackButton />
        </View>
      )}

      <KeyboardAvoidingView style={styles.container}>
        {children}
      </KeyboardAvoidingView>

      {showDecorations && (
        <>
          <View style={styles.glowBottom} />
          <View style={styles.glowTop} />
        </>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#181022",
  },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },

  glowBottom: {
    position: "absolute",
    bottom: -100,
    right: -50,
    width: 260,
    height: 260,
    backgroundColor: "rgba(153,86,245,0.15)",
    borderRadius: 200,
  },

  glowTop: {
    position: "absolute",
    top: 120,
    left: -50,
    width: 200,
    height: 200,
    backgroundColor: "rgba(153,86,245,0.08)",
    borderRadius: 200,
  },
});