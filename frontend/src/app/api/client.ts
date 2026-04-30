import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Alert} from "react-native"

const apiBaseURL = "http://localhost:8000/api";

export const api = axios.create({
  baseURL: apiBaseURL,
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
      Alert.alert("error", "Too many requests. Please slow down and try again later.");
      
    }
    return Promise.reject(error);
  }
);
