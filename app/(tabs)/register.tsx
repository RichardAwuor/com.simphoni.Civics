
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost } from "@/utils/api";
import CustomModal from "@/components/ui/Modal";
import BiometricSetup from "@/components/BiometricSetup";
import { useRouter } from "expo-router";

interface County {
  name: string;
  code: string;
}

interface Constituency {
  name: string;
  code: string;
  county: string;
}

interface Ward {
  name: string;
  code: string;
  constituency: string;
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

type RegistrationStep = "form" | "biometric" | "complete";

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>("form");
  const [needsAuth, setNeedsAuth] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [county, setCounty] = useState("");
  const [constituency, setConstituency] = useState("");
  const [ward, setWard] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nationalId, setNationalId] = useState("");

  // Location data
  const [counties, setCounties] = useState<County[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "success" | "error",
  });

  useEffect(() => {
    loadCounties();
    // Check if user is authenticated
    if (!authLoading && !user) {
      setNeedsAuth(true);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (county) {
      loadConstituencies(county);
      setConstituency("");
      setWard("");
      setConstituencies([]);
      setWards([]);
    }
  }, [county]);

  useEffect(() => {
    if (constituency) {
      loadWards(constituency);
      setWard("");
      setWards([]);
    }
  }, [constituency]);

  const loadCounties = async () => {
    try {
      console.log("[Register] Loading counties...");
      const response = await apiGet<County[]>("/api/locations/counties");
      console.log("[Register] Counties loaded successfully:", response.length, "counties");
      setCounties(response);
    } catch (error) {
      console.error("[Register] Failed to load counties:", error);
      showModal("Error", "Failed to load counties. Please try again.", "error");
    }
  };

  const loadConstituencies = async (countyName: string) => {
    setLoadingConstituencies(true);
    try {
      console.log("[Register] Loading constituencies for county:", countyName);
      const response = await apiGet<Constituency[]>(
        `/api/locations/constituencies/${encodeURIComponent(countyName)}`
      );
      console.log("[Register] Constituencies loaded successfully:", response.length, "constituencies");
      setConstituencies(response);
    } catch (error) {
      console.error("[Register] Failed to load constituencies:", error);
      showModal("Error", "Failed to load constituencies. Please try again.", "error");
    } finally {
      setLoadingConstituencies(false);
    }
  };

  const loadWards = async (constituencyName: string) => {
    setLoadingWards(true);
    try {
      console.log("[Register] Loading wards for constituency:", constituencyName);
      const response = await apiGet<Ward[]>(
        `/api/locations/wards/${encodeURIComponent(constituencyName)}`
      );
      console.log("[Register] Wards loaded successfully:", response.length, "wards");
      setWards(response);
    } catch (error) {
      console.error("[Register] Failed to load wards:", error);
      showModal("Error", "Failed to load wards. Please try again.", "error");
    } finally {
      setLoadingWards(false);
    }
  };

  const showModal = (title: string, message: string, type: "info" | "success" | "error") => {
    setModalConfig({ title, message, type });
    setModalVisible(true);
  };

  const handleRegister = async () => {
    // Validation
    if (!email || !confirmEmail || !firstName || !lastName || !county || !constituency || !ward || !nationalId) {
      showModal("Error", "Please fill in all required fields", "error");
      return;
    }

    if (email !== confirmEmail) {
      showModal("Error", "Email addresses do not match", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showModal("Error", "Please enter a valid email address", "error");
      return;
    }

    if (nationalId.length !== 8) {
      showModal("Error", "National ID must be 8 digits", "error");
      return;
    }

    if (!/^\d{8}$/.test(nationalId)) {
      showModal("Error", "National ID must contain only numbers", "error");
      return;
    }

    setLoading(true);
    try {
      // If user is not authenticated, send email magic link first
      if (!user) {
        console.log("[Register] User not authenticated, sending magic link to:", email);
        const { authClient } = await import("@/lib/auth");
        
        await authClient.signIn.email({
          email,
          callbackURL: "/auth-callback",
        });

        showModal(
          "Check Your Email",
          "We've sent you a sign-in link. Please click the link in your email to continue registration.",
          "info"
        );

        // Store registration data temporarily for after authentication
        if (Platform.OS === "web") {
          localStorage.setItem("pending_registration", JSON.stringify({
            email,
            confirmEmail,
            firstName,
            lastName,
            county,
            constituency,
            ward,
            dateOfBirth: dateOfBirth.toISOString().split("T")[0],
            nationalId,
          }));
        } else {
          const SecureStore = await import("expo-secure-store");
          await SecureStore.default.setItemAsync("pending_registration", JSON.stringify({
            email,
            confirmEmail,
            firstName,
            lastName,
            county,
            constituency,
            ward,
            dateOfBirth: dateOfBirth.toISOString().split("T")[0],
            nationalId,
          }));
        }
        return;
      }

      // User is authenticated, proceed with registration
      console.log("[Register] Submitting registration form");
      const { authenticatedPost } = await import("@/utils/api");
      const response = await authenticatedPost<{ agent: Agent; success: boolean }>(
        "/api/agents/register",
        {
          email,
          confirmEmail,
          firstName,
          lastName,
          county,
          constituency,
          ward,
          dateOfBirth: dateOfBirth.toISOString().split("T")[0],
          nationalId,
        }
      );

      if (response.success) {
        setAgent(response.agent);
        console.log("[Register] Registration successful, moving to biometric setup");
        showModal(
          "Success",
          `Registration successful! Your Civic Code is: ${response.agent.civicCode}`,
          "success"
        );
        // Move to biometric setup step
        setTimeout(() => {
          setRegistrationStep("biometric");
        }, 2000);
      }
    } catch (error: any) {
      console.error("[Register] Registration failed:", error);
      showModal("Error", error.message || "Registration failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricComplete = async (biometricPublicKey: string | null) => {
    if (!biometricPublicKey) {
      console.error("[Register] Biometric setup failed - no public key returned");
      showModal("Error", "Biometric setup failed. Please try again.", "error");
      return;
    }

    console.log("[Register] Biometric setup complete, registration successful");
    setRegistrationStep("complete");
    showModal(
      "Success",
      "Registration complete! You can now sign in with your biometric.",
      "success"
    );
    setTimeout(() => {
      router.replace("/(tabs)/(home)/");
    }, 2000);
  };

  const handleBiometricSkip = () => {
    console.log("[Register] User cannot skip biometric setup - it is required");
    showModal("Required", "Biometric setup is required to complete registration", "error");
  };

  if (agent && registrationStep === "complete") {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: "white" }]}>
        <Text style={[styles.successText, { color: "#000" }]}>
          Registration Complete!
        </Text>
        <Text style={[styles.civicCode, { color: theme.colors.primary }]}>
          {agent.civicCode}
        </Text>
      </View>
    );
  }

  if (registrationStep === "biometric" && agent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "white" }]} edges={["top"]}>
        <View style={styles.biometricHeader}>
          <Image
            source={require("@/assets/images/d8b57700-6b85-43a6-9b94-d3810c5a9213.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={[styles.biometricTitle, { color: "#000" }]}>
            Set Fingerprint
          </Text>
          <Text style={[styles.biometricSubtitle, { color: "#666" }]}>
            Required to log into the app
          </Text>
        </View>
        <BiometricSetup
          email={agent.email}
          onComplete={handleBiometricComplete}
          onSkip={handleBiometricSkip}
        />
        <CustomModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
      </SafeAreaView>
    );
  }

  const countySelected = !!county;
  const constituencySelected = !!constituency;
  const constituenciesAvailable = constituencies.length > 0;
  const wardsAvailable = wards.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "white" }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/d8b57700-6b85-43a6-9b94-d3810c5a9213.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { color: "#000" }]}>New Agent Registration</Text>
        <Text style={[styles.subtitle, { color: "#666" }]}>
          WANJIKU@63
        </Text>

        {needsAuth && !user && (
          <View style={[styles.infoBox, { backgroundColor: "#f0f0f0", borderColor: theme.colors.primary }]}>
            <Text style={[styles.infoText, { color: "#000" }]}>
              ℹ️ You'll receive an email link to verify your identity after submitting this form.
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <Text style={[styles.label, { color: "#000" }]}>Email *</Text>
          <TextInput
            style={[styles.input, { color: "#000", borderColor: "#FF0000", backgroundColor: "#fff" }]}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: "#000" }]}>Confirm Email *</Text>
          <TextInput
            style={[styles.input, { color: "#000", borderColor: "#FF0000", backgroundColor: "#fff" }]}
            placeholder="Confirm your email"
            placeholderTextColor="#999"
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: "#000" }]}>First Name *</Text>
          <TextInput
            style={[styles.input, { color: "#000", borderColor: "#FF0000", backgroundColor: "#fff" }]}
            placeholder="Enter your first name"
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={setFirstName}
          />

          <Text style={[styles.label, { color: "#000" }]}>Last Name *</Text>
          <TextInput
            style={[styles.input, { color: "#000", borderColor: "#FF0000", backgroundColor: "#fff" }]}
            placeholder="Enter your last name"
            placeholderTextColor="#999"
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={[styles.label, { color: "#000" }]}>County *</Text>
          <View style={[styles.pickerContainer, { borderColor: "#FF0000", backgroundColor: "#fff" }]}>
            <Picker
              selectedValue={county}
              onValueChange={(value) => setCounty(value)}
              style={[styles.picker, { color: "#000" }]}
            >
              <Picker.Item label="Select County" value="" />
              {counties.map((c) => (
                <Picker.Item key={c.code} label={c.name} value={c.name} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.label, { color: "#000" }]}>Constituency *</Text>
          {!countySelected && (
            <Text style={[styles.helperText, { color: "#999", marginTop: 4 }]}>
              Please select a county first
            </Text>
          )}
          {countySelected && loadingConstituencies && (
            <View style={[styles.loadingIndicator, { borderColor: "#FF0000", backgroundColor: "#fff" }]}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: "#666" }]}>Loading constituencies...</Text>
            </View>
          )}
          {countySelected && !loadingConstituencies && (
            <View style={[styles.pickerContainer, { borderColor: "#FF0000", backgroundColor: "#fff" }]}>
              <Picker
                selectedValue={constituency}
                onValueChange={(value) => setConstituency(value)}
                style={[styles.picker, { color: "#000" }]}
                enabled={constituenciesAvailable}
              >
                <Picker.Item 
                  label={constituenciesAvailable ? "Select Constituency" : "No constituencies available"} 
                  value="" 
                />
                {constituencies.map((c) => (
                  <Picker.Item key={c.code} label={c.name} value={c.name} />
                ))}
              </Picker>
            </View>
          )}

          <Text style={[styles.label, { color: "#000" }]}>Ward *</Text>
          {!constituencySelected && (
            <Text style={[styles.helperText, { color: "#999", marginTop: 4 }]}>
              Please select a constituency first
            </Text>
          )}
          {constituencySelected && loadingWards && (
            <View style={[styles.loadingIndicator, { borderColor: "#FF0000", backgroundColor: "#fff" }]}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: "#666" }]}>Loading wards...</Text>
            </View>
          )}
          {constituencySelected && !loadingWards && (
            <View style={[styles.pickerContainer, { borderColor: "#FF0000", backgroundColor: "#fff" }]}>
              <Picker
                selectedValue={ward}
                onValueChange={(value) => setWard(value)}
                style={[styles.picker, { color: "#000" }]}
                enabled={wardsAvailable}
              >
                <Picker.Item 
                  label={wardsAvailable ? "Select Ward" : "No wards available"} 
                  value="" 
                />
                {wards.map((w) => (
                  <Picker.Item key={w.code} label={w.name} value={w.name} />
                ))}
              </Picker>
            </View>
          )}

          <Text style={[styles.label, { color: "#000" }]}>Date of Birth *</Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: "#FF0000", backgroundColor: "#fff" }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: "#000" }}>
              {dateOfBirth.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setDateOfBirth(selectedDate);
                }
              }}
              maximumDate={new Date()}
            />
          )}

          <Text style={[styles.label, { color: "#000" }]}>8-Digit National ID Number *</Text>
          <TextInput
            style={[styles.input, { color: "#000", borderColor: "#FF0000", backgroundColor: "#fff" }]}
            placeholder="Enter 8-digit National ID"
            placeholderTextColor="#999"
            value={nationalId}
            onChangeText={setNationalId}
            keyboardType="number-pad"
            maxLength={8}
          />
          <Text style={[styles.helperText, { color: "#666" }]}>
            Will be encrypted and replaced with auto-generated Civic Code
          </Text>

          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: "#FF0000" }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Continue to Fingerprint Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  successText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  civicCode: {
    fontSize: 20,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  headerLogo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  biometricHeader: {
    alignItems: "center",
    padding: 20,
  },
  biometricTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  biometricSubtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    justifyContent: "center",
  },
  helperText: {
    fontSize: 12,
    marginTop: -8,
    fontStyle: "italic",
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  loadingIndicator: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  registerButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
