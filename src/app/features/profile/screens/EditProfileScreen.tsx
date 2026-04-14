import { ScrollView, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import EditProfileHeader from "../components/EditProfileHeader";
import ProfileAvatarEditor from "../components/ProfileAvatarEditor";
import BasicInfoForm from "../components/BasicInfoForm";
import PrivacySettings from "../components/PrivacySettings";
import LinkedAccounts from "../components/LinkedAccounts";
import SaveProfileButton from "../components/SaveProfileButton";
import AppLayout from "../../../components/layout/AppLayout";
import { useAuthStore } from "../../../store/authStore";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const updateMe = useAuthStore((state) => state.updateMe);

  const handleSave = async () => {
    try {
      await updateMe({
        first_name: name,
        username: username,
        "profile.bio": bio,
        // "profile.location": location,
      });

      Alert.alert("Success", "Profile updated successfully");

      // optional:
      navigation.goBack();

    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.first_name || "");
      setUsername(user.username || "");
      setBio(user.profile?.bio || "");
      setEmail(user.email || "");
    }
  }, [user]);

  return (
    <AppLayout header={<EditProfileHeader />}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <ProfileAvatarEditor avatar={user?.profile?.avatar} />

        <BasicInfoForm
          name={name}
          username={username}
          bio={bio}
          email={email}
          setName={setName}
          setUsername={setUsername}
          setBio={setBio}
          setEmail={setEmail}
        />

        <PrivacySettings />
        <LinkedAccounts />
        <SaveProfileButton onPress={handleSave} />
      </ScrollView>
    </AppLayout>
  );
}