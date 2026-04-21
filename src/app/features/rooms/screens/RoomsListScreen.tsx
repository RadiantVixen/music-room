import { View, Text, FlatList, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useAppNavigation } from "../../../hooks/useAppNavigation";
import FeaturedRoomCard from "../../home/components/FeaturedRoomCard";
import AppLayout from "../../../components/layout/AppLayout";
import RoomsListHeader from "../components/RoomsListHeader";
import { useRoomsStore } from "../../../store/roomsStore";

export default function JoinRoomScreen() {
  const navigation = useAppNavigation();
  const { rooms, fetchRooms, isLoading } = useRoomsStore();

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleJoin = (room: any) => {
    navigation.navigate("Room", { roomId: room.id });
  };

  return (
    <AppLayout header={<RoomsListHeader />}>
      <View style={styles.container}>
        {isLoading ? (
          <Text style={styles.empty}>Loading rooms...</Text>
        ) : rooms.length === 0 ? (
          <Text style={styles.empty}>No rooms available</Text>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <FeaturedRoomCard
                room={item}
                onPress={() => handleJoin(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}
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

  empty: {
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
});