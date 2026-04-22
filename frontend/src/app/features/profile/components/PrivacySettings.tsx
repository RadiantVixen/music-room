import { View, Text, StyleSheet, Switch } from "react-native"
import { useState } from "react"

export default function PrivacySettings() {
  const [publicProfile, setPublicProfile] = useState(true)
  const [listeningActivity, setListeningActivity] = useState(true)
  const [friendsOnly, setFriendsOnly] = useState(false)

  return (
    <View style={styles.container}>
      <Text style={styles.section}>PRIVACY</Text>

      <SettingRow
        title="Public Profile"
        subtitle="Allow anyone to see your playlists"
        value={publicProfile}
        onChange={setPublicProfile}
      />

      <SettingRow
        title="Show Listening Activity"
        subtitle="Friends can see what you're playing"
        value={listeningActivity}
        onChange={setListeningActivity}
      />

      <SettingRow
        title="Friends-only Info"
        subtitle="Only friends see your favorite tracks"
        value={friendsOnly}
        onChange={setFriendsOnly}
      />
    </View>
  )
}

function SettingRow({ title, subtitle, value, onChange }: any) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: "#9956f5" }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 30,
  },

  section: {
    color: "#777",
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 16,
  },

  row: {
    backgroundColor: "#1a1328",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontWeight: "600",
  },

  subtitle: {
    color: "#888",
    fontSize: 12,
  },
})