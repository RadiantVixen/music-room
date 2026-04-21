import { useCallback } from "react";
import { api } from "../api/client";

/**
 * Hook for managing bonus features:
 * - Notifications
 * - Analytics
 * - Smart Playlists
 * - Recommendations
 */
export function useBonusFeatures() {
  /**
   * Log user activity for analytics
   */
  const logActivity = useCallback(
    async (activityType: "song_added" | "room_created" | "room_joined" | "playlist_created" | "login") => {
      try {
        await api.post("/bonus/analytics/log_activity/", {
          activity_type: activityType,
        });
      } catch (error) {
        console.error("Error logging activity:", error);
      }
    },
    []
  );

  /**
   * Log a song listen to listening history
   */
  const logSongListen = useCallback(
    async (
      songId: number,
      songTitle: string,
      artistName: string,
      genre?: string,
      durationListened?: number
    ) => {
      try {
        await api.post("/bonus/listening-history/", {
          song_id: songId,
          song_title: songTitle,
          artist_name: artistName,
          genre: genre || "Unknown",
          duration_listened: durationListened || 0,
        });
      } catch (error) {
        console.error("Error logging song listen:", error);
      }
    },
    []
  );

  /**
   * Get recommendations for user
   */
  const getRecommendations = useCallback(
    async (type: string = "similar_artists", limit: number = 10) => {
      try {
        const response = await api.post("/bonus/recommendations/get_recommendations/", {
          type,
          limit,
        });
        return response.data;
      } catch (error) {
        console.error("Error getting recommendations:", error);
        return { items: [], error: true };
      }
    },
    []
  );

  /**
   * Log recommendation feedback
   */
  const logRecommendationFeedback = useCallback(
    async (recommendationId: number, wasAccepted: boolean) => {
      try {
        await api.post("/bonus/recommendations/feedback/", {
          recommendation_id: recommendationId,
          was_accepted: wasAccepted,
        });
      } catch (error) {
        console.error("Error logging recommendation feedback:", error);
      }
    },
    []
  );

  return {
    logActivity,
    logSongListen,
    getRecommendations,
    logRecommendationFeedback,
  };
}
