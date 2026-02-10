import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { authenticatedGet } from "@/utils/api";
import CustomModal from "@/components/ui/Modal";

interface CandidateVotes {
  candidateFirstName: string;
  candidateLastName: string;
  partyName: string;
  totalVotes: number;
  formsCount: number;
}

interface IncidentVideo {
  videoCode: string;
  videoUrl: string;
  agentCivicCode: string;
  county: string;
  constituency: string;
  ward: string;
  latitude: number;
  longitude: number;
  uploadedAt: string;
}

interface SerialDiscrepancy {
  serialNumber: string;
  submissionCount: number;
  forms: Array<{
    agentCode: string;
    county: string;
    constituency: string;
    ward: string;
    submittedAt: string;
  }>;
}

interface PollingStation {
  pollingStation: string;
  county: string;
  constituency: string;
  ward: string;
  stationCode: string;
  hasSubmission: boolean;
}

interface ExtraSubmission {
  pollingStation: string;
  county: string;
  constituency: string;
  ward: string;
  submissions: Array<{
    agentCode: string;
    submittedAt: string;
  }>;
}

interface DuplicateSubmission {
  type: "same_station" | "same_serial";
  pollingStation?: string;
  serialNumber?: string;
  submissions: Array<{
    agentCode: string;
    submittedAt: string;
  }>;
}

interface County {
  name: string;
  code: string;
}

export default function DashboardScreen() {
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<string>("candidate-votes");

  // Filters
  const [counties, setCounties] = useState<County[]>([]);
  const [selectedCounty, setSelectedCounty] = useState("");
  const [agentCodeSearch, setAgentCodeSearch] = useState("");

  // Data
  const [candidateVotes, setCandidateVotes] = useState<CandidateVotes[]>([]);
  const [incidentVideos, setIncidentVideos] = useState<IncidentVideo[]>([]);
  const [serialDiscrepancies, setSerialDiscrepancies] = useState<SerialDiscrepancy[]>([]);
  const [missingSubmissions, setMissingSubmissions] = useState<PollingStation[]>([]);
  const [extraSubmissions, setExtraSubmissions] = useState<ExtraSubmission[]>([]);
  const [duplicateSubmissions, setDuplicateSubmissions] = useState<DuplicateSubmission[]>([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "success" | "error",
  });

  useEffect(() => {
    loadCounties();
    loadReport();
  }, [activeReport, selectedCounty]);

  const loadCounties = async () => {
    try {
      const response = await authenticatedGet<County[]>("/api/locations/counties");
      setCounties(response);
    } catch (error) {
      console.error("[Dashboard] Failed to load counties:", error);
    }
  };

  const showModal = (title: string, message: string, type: "info" | "success" | "error") => {
    setModalConfig({ title, message, type });
    setModalVisible(true);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      switch (activeReport) {
        case "candidate-votes":
          await loadCandidateVotes();
          break;
        case "incident-videos":
          if (selectedCounty) {
            await loadIncidentVideos();
          }
          break;
        case "serial-discrepancies":
          await loadSerialDiscrepancies();
          break;
        case "missing-submissions":
          await loadMissingSubmissions();
          break;
        case "extra-submissions":
          await loadExtraSubmissions();
          break;
        case "duplicate-submissions":
          await loadDuplicateSubmissions();
          break;
      }
    } catch (error: any) {
      console.error("[Dashboard] Failed to load report:", error);
      showModal("Error", "Failed to load report data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCandidateVotes = async () => {
    const params = selectedCounty ? `?county=${encodeURIComponent(selectedCounty)}` : "";
    const response = await authenticatedGet<CandidateVotes[]>(`/api/dashboard/candidate-votes${params}`);
    setCandidateVotes(response);
  };

  const loadIncidentVideos = async () => {
    if (!selectedCounty) return;
    const response = await authenticatedGet<IncidentVideo[]>(
      `/api/dashboard/incident-videos?county=${encodeURIComponent(selectedCounty)}`
    );
    setIncidentVideos(response);
  };

  const loadSerialDiscrepancies = async () => {
    const params = selectedCounty ? `?county=${encodeURIComponent(selectedCounty)}` : "";
    const response = await authenticatedGet<SerialDiscrepancy[]>(`/api/dashboard/serial-discrepancies${params}`);
    setSerialDiscrepancies(response);
  };

  const loadMissingSubmissions = async () => {
    const params = selectedCounty ? `?county=${encodeURIComponent(selectedCounty)}` : "";
    const response = await authenticatedGet<PollingStation[]>(`/api/dashboard/missing-submissions${params}`);
    setMissingSubmissions(response);
  };

  const loadExtraSubmissions = async () => {
    const params = selectedCounty ? `?county=${encodeURIComponent(selectedCounty)}` : "";
    const response = await authenticatedGet<ExtraSubmission[]>(`/api/dashboard/extra-submissions${params}`);
    setExtraSubmissions(response);
  };

  const loadDuplicateSubmissions = async () => {
    const params = selectedCounty ? `?county=${encodeURIComponent(selectedCounty)}` : "";
    const response = await authenticatedGet<DuplicateSubmission[]>(`/api/dashboard/duplicate-submissions${params}`);
    setDuplicateSubmissions(response);
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    switch (activeReport) {
      case "candidate-votes":
        return (
          <View>
            {candidateVotes.map((candidate, index) => (
              <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.reportItemTitle, { color: theme.colors.text }]}>
                  {candidate.candidateFirstName} {candidate.candidateLastName}
                </Text>
                <Text style={[styles.reportItemSubtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
                  {candidate.partyName}
                </Text>
                <Text style={[styles.reportItemValue, { color: theme.colors.primary }]}>
                  {candidate.totalVotes.toLocaleString()} votes
                </Text>
                <Text style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                  From {candidate.formsCount} forms
                </Text>
              </View>
            ))}
          </View>
        );

      case "incident-videos":
        if (!selectedCounty) {
          return (
            <Text style={[styles.emptyText, { color: theme.dark ? "#98989D" : "#666" }]}>
              Please select a county to view incident videos
            </Text>
          );
        }
        return (
          <View>
            {incidentVideos.map((video, index) => (
              <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.reportItemTitle, { color: theme.colors.text }]}>
                  {video.videoCode}
                </Text>
                <Text style={[styles.reportItemSubtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
                  Agent: {video.agentCivicCode}
                </Text>
                <Text style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                  {video.county}, {video.constituency}, {video.ward}
                </Text>
                <Text style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                  {new Date(video.uploadedAt).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        );

      case "serial-discrepancies":
        return (
          <View>
            {serialDiscrepancies.map((discrepancy, index) => (
              <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card, borderColor: "#F44336", borderWidth: 2 }]}>
                <Text style={[styles.reportItemTitle, { color: "#F44336" }]}>
                  ⚠️ Serial: {discrepancy.serialNumber}
                </Text>
                <Text style={[styles.reportItemValue, { color: theme.colors.text }]}>
                  {discrepancy.submissionCount} submissions
                </Text>
                {discrepancy.forms.map((form, idx) => (
                  <Text key={idx} style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                    • {form.agentCode} - {form.county}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );

      case "missing-submissions":
        return (
          <View>
            {missingSubmissions.map((station, index) => (
              <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.reportItemTitle, { color: theme.colors.text }]}>
                  {station.pollingStation}
                </Text>
                <Text style={[styles.reportItemSubtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
                  Code: {station.stationCode}
                </Text>
                <Text style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                  {station.county}, {station.constituency}, {station.ward}
                </Text>
                <Text style={[styles.reportItemValue, { color: "#F44336" }]}>
                  No submission
                </Text>
              </View>
            ))}
          </View>
        );

      case "extra-submissions":
        return (
          <View>
            {extraSubmissions.map((extra, index) => (
              <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card, borderColor: "#FF9800", borderWidth: 2 }]}>
                <Text style={[styles.reportItemTitle, { color: theme.colors.text }]}>
                  {extra.pollingStation}
                </Text>
                <Text style={[styles.reportItemSubtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
                  {extra.county}, {extra.constituency}, {extra.ward}
                </Text>
                <Text style={[styles.reportItemValue, { color: "#FF9800" }]}>
                  {extra.submissions.length} submissions
                </Text>
                {extra.submissions.map((sub, idx) => (
                  <Text key={idx} style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                    • {sub.agentCode}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );

      case "duplicate-submissions":
        return (
          <View>
            {duplicateSubmissions.map((duplicate, index) => (
              <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card, borderColor: "#F44336", borderWidth: 2 }]}>
                <Text style={[styles.reportItemTitle, { color: "#F44336" }]}>
                  ⚠️ {duplicate.type === "same_station" ? "Same Station" : "Same Serial"}
                </Text>
                {duplicate.pollingStation && (
                  <Text style={[styles.reportItemSubtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
                    Station: {duplicate.pollingStation}
                  </Text>
                )}
                {duplicate.serialNumber && (
                  <Text style={[styles.reportItemSubtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
                    Serial: {duplicate.serialNumber}
                  </Text>
                )}
                <Text style={[styles.reportItemValue, { color: theme.colors.text }]}>
                  {duplicate.submissions.length} submissions
                </Text>
                {duplicate.submissions.map((sub, idx) => (
                  <Text key={idx} style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                    • {sub.agentCode}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
          WANJIKU@63
        </Text>

        {/* Report Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportSelector}>
          <TouchableOpacity
            style={[
              styles.reportButton,
              activeReport === "candidate-votes" && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setActiveReport("candidate-votes")}
          >
            <Text
              style={[
                styles.reportButtonText,
                { color: activeReport === "candidate-votes" ? "#fff" : theme.colors.text },
              ]}
            >
              Candidate Votes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reportButton,
              activeReport === "incident-videos" && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setActiveReport("incident-videos")}
          >
            <Text
              style={[
                styles.reportButtonText,
                { color: activeReport === "incident-videos" ? "#fff" : theme.colors.text },
              ]}
            >
              Incident Videos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reportButton,
              activeReport === "serial-discrepancies" && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setActiveReport("serial-discrepancies")}
          >
            <Text
              style={[
                styles.reportButtonText,
                { color: activeReport === "serial-discrepancies" ? "#fff" : theme.colors.text },
              ]}
            >
              Serial Discrepancies
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reportButton,
              activeReport === "missing-submissions" && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setActiveReport("missing-submissions")}
          >
            <Text
              style={[
                styles.reportButtonText,
                { color: activeReport === "missing-submissions" ? "#fff" : theme.colors.text },
              ]}
            >
              Missing Submissions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reportButton,
              activeReport === "extra-submissions" && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setActiveReport("extra-submissions")}
          >
            <Text
              style={[
                styles.reportButtonText,
                { color: activeReport === "extra-submissions" ? "#fff" : theme.colors.text },
              ]}
            >
              Extra Submissions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reportButton,
              activeReport === "duplicate-submissions" && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setActiveReport("duplicate-submissions")}
          >
            <Text
              style={[
                styles.reportButtonText,
                { color: activeReport === "duplicate-submissions" ? "#fff" : theme.colors.text },
              ]}
            >
              Duplicates
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Filters */}
        <View style={[styles.filtersContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Filter by County:</Text>
          <View style={[styles.pickerContainer, { borderColor: theme.colors.border }]}>
            <Picker
              selectedValue={selectedCounty}
              onValueChange={(value) => setSelectedCounty(value)}
              style={[styles.picker, { color: theme.colors.text }]}
            >
              <Picker.Item label="All Counties" value="" />
              {counties.map((c) => (
                <Picker.Item key={c.code} label={c.name} value={c.name} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Report Content */}
        <View style={styles.reportContent}>{renderReportContent()}</View>
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
  reportSelector: {
    marginBottom: 20,
  },
  reportButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filtersContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  reportContent: {
    gap: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    padding: 20,
  },
  reportItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportItemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  reportItemSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  reportItemValue: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  reportItemDetail: {
    fontSize: 12,
    marginTop: 2,
  },
});
