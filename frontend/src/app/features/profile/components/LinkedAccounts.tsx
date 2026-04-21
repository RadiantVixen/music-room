import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function LinkedAccounts() {
  return (
    <View style={styles.container}>
      <Text style={styles.section}>LINKED ACCOUNTS</Text>

      {/* Spotify */}
      <View style={styles.card}>
        <View style={styles.left}>
          <View style={[styles.icon, { backgroundColor: "#1DB954" }]}>
            <Ionicons name="musical-notes" size={16} color="#fff" />
          </View>

          <View>
            <Text style={styles.title}>Spotify</Text>
            <Text style={styles.subtitle}>Connected as alexa_h</Text>
          </View>
        </View>

        <TouchableOpacity>
          <Text style={styles.disconnect}>DISCONNECT</Text>
        </TouchableOpacity>
      </View>

      {/* Apple Music */}
      <View style={styles.card}>
        <View style={styles.left}>
          <View style={[styles.icon, { backgroundColor: "#FA243C" }]}>
            <Ionicons name="musical-notes" size={16} color="#fff" />
          </View>

          <View>
            <Text style={styles.title}>Apple Music</Text>
            <Text style={styles.subtitle}>Not connected</Text>
          </View>
        </View>

        <TouchableOpacity>
          <Text style={styles.connect}>CONNECT</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 30,
  },

  section: {
    color: "#777",
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 16,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1328",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#fff",
    fontWeight: "600",
  },

  subtitle: {
    color: "#888",
    fontSize: 12,
  },

  disconnect: {
    color: "#999",
    fontWeight: "700",
  },

  connect: {
    color: "#9956f5",
    fontWeight: "700",
  },
})