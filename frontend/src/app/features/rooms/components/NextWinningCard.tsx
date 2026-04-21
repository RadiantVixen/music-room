import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function NextWinningCard({ track }: { track: any }) {
  if (!track) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Next Winning Track</Text>

      <View style={styles.row}>
        <Image
          source={{
            uri: track.albumArt || "https://via.placeholder.com/100",
          }}
          style={styles.image}
        />

        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.title}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={styles.artist}>
            {track.artist}
          </Text>
        </View>

        <Text style={styles.votes}>{track.votes ?? 0} votes</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: "#1B1328",
    borderRadius: 18,
    padding: 14,
  },
  label: {
    color: "#999",
    fontSize: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  image: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#2A1F40",
  },
  title: {
    color: "#fff",
    fontWeight: "700",
  },
  artist: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  votes: {
    color: "#9956F5",
    fontWeight: "700",
    fontSize: 12,
  },
});