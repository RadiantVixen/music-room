import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GENRE_IMAGES, getRoomImageFromGenre } from "../../../utils/placeholders";
export default function FeaturedRoomCard({ room, onPress }: any) {

  const getAvatar = (id?: number) =>
  `https://i.pravatar.cc/150?u=${id || "default"}`;

  

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Background image */}
      <Image source={{ uri: room.coverImage || getRoomImageFromGenre(room.genres) }} style={styles.image} />

      {/* Gradient overlay */}
      <View style={styles.gradient} />

      {/* LIVE badge */}
      {room.isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Host */}
      <View style={styles.host}>
        <View style={styles.hostRow}>
          <Image source={{ uri: room.host.avatar || getAvatar(room.host.id) }} style={styles.hostAvatar} />

          <View>
            <Text style={styles.roomTitle}>{room.name}</Text>
            <Text style={styles.hostText}>Hosted by {room.host?.displayName || room.host?.username || "Unknown host"}</Text>
          </View>
        </View>
      </View>

      {/* Current track */}
      {room.currentTrack && (
        <View style={styles.trackCard}>
          <Image
            source={{ uri: room.currentTrack.albumArt }}
            style={styles.trackImage}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.trackTitle}>{room.currentTrack.title}</Text>

            <Text style={styles.trackArtist}>{room.currentTrack.artist}</Text>
          </View>

          <View style={styles.playButton}>
            <Ionicons name="play" size={20} color="black" />
          </View>
        </View>
      )}

      {/* Footer info */}
      <View style={styles.footer}>
        <View style={styles.listeners}>
          <Ionicons name="people-outline" size={16} color="#ccc" />
          <Text style={styles.listenerText}>{room.participantCount}</Text>
        </View>

        {room.genres && (
          <View style={styles.genreRow}>
            {room.genres.slice(0, 3).map((genre: string) => (
              <View key={genre} style={styles.genreBadge}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 20,
  },

  image: {
    ...StyleSheet.absoluteFillObject,
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  genreRow: {
    flexDirection: "row",
    gap: 6,
  },

  liveBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  liveDot: {
    width: 6,
    height: 6,
    backgroundColor: "white",
    borderRadius: 3,
    marginRight: 6,
  },

  liveText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  host: {
    position: "absolute",
    bottom: 40,
    left: 10,
    right: 16,
    borderRadius: 18,
    padding: 10,
  },

  hostRow: {
    position: "absolute",
    bottom: 90,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  hostAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },

  roomTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  hostText: {
    color: "#ccc",
    fontSize: 13,
  },

  trackCard: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 18,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  trackImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 10,
  },

  trackTitle: {
    color: "white",
    fontWeight: "600",
  },

  trackArtist: {
    color: "#ccc",
    fontSize: 12,
  },

  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4ADE80",
    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    position: "absolute",
    bottom: 10,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  listeners: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  listenerText: {
    color: "#ccc",
    fontSize: 12,
  },

  genreBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  genreText: {
    color: "white",
    fontSize: 11,
  },
});
