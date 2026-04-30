import { ScrollView, StyleSheet } from "react-native";
import { useEffect, useMemo, useCallback, useRef } from "react";
import NowPlayingCard from "../components/NowPlayingCard";
import PlayerControls from "../components/PlayerControls";
import PlayerProgress from "../components/PlayerProgress";
import RoomTabs from "../components/RoomTabs";
import VoteQueueList from "../components/VoteQueueList";
import SuggestionsTab from "../components/SuggestionsTab";
import NextWinningCard from "../components/NextWinningCard";
import { useAudioPlayer } from "../../../utils/useAudioPlayer";
import { useRoomsStore } from "../../../store/roomsStore";
import { useVoteRoomSocket } from "../../../services/useVoteRoomSocket";
import { useRoomPlaybackSocket } from "../../../services/useRoomPlaybackSocket";
import { useState } from "react";

type VoteTab = "queue" | "suggestions";

export default function VoteRoomScreen({ room }: { room: any }) {
  const [activeTab, setActiveTab] = useState<VoteTab>("queue");

  const {
    roomTracks,
    tracksLoading,
    fetchRoomTracks,
    playbackState,
    fetchPlaybackState,
    playPlayback,
    pausePlayback,
    resumePlayback,
    skipPlayback,
  } = useRoomsStore();

  useVoteRoomSocket(room?.id);
  useRoomPlaybackSocket(room?.id);

  useEffect(() => {
    if (room?.id) {
      fetchRoomTracks(room.id);
      fetchPlaybackState(room.id);
    }
  }, [room?.id, fetchRoomTracks, fetchPlaybackState]);

  const currentTrack = playbackState?.current_track || null;
  const backendIsPlaying = playbackState?.status === "playing";

  const sortedTracks = useMemo(() => {
    return [...roomTracks].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [roomTracks]);

  const queue = useMemo(() => {
    return sortedTracks.filter(
      (track) => String(track.id) !== String(currentTrack?.id)
    );
  }, [sortedTracks, currentTrack?.id]);

  const nextWinningTrack = queue[0] || null;

  const { play, pause, isPlaying: localIsPlaying, position, duration, seekTo } = useAudioPlayer(
    currentTrack?.audioUrl,
    {
      onTrackEnd: async () => {
        if (!room?.id) return;
        await skipPlayback(room.id);
      },
    }
  );

  const syncedTrackIdRef = useRef<string | null>(null);
  const syncedStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const trackId = currentTrack?.id ? String(currentTrack.id) : null;
    const status = playbackState?.status || null;

    const trackChanged = syncedTrackIdRef.current !== trackId;
    const statusChanged = syncedStatusRef.current !== status;

    if (!currentTrack?.audioUrl) {
      syncedTrackIdRef.current = trackId;
      syncedStatusRef.current = status;
      return;
    }

    if (trackChanged || statusChanged) {
      if (backendIsPlaying) {
        play();
      } else {
        pause();
      }

      syncedTrackIdRef.current = trackId;
      syncedStatusRef.current = status;
    }
  }, [currentTrack?.id, currentTrack?.audioUrl, backendIsPlaying, playbackState?.status, play, pause]);

  const handlePlay = useCallback(async () => {
    if (!room?.id) return;

    if (playbackState?.status === "paused") {
      await resumePlayback(room.id);
      return;
    }

    await playPlayback(room.id);
  }, [room?.id, playbackState?.status, playPlayback, resumePlayback]);

  const handlePause = useCallback(async () => {
    if (!room?.id) return;
    await pausePlayback(room.id);
  }, [room?.id, pausePlayback]);

  const handleSkip = useCallback(async () => {
    if (!room?.id) return;
    await skipPlayback(room.id);
  }, [room?.id, skipPlayback]);

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
        isPlaying={backendIsPlaying || localIsPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleSkip}
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