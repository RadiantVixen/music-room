import { Audio } from "expo-av"
import { useEffect, useState } from "react"

export function useAudioPlayer(
  audioUrl?: string,
  options?: { onTrackEnd?: () => void }
) {
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
    setIsPlaying(status.isPlaying)

    // 🔥 THIS IS THE KEY
    if (status.didJustFinish) {
      options?.onTrackEnd?.()
    }
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

  async function seekTo(value: number) {
      if (!sound) return
  
      const newPosition = value * duration
        await sound.setPositionAsync(newPosition)
    }
  return {
    play,
    pause,
    isPlaying,
    position,
    duration,
    seekTo,
  }
}