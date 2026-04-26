import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoomsStore } from "../store/roomsStore";
import { api } from "../api/client";

type DelegationSocketMessage =
  | { type: "initial_state"; devices: any[] }
  | {
      type: "delegation_update";
      event?: string;
      device?: any;
      action?: any;
    };

function getWsBaseUrl() {
  const baseURL = api.defaults.baseURL || "";
  return baseURL
    .replace(/^http:\/\//, "ws://")
    .replace(/^https:\/\//, "wss://")
    .replace(/\/api\/?$/, "");
}

export function useDelegationRoomSocket(
  roomId?: number | string,
  onControlAction?: (actionType: "play" | "pause" | "skip" | "previous") => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const {
    setDelegationDevicesFromSocket,
    upsertDelegationDeviceFromSocket,
  } = useRoomsStore();

  useEffect(() => {
    if (!roomId) return;

    let socket: WebSocket | null = null;
    let isMounted = true;

    const connect = async () => {
      const token = await AsyncStorage.getItem("access_token");
      if (!token || !isMounted) return;

      const wsBase = getWsBaseUrl();

      socket = new WebSocket(
        `${wsBase}/ws/delegation/${roomId}/?token=${encodeURIComponent(token)}`
      );

      wsRef.current = socket;

      socket.onopen = () => {
        console.log("Delegation socket connected");
      };

      socket.onmessage = (event) => {
        try {
          const data: DelegationSocketMessage = JSON.parse(event.data);

          if (data.type === "initial_state") {
            setDelegationDevicesFromSocket(data.devices || []);
            return;
          }

          if (data.type === "delegation_update") {
            if (data.device) {
              upsertDelegationDeviceFromSocket(data.device);
            }

            if (data.event === "control_action" && data.action?.action_type) {
              onControlAction?.(data.action.action_type);
            }
          }
        } catch (error) {
          console.log("Delegation socket parse error", error);
        }
      };

      socket.onerror = (error) => {
        console.log("Delegation socket error", error);
      };

      socket.onclose = () => {
        console.log("Delegation socket closed");
      };
    };

    connect();

    return () => {
      isMounted = false;
      socket?.close();
      wsRef.current = null;
    };
  }, [
    roomId,
    setDelegationDevicesFromSocket,
    upsertDelegationDeviceFromSocket,
    onControlAction,
  ]);

  return wsRef;
}