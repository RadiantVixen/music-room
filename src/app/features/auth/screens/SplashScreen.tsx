import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SplashScreen({ navigation }: any) {
  return (
    <View style={styles.container}>

      {/* Record */}
      <View style={styles.record}>

        <View style={styles.ring1} />
        <View style={styles.ring2} />
        <View style={styles.ring3} />

        {/* Center icon */}
        <View style={styles.center}>
          <Ionicons name="musical-notes" size={60} color="#9956F5" />
        </View>

      </View>

      {/* Title */}
      <Text style={styles.title}>Music Room</Text>

      <Text style={styles.subtitle}>
        Premium, immersive sound experiences
      </Text>

      {/* Buttons */}
      <View style={styles.buttons}>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.primaryText}>Let's Go</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("JoinRoom")}
        >
          <Text style={styles.secondaryText}>Join a Room</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#181022",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  record: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,

    borderWidth: 3,
    borderColor: "rgba(153,86,245,0.15)",

    shadowColor: "#9956F5",
    shadowOpacity: 0.35,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },

    elevation: 25,
  },

  ring1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  ring2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  ring3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  center: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(153,86,245,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 50,
  },

  buttons: {
    width: "100%",
    gap: 16,
  },

  primaryButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9956F5",

    shadowColor: "#9956F5",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },

  primaryText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },

  secondaryText: {
    color: "#9956F5",
    fontSize: 16,
    fontWeight: "600",
  },

});