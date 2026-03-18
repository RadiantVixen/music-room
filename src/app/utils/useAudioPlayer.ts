import { Audio } from "expo-av"
import { useEffect, useState } from "react"

export function useAudioPlayer(audioUrl?: string) {
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  async function play() {
    if (!audioUrl) return

    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: true }
    )

    setSound(sound)
    setIsPlaying(true)
  }

  async function pause() {
    await sound?.pauseAsync()
    setIsPlaying(false)
  }

  async function stop() {
    await sound?.stopAsync()
    setIsPlaying(false)
  }

  useEffect(() => {
    return () => {
      sound?.unloadAsync()
    }
  }, [sound])

  return { play, pause, stop, isPlaying }
}