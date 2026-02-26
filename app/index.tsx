
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
          source={require("@/assets/images/7bcb7964-0c30-43fd-8aa4-aa6402fd8edb.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Kenya Civic</Text>
        <Text style={styles.subtitle}>WANJIKU@63</Text>
        <ActivityIndicator size="large" color="#FF3B30" style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
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
    backgroundColor: "#D32F2F",
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
    color: "#fff",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },
  loader: {
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#fff",
  },
});
