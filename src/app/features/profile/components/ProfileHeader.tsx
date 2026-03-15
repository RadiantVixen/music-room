import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native"
import { useAppNavigation } from "../../../hooks/useAppNavigation";

export default function ProfileHeader() {
  const navigation = useAppNavigation();
  return (
    <View style={styles.container}>

      <Image
        source={{ uri: "https://i.pravatar.cc/200" }}
        style={styles.avatar}
      />

      <Text style={styles.name}>Alex Rivera</Text>

      <Text style={styles.username}>@arivera_vibes</Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("EditProfile")}>
          <Text style={styles.secondaryText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Share Profile</Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 24,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#9956f5",
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 12,
    color: "white",
  },

  username: {
    color: "#9956f5",
    marginTop: 4,
  },

  buttons: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },

  primaryBtn: {
    backgroundColor: "#9956f5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  secondaryBtn: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  primaryText: {
    color: "white",
    fontWeight: "600",
  },

  secondaryText: {
    color: "white",
  },
})