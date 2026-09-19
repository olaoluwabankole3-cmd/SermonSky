import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createStudioDraft,
  getStudioChannel,
  listStudioDrafts,
  updateStudioChannel,
  type StudioChannel,
  type StudioDraft,
} from "../api";
import { colors, radii, spacing } from "../theme";
import { BrandMark } from "./BrandMark";

type Section = "overview" | "channel" | "content";

type Props = {
  onClose: () => void;
};

export function StudioScreen({ onClose }: Props) {
  const [section, setSection] = useState<Section>("overview");
  const [channel, setChannel] = useState<StudioChannel | null>(null);
  const [drafts, setDrafts] = useState<StudioDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<"sermon" | "short">("sermon");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [nextChannel, nextDrafts] = await Promise.all([
        getStudioChannel(),
        listStudioDrafts(),
      ]);
      setChannel(nextChannel);
      setDrafts(nextDrafts);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "SermonSky Studio could not load.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const draftCount = drafts.filter((draft) => draft.status === "draft").length;
  const publishedCount = drafts.filter(
    (draft) => draft.status === "published",
  ).length;
  const shortCount = drafts.filter((draft) => draft.contentType === "short").length;

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <BrandMark />
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.hero}>
          <View style={styles.heroCloudOne} />
          <View style={styles.heroCloudTwo} />
          <Text style={styles.heroEyebrow}>SERMONSKY STUDIO</Text>
          <Text style={styles.heroTitle}>
            {channel?.name || "Your church channel"}
          </Text>
          <Text style={styles.heroCopy}>
            Manage your channel, prepare sermons, and publish with verified
            church permissions.
          </Text>
          {channel && (
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedDot}>✓</Text>
              <Text style={styles.verifiedText}>
                Verified · {channel.memberRole}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tabs}>
          <StudioTab
            label="Overview"
            active={section === "overview"}
            onPress={() => setSection("overview")}
          />
          <StudioTab
            label="Channel"
            active={section === "channel"}
            onPress={() => setSection("channel")}
          />
          <StudioTab
            label="Content"
            active={section === "content"}
            onPress={() => setSection("content")}
          />
        </View>

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void load()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.skyStrong} size="large" />
            <Text style={styles.loadingText}>Opening SermonSky Studio…</Text>
          </View>
        ) : (
          <>
            {section === "overview" && (
              <Overview
                channel={channel}
                draftCount={draftCount}
                publishedCount={publishedCount}
                shortCount={shortCount}
                latestDrafts={drafts.slice(0, 3)}
                onNewSermon={() => {
                  setComposerType("sermon");
                  setComposerOpen(true);
                  setSection("content");
                }}
                onNewShort={() => {
                  setComposerType("short");
                  setComposerOpen(true);
                  setSection("content");
                }}
                onEditChannel={() => setSection("channel")}
              />
            )}

            {section === "channel" && channel && (
              <ChannelEditor
                channel={channel}
                onSaved={(nextChannel) => setChannel(nextChannel)}
              />
            )}

            {section === "content" && (
              <ContentManager
                drafts={drafts}
                composerOpen={composerOpen}
                composerType={composerType}
                onOpenComposer={(type) => {
                  setComposerType(type);
                  setComposerOpen(true);
                }}
                onCloseComposer={() => setComposerOpen(false)}
                onCreated={(draft) => {
                  setDrafts((current) => [draft, ...current]);
                  setComposerOpen(false);
                }}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Overview({
  channel,
  draftCount,
  publishedCount,
  shortCount,
  latestDrafts,
  onNewSermon,
  onNewShort,
  onEditChannel,
}: {
  channel: StudioChannel | null;
  draftCount: number;
  publishedCount: number;
  shortCount: number;
  latestDrafts: StudioDraft[];
  onNewSermon: () => void;
  onNewShort: () => void;
  onEditChannel: () => void;
}) {
  return (
    <View style={styles.sectionStack}>
      <View style={styles.statGrid}>
        <StatCard value={String(draftCount)} label="Drafts" />
        <StatCard value={String(publishedCount)} label="Published" />
        <StatCard value={String(shortCount)} label="Shorts" />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Create</Text>
        <View style={styles.actionGrid}>
          <Pressable style={styles.primaryAction} onPress={onNewSermon}>
            <Text style={styles.primaryActionIcon}>▶</Text>
            <View style={styles.flexOne}>
              <Text style={styles.primaryActionTitle}>New sermon</Text>
              <Text style={styles.primaryActionText}>
                Prepare metadata before uploading video.
              </Text>
            </View>
          </Pressable>

          <Pressable style={styles.secondaryAction} onPress={onNewShort}>
            <Text style={styles.secondaryActionIcon}>▯</Text>
            <View style={styles.flexOne}>
              <Text style={styles.secondaryActionTitle}>New Short</Text>
              <Text style={styles.secondaryActionText}>
                Start a vertical clip draft.
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeading}>
          <View>
            <Text style={styles.sectionTitle}>Channel readiness</Text>
            <Text style={styles.panelSubtitle}>
              Complete your public church profile before publishing.
            </Text>
          </View>
          <Pressable onPress={onEditChannel}>
            <Text style={styles.linkText}>Edit</Text>
          </Pressable>
        </View>

        <ReadinessRow
          label="Church identity"
          complete={Boolean(channel?.name && channel?.website)}
        />
        <ReadinessRow
          label="About description"
          complete={Boolean(channel?.description)}
        />
        <ReadinessRow
          label="City & service times"
          complete={Boolean(channel?.city && channel?.serviceTimes)}
        />
        <ReadinessRow
          label="Channel artwork"
          complete={Boolean(channel?.logoUrl || channel?.bannerUrl)}
          last
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeading}>
          <View>
            <Text style={styles.sectionTitle}>Recent drafts</Text>
            <Text style={styles.panelSubtitle}>
              Your latest unpublished content.
            </Text>
          </View>
        </View>

        {latestDrafts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyCloud}>☁</Text>
            <Text style={styles.emptyTitle}>No drafts yet</Text>
            <Text style={styles.emptyText}>
              Create your first sermon or Short to begin.
            </Text>
          </View>
        ) : (
          <View style={styles.draftList}>
            {latestDrafts.map((draft) => (
              <DraftRow key={draft.id} draft={draft} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function ChannelEditor({
  channel,
  onSaved,
}: {
  channel: StudioChannel;
  onSaved: (channel: StudioChannel) => void;
}) {
  const [name, setName] = useState(channel.name);
  const [website, setWebsite] = useState(channel.website);
  const [country, setCountry] = useState(channel.country);
  const [city, setCity] = useState(channel.city);
  const [description, setDescription] = useState(channel.description);
  const [serviceTimes, setServiceTimes] = useState(channel.serviceTimes);
  const [logoUrl, setLogoUrl] = useState(channel.logoUrl);
  const [bannerUrl, setBannerUrl] = useState(channel.bannerUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const canSave =
    name.trim().length >= 2 &&
    website.trim().length >= 4 &&
    country.trim().length >= 2;

  const save = async () => {
    if (!canSave || saving) return;

    setSaving(true);
    setMessage("");

    try {
      const next = await updateStudioChannel({
        name: name.trim(),
        website: website.trim(),
        country: country.trim(),
        city: city.trim(),
        description: description.trim(),
        serviceTimes: serviceTimes.trim(),
        logoUrl: logoUrl.trim(),
        bannerUrl: bannerUrl.trim(),
      });
      onSaved(next);
      setMessage("Channel details saved.");
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "Could not save channel.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.sectionStack}>
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Public channel</Text>
        <Text style={styles.panelSubtitle}>
          These details will become the verified church page viewers see.
        </Text>

        <StudioField label="Church name" value={name} onChangeText={setName} />
        <StudioField
          label="Official website"
          value={website}
          onChangeText={setWebsite}
          autoCapitalize="none"
        />

        <View style={styles.twoColumn}>
          <View style={styles.flexOne}>
            <StudioField
              label="Country"
              value={country}
              onChangeText={setCountry}
            />
          </View>
          <View style={styles.flexOne}>
            <StudioField label="City" value={city} onChangeText={setCity} />
          </View>
        </View>

        <StudioField
          label="About the church"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          inputStyle={styles.textArea}
          placeholder="Tell viewers about your church, mission, and community."
        />

        <StudioField
          label="Service times"
          value={serviceTimes}
          onChangeText={setServiceTimes}
          placeholder="e.g. Sundays 8:00 AM & 10:30 AM"
        />

        <Text style={styles.subheading}>Channel artwork</Text>
        <Text style={styles.helper}>
          For this milestone, artwork is stored as image URLs. Direct image
          uploads will be connected with R2 later.
        </Text>

        <StudioField
          label="Logo image URL"
          value={logoUrl}
          onChangeText={setLogoUrl}
          autoCapitalize="none"
          placeholder="https://..."
        />
        <StudioField
          label="Banner image URL"
          value={bannerUrl}
          onChangeText={setBannerUrl}
          autoCapitalize="none"
          placeholder="https://..."
        />

        {!!message && <Text style={styles.formMessage}>{message}</Text>}

        <Pressable
          disabled={!canSave || saving}
          onPress={() => void save()}
          style={[
            styles.saveButton,
            (!canSave || saving) && styles.disabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save channel</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function ContentManager({
  drafts,
  composerOpen,
  composerType,
  onOpenComposer,
  onCloseComposer,
  onCreated,
}: {
  drafts: StudioDraft[];
  composerOpen: boolean;
  composerType: "sermon" | "short";
  onOpenComposer: (type: "sermon" | "short") => void;
  onCloseComposer: () => void;
  onCreated: (draft: StudioDraft) => void;
}) {
  const sorted = useMemo(
    () =>
      [...drafts].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [drafts],
  );

  return (
    <View style={styles.sectionStack}>
      <View style={styles.contentHeader}>
        <View>
          <Text style={styles.sectionTitle}>Content</Text>
          <Text style={styles.panelSubtitle}>
            Sermons and Shorts prepared by your church.
          </Text>
        </View>
        <View style={styles.contentActions}>
          <Pressable
            style={styles.smallOutline}
            onPress={() => onOpenComposer("short")}
          >
            <Text style={styles.smallOutlineText}>+ Short</Text>
          </Pressable>
          <Pressable
            style={styles.smallPrimary}
            onPress={() => onOpenComposer("sermon")}
          >
            <Text style={styles.smallPrimaryText}>+ Sermon</Text>
          </Pressable>
        </View>
      </View>

      {composerOpen && (
        <DraftComposer
          contentType={composerType}
          onCancel={onCloseComposer}
          onCreated={onCreated}
        />
      )}

      <View style={styles.panel}>
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyCloud}>☁</Text>
            <Text style={styles.emptyTitle}>Your content library is empty</Text>
            <Text style={styles.emptyText}>
              Start with a sermon draft. Video upload comes next.
            </Text>
          </View>
        ) : (
          <View style={styles.draftList}>
            {sorted.map((draft) => (
              <DraftRow key={draft.id} draft={draft} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function DraftComposer({
  contentType,
  onCancel,
  onCreated,
}: {
  contentType: "sermon" | "short";
  onCancel: () => void;
  onCreated: (draft: StudioDraft) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(
    contentType === "short" ? "Short" : "Sermon",
  );
  const [scriptureReference, setScriptureReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (title.trim().length < 2 || saving) return;

    setSaving(true);
    setError("");

    try {
      const draft = await createStudioDraft({
        contentType,
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || "Sermon",
        scriptureReference: scriptureReference.trim(),
        visibility: "public",
      });
      onCreated(draft);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create draft.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.composer}>
      <View style={styles.composerHeader}>
        <View>
          <Text style={styles.composerEyebrow}>
            {contentType === "short" ? "NEW SHORT" : "NEW SERMON"}
          </Text>
          <Text style={styles.composerTitle}>Prepare content</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.composerClose}>
          <Text style={styles.composerCloseText}>×</Text>
        </Pressable>
      </View>

      <StudioField
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder={
          contentType === "short"
            ? "e.g. Grace for today"
            : "e.g. Walking Through the Storm"
        }
      />

      <StudioField
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        inputStyle={styles.textArea}
        placeholder="What is this message about?"
      />

      <View style={styles.twoColumn}>
        <View style={styles.flexOne}>
          <StudioField
            label="Category"
            value={category}
            onChangeText={setCategory}
          />
        </View>
        <View style={styles.flexOne}>
          <StudioField
            label="Scripture"
            value={scriptureReference}
            onChangeText={setScriptureReference}
            placeholder="e.g. Romans 8"
          />
        </View>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable
        disabled={title.trim().length < 2 || saving}
        style={[
          styles.saveButton,
          (title.trim().length < 2 || saving) && styles.disabled,
        ]}
        onPress={() => void create()}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save draft</Text>
        )}
      </Pressable>
    </View>
  );
}

function DraftRow({ draft }: { draft: StudioDraft }) {
  return (
    <View style={styles.draftRow}>
      <View
        style={[
          styles.draftIcon,
          draft.contentType === "short" && styles.draftIconShort,
        ]}
      >
        <Text style={styles.draftIconText}>
          {draft.contentType === "short" ? "▯" : "▶"}
        </Text>
      </View>
      <View style={styles.flexOne}>
        <Text numberOfLines={1} style={styles.draftTitle}>
          {draft.title}
        </Text>
        <Text style={styles.draftMeta}>
          {draft.category}
          {draft.scriptureReference ? ` · ${draft.scriptureReference}` : ""}
          {" · "}
          {draft.status}
        </Text>
      </View>
      <Text style={styles.draftStatus}>Draft</Text>
    </View>
  );
}

function StudioTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ReadinessRow({
  label,
  complete,
  last = false,
}: {
  label: string;
  complete: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.readinessRow, last && styles.readinessRowLast]}>
      <View
        style={[
          styles.readinessIcon,
          complete && styles.readinessIconComplete,
        ]}
      >
        <Text
          style={[
            styles.readinessIconText,
            complete && styles.readinessIconTextComplete,
          ]}
        >
          {complete ? "✓" : "•"}
        </Text>
      </View>
      <Text style={styles.readinessLabel}>{label}</Text>
      <Text
        style={[
          styles.readinessStatus,
          complete && styles.readinessStatusComplete,
        ]}
      >
        {complete ? "Complete" : "Add details"}
      </Text>
    </View>
  );
}

type StudioFieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  inputStyle?: object;
};

function StudioField({
  label,
  inputStyle,
  style,
  multiline,
  ...props
}: StudioFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          inputStyle,
          style,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.cloud,
  },
  topBar: {
    height: 66,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: colors.navy,
    fontSize: 32,
    lineHeight: 34,
    marginTop: -3,
  },
  topBarSpacer: {
    width: 40,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 72,
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
  },
  hero: {
    minHeight: 190,
    padding: 24,
    borderRadius: radii.xl,
    backgroundColor: colors.sky,
    overflow: "hidden",
    justifyContent: "center",
  },
  heroCloudOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.15)",
    right: -55,
    top: -90,
  },
  heroCloudTwo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.12)",
    right: 105,
    top: -75,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "900",
    marginTop: 6,
  },
  heroCopy: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 580,
  },
  verifiedPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 17,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  verifiedDot: {
    color: colors.white,
    fontWeight: "900",
  },
  verifiedText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginTop: spacing.lg,
    padding: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignSelf: "flex-start",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  tabActive: {
    backgroundColor: colors.mist,
  },
  tabText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  tabTextActive: {
    color: colors.skyDark,
  },
  loading: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 10,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 12,
  },
  errorCard: {
    marginTop: spacing.lg,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: "#FDEBEC",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  errorText: {
    color: "#9B1C1C",
    fontSize: 11,
    flex: 1,
  },
  retryText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: "900",
  },
  sectionStack: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  statGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minHeight: 100,
    padding: 17,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: "center",
  },
  statValue: {
    color: colors.navy,
    fontSize: 27,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  quickActions: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
  },
  actionGrid: {
    gap: 10,
  },
  primaryAction: {
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: colors.navy,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  primaryActionIcon: {
    color: colors.white,
    fontSize: 22,
  },
  primaryActionTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  primaryActionText: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 11,
    marginTop: 3,
  },
  secondaryAction: {
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  secondaryActionIcon: {
    color: colors.skyStrong,
    fontSize: 24,
  },
  secondaryActionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryActionText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  flexOne: {
    flex: 1,
  },
  panel: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  panelHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 14,
  },
  panelSubtitle: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  linkText: {
    color: colors.skyDark,
    fontSize: 11,
    fontWeight: "900",
  },
  readinessRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  readinessRowLast: {
    borderBottomWidth: 0,
  },
  readinessIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  readinessIconComplete: {
    backgroundColor: "#E7F7EF",
  },
  readinessIconText: {
    color: colors.skyDark,
    fontWeight: "900",
  },
  readinessIconTextComplete: {
    color: colors.success,
  },
  readinessLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  readinessStatus: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  readinessStatusComplete: {
    color: colors.success,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 34,
  },
  emptyCloud: {
    color: colors.sky,
    fontSize: 40,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 5,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  draftList: {
    gap: 9,
  },
  draftRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 9,
    borderRadius: radii.md,
    backgroundColor: colors.cloud,
  },
  draftIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  draftIconShort: {
    backgroundColor: colors.skyStrong,
  },
  draftIconText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  draftTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
  },
  draftMeta: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 4,
    textTransform: "capitalize",
  },
  draftStatus: {
    color: colors.skyDark,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  field: {
    marginTop: 15,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cloud,
    color: colors.ink,
    fontSize: 13,
  },
  inputMultiline: {
    paddingTop: 13,
    paddingBottom: 13,
    textAlignVertical: "top",
  },
  textArea: {
    minHeight: 116,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 10,
  },
  subheading: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 22,
  },
  helper: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },
  formMessage: {
    color: colors.skyDark,
    fontSize: 11,
    marginTop: 12,
  },
  saveButton: {
    minHeight: 50,
    marginTop: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.skyStrong,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.45,
  },
  contentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  contentActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallOutline: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  smallOutlineText: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: "900",
  },
  smallPrimary: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.skyStrong,
  },
  smallPrimaryText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },
  composer: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.line,
  },
  composerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  composerEyebrow: {
    color: colors.skyDark,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  composerTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  composerClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  composerCloseText: {
    color: colors.ink,
    fontSize: 21,
  },
  errorText: {
    color: "#B42318",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 10,
  },
});
