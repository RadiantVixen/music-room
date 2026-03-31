import { api } from "./client";

export type SignupPayload = {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export const signupRequest = async (payload: SignupPayload) => {
  const response = await api.post("/signup/", payload);
  return response.data;
};

export const loginRequest = async (payload: LoginPayload) => {
  const response = await api.post("/login/", payload);
  return response.data;
};

export const getMeRequest = async () => {
  const response = await api.get("/me/");
  return response.data;
};