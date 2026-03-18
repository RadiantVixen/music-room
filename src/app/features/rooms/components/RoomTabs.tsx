import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { useState } from "react"

export default function RoomTabs() {
  const [active, setActive] = useState("queue")

  return (
    <View style={styles.container}>

      {["queue", "playlist", "chat"].map((tab) => (
        <TouchableOpacity key={tab} onPress={() => setActive(tab)}>
          <Text
            style={[
              styles.tab,
              active === tab && styles.active
            ]}
          >
            {tab.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2338",
    paddingBottom: 10,
  },
  tab: {
    color: "#888",
    fontWeight: "600",
  },
  active: {
    color: "#9956F5",
  },
})