
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@/contexts/AuthContext";
import { authenticatedGet, authenticatedPost } from "@/utils/api";
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
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [checkingAgent, setCheckingAgent] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>("form");

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
    checkExistingAgent();
    loadCounties();
  }, []);

  useEffect(() => {
    if (county) {
      loadConstituencies(county);
    }
  }, [county]);

  useEffect(() => {
    if (constituency) {
      loadWards(constituency);
    }
  }, [constituency]);

  const checkExistingAgent = async () => {
    try {
      setCheckingAgent(true);
      const response = await authenticatedGet<Agent>("/api/agents/me");
      if (response) {
        setAgent(response);
        // If agent exists, redirect to home
        router.replace("/(tabs)/(home)/");
      }
    } catch (error: any) {
      console.log("[Register] No existing agent found, showing registration form");
    } finally {
      setCheckingAgent(false);
    }
  };

  const loadCounties = async () => {
    try {
      console.log("[Register] Loading counties...");
      const response = await authenticatedGet<County[]>("/api/locations/counties");
      console.log("[Register] Counties loaded successfully:", response.length, "counties");
      setCounties(response);
    } catch (error) {
      console.error("[Register] Failed to load counties:", error);
    }
  };

  const loadConstituencies = async (countyName: string) => {
    try {
      console.log("[Register] Loading constituencies for county:", countyName);
      const response = await authenticatedGet<Constituency[]>(
        `/api/locations/constituencies/${encodeURIComponent(countyName)}`
      );
      console.log("[Register] Constituencies loaded successfully:", response.length, "constituencies");
      setConstituencies(response);
      setConstituency("");
      setWard("");
    } catch (error) {
      console.error("[Register] Failed to load constituencies:", error);
    }
  };

  const loadWards = async (constituencyName: string) => {
    try {
      console.log("[Register] Loading wards for constituency:", constituencyName);
      const response = await authenticatedGet<Ward[]>(
        `/api/locations/wards/${encodeURIComponent(constituencyName)}`
      );
      console.log("[Register] Wards loaded successfully:", response.length, "wards");
      setWards(response);
      setWard("");
    } catch (error) {
      console.error("[Register] Failed to load wards:", error);
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

    if (nationalId.length !== 8) {
      showModal("Error", "National ID must be 8 digits", "error");
      return;
    }

    setLoading(true);
    try {
      console.log("[Register] Submitting registration form");
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
        // Move to biometric setup step
        setRegistrationStep("biometric");
      }
    } catch (error: any) {
      console.error("[Register] Registration failed:", error);
      showModal("Error", error.message || "Registration failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricComplete = async (biometricPublicKey: string | null) => {
    if (biometricPublicKey && agent) {
      try {
        console.log("[Register] Registering biometric credential");
        await authenticatedPost("/api/biometric/register", {
          email: agent.email,
          biometricPublicKey,
        });
        console.log("[Register] Biometric registration successful");
      } catch (error) {
        console.error("[Register] Failed to register biometric:", error);
        // Don't block registration if biometric fails
      }
    }

    // Show success message and redirect
    setRegistrationStep("complete");
    showModal(
      "Success",
      `Registration complete! Your Civic Code is: ${agent?.civicCode}`,
      "success"
    );
    setTimeout(() => {
      router.replace("/(tabs)/(home)/");
    }, 2000);
  };

  const handleBiometricSkip = () => {
    console.log("[Register] User skipped biometric setup");
    handleBiometricComplete(null);
  };

  if (checkingAgent) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Checking registration status...
        </Text>
      </View>
    );
  }

  if (agent && registrationStep === "complete") {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.successText, { color: theme.colors.text }]}>
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Agent Registration</Text>
        <Text style={[styles.subtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
          WANJIKU@63
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Email *</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Enter your email"
            placeholderTextColor={theme.dark ? "#666" : "#999"}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: theme.colors.text }]}>Confirm Email *</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Confirm your email"
            placeholderTextColor={theme.dark ? "#666" : "#999"}
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: theme.colors.text }]}>First Name *</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Enter your first name"
            placeholderTextColor={theme.dark ? "#666" : "#999"}
            value={firstName}
            onChangeText={setFirstName}
          />

          <Text style={[styles.label, { color: theme.colors.text }]}>Last Name *</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Enter your last name"
            placeholderTextColor={theme.dark ? "#666" : "#999"}
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={[styles.label, { color: theme.colors.text }]}>County *</Text>
          <View style={[styles.pickerContainer, { borderColor: theme.colors.border }]}>
            <Picker
              selectedValue={county}
              onValueChange={(value) => setCounty(value)}
              style={[styles.picker, { color: theme.colors.text }]}
            >
              <Picker.Item label="Select County" value="" />
              {counties.map((c) => (
                <Picker.Item key={c.code} label={c.name} value={c.name} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.label, { color: theme.colors.text }]}>Constituency *</Text>
          <View style={[styles.pickerContainer, { borderColor: theme.colors.border }]}>
            <Picker
              selectedValue={constituency}
              onValueChange={(value) => setConstituency(value)}
              style={[styles.picker, { color: theme.colors.text }]}
              enabled={!!county}
            >
              <Picker.Item label="Select Constituency" value="" />
              {constituencies.map((c) => (
                <Picker.Item key={c.code} label={c.name} value={c.name} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.label, { color: theme.colors.text }]}>Ward *</Text>
          <View style={[styles.pickerContainer, { borderColor: theme.colors.border }]}>
            <Picker
              selectedValue={ward}
              onValueChange={(value) => setWard(value)}
              style={[styles.picker, { color: theme.colors.text }]}
              enabled={!!constituency}
            >
              <Picker.Item label="Select Ward" value="" />
              {wards.map((w) => (
                <Picker.Item key={w.code} label={w.name} value={w.name} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.label, { color: theme.colors.text }]}>Date of Birth *</Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: theme.colors.text }}>
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

          <Text style={[styles.label, { color: theme.colors.text }]}>National ID (8 digits) *</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Enter 8-digit National ID"
            placeholderTextColor={theme.dark ? "#666" : "#999"}
            value={nationalId}
            onChangeText={setNationalId}
            keyboardType="number-pad"
            maxLength={8}
          />

          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Continue to Biometric Setup</Text>
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
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
});
