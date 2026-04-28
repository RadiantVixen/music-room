import React, { useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppLayout from "../../../components/layout/AppLayout";
import LiveRoomCard from "../components/LiveRoomCard";
import RecentRoomItem from "../components/RecentRoomItem";
import FeaturedRoomCard from "../components/FeaturedRoomCard";
import { useAppNavigation } from "../../../hooks/useAppNavigation";
import { useRoomsStore } from "../../../store/roomsStore";
import { useAuthStore } from "../../../store/authStore";

export default function HomeScreen() {
  const navigation = useAppNavigation();
  const { width: windowWidth } = useWindowDimensions();

  const {
    rooms,
    myRooms,
    nearbyRooms,
    isLoading,
    fetchRooms,
    fetchMyRooms,
    fetchInvitations,
    fetchNearbyDemoRooms,
  } = useRoomsStore();


  useEffect(() => {
    fetchRooms();
    fetchMyRooms();
    fetchInvitations();
    fetchNearbyDemoRooms();
  }, [fetchRooms, fetchMyRooms, fetchInvitations, fetchNearbyDemoRooms]);

  const user = useAuthStore((state) => state.user);
  const isPremiumUser = user?.profile?.is_premium;

  // Filter out vote rooms for non-premium users in public listings
  const filteredRooms = rooms.filter((room) => {
    if (room.room_type === "vote" && !isPremiumUser) return false;
    return true;
  });

  const filteredNearby = nearbyRooms.filter((room) => {
    if (room.room_type === "vote" && !isPremiumUser) return false;
    return true;
  });

  const liveRooms = filteredRooms.filter((room) => room.isLive);
  const featuredRoom = liveRooms[0] || filteredRooms[0];

  return (
    <AppLayout>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={windowWidth > 768}
      >
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate("CreateRoom")}
          >
            <Ionicons name="add" size={20} color="black" />
            <Text style={styles.createText}>Create Room</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => navigation.navigate("RoomsList")}
          >
            <Ionicons name="headset-outline" size={18} color="white" />
            <Text style={styles.joinText}>Join Room</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#9956F5" />
            <Text style={styles.loadingText}>Loading rooms...</Text>
          </View>
        ) : (
          <>
            {!!featuredRoom && (
              <>
                <Text style={styles.sectionTitle}>Featured Room</Text>
                <FeaturedRoomCard
                  room={featuredRoom}
                  onPress={() =>
                    navigation.navigate("Room", {
                      roomId: String(featuredRoom.id),
                    })
                  }
                />
              </>
            )}
            {nearbyRooms.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <View>
                  <Text style={styles.sectionTitle}>Nearby Events</Text>
                  <Text style={styles.subtitle}>
                    Public rooms detected near your demo location
                  </Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filteredNearby.map((room) => (
                  <LiveRoomCard
                    key={room.id}
                    room={room}
                    onPress={() =>
                      navigation.navigate("Room", {
                        roomId: String(room.id),
                      })
                    }
                  />
                ))}
              </ScrollView>
            </>
          )}

            <View style={styles.sectionRow}>
              <View>
                <Text style={styles.sectionTitle}>Live Now</Text>
                <Text style={styles.subtitle}>
                  {liveRooms.length} rooms streaming
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("RoomsList")}
              >
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {liveRooms.map((room) => (
                <LiveRoomCard
                  key={room.id}
                  room={room}
                  onPress={() =>
                    navigation.navigate("Room", {
                      roomId: String(room.id),
                    })
                  }
                />
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>My Rooms</Text>

            {myRooms.length === 0 ? (
              <Text style={styles.emptyText}>
                You have not created any rooms yet.
              </Text>
            ) : (
              myRooms.map((room) => (
                <RecentRoomItem
                  key={room.id}
                  room={room}
                  onPress={() =>
                    navigation.navigate("Room", {
                      roomId: String(room.id),
                    })
                  }
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
    marginTop: 20,
  },
  createBtn: {
    flex: 1,
    backgroundColor: "#9956F5",
    borderRadius: 20,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  createText: {
    fontWeight: "600",
    color: "black",
  },
  joinBtn: {
    flex: 1,
    backgroundColor: "#1E1B2E",
    borderRadius: 20,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  joinText: {
    color: "white",
    fontWeight: "600",
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 7,
  },
  seeAll: {
    color: "#4ADE80",
    fontWeight: "600",
  },
  loadingBox: {
    alignItems: "center",
    marginTop: 40,
  },
  loadingText: {
    color: "#9CA3AF",
    marginTop: 10,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 20,
  },
});
