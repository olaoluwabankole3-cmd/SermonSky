import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandMark } from "./BrandMark";
import { colors, radii, spacing } from "../theme";

export type PreviewViewer = {
  name: string;
  email: string;
};

export type ChurchApplication = {
  churchName: string;
  website: string;
  country: string;
  representativeName: string;
  representativeEmail: string;
  role: string;
  status: "pending";
};

type ViewerAuthModalProps = {
  visible: boolean;
  mode: "signup" | "login";
  onClose: () => void;
  onComplete: (viewer: PreviewViewer) => void;
};

export function ViewerAuthModal({
  visible,
  mode,
  onClose,
  onComplete,
}: ViewerAuthModalProps) {
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const emailLooksValid = email.includes("@") && email.includes(".");
    return (
      emailLooksValid &&
      password.length >= 6 &&
      (!isSignup || name.trim().length >= 2)
    );
  }, [email, password, name, isSignup]);

  const submit = () => {
    if (!canSubmit) {
      setError("Enter a valid email and a password with at least 6 characters.");
      return;
    }

    const displayName = isSignup
      ? name.trim()
      : email
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase());

    onComplete({
      name: displayName || "SermonSky Viewer",
      email: email.trim().toLowerCase(),
    });
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <BrandMark />
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.cloudBadge}>
              <Text style={styles.cloudBadgeText}>☁  VIEWER ACCOUNT</Text>
            </View>
            <Text style={styles.title}>
              {isSignup ? "Create your SermonSky account" : "Welcome back"}
            </Text>
            <Text style={styles.subtitle}>
              {isSignup
                ? "Follow churches, save sermons, and build a feed around your faith."
                : "Sign in to continue your SermonSky preview experience."}
            </Text>

            {isSignup && (
              <Field
                label="Your name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Daniel Adeyemi"
                autoCapitalize="words"
              />
            )}

            <Field
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              autoCapitalize="none"
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              onPress={submit}
              style={({ pressed }) => [
                styles.primaryButton,
                !canSubmit && styles.primaryButtonDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isSignup ? "Create viewer account" : "Sign in"}
              </Text>
            </Pressable>

            <View style={styles.previewNotice}>
              <Text style={styles.previewNoticeTitle}>Preview mode</Text>
              <Text style={styles.previewNoticeText}>
                This flow is interactive, but credentials are not sent anywhere
                yet. Secure authentication is the next backend milestone.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type ChurchApplicationModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (application: ChurchApplication) => void;
};

