
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { authClient, setBearerToken, clearAuthTokens, BEARER_TOKEN_KEY } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmailOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  verifyOTPWithRegistration: (email: string, otp: string, registrationData: any) => Promise<void>;
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

  const signInWithEmailOTP = async (email: string) => {
    try {
      console.log("[AuthContext] Sending OTP to:", email);
      const { apiPost } = await import("@/utils/api");
      await apiPost("/api/auth/request-otp", { email });
      console.log("[AuthContext] OTP sent successfully");
    } catch (error) {
      console.error("[AuthContext] Failed to send OTP:", error);
      throw error;
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      console.log("[AuthContext] Verifying OTP for:", email);
      const { apiPost } = await import("@/utils/api");
      const response = await apiPost<{ token: string; user: User }>("/api/auth/verify-otp", {
        email,
        code: otp,
      });
      
      if (response.token) {
        await setBearerToken(response.token);
        console.log("[AuthContext] OTP verified, token saved");
      }
      
      await fetchUser();
    } catch (error) {
      console.error("[AuthContext] OTP verification failed:", error);
      throw error;
    }
  };

  const verifyOTPWithRegistration = async (email: string, otp: string, registrationData: any) => {
    try {
      console.log("[AuthContext] Verifying OTP with registration data for:", email);
      const { apiPost } = await import("@/utils/api");
      const response = await apiPost<{ token: string; user: User }>("/api/auth/verify-otp", {
        email,
        code: otp,
        ...registrationData,
      });
      
      if (response.token) {
        await setBearerToken(response.token);
        console.log("[AuthContext] OTP verified with registration, token saved");
      }
      
      await fetchUser();
    } catch (error) {
      console.error("[AuthContext] OTP verification with registration failed:", error);
      throw error;
    }
  };

  const signInWithBiometric = async (email: string) => {
    try {
      console.log("[AuthContext] Signing in with biometric for:", email);
      
      // Get the stored biometric public key for this email
      const storageKey = `biometric_key_${email}`;
      let biometricPublicKey: string | null = null;
      
      if (Platform.OS === "web") {
        biometricPublicKey = localStorage.getItem(storageKey);
      } else {
        biometricPublicKey = await SecureStore.getItemAsync(storageKey);
      }

      if (!biometricPublicKey) {
        throw new Error("No biometric credential found for this email");
      }

      const { apiPost } = await import("@/utils/api");
      const response = await apiPost<{ token: string; user: User }>("/api/biometric/verify", {
        email,
        biometricPublicKey,
      });
      
      if (response.token) {
        await setBearerToken(response.token);
        console.log("[AuthContext] Biometric verification successful, token saved");
      }
      
      await fetchUser();
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
        signInWithEmailOTP,
        verifyOTP,
        verifyOTPWithRegistration,
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
