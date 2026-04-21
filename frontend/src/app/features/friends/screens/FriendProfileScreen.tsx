import { useEffect } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { useRoute } from "@react-navigation/native";
import AppLayout from "../../../components/layout/AppLayout";
import ProfileHeader from "../../profile/components/ProfileHeader"
import ProfileStats from "../../profile/components/ProfileStats";
import MusicPreferences from "../../profile/components/MusicPreferences";
import FriendProfileHeaderNav from "../components/FriendProfileHeaderNav";
import { useFriendsStore } from "../../../store/friendsStore";

export default function FriendProfileScreen() {
  const route = useRoute<any>();
  const userId = route.params?.userId;

  const {
    selectedFriendProfile,
    fetchFriendProfile,
    sendFriendRequest,
    removeFriend,
    blockUser,
    isLoading,
    clearSelectedFriendProfile,
  } = useFriendsStore();

  useEffect(() => {
    if (userId) fetchFriendProfile(userId);

    return () => {
      clearSelectedFriendProfile();
    };
  }, [userId]);

  const relationship = selectedFriendProfile?.relationship;

  const handlePrimaryAction = async () => {
    try {
      if (!selectedFriendProfile) return;

      if (relationship?.status === "none") {
        await sendFriendRequest(selectedFriendProfile.id);
        await fetchFriendProfile(selectedFriendProfile.id);
        Alert.alert("Success", "Friend request sent");
      } else if (relationship?.status === "friends") {
        await removeFriend(selectedFriendProfile.id);
        await fetchFriendProfile(selectedFriendProfile.id);
        Alert.alert("Success", "Friend removed");
      }
    } catch {
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleSecondaryAction = async () => {
    try {
      if (!selectedFriendProfile) return;
      await blockUser(selectedFriendProfile.id);
      Alert.alert("Success", "User blocked");
    } catch {
      Alert.alert("Error", "Failed to block user");
    }
  };

  const primaryButtonText =
    relationship?.status === "friends"
      ? "Unfriend"
      : relationship?.status === "none"
      ? "Add Friend"
      : relationship?.status === "request_sent"
      ? "Request Sent"
      : undefined;

  const secondaryButtonText =
    relationship?.status === "friends" ? "Block" : undefined;

  return (
    <AppLayout header={<FriendProfileHeaderNav />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading && !selectedFriendProfile ? (
          <Text style={{ color: "white", textAlign: "center", marginTop: 40 }}>
            Loading...
          </Text>
        ) : selectedFriendProfile ? (
          <>
            <ProfileHeader
              avatar={selectedFriendProfile.profile?.avatar}
              name={selectedFriendProfile.first_name}
              username={selectedFriendProfile.username}
              bio={selectedFriendProfile.profile?.bio}
              primaryButtonText={primaryButtonText}
              secondaryButtonText={secondaryButtonText}
              onPrimaryPress={
                relationship?.status === "request_sent" ? undefined : handlePrimaryAction
              }
              onSecondaryPress={handleSecondaryAction}
            />

            <ProfileStats stats={selectedFriendProfile.stats} />

            <MusicPreferences
              genres={selectedFriendProfile.music_preferences?.favorite_genres || []}
            />
          </>
        ) : (
          <Text style={{ color: "white", textAlign: "center", marginTop: 40 }}>
            User not found
          </Text>
        )}
      </ScrollView>
    </AppLayout>
  );
}