
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
  signInWithBiometric: (email: string) => Promise<void>;
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

  const signInWithBiometric = async (email: string) => {
    try {
      console.log("[AuthContext] Signing in with biometric for:", email);
      
      // Authenticate with device biometric first
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in with biometric",
        fallbackLabel: "Use passcode",
        disableDeviceFallback: false,
      });

      if (!result.success) {
        throw new Error("Biometric authentication failed");
      }
      
      // Get the stored biometric public key for this email
      const biometricPublicKey = await getBiometricKey(email);

      if (!biometricPublicKey) {
        throw new Error("No biometric credential found for this email. Please register first.");
      }

      const { apiPost } = await import("@/utils/api");
      const response = await apiPost<{ success: boolean; agentId: string; civicCode: string; email: string }>("/api/biometric/verify", {
        email,
        biometricPublicKey,
      });
      
      if (response.success) {
        console.log("[AuthContext] Biometric verification successful");
        // The backend doesn't return a token yet, so we need to use Better Auth
        // to create a session. For now, we'll just fetch the user.
        await fetchUser();
      }
    } catch (error) {
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
