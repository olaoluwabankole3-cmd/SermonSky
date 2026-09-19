import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  listAdminChurchApplications,
  reviewChurchApplication,
  type AdminChurchApplication,
} from "../api";
import { colors, radii, spacing } from "../theme";

type Props = {
  onReviewed?: () => void;
};

export function AdminReviewPanel({ onReviewed }: Props) {
  const [applications, setApplications] = useState<AdminChurchApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const next = await listAdminChurchApplications();
      setApplications(next);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load church applications.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const review = async (
    application: AdminChurchApplication,
    action: "approve" | "reject",
  ) => {
    if (workingId) return;

    setWorkingId(application.id);
    setError("");

    try {
      await reviewChurchApplication(application.id, action);
      await load();
      onReviewed?.();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not review this application.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>SERMONSKY ADMIN</Text>
          <Text style={styles.title}>Church verification</Text>
        </View>
        <Pressable style={styles.refresh} onPress={() => void load()}>
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        Review applicants before they receive publishing access.
      </Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.skyStrong} />
          <Text style={styles.loadingText}>Loading applications…</Text>
        </View>
      ) : applications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>☁</Text>
          <Text style={styles.emptyTitle}>No applications yet</Text>
          <Text style={styles.emptyText}>
            New Church Account applications will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {applications.map((application) => (
            <View key={application.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.flex}>
                  <Text style={styles.churchName}>{application.churchName}</Text>
                  <Text style={styles.meta}>
                    {application.country} · {application.website}
                  </Text>
                </View>
                <View
                  style={[
                    styles.status,
                    application.status === "approved" && styles.statusApproved,
                    application.status === "rejected" && styles.statusRejected,
                  ]}
                >
                  <Text style={styles.statusText}>{application.status}</Text>
                </View>
              </View>

              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Applicant</Text>
                <Text style={styles.detailValue}>
                  {application.applicantName} · {application.applicantEmail}
                </Text>
                <Text style={styles.detailLabel}>Representative</Text>
                <Text style={styles.detailValue}>
                  {application.representativeName} · {application.role}
                </Text>
                <Text style={styles.detailValue}>
                  {application.representativeEmail}
                </Text>
              </View>

              {application.status === "pending" && (
                <View style={styles.actions}>
                  <Pressable
                    disabled={workingId === application.id}
                    style={[styles.rejectButton, styles.actionButton]}
                    onPress={() => void review(application, "reject")}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </Pressable>
                  <Pressable
                    disabled={workingId === application.id}
                    style={[styles.approveButton, styles.actionButton]}
                    onPress={() => void review(application, "approve")}
                  >
                    {workingId === application.id ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.approveText}>Approve church</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    color: colors.skyDark,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: "900",
  },
  title: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  refresh: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshText: {
    color: colors.skyDark,
    fontSize: 20,
    fontWeight: "800",
  },
  error: {
    color: "#B42318",
    fontSize: 11,
    marginTop: 12,
  },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 8,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 11,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 26,
  },
  emptyIcon: {
    fontSize: 38,
    color: colors.sky,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  list: {
    gap: 12,
    marginTop: 16,
  },
  card: {
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.cloud,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  flex: {
    flex: 1,
  },
  churchName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },
  status: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: "#FFF4D6",
  },
  statusApproved: {
    backgroundColor: "#E7F7EF",
  },
  statusRejected: {
    backgroundColor: "#FDEBEC",
  },
  statusText: {
    color: colors.ink,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailBlock: {
    marginTop: 12,
    gap: 3,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 5,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  detailValue: {
    color: colors.ink,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },
  actionButton: {
    minHeight: 42,
    flex: 1,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rejectText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900",
  },
  approveButton: {
    backgroundColor: colors.skyStrong,
  },
  approveText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
});
