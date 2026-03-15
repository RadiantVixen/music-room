import { View, Text, StyleSheet } from "react-native"

const genres = ["Synthwave", "Techno", "Deep House", "Lo-fi"]

export default function MusicPreferences() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>Music Preferences</Text>

      <View style={styles.chips}>
        {genres.map((g) => (
          <View key={g} style={styles.chip}>
            <Text style={styles.chipText}>{g}</Text>
          </View>
        ))}
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
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
})