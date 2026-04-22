import { create } from "zustand";
import {
  getFriendsRequest,
  getPendingFriendRequestsRequest,
  getSentFriendRequestsRequest,
  removeFriendRequest,
  searchUsersRequest,
  sendFriendRequestRequest,
  respondToFriendRequestRequest,
  getUserProfileRequest,
  blockUserRequest,
  getAllUsersRequest
} from "../api/friends";
import { useAuthStore } from "./authStore";

export type Friend = {
  id: number;
  username: string;
  first_name: string;
  email: string;
  avatar: string | null;
};
export type FriendProfile = {
  id: number;
  username: string;
  first_name: string;
  email: string;
  profile?: {
    avatar: string | null;
    bio: string;
    location: string;
    provider: string | null;
    phone: string | null;
    phone_verified: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  music_preferences?: {
    favorite_genres: string[];
    favorite_artists: string[];
    favorite_tracks: string[];
    updated_at: string | null;
  };
  stats?: {
    rooms_count: number;
    friends_count: number;
    vibes_count: number;
  };
  relationship?: {
    status:
      | "self"
      | "none"
      | "friends"
      | "request_sent"
      | "request_received"
      | "blocked";
    request_id: number | null;
    is_friend: boolean;
    can_add_friend: boolean;
    can_unfriend: boolean;
    can_block: boolean;
  };
};


export type FriendRequestItem = {
  id: number;
  sender_id: number;
  sender_email: string;
  sender_username: string;
  receiver_id: number;
  receiver_email: string;
  receiver_username: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type FriendsState = {
  friends: Friend[];
  pendingRequests: FriendRequestItem[];
  sentRequests: FriendRequestItem[];
  searchedUsers: Friend[];
  selectedFriendProfile: FriendProfile | null;
  isLoading: boolean;
  allUsers: Friend[];
  usersLoading: boolean;

  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  sendFriendRequest: (receiverId: number) => Promise<any>;
  respondToFriendRequest: (
    requestId: number,
    action: "accept" | "decline" | "block"
  ) => Promise<any>;
  removeFriend: (userId: number) => Promise<void>;
  fetchFriendProfile: (userId: number) => Promise<void>;
  blockUser: (userId: number) => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  clearSearchedUsers: () => void;
  clearSelectedFriendProfile: () => void;
};


export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  searchedUsers: [],
  selectedFriendProfile: null,
  isLoading: false,
  allUsers: [],
  usersLoading: false,

  fetchFriends: async () => {
    set({ isLoading: true });
    try {
      const data = await getFriendsRequest();
      set({ friends: Array.isArray(data) ? data : [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendingRequests: async () => {
    set({ isLoading: true });
    try {
      const data = await getPendingFriendRequestsRequest();
      set({ pendingRequests: Array.isArray(data) ? data : [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSentRequests: async () => {
    set({ isLoading: true });
    try {
      const data = await getSentFriendRequestsRequest();
      set({ sentRequests: Array.isArray(data) ? data : [] });
    } finally {
      set({ isLoading: false });
    }
  },

  searchUsers: async (query: string) => {
    if (!query.trim()) {
      set({ searchedUsers: [] });
      return;
    }

    set({ isLoading: true });
    try {
      const data = await searchUsersRequest(query);
      set({ searchedUsers: Array.isArray(data) ? data : [] });
    } finally {
      set({ isLoading: false });
    }
  },

  sendFriendRequest: async (receiverId: number) => {
    set({ isLoading: true });
    try {
      const result = await sendFriendRequestRequest(receiverId);
      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  respondToFriendRequest: async (requestId, action) => {
    set({ isLoading: true });
    try {
      const result = await respondToFriendRequestRequest(requestId, action);

      await get().fetchPendingRequests();
      await get().fetchFriends();

      await useAuthStore.getState().refreshMe();

      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  removeFriend: async (userId: number) => {
    set({ isLoading: true });
    try {
        await removeFriendRequest(userId);

        set({
        friends: get().friends.filter((friend) => friend.id !== userId),
        selectedFriendProfile:
            get().selectedFriendProfile?.id === userId
            ? {
                ...get().selectedFriendProfile!,
                relationship: {
                    status: "none",
                    request_id: null,
                    is_friend: false,
                    can_add_friend: true,
                    can_unfriend: false,
                    can_block: true,
                },
                }
            : get().selectedFriendProfile,
        });

        await useAuthStore.getState().refreshMe();
    } finally {
        set({ isLoading: false });
    }
    },

  clearSearchedUsers: () => set({ searchedUsers: [] }),

  fetchFriendProfile: async (userId: number) => {
    set({ isLoading: true });
    try {
        const data = await getUserProfileRequest(userId);
        set({ selectedFriendProfile: data });
    } finally {
        set({ isLoading: false });
    }
    },

  blockUser: async (userId: number) => {
    set({ isLoading: true });
    try {
        await blockUserRequest(userId);
        await get().fetchFriends();
        set({ selectedFriendProfile: null });
    } finally {
        set({ isLoading: false });
    }
    },

    fetchAllUsers: async () => {
      set({ usersLoading: true });
      try {
        const data = await getAllUsersRequest();
        set({ allUsers: data });
      } finally {
        set({ usersLoading: false });
      }
    },

  clearSelectedFriendProfile: () => set({ selectedFriendProfile: null }),
}));