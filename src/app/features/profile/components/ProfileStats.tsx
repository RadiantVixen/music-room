import { View, Text, StyleSheet } from "react-native"

export default function ProfileStats() {
  return (
    <View style={styles.container}>

      <Stat number="24" label="Rooms" />
      <Stat number="1.2k" label="Friends" />
      <Stat number="850" label="Vibes" />

    </View>
  )
}

function Stat({ number, label }: any) {
  return (
    <View style={styles.stat}>
      <Text style={styles.number}>{number}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
  },

  stat: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 20,
    borderRadius: 16,
    width: 90,
  },

  number: {
    fontSize: 22,
    fontWeight: "700",
    color: "#9956f5",
  },

  label: {
    fontSize: 10,
    marginTop: 4,
    color: "#9ca3af",
    textTransform: "uppercase",
  },
})