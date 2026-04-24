import { ScrollView } from "react-native"
import { useAppNavigation } from "../../../hooks/useAppNavigation"
import AppLayout from "../../../components/layout/AppLayout"

import ProfileHeader from "../components/ProfileHeader"
import ProfileStats from "../components/ProfileStats"
import MusicPreferences from "../components/MusicPreferences"

import ProfileHeaderNav from "../components/ProfileHeaderNav"
import ProfileSettings from "../components/ProfileSettings"

import { useAuthStore } from "../../../store/authStore"

export default function ProfileScreen() {
  const navigation = useAppNavigation();
  const user = useAuthStore((state) => state.user);

  return (
    <AppLayout header={<ProfileHeaderNav />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader
          avatar={user?.profile?.avatar}
          name={user?.first_name}
          username={user?.username}
          bio={user?.profile?.bio}
          secondaryButtonText="Edit Profile"
          primaryButtonText="Share Profile"
          onSecondaryPress={() => navigation.navigate("EditProfile")}
        />
        <ProfileStats stats={user?.stats} />
        <MusicPreferences
          genres={user?.music_preferences?.favorite_genres || []}
          onPress={() => navigation.navigate("EditMusicPreferences")}
        />
        <ProfileSettings />
      </ScrollView>
    </AppLayout>
  )
}