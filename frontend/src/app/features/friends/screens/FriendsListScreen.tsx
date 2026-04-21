import { ScrollView, Text, View, StyleSheet, Alert } from "react-native";
import AppLayout from "../../../components/layout/AppLayout";

import FriendsHeaderNav from "../components/FriendsHeaderNav";
import FriendCard from "../components/FriendCard";

import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { useFriendsStore } from "../../../store/friendsStore";

export default function FriendsListScreen() {
  const { friends, fetchFriends, removeFriend, isLoading } = useFriendsStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleRemove = async (id: number) => {
    try {
      await removeFriend(id);
    } catch (e) {
      Alert.alert("Error", "Failed to remove friend");
    }
  };

  return (
    <AppLayout header={<FriendsHeaderNav />}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.container}>
          {/* Title */}
          <Text style={styles.sectionTitle}>YOUR FRIENDS</Text>

          {/* List */}
          {isLoading ? (
            <Text style={styles.empty}>Loading...</Text>
          ) : friends.length === 0 ? (
            <Text style={styles.empty}>No friends yet</Text>
          ) : (
            friends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onPress={() => navigation.navigate("FriendProfile", { userId: friend.id })}
                onRemove={() => handleRemove(friend.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  sectionTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 10,
  },

  empty: {
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
});