
import React, { useEffect, useState } from "react";
import { Platform, ActivityIndicator, View, Text } from "react-native";
import { Redirect, useRouter } from "expo-router";
import FloatingTabBar from "@/components/FloatingTabBar";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checkingAgent, setCheckingAgent] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    console.log("[TabLayout] Effect triggered - authLoading:", authLoading, "user:", !!user);
    
    if (authLoading) {
      console.log("[TabLayout] Auth still loading, waiting...");
      return;
    }

    if (!user) {
      console.log("[TabLayout] No user in TabLayout - should redirect to auth");
      setCheckingAgent(false);
      return;
    }

    checkAgentRegistration();
  }, [user, authLoading]);

  const checkAgentRegistration = async () => {
    console.log("[TabLayout] Checking agent registration");
    setCheckingAgent(true);
    
    try {
      const { authenticatedGet, authenticatedPost } = await import("@/utils/api");
      
      // Check if there's pending registration data
      let pendingRegistration = null;
      if (Platform.OS === "web") {
        const data = localStorage.getItem("pending_registration");
        if (data) {
          pendingRegistration = JSON.parse(data);
          localStorage.removeItem("pending_registration");
        }
      } else {
        const SecureStore = await import("expo-secure-store");
        const data = await SecureStore.default.getItemAsync("pending_registration");
        if (data) {
          pendingRegistration = JSON.parse(data);
          await SecureStore.default.deleteItemAsync("pending_registration");
        }
      }

      // If there's pending registration, complete it now
      if (pendingRegistration) {
        console.log("[TabLayout] Completing pending registration for:", pendingRegistration.email);
        try {
          await authenticatedPost("/api/agents/register", pendingRegistration);
          console.log("[TabLayout] Agent registration completed");
        } catch (error) {
          console.error("[TabLayout] Failed to complete registration:", error);
        }
      }

      console.log("[TabLayout] Fetching agent profile from /api/agents/me");
      const agent = await authenticatedGet("/api/agents/me");
      
      if (agent) {
        console.log("[TabLayout] Agent found:", agent.civicCode);
        setIsRegistered(true);
      } else {
        console.log("[TabLayout] No agent found - needs registration");
        setIsRegistered(false);
      }
    } catch (error) {
      console.log("[TabLayout] Agent not found (expected for new users):", error);
      setIsRegistered(false);
    } finally {
      setCheckingAgent(false);
    }
  };

  // Show loading while checking
  if (authLoading || checkingAgent) {
    console.log("[TabLayout] Showing loading screen");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#D32F2F" }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", marginTop: 16, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    console.log("[TabLayout] No user - redirecting to /auth");
    return <Redirect href="/auth" />;
  }

  // Redirect to registration if not registered
  if (!isRegistered) {
    console.log("[TabLayout] User not registered - redirecting to register");
    return <Redirect href="/(tabs)/register" />;
  }

  console.log("[TabLayout] User is registered - showing tabs");

  const tabs = [
    {
      name: "Dashboard",
      route: "/(tabs)/(home)/" as any,
      ios_icon_name: "house.fill",
      android_material_icon_name: "home",
    },
    {
      name: "On-Location",
      route: "/(tabs)/on-location" as any,
      ios_icon_name: "location.fill",
      android_material_icon_name: "location-on",
    },
    {
      name: "Profile",
      route: "/(tabs)/profile" as any,
      ios_icon_name: "person.fill",
      android_material_icon_name: "person",
    },
  ];

  return <FloatingTabBar tabs={tabs} />;
}
