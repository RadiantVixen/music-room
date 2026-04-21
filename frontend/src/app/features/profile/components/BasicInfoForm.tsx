import { View, Text, TextInput, StyleSheet } from "react-native";

type Props = {
  name: string;
  username: string;
  bio: string;
  email?: string;
  setName: (value: string) => void;
  setUsername: (value: string) => void;
  setBio: (value: string) => void;
  setEmail?: (value: string) => void;
};

export default function BasicInfoForm({
  name,
  username,
  bio,
  email,
  setName,
  setUsername,
  setBio,
  setEmail,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.section}>BASIC INFO</Text>

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

      {/* add email field */}
      {setEmail && (
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#777"
            keyboardType="email-address"
          />
        </View>
      )}

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
  );
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