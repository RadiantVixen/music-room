import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showToast } from "../utils/toast";

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Handle Rate Limiting (429 Too Many Requests)
    if (error.response && error.response.status === 429) {
      showToast("Too many requests. Please slow down and try again later.", "error");
    }
    return Promise.reject(error);
  }
);
