import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppNavigation } from "../../../hooks/useAppNavigation";
export default function ProfileHeaderNav() {
  const navigation = useAppNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        
        {/* Settings */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Profile & Settings</Text>

        {/* Edit */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Ionicons name="create-outline" size={22} color="#fff" />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
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

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});