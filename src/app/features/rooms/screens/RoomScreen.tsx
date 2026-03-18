import { View, ScrollView, StyleSheet } from "react-native"
import AppLayout from "../../../components/layout/AppLayout"

import RoomHeader from "../components/RoomHeader"
import NowPlayingCard from "../components/NowPlayingCard"
import PlayerControls from "../components/PlayerControls"
import RoomTabs from "../components/RoomTabs"
import QueueList from "../components/QueueList"
import { useAppRoute } from "../../../hooks/useAppRoute"
import { liveRooms } from "../../home/data/mockRooms"
import { useAudioPlayer } from "../../../utils/useAudioPlayer"
import PlayerProgress from "../components/PlayerProgress"

export default function RoomScreen() {
  const route = useAppRoute<"Room">()

  const { roomId } = route.params
  const room = liveRooms.find(r => r.id === roomId)
  if (!room) {
    return (
      <AppLayout header={<RoomHeader roomName="Room Not Found" />}>
        <View style={styles.container} />
      </AppLayout>
    )
  }
  const track = room.currentTrack

  const {
    play,
    pause,
    isPlaying,
    position,
    duration
  } = useAudioPlayer(track?.audioUrl)
  return (
    <AppLayout
      header={<RoomHeader roomName={room?.name || "Room"} />}
    >

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        <NowPlayingCard  track={room.currentTrack}/>
        
        <PlayerProgress
          position={position}
          duration={duration}
        />

        <PlayerControls
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
        />

        <RoomTabs />

        <QueueList />

      </ScrollView>

    </AppLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161022",
  },
})