import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  signupRequest,
  loginRequest,
  getMeRequest,
  SignupPayload,
  LoginPayload,
  forgotPasswordRequest,
  verifyResetCodeRequest,
  resetPasswordRequest,
  socialLoginRequest,
  updateMeRequest,
  changePasswordRequest,
  updateMusicPreferencesRequest,
  activatePremiumRequest,
  deactivatePremiumRequest,
} from "../api/auth";

type User = {
  id: number;
  username: string;
  first_name: string;
  email: string;
  role?: string;
  profile?: {
    avatar: string | null;
    bio: string;
    location: string;
    provider: string | null;
    phone: string | null;
    phone_verified: boolean;
    is_premium?: boolean;
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
};
type UpdateProfilePayload = {
  first_name?: string;
  username?: string;
  [key: string]: any; // 👈 allows "profile.bio"
};
type AuthState = {
  changePassword: any;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBootstrapping: boolean;

  signup: (payload: SignupPayload) => Promise<any>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setUser: (user: User | null) => void;

  updateMusicPreferences: (data: {
    favorite_genres: string[];
  }) => Promise<void>;

  updateMe: (data: UpdateProfilePayload) => Promise<User>;
  refreshMe: () => Promise<User>;
  forgotPassword: (email: string) => Promise<any>;
  verifyResetCode: (email: string, code: string) => Promise<any>;
  resetPassword: (
    reset_token: string,
    password: string,
    confirm_password: string
  ) => Promise<any>;
  socialLogin: (provider: "google" | "facebook", token: string) => Promise<any>;
  activatePremium: () => Promise<void>;
  deactivatePremium: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isBootstrapping: true,
  setUser: (user) => set({ user }),

  signup: async (payload) => {
    set({ isLoading: true });
    try {
      const response = await signupRequest(payload);

      const user = response?.data?.user;
      const accessToken = response?.data?.access;
      const refreshToken = response?.data?.refresh;

      if (!user || !accessToken || !refreshToken) {
        throw new Error("Invalid signup response.");
      }

      await AsyncStorage.setItem("access_token", accessToken);
      await AsyncStorage.setItem("refresh_token", refreshToken);

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      });

      return response;
    } catch (error) {
      console.log("Signup error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  login: async (payload) => {
    set({ isLoading: true });
    try {
      const data = await loginRequest(payload);

      const accessToken = data.access;
      const refreshToken = data.refresh;

      await AsyncStorage.setItem("access_token", accessToken);
      await AsyncStorage.setItem("refresh_token", refreshToken);

      const user = await getMeRequest();

      set({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: true,
      });
    } catch (error) {
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
    set({ isBootstrapping: true });

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

      set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
      });

      try {
        const user = await getMeRequest();
        set({ user });
      } catch {
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
      set({ isBootstrapping: false });
    }
  },

  updateMe: async (data) => {
    set({ isLoading: true });

    try {
      const updatedUser = await updateMeRequest(data);

      set({ user: updatedUser }); // 🔥 update global state

      return updatedUser;
    } finally {
      set({ isLoading: false });
    }
  },
  refreshMe: async () => {
    try {
      const user = await getMeRequest();
      set({ user });
      return user;
    } catch (error) {
      console.log("refreshMe error:", error);
      throw error;
    }
  },

  changePassword: async (data: Parameters<typeof changePasswordRequest>[0]) => {
    set({ isLoading: true });

    try {
      const res = await changePasswordRequest(data);

      // 🔥 optional: force logout if backend says relogin_required
      if (res?.data?.relogin_required) {
        set({ user: null, accessToken: null });
      }

      return res;
    } finally {
      set({ isLoading: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true });
    try {
      return await forgotPasswordRequest(email);
    } finally {
      set({ isLoading: false });
    }
  },

  verifyResetCode: async (email, code) => {
    set({ isLoading: true });
    try {
      return await verifyResetCodeRequest(email, code);
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (reset_token, password, confirm_password) => {
    set({ isLoading: true });
    try {
      return await resetPasswordRequest(reset_token, password, confirm_password);
    } finally {
      set({ isLoading: false });
    }
  },

  socialLogin: async (provider, token) => {
    set({ isLoading: true });
    try {
      const response = await socialLoginRequest(provider, token);
      console.log("Social login backend response:", response);

      const user = response?.data?.user;
      const accessToken = response?.data?.access;
      const refreshToken = response?.data?.refresh;

      if (!user || !accessToken || !refreshToken) {
        console.error("Missing fields in response:", { user, accessToken, refreshToken });
        throw new Error("Invalid OAuth response.");
      }

      await AsyncStorage.setItem("access_token", accessToken);
      await AsyncStorage.setItem("refresh_token", refreshToken);

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      });

      return response;
    } catch (error) {
      console.log("Social login error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  updateMusicPreferences: async (data) => {
    set({ isLoading: true });

    try {
      await updateMusicPreferencesRequest(data);

      // 🔥 refresh user after update
      const user = await getMeRequest();
      set({ user });
    } finally {
      set({ isLoading: false });
    }
  },
  activatePremium: async () => {
    set({ isLoading: true });
    try {
      await activatePremiumRequest();
      const user = await getMeRequest();
      set({ user });
    } finally {
      set({ isLoading: false });
    }
  },
  deactivatePremium: async () => {
    set({ isLoading: true });
    try {
      await deactivatePremiumRequest();
      const user = await getMeRequest();
      set({ user });
    } finally {
      set({ isLoading: false });
    }
  },
}));