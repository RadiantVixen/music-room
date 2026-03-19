import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

type TabType = "vote" | "next";

export default function RoomTabs({
  onChange,
}: {
  onChange?: (tab: TabType) => void;
}) {
  const [active, setActive] = useState<TabType>("vote");

  const handleChange = (tab: TabType) => {
    setActive(tab);
    onChange?.(tab);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <TabButton
          label="Vote"
          active={active === "vote"}
          onPress={() => handleChange("vote")}
        />
        <TabButton
          label="Next Up"
          active={active === "next"}
          onPress={() => handleChange("next")}
        />
      </View>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress}>
      <Text style={[styles.text, active && styles.activeText]}>
        {label}
      </Text>

      {active && <View style={styles.indicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
  },
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888",
  },
  activeText: {
    color: "#9956F5",
  },
  indicator: {
    marginTop: 8,
    height: 2,
    width: "100%",
    backgroundColor: "#9956F5",
  },
});