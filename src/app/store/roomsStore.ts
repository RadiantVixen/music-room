import { create } from "zustand";
import {
  getRoomsRequest,
  getRoomDetailsRequest,
  createRoomRequest,
  updateRoomRequest,
  deleteRoomRequest,
  getMyRoomsRequest,
  getMyInvitationsRequest,
  getRoomTracksRequest,
  voteTrackRequest,
  suggestTrackRequest,
  deleteTrackRequest,
  searchTracksRequest,
  getDelegationDevicesRequest,
  registerDelegationDeviceRequest,
  delegateDeviceControlRequest,
  revokeDeviceControlRequest,
  getDelegationDeviceStatusRequest,
  sendDelegationControlActionRequest,
  skipRoomPlaybackRequest,
  resumeRoomPlaybackRequest,
  pauseRoomPlaybackRequest,
  getRoomPlaybackStateRequest,
  playRoomPlaybackRequest,
  inviteToRoomRequest,
  leaveRoomRequest,
  respondToRoomInvitationRequest,
} from "../api/rooms";

type Track = {
  id: string;
  deezerId: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration?: number;
  audioUrl?: string;
  externalUrl?: string;
  provider?: string;
  votes: number;
  vote_count?: number;
  rank?: number;
  has_voted?: boolean;
  addedBy?: {
    name: string;
    avatar: string;
  };
};

type Room = {
  id: number;
  name: string;
  description?: string;
  coverImage?: string;
  isPublic?: boolean;
  isLive?: boolean;
  participantCount?: number;
  host?: any;
  genres?: string[];
  createdAt?: string;
  currentTrack?: any;
  room_type?: "vote" | "delegation";
  visibility?: "public" | "private";
  license_type?: "default" | "invited" | "location";
};

type DelegationDevice = {
  id: number;
  room: number;
  device_identifier: string;
  device_name: string;
  owner_id: number;
  owner_username: string;
  delegated_to_id?: number | null;
  delegated_to_username?: string | null;
  status: "active" | "revoked";
  created_at: string;
  updated_at: string;
};

type PlaybackState = {
  room_id: number;
  status: "playing" | "paused" | "stopped";
  position_ms: number;
  started_at?: string | null;
  current_track?: {
    id: string;
    title: string;
    artist: string;
    albumArt?: string;
    audioUrl?: string;
    duration?: number;
  } | null;
};

type RoomsState = {
  rooms: Room[];
  myRooms: Room[];
  selectedRoom: Room | null;
  invitations: any[];
  roomTracks: Track[];
  isLoading: boolean;
  tracksLoading: boolean;
  searchLoading: boolean;
  searchResults: any[];
  delegationDevices: DelegationDevice[];
  delegationLoading: boolean;

  fetchRooms: (type?: "vote" | "delegation") => Promise<void>;
  fetchMyRooms: (type?: "vote" | "delegation") => Promise<void>;
  fetchRoomDetails: (roomId: number | string) => Promise<void>;
  createRoom: (payload: any) => Promise<Room>;
  updateRoom: (roomId: number | string, payload: any) => Promise<Room>;
  deleteRoom: (roomId: number | string) => Promise<void>;
  fetchInvitations: () => Promise<void>;

  fetchRoomTracks: (roomId: number | string) => Promise<void>;

  playbackState: PlaybackState | null;
  playbackLoading: boolean;

  fetchPlaybackState: (roomId: number | string) => Promise<void>;
  setPlaybackStateFromSocket: (payload: PlaybackState) => void;
  playPlayback: (roomId: number | string) => Promise<void>;
  pausePlayback: (roomId: number | string) => Promise<void>;
  resumePlayback: (roomId: number | string) => Promise<void>;
  skipPlayback: (roomId: number | string) => Promise<void>;

  setRoomTracksFromSocket: (tracks: Track[]) => void;
  setDelegationDevicesFromSocket: (devices: DelegationDevice[]) => void;
  upsertDelegationDeviceFromSocket: (device: DelegationDevice) => void;

  inviteToRoom: (roomId: number | string, userId: number) => Promise<void>;
  leaveRoom: (roomId: number | string) => Promise<void>;

  respondToInvitation: (
    roomId: number | string,
    action: "accept" | "decline"
  ) => Promise<void>;

  voteTrack: (
    roomId: number | string,
    trackId: number | string,
  ) => Promise<void>;
  suggestTrack: (
    roomId: number | string,
    payload: {
        deezerId: string;
        title: string;
        artist: string;
        album?: string;
        albumArt?: string;
        duration?: number;
        audioUrl?: string;
    }
    ) => Promise<void>;
  removeTrack: (
    roomId: number | string,
    trackId: number | string,
  ) => Promise<void>;
  searchTracks: (query: string) => Promise<void>;

  clearSelectedRoom: () => void;

  clearRoomTracks: () => void;
  clearSearchResults: () => void;

  fetchDelegationDevices: (roomId: number | string) => Promise<void>;
  registerDelegationDevice: (
    roomId: number | string,
    payload: { device_identifier: string; device_name: string }
  ) => Promise<void>;
  delegateDeviceControl: (
    roomId: number | string,
    deviceId: number | string,
    friendId: number
  ) => Promise<void>;
  revokeDeviceControl: (
    roomId: number | string,
    deviceId: number | string
  ) => Promise<void>;
  sendDelegationControlAction: (
    roomId: number | string,
    deviceId: number | string,
    actionType: "play" | "pause" | "skip" | "previous"
  ) => Promise<void>;
  clearDelegationDevices: () => void;
};

