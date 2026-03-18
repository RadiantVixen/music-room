import { View, Text, StyleSheet } from "react-native"

export default function PlayerProgress({
  position,
  duration,
}: any) {
  const progress = position / duration

  function format(ms: number) {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <View style={styles.container}>
      
      {/* Bar */}
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${progress * 100}%` },
          ]}
        />
      </View>

      {/* Time */}
      <View style={styles.timeRow}>
        <Text style={styles.time}>
          {format(position)}
        </Text>
        <Text style={styles.time}>
          {format(duration)}
        </Text>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  barBackground: {
    height: 4,
    backgroundColor: "#2A2338",
    borderRadius: 10,
    overflow: "hidden",
  },

  barFill: {
    height: 4,
    backgroundColor: "#9956F5",
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  time: {
    color: "#888",
    fontSize: 11,
  },
})