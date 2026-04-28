import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getRoomImageFromGenre } from "../../../utils/placeholders";

export default function RecentRoomItem({ room, onPress }: any) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: room.coverImage || getRoomImageFromGenre(room.genres) }}
        style={styles.image}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {room.name}
        </Text>
        <Text style={styles.time}>
          {room.room_type === "delegation" ? "Delegation Room" : "Vote Room"}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#9956F5" />
    </TouchableOpacity>
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
    marginTop: 2,
  },
});