import { ScrollView, View, Text, StyleSheet } from "react-native"
import EditProfileHeader from "../components/EditProfileHeader"
import ProfileAvatarEditor from "../components/ProfileAvatarEditor"
import BasicInfoForm from "../components/BasicInfoForm"
import PrivacySettings from "../components/PrivacySettings"
import LinkedAccounts from "../components/LinkedAccounts"
import SaveProfileButton from "../components/SaveProfileButton"

import AppLayout from "../../../components/layout/AppLayout"

export default function EditProfileScreen() {
  return (
    <AppLayout header={<EditProfileHeader />}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <ProfileAvatarEditor />

        <BasicInfoForm />

        <PrivacySettings />

        <LinkedAccounts />

        <SaveProfileButton />
      </ScrollView>
    </AppLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0a19",
  },
})