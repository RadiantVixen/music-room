import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePlaybackStore } from "../store/playbackStore";
import { useAudioPlayer } from "../utils/useAudioPlayer";

const { width } = Dimensions.get("window");

export default function MiniPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    previousTrack,
    currentIndex,
    queue
  } = usePlaybackStore();

  const { 
    play, 
    pause, 
    position, 
    duration 
  } = useAudioPlayer(currentTrack?.audioUrl || undefined, {
    onTrackEnd: () => {
      if (currentIndex < queue.length - 1) {
        nextTrack();
      }
    }
  });

  useEffect(() => {
    if (isPlaying) {
      play();
    } else {
      pause();
    }
  }, [isPlaying, currentTrack]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>
      <Image 
        source={{ uri: currentTrack.albumArt || "https://via.placeholder.com/150" }} 
        style={styles.artwork} 
      />
      <View style={styles.info}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          {currentTrack.audioUrl?.startsWith("file://") && (
            <Ionicons name="cloud-done" size={12} color="#9956F5" />
          )}
        </View>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={previousTrack}>
          <Ionicons name="play-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={nextTrack}>
          <Ionicons name="play-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    width: width,
    height: 70,
    backgroundColor: "#1B1328",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    zIndex: 1000,
    elevation: 5,
  },
  artwork: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  artist: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  playBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#9956F5",
  },
});
