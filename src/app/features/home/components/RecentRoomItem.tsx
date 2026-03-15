import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RecentRoomItem({ room }: any) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: room.image }} style={styles.image} />

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{room.title}</Text>
        <Text style={styles.time}>{room.time}</Text>
      </View>

      <Ionicons name="ellipsis-vertical" size={18} color="#9956F5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#1E1B2E",
    marginBottom: 10,
  },

  image: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
  },

  title: {
    color: "white",
    fontWeight: "700",
  },

  time: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});