import { View, Text, StyleSheet, PanResponder } from "react-native"
import { useRef } from "react"

export default function PlayerProgress({
  position,
  duration,
  onSeek,
}: any) {
  const progress = position / duration

  const barWidth = useRef(0)

  function format(ms: number) {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      handleSeek(evt.nativeEvent.locationX)
    },

    onPanResponderMove: (evt) => {
      handleSeek(evt.nativeEvent.locationX)
    },
  })

  function handleSeek(x: number) {
    const ratio = Math.max(0, Math.min(1, x / barWidth.current))
    onSeek(ratio)
  }

  return (
    <View style={styles.container}>
      
      {/* Bar */}
      <View
        style={styles.barBackground}
        onLayout={(e) => {
          barWidth.current = e.nativeEvent.layout.width
        }}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.barFill,
            { width: `${progress * 100}%` },
          ]}
        />
      </View>

      {/* Time */}
      <View style={styles.timeRow}>
        <Text style={styles.time}>{format(position)}</Text>
        <Text style={styles.time}>{format(duration)}</Text>
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