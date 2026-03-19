import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { mockTracks } from "../../home/data/mockRooms";

export default function NextUpList({ queue }: any) {
  const sorted = [...queue].sort((a, b) => b.votes - a.votes);

  return (
    <View style={styles.container}>
      {sorted.map((track: any, index: number) => (
        <View key={track.id} style={styles.card}>
          <Text style={styles.index}>{index + 1}</Text>

          <Image source={{ uri: track.albumArt }} style={styles.image} />

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{track.title}</Text>
            <Text style={styles.artist}>{track.artist}</Text>
          </View>

          <Text style={styles.votes}>{track.votes}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  index: {
    color: "#888",
    width: 20,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  title: {
    color: "#fff",
    fontWeight: "600",
  },
  artist: {
    color: "#aaa",
    fontSize: 12,
  },
  votes: {
    color: "#9956F5",
    fontWeight: "600",
  },
});