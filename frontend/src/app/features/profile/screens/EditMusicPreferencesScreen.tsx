import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import AppLayout from "../../../components/layout/AppLayout";
import MusicHeader from "../../search/components/ScreenHeader";
import { useAuthStore } from "../../../store/authStore";
import { api } from "../../../api/client";
import { useAppNavigation } from "../../../hooks/useAppNavigation";

const GENRES = [
    "Pop",
    "Hip-Hop",
    "R&B",
    "Rock",
    "Electronic",
    "EDM",
    "Jazz",
    "Classical",
    "Country",
    "Indie",
    "Alternative",
    "Lo-Fi",
    "K-Pop",
    "Latin",
    "Reggaeton",
    "Soul",
    "Funk",
  ];
  
export default function EditMusicPreferencesScreen() {
  const navigation = useAppNavigation();
  const user = useAuthStore((s) => s.user);
  const updateMusicPreferences = useAuthStore(
    (s) => s.updateMusicPreferences
  );
  const refreshMe = useAuthStore((s) => s.refreshMe);

  const [selected, setSelected] = useState<string[]>(
    user?.music_preferences?.favorite_genres || []
  );

  const toggleGenre = (g: string) => {
    setSelected((prev) =>
      prev.includes(g)
        ? prev.filter((x) => x !== g)
        : [...prev, g]
    );
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateMusicPreferences({
        favorite_genres: selected,
      });

      await refreshMe();

      navigation.goBack();
    } catch (error) {
      console.log("Save preferences error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout
      header={<MusicHeader title="Music Preferences" subtitle="EDIT" />}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Select your favorite genres</Text>

        <View style={styles.chips}>
          {GENRES.map((g) => {
            const active = selected.includes(g);

            return (
              <TouchableOpacity
                key={g}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleGenre(g)}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        color: "#9CA3AF",
        marginBottom: 12,
    },
    chips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#2D2D2D",
    },
    chipActive: {
        backgroundColor: "#9956F5",
    },
    chipText: {
        color: "#9CA3AF",
    },
    chipTextActive: {
        color: "white",
    },
    saveBtn: {
        marginTop: 30,
        backgroundColor: "#9956F5",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    saveText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
});