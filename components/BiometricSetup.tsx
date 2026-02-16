
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

interface BiometricSetupProps {
  email: string;
  onComplete: (biometricPublicKey: string | null) => void;
  onSkip: () => void;
}

export default function BiometricSetup({ email, onComplete, onSkip }: BiometricSetupProps) {
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("fingerprint");
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    checkBiometricCapability();
  }, []);

  const checkBiometricCapability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsAvailable(compatible && enrolled);

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("face");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("fingerprint");
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType("iris");
      }

      console.log("[BiometricSetup] Available:", compatible && enrolled, "Type:", biometricType);
    } catch (error) {
      console.error("[BiometricSetup] Error checking capability:", error);
      setIsAvailable(false);
    }
  };

  const handleSetupBiometric = async () => {
    setLoading(true);
    try {
      console.log("[BiometricSetup] Starting biometric enrollment");
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Set up biometric authentication",
        fallbackLabel: "Use passcode",
        disableDeviceFallback: false,
      });

      if (result.success) {
        console.log("[BiometricSetup] Biometric authentication successful");
        
        // Generate a unique identifier for this device's biometric credential
        // In production, this would be a secure key stored in the device's secure enclave
        const biometricPublicKey = `${email}_${Platform.OS}_${Date.now()}`;
        
        // Register biometric with backend
        try {
          const { apiPost } = await import("@/utils/api");
          await apiPost("/api/biometric/register", {
            email,
            biometricPublicKey,
          });
          console.log("[BiometricSetup] Biometric registered with backend");
        } catch (error) {
          console.error("[BiometricSetup] Failed to register biometric with backend:", error);
          // Continue anyway - store locally
        }
        
        // Store the biometric key locally for future sign-ins
        const storageKey = `biometric_key_${email}`;
        if (Platform.OS === "web") {
          localStorage.setItem(storageKey, biometricPublicKey);
        } else {
          await SecureStore.setItemAsync(storageKey, biometricPublicKey);
        }
        
        console.log("[BiometricSetup] Generated and stored biometric key");
        onComplete(biometricPublicKey);
      } else {
        console.log("[BiometricSetup] Biometric authentication failed or cancelled");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("[BiometricSetup] Biometric setup failed:", error);
      setLoading(false);
    }
  };

  if (!isAvailable) {
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
          Your device doesn&apos;t have biometric authentication set up. You can skip this step and use email verification to sign in.
        </Text>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Continue without Biometric</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const biometricLabel = biometricType === "face" ? "Face ID" : "Fingerprint";
  const biometricIcon = biometricType === "face" ? "face" : "fingerprint";

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <IconSymbol
          ios_icon_name={biometricType === "face" ? "faceid" : "touchid"}
          android_material_icon_name={biometricIcon}
          size={64}
          color="#007AFF"
        />
      </View>

      <Text style={styles.title}>Set Up {biometricLabel}</Text>
      <Text style={styles.description}>
        Use {biometricLabel} for quick and secure access to Kenya Civic. You can always sign in with your email if needed.
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleSetupBiometric}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Enable {biometricLabel}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
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
  primaryButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
});
