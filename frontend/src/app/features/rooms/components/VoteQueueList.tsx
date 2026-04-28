import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoomsStore } from "../../../store/roomsStore";

export default function VoteQueueList({
  roomId,
  queue,
  isLoading,
  isPremiumUser,
}: {
  roomId: number | string;
  queue: any[];
  isLoading?: boolean;
  isPremiumUser: boolean;
}) {
  const { voteTrack } = useRoomsStore();

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
        <Text style={styles.emptyTitle}>No tracks yet</Text>
        <Text style={styles.emptyText}>
          Suggested tracks will appear here and users can vote on them.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isPremiumUser && (
        <View style={styles.premiumNotice}>
          <Text style={styles.premiumNoticeText}>
            Voting is a premium feature. Upgrade to vote.
          </Text>
        </View>
      )}
      {queue.map((track, index) => (
        <View key={track.id} style={styles.card}>
          <Text style={styles.rank}>{index + 1}</Text>

          <Image
            source={{
              uri:
                track.albumArt ||
                "https://via.placeholder.com/100",
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

          <View style={styles.voteBox}>
            <TouchableOpacity
              style={[
                styles.voteButton,
                track.has_voted && styles.voteButtonActive,
                !isPremiumUser && styles.voteButtonDisabled,
              ]}
              onPress={() => voteTrack(roomId, track.id)}
              disabled={track.has_voted || !isPremiumUser}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={track.has_voted ? "#9956F5" : "#fff"}
              />
            </TouchableOpacity>

            <Text style={styles.votes}>{track.votes ?? 0}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  premiumNotice: {
    backgroundColor: "#2A1F40",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  premiumNoticeText: {
    color: "#C9B8FF",
    fontSize: 12,
    fontWeight: "600",
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
  voteBox: {
    alignItems: "center",
    gap: 6,
  },
  voteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2A1F40",
    alignItems: "center",
    justifyContent: "center",
  },
  voteButtonActive: {
    backgroundColor: "rgba(153,86,245,0.15)",
  },
  voteButtonDisabled: {
    opacity: 0.4,
  },
  votes: {
    color: "#fff",
    fontWeight: "700",
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