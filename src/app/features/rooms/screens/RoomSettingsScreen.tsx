import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import AppLayout from "../../../components/layout/AppLayout";
import MusicHeader from "../../search/components/ScreenHeader";
import { useAppRoute } from "../../../hooks/useAppRoute";
import { useAppNavigation } from "../../../hooks/useAppNavigation";
import { useRoomsStore } from "../../../store/roomsStore";
import { useFriendsStore } from "../../../store/friendsStore"; // if you already have one

export default function RoomSettingsScreen() {
  const route = useAppRoute<"RoomSettings">();
  const navigation = useAppNavigation();
  const { roomId } = route.params;

  const {
    selectedRoom,
    fetchRoomDetails,
    inviteToRoom,
    leaveRoom,
    isLoading,
  } = useRoomsStore();

  const {
    friends,
    fetchFriends,
    isLoading: friendsLoading,
  } = useFriendsStore();

  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    fetchRoomDetails(roomId);
    fetchFriends();
  }, [roomId, fetchRoomDetails, fetchFriends]);

  const room = selectedRoom;
  const isPrivate = room?.visibility === "private";

  const handleInvite = async (userId: number) => {
    try {
      setSubmittingUserId(userId);
      await inviteToRoom(roomId, userId);
      Alert.alert("Success", "Invitation sent");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.detail || "Failed to invite user"
      );
    } finally {
      setSubmittingUserId(null);
    }
  };

  const handleLeaveRoom = async () => {
    Alert.alert(
      "Leave room",
      "Are you sure you want to leave this room?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              setLeaving(true);
              await leaveRoom(roomId);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.detail || "Failed to leave room"
              );
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <AppLayout
      header={<MusicHeader title="Room Settings" subtitle={room?.name || "ROOM"} />}
      showNavbar={false}
    >
      <View style={styles.container}>
        {isLoading || !room ? (
          <View style={styles.center}>
            <ActivityIndicator color="#9956F5" />
          </View>
        ) : (
          <>
            {isPrivate && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Invite friends</Text>
                <Text style={styles.sectionText}>
                  Private rooms can only be joined by invited users.
                </Text>

                {friendsLoading ? (
                  <View style={styles.centerSmall}>
                    <ActivityIndicator color="#9956F5" />
                  </View>
                ) : (
                  <FlatList
                    data={friends}
                    keyExtractor={(item) => String(item.id)}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    renderItem={({ item }) => (
                      <View style={styles.friendRow}>
                        <View style={styles.friendInfo}>
                          <Text style={styles.friendName}>
                            {item.first_name || item.username}
                          </Text>
                          <Text style={styles.friendUsername}>
                            @{item.username}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.inviteBtn}
                          disabled={submittingUserId === item.id}
                          onPress={() => handleInvite(item.id)}
                        >
                          <Text style={styles.inviteText}>
                            {submittingUserId === item.id ? "Sending..." : "Invite"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>No friends available</Text>
                    }
                  />
                )}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Room actions</Text>

              <TouchableOpacity
                style={styles.leaveBtn}
                onPress={handleLeaveRoom}
                disabled={leaving}
              >
                <Text style={styles.leaveText}>
                  {leaving ? "Leaving..." : "Leave Room"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0B16",
    padding: 16,
  },
  card: {
    backgroundColor: "#171021",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#241A36",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  sectionText: {
    color: "#8D86A5",
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 20,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  friendInfo: {
    flex: 1,
    marginRight: 12,
  },
  friendName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  friendUsername: {
    color: "#8D86A5",
    fontSize: 12,
    marginTop: 2,
  },
  inviteBtn: {
    backgroundColor: "#9956F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inviteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  leaveBtn: {
    marginTop: 8,
    backgroundColor: "#2A1320",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#5A2239",
  },
  leaveText: {
    color: "#FF9DB7",
    fontWeight: "700",
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: "#241A36",
  },
  emptyText: {
    color: "#8D86A5",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 14,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSmall: {
    paddingVertical: 20,
    alignItems: "center",
  },
});