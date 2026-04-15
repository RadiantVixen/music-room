import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  avatar?: string | null;
  name?: string;
  username?: string;
  bio?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
};

export default function ProfileHeader({
  avatar,
  name,
  username,
  bio,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
}: Props) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: avatar || "https://i.pravatar.cc/200" }}
        style={styles.avatar}
      />

      <Text style={styles.name}>{name || "Unknown User"}</Text>
      <Text style={styles.username}>@{username}</Text>
      <Text style={styles.bio}>{bio || "No bio yet."}</Text>

      {(primaryButtonText || secondaryButtonText) && (
        <View style={styles.buttons}>
          {secondaryButtonText ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondaryPress}>
              <Text style={styles.secondaryText}>{secondaryButtonText}</Text>
            </TouchableOpacity>
          ) : null}

          {primaryButtonText ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={onPrimaryPress}>
              <Text style={styles.primaryText}>{primaryButtonText}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 24,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#9956f5",
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 12,
    color: "white",
  },

  username: {
    color: "#9956f5",
    marginTop: 4,
  },

  bio: {
    color: "#777",
    marginTop: 12,
    textAlign: "center",
  },

  buttons: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },

  primaryBtn: {
    backgroundColor: "#9956f5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  secondaryBtn: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  primaryText: {
    color: "white",
    fontWeight: "600",
  },

  secondaryText: {
    color: "white",
  },
});