
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Image, Text, Platform } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [forceRedirect, setForceRedirect] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Add debug info
  useEffect(() => {
    const info = [
      `Platform: ${Platform.OS}`,
      `Loading: ${loading}`,
      `User: ${user ? 'Yes' : 'No'}`,
      `Time: ${new Date().toISOString()}`,
    ];
    setDebugInfo(info);
    console.log("[Index] Debug info:", info.join(', '));
  }, [loading, user]);

  console.log("[Index] Rendering - loading:", loading, "user:", !!user, "platform:", Platform.OS);

  // Fallback: If loading takes more than 15 seconds, force redirect
  useEffect(() => {
    if (loading) {
      console.log("[Index] Setting 15-second timeout for loading state");
      const timeout = setTimeout(() => {
        console.log("[Index] Loading timeout reached - forcing redirect");
        setForceRedirect(true);
      }, 15000);

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Force redirect if timeout reached
  if (forceRedirect) {
    console.log("[Index] Force redirect triggered - going to /auth");
    return <Redirect href="/auth" />;
  }

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
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
        
        {/* Debug info for troubleshooting */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            {debugInfo.map((info, index) => (
              <Text key={index} style={styles.debugText}>{info}</Text>
            ))}
          </View>
        )}
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
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "600",
  },
  loader: {
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#FFFFFF",
  },
  debugContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 12,
    borderRadius: 8,
  },
  debugText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 4,
  },
});
