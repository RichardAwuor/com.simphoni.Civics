
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { IconSymbol } from "@/components/IconSymbol";
import { setLastUsedEmail } from "@/contexts/AuthContext";

interface BiometricSetupProps {
  email: string;
  onComplete: (biometricPublicKey: string | null) => void;
  onSkip: () => void;
}

export default function BiometricSetup({ email, onComplete, onSkip }: BiometricSetupProps) {
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("");

  useEffect(() => {
    checkBiometricCapability();
  }, []);

  const checkBiometricCapability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const available = compatible && enrolled;
      setBiometricAvailable(available);

      if (available) {
        const typeNames = types.map((type) => {
          if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) {
            return "Fingerprint";
          } else if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
            return "Face ID";
          } else if (type === LocalAuthentication.AuthenticationType.IRIS) {
            return "Iris";
          }
          return "Biometric";
        });
        setBiometricType(typeNames.join(" or "));
      }

      console.log("[BiometricSetup] Biometric capability check:", {
        compatible,
        enrolled,
        available,
        types: types.length,
      });
    } catch (error) {
      console.error("[BiometricSetup] Failed to check biometric capability:", error);
      setBiometricAvailable(false);
    }
  };

  const handleSetupBiometric = async () => {
    setLoading(true);
    try {
      console.log("[BiometricSetup] Starting biometric setup for:", email);

      // Authenticate with biometric
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Set up biometric authentication",
        fallbackLabel: "Use passcode",
        disableDeviceFallback: false,
      });

      if (!result.success) {
        console.log("[BiometricSetup] Biometric authentication cancelled or failed");
        onComplete(null);
        return;
      }

      console.log("[BiometricSetup] Biometric authentication successful");

      // Generate a unique public key for this biometric credential
      // In a real implementation, this would be a cryptographic key pair
      // For now, we'll use a simple unique identifier
      const biometricPublicKey = `biometric_${email}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      console.log("[BiometricSetup] Generated biometric public key, registering with backend");

      // Register biometric credential with backend
      const { apiPost } = await import("@/utils/api");
      await apiPost("/api/biometric/register", {
        email,
        biometricPublicKey,
      });

      console.log("[BiometricSetup] Biometric credential registered with backend successfully");

      // Store the biometric key locally for future sign-ins
      const { storeBiometricKey } = await import("@/lib/auth");
      await storeBiometricKey(email, biometricPublicKey);

      // Store the last used email for biometric sign-in
      await setLastUsedEmail(email);
      console.log("[BiometricSetup] Stored biometric key and email for future sign-ins");

      onComplete(biometricPublicKey);
    } catch (error) {
      console.error("[BiometricSetup] Biometric setup failed:", error);
      onComplete(null);
    } finally {
      setLoading(false);
    }
  };

  if (!biometricAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="warning"
            size={64}
            color="#FF9500"
          />
        </View>
        <Text style={styles.title}>Biometric Not Available</Text>
        <Text style={styles.description}>
          Your device does not support biometric authentication or it is not set up.
          Please set up biometric authentication in your device settings.
        </Text>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Continue Without Biometric</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <IconSymbol
          ios_icon_name="faceid"
          android_material_icon_name="fingerprint"
          size={64}
          color="#007AFF"
        />
      </View>
      <Text style={styles.title}>Set Up Biometric Authentication</Text>
      <Text style={styles.description}>
        Use {biometricType} to quickly and securely sign in to Kenya Civic.
      </Text>

      <TouchableOpacity
        style={[styles.setupButton, loading && styles.buttonDisabled]}
        onPress={handleSetupBiometric}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.setupButtonText}>Enable Biometric</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={onSkip} disabled={loading}>
        <Text style={styles.skipButtonText}>Skip for Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#000",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  setupButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  setupButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  skipButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