export const useRoomsStore = create<RoomsState>((set, get) => ({
  rooms: [],
  myRooms: [],
  selectedRoom: null,
  invitations: [],
  roomTracks: [],
  isLoading: false,
  tracksLoading: false,
  searchLoading: false,
  searchResults: [],
  delegationDevices: [],
  delegationLoading: false,

  fetchRooms: async (type) => {
    set({ isLoading: true });
    try {
      const data = await getRoomsRequest(type ? { type } : undefined);
      set({ rooms: data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyRooms: async (type) => {
    set({ isLoading: true });
    try {
      const data = await getMyRoomsRequest(type ? { type } : undefined);
      set({ myRooms: data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRoomDetails: async (roomId) => {
    set({ isLoading: true });
    try {
      const data = await getRoomDetailsRequest(roomId);
      set({ selectedRoom: data });
    } finally {
      set({ isLoading: false });
    }
  },

  createRoom: async (payload) => {
    set({ isLoading: true });
    try {
      const room = await createRoomRequest(payload);
      set({ rooms: [room, ...get().rooms], myRooms: [room, ...get().myRooms] });
      return room;
    } finally {
      set({ isLoading: false });
    }
  },

  updateRoom: async (roomId, payload) => {
    set({ isLoading: true });
    try {
      const updated = await updateRoomRequest(roomId, payload);

      set({
        rooms: get().rooms.map((r) => (r.id === updated.id ? updated : r)),
        myRooms: get().myRooms.map((r) => (r.id === updated.id ? updated : r)),
        selectedRoom:
          get().selectedRoom?.id === updated.id ? updated : get().selectedRoom,
      });

      return updated;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteRoom: async (roomId) => {
    set({ isLoading: true });
    try {
      await deleteRoomRequest(roomId);
      set({
        rooms: get().rooms.filter((r) => r.id !== Number(roomId)),
        myRooms: get().myRooms.filter((r) => r.id !== Number(roomId)),
        selectedRoom:
          get().selectedRoom?.id === Number(roomId) ? null : get().selectedRoom,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInvitations: async () => {
    set({ isLoading: true });
    try {
      const data = await getMyInvitationsRequest();
      set({ invitations: data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRoomTracks: async (roomId) => {
    set({ tracksLoading: true });
    try {
      const data = await getRoomTracksRequest(roomId);
      set({ roomTracks: data.results ?? data });
    } finally {
      set({ tracksLoading: false });
    }
  },

  voteTrack: async (roomId, trackId) => {
    const response = await voteTrackRequest(roomId, trackId);

    set({
      roomTracks: get().roomTracks.map((track) =>
        String(track.id) === String(trackId)
          ? { ...track, ...response.track, has_voted: true }
          : track,
      ),
    });

    await get().fetchRoomTracks(roomId);
  },

  suggestTrack: async (roomId, payload) => {
    await suggestTrackRequest(roomId, payload);
    await get().fetchRoomTracks(roomId);
  },

  removeTrack: async (roomId, trackId) => {
    await deleteTrackRequest(roomId, trackId);
    set({
      roomTracks: get().roomTracks.filter(
        (track) => String(track.id) !== String(trackId),
      ),
    });
  },

  clearSelectedRoom: () => set({ selectedRoom: null }),
  clearRoomTracks: () => set({ roomTracks: [] }),

  searchTracks: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    set({ searchLoading: true });
    try {
      const data = await searchTracksRequest(query);
      set({ searchResults: data });
    } finally {
      set({ searchLoading: false });
    }
  },

  clearSearchResults: () => set({ searchResults: [] }),

    fetchDelegationDevices: async (roomId) => {
    set({ delegationLoading: true });
    try {
      const data = await getDelegationDevicesRequest(roomId);
      set({ delegationDevices: data.results ?? data });
    } finally {
      set({ delegationLoading: false });
    }
  },

  registerDelegationDevice: async (roomId, payload) => {
    set({ delegationLoading: true });
    try {
      const created = await registerDelegationDeviceRequest(roomId, payload);

      set({
        delegationDevices: [created, ...get().delegationDevices],
      });
    } finally {
      set({ delegationLoading: false });
    }
  },

  delegateDeviceControl: async (roomId, deviceId, friendId) => {
    set({ delegationLoading: true });
    try {
      const updated = await delegateDeviceControlRequest(roomId, deviceId, {
        friend_id: friendId,
      });

      set({
        delegationDevices: get().delegationDevices.map((device) =>
          String(device.id) === String(deviceId) ? updated : device
        ),
      });
    } finally {
      set({ delegationLoading: false });
    }
  },

  revokeDeviceControl: async (roomId, deviceId) => {
    set({ delegationLoading: true });
    try {
      const updated = await revokeDeviceControlRequest(roomId, deviceId);

      set({
        delegationDevices: get().delegationDevices.map((device) =>
          String(device.id) === String(deviceId) ? updated : device
        ),
      });
    } finally {
      set({ delegationLoading: false });
    }
  },

  fetchDelegationDeviceStatus: async (roomId: number | string, deviceId: number | string) => {
    try {
      const device = await getDelegationDeviceStatusRequest(roomId, deviceId);

      set({
        delegationDevices: get().delegationDevices.map((item) =>
          String(item.id) === String(deviceId) ? device : item
        ),
      });

      return device;
    } catch {
      return null;
    }
  },

  sendDelegationControlAction: async (roomId, deviceId, actionType) => {
    const actionId = `${deviceId}-${actionType}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    const response = await sendDelegationControlActionRequest(roomId, deviceId, {
      action_id: actionId,
      action_type: actionType,
    });

    return response;
  },

  setRoomTracksFromSocket: (tracks) => set({ roomTracks: tracks }),

  setDelegationDevicesFromSocket: (devices) =>
    set({ delegationDevices: devices }),

  upsertDelegationDeviceFromSocket: (device) =>
    set({
      delegationDevices: (() => {
        const current = get().delegationDevices;
        const exists = current.some(
          (item) => String(item.id) === String(device.id)
        );

        if (!exists) return [device, ...current];

        return current.map((item) =>
          String(item.id) === String(device.id) ? device : item
        );
      })(),
    }),


      playbackState: null,
  playbackLoading: false,

  fetchPlaybackState: async (roomId) => {
    set({ playbackLoading: true });
    try {
      const data = await getRoomPlaybackStateRequest(roomId);
      set({ playbackState: data });
    } finally {
      set({ playbackLoading: false });
    }
  },

  setPlaybackStateFromSocket: (payload) => {
    set({ playbackState: payload });
  },

  playPlayback: async (roomId) => {
    const data = await playRoomPlaybackRequest(roomId);
    set({ playbackState: data });
  },

  pausePlayback: async (roomId) => {
    const data = await pauseRoomPlaybackRequest(roomId);
    set({ playbackState: data });
  },

  resumePlayback: async (roomId) => {
    const data = await resumeRoomPlaybackRequest(roomId);
    set({ playbackState: data });
  },

  skipPlayback: async (roomId) => {
    const data = await skipRoomPlaybackRequest(roomId);
    set({ playbackState: data });
  },
  clearDelegationDevices: () => set({ delegationDevices: [] }),

  inviteToRoom: async (roomId, userId) => {
    await inviteToRoomRequest(roomId, userId);
  },

  leaveRoom: async (roomId) => {
    await leaveRoomRequest(roomId);

    set({
      rooms: get().rooms.filter((r) => r.id !== Number(roomId)),
      myRooms: get().myRooms.filter((r) => r.id !== Number(roomId)),
      selectedRoom:
        get().selectedRoom?.id === Number(roomId) ? null : get().selectedRoom,
    });
  },
  respondToInvitation: async (roomId, action) => {
    await respondToRoomInvitationRequest(roomId, action);

    set({
      invitations: get().invitations.filter(
        (item: any) => String(item.room_id || item.room?.id) !== String(roomId)
      ),
    });

    if (action === "accept") {
      await get().fetchMyRooms();
    }
  },

}));
