import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import AppLayout from "../../../components/layout/AppLayout";
import MusicHeader from "../../search/components/ScreenHeader";
import { useRoomsStore } from "../../../store/roomsStore";

export default function RoomInvitationsScreen() {
  const {
    invitations,
    fetchInvitations,
    respondToInvitation,
    isLoading,
  } = useRoomsStore();

  const [submittingId, setSubmittingId] = useState<string | number | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleAction = async (
    roomId: number | string,
    action: "accept" | "decline"
  ) => {
    try {
      setSubmittingId(roomId);
      await respondToInvitation(roomId, action);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.detail || "Failed to update invitation"
      );
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <AppLayout
      header={<MusicHeader title="Invitations" subtitle="PRIVATE ROOMS" />}
      showNavbar={false}
    >
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#9956F5" />
          </View>
        ) : (
          <FlatList
            data={invitations}
            keyExtractor={(item: any) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>No pending invitations</Text>
                <Text style={styles.emptyText}>
                  When someone invites you to a private room, it will appear here.
                </Text>
              </View>
            }
            renderItem={({ item }: any) => {
              const roomId = item.room?.id || item.room_id;
              const roomName = item.room?.name || `Room #${roomId}`;
              const hostName =
                item.invited_by_username || item.room?.host?.displayName || "Unknown";

              const loading = String(submittingId) === String(roomId);

              return (
                <View style={styles.card}>
                  <Text style={styles.roomName}>{roomName}</Text>
                  <Text style={styles.hostText}>Invited by {hostName}</Text>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => handleAction(roomId, "decline")}
                      disabled={loading}
                    >
                      <Text style={styles.declineText}>
                        {loading ? "Please wait..." : "Decline"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAction(roomId, "accept")}
                      disabled={loading}
                    >
                      <Text style={styles.acceptText}>
                        {loading ? "Please wait..." : "Accept"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
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
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#171021",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#241A36",
    marginBottom: 14,
  },
  roomName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  hostText: {
    color: "#8D86A5",
    fontSize: 13,
    marginTop: 6,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#9956F5",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  declineBtn: {
    flex: 1,
    backgroundColor: "#221827",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3A2B45",
  },
  acceptText: {
    color: "#fff",
    fontWeight: "700",
  },
  declineText: {
    color: "#C8BED6",
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: "#8D86A5",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});