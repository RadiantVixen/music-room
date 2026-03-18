import { Audio } from "expo-av"
import { useEffect, useState } from "react"

export function useAudioPlayer(audioUrl?: string) {
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(1)

  async function play() {
    if (!audioUrl) return

    if (sound) {
      await sound.playAsync()
      setIsPlaying(true)
      return
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: true },
      onPlaybackStatusUpdate
    )

    setSound(newSound)
    setIsPlaying(true)
  }

  function onPlaybackStatusUpdate(status: any) {
    if (!status.isLoaded) return

    setPosition(status.positionMillis)
    setDuration(status.durationMillis || 1)
  }

  async function pause() {
    await sound?.pauseAsync()
    setIsPlaying(false)
  }

  useEffect(() => {
    return () => {
      sound?.unloadAsync()
    }
  }, [sound])

  return { play, pause, isPlaying, position, duration }
}