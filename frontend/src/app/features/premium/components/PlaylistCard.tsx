import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import type { Playlist } from "../../../api/premium";

type Props = {
  playlist: Playlist;
  onPress: () => void;
  onDelete?: () => void;
  onPlay?: () => void;
  isOwner?: boolean;
};

export default function PlaylistCard({ playlist, onPress, onDelete, onPlay, isOwner }: Props) {
  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardMain} 
        onPress={onPress} 
        activeOpacity={0.7}
      >
        {/* Cover art */}
        <View style={styles.cover}>
          {playlist.cover_url ? (
            <Image source={{ uri: playlist.cover_url }} style={styles.coverImg} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverEmoji}>🎵</Text>
            </View>
          )}
          {playlist.is_collaborative && (
            <View style={styles.collabBadge}>
              <Text style={styles.collabText}>👥</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{playlist.name}</Text>
          {!!playlist.description && (
            <Text style={styles.desc} numberOfLines={1}>{playlist.description}</Text>
          )}
          <Text style={styles.meta}>
            {playlist.track_count} track{playlist.track_count !== 1 ? "s" : ""}
            {playlist.is_collaborative ? " · Collaborative" : ""}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Play button */}
      {onPlay && (
        <TouchableOpacity style={styles.playBtn} onPress={onPlay}>
          <Text style={styles.playTxt}>▶</Text>
        </TouchableOpacity>
      )}

      {/* Delete button (owner only) */}
      {isOwner && onDelete && (
        <TouchableOpacity 
          style={styles.deleteBtn} 
          onPress={() => {
            console.log(`[PlaylistCard] Delete clicked for ${playlist.id}`);
            onDelete();
          }} 
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.deleteTxt}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B1328",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  coverImg: { width: 56, height: 56 },
  coverPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: "#2A1F40",
    alignItems: "center",
    justifyContent: "center",
  },
  coverEmoji: { fontSize: 24 },
  collabBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#9956F5",
    borderRadius: 6,
    padding: 2,
  },
  collabText: { fontSize: 10 },
  info: { flex: 1 },
  name: { color: "#fff", fontSize: 15, fontWeight: "700" },
  desc: { color: "#aaa", fontSize: 12, marginTop: 2 },
  meta: { color: "#9956F5", fontSize: 11, marginTop: 4, fontWeight: "600" },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2A1F40",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteTxt: { color: "#FF6B6B", fontSize: 12, fontWeight: "700" },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#9956F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  playTxt: { color: "#fff", fontSize: 18, marginLeft: 2 },
});
