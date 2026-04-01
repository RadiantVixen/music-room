import { ScrollView, Text } from "react-native"
import AppLayout from "../../../components/layout/AppLayout"

import ProfileHeader from "../components/ProfileHeader"
import ProfileStats from "../components/ProfileStats"
import MusicPreferences from "../components/MusicPreferences"

import ProfileHeaderNav from "../components/ProfileHeaderNav"
import ProfileSettings from "../components/ProfileSettings"

import { useAuthStore } from "../../../store/authStore"

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);

  return (
    <AppLayout header={<ProfileHeaderNav />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader />
        <ProfileStats />
        <MusicPreferences />
        <ProfileSettings />
      </ScrollView>
    </AppLayout>
  )
}