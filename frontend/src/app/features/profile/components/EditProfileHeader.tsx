import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

export default function EditProfileHeader() {
  const navigation = useNavigation()

  return (
    <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
      <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity>
        <Text style={styles.save}> Save </Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  save: {
    color: "#9956f5",
    fontWeight: "700",
  },
})