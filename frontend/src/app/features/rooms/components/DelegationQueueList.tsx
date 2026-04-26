import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoomsStore } from "../../../store/roomsStore";

export default function DelegationQueueList({
  roomId,
  queue,
  isLoading,
  canControl,
  onSelectTrack,
}: {
  roomId: number | string;
  queue: any[];
  isLoading?: boolean;
  canControl?: boolean;
  onSelectTrack: (track: any) => void;
}) {
  const { removeTrack } = useRoomsStore();

  const handleRemove = async (trackId: number | string) => {
    try {
      await removeTrack(roomId, trackId);
      Alert.alert("Success", "Track removed from queue");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.detail || "Failed to remove track"
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!queue?.length) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>Queue is empty</Text>
        <Text style={styles.emptyText}>
          Added tracks will appear here in playback order.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {queue.map((track, index) => (
        <TouchableOpacity
            key={track.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => onSelectTrack?.(track)}
            >
          <Text style={styles.rank}>{index + 1}</Text>

          <Image
            source={{
              uri: track.albumArt || "https://via.placeholder.com/100",
            }}
            style={styles.image}
          />

          <View style={styles.meta}>
            <Text numberOfLines={1} style={styles.title}>
              {track.title}
            </Text>

            <Text numberOfLines={1} style={styles.artist}>
              {track.artist}
            </Text>

            {!!track.addedBy?.name && (
              <Text numberOfLines={1} style={styles.addedBy}>
                Added by {track.addedBy.name}
              </Text>
            )}
          </View>

          {canControl ? (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemove(track.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
    backgroundColor: "#1B1328",
    borderRadius: 16,
    padding: 12,
  },
  rank: {
    color: "#777",
    width: 18,
    textAlign: "center",
    fontWeight: "700",
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#2A1F40",
  },
  meta: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  artist: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  addedBy: {
    color: "#777",
    fontSize: 11,
    marginTop: 4,
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2A1F40",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#1B1328",
    alignItems: "center",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  center: {
    marginTop: 24,
    alignItems: "center",
  },
});