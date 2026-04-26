import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePremiumStore } from "../../../store/premiumStore";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/RootNavigator";

type Props = {
  children: React.ReactNode;
  /** If true, also requires the playlist to be collaborative */
  requireCollaborative?: boolean;
};

/**
 * Wrap any premium-only UI section in this component.
 * - If isPremium → renders children normally.
 * - If not premium → redirects to PremiumGate screen and renders nothing.
 */
export default function PremiumGate({ children, requireCollaborative }: Props) {
  const { isPremium, statusLoading, fetchPremiumStatus } = usePremiumStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    fetchPremiumStatus();
  }, []);

  if (statusLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#9956F5" />
      </View>
    );
  }

  if (!isPremium) {
    // Navigate on next tick to avoid rendering cycle issues
    setTimeout(() => {
      (navigation as any).navigate("PremiumGate");
    }, 0);
    return null;
  }

  return <>{children}</>;
}
