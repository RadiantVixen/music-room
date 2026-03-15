import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function SaveProfileButton() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button}>
        <Ionicons name="checkmark-circle" size={22} color="#fff" />
        <Text style={styles.text}>Save Changes</Text>
      </TouchableOpacity>

      <Text style={styles.info}>
        You can change these settings at any time in your profile.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 50,
  },

  button: {
    backgroundColor: "#9956f5",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  info: {
    marginTop: 12,
    textAlign: "center",
    color: "#777",
    fontSize: 12,
  },
})