import { View, Text, StyleSheet } from "react-native";

type Props = {
  stats?: {
    rooms_count: number;
    friends_count: number;
    vibes_count: number;
  };
};

export default function ProfileStats({ stats }: Props) {
  return (
    <View style={styles.container}>
      <Stat number={String(stats?.rooms_count ?? 0)} label="Rooms" />
      <Stat number={String(stats?.friends_count ?? 0)} label="Friends" />
      <Stat number={String(stats?.vibes_count ?? 0)} label="Vibes" />
    </View>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.number}>{number}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
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
});