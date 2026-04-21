import { ScrollView, View, StyleSheet } from "react-native";
import { useEffect, useMemo, useState } from "react";
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
  } = useRoomsStore();

  useEffect(() => {
    if (room?.id) {
      fetchRoomTracks(room.id);
      fetchDelegationDevices(room.id);
    }
  }, [room?.id]);

  const [currentTrack, setCurrentTrack] = useState<any>(room?.currentTrack || null);
  useEffect(() => {
    if (!currentTrack && roomTracks.length > 0) {
      setCurrentTrack(room?.currentTrack || roomTracks[0]);
    }
  }, [roomTracks, room?.currentTrack, currentTrack]);

  const queue = useMemo(() => {
    return roomTracks.filter(
      (track) => String(track.id) !== String(currentTrack?.id)
    );
  }, [roomTracks, currentTrack?.id]);

  const handleSelectTrack = (track: any) => {
    setCurrentTrack(track);
  };

  const roomControlEntry = useMemo(() => {
    if (!delegationDevices?.length) return null;

    return delegationDevices.find(
      (device) =>
        String(device.owner_id) === String(room?.owner?.id || room?.host?.id || user?.id)
    ) || delegationDevices[0];
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
        isPlaying={isPlaying}
        onPlay={canControl ? play : undefined}
        onPause={canControl ? pause : undefined}
      />

      <RoomTabs
        tabs={tabs}
        active={activeTab}
        onChange={(tab) => setActiveTab(tab as DelegationTab)}
      />

      { activeTab === "queue" && (
        <DelegationQueueList
          roomId={room?.id}
          queue={queue}
          isLoading={tracksLoading}
          canControl={canControl}
          onSelectTrack={handleSelectTrack}
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