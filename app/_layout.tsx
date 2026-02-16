
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, View, ActivityIndicator, Platform } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
// Note: Error logging is auto-initialized via index.ts import

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)", // Ensure any route can link back to `/`
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [checkingAgent, setCheckingAgent] = React.useState(false);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth" || segments[0] === "auth-popup" || segments[0] === "auth-callback";
    const inRegisterScreen = segments[0] === "(tabs)" && segments[1] === "register";

    console.log("[Layout] Navigation check - user:", !!user, "segments:", segments, "inRegisterScreen:", inRegisterScreen);

    // Allow access to registration screen without authentication
    if (inRegisterScreen) {
      console.log("[Layout] User is on registration screen - allowing access");
      return;
    }

    if (!user && !inAuthGroup) {
      // Redirect to auth if not authenticated and not on registration
      console.log("[Layout] No user and not in auth group - redirecting to /auth");
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      // Check if agent is registered, then redirect appropriately
      console.log("[Layout] User authenticated and in auth group - checking agent registration");
      checkAgentRegistration();
    }
  }, [user, loading, segments]);

  const checkAgentRegistration = async () => {
    if (checkingAgent) return;
    
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
        console.log("[Layout] Completing pending registration for:", pendingRegistration.email);
        try {
          const response = await authenticatedPost("/api/agents/register", pendingRegistration);
          console.log("[Layout] Agent registration completed:", response);
          // Continue to check agent status below
        } catch (error) {
          console.error("[Layout] Failed to complete registration:", error);
          // Still try to check if agent exists
        }
      }

      const agent = await authenticatedGet("/api/agents/me");
      if (agent) {
        // Agent is registered, go to home
        console.log("[Layout] Agent found - redirecting to home");
        router.replace("/(tabs)/(home)/");
      }
    } catch (error) {
      // Agent not registered, go to registration
      console.log("[Layout] Agent not found - redirecting to registration");
      router.replace("/(tabs)/register");
    } finally {
      setCheckingAgent(false);
    }
  };

  if (loading || checkingAgent) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
      <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)", // System Blue
      background: "rgb(242, 242, 247)", // Light mode background
      card: "rgb(255, 255, 255)", // White cards/surfaces
      text: "rgb(0, 0, 0)", // Black text for light mode
      border: "rgb(216, 216, 220)", // Light gray for separators/borders
      notification: "rgb(255, 59, 48)", // System Red
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)", // System Blue (Dark Mode)
      background: "rgb(1, 1, 1)", // True black background for OLED displays
      card: "rgb(28, 28, 30)", // Dark card/surface color
      text: "rgb(255, 255, 255)", // White text for dark mode
      border: "rgb(44, 44, 46)", // Dark gray for separators/borders
      notification: "rgb(255, 69, 58)", // System Red (Dark Mode)
    },
  };
  return (
    <>
      <StatusBar style="auto" animated />
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <AuthProvider>
          <WidgetProvider>
            <GestureHandlerRootView>
              <RootLayoutNav />
              <SystemBars style={"auto"} />
            </GestureHandlerRootView>
          </WidgetProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
