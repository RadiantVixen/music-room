import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AppLayout from "../../../components/layout/AppLayout";
import MusicHeader from "../components/ScreenHeader";

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function TrackDetailsScreen() {
  const route = useRoute<any>();
  const track = route.params?.track;

  const handleOpenExternal = async () => {
    if (!track?.deezerUrl) return;
    await Linking.openURL(track.deezerUrl);
  };

  if (!track) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="musical-notes-outline" size={28} color="#9956F5" />
        </View>
        <Text style={styles.emptyTitle}>Track not found</Text>
        <Text style={styles.emptyText}>
          We could not load the track details
        </Text>
      </View>
    );
  }

  return (
    <AppLayout
      header={
        <MusicHeader
          title={track?.title || "Track"}
          subtitle={track?.artist || "TRACK DETAILS"}
        />
      }
      showNavbar={false}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.hero}>
          <Image
            source={{
              uri: track.albumArt || "https://via.placeholder.com/300",
            }}
            style={styles.cover}
          />

          <Text style={styles.title}>{track.title}</Text>
          <Text style={styles.artist}>{track.artist}</Text>
          {!!track.album && <Text style={styles.albumTop}>{track.album}</Text>}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Track Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Album</Text>
            <Text style={styles.value}>{track.album || "-"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{formatDuration(track.duration)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Deezer ID</Text>
            <Text style={styles.value}>{track.deezerId || "-"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Preview</Text>
            <Text
              style={[
                styles.value,
                track.audioUrl ? styles.available : styles.unavailable,
              ]}
            >
              {track.audioUrl ? "Available" : "Not available"}
            </Text>
          </View>
        </View>

        {!!track.deezerUrl && (
          <TouchableOpacity style={styles.button} onPress={handleOpenExternal}>
            <Ionicons
              name="open-outline"
              size={18}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Open on Deezer</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    backgroundColor: "#0F0B16",
  },

  hero: {
    alignItems: "center",
    marginBottom: 24,
  },

  cover: {
    width: 250,
    height: 250,
    borderRadius: 26,
    backgroundColor: "#1B1328",
    marginBottom: 20,
  },

  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },

  artist: {
    color: "#C7C2D6",
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },

  albumTop: {
    color: "#8D86A5",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },

  infoCard: {
    backgroundColor: "#171021",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#241A36",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },

  infoRow: {
    paddingVertical: 6,
  },

  label: {
    color: "#8D86A5",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    fontWeight: "700",
  },

  value: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  available: {
    color: "#9BE7B1",
  },

  unavailable: {
    color: "#FF9B9B",
  },

  divider: {
    height: 1,
    backgroundColor: "#241A36",
    marginVertical: 10,
  },

  button: {
    marginTop: 22,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#9956F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonIcon: {
    marginRight: 8,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: "#0F0B16",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1B1328",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A1F40",
  },

  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  emptyText: {
    color: "#8D86A5",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
});