import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  signupRequest,
  loginRequest,
  getMeRequest,
  SignupPayload,
  LoginPayload,
} from "../api/auth";

type User = {
  id: number;
  username: string;
  first_name: string;
  email: string;
  role?: string;
  profile?: any | null;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  signup: (payload: SignupPayload) => Promise<any>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user }),

  signup: async (payload) => {
    set({ isLoading: true });
    try {
      const data = await signupRequest(payload);
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (payload) => {
    
    set({ isLoading: true });

    try {
      console.log("Attempting login with payload:", payload);
      const data = await loginRequest(payload);
      console.log("Login response:", data);

      const accessToken = data.access;
      const refreshToken = data.refresh;

      await AsyncStorage.setItem("access_token", accessToken);
      await AsyncStorage.setItem("refresh_token", refreshToken);

      // 🔥 fetch user AFTER login
      const user = await getMeRequest();

      set({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: true,
      });
    } catch (error) {
      console.log("Login error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  restoreSession: async () => {
    set({ isLoading: true });

    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken) {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        return;
      }

      // set tokens first
      set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
      });

      try {
        const user = await getMeRequest();

        set({ user });
      } catch (err) {
        // token invalid → logout
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("refresh_token");

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));