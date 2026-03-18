import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppNavigation } from "../../../hooks/useAppNavigation";
import { liveRooms } from "../../home/data/mockRooms";
import { SafeAreaView } from "react-native-safe-area-context";
import FeaturedRoomCard from "../../home/components/FeaturedRoomCard";
import App from "../../../../../App";
import AppLayout from "../../../components/layout/AppLayout";
import RoomsListHeader from "../components/RoomsListHeader";

export default function JoinRoomScreen() {
  const navigation = useAppNavigation();

  const handleJoin = (room: any) => {
    navigation.navigate("Room", { roomId: room.id })
  };

  return (
    <AppLayout header={<RoomsListHeader />}>

      <View style={styles.container}>
        {/* Rooms list */}
        <FlatList
          data={liveRooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FeaturedRoomCard
              room={item}
              onPress={() => handleJoin(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />

      </View>

    </AppLayout>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181022",
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
  },

  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  roomCard: {
    backgroundColor: "#1B1328",
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  roomInfo: {
    gap: 4,
  },

  roomName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  roomMeta: {
    color: "#888",
    fontSize: 13,
  },
});