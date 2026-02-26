
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.backendUrl || "";

console.log("[lib/auth] Initializing with API_URL:", API_URL);
console.log("[lib/auth] Platform:", Platform.OS);

export const BEARER_TOKEN_KEY = "civic_bearer_token";

// Platform-specific storage: localStorage for web, SecureStore for native
const storage = Platform.OS === "web"
  ? {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error("[lib/auth] localStorage.getItem error:", error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error("[lib/auth] localStorage.setItem error:", error);
        }
      },
      deleteItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error("[lib/auth] localStorage.deleteItem error:", error);
        }
      },
    }
  : SecureStore;

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "civic", // FIXED: Match app.json scheme
      storagePrefix: "civic",
      storage,
    }),
  ],
  // On web, use cookies (credentials: include) and fallback to bearer token
  ...(Platform.OS === "web" && {
    fetchOptions: {
      credentials: "include" as RequestCredentials,
      auth: {
        type: "Bearer" as const,
        token: () => {
          try {
            return localStorage.getItem(BEARER_TOKEN_KEY) || "";
          } catch (error) {
            console.error("[lib/auth] Error getting bearer token:", error);
            return "";
          }
        },
      },
    },
  }),
});

export async function setBearerToken(token: string) {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(BEARER_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(BEARER_TOKEN_KEY, token);
    }
    console.log("[lib/auth] Bearer token stored successfully");
  } catch (error) {
    console.error("[lib/auth] Error storing bearer token:", error);
  }
}

export async function clearAuthTokens() {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(BEARER_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(BEARER_TOKEN_KEY);
    }
    console.log("[lib/auth] Auth tokens cleared successfully");
  } catch (error) {
    console.error("[lib/auth] Error clearing auth tokens:", error);
  }
}

export async function storeBiometricKey(email: string, biometricPublicKey: string) {
  try {
    const storageKey = `biometric_key_${email}`;
    if (Platform.OS === "web") {
      localStorage.setItem(storageKey, biometricPublicKey);
    } else {
      await SecureStore.setItemAsync(storageKey, biometricPublicKey);
    }
    console.log("[lib/auth] Biometric key stored successfully for:", email);
  } catch (error) {
    console.error("[lib/auth] Error storing biometric key:", error);
  }
}

export async function getBiometricKey(email: string): Promise<string | null> {
  try {
    const storageKey = `biometric_key_${email}`;
    if (Platform.OS === "web") {
      return localStorage.getItem(storageKey);
    } else {
      return await SecureStore.getItemAsync(storageKey);
    }
  } catch (error) {
    console.error("[lib/auth] Error getting biometric key:", error);
    return null;
  }
}

export async function clearBiometricKey(email: string) {
  try {
    const storageKey = `biometric_key_${email}`;
    if (Platform.OS === "web") {
      localStorage.removeItem(storageKey);
    } else {
      await SecureStore.deleteItemAsync(storageKey);
    }
    console.log("[lib/auth] Biometric key cleared for:", email);
  } catch (error) {
    console.error("[lib/auth] Error clearing biometric key:", error);
  }
}

export { API_URL };
