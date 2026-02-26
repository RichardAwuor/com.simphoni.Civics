
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.backendUrl || "";

export const BEARER_TOKEN_KEY = "civic_bearer_token";

// Platform-specific storage: localStorage for web, SecureStore for native
const storage = Platform.OS === "web"
  ? {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      deleteItem: (key: string) => localStorage.removeItem(key),
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
      credentials: "include",
      auth: {
        type: "Bearer" as const,
        token: () => localStorage.getItem(BEARER_TOKEN_KEY) || "",
      },
    },
  }),
});

export async function setBearerToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(BEARER_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(BEARER_TOKEN_KEY, token);
  }
}

export async function clearAuthTokens() {
  if (Platform.OS === "web") {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(BEARER_TOKEN_KEY);
  }
}

export async function storeBiometricKey(email: string, biometricPublicKey: string) {
  const storageKey = `biometric_key_${email}`;
  if (Platform.OS === "web") {
    localStorage.setItem(storageKey, biometricPublicKey);
  } else {
    await SecureStore.setItemAsync(storageKey, biometricPublicKey);
  }
}

export async function getBiometricKey(email: string): Promise<string | null> {
  const storageKey = `biometric_key_${email}`;
  if (Platform.OS === "web") {
    return localStorage.getItem(storageKey);
  } else {
    return await SecureStore.getItemAsync(storageKey);
  }
}

export async function clearBiometricKey(email: string) {
  const storageKey = `biometric_key_${email}`;
  if (Platform.OS === "web") {
    localStorage.removeItem(storageKey);
  } else {
    await SecureStore.deleteItemAsync(storageKey);
  }
}

export { API_URL };
