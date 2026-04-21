import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useEffect } from "react";
import NowPlayingCard from "../components/NowPlayingCard";
import PlayerControls from "../components/PlayerControls";
import PlayerProgress from "../components/PlayerProgress";
import { useAudioPlayer } from "../../../utils/useAudioPlayer";

export default function DelegationRoomScreen({ room }: { room: any }) {
  const currentTrack = room?.currentTrack || null;

  const {
    play,
    pause,
    isPlaying,
    position,
    duration,
    seekTo,
  } = useAudioPlayer(currentTrack?.audioUrl, {});

  useEffect(() => {
    if (currentTrack?.audioUrl) {
      play();
    }
  }, [currentTrack?.audioUrl]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <NowPlayingCard track={currentTrack} />

      <PlayerProgress
        position={position}
        duration={duration}
        onSeek={seekTo}
      />

      <PlayerControls
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
      />

      <View style={styles.card}>
        <Text style={styles.title}>Delegation Room</Text>
        <Text style={styles.text}>
          In this room type, music control belongs to the owner or delegated users.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#1B1328",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  text: {
    color: "#aaa",
    fontSize: 13,
    lineHeight: 20,
  },
});