import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { usePremiumStore } from "../../../store/premiumStore";
import { useRoomsStore } from "../../../store/roomsStore";
import CollaboratorsList from "../components/CollaboratorsList";
import PremiumBadge from "../components/PremiumBadge";
import type { RootStackParamList } from "../../../navigation/RootNavigator";

type RouteProps = RouteProp<RootStackParamList, "PlaylistEditor">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tab = "tracks" | "search" | "collaborators" | "settings";

export default function PlaylistEditorScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { playlistId } = route.params;

  const {
    selectedPlaylist,
    isPremium,
    playlistsLoading,
    fetchPlaylistDetail,
    addTrack,
    removeTrack,
    updatePlaylist,
  } = usePremiumStore();

  const { searchResults, searchLoading, searchTracks, clearSearchResults } = useRoomsStore();

  const [activeTab, setActiveTab] = useState<Tab>("tracks");
  const [searchQ, setSearchQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // settings edit state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCollab, setEditCollab] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlaylistDetail(playlistId);
  }, [playlistId]);

  // Sync settings fields when playlist loads
  useEffect(() => {
    if (selectedPlaylist) {
      setEditName(selectedPlaylist.name);
      setEditDesc(selectedPlaylist.description);
      setEditCollab(selectedPlaylist.is_collaborative);
    }
  }, [selectedPlaylist?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlaylistDetail(playlistId);
    setRefreshing(false);
  }, [playlistId]);

  const handleSearch = (q: string) => {
    setSearchQ(q);
    if (q.trim().length > 1) {
      searchTracks(q);
    } else {
      clearSearchResults();
    }
  };

  const handleAddTrack = async (track: any) => {
    try {
      await addTrack(playlistId, {
        deezer_id: String(track.deezerId || track.id),
        title: track.title,
        artist: track.artist,
        album: track.album,
        album_art: track.albumArt,
        duration: track.duration,
        audio_url: track.audioUrl,
      });
      Alert.alert("Added!", `"${track.title}" added to playlist.`);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail || "Could not add track.");
    }
  };

  const handleRemoveTrack = (trackId: number, title: string) => {
    Alert.alert("Remove Track", `Remove "${title}" from this playlist?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeTrack(playlistId, trackId);
          } catch {
            Alert.alert("Error", "Could not remove track.");
          }
        },
      },
    ]);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updatePlaylist(playlistId, {
        name: editName.trim(),
        description: editDesc.trim(),
        is_collaborative: editCollab,
      });
      Alert.alert("Saved!", "Playlist settings updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "tracks", label: "Tracks" },
    { id: "search", label: "Add" },
    ...(isPremium ? [{ id: "collaborators" as Tab, label: "Collab" }] : []),
    { id: "settings", label: "Settings" },
  ];

  if (!selectedPlaylist) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#9956F5" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.title} numberOfLines={1}>{selectedPlaylist.name}</Text>
          {isPremium && <PremiumBadge size="sm" />}
        </View>
        <Text style={styles.trackCount}>{selectedPlaylist.track_count} tracks</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabTxt, activeTab === tab.id && styles.tabTxtActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={
          activeTab === "tracks"
            ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9956F5" />
            : undefined
        }
      >
        {/* ── Tracks tab ── */}
        {activeTab === "tracks" && (
          <View style={styles.section}>
            {(selectedPlaylist.tracks ?? []).length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🎵</Text>
                <Text style={styles.emptyTitle}>No tracks yet</Text>
                <TouchableOpacity onPress={() => setActiveTab("search")}>
                  <Text style={styles.emptyAction}>Tap "Add" to search for tracks →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              (selectedPlaylist.tracks ?? []).map((track, i) => (
                <View key={track.id} style={styles.trackRow}>
                  <View style={styles.trackPos}>
                    <Text style={styles.trackPosNum}>{i + 1}</Text>
                  </View>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  {track.duration && (
                    <Text style={styles.trackDur}>
                      {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.removeTrackBtn}
                    onPress={() => handleRemoveTrack(track.id, track.title)}
                  >
                    <Text style={styles.removeTrackTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Search / Add tab ── */}
        {activeTab === "search" && (
          <View style={styles.section}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search tracks on Deezer..."
              placeholderTextColor="#555"
              value={searchQ}
              onChangeText={handleSearch}
              autoFocus
            />
            {searchLoading && <ActivityIndicator color="#9956F5" style={{ marginTop: 16 }} />}
            {searchResults.map((track: any) => {
              const alreadyAdded = (selectedPlaylist.tracks ?? []).some(
                (t) => String(t.deezer_id) === String(track.deezerId || track.id)
              );
              return (
                <View key={track.deezerId || track.id} style={styles.searchRow}>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addTrackBtn, alreadyAdded && styles.addTrackBtnDisabled]}
                    disabled={alreadyAdded}
                    onPress={() => handleAddTrack(track)}
                  >
                    <Text style={styles.addTrackTxt}>{alreadyAdded ? "✓" : "+ Add"}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Collaborators tab (premium only) ── */}
        {activeTab === "collaborators" && isPremium && (
          <CollaboratorsList playlistId={playlistId} />
        )}

        {/* ── Settings tab ── */}
        {activeTab === "settings" && (
          <View style={styles.section}>
            <Text style={styles.label}>Playlist Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Name"
              placeholderTextColor="#555"
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Description (optional)"
              placeholderTextColor="#555"
              multiline
            />

            {isPremium && (
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Real-time Collaboration</Text>
                  <Text style={styles.switchSub}>Let collaborators edit this playlist.</Text>
                </View>
                <Switch
                  value={editCollab}
                  onValueChange={setEditCollab}
                  trackColor={{ false: "#2A1F40", true: "#9956F5" }}
                  thumbColor={editCollab ? "#fff" : "#666"}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSaveSettings}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0E0A1A" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0E0A1A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 10,
  },
  back: { color: "#9956F5", fontSize: 15, fontWeight: "600" },
  headerMid: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#fff", fontSize: 18, fontWeight: "800", flexShrink: 1 },
  trackCount: { color: "#666", fontSize: 12 },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    marginBottom: 8,
  },
  tab: { paddingVertical: 12, paddingHorizontal: 14, marginRight: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#9956F5" },
  tabTxt: { color: "#666", fontSize: 14, fontWeight: "600" },
  tabTxtActive: { color: "#9956F5" },

  body: { flex: 1 },
  section: { padding: 16 },

  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  emptyAction: { color: "#9956F5", fontSize: 13 },

  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 10,
  },
  trackPos: { width: 28, alignItems: "center" },
  trackPosNum: { color: "#555", fontSize: 13 },
  trackInfo: { flex: 1 },
  trackTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  trackArtist: { color: "#888", fontSize: 12, marginTop: 2 },
  trackDur: { color: "#666", fontSize: 12 },
  removeTrackBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2A1F40",
    alignItems: "center",
    justifyContent: "center",
  },
  removeTrackTxt: { color: "#FF6B6B", fontSize: 11, fontWeight: "700" },

  searchInput: {
    backgroundColor: "#1B1328",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A1F40",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 10,
  },
  addTrackBtn: {
    backgroundColor: "#9956F5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addTrackBtnDisabled: { backgroundColor: "#2A1F40" },
  addTrackTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },

  label: { color: "#aaa", fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#1B1328",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2A1F40",
  },
  inputMulti: { height: 90, textAlignVertical: "top" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B1328",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    gap: 10,
  },
  switchLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },
  switchSub: { color: "#888", fontSize: 12, marginTop: 2 },
  saveBtn: {
    backgroundColor: "#9956F5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
