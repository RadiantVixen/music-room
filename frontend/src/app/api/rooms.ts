import { api } from "./client";

export const getRoomsRequest = async (params?: { type?: string }) => {
  const { data } = await api.get("/rooms/", { params });
  return data;
};

export const getMyRoomsRequest = async (params?: { type?: string }) => {
  const { data } = await api.get("/rooms/mine/", { params });
  return data;
};

export const getRoomDetailsRequest = async (roomId: number | string) => {
  const { data } = await api.get(`/rooms/${roomId}/`);
  return data;
};

export const createRoomRequest = async (payload: any) => {
  const { data } = await api.post("/rooms/", payload);
  return data;
};

export const updateRoomRequest = async (
  roomId: number | string,
  payload: any,
) => {
  const { data } = await api.patch(`/rooms/${roomId}/`, payload);
  return data;
};

export const deleteRoomRequest = async (roomId: number | string) => {
  await api.delete(`/rooms/${roomId}/`);
};

export const getRoomMembersRequest = async (roomId: number | string) => {
  const { data } = await api.get(`/rooms/${roomId}/members/`);
  return data;
};

export const inviteToRoomRequest = async (
  roomId: number | string,
  userId: number,
) => {
  const { data } = await api.post(`/rooms/${roomId}/invite/`, {
    user_id: userId,
  });
  return data;
};

export const respondToRoomInvitationRequest = async (
  roomId: number | string,
  action: "accept" | "decline",
) => {
  const { data } = await api.patch(`/rooms/${roomId}/invitation/`, {
    action,
  });
  return data;
};

export const leaveRoomRequest = async (roomId: number | string) => {
  await api.delete(`/rooms/${roomId}/leave/`);
};

export const getMyInvitationsRequest = async () => {
  const { data } = await api.get("/rooms/invitations/");
  return data;
};

export const getRoomTracksRequest = async (roomId: number | string) => {
  const { data } = await api.get(`/events/${roomId}/tracks/`);
  return data;
};

export const voteTrackRequest = async (
  roomId: number | string,
  trackId: number | string,
  payload?: { lat?: number; lon?: number },
) => {
  const { data } = await api.post(
    `/events/${roomId}/tracks/${trackId}/vote/`,
    payload || {},
  );
  return data;
};

export const suggestTrackRequest = async (
  roomId: number | string,
  payload: {
    deezerId: string;
    title: string;
    artist: string;
    album?: string;
    albumArt?: string;
    duration?: number;
    audioUrl?: string;
    lat?: number;
    lon?: number;
  },
) => {
  const { data } = await api.post(`/events/${roomId}/tracks/`, payload);
  return data;
};

export const deleteTrackRequest = async (
  roomId: number | string,
  trackId: number | string,
) => {
  await api.delete(`/events/${roomId}/tracks/${trackId}/`);
};

export const searchTracksRequest = async (query: string) => {
  const { data } = await api.get("/tracks/search/", {
    params: { q: query },
  });
  return data;
};
