import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  genres?: string[];
  onPress?: () => void;
};

export default function MusicPreferences({ genres = [], onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Music Preferences</Text>

        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>

      <View style={styles.chips}>
        {genres.length > 0 ? (
          genres.map((g) => (
            <View key={g} style={styles.chip}>
              <Text style={styles.chipText}>{g}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No music preferences yet.</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 10,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#9956f520",
    borderWidth: 1,
    borderColor: "#9956f540",
  },
  chipText: {
    color: "#9956f5",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    color: "#9CA3AF",
  },
});