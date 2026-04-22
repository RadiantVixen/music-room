import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/client";
import { useRoomsStore } from "../store/roomsStore";

type PlaybackSocketMessage = {
  type: "playback_state";
  payload: any;
};

function getWsBaseUrl() {
  const baseURL = api.defaults.baseURL || "";
  return baseURL
    .replace(/^http:\/\//, "ws://")
    .replace(/^https:\/\//, "wss://")
    .replace(/\/api\/?$/, "");
}

export function useRoomPlaybackSocket(roomId?: number | string) {
  const wsRef = useRef<WebSocket | null>(null);
  const { setPlaybackStateFromSocket } = useRoomsStore();

  useEffect(() => {
    if (!roomId) return;

    let socket: WebSocket | null = null;
    let mounted = true;

    const connect = async () => {
      const token = await AsyncStorage.getItem("access_token");
      if (!token || !mounted) return;

      const wsBase = getWsBaseUrl();
      socket = new WebSocket(
        `${wsBase}/ws/playback/${roomId}/?token=${encodeURIComponent(token)}`
      );

      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data: PlaybackSocketMessage = JSON.parse(event.data);
          if (data.type === "playback_state") {
            setPlaybackStateFromSocket(data.payload);
          }
        } catch (error) {
          console.log("Playback socket parse error", error);
        }
      };

      socket.onerror = (error) => {
        console.log("Playback socket error", error);
      };
    };

    connect();

    return () => {
      mounted = false;
      socket?.close();
      wsRef.current = null;
    };
  }, [roomId, setPlaybackStateFromSocket]);

  return wsRef;
}