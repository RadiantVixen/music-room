import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api/client";

interface SmartPlaylist {
  id: number;
  name: string;
  description: string;
  playlist_type: string;
  songs: number[];
  song_count: number;
  cover_image?: string;
  last_regenerated: string;
}

export default function SmartPlaylistsScreen() {
  const [playlists, setPlaylists] = useState<SmartPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<number | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await api.get("/bonus/smart-playlists/");
      setPlaylists(response.data);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      Alert.alert("Error", "Failed to load smart playlists");
    } finally {
      setLoading(false);
    }
  };

  const regeneratePlaylist = async (playlistId: number) => {
    try {
      setRegenerating(playlistId);
      const response = await api.post(
        `/bonus/smart-playlists/${playlistId}/regenerate/`
      );
      
      // Update the playlist in state
      setPlaylists(
        playlists.map((p) =>
          p.id === playlistId ? response.data.playlist : p
        )
      );
      
      Alert.alert("Success", "Playlist regenerated with new songs!");
    } catch (error) {
      console.error("Error regenerating playlist:", error);
      Alert.alert("Error", "Failed to regenerate playlist");
    } finally {
      setRegenerating(null);
    }
  };

  const getPlaylistIcon = (type: string) => {
    switch (type) {
      case "daily_mix":
        return "sparkles";
      case "genre_mood":
        return "musical-notes";
      case "discovery":
        return "compass";
      case "friend_favorites":
        return "people";
      case "trending":
        return "trending-up";
      default:
        return "list";
    }
  };

  const getPlaylistColor = (type: string): string => {
    switch (type) {
      case "daily_mix":
        return "#FF6B9D";
      case "genre_mood":
        return "#9956F5";
      case "discovery":
        return "#00D4FF";
      case "friend_favorites":
        return "#FFB800";
      case "trending":
        return "#00FF88";
      default:
        return "#9956F5";
    }
  };

  const renderPlaylist = ({ item }: { item: SmartPlaylist }) => (
    <View style={styles.playlistCard}>
      <View
        style={[
          styles.coverImage,
          { backgroundColor: `${getPlaylistColor(item.playlist_type)}20` },
        ]}
      >
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.image} />
        ) : (
          <Ionicons
            name={getPlaylistIcon(item.playlist_type)}
            size={40}
            color={getPlaylistColor(item.playlist_type)}
          />
        )}
      </View>

      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName}>{item.name}</Text>
        <Text style={styles.playlistType}>
          {item.playlist_type.replace(/_/g, " ").toUpperCase()}
        </Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.songCount}>
          <Ionicons name="musical-notes" size={14} color="#9CA3AF" />
          {" "}{item.song_count} songs
        </Text>
      </View>

      <TouchableOpacity
        style={styles.regenerateButton}
        onPress={() => regeneratePlaylist(item.id)}
        disabled={regenerating === item.id}
      >
        {regenerating === item.id ? (
          <ActivityIndicator size="small" color="#9956F5" />
        ) : (
          <Ionicons name="refresh" size={20} color="#9956F5" />
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#9956F5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Playlists</Text>
        <Text style={styles.headerSubtitle}>
          AI-powered playlists tailored for you
        </Text>
      </View>

      {/* Playlists List */}
      {playlists.length > 0 ? (
        <FlatList
          data={playlists}
          renderItem={renderPlaylist}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          refreshing={loading}
          onRefresh={fetchPlaylists}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="list" size={48} color="#6B7280" />
          <Text style={styles.emptyText}>No smart playlists yet</Text>
          <Text style={styles.emptySubtext}>
            Create a profile to get personalized playlists
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1625",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2338",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  playlistCard: {
    flexDirection: "row",
    backgroundColor: "#231A2E",
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2338",
  },
  coverImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  playlistType: {
    fontSize: 11,
    color: "#9956F5",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 6,
  },
  songCount: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  regenerateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(153, 86, 245, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 4,
  },
});
