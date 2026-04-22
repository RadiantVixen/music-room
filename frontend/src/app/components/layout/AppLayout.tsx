import React from "react";
import { View, StyleSheet } from "react-native";
import AppHeader from "./AppHeader";
import BottomNavbar from "./BottomNavbar";

export default function AppLayout({ children, header }: any) {
  return (
    <View style={styles.container}>
      {header ? header : <AppHeader />}

      <View style={styles.content}>{children}</View>

      <BottomNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181022",
  },

  content: {
    flex: 1,
    // paddingHorizontal: 20,
  },
});