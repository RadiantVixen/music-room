import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { useAppRoute } from "../../hooks/useAppRoute";

export default function BottomNavbar() {
  return (
    <View style={styles.container}>
      <NavItem icon="home" label="Home" route="Home" />
      <NavItem icon="search" label="Search" route="Search" />
      <NavItem icon="radio" label="Rooms" route="RoomsList" />
      <NavItem icon="person" label="Profile" route="Profile" />
    </View>
  );
}
function NavItem({ icon, label, route }: any) {
  const navigation = useAppNavigation();
  const currentRoute = useAppRoute();

  const active = currentRoute.name === route;

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate(route)}
    >
      <Ionicons
        name={(active ? icon : `${icon}-outline`) as any}
        size={22}
        color={active ? "#9956F5" : "#6B7280"}
      />

      <Text
        style={[
          styles.label,
          { color: active ? "#9956F5" : "#6B7280" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: "#0F0A18",
    borderTopWidth: 1,
    borderTopColor: "#2A2338",
  },

  item: {
    alignItems: "center",
  },

  label: {
    fontSize: 11,
    marginTop: 4,
  },
});