import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePremiumStore } from "../../../store/premiumStore";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/RootNavigator";

const PERKS = [
  {
    icon: "🎵",
    title: "Unlimited Playlists",
    desc: "Create and manage as many playlists as you want (free users: 3 max).",
  },
  {
    icon: "✏️",
    title: "Music Playlist Editor",
    desc: "Full drag-to-reorder editor, add tracks from Deezer, manage covers.",
  },
  {
    icon: "👥",
    title: "Real-time Collaboration",
    desc: "Invite friends to co-edit any playlist simultaneously.",
  },
  {
    icon: "⚡",
    title: "Priority Support",
    desc: "Get faster responses from the Music Room team.",
  },
  {
    icon: "🎛️",
    title: "Advanced Controls",
    desc: "Unlock playback delegation and advanced room controls.",
  },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PremiumGateScreen() {
  const navigation = useNavigation<Nav>();
  const { activatePremium } = usePremiumStore();
  const [loading, setLoading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await activatePremium();
      setUpgraded(true);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.heroTitle}>Music Room Premium</Text>
        <Text style={styles.heroSub}>
          Unlock the full experience — unlimited playlists, real-time collaboration and more.
        </Text>
      </View>

      {/* Perks */}
      <View style={styles.perksCard}>
        {PERKS.map((perk, i) => (
          <View key={i} style={[styles.perkRow, i > 0 && styles.perkBorder]}>
            <Text style={styles.perkIcon}>{perk.icon}</Text>
            <View style={styles.perkText}>
              <Text style={styles.perkTitle}>{perk.title}</Text>
              <Text style={styles.perkDesc}>{perk.desc}</Text>
            </View>
            <Text style={styles.check}>✓</Text>
          </View>
        ))}
      </View>

      {/* Success banner */}
      {upgraded && (
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>🎉</Text>
          <View style={styles.successText}>
            <Text style={styles.successTitle}>You're now Premium!</Text>
            <Text style={styles.successSub}>Your account has been upgraded successfully.</Text>
          </View>
        </View>
      )}

      {/* CTA */}
      {upgraded ? (
        <TouchableOpacity
          style={styles.goBtn}
          onPress={() => (navigation as any).replace("PlaylistList")}
          activeOpacity={0.85}
        >
          <Text style={styles.goTxt}>Go to My Playlists →</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={handleUpgrade}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#1A1028" />
          ) : (
            <Text style={styles.upgradeTxt}>Upgrade to Premium — Free</Text>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.disclaimer}>
        No payment required for this demo. In production, a payment flow would be triggered here.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0E0A1A" },
  content: { padding: 20, paddingBottom: 60 },
  back: { marginBottom: 24 },
  backText: { color: "#9956F5", fontSize: 15, fontWeight: "600" },

  hero: { alignItems: "center", marginBottom: 32 },
  crown: { fontSize: 64, marginBottom: 12 },
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  heroSub: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  perksCard: {
    backgroundColor: "#1B1328",
    borderRadius: 18,
    padding: 4,
    marginBottom: 28,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  perkBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  perkIcon: { fontSize: 22, marginTop: 2 },
  perkText: { flex: 1 },
  perkTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  perkDesc: { color: "#888", fontSize: 12, marginTop: 3, lineHeight: 17 },
  check: { color: "#FFD700", fontSize: 18, fontWeight: "700", marginTop: 2 },

  upgradeBtn: {
    backgroundColor: "#FFD700",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  upgradeTxt: { color: "#1A1028", fontWeight: "800", fontSize: 16 },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2E1A",
    borderWidth: 1,
    borderColor: "#2E7D32",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  successIcon: { fontSize: 28 },
  successText: { flex: 1 },
  successTitle: { color: "#66BB6A", fontSize: 16, fontWeight: "800" },
  successSub: { color: "#A5D6A7", fontSize: 12, marginTop: 3 },

  goBtn: {
    backgroundColor: "#9956F5",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  goTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },

  disclaimer: {
    color: "#555",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
