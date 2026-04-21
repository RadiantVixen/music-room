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

  fetchRooms: (type?: "vote" | "delegation") => Promise<void>;
  fetchMyRooms: (type?: "vote" | "delegation") => Promise<void>;
  fetchRoomDetails: (roomId: number | string) => Promise<void>;
  createRoom: (payload: any) => Promise<Room>;
  updateRoom: (roomId: number | string, payload: any) => Promise<Room>;
  deleteRoom: (roomId: number | string) => Promise<void>;
  fetchInvitations: () => Promise<void>;

  fetchRoomTracks: (roomId: number | string) => Promise<void>;
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
}));
