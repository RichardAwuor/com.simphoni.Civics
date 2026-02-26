
import React, { useEffect, useState } from "react";
import { Platform, ActivityIndicator, View, Text } from "react-native";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { user, loading: authLoading } = useAuth();
  const [checkingAgent, setCheckingAgent] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    console.log("[TabLayout iOS] Effect triggered - authLoading:", authLoading, "user:", !!user);
    
    if (authLoading) {
      console.log("[TabLayout iOS] Auth still loading, waiting...");
      return;
    }

    if (!user) {
      console.log("[TabLayout iOS] No user in TabLayout - should redirect to auth");
      setCheckingAgent(false);
      return;
    }

    checkAgentRegistration();
  }, [user, authLoading]);

  const checkAgentRegistration = async () => {
    console.log("[TabLayout iOS] Checking agent registration");
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
        console.log("[TabLayout iOS] Completing pending registration for:", pendingRegistration.email);
        try {
          await authenticatedPost("/api/agents/register", pendingRegistration);
          console.log("[TabLayout iOS] Agent registration completed");
        } catch (error) {
          console.error("[TabLayout iOS] Failed to complete registration:", error);
        }
      }

      console.log("[TabLayout iOS] Fetching agent profile from /api/agents/me");
      const agent = await authenticatedGet("/api/agents/me");
      
      if (agent) {
        console.log("[TabLayout iOS] Agent found:", agent.civicCode);
        setIsRegistered(true);
      } else {
        console.log("[TabLayout iOS] No agent found - needs registration");
        setIsRegistered(false);
      }
    } catch (error) {
      console.log("[TabLayout iOS] Agent not found (expected for new users):", error);
      setIsRegistered(false);
    } finally {
      setCheckingAgent(false);
    }
  };

  // Show loading while checking
  if (authLoading || checkingAgent) {
    console.log("[TabLayout iOS] Showing loading screen");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#D32F2F" }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", marginTop: 16, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    console.log("[TabLayout iOS] No user - redirecting to /auth");
    return <Redirect href="/auth" />;
  }

  // Redirect to registration if not registered
  if (!isRegistered) {
    console.log("[TabLayout iOS] User not registered - redirecting to register");
    return <Redirect href="/(tabs)/register" />;
  }

  console.log("[TabLayout iOS] User is registered - showing native tabs");

  return (
    <NativeTabs>
      <NativeTabs.Screen
        name="(home)"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              color={color}
              size={24}
            />
          ),
        }}
      />
      <NativeTabs.Screen
        name="on-location"
        options={{
          title: "On-Location",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              ios_icon_name="location.fill"
              android_material_icon_name="location-on"
              color={color}
              size={24}
            />
          ),
        }}
      />
      <NativeTabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              color={color}
              size={24}
            />
          ),
        }}
      />
      <NativeTabs.Screen
        name="register"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </NativeTabs>
  );
}
