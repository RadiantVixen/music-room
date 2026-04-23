import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoomsStore } from "../../../store/roomsStore";
import { useNavigation } from "@react-navigation/native";
import AppLayout from "../../../components/layout/AppLayout";
import MusicHeader from "../components/ScreenHeader";

export default function SearchTracksScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState("");

  const {
    searchTracks,
    searchResults,
    searchLoading,
    clearSearchResults,
  } = useRoomsStore();

  useEffect(() => {
    return () => {
      clearSearchResults();
    };
  }, [clearSearchResults]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchTracks(query);
      } else {
        clearSearchResults();
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, searchTracks, clearSearchResults]);

  const hasResults = searchResults?.length > 0;

  const resultLabel = useMemo(() => {
    if (!query.trim() || !hasResults) return "";
    return `${searchResults.length} result${searchResults.length > 1 ? "s" : ""}`;
  }, [query, hasResults, searchResults.length]);

  const handleOpenTrack = (track: any) => {
    navigation.navigate("TrackDetails", { track });
  };

  const renderEmptyState = () => {
    if (searchLoading) {
      return (
        <View style={styles.stateBox}>
          <ActivityIndicator size="small" color="#9956F5" />
          <Text style={styles.stateTitle}>Searching tracks...</Text>
          <Text style={styles.stateText}>Please wait a moment</Text>
        </View>
      );
    }

    if (!query.trim()) {
      return (
        <View style={styles.stateBox}>
          <View style={styles.stateIcon}>
            <Ionicons name="search-outline" size={28} color="#9956F5" />
          </View>
          <Text style={styles.stateTitle}>Search for music</Text>
          <Text style={styles.stateText}>
            Find songs by title, artist, or album
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.stateBox}>
        <View style={styles.stateIcon}>
          <Ionicons name="musical-notes-outline" size={28} color="#9956F5" />
        </View>
        <Text style={styles.stateTitle}>No tracks found</Text>
        <Text style={styles.stateText}>
          Try another song name or artist
        </Text>
      </View>
    );
  };

  return (
    <AppLayout
      header={<MusicHeader title="Search Tracks" subtitle="FIND MUSIC" />}
      showNavbar={false}
    >
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#8D86A5"
            style={styles.searchIcon}
          />

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by song or artist"
            placeholderTextColor="#8D86A5"
            style={styles.input}
          />

          {!!query.length && (
            <TouchableOpacity onPress={() => setQuery("")} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#8D86A5" />
            </TouchableOpacity>
          )}
        </View>

        {!!resultLabel && (
          <Text style={styles.resultCount}>{resultLabel}</Text>
        )}

        {!hasResults ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.deezerId}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.88}
                onPress={() => handleOpenTrack(item)}
              >
                <Image
                  source={{
                    uri: item.albumArt || "https://via.placeholder.com/100",
                  }}
                  style={styles.image}
                />

                <View style={styles.meta}>
                  <Text numberOfLines={1} style={styles.title}>
                    {item.title}
                  </Text>

                  <Text numberOfLines={1} style={styles.artist}>
                    {item.artist}
                  </Text>

                  {!!item.album && (
                    <Text numberOfLines={1} style={styles.album}>
                      {item.album}
                    </Text>
                  )}
                </View>

                <View style={styles.trailing}>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#6F6887"
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0B16",
    paddingTop: 8,
  },

  searchBox: {
    marginHorizontal: 16,
    marginBottom: 14,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#1B1328",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#2A1F40",
  },

  searchIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingVertical: 0,
  },

  clearBtn: {
    marginLeft: 8,
  },

  resultCount: {
    color: "#8D86A5",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 18,
    marginBottom: 10,
    letterSpacing: 0.3,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171021",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#241A36",
  },

  image: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: "#2A1F40",
  },

  meta: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  artist: {
    color: "#C5C1D1",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },

  album: {
    color: "#7E7891",
    fontSize: 12,
    marginTop: 4,
  },

  trailing: {
    width: 28,
    alignItems: "flex-end",
  },

  stateBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    marginTop: -40,
  },

  stateIcon: {
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

  stateTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },

  stateText: {
    color: "#8D86A5",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});