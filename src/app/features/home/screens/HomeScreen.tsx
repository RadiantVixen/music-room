import React from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppLayout from "../../../components/layout/AppLayout";
import LiveRoomCard from "../components/LiveRoomCard";
import RecentRoomItem from "../components/RecentRoomItem";
import FeaturedRoomCard from "../components/FeaturedRoomCard";
import { liveRoom, liveRooms, recentRooms } from "../data/mockRooms";
import { useAppNavigation } from "../../../hooks/useAppNavigation";

export default function HomeScreen() {
  const navigation = useAppNavigation();

  return (
    <AppLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Welcome header */}
        {/* <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.name}>Alex</Text>
          </View>

          <View style={styles.notification}>
            <Ionicons name="notifications-outline" size={22} color="white" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>
        </View> */}

        {/* Quick actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate("CreateRoom")}>
            <Ionicons name="add" size={20} color="black" />
            <Text style={styles.createText}>Create Room</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.joinBtn} onPress={() => navigation.navigate("RoomsList")}>
            <Ionicons name="headset-outline" size={18} color="white" />
            <Text style={styles.joinText}>Join Room</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Room */}
        <Text style={styles.sectionTitle}>Featured Room</Text>
        <FeaturedRoomCard room={liveRooms[0]} />

        {/* Live now */}
        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionTitle}>Live Now</Text>
            <Text style={styles.subtitle}>
              {liveRooms.length} rooms streaming
            </Text>
          </View>

          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Rooms grid */}
       <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {liveRoom.map((room) => (
          <LiveRoomCard key={room.id} room={room} />
        ))}
      </ScrollView>

        {/* Recent rooms */}
        <Text style={styles.sectionTitle}>My Recent Rooms</Text>

        {recentRooms.map((room) => (
          <RecentRoomItem key={room.id} room={room} />
        ))}

      </ScrollView>
    </AppLayout>
  );
}
const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  welcomeText: {
    color: "#9CA3AF",
    fontSize: 14,
  },

  name: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },

  notification: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E1B2E",
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 5,
  },

  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
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

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 10,
    marginBottom: 20,
  },

  gridItem: {
    width: "48%",
  },

});