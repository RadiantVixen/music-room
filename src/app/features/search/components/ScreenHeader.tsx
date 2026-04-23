import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function MusicHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* Back */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Center */}
        <View style={styles.center}>
          {!!subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>

        {/* Empty right (for symmetry) */}
        <View style={styles.iconBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "transparent",
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
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
    fontSize: 21,
    fontWeight: "700",
    marginTop: 2,
  },
});