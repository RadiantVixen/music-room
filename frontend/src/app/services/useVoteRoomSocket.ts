import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoomsStore } from "../store/roomsStore";
import { api } from "../api/client";

type VoteSocketMessage =
  | { type: "initial_state"; tracks: any[] }
  | { type: "vote_update"; tracks: any[] }
  | { type: "track_added"; tracks: any[] }
  | { type: "track_removed"; tracks: any[] };

function getWsBaseUrl() {
  const baseURL = api.defaults.baseURL || "";
  return baseURL
    .replace(/^http:\/\//, "ws://")
    .replace(/^https:\/\//, "wss://")
    .replace(/\/api\/?$/, "");
}

export function useVoteRoomSocket(roomId?: number | string) {
  const wsRef = useRef<WebSocket | null>(null);
  const { setRoomTracksFromSocket } = useRoomsStore();

  useEffect(() => {
    if (!roomId) return;

    let socket: WebSocket | null = null;
    let isMounted = true;

    const connect = async () => {
      const token = await AsyncStorage.getItem("access_token");
      if (!token || !isMounted) return;

      const wsBase = getWsBaseUrl();

      socket = new WebSocket(
        `${wsBase}/ws/events/${roomId}/?token=${encodeURIComponent(token)}`
      );

      wsRef.current = socket;

      socket.onopen = () => {
        console.log("Vote socket connected");
      };

      socket.onmessage = (event) => {
        try {
          const data: VoteSocketMessage = JSON.parse(event.data);

          if (
            data.type === "initial_state" ||
            data.type === "vote_update" ||
            data.type === "track_added" ||
            data.type === "track_removed"
          ) {
            setRoomTracksFromSocket(data.tracks || []);
          }
        } catch (error) {
          console.log("Vote socket parse error", error);
        }
      };

      socket.onerror = (error) => {
        console.log("Vote socket error", error);
      };

      socket.onclose = () => {
        console.log("Vote socket closed");
      };
    };

    connect();

    return () => {
      isMounted = false;
      socket?.close();
      wsRef.current = null;
    };
  }, [roomId, setRoomTracksFromSocket]);

  return wsRef;
}