import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PlayerControls({
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
}: {
  isPlaying: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.sideButton} onPress={onPrevious}>
        <Ionicons name="play-skip-back" size={24} color="#fff" />
      </TouchableOpacity>

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

      <TouchableOpacity style={styles.sideButton} onPress={onNext}>
        <Ionicons name="play-skip-forward" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1B1328",
    alignItems: "center",
    justifyContent: "center",
  },
  play: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#9956F5",
    alignItems: "center",
    justifyContent: "center",
  },
});