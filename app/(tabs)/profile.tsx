import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import { authenticatedGet, authenticatedPut } from "@/utils/api";
import CustomModal from "@/components/ui/Modal";
import { useRouter } from "expo-router";

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

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [editing, setEditing] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "success" | "error",
  });

  useEffect(() => {
    loadAgent();
  }, []);

  const loadAgent = async () => {
    try {
      setLoading(true);
      const response = await authenticatedGet<Agent>("/api/agents/me");
      setAgent(response);
      setFirstName(response.firstName);
      setLastName(response.lastName);
    } catch (error: any) {
      console.error("[Profile] Failed to load agent:", error);
      // If agent not found, redirect to registration
      if (error.message?.includes("404") || error.message?.includes("not found")) {
        router.replace("/(tabs)/register");
      }
    } finally {
      setLoading(false);
    }
  };

  const showModal = (title: string, message: string, type: "info" | "success" | "error") => {
    setModalConfig({ title, message, type });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!firstName || !lastName) {
      showModal("Error", "First name and last name are required", "error");
      return;
    }

    setSaving(true);
    try {
      const response = await authenticatedPut<Agent>("/api/agents/me", {
        firstName,
        lastName,
      });
      setAgent(response);
      setEditing(false);
      showModal("Success", "Profile updated successfully", "success");
    } catch (error: any) {
      console.error("[Profile] Failed to update profile:", error);
      showModal("Error", "Failed to update profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/auth");
    } catch (error) {
      console.error("[Profile] Sign out failed:", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!agent) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
          Agent profile not found
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.replace("/(tabs)/register")}
        >
          <Text style={styles.buttonText}>Register as Agent</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== "ios" && styles.contentContainerWithTabBar,
        ]}
      >
        <GlassView
          style={[
            styles.profileHeader,
            Platform.OS !== "ios" && {
              backgroundColor: theme.dark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
          glassEffectStyle="regular"
        >
          <IconSymbol
            ios_icon_name="person.circle.fill"
            android_material_icon_name="person"
            size={80}
            color={theme.colors.primary}
          />
          
          {editing ? (
            <>
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="First Name"
                placeholderTextColor={theme.dark ? "#666" : "#999"}
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Last Name"
                placeholderTextColor={theme.dark ? "#666" : "#999"}
                value={lastName}
                onChangeText={setLastName}
              />
            </>
          ) : (
            <>
              <Text style={[styles.name, { color: theme.colors.text }]}>
                {agent.firstName} {agent.lastName}
              </Text>
              <Text style={[styles.civicCode, { color: theme.colors.primary }]}>
                {agent.civicCode}
              </Text>
            </>
          )}
          
          <Text style={[styles.email, { color: theme.dark ? "#98989D" : "#666" }]}>
            {agent.email}
          </Text>
        </GlassView>

        <GlassView
          style={[
            styles.section,
            Platform.OS !== "ios" && {
              backgroundColor: theme.dark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
          glassEffectStyle="regular"
        >
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="location.fill"
              android_material_icon_name="location-on"
              size={20}
              color={theme.dark ? "#98989D" : "#666"}
            />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {agent.county}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="building.2.fill"
              android_material_icon_name="business"
              size={20}
              color={theme.dark ? "#98989D" : "#666"}
            />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {agent.constituency}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="map.fill"
              android_material_icon_name="map"
              size={20}
              color={theme.dark ? "#98989D" : "#666"}
            />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {agent.ward}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={20}
              color={theme.dark ? "#98989D" : "#666"}
            />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {new Date(agent.dateOfBirth).toLocaleDateString()}
            </Text>
          </View>
        </GlassView>

        <View style={styles.buttonContainer}>
          {editing ? (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setEditing(false);
                  setFirstName(agent.firstName);
                  setLastName(agent.lastName);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={() => setEditing(true)}
              >
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.signOutButton]}
                onPress={handleSignOut}
              >
                <Text style={styles.buttonText}>Sign Out</Text>
              </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  contentContainer: {
    padding: 20,
  },
  contentContainerWithTabBar: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: "center",
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    gap: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
  },
  civicCode: {
    fontSize: 18,
    fontWeight: "600",
  },
  email: {
    fontSize: 16,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "#F44336",
  },
});
