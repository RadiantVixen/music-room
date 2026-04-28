import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useFriendsStore } from "../../../store/friendsStore";
import { useRoomsStore } from "../../../store/roomsStore";
import { useEffect, useMemo, useState } from "react";

export default function ControllersTab({
  roomId,
  isOwner,
  currentUserId,
  devices,
  isLoading,
}: {
  roomId: number | string;
  isOwner: boolean;
  currentUserId?: number | string;
  devices: any[];
  isLoading?: boolean;
}) {
  const { friends, fetchFriends } = useFriendsStore();
  const { delegateDeviceControl, revokeDeviceControl, fetchDelegationDevices } = useRoomsStore();

  const [submittingId, setSubmittingId] = useState<number | null>(null);

  useEffect(() => {
    if (isOwner) {
      fetchFriends();
    }
  }, [isOwner]);

  const controlEntry = useMemo(() => {
    return devices?.[0] || null;
  }, [devices]);

  const handleDelegate = async (friendId: number) => {
    console.log("Delegating control to friend ID:", friendId);
    console.log("Current control entry:", controlEntry);
    if (!controlEntry) return;

    try {
      setSubmittingId(friendId);
      await delegateDeviceControl(roomId, controlEntry.id, friendId);
      await fetchDelegationDevices(roomId);
      Alert.alert("Success", "Controller added");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.detail || "Failed to add controller"
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRevoke = async () => {
    if (!controlEntry) return;

    try {
      setSubmittingId(controlEntry.id);
      await revokeDeviceControl(roomId, controlEntry.id);
      await fetchDelegationDevices(roomId);
      Alert.alert("Success", "Controller removed");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.detail || "Failed to remove controller"
      );
    } finally {
      setSubmittingId(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Current Controllers</Text>

        <Text style={styles.text}>
          Owner: {controlEntry?.owner_username || "Room owner"}
        </Text>

        <Text style={styles.text}>
          Added controller: {controlEntry?.delegated_to_username || "None"}
        </Text>

        {!!controlEntry?.delegated_to_username && isOwner && (
          <TouchableOpacity style={styles.removeBtn} onPress={handleRevoke}>
            <Text style={styles.removeBtnText}>Remove Controller</Text>
          </TouchableOpacity>
        )}
      </View>

      {isOwner && (
        <View style={styles.card}>
          <Text style={styles.title}>Add Controller</Text>

          {friends.length === 0 ? (
            <Text style={styles.text}>No friends available</Text>
          ) : (
            friends.map((friend: any) => {
              const alreadyController =
                String(friend.id) === String(controlEntry?.delegated_to_id);

              return (
                <View key={friend.id} style={styles.friendRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>
                      {friend.first_name || friend.username}
                    </Text>
                    <Text style={styles.friendUsername}>@{friend.username}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.addBtn, alreadyController && styles.disabledBtn]}
                    disabled={alreadyController || submittingId === friend.id}
                    onPress={() => handleDelegate(friend.id)}
                  >
                    <Text style={styles.addBtnText}>
                      {alreadyController
                        ? "Controller"
                        : submittingId === friend.id
                        ? "Adding..."
                        : "+ Add"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#1B1328",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  text: {
    color: "#aaa",
    fontSize: 13,
    marginTop: 6,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  friendName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  friendUsername: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: "#9956F5",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  removeBtn: {
    marginTop: 14,
    backgroundColor: "#2A1F40",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  removeBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  center: {
    marginTop: 24,
    alignItems: "center",
  },
});