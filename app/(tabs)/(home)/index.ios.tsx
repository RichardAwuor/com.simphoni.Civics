
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
import { Stack } from "expo-router";

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
    console.log("[Dashboard iOS] Loading counties and initial report");
    loadCounties();
    loadReport();
  }, [activeReport, selectedCounty]);

  const loadCounties = async () => {
    try {
      console.log("[Dashboard iOS] Fetching counties from API");
      const response = await authenticatedGet<County[]>("/api/locations/counties");
      console.log("[Dashboard iOS] Counties loaded:", response.length);
      setCounties(response);
    } catch (error) {
      console.error("[Dashboard iOS] Failed to load counties:", error);
    }
  };

  const showModal = (title: string, message: string, type: "info" | "success" | "error") => {
    setModalConfig({ title, message, type });
    setModalVisible(true);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      console.log("[Dashboard iOS] Loading report:", activeReport, "County:", selectedCounty);
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
      console.error("[Dashboard iOS] Failed to load report:", error);
      showModal("Error", "Failed to load report data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCandidateVotes = async () => {
    const params = selectedCounty ? `?county=${encodeURIComponent(selectedCounty)}` : "";
    console.log("[Dashboard iOS] Fetching candidate votes with params:", params);
    const response = await authenticatedGet<CandidateVotes[]>(`/api/dashboard/candidate-votes${params}`);
    console.log("[Dashboard iOS] Candidate votes loaded:", response.length);
    setCandidateVotes(response);
  };

  const loadIncidentVideos = async () => {
    if (!selectedCounty) return;
    console.log("[Dashboard iOS] Fetching incident videos for county:", selectedCounty);
    const response = await authenticatedGet<IncidentVideo[]>(
      `/api/dashboard/incident-videos?county=${encodeURIComponent(selectedCounty)}`
    );
    console.log("[Dashboard iOS] Incident videos loaded:", response.length);
    setIncidentVideos(response);
  };

  const loadSerialDiscrepancies = async () => {
    const params = selectedCounty ? `?county=${encodeURIComponent(selectedCounty)}` : "";
    console.log("[Dashboard iOS] Fetching serial discrepancies with params:", params);
    const response = await authenticatedGet<SerialDiscrepancy[]>(`/api/dashboard/serial-discrepancies${params}`);
    console.log("[Dashboard iOS] Serial discrepancies loaded:", response.length);
    setSerialDiscrepancies(response);
  };

  const loadMissingSubmissions = async () => {
    const params = selectedCounty ? `?county=${encodeURIComponent(selectedCounty)}` : "";
    console.log("[Dashboard iOS] Fetching missing submissions with params:", params);
    const response = await authenticatedGet<PollingStation[]>(`/api/dashboard/missing-submissions${params}`);
    console.log("[Dashboard iOS] Missing submissions loaded:", response.length);
    setMissingSubmissions(response);
  };

  const loadExtraSubmissions = async () => {
    const params = selectedCounty ? `?county=${encodeURIComponent(selectedCounty)}` : "";
    console.log("[Dashboard iOS] Fetching extra submissions with params:", params);
    const response = await authenticatedGet<ExtraSubmission[]>(`/api/dashboard/extra-submissions${params}`);
    console.log("[Dashboard iOS] Extra submissions loaded:", response.length);
    setExtraSubmissions(response);
  };

  const loadDuplicateSubmissions = async () => {
    const params = selectedCounty ? `?county=${encodeURIComponent(selectedCounty)}` : "";
    console.log("[Dashboard iOS] Fetching duplicate submissions with params:", params);
    const response = await authenticatedGet<DuplicateSubmission[]>(`/api/dashboard/duplicate-submissions${params}`);
    console.log("[Dashboard iOS] Duplicate submissions loaded:", response.length);
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
        const candidateVotesContent = candidateVotes.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.dark ? "#98989D" : "#666" }]}>
            No candidate votes data available
          </Text>
        ) : null;
        
        return (
          <View>
            {candidateVotesContent}
            {candidateVotes.map((candidate, index) => {
              const fullName = `${candidate.candidateFirstName} ${candidate.candidateLastName}`;
              const partyName = candidate.partyName;
              const votesText = `${candidate.totalVotes.toLocaleString()} votes`;
              const formsText = `From ${candidate.formsCount} forms`;
              
              return (
                <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.reportItemTitle, { color: theme.colors.text }]}>
                    {fullName}
                  </Text>
                  <Text style={[styles.reportItemSubtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
                    {partyName}
                  </Text>
                  <Text style={[styles.reportItemValue, { color: theme.colors.primary }]}>
                    {votesText}
                  </Text>
                  <Text style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                    {formsText}
                  </Text>
                </View>
              );
            })}
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
        
        const incidentVideosContent = incidentVideos.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.dark ? "#98989D" : "#666" }]}>
            No incident videos available for this county
          </Text>
        ) : null;
        
        return (
          <View>
            {incidentVideosContent}
            {incidentVideos.map((video, index) => {
              const videoCode = video.videoCode;
              const agentText = `Agent: ${video.agentCivicCode}`;
              const locationText = `${video.county}, ${video.constituency}, ${video.ward}`;
              const dateText = new Date(video.uploadedAt).toLocaleString();
              
              return (
                <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.reportItemTitle, { color: theme.colors.text }]}>
                    {videoCode}
                  </Text>
                  <Text style={[styles.reportItemSubtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
                    {agentText}
                  </Text>
                  <Text style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                    {locationText}
                  </Text>
                  <Text style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                    {dateText}
                  </Text>
                </View>
              );
            })}
          </View>
        );

      case "serial-discrepancies":
        const serialDiscrepanciesContent = serialDiscrepancies.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.dark ? "#98989D" : "#666" }]}>
            No serial discrepancies found
          </Text>
        ) : null;
        
        return (
          <View>
            {serialDiscrepanciesContent}
            {serialDiscrepancies.map((discrepancy, index) => {
              const serialText = `⚠️ Serial: ${discrepancy.serialNumber}`;
              const submissionsText = `${discrepancy.submissionCount} submissions`;
              
              return (
                <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card, borderColor: "#F44336", borderWidth: 2 }]}>
                  <Text style={[styles.reportItemTitle, { color: "#F44336" }]}>
                    {serialText}
                  </Text>
                  <Text style={[styles.reportItemValue, { color: theme.colors.text }]}>
                    {submissionsText}
                  </Text>
                  {discrepancy.forms.map((form, idx) => {
                    const formText = `• ${form.agentCode} - ${form.county}`;
                    return (
                      <Text key={idx} style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                        {formText}
                      </Text>
                    );
                  })}
                </View>
              );
            })}
          </View>
        );

      case "missing-submissions":
        const missingSubmissionsContent = missingSubmissions.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.dark ? "#98989D" : "#666" }]}>
            No missing submissions found
          </Text>
        ) : null;
        
        return (
          <View>
            {missingSubmissionsContent}
            {missingSubmissions.map((station, index) => {
              const stationName = station.pollingStation;
              const codeText = `Code: ${station.stationCode}`;
              const locationText = `${station.county}, ${station.constituency}, ${station.ward}`;
              const statusText = "No submission";
              
              return (
                <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.reportItemTitle, { color: theme.colors.text }]}>
                    {stationName}
                  </Text>
                  <Text style={[styles.reportItemSubtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
                    {codeText}
                  </Text>
                  <Text style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                    {locationText}
                  </Text>
                  <Text style={[styles.reportItemValue, { color: "#F44336" }]}>
                    {statusText}
                  </Text>
                </View>
              );
            })}
          </View>
        );

      case "extra-submissions":
        const extraSubmissionsContent = extraSubmissions.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.dark ? "#98989D" : "#666" }]}>
            No extra submissions found
          </Text>
        ) : null;
        
        return (
          <View>
            {extraSubmissionsContent}
            {extraSubmissions.map((extra, index) => {
              const stationName = extra.pollingStation;
              const locationText = `${extra.county}, ${extra.constituency}, ${extra.ward}`;
              const submissionsText = `${extra.submissions.length} submissions`;
              
              return (
                <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card, borderColor: "#FF9800", borderWidth: 2 }]}>
                  <Text style={[styles.reportItemTitle, { color: theme.colors.text }]}>
                    {stationName}
                  </Text>
                  <Text style={[styles.reportItemSubtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
                    {locationText}
                  </Text>
                  <Text style={[styles.reportItemValue, { color: "#FF9800" }]}>
                    {submissionsText}
                  </Text>
                  {extra.submissions.map((sub, idx) => {
                    const agentText = `• ${sub.agentCode}`;
                    return (
                      <Text key={idx} style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                        {agentText}
                      </Text>
                    );
                  })}
                </View>
              );
            })}
          </View>
        );

      case "duplicate-submissions":
        const duplicateSubmissionsContent = duplicateSubmissions.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.dark ? "#98989D" : "#666" }]}>
            No duplicate submissions found
          </Text>
        ) : null;
        
        return (
          <View>
            {duplicateSubmissionsContent}
            {duplicateSubmissions.map((duplicate, index) => {
              const typeText = duplicate.type === "same_station" ? "⚠️ Same Station" : "⚠️ Same Serial";
              const submissionsText = `${duplicate.submissions.length} submissions`;
              
              return (
                <View key={index} style={[styles.reportItem, { backgroundColor: theme.colors.card, borderColor: "#F44336", borderWidth: 2 }]}>
                  <Text style={[styles.reportItemTitle, { color: "#F44336" }]}>
                    {typeText}
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
                    {submissionsText}
                  </Text>
                  {duplicate.submissions.map((sub, idx) => {
                    const agentText = `• ${sub.agentCode}`;
                    return (
                      <Text key={idx} style={[styles.reportItemDetail, { color: theme.dark ? "#98989D" : "#666" }]}>
                        {agentText}
                      </Text>
                    );
                  })}
                </View>
              );
            })}
          </View>
        );

      default:
        return null;
    }
  };

  const titleText = "Dashboard";
  const subtitleText = "WANJIKU@63";
  const filterLabelText = "Filter by County:";
  const allCountiesText = "All Counties";
  const candidateVotesText = "Candidate Votes";
  const incidentVideosText = "Incident Videos";
  const serialDiscrepanciesText = "Serial Discrepancies";
  const missingSubmissionsText = "Missing Submissions";
  const extraSubmissionsText = "Extra Submissions";
  const duplicatesText = "Duplicates";

  return (
    <>
      <Stack.Screen
        options={{
          title: "Dashboard",
          headerShown: true,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{titleText}</Text>
          <Text style={[styles.subtitle, { color: theme.dark ? "#98989D" : "#666" }]}>
            {subtitleText}
          </Text>

          {/* Report Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportSelector}>
            <TouchableOpacity
              style={[
                styles.reportButton,
                activeReport === "candidate-votes" && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                console.log("[Dashboard iOS] User selected Candidate Votes report");
                setActiveReport("candidate-votes");
              }}
            >
              <Text
                style={[
                  styles.reportButtonText,
                  { color: activeReport === "candidate-votes" ? "#fff" : theme.colors.text },
                ]}
              >
                {candidateVotesText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.reportButton,
                activeReport === "incident-videos" && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                console.log("[Dashboard iOS] User selected Incident Videos report");
                setActiveReport("incident-videos");
              }}
            >
              <Text
                style={[
                  styles.reportButtonText,
                  { color: activeReport === "incident-videos" ? "#fff" : theme.colors.text },
                ]}
              >
                {incidentVideosText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.reportButton,
                activeReport === "serial-discrepancies" && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                console.log("[Dashboard iOS] User selected Serial Discrepancies report");
                setActiveReport("serial-discrepancies");
              }}
            >
              <Text
                style={[
                  styles.reportButtonText,
                  { color: activeReport === "serial-discrepancies" ? "#fff" : theme.colors.text },
                ]}
              >
                {serialDiscrepanciesText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.reportButton,
                activeReport === "missing-submissions" && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                console.log("[Dashboard iOS] User selected Missing Submissions report");
                setActiveReport("missing-submissions");
              }}
            >
              <Text
                style={[
                  styles.reportButtonText,
                  { color: activeReport === "missing-submissions" ? "#fff" : theme.colors.text },
                ]}
              >
                {missingSubmissionsText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.reportButton,
                activeReport === "extra-submissions" && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                console.log("[Dashboard iOS] User selected Extra Submissions report");
                setActiveReport("extra-submissions");
              }}
            >
              <Text
                style={[
                  styles.reportButtonText,
                  { color: activeReport === "extra-submissions" ? "#fff" : theme.colors.text },
                ]}
              >
                {extraSubmissionsText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.reportButton,
                activeReport === "duplicate-submissions" && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                console.log("[Dashboard iOS] User selected Duplicate Submissions report");
                setActiveReport("duplicate-submissions");
              }}
            >
              <Text
                style={[
                  styles.reportButtonText,
                  { color: activeReport === "duplicate-submissions" ? "#fff" : theme.colors.text },
                ]}
              >
                {duplicatesText}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Filters */}
          <View style={[styles.filtersContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.filterLabel, { color: theme.colors.text }]}>{filterLabelText}</Text>
            <View style={[styles.pickerContainer, { borderColor: theme.colors.border }]}>
              <Picker
                selectedValue={selectedCounty}
                onValueChange={(value) => {
                  console.log("[Dashboard iOS] User selected county:", value);
                  setSelectedCounty(value);
                }}
                style={[styles.picker, { color: theme.colors.text }]}
              >
                <Picker.Item label={allCountiesText} value="" />
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
    </>
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
