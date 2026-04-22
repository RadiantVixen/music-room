import { View, TouchableOpacity, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function QuickActions() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn}>
        <Ionicons name="add" size={20} color="black" />
        <Text style={styles.createText}>Create Room</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.joinBtn}>
        <Ionicons name="headset-outline" size={18} color="white" />
        <Text style={styles.joinText}>Join Room</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
  },

  createBtn: {
    flex: 1,
    backgroundColor: "#4ADE80",
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  createText: {
    fontWeight: "600",
    color: "black",
  },

  joinBtn: {
    flex: 1,
    backgroundColor: "#1F1B2E",
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  joinText: {
    color: "white",
    fontWeight: "600",
  },
})