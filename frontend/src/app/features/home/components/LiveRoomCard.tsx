import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function LiveRoomCard({ room }: any) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: room.image }} style={styles.image} />

      <View style={styles.liveBadge}>
        <View style={styles.dot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      <Text style={styles.title}>{room.title}</Text>

      <Text style={styles.listeners}>
        👥 {room.listeners} listeners
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    marginRight: 16,
    marginBottom: 20,
  },

  image: {
    width: "100%",
    height: 150,
    borderRadius: 16,
  },

  liveBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 6,
    height: 6,
    backgroundColor: "white",
    borderRadius: 10,
    marginRight: 6,
  },

  liveText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },

  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },

  listeners: {
    color: "#9956F5",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 10,
  },
});