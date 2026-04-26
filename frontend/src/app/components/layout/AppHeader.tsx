import React from "react";
import { SafeAreaView, View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoomsStore } from "../../store/roomsStore";
import { useAppNavigation } from "../../hooks/useAppNavigation";

export default function AppHeader() {
  const { rooms } = useRoomsStore();
  const navigation = useAppNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.left}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            style={styles.avatar}
          />

          <Text style={styles.title}>Music Room</Text>
        </View>

        <TouchableOpacity style={styles.bell} onPress={() => navigation.navigate("RoomInvitations")}
          >
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#181022",
  },

  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#9956F5",
  },

  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2A2338",
    alignItems: "center",
    justifyContent: "center",
  },
});