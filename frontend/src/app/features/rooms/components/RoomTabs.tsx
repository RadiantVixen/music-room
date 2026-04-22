import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

type TabItem = {
  key: string;
  label: string;
};

export default function RoomTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.text, active === tab.key && styles.activeText]}>
              {tab.label}
            </Text>
            {active === tab.key && <View style={styles.indicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 24,
  },
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
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
    borderRadius: 99,
  },
});