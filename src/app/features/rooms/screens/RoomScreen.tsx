import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useEffect } from "react";
import AppLayout from "../../../components/layout/AppLayout";
import RoomHeader from "../components/RoomHeader";
import { useAppRoute } from "../../../hooks/useAppRoute";
import { useRoomsStore } from "../../../store/roomsStore";
import VoteRoomScreen from "./VoteRoomScreen";
import DelegationRoomScreen from "./DelegationRoomScreen";

export default function RoomScreen() {
  const route = useAppRoute<"Room">();
  const { roomId } = route.params;
  const { width: windowWidth } = useWindowDimensions();

  const { selectedRoom, fetchRoomDetails, clearSelectedRoom, isLoading } =
    useRoomsStore();

  useEffect(() => {
    fetchRoomDetails(roomId);

    return () => {
      clearSelectedRoom();
    };
  }, [roomId, fetchRoomDetails, clearSelectedRoom]);

  const room = selectedRoom;

  return (
    <AppLayout
      header={<RoomHeader roomName={room?.name || "Room"} roomId={roomId} />}
      showNavbar={false}
    >
      <ScrollView
        showsVerticalScrollIndicator={windowWidth > 768}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {!room || isLoading ? null : room.room_type === "delegation" ? (
            <DelegationRoomScreen room={room} />
          ) : (
            <VoteRoomScreen room={room} />
          )}
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161022",
  },
});
