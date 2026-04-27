import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { usePremiumStore } from "../../../store/premiumStore";
import { useAuthStore } from "../../../store/authStore";
import PlaylistCard from "../components/PlaylistCard";
import PremiumBadge from "../components/PremiumBadge";
import { usePlaybackStore, type Track as PlaybackTrack } from "../../../store/playbackStore";
import type { RootStackParamList } from "../../../navigation/RootNavigator";

const FREE_LIMIT = 3;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PlaylistListScreen() {
  const navigation = useNavigation<Nav>();
  const {
    playlists,
    isPremium,
    statusLoading,
    playlistsLoading,
    fetchPlaylists,
    fetchPremiumStatus,
    createPlaylist,
    deletePlaylist,
    initializeOffline,
    isOnline,
  } = usePremiumStore();
  const { user } = useAuthStore();
  const { setQueue } = usePlaybackStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    initializeOffline();
    fetchPremiumStatus();
    fetchPlaylists();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchPlaylists(), fetchPremiumStatus()]);
    setRefreshing(false);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const playlist = await createPlaylist({ name: newName.trim(), description: newDesc.trim() });
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      (navigation as any).navigate("PlaylistEditor", { playlistId: playlist.id });
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Failed to create playlist.";
      if (msg.includes("Premium")) {
        Alert.alert("Premium Required", msg, [
          { text: "Upgrade", onPress: () => (navigation as any).navigate("PremiumGate") },
          { text: "Cancel", style: "cancel" },
        ]);
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    const performDelete = async () => {
      console.log(`[List] Deleting playlist ${id} (${name})`);
      try {
        await deletePlaylist(id);
      } catch (e: any) {
        console.error("[List] Delete failed:", e?.response?.data || e.message);
        if (Platform.OS === "web") {
          window.alert("Could not delete playlist.");
        } else {
          Alert.alert("Error", "Could not delete playlist.");
        }
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
        performDelete();
      }
    } else {
      Alert.alert("Delete Playlist", `Delete "${name}"? This cannot be undone.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDelete,
        },
      ]);
    }
  };
  
  const handlePlay = (playlist: any) => {
    if (!playlist.tracks?.length) {
      Alert.alert("Empty Playlist", "Add some tracks before playing.");
      return;
    }
    
    const playbackTracks: PlaybackTrack[] = playlist.tracks.map((t: any) => ({
      id: t.id,
      deezerId: t.deezer_id,
      title: t.title,
      artist: t.artist,
      albumArt: t.album_art,
      audioUrl: t.audio_url,
      duration: t.duration,
    }));

    setQueue(playbackTracks, 0);
  };

  const canCreate = isPremium || playlists.length < FREE_LIMIT;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <View style={styles.header}>
          <Text style={styles.title}>Premium Playlists</Text>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>Offline Mode</Text>
            </View>
          )}
        </View>
          {isPremium && <PremiumBadge size="sm" />}
        </View>
        <TouchableOpacity
          style={[styles.newBtn, !canCreate && styles.newBtnDisabled]}
          onPress={() => {
            if (!canCreate) {
              Alert.alert("Limit Reached", `Free users can create up to ${FREE_LIMIT} playlists.`, [
                { text: "Upgrade to Premium", onPress: () => (navigation as any).navigate("PremiumGate") },
                { text: "Cancel", style: "cancel" },
              ]);
            } else {
              setShowCreate(true);
            }
          }}
        >
          <Text style={styles.newBtnTxt}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Free user quota indicator */}
      {!isPremium && (
        <TouchableOpacity style={styles.quotaBanner} onPress={() => (navigation as any).navigate("PremiumGate")}>
          <Text style={styles.quotaText}>
            {playlists.length}/{FREE_LIMIT} playlists used · <Text style={styles.quotaUpgrade}>Upgrade for unlimited 👑</Text>
          </Text>
        </TouchableOpacity>
      )}

      {/* List */}
      {playlistsLoading && playlists.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color="#9956F5" size="large" />
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9956F5" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎵</Text>
              <Text style={styles.emptyTitle}>No playlists yet</Text>
              <Text style={styles.emptySub}>Tap "+ New" to create your first playlist.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PlaylistCard
              playlist={item}
              isOwner={item.owner_id === user?.id}
              onPress={() => (navigation as any).navigate("PlaylistEditor", { playlistId: item.id })}
              onDelete={() => handleDelete(item.id, item.name)}
              onPlay={() => handlePlay(item)}
            />
          )}
        />
      )}

      {/* Create modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Playlist</Text>
            <TextInput
              style={styles.input}
              placeholder="Playlist name *"
              placeholderTextColor="#555"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              placeholderTextColor="#555"
              value={newDesc}
              onChangeText={setNewDesc}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, (!newName.trim() || creating) && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={!newName.trim() || creating}
              >
                {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createTxt}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0E0A1A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 12,
  },
  offlineBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  offlineText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  back: { color: "#9956F5", fontSize: 15, fontWeight: "600" },
  headerTitle: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  newBtn: {
    backgroundColor: "#9956F5",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newBtnDisabled: { backgroundColor: "#3A2A50" },
  newBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },

  quotaBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#1B1328",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FFD70033",
  },
  quotaText: { color: "#aaa", fontSize: 12, textAlign: "center" },
  quotaUpgrade: { color: "#FFD700", fontWeight: "700" },

  list: { paddingHorizontal: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptySub: { color: "#666", fontSize: 13, textAlign: "center", paddingHorizontal: 32 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#1B1328",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 4 },
  input: {
    backgroundColor: "#0E0A1A",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2A1F40",
  },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#2A1F40",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  cancelTxt: { color: "#aaa", fontWeight: "600" },
  createBtn: {
    flex: 1,
    backgroundColor: "#9956F5",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  createBtnDisabled: { opacity: 0.5 },
  createTxt: { color: "#fff", fontWeight: "700" },
});
