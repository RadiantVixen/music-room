import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"


export default function RoomHeader({ roomName }: { roomName: string }) {
  const navigation = useNavigation()


  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Left (close / back) */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-down" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Center */}
        <View style={styles.center}>
          <Text style={styles.subtitle}>PLAYING FROM ROOM</Text>
          <Text style={styles.title}>{roomName}</Text>
        </View>

        {/* Right (settings or users) */}
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "transparent",
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    alignItems: "center",
  },

  subtitle: {
    fontSize: 10,
    color: "#888",
    letterSpacing: 1.5,
    fontWeight: "600",
  },

  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
})