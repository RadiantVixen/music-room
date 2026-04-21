import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useEffect, useMemo, useState } from "react";
import NowPlayingCard from "../components/NowPlayingCard";
import PlayerControls from "../components/PlayerControls";
import PlayerProgress from "../components/PlayerProgress";
import RoomTabs from "../components/RoomTabs";
import VoteQueueList from "../components/VoteQueueList";
import SuggestionsTab from "../components/SuggestionsTab";
import NextWinningCard from "../components/NextWinningCard";
import { useAudioPlayer } from "../../../utils/useAudioPlayer";
import { useRoomsStore } from "../../../store/roomsStore";

type VoteTab = "queue" | "suggestions";

export default function VoteRoomScreen({ room }: { room: any }) {
  const [activeTab, setActiveTab] = useState<VoteTab>("queue");
  const { roomTracks, tracksLoading, fetchRoomTracks } = useRoomsStore();

  useEffect(() => {
    if (room?.id) {
      fetchRoomTracks(room.id);
    }
  }, [room?.id]);

  const sortedTracks = useMemo(() => {
    return [...roomTracks].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [roomTracks]);

  const currentTrack = room?.currentTrack || sortedTracks[0] || null;

  const queue = useMemo(() => {
    return sortedTracks.filter(
      (track) => String(track.id) !== String(currentTrack?.id)
    );
  }, [sortedTracks, currentTrack?.id]);

  const nextWinningTrack = queue[0] || null;
  
  const { play, pause, isPlaying, position, duration, seekTo } = useAudioPlayer(
    currentTrack?.audioUrl,
    {}
  );


  useEffect(() => {
    if (currentTrack?.audioUrl) {
      play();
    }
  }, [currentTrack?.audioUrl]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
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

      <NextWinningCard track={nextWinningTrack} />

      <RoomTabs
        tabs={[
          { key: "queue", label: "Queue" },
          { key: "suggestions", label: "Suggestions" },
        ]}
        active={activeTab}
        onChange={(tab) => setActiveTab(tab as VoteTab)}
      />

      {activeTab === "queue" && (
        <VoteQueueList
          roomId={room?.id}
          queue={queue}
          isLoading={tracksLoading}
        />
      )}

      {activeTab === "suggestions" && (
        <SuggestionsTab roomId={room?.id} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
  },
});