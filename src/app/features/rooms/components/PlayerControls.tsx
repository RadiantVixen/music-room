import { View, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function PlayerControls({
  isPlaying,
  onPlay,
  onPause,
}: any) {
  return (
    <View style={styles.container}>

      {/* Dislike */}
      <TouchableOpacity>
        <Ionicons name="thumbs-down-outline" size={22} color="#aaa" />
      </TouchableOpacity>

      {/* Previous */}
      <TouchableOpacity>
        <Ionicons name="play-skip-back" size={26} color="#fff" />
      </TouchableOpacity>

      {/* PLAY / PAUSE */}
      <TouchableOpacity
        style={styles.play}
        onPress={isPlaying ? onPause : onPlay}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={28}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Next */}
      <TouchableOpacity>
        <Ionicons name="play-skip-forward" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Like */}
      <TouchableOpacity>
        <Ionicons name="thumbs-up" size={22} color="#9956F5" />
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  play: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#9956F5",
    alignItems: "center",
    justifyContent: "center",
  },
})