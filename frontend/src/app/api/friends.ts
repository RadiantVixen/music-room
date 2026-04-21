import { api } from "./client";

export const getFriendsRequest = async () => {
  const response = await api.get("/friends/");
  return response.data;
};

export const getPendingFriendRequestsRequest = async () => {
  const response = await api.get("/friends/requests/pending/");
  return response.data;
};

export const getSentFriendRequestsRequest = async () => {
  const response = await api.get("/friends/requests/sent/");
  return response.data;
};

export const removeFriendRequest = async (userId: number) => {
  const response = await api.delete(`/friends/${userId}/`);
  return response.data;
};

export const searchUsersRequest = async (query: string) => {
  const response = await api.get(`/users/search/?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const sendFriendRequestRequest = async (receiverId: number) => {
  const response = await api.post("/friends/request/", {
    receiver_id: receiverId,
  });
  return response.data;
};

export const respondToFriendRequestRequest = async (
  requestId: number,
  action: "accept" | "decline" | "block"
) => {
  const response = await api.patch(`/friends/request/${requestId}/`, {
    action,
  });
  return response.data;
};

export const getFriendProfileRequest = async (userId: number) => {
  const { data } = await api.get(`/friends/profile/${userId}/`);
  return data;
};

export const blockUserRequest = async (userId: number) => {
  const { data } = await api.post(`/friends/block/${userId}/`);
  return data;
};