export function ChurchApplicationModal({
  visible,
  onClose,
  onSubmit,
}: ChurchApplicationModalProps) {
  const [step, setStep] = useState(1);
  const [churchName, setChurchName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [representativeEmail, setRepresentativeEmail] = useState("");
  const [role, setRole] = useState("");

  const stepOneValid =
    churchName.trim().length >= 2 &&
    country.trim().length >= 2 &&
    website.trim().length >= 4;

  const stepTwoValid =
    representativeName.trim().length >= 2 &&
    representativeEmail.includes("@") &&
    representativeEmail.includes(".") &&
    role.trim().length >= 2;

  const reset = () => {
    setStep(1);
    setChurchName("");
    setWebsite("");
    setCountry("");
    setRepresentativeName("");
    setRepresentativeEmail("");
    setRole("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (!stepOneValid || !stepTwoValid) return;

    onSubmit({
      churchName: churchName.trim(),
      website: website.trim(),
      country: country.trim(),
      representativeName: representativeName.trim(),
      representativeEmail: representativeEmail.trim().toLowerCase(),
      role: role.trim(),
      status: "pending",
    });
    reset();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <BrandMark />
            <Pressable accessibilityRole="button" onPress={close} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
          >
            <View style={styles.cloudBadge}>
              <Text style={styles.cloudBadgeText}>✓  CHURCH VERIFICATION</Text>
            </View>
            <Text style={styles.title}>Apply for SermonSky Studio</Text>
            <Text style={styles.subtitle}>
              Publishing is reserved for verified churches and approved
              Christian ministries.
            </Text>

            <View style={styles.steps}>
              {[1, 2, 3].map((item) => (
                <View key={item} style={styles.stepWrap}>
                  <View
                    style={[
                      styles.stepDot,
                      step >= item && styles.stepDotActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepDotText,
                        step >= item && styles.stepDotTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </View>
                  {item < 3 && (
                    <View
                      style={[
                        styles.stepLine,
                        step > item && styles.stepLineActive,
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>

            {step === 1 && (
              <>
                <Text style={styles.sectionTitle}>Church details</Text>
                <Field
                  label="Church or ministry name"
                  value={churchName}
                  onChangeText={setChurchName}
                  placeholder="e.g. City of Grace Church"
                  autoCapitalize="words"
                />
                <Field
                  label="Official website"
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="https://yourchurch.org"
                  autoCapitalize="none"
                />
                <Field
                  label="Country"
                  value={country}
                  onChangeText={setCountry}
                  placeholder="e.g. Nigeria"
                  autoCapitalize="words"
                />
                <Pressable
                  disabled={!stepOneValid}
                  onPress={() => setStep(2)}
                  style={[
                    styles.primaryButton,
                    !stepOneValid && styles.primaryButtonDisabled,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </Pressable>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.sectionTitle}>Church representative</Text>
                <Field
                  label="Full name"
                  value={representativeName}
                  onChangeText={setRepresentativeName}
                  placeholder="Your full name"
                  autoCapitalize="words"
                />
                <Field
                  label="Official email"
                  value={representativeEmail}
                  onChangeText={setRepresentativeEmail}
                  placeholder="name@yourchurch.org"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Field
                  label="Role at the church"
                  value={role}
                  onChangeText={setRole}
                  placeholder="e.g. Media Director"
                  autoCapitalize="words"
                />
                <View style={styles.buttonRow}>
                  <Pressable onPress={() => setStep(1)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </Pressable>
                  <Pressable
                    disabled={!stepTwoValid}
                    onPress={() => setStep(3)}
                    style={[
                      styles.primaryButton,
                      styles.flexButton,
                      !stepTwoValid && styles.primaryButtonDisabled,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Review</Text>
                  </Pressable>
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.sectionTitle}>Review application</Text>
                <ReviewRow label="Church" value={churchName} />
                <ReviewRow label="Website" value={website} />
                <ReviewRow label="Country" value={country} />
                <ReviewRow label="Representative" value={representativeName} />
                <ReviewRow label="Email" value={representativeEmail} />
                <ReviewRow label="Role" value={role} last />

                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationInfoTitle}>
                    What happens after submission?
                  </Text>
                  <Text style={styles.verificationInfoText}>
                    SermonSky will verify that the applicant represents the
                    church or ministry before publishing access is enabled.
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <Pressable onPress={() => setStep(2)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </Pressable>
                  <Pressable onPress={submit} style={[styles.primaryButton, styles.flexButton]}>
                    <Text style={styles.primaryButtonText}>Submit application</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
};

function Field({ label, style, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

function ReviewRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.reviewRow, last && styles.reviewRowLast]}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 34, 58, 0.34)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "94%",
    minHeight: "72%",
    backgroundColor: colors.cloud,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  sheetHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 44,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 27,
  },
  cloudBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.mist,
  },
  cloudBadgeText: {
    color: colors.skyDark,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "900",
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginTop: 14,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 12,
  },
  field: {
    marginTop: 15,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 7,
  },
  input: {
    height: 52,
    paddingHorizontal: 15,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 14,
  },
  error: {
    color: "#B42318",
    fontSize: 11,
    marginTop: 10,
  },
  primaryButton: {
    minHeight: 50,
    marginTop: 20,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.skyStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.42,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.8,
  },
  previewNotice: {
    marginTop: spacing.lg,
    padding: 14,
    backgroundColor: colors.mist,
    borderRadius: radii.lg,
  },
  previewNoticeTitle: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "900",
  },
  previewNoticeText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  stepWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: colors.skyStrong,
    borderColor: colors.skyStrong,
  },
  stepDotText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
  },
  stepDotTextActive: {
    color: colors.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.line,
  },
  stepLineActive: {
    backgroundColor: colors.skyStrong,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 3,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  secondaryButton: {
    minHeight: 50,
    paddingHorizontal: 19,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "900",
  },
  flexButton: {
    flex: 1,
    marginTop: 0,
  },
  reviewRow: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },
  reviewRowLast: {
    borderBottomWidth: 0,
  },
  reviewLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  reviewValue: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    textAlign: "right",
    fontWeight: "800",
  },
  verificationInfo: {
    padding: 14,
    marginTop: spacing.lg,
    backgroundColor: colors.mist,
    borderRadius: radii.lg,
  },
  verificationInfoTitle: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "900",
  },
  verificationInfoText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
});
