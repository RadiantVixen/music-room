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
  console.log("Attempting login with payload:", payload);
  const response = await api.post("/token/", payload);
  console.log("Login response:", response.data);
  return response.data;
};

export const getMeRequest = async () => {
  const response = await api.get("/me/");
  return response.data;
};

export const updateMeRequest = async (data: any) => {
  const response = await api.patch("/me/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

export const changePasswordRequest = async (data: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}) => {
  const response = await api.post("/change-password/", data);
  return response.data;
};

export const forgotPasswordRequest = async (email: string) => {
  const response = await api.post("/forgot-password/", { email });
  return response.data;
};

export const verifyResetCodeRequest = async (email: string, code: string) => {
  const response = await api.post("/verify-reset-code/", { email, code });
  return response.data;
};

export const resetPasswordRequest = async (
  reset_token: string,
  password: string,
  confirm_password: string
) => {
  const response = await api.post("/reset-password/", {
    reset_token,
    password,
    confirm_password,
  });
  return response.data;
};

export const socialLoginRequest = async (
  provider: "google" | "facebook",
  token: string
) => {
  const response = await api.post("/oauth/", {
    provider,
    token,
  });
  return response.data;
};