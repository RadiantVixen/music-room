import { View, Text, Image, StyleSheet } from "react-native"

export default function NowPlayingCard({ track }: any) {
  if (!track) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No track playing</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      
      <Image
        source={{ uri: track.albumArt }}
        style={styles.image}
      />

      <Text style={styles.title}>{track.title}</Text>
      <Text style={styles.artist}>{track.artist}</Text>

    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 20,
  },
  image: {
    width: 260,
    height: 260,
    borderRadius: 20,
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  artist: {
    color: "#9956F5",
    marginTop: 4,
  },
})