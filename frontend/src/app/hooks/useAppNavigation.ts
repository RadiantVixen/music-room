import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;

export const useAppNavigation = () => {
  return useNavigation<AppNavigation>();
};