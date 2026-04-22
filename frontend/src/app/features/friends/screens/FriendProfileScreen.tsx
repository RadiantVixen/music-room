import { useEffect } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { useRoute } from "@react-navigation/native";
import AppLayout from "../../../components/layout/AppLayout";
import ProfileHeader from "../../profile/components/ProfileHeader";
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
    respondToFriendRequest,
    isLoading,
    clearSelectedFriendProfile,
  } = useFriendsStore();

  useEffect(() => {
    if (userId) {
      fetchFriendProfile(userId);
    }

    return () => {
      clearSelectedFriendProfile();
    };
  }, [userId]);


  const handlePrimaryAction = async () => {
    try {
      if (!selectedFriendProfile) return;

      if (relationshipStatus === "none") {
        await sendFriendRequest(selectedFriendProfile.id);
        await fetchFriendProfile(selectedFriendProfile.id);
        Alert.alert("Success", "Friend request sent");
      } else if (relationshipStatus === "friends") {
        await removeFriend(selectedFriendProfile.id);
        await fetchFriendProfile(selectedFriendProfile.id);
        Alert.alert("Success", "Friend removed");
      } else if (relationshipStatus === "request_received" && requestId) {
        await respondToFriendRequest(requestId, "accept");
        await fetchFriendProfile(selectedFriendProfile.id);
        Alert.alert("Success", "Friend request accepted");
      }
    } catch {
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleSecondaryAction = async () => {
    try {
      if (!selectedFriendProfile) return;

      if (relationshipStatus === "friends") {
        await blockUser(selectedFriendProfile.id);
        await fetchFriendProfile(selectedFriendProfile.id);
        Alert.alert("Success", "User blocked");
      } else if (relationshipStatus === "request_received" && requestId) {
        await respondToFriendRequest(requestId, "decline");
        await fetchFriendProfile(selectedFriendProfile.id);
        Alert.alert("Success", "Friend request rejected");
      }
    } catch {
      Alert.alert("Error", "Failed to process action");
    }
  };

  const relationshipStatus = selectedFriendProfile?.relationship?.status ?? "none";
  const requestId = selectedFriendProfile?.relationship?.request_id;

  const primaryButtonText =
    relationshipStatus === "friends"
      ? "Unfriend"
      : relationshipStatus === "none"
      ? "Add Friend"
      : relationshipStatus === "request_sent"
      ? "Request Sent"
      : relationshipStatus === "request_received"
      ? "Accept"
      : undefined;

  const secondaryButtonText =
    relationshipStatus === "friends"
      ? "Block"
      : relationshipStatus === "request_received"
      ? "Reject"
      : undefined;

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
              name={selectedFriendProfile.first_name || selectedFriendProfile.username}
              username={selectedFriendProfile.username}
              bio={selectedFriendProfile.profile?.bio}
              primaryButtonText={primaryButtonText}
              secondaryButtonText={secondaryButtonText}
              onPrimaryPress={
                relationshipStatus === "request_sent" ? undefined : handlePrimaryAction
              }
              onSecondaryPress={handleSecondaryAction}
            />

            <ProfileStats
              stats={
                selectedFriendProfile.stats || {
                  rooms_count: 0,
                  friends_count: 0,
                  vibes_count: 0,
                }
              }
            />

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