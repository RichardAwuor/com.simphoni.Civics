
import React, { useState } from "react";
import {
  View,
  Text,
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

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithBiometric, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  
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

  const handleBiometricSignIn = async () => {
    setLoading(true);
    try {
      console.log("[Auth] Starting biometric sign-in");
      await signInWithBiometric();
      console.log("[Auth] Biometric sign-in successful - redirecting to dashboard");
      // Auth context will handle redirect via _layout.tsx
    } catch (error: any) {
      console.error("[Auth] Biometric sign-in failed:", error);
      const errorMessage = error.message || "Biometric sign-in failed. Please try again or register first.";
      showModal("Sign-in Failed", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
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
              source={require("@/assets/images/c7abb91d-37b9-4e4b-9693-6f0e4d805d93.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Kenya Civic</Text>
          <Text style={styles.subtitle}>WANJIKU@63</Text>

          <Text style={styles.instructionText}>
            Sign in with your biometric
          </Text>

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
  buttonDisabled: {
    opacity: 0.6,
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
