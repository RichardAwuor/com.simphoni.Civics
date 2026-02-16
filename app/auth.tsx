
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import CustomModal from "@/components/ui/Modal";
import { authClient } from "@/lib/auth";

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithBiometric, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "success" | "error",
  });

  const showModal = (title: string, message: string, type: "info" | "success" | "error") => {
    setModalConfig({ title, message, type });
    setModalVisible(true);
  };

  const handleNewRegistration = () => {
    console.log("[Auth] User tapped New Agent Registration button - navigating to register screen");
    router.push("/(tabs)/register");
  };

  const handleSignInWithEmail = async () => {
    if (!email) {
      showModal("Error", "Please enter your email address", "error");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showModal("Error", "Please enter a valid email address", "error");
      return;
    }

    setLoading(true);
    try {
      console.log("[Auth] Sending magic link to email:", email);
      await authClient.signIn.email({
        email,
        callbackURL: "/auth-callback",
      });
      setEmailSent(true);
      showModal("Success", "Check your email for a sign-in link", "success");
    } catch (error: any) {
      console.error("[Auth] Failed to send magic link:", error);
      showModal("Error", error.message || "Failed to send sign-in link. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricSignIn = async () => {
    if (!email) {
      showModal("Error", "Please enter your email address", "error");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showModal("Error", "Please enter a valid email address", "error");
      return;
    }

    setLoading(true);
    try {
      console.log("[Auth] Signing in with biometric for:", email);
      await signInWithBiometric(email);
      showModal("Success", "Biometric sign-in successful!", "success");
      // Auth context will handle redirect
    } catch (error: any) {
      console.error("[Auth] Biometric sign-in failed:", error);
      showModal("Error", error.message || "Biometric sign-in failed. Please try email sign-in or register first.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo - Kenya Civic with decorative border */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/d8b57700-6b85-43a6-9b94-d3810c5a9213.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Kenya Civic</Text>
          <Text style={styles.subtitle}>WANJIKU@63</Text>

          {emailSent ? (
            <>
              <Text style={styles.instructionText}>
                Check your email for a sign-in link. Click the link to complete authentication.
              </Text>
              <TouchableOpacity
                style={styles.switchModeButton}
                onPress={() => setEmailSent(false)}
              >
                <Text style={styles.switchModeText}>Use a different email</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.instructionText}>
                Sign in with your email or biometric
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleBiometricSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In with Biometric</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                onPress={handleSignInWithEmail}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Sign In with Email Link</Text>
              </TouchableOpacity>

              {/* New Agent Registration Section */}
              <View style={styles.registrationSection}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>New Agent?</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.registrationButton}
                  onPress={handleNewRegistration}
                >
                  <Text style={styles.registrationButtonText}>
                    New Agent Registration
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 0,
  },
  logo: {
    width: 270,
    height: 270,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#000",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
    textAlign: "center",
    color: "#666",
    fontWeight: "600",
  },
  instructionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  primaryButton: {
    height: 50,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchModeButton: {
    marginTop: 16,
    alignItems: "center",
  },
  switchModeText: {
    color: "#007AFF",
    fontSize: 14,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#666",
    fontSize: 14,
  },
  registrationSection: {
    marginTop: 16,
  },
  registrationButton: {
    height: 50,
    borderWidth: 2,
    borderColor: "#34C759",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  registrationButtonText: {
    fontSize: 16,
    color: "#34C759",
    fontWeight: "600",
  },
});
