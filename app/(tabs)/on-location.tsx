
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Camera } from "expo-camera";
import { authenticatedGet, authenticatedUpload } from "@/utils/api";
import CustomModal from "@/components/ui/Modal";

interface Video {
  id: string;
  videoCode: string;
  videoUrl: string;
  latitude: number;
  longitude: number;
  locationName: string;
  uploadedAt: string;
}

interface Form34A {
  id: string;
  serialNumber: string;
  imageUrl: string;
  county: string;
  constituency: string;
  ward: string;
  pollingStation: string;
  submittedAt: string;
  candidates: Array<{
    candidateFirstName: string;
    candidateLastName: string;
    partyName: string;
    votes: number;
  }>;
}

interface Agent {
  county: string;
  constituency: string;
  ward: string;
}

export default function OnLocationScreen() {
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [form34a, setForm34a] = useState<Form34A | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "success" | "error",
  });

  useEffect(() => {
    loadData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (cameraStatus !== "granted" || locationStatus !== "granted") {
      showModal("Permissions Required", "Camera and location permissions are required for this feature", "error");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get agent info
      const agentResponse = await authenticatedGet<Agent>("/api/agents/me");
      setAgent(agentResponse);

      // Get videos
      const videosResponse = await authenticatedGet<Video[]>("/api/incidents/my-videos");
      setVideos(videosResponse);

      // Get form34a submission
      const form34aResponse = await authenticatedGet<Form34A | null>("/api/form34a/my-submission");
      setForm34a(form34aResponse);

      // Get current location
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    } catch (error: any) {
      console.error("[OnLocation] Failed to load data:", error);
      showModal("Error", "Failed to load data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showModal = (title: string, message: string, type: "info" | "success" | "error") => {
    setModalConfig({ title, message, type });
    setModalVisible(true);
  };

  const handleRecordVideo = async () => {
    if (videos.length >= 3) {
      showModal("Limit Reached", "You can only upload a maximum of 3 videos", "error");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "videos" as any,
        videoMaxDuration: 60,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadVideo(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error("[OnLocation] Video recording failed:", error);
      showModal("Error", "Failed to record video. Please try again.", "error");
    }
  };

  const uploadVideo = async (videoUri: string) => {
    if (!location) {
      showModal("Error", "Location not available. Please enable location services.", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("video", {
        uri: videoUri,
        type: "video/mp4",
        name: "incident.mp4",
      } as any);
      formData.append("latitude", location.coords.latitude.toString());
      formData.append("longitude", location.coords.longitude.toString());
      formData.append("locationName", "Current Location");

      const data = await authenticatedUpload("/api/incidents/upload-video", formData);
      showModal("Success", `Video uploaded successfully! Code: ${data.videoCode}`, "success");
      loadData();
    } catch (error: any) {
      console.error("[OnLocation] Video upload failed:", error);
      showModal("Error", "Failed to upload video. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm34A = async () => {
    if (form34a) {
      showModal("Already Submitted", "You have already submitted a Form 34A", "info");
      return;
    }

    if (!agent) {
      showModal("Error", "Agent information not available", "error");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images" as any,
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadForm34A(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error("[OnLocation] Form 34A capture failed:", error);
      showModal("Error", "Failed to capture Form 34A. Please try again.", "error");
    }
  };

  const uploadForm34A = async (imageUri: string) => {
    if (!location || !agent) {
      showModal("Error", "Location or agent information not available", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("form34a", {
        uri: imageUri,
        type: "image/jpeg",
        name: "form34a.jpg",
      } as any);
      formData.append("county", agent.county);
      formData.append("constituency", agent.constituency);
      formData.append("ward", agent.ward);
      formData.append("pollingStation", "Polling Station"); // This should be collected from user
      formData.append("latitude", location.coords.latitude.toString());
      formData.append("longitude", location.coords.longitude.toString());

      const data = await authenticatedUpload("/api/form34a/submit", formData);
      showModal(
        "Success",
        `Form 34A submitted successfully! Serial: ${data.serialNumber}${
          data.hasDiscrepancy ? "\n⚠️ Discrepancy detected!" : ""
        }`,
        data.hasDiscrepancy ? "error" : "success"
      );
      loadData();
    } catch (error: any) {
      console.error("[OnLocation] Form 34A upload failed:", error);
      showModal("Error", "Failed to upload Form 34A. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !videos.length && !form34a) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>On-Location Reporting</Text>
        <Text style={[styles.subtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
          WANJIKU@63
        </Text>

        {/* Video Recording Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Incident Videos ({videos.length}/3)
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.dark ? "#98989D" : "#666" }]}>
            Record incidents (max 1 minute per video)
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.primary },
              videos.length >= 3 && styles.disabledButton,
            ]}
            onPress={handleRecordVideo}
            disabled={loading || videos.length >= 3}
          >
            <Text style={styles.actionButtonText}>
              {videos.length >= 3 ? "Maximum Videos Reached" : "📹 Record Incident Video"}
            </Text>
          </TouchableOpacity>

          {videos.map((video, index) => (
            <View key={video.id} style={[styles.videoItem, { borderColor: theme.colors.border }]}>
              <Text style={[styles.videoCode, { color: theme.colors.text }]}>
                {video.videoCode}
              </Text>
              <Text style={[styles.videoLocation, { color: theme.dark ? "#98989D" : "#666" }]}>
                {video.locationName}
              </Text>
              <Text style={[styles.videoDate, { color: theme.dark ? "#98989D" : "#666" }]}>
                {new Date(video.uploadedAt).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Form 34A Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Form 34A</Text>
          <Text style={[styles.sectionDescription, { color: theme.dark ? "#98989D" : "#666" }]}>
            Scan and submit Form 34A (one per agent)
          </Text>

          {form34a ? (
            <View style={[styles.form34aSubmitted, { borderColor: "#4CAF50" }]}>
              <Text style={[styles.form34aTitle, { color: "#4CAF50" }]}>✓ Form 34A Submitted</Text>
              <Text style={[styles.form34aSerial, { color: theme.colors.text }]}>
                Serial: {form34a.serialNumber}
              </Text>
              <Text style={[styles.form34aDate, { color: theme.dark ? "#98989D" : "#666" }]}>
                {new Date(form34a.submittedAt).toLocaleString()}
              </Text>
              {form34a.imageUrl && (
                <Image source={{ uri: form34a.imageUrl }} style={styles.form34aImage} />
              )}
              {form34a.candidates && form34a.candidates.length > 0 && (
                <View style={styles.candidatesContainer}>
                  <Text style={[styles.candidatesTitle, { color: theme.colors.text }]}>
                    Extracted Results:
                  </Text>
                  {form34a.candidates.map((candidate, index) => (
                    <Text key={index} style={[styles.candidateText, { color: theme.colors.text }]}>
                      {candidate.candidateFirstName} {candidate.candidateLastName} ({candidate.partyName}): {candidate.votes} votes
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSubmitForm34A}
              disabled={loading}
            >
              <Text style={styles.actionButtonText}>📄 Scan & Submit Form 34A</Text>
            </TouchableOpacity>
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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  actionButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  videoItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  videoCode: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  videoLocation: {
    fontSize: 14,
    marginBottom: 2,
  },
  videoDate: {
    fontSize: 12,
  },
  form34aSubmitted: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
  },
  form34aTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  form34aSerial: {
    fontSize: 16,
    marginBottom: 4,
  },
  form34aDate: {
    fontSize: 14,
    marginBottom: 12,
  },
  form34aImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  candidatesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  candidatesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  candidateText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
