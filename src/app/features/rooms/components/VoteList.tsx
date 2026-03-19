import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mockTracks } from "../../home/data/mockRooms";

export default function VoteList({ queue, onVote }: any) {
  return (
    <View style={styles.container}>
      {queue.map((track: any) => (
        <View key={track.id} style={styles.card}>
          <Image source={{ uri: track.albumArt }} style={styles.image} />

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{track.title}</Text>
            <Text style={styles.artist}>{track.artist}</Text>
          </View>

          <View style={styles.voteBox}>
            <TouchableOpacity onPress={() => onVote(track.id, 1)}>
              <Ionicons
                name="arrow-up"
                size={20}
                color={track.userVote === 1 ? "#9956F5" : "#aaa"}
              />
            </TouchableOpacity>

            <Text style={styles.votes}>{track.votes}</Text>

            <TouchableOpacity onPress={() => onVote(track.id, -1)}>
              <Ionicons
                name="arrow-down"
                size={20}
                color={track.userVote === -1 ? "#FF4E4E" : "#aaa"}
              />
            </TouchableOpacity>
          </View>
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
  voteBox: {
    alignItems: "center",
  },
  votes: {
    color: "#fff",
    fontWeight: "700",
    marginVertical: 4,
  },
});