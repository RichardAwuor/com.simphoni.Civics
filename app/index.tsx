
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Image, Text } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log("[Index] Rendering - loading:", loading, "user:", !!user);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <View style={styles.container}>
        <Image
          source={require("@/assets/images/14f8f728-c617-420d-a9ca-dd6f305413d6.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Kenya Civic</Text>
        <Text style={styles.subtitle}>WANJIKU@63</Text>
        <ActivityIndicator size="large" color="#FF3B30" style={styles.loader} />
      </View>
    );
  }

  // Once auth is loaded, redirect based on user state
  if (!user) {
    console.log("[Index] No user - redirecting to /auth");
    return <Redirect href="/auth" />;
  }

  console.log("[Index] User authenticated - redirecting to /(tabs)");
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#000",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
    textAlign: "center",
    color: "#666",
    fontWeight: "600",
  },
  loader: {
    marginTop: 20,
  },
});
