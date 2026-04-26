import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { usePremiumStore } from "../../../store/premiumStore";
import { useFriendsStore } from "../../../store/friendsStore";

type Props = {
  playlistId: number;
};

export default function CollaboratorsList({ playlistId }: Props) {
  const { selectedPlaylist, addCollaborator, removeCollaborator, playlistsLoading } = usePremiumStore();
  const { friends, fetchFriends } = useFriendsStore();

  const collaborators = selectedPlaylist?.collaborators ?? [];
  const collaboratorIds = new Set(collaborators.map((c) => c.user_id));

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleAdd = async (userId: number, username: string) => {
    try {
      await addCollaborator(playlistId, userId);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail || "Could not add collaborator.");
    }
  };

  const handleRemove = async (userId: number) => {
    Alert.alert("Remove Collaborator", "Remove this person from the playlist?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeCollaborator(playlistId, userId);
          } catch (e: any) {
            Alert.alert("Error", e?.response?.data?.detail || "Could not remove collaborator.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Current collaborators */}
      <Text style={styles.sectionTitle}>Collaborators ({collaborators.length})</Text>
      {collaborators.length === 0 ? (
        <Text style={styles.empty}>No collaborators yet.</Text>
      ) : (
        collaborators.map((c) => (
          <View key={c.user_id} style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{c.username[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.username}>@{c.username}</Text>
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(c.user_id)}>
              <Text style={styles.removeTxt}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Add from friends */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Add from Friends</Text>
      {friends.length === 0 ? (
        <Text style={styles.empty}>No friends to add.</Text>
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
                style={styles.addBtn}
                onPress={() => handleAdd(friend.id, friend.username)}
                disabled={playlistsLoading}
              >
                <Text style={styles.addTxt}>+ Add</Text>
              </TouchableOpacity>
            </View>
          ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionTitle: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 10 },
  empty: { color: "#666", fontSize: 13 },
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
