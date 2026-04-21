import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { currentUser } from "../data/mockRooms"

export default function HomeHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />

        <View>
          <Text style={styles.subtitle}>Welcome back,</Text>
          <Text style={styles.name}>
            {currentUser.name.split(" ")[0]}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.notification}>
        <Ionicons name="notifications-outline" size={22} color="white" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },

  subtitle: {
    color: "#9CA3AF",
    fontSize: 13,
  },

  name: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  notification: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1F1B2E",
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
})