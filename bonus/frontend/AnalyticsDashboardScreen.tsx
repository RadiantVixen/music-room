import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api/client";

interface Analytics {
  total_songs_added: number;
  total_rooms_created: number;
  total_rooms_joined: number;
  total_playlists_created: number;
  total_login_count: number;
  last_active: string;
}

interface StatCard {
  icon: string;
  label: string;
  value: number;
  color: string;
}

export default function AnalyticsDashboardScreen() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/bonus/analytics/");
      if (response.data && response.data.length > 0) {
        setAnalytics(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      Alert.alert("Error", "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const statCards: StatCard[] = analytics
    ? [
        {
          icon: "musical-notes",
          label: "Songs Added",
          value: analytics.total_songs_added,
          color: "#9956F5",
        },
        {
          icon: "door-open",
          label: "Rooms Created",
          value: analytics.total_rooms_created,
          color: "#FF6B9D",
        },
        {
          icon: "people",
          label: "Rooms Joined",
          value: analytics.total_rooms_joined,
          color: "#00D4FF",
        },
        {
          icon: "list",
          label: "Playlists",
          value: analytics.total_playlists_created,
          color: "#FFB800",
        },
      ]
    : [];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#9956F5" />
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No analytics data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Your Music Room Activity</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View
              style={[
                styles.iconBackground,
                { backgroundColor: `${stat.color}20` },
              ]}
            >
              <Ionicons name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Activity Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Activity Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Logins</Text>
            <Text style={styles.summaryValue}>
              {analytics.total_login_count}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Last Active</Text>
            <Text style={styles.summaryValue}>
              {new Date(analytics.last_active).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Contributions</Text>
            <Text style={styles.summaryValue}>
              {analytics.total_songs_added +
                analytics.total_rooms_created +
                analytics.total_playlists_created}
            </Text>
          </View>
        </View>
      </View>

      {/* Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Insights</Text>

        <View style={styles.insightCard}>
          <Ionicons name="bulb" size={20} color="#FFB800" />
          <Text style={styles.insightText}>
            You've been most active adding songs! Keep sharing your favorite
            tracks.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Ionicons name="trophy" size={20} color="#FF6B9D" />
          <Text style={styles.insightText}>
            You've created {analytics.total_rooms_created} rooms. You're a
            community builder!
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1625",
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#231A2E",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2338",
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: "#231A2E",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2338",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2338",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9956F5",
  },
  insightsSection: {
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: "row",
    backgroundColor: "#231A2E",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#2A2338",
  },
  insightText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: "#D1D5DB",
    lineHeight: 18,
  },
  errorText: {
    color: "#FF6B9D",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
