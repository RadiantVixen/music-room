import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";

export function useAudioPlayer(
  audioUrl?: string,
  options?: { onTrackEnd?: () => void }
) {
  const soundRef = useRef<Audio.Sound | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status?.isLoaded) return;

    setPosition(status.positionMillis || 0);
    setDuration(status.durationMillis || 1);
    setIsPlaying(!!status.isPlaying);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setPosition(0);
      options?.onTrackEnd?.();
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadAndPlay() {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setIsPlaying(false);
      setPosition(0);
      setDuration(1);

      if (!audioUrl) return;

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }, // auto play immediately
        onPlaybackStatusUpdate
      );

      if (cancelled) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
      setIsPlaying(true);
    }

    loadAndPlay();

    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  async function play() {
    if (!soundRef.current) return;
    await soundRef.current.playAsync();
    setIsPlaying(true);
  }

  async function pause() {
    if (!soundRef.current) return;
    await soundRef.current.pauseAsync();
    setIsPlaying(false);
  }

  async function seekTo(value: number) {
    if (!soundRef.current) return;
    const newPosition = value * duration;
    await soundRef.current.setPositionAsync(newPosition);
  }

  return {
    play,
    pause,
    isPlaying,
    position,
    duration,
    seekTo,
  };
}