import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../../store/authStore";
import { useAppNavigation } from "../../../hooks/useAppNavigation";


export default function ProfileSettings() {
  const logout = useAuthStore((state) => state.logout);
  const navigation = useAppNavigation();
  const isPremium = useAuthStore((state) => state.user?.profile?.is_premium);
  const activatePremium = useAuthStore((state) => state.activatePremium);
  const deactivatePremium = useAuthStore((state) => state.deactivatePremium);

  const handleLogout = async () => {
    await logout();

    // Reset navigation stack after logout
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" as never }],
    });
  };

  const handlePremiumToggle = async () => {
    try {
      if (isPremium) {
        await deactivatePremium();
        Alert.alert("Success", "Premium deactivated.");
      } else {
        await activatePremium();
        Alert.alert("Success", "Welcome to Premium!");
        
      }
    } catch (error) {
        Alert.alert("error", "Action failed.");
      
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>ACCOUNT</Text>

      <View style={styles.card}>
        <SettingItem
          icon="star-outline"
          title={isPremium ? "Deactivate Premium" : "Activate Premium"}
          subtitle={isPremium ? "Status: ACTIVE" : "Get exclusive features"}
          onPress={handlePremiumToggle}
        />

        <Divider />

        <SettingItem
          icon="person-outline"
          title="Personal Info"
          subtitle="Email, name, birthday"
          onPress={() => navigation.navigate("EditProfile")}
        />

        <Divider />

        <SettingItem
          icon="shield-checkmark-outline"
          title="Security"
          subtitle="Password, 2FA, devices"
          onPress={() => navigation.navigate("ChangePassword" as never)}
        />

        <Divider />

        <SettingItem
          icon="people-outline"
          title="Friends"
          subtitle="Add, block, manage"
          onPress={() => navigation.navigate("FriendsList" as never)}
        />
      </View>

      <Text style={styles.sectionTitle}>MUSIC SETTINGS</Text>

      <View style={styles.card}>
        <SettingItem
          icon="musical-notes-outline"
          title="Audio Quality"
          subtitle="Streaming and downloads"
        />

        <Divider />

        <SettingItem
          icon="link-outline"
          title="Connected Services"
          subtitle="Spotify, Apple Music"
        />
      </View>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ff5a5f" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 2.4.0 (Build 823)</Text>
    </View>
  );
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} disabled={!onPress}>
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={18} color="#9956f5" />
        </View>

        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#888" />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 30,
  },

  sectionTitle: {
    color: "#7c3aed",
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 2,
  },

  card: {
    backgroundColor: "#14121c",
    borderRadius: 20,
    paddingVertical: 6,
    marginBottom: 30,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#201a2e",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#fff",
    fontWeight: "600",
  },

  subtitle: {
    color: "#8a8a8a",
    fontSize: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#222",
    marginHorizontal: 16,
  },

  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a0f14",
    padding: 16,
    borderRadius: 30,
    gap: 10,
  },

  logoutText: {
    color: "#ff5a5f",
    fontWeight: "700",
  },

  version: {
    textAlign: "center",
    marginTop: 16,
    color: "#666",
    fontSize: 12,
  },
});
