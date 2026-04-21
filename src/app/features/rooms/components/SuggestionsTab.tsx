import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoomsStore } from "../../../store/roomsStore";

export default function SuggestionsTab({
  roomId,
}: {
  roomId: number | string;
}) {
  const {
    searchTracks,
    searchResults,
    searchLoading,
    suggestTrack,
    fetchRoomTracks,
    clearSearchResults,
  } = useRoomsStore();

  const [query, setQuery] = useState("");
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      clearSearchResults();
      return;
    }

    const timeout = setTimeout(() => {
      searchTracks(trimmed);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    return () => {
      clearSearchResults();
    };
  }, []);

  const handleAddTrack = async (track: any) => {
    try {
      setAddingTrackId(track.deezerId);

      await suggestTrack(roomId, {
        deezerId: track.deezerId,
        title: track.title,
        artist: track.artist,
        album: track.album || "",
        albumArt: track.albumArt || "",
        duration: track.duration || 0,
        audioUrl: track.audioUrl || "",
      });

      await fetchRoomTracks(roomId);

      Alert.alert("Added", "Track added to the queue");
    } catch (error: any) {
      console.log("Suggest track error:", error?.response?.data || error?.message || error);

      Alert.alert(
        "Error",
        error?.response?.data?.detail || "Failed to add track"
      );
    } finally {
      setAddingTrackId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isAdding = addingTrackId === item.deezerId;

    return (
      <View style={styles.card}>
        <Image
          source={{
            uri: item.albumArt || "https://via.placeholder.com/100",
          }}
          style={styles.image}
        />

        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>

          <Text numberOfLines={1} style={styles.artist}>
            {item.artist}
          </Text>

          {!!item.album && (
            <Text numberOfLines={1} style={styles.album}>
              {item.album}
            </Text>
          )}

          {!!item.duration && (
            <Text style={styles.duration}>
              {formatDuration(item.duration)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, isAdding && styles.addButtonDisabled]}
          onPress={() => handleAddTrack(item)}
          disabled={isAdding}
        >
          <Text style={styles.addButtonText}>
            {isAdding ? "Adding..." : "Add"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#888" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tracks or artists..."
          placeholderTextColor="#777"
          style={styles.input}
        />
      </View>
       <View style={styles.infoCard}>
        <Text style={styles.title}>Suggestions</Text>
        <Text style={styles.text}>
          Users will be able to search for a track and add it to the queue from
          here.
        </Text>
      </View>

      {query.trim().length < 2 ? (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={28} color="#777" />
          <Text style={styles.emptyTitle}>Search for tracks</Text>
          <Text style={styles.emptyText}>
            Type at least 2 characters to find songs and add them to the queue.
          </Text>
        </View>
      ) : searchLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Searching tracks...</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.deezerId}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={28} color="#777" />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyText}>
                Try another track name or artist.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  text: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1B1328",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
  },
  loadingBox: {
    marginTop: 24,
    alignItems: "center",
  },
  loadingText: {
    color: "#888",
    marginTop: 10,
    fontSize: 13,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1B1328",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  image: {
    width: 54,
    height: 54,
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
  album: {
    color: "#777",
    fontSize: 11,
    marginTop: 4,
  },
  duration: {
    color: "#9956F5",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#9956F5",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 68,
    alignItems: "center",
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  emptyState: {
    marginTop: 28,
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },
  emptyText: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  infoCard: {
  marginTop: 16,
  backgroundColor: "#1B1328",
  borderRadius: 16,
  padding: 16,
  },
});

