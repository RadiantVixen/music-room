import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
export default function FriendCard({
  friend,
  onPress,
  onRemove,
  onAdd,
  isAdded,
}: any) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
      <Image
        source={{
          uri:
            friend.avatar ||
            friend.profile?.avatar ||
            "https://i.pravatar.cc/150?img=12",
        }}
        style={styles.avatar}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>
          {friend.first_name || friend.username}
        </Text>
        <Text style={styles.username}>@{friend.username}</Text>
      </View>

      {/* 🔥 ADD BUTTON */}
      {onAdd ? (
        <TouchableOpacity
          style={[styles.addBtn, isAdded && styles.addedBtn]}
          onPress={onAdd}
          disabled={isAdded}
        >
          <Text style={styles.addText}>
            {isAdded ? "Added" : "+ Add"}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* REMOVE BUTTON */}
      {onRemove ? (
        <TouchableOpacity onPress={onRemove}>
          <Ionicons name="person-remove-outline" size={20} color="#ff5c5c" />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14121c",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#222",
  },

  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  username: {
    color: "#8a8a8a",
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: "#9956F5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  addedBtn: {
    backgroundColor: "#2A1F40",
  },

  addText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});