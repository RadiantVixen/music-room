import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native";
import { usePremiumStore } from "../../../store/premiumStore";
import { useFriendsStore } from "../../../store/friendsStore";
import { useAuthStore } from "../../../store/authStore";

type Props = {
  playlistId: number;
};

export default function CollaboratorsList({ playlistId }: Props) {
  const { selectedPlaylist, addCollaborator, removeCollaborator, playlistsLoading } = usePremiumStore();
  const { friends, fetchFriends } = useFriendsStore();
  const { user } = useAuthStore();

  const collaborators = selectedPlaylist?.collaborators ?? [];
  // Filter out the current user so they don't see themselves in the list
  const displayCollaborators = collaborators.filter(c => c.user_id !== user?.id);
  const collaboratorIds = new Set(collaborators.map((c) => c.user_id));

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleAdd = async (userId: number, username: string) => {
    console.log(`[Collaborators] Attempting to add user ${userId} (${username}) to playlist ${playlistId}`);
    try {
      await addCollaborator(playlistId, userId);
      console.log(`[Collaborators] Successfully added ${username}`);
    } catch (e: any) {
      console.error("[Collaborators] Add failed:", e?.response?.data || e.message);
      Alert.alert("Error", e?.response?.data?.detail || "Could not add collaborator.");
    }
  };

  const handleRemove = async (userId: number) => {
    const performRemove = async () => {
      console.log(`[Collaborators] Calling store.removeCollaborator(${playlistId}, ${userId})`);
      try {
        await removeCollaborator(playlistId, userId);
        if (Platform.OS === "web") {
          window.alert("Collaborator removed.");
        } else {
          Alert.alert("Success", "Collaborator removed.");
        }
      } catch (e: any) {
        console.error("[Collaborators] Remove failed:", e?.response?.data || e.message);
        const msg = e?.response?.data?.detail || "Could not remove collaborator.";
        if (Platform.OS === "web") {
          window.alert("Error: " + msg);
        } else {
          Alert.alert("Error", msg);
        }
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Remove this person from the playlist?")) {
        performRemove();
      }
    } else {
      Alert.alert("Remove Collaborator", "Remove this person from the playlist?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: performRemove,
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Current collaborators */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Collaborators ({collaborators.length})</Text>
        {playlistsLoading && <ActivityIndicator size="small" color="#9956F5" />}
      </View>

      {displayCollaborators.length === 0 ? (
        <Text style={styles.empty}>No collaborators yet.</Text>
      ) : (
        displayCollaborators.map((c) => (
          <View key={c.user_id} style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(c.username || "?")[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.username}>@{c.username || "unknown"}</Text>
            <TouchableOpacity 
              style={styles.removeBtn} 
              onPress={() => handleRemove(c.id)}
              disabled={playlistsLoading}
            >
              <Text style={styles.removeTxt}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Add from friends */}
      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Add from Friends</Text>
        <TouchableOpacity onPress={() => fetchFriends()}>
          <Text style={styles.refreshTxt}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {friends.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>No friends found.</Text>
          <Text style={styles.emptySub}>Make sure you have accepted friend requests.</Text>
        </View>
      ) : (
        friends
          .filter((f: any) => !collaboratorIds.has(f.id))
          .map((friend: any) => (
            <View key={friend.id} style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(friend.username || "?")[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.username}>@{friend.username}</Text>
              <TouchableOpacity
                style={[styles.addBtn, playlistsLoading && { opacity: 0.5 }]}
                onPress={() => handleAdd(friend.id, friend.username)}
                disabled={playlistsLoading}
              >
                {playlistsLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.addTxt}>+ Add</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  refreshTxt: { color: "#9956F5", fontSize: 12, fontWeight: "600" },
  empty: { color: "#666", fontSize: 13 },
  emptyBox: { paddingTop: 10 },
  emptySub: { color: "#444", fontSize: 11, marginTop: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#9956F5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  username: { flex: 1, color: "#ccc", fontSize: 13 },
  removeBtn: {
    backgroundColor: "#2A1F40",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeTxt: { color: "#FF6B6B", fontSize: 12, fontWeight: "600" },
  addBtn: {
    backgroundColor: "#9956F5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
