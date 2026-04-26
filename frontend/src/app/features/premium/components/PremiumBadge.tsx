import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, { font: number; pad: [number, number]; radius: number }> = {
  sm: { font: 9, pad: [2, 6], radius: 6 },
  md: { font: 11, pad: [3, 8], radius: 8 },
  lg: { font: 13, pad: [4, 10], radius: 10 },
};

export default function PremiumBadge({ size = "md" }: { size?: Size }) {
  const { font, pad, radius } = sizes[size];
  return (
    <View style={[styles.badge, { paddingVertical: pad[0], paddingHorizontal: pad[1], borderRadius: radius }]}>
      <Text style={[styles.text, { fontSize: font }]}>👑 PREMIUM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#FFD700",
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "800",
    color: "#1A1028",
    letterSpacing: 0.5,
  },
});
