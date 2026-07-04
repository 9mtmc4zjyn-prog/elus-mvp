import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function ElusOptionsButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.button}
      onPress={() => router.push("/connections-options")}
    >
      <Text style={styles.icon}>≋</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: Platform.OS === "ios" ? 64 : 42,
    right: 22,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#151B28",
    borderWidth: 1.4,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },

  icon: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "900",
  },
});