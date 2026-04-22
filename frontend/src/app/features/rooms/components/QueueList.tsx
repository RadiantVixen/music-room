import { View, Text, StyleSheet } from "react-native"

export default function QueueList() {
  return (
    <View style={styles.container}>

      <Text style={styles.item}>Genesis — Justice (+24)</Text>
      <Text style={styles.item}>After Dark — Mr.Kitty (+12)</Text>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  item: {
    color: "#fff",
    marginBottom: 10,
  },
})