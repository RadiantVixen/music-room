import { View, ScrollView, StyleSheet } from "react-native"
import AppLayout from "../../../components/layout/AppLayout"

import RoomHeader from "../components/RoomHeader"
import NowPlayingCard from "../components/NowPlayingCard"
import PlayerControls from "../components/PlayerControls"
import RoomTabs from "../components/RoomTabs"
import QueueList from "../components/QueueList"
import { useAppRoute } from "../../../hooks/useAppRoute"
import { liveRooms, mockTracks } from "../../home/data/mockRooms"
import { useAudioPlayer } from "../../../utils/useAudioPlayer"
import PlayerProgress from "../components/PlayerProgress"
import { useEffect, useState } from "react"
import NextUpList from "../components/NextUpList"
import VoteList from "../components/VoteList"

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
  


  const [activeTab, setActiveTab] = useState<"vote" | "next">("vote");

  const [queue, setQueue] = useState(
    mockTracks.map((track, index) => ({
      ...track,
      id: index.toString(),
      votes: Math.floor(Math.random() * 20),
      userVote: 0,
    }))
  );
  const handleVote = (id: string, newVote: number) => {
    setQueue((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;

        let votes = t.votes;
        // remove previous vote
        votes -= t.userVote;
        // toggle logic
        const finalVote = t.userVote === newVote ? 0 : newVote;
        votes += finalVote;
        return {
          ...t,
          votes,
          userVote: finalVote,
        };
      })
    );
  };
  const [currentIndex, setCurrentIndex] = useState(0)
  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes)
  const currentTrack = sortedQueue[currentIndex]

  const handleNextTrack = () => {
    setCurrentIndex((prev) => {
      const next = prev + 1
      return next < sortedQueue.length ? next : 0
    })
  }
  const track = currentTrack 

  const {
    play,
    pause,
    isPlaying,
    position,
    duration,
    seekTo,
  } = useAudioPlayer(track?.audioUrl, {
    onTrackEnd: handleNextTrack,
  })
  useEffect(() => {
    if (track?.audioUrl) {
      play()
    }
  }, [track?.audioUrl])
  return (
    <AppLayout
      header={<RoomHeader roomName={room?.name || "Room"} />}
    >

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        <NowPlayingCard  track={track}/>

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

        <RoomTabs onChange={setActiveTab} />
        {activeTab === "vote" && (
          <VoteList queue={queue} onVote={handleVote} />
        )}
        {activeTab === "next" && (
          <NextUpList queue={queue} />
        )}

        {/* <QueueList /> */}

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