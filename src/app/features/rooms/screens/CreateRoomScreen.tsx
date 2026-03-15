import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAppNavigation } from "../../../hooks/useAppNavigation";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateRoomScreen() {
  const navigation = useAppNavigation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const handleCreate = () => {
    // call backend later
    navigation.navigate("CreateRoom");
  };
  const [votingPermission, setVotingPermission] = useState<
    "everyone" | "invited" | "location"
  >("everyone");

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const musicGenres = [
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

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : prev.length < 3
        ? [...prev, genre]
        : prev
    );
  };

  const [allowSuggestions, setAllowSuggestions] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>Create Room</Text>

          <View style={{ width: 22 }} />
        </View>

        {/* Cover */}
        <TouchableOpacity style={styles.cover}>
          <Ionicons name="camera-outline" size={28} color="#aaa" />
        </TouchableOpacity>

        {/* Room name */}
        <Text style={styles.label}>Room Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Friday Night Vibes"
          placeholderTextColor="#777"
          value={name}
          onChangeText={setName}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe your room"
          placeholderTextColor="#777"
          value={description}
          onChangeText={setDescription}
        />

        {/* Visibility */}
        <Text style={styles.label}>Visibility</Text>

        <View style={styles.visibilityRow}>
          <TouchableOpacity
            style={[
              styles.visibilityCard,
              visibility === "public" && styles.activeCard,
            ]}
            onPress={() => setVisibility("public")}
          >
            <Ionicons name="globe-outline" size={22} color="#fff" />
            <Text style={styles.cardText}>Public</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.visibilityCard,
              visibility === "private" && styles.activeCard,
            ]}
            onPress={() => setVisibility("private")}
          >
            <Ionicons name="lock-closed-outline" size={22} color="#fff" />
            <Text style={styles.cardText}>Private</Text>
          </TouchableOpacity>
        </View>

        

        <Text style={styles.sectionTitle}>Who can vote?</Text>

          {[
            {
              id: "everyone",
              label: "Everyone",
              description: "Anyone can vote for tracks",
              icon: "globe-outline",
            },
            {
              id: "invited",
              label: "Invited Only",
              description: "Only invited users can vote",
              icon: "people-outline",
            },
            {
              id: "location",
              label: "Location Based",
              description: "Users at the event location",
              icon: "location-outline",
            },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.voteCard,
                votingPermission === option.id && styles.voteCardActive,
              ]}
              onPress={() => setVotingPermission(option.id as any)}
            >
              <View style={styles.voteIcon}>
                <Ionicons name={option.icon as any} size={22} color="#fff" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.voteTitle}>{option.label}</Text>
                <Text style={styles.voteDesc}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        <Text style={styles.sectionTitle}>
          Music Genre (select up to 3)
        </Text>

        <View style={styles.genreContainer}>
          {musicGenres.map((genre) => {
            const selected = selectedGenres.includes(genre);

            return (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genreChip,
                  selected && styles.genreChipSelected,
                ]}
                onPress={() => toggleGenre(genre)}
              >
                <Text
                  style={[
                    styles.genreText,
                    selected && { color: "#fff" },
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.settingCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.voteTitle}>Allow track suggestions</Text>
            <Text style={styles.voteDesc}>
              Let participants suggest new tracks
            </Text>
          </View>

          <Switch
            value={allowSuggestions}
            onValueChange={setAllowSuggestions}
            trackColor={{ true: "#22c55e" }}
          />
        </View>
        <TouchableOpacity
          style={[styles.createBtn, !name && { opacity: 0.5 }]}
          disabled={!name}
          onPress={handleCreate}>
            <Text style={styles.createText}>Create Room</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Create Button */}
       
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0F0A18",
  },
  container: {
    flex: 1,
    backgroundColor: "#0F0A18",
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  cover: {
    height: 120,
    width: 120,
    borderRadius: 20,
    backgroundColor: "#1B1328",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },

  label: {
    color: "#FFFFFF",
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    backgroundColor: "#1B1328",
    padding: 14,
    borderRadius: 14,
    color: "#fff",
  },

  visibilityRow: {
    flexDirection: "row",
    gap: 12,
  },

  visibilityCard: {
    flex: 1,
    backgroundColor: "#1B1328",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    gap: 8,
  },

  activeCard: {
    borderWidth: 2,
    borderColor: "#9956F5",
  },

  cardText: {
    color: "#fff",
  },

  createBtn: {
    marginTop: 40,
    backgroundColor: "#9956F5",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  createText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  sectionTitle: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 10,
    marginTop: 25,
  },

  voteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1B1328",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },

  voteCardActive: {
    borderWidth: 2,
    borderColor: "#9956F5",
  },

  voteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A1F40",
    alignItems: "center",
    justifyContent: "center",
  },

  voteTitle: {
    color: "#fff",
    fontWeight: "600",
  },

  voteDesc: {
    color: "#888",
    fontSize: 13,
  },

  genreContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  genreChip: {
    backgroundColor: "#1B1328",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  genreChipSelected: {
    backgroundColor: "#9956F5",
  },

  genreText: {
    color: "#ccc",
  },

  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1B1328",
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
  },
});