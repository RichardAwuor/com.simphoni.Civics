
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { authClient, setBearerToken, clearAuthTokens, BEARER_TOKEN_KEY, storeBiometricKey, getBiometricKey } from "@/lib/auth";
import * as LocalAuthentication from "expo-local-authentication";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface Agent {
  id: string;
  civicCode: string;
  firstName: string;
  lastName: string;
  email: string;
  county: string;
  constituency: string;
  ward: string;
  dateOfBirth: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  registerAgent: (registrationData: any) => Promise<{ agent: Agent; success: boolean }>;
  registerBiometric: (email: string, biometricPublicKey: string) => Promise<void>;
  signInWithBiometric: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();

    // Listen for deep links (e.g. from social auth redirects)
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("[AuthContext] Deep link received, refreshing user session");
      setTimeout(() => fetchUser(), 500);
    });

    // POLLING: Refresh session every 5 minutes to keep SecureStore token in sync
    const intervalId = setInterval(() => {
      console.log("[AuthContext] Auto-refreshing user session to sync token...");
      fetchUser();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const session = await authClient.getSession();
      if (session?.data?.user) {
        setUser(session.data.user as User);
        // Sync token to SecureStore for utils/api.ts
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("[AuthContext] Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const registerAgent = async (registrationData: any): Promise<{ agent: Agent; success: boolean }> => {
    try {
      console.log("[AuthContext] Registering agent:", registrationData.email);
      const { authenticatedPost } = await import("@/utils/api");
      
      const response = await authenticatedPost<{ agent: Agent; success: boolean }>(
        "/api/agents/register",
        registrationData
      );
      
      console.log("[AuthContext] Agent registered successfully:", response.agent.civicCode);
      return response;
    } catch (error) {
      console.error("[AuthContext] Agent registration failed:", error);
      throw error;
    }
  };

  const registerBiometric = async (email: string, biometricPublicKey: string) => {
    try {
      console.log("[AuthContext] Registering biometric credential for:", email);
      const { apiPost } = await import("@/utils/api");
      
      await apiPost("/api/biometric/register", {
        email,
        biometricPublicKey,
      });
      
      // Store locally for future sign-ins
      await storeBiometricKey(email, biometricPublicKey);
      
      console.log("[AuthContext] Biometric credential registered successfully");
    } catch (error) {
      console.error("[AuthContext] Biometric registration failed:", error);
      throw error;
    }
  };

  const signInWithBiometric = async () => {
    try {
      console.log("[AuthContext] Starting biometric sign-in");
      
      // First, authenticate with device biometric
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in to Kenya Civic",
        fallbackLabel: "Use passcode",
        disableDeviceFallback: false,
      });

      if (!biometricResult.success) {
        throw new Error("Biometric authentication was cancelled or failed");
      }

      console.log("[AuthContext] Device biometric authentication successful");
      
      // Get all stored biometric keys (we need to try them since we don't have email input)
      // For now, we'll need to get the email from the last registered user
      // This is a limitation of removing the email input - we need to store the last used email
      const lastEmail = await getLastUsedEmail();
      
      if (!lastEmail) {
        throw new Error("No registered biometric found. Please register first.");
      }

      const biometricPublicKey = await getBiometricKey(lastEmail);

      if (!biometricPublicKey) {
        throw new Error("No biometric credential found. Please register first.");
      }

      console.log("[AuthContext] Verifying biometric with backend for:", lastEmail);
      
      const { apiPost } = await import("@/utils/api");
      const response = await apiPost<{ success: boolean; token: string; user: { id: string; email: string; name: string } }>("/api/biometric/verify", {
        email: lastEmail,
        biometricPublicKey,
      });
      
      if (response.success && response.token) {
        console.log("[AuthContext] Biometric verification successful, setting session token");
        await setBearerToken(response.token);
        setUser(response.user as User);
      } else {
        throw new Error("Biometric verification failed");
      }
    } catch (error: any) {
      console.error("[AuthContext] Biometric sign in failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("[AuthContext] Sign out failed (API):", error);
    } finally {
      // Always clear local state
      setUser(null);
      await clearAuthTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        registerAgent,
        registerBiometric,
        signInWithBiometric,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Helper to store/retrieve the last used email for biometric sign-in
async function getLastUsedEmail(): Promise<string | null> {
  const storageKey = "last_biometric_email";
  if (Platform.OS === "web") {
    return localStorage.getItem(storageKey);
  } else {
    return await SecureStore.getItemAsync(storageKey);
  }
}

export async function setLastUsedEmail(email: string) {
  const storageKey = "last_biometric_email";
  if (Platform.OS === "web") {
    localStorage.setItem(storageKey, email);
  } else {
    await SecureStore.setItemAsync(storageKey, email);
  }
}
