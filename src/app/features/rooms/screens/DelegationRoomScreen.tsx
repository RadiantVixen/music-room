import { ScrollView, StyleSheet } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NowPlayingCard from "../components/NowPlayingCard";
import PlayerControls from "../components/PlayerControls";
import PlayerProgress from "../components/PlayerProgress";
import RoomTabs from "../components/RoomTabs";
import DelegationQueueList from "../components/DelegationQueueList";
import SuggestionsTab from "../components/SuggestionsTab";
import ControllersTab from "../components/ControllersTab";
import { useAudioPlayer } from "../../../utils/useAudioPlayer";
import { useRoomsStore } from "../../../store/roomsStore";
import { useAuthStore } from "../../../store/authStore";
import { useDelegationRoomSocket } from "../../../services/useDelegationRoomSocket";
import { useRoomPlaybackSocket } from "../../../services/useRoomPlaybackSocket";

type DelegationTab = "queue" | "add_tracks" | "controllers";

export default function DelegationRoomScreen({ room }: { room: any }) {
  const [activeTab, setActiveTab] = useState<DelegationTab>("queue");

  const { user } = useAuthStore();

  const {
    roomTracks,
    tracksLoading,
    fetchRoomTracks,
    delegationDevices,
    delegationLoading,
    fetchDelegationDevices,
    playbackState,
    fetchPlaybackState,
    playPlayback,
    pausePlayback,
    resumePlayback,
    skipPlayback,
  } = useRoomsStore();

  useDelegationRoomSocket(room?.id);
  useRoomPlaybackSocket(room?.id);

  useEffect(() => {
    if (room?.id) {
      fetchRoomTracks(room.id);
      fetchDelegationDevices(room.id);
      fetchPlaybackState(room.id);
    }
  }, [
    room?.id,
    fetchRoomTracks,
    fetchDelegationDevices,
    fetchPlaybackState,
  ]);

  const currentTrack = playbackState?.current_track || null;
  const backendIsPlaying = playbackState?.status === "playing";

  const queue = useMemo(() => {
    return roomTracks.filter(
      (track) => String(track.id) !== String(currentTrack?.id)
    );
  }, [roomTracks, currentTrack?.id]);

  const roomControlEntry = useMemo(() => {
    if (!delegationDevices?.length) return null;

    return (
      delegationDevices.find(
        (device) =>
          String(device.owner_id) ===
          String(room?.owner?.id || room?.host?.id || user?.id)
      ) || delegationDevices[0]
    );
  }, [delegationDevices, room?.owner?.id, room?.host?.id, user?.id]);

  const isOwner = useMemo(() => {
    if (!roomControlEntry || !user?.id) return false;
    return String(roomControlEntry.owner_id) === String(user.id);
  }, [roomControlEntry, user?.id]);

  const canControl = useMemo(() => {
    if (!roomControlEntry || !user?.id) return false;

    return (
      String(roomControlEntry.owner_id) === String(user.id) ||
      String(roomControlEntry.delegated_to_id) === String(user.id)
    );
  }, [roomControlEntry, user?.id]);

  const {
    play,
    pause,
    isPlaying: localIsPlaying,
    position,
    duration,
    seekTo,
  } = useAudioPlayer(currentTrack?.audioUrl);

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
    if (!room?.id || !canControl) return;

    if (playbackState?.status === "paused") {
      await resumePlayback(room.id);
      return;
    }

    await playPlayback(room.id);
  }, [room?.id, canControl, playbackState?.status, playPlayback, resumePlayback]);

  const handlePause = useCallback(async () => {
    if (!room?.id || !canControl) return;
    await pausePlayback(room.id);
  }, [room?.id, canControl, pausePlayback]);

  const handleSkip = useCallback(async () => {
    if (!room?.id || !canControl) return;
    await skipPlayback(room.id);
  }, [room?.id, canControl, skipPlayback]);

  const tabs = canControl
    ? [
        { key: "queue", label: "Queue" },
        { key: "add_tracks", label: "Add Tracks" },
        { key: "controllers", label: "Controllers" },
      ]
    : [{ key: "queue", label: "Queue" }];

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
        onPlay={canControl ? handlePlay : undefined}
        onPause={canControl ? handlePause : undefined}
        onNext={canControl ? handleSkip : undefined}
      />

      <RoomTabs
        tabs={tabs}
        active={activeTab}
        onChange={(tab) => setActiveTab(tab as DelegationTab)}
      />

      {activeTab === "queue" && (
        <DelegationQueueList
          roomId={room?.id}
          queue={queue}
          isLoading={tracksLoading}
          canControl={canControl}
          onSelectTrack={() => {}}
        />
      )}

      {activeTab === "add_tracks" && canControl && (
        <SuggestionsTab roomId={room?.id} />
      )}

      {activeTab === "controllers" && canControl && (
        <ControllersTab
          roomId={room?.id}
          isOwner={isOwner}
          currentUserId={user?.id}
          devices={delegationDevices}
          isLoading={delegationLoading}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
  },
});