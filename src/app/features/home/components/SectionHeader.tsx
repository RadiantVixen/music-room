import { View, Text, StyleSheet, TouchableOpacity } from "react-native"

export default function SectionHeader({ title, action }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {action && (
        <TouchableOpacity>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },

  action: {
    color: "#4ADE80",
    fontWeight: "600",
  },
})