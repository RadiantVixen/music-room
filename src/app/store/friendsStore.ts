import { create } from "zustand";
import {
  getFriendsRequest,
  getPendingFriendRequestsRequest,
  getSentFriendRequestsRequest,
  removeFriendRequest,
  searchUsersRequest,
  sendFriendRequestRequest,
  respondToFriendRequestRequest,
} from "../api/friends";

export type Friend = {
  id: number;
  username: string;
  first_name: string;
  email: string;
  avatar: string | null;
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
  isLoading: boolean;

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
  clearSearchedUsers: () => void;
};

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  searchedUsers: [],
  isLoading: false,

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
      });
    } finally {
      set({ isLoading: false });
    }
  },

  clearSearchedUsers: () => set({ searchedUsers: [] }),
}));