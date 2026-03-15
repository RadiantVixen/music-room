import { View, Text, TextInput, StyleSheet } from "react-native"
import { useState } from "react"

export default function BasicInfoForm() {
  const [name, setName] = useState("Alexa Henderson")
  const [username, setUsername] = useState("alexa_beats")
  const [bio, setBio] = useState(
    "Curating the finest underground house tracks. Always looking for new BPMs."
  )

  return (
    <View style={styles.container}>
      <Text style={styles.section}>BASIC INFO</Text>

      {/* Full Name */}
      <View style={styles.field}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#777"
        />
      </View>

      {/* Username */}
      <View style={styles.field}>
        <Text style={styles.label}>Username</Text>

        <View style={styles.usernameWrapper}>
          <Text style={styles.at}>@</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            style={styles.usernameInput}
            placeholder="username"
            placeholderTextColor="#777"
          />
        </View>
      </View>

      {/* Bio */}
      <View style={styles.field}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          style={styles.textarea}
          multiline
          numberOfLines={4}
        />
      </View>
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

  field: {
    marginBottom: 18,
  },

  label: {
    color: "#bbb",
    marginBottom: 6,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#1a1328",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a1f40",
  },

  usernameWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1328",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a1f40",
    paddingHorizontal: 12,
  },

  at: {
    color: "#9956f5",
    fontWeight: "700",
    marginRight: 4,
  },

  usernameInput: {
    flex: 1,
    height: 48,
    color: "#fff",
  },

  textarea: {
    backgroundColor: "#1a1328",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a1f40",
    padding: 14,
    color: "#fff",
    minHeight: 100,
    textAlignVertical: "top",
  },
})