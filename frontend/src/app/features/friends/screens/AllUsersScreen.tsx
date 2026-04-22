import { ScrollView, Text, View, StyleSheet, Alert } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import AppLayout from "../../../components/layout/AppLayout";
import FriendsHeaderNav from "../components/FriendsHeaderNav";
import FriendCard from "../components/FriendCard";
import { useFriendsStore } from "../../../store/friendsStore";
import { useAuthStore } from "../../../store/authStore";

export default function AllUsersScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const { sendFriendRequest } = useFriendsStore();
  const [addedIds, setAddedIds] = useState<number[]>([]);

  const {
    allUsers,
    usersLoading,
    friends,
    fetchAllUsers,
    fetchFriends,
  } = useFriendsStore();

  useEffect(() => {
    fetchFriends();
    fetchAllUsers();
  }, []);
  const handleAdd = async (userId: number) => {
    try {
      await sendFriendRequest(userId);

      setAddedIds((prev) => [...prev, userId]);
    } catch {
      Alert.alert("Error", "Failed to send request");
    }
  };

  const filteredUsers = useMemo(() => {
    const friendIds = new Set(friends.map((f: any) => f.id));

    return allUsers.filter((u: any) => {
      if (u.id === user?.id) return false;
      if (friendIds.has(u.id)) return false;
      return true;
    });
  }, [allUsers, friends, user?.id]);

  return (
    <AppLayout header={<FriendsHeaderNav />}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>ALL USERS</Text>

          {usersLoading ? (
            <Text style={styles.empty}>Loading...</Text>
          ) : filteredUsers.length === 0 ? (
            <Text style={styles.empty}>No users to show</Text>
          ) : (
            filteredUsers.map((person: any) => (
              <FriendCard
                key={person.id}
                friend={person}
                onPress={() =>
                  navigation.navigate("FriendProfile", { userId: person.id })
                }
                onAdd={() => handleAdd(person.id)}
                isAdded={addedIds.includes(person.id)}
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