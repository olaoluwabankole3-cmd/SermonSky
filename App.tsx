import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { BrandMark } from "./src/components/BrandMark";
import { AdminReviewPanel } from "./src/components/AdminReviewPanel";
import {
  ChurchApplicationModal,
  ViewerAuthModal,
  type ChurchApplication,
  type PreviewViewer,
} from "./src/components/AccountFlows";
import { VideoCard } from "./src/components/VideoCard";
import {
  categories,
  churches,
  heroVideo,
  type Video,
  videos,
} from "./src/data/mock";
import {
  getCurrentViewer,
  getMyChurchApplication,
  logoutViewer,
} from "./src/api";
import { colors, radii, spacing } from "./src/theme";

type Tab = "Home" | "Shorts" | "Discover" | "Library" | "Profile";
type AccountFlow =
  | null
  | { kind: "viewer"; mode: "signup" | "login" }
  | { kind: "church" };

const absoluteFill = {
  position: "absolute" as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

const tabs: { key: Tab; glyph: string }[] = [
  { key: "Home", glyph: "⌂" },
  { key: "Shorts", glyph: "▶" },
  { key: "Discover", glyph: "⌕" },
  { key: "Library", glyph: "▣" },
  { key: "Profile", glyph: "○" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("Home");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [accountFlow, setAccountFlow] = useState<AccountFlow>(null);
  const [viewer, setViewer] = useState<PreviewViewer | null>(null);
  const [churchApplication, setChurchApplication] =
    useState<ChurchApplication | null>(null);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const currentViewer = await getCurrentViewer();
        if (cancelled) return;

        setViewer(currentViewer);

        if (currentViewer) {
          const application = await getMyChurchApplication();
          if (!cancelled) setChurchApplication(application);
        }
      } catch {
        if (!cancelled) {
          setViewer(null);
          setChurchApplication(null);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshChurchApplication = () => {
    void getMyChurchApplication()
      .then((application) => setChurchApplication(application))
      .catch(() => setChurchApplication(null));
  };

  const signOut = () => {
    void logoutViewer().finally(() => {
      setViewer(null);
      setChurchApplication(null);
    });
  };

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cloud} />
      <CloudBackdrop />

      {selectedVideo ? (
        <VideoDetail
          video={selectedVideo}
          onBack={() => setSelectedVideo(null)}
          onSelectVideo={setSelectedVideo}
        />
      ) : (
        <>
          <View style={styles.screen}>
            {tab === "Home" && <HomeScreen onSelectVideo={setSelectedVideo} />}
            {tab === "Shorts" && <ShortsScreen />}
            {tab === "Discover" && (
              <DiscoverScreen onSelectVideo={setSelectedVideo} />
            )}
            {tab === "Library" && (
              <LibraryScreen onSelectVideo={setSelectedVideo} />
            )}
            {tab === "Profile" && (
              <ProfileScreen
                viewer={viewer}
                churchApplication={churchApplication}
                onCreateViewer={() =>
                  setAccountFlow({ kind: "viewer", mode: "signup" })
                }
                onLogin={() =>
                  setAccountFlow({ kind: "viewer", mode: "login" })
                }
                onSignOut={signOut}
                onApplyChurch={() =>
                  viewer
                    ? setAccountFlow({ kind: "church" })
                    : setAccountFlow({ kind: "viewer", mode: "signup" })
                }
              />
            )}
          </View>
          <BottomNav current={tab} onChange={setTab} />
        </>
      )}

      <ViewerAuthModal
        visible={accountFlow?.kind === "viewer"}
        mode={
          accountFlow?.kind === "viewer" ? accountFlow.mode : "signup"
        }
        onClose={() => setAccountFlow(null)}
        onComplete={(nextViewer) => {
          setViewer(nextViewer);
          setAccountFlow(null);
          refreshChurchApplication();
        }}
      />

      <ChurchApplicationModal
        visible={accountFlow?.kind === "church"}
        onClose={() => setAccountFlow(null)}
        onSubmit={(application) => {
          setChurchApplication(application);
          setAccountFlow(null);
        }}
      />
    </SafeAreaView>
  );
}

function HomeScreen({
  onSelectVideo,
}: {
  onSelectVideo: (video: Video) => void;
}) {
  const { width } = useWindowDimensions();
  const heroWidth = Math.min(width - spacing.lg * 2, 720);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerRow}>
        <BrandMark />
        <View style={styles.headerActions}>
          <RoundAction label="⌕" />
          <RoundAction label="♢" />
        </View>
      </View>

      <View style={styles.heroIntro}>
        <Text style={styles.eyebrow}>WELCOME TO SERMONSKY</Text>
        <Text style={styles.pageTitle}>Grow in faith today.</Text>
        <Text style={styles.pageSubtitle}>
          Real churches. Real messages. A brighter tomorrow.
        </Text>
      </View>

      <Pressable
        onPress={() => onSelectVideo(heroVideo)}
        style={({ pressed }) => [
          styles.featuredCard,
          { width: heroWidth },
          pressed && styles.pressed,
        ]}
      >
        <Image source={{ uri: heroVideo.image }} style={styles.featuredImage} />
        <View style={styles.featuredScrim} />
        <View style={styles.featuredTopPill}>
          <Text style={styles.featuredTopPillText}>FEATURED SERMON</Text>
        </View>
        <View style={styles.featuredCopy}>
          <Text style={styles.featuredQuote}>THERE IS A{"\n"}BIGGER STORY</Text>
          <View style={styles.featuredMetaRow}>
            <View>
              <Text style={styles.featuredTitle}>{heroVideo.title}</Text>
              <Text style={styles.featuredChurch}>
                {heroVideo.church} ✓ · {heroVideo.views} views
              </Text>
            </View>
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶</Text>
            </View>
          </View>
        </View>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {categories.map((category) => (
          <View key={category} style={styles.chip}>
            <Text style={styles.chipText}>{category}</Text>
          </View>
        ))}
      </ScrollView>

      <SectionHeader title="From Churches You Follow" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {videos.slice(0, 3).map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onPress={() => onSelectVideo(video)}
          />
        ))}
      </ScrollView>

      <SectionHeader title="Latest Sermons" />
      <View style={styles.verticalList}>
        {videos.slice(2).map((video) => (
          <WideVideoRow
            key={video.id}
            video={video}
            onPress={() => onSelectVideo(video)}
          />
        ))}
      </View>

      <SectionHeader title="Popular Churches" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {churches.map((church) => (
          <View key={church.id} style={styles.churchCard}>
            <Image source={{ uri: church.image }} style={styles.churchImage} />
            <View style={styles.churchNameRow}>
              <Text numberOfLines={1} style={styles.churchName}>
                {church.name}
              </Text>
              <VerifiedBadge />
            </View>
            <Text style={styles.churchFollowers}>
              {church.followers} followers
            </Text>
            <Pressable style={styles.followSmall}>
              <Text style={styles.followSmallText}>Follow</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

function ShortsScreen() {
  return (
    <View style={styles.shortsScreen}>
      <View style={styles.shortsHeader}>
        <View style={styles.shortsBrand}>
          <BrandMark compact />
          <Text style={styles.shortsHeaderText}>SermonSky Shorts</Text>
        </View>
        <RoundAction label="⌕" dark />
      </View>

      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=88",
        }}
        style={styles.shortBackground}
        imageStyle={styles.shortBackgroundImage}
      >
        <View style={styles.shortOverlay} />
        <View style={styles.shortCenterCopy}>
          <Text style={styles.shortVerseSmall}>A BRIGHTER TOMORROW</Text>
          <Text style={styles.shortVerse}>WITH JESUS</Text>
        </View>

        <View style={styles.shortActions}>
          <ShortAction glyph="♡" value="1.8K" />
          <ShortAction glyph="◌" value="96" />
          <ShortAction glyph="↗" value="Share" />
          <ShortAction glyph="•••" value="" />
        </View>

        <View style={styles.shortFooter}>
          <View style={styles.shortChurchRow}>
            <View style={styles.shortAvatar}>
              <Text style={styles.shortAvatarText}>▲</Text>
            </View>
            <View style={styles.shortChurchCopy}>
              <View style={styles.inlineRow}>
                <Text style={styles.shortChurchName}>Elevation Church</Text>
                <VerifiedBadge />
              </View>
              <Text style={styles.shortHandle}>@elevationchurch</Text>
            </View>
            <Pressable style={styles.shortFollow}>
              <Text style={styles.shortFollowText}>Follow</Text>
            </Pressable>
          </View>
          <Text style={styles.shortCaption}>
            No matter the season, He is with you. ☁️
          </Text>
          <Text style={styles.shortTags}>#Jesus #Hope #Faith #SermonSky</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

function DiscoverScreen({
  onSelectVideo,
}: {
  onSelectVideo: (video: Video) => void;
}) {
  const [query, setQuery] = useState("");
  const { width } = useWindowDimensions();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return videos;
    return videos.filter(
      (video) =>
        video.title.toLowerCase().includes(normalized) ||
        video.church.toLowerCase().includes(normalized) ||
        video.category.toLowerCase().includes(normalized),
    );
  }, [query]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>DISCOVER</Text>
          <Text style={styles.pageTitle}>Find your next message.</Text>
        </View>
        <BrandMark compact />
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search sermons, churches, topics"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {categories.map((category) => (
          <Pressable key={category} style={styles.categoryCloud}>
            <Text style={styles.categoryCloudText}>{category}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <SectionHeader title="Verified Churches" />
      <View style={styles.discoverChurchList}>
        {churches.map((church) => (
          <View key={church.id} style={styles.discoverChurchRow}>
            <Image source={{ uri: church.image }} style={styles.discoverAvatar} />
            <View style={styles.flexOne}>
              <View style={styles.inlineRow}>
                <Text style={styles.discoverChurchName}>{church.name}</Text>
                <VerifiedBadge />
              </View>
              <Text style={styles.metaText}>
                {church.handle} · {church.followers} followers
              </Text>
            </View>
            <Pressable style={styles.followOutline}>
              <Text style={styles.followOutlineText}>Follow</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <SectionHeader title={query ? "Search Results" : "Explore Sermons"} />
      <View style={styles.videoGrid}>
        {filtered.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            width={Math.max(width - spacing.lg * 2, 280)}
            onPress={() => onSelectVideo(video)}
          />
        ))}
      </View>

      {filtered.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyCloud}>☁</Text>
          <Text style={styles.emptyTitle}>Nothing in the sky yet</Text>
          <Text style={styles.emptyCopy}>
            Try a church name, sermon title, or another topic.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function LibraryScreen({
  onSelectVideo,
}: {
  onSelectVideo: (video: Video) => void;
}) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>YOUR LIBRARY</Text>
          <Text style={styles.pageTitle}>Keep growing.</Text>
        </View>
        <BrandMark compact />
      </View>

      <View style={styles.libraryStats}>
        <LibraryStat value="12" label="Saved" />
        <View style={styles.statDivider} />
        <LibraryStat value="7" label="Following" />
        <View style={styles.statDivider} />
        <LibraryStat value="23" label="History" />
      </View>

      <SectionHeader title="Saved for Later" />
      <View style={styles.verticalList}>
        {videos.slice(0, 3).map((video) => (
          <WideVideoRow
            key={video.id}
            video={video}
            onPress={() => onSelectVideo(video)}
          />
        ))}
      </View>

      <SectionHeader title="Continue Watching" />
      <Pressable
        onPress={() => onSelectVideo(heroVideo)}
        style={styles.continueCard}
      >
        <Image source={{ uri: heroVideo.image }} style={styles.continueImage} />
        <View style={styles.continueBody}>
          <Text style={styles.continueTitle}>{heroVideo.title}</Text>
          <Text style={styles.metaText}>{heroVideo.church} ✓</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressValue} />
          </View>
          <Text style={styles.progressText}>12:36 of {heroVideo.duration}</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

function ProfileScreen({
  viewer,
  churchApplication,
  onCreateViewer,
  onLogin,
  onSignOut,
  onApplyChurch,
}: {
  viewer: PreviewViewer | null;
  churchApplication: ChurchApplication | null;
  onCreateViewer: () => void;
  onLogin: () => void;
  onSignOut: () => void;
  onApplyChurch: () => void;
}) {
  const initials = viewer
    ? viewer.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "SS";

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerRow}>
        <BrandMark />
        <RoundAction label="⚙" />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initials}</Text>
        </View>

        {viewer ? (
          <>
            <View style={styles.previewAccountBadge}>
              <Text style={styles.previewAccountBadgeText}>VIEWER ACCOUNT</Text>
            </View>
            <Text style={styles.profileTitle}>{viewer.name}</Text>
            <Text style={styles.profileSubtitle}>{viewer.email}</Text>
            <Text style={styles.profileHelperText}>
              Your account is connected to the SermonSky session API and will
              persist across refreshes once D1 is bound.
            </Text>
            <Pressable style={styles.signOutButton} onPress={onSignOut}>
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.profileTitle}>Your SermonSky</Text>
            <Text style={styles.profileSubtitle}>
              Follow churches, save sermons, and build a feed around your faith.
            </Text>
            <Pressable style={styles.primaryButton} onPress={onCreateViewer}>
              <Text style={styles.primaryButtonText}>Create viewer account</Text>
            </Pressable>
            <Pressable style={styles.textButton} onPress={onLogin}>
              <Text style={styles.textButtonText}>I already have an account</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.studioCard}>
        <View style={styles.studioCloudOne} />
        <View style={styles.studioCloudTwo} />

        {churchApplication ? (
          <>
            <Text style={styles.studioEyebrow}>APPLICATION RECEIVED</Text>
            <Text style={styles.studioTitle}>{churchApplication.churchName}</Text>
            <Text style={styles.studioCopy}>
              {churchApplication.status === "approved"
                ? "Your church is verified. SermonSky Studio publishing access is now unlocked for approved church members."
                : churchApplication.status === "rejected"
                  ? "This application was not approved. You can contact SermonSky support before submitting updated verification details."
                  : "Your Church Account application has been received. SermonSky Studio publishing remains locked until the application is approved."}
            </Text>
            <View style={styles.applicationStatusPill}>
              <Text style={styles.applicationStatusDot}>●</Text>
              <Text style={styles.applicationStatusText}>
                {churchApplication.status === "pending"
                  ? "Pending review"
                  : churchApplication.status === "approved"
                    ? "Approved"
                    : "Needs review"}
              </Text>
            </View>
            <Text style={styles.studioNote}>
              Representative: {churchApplication.representativeName} ·{" "}
              {churchApplication.role}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.studioEyebrow}>FOR VERIFIED CHURCHES</Text>
            <Text style={styles.studioTitle}>SermonSky Studio</Text>
            <Text style={styles.studioCopy}>
              Publish sermons and Shorts, manage your church page, and understand
              how your ministry is reaching people.
            </Text>
            <Pressable style={styles.studioButton} onPress={onApplyChurch}>
              <Text style={styles.studioButtonText}>Apply for a Church Account</Text>
            </Pressable>
            <Text style={styles.studioNote}>
              Uploading is restricted to approved churches and ministries.
            </Text>
          </>
        )}
      </View>

      {viewer?.role === "admin" && (
        <AdminReviewPanel
          onReviewed={() => {
            // The application card refreshes on the next session restore.
          }}
        />
      )}

      <View style={styles.settingsList}>
        <SettingsRow label="Notifications" />
        <SettingsRow label="Content preferences" />
        <SettingsRow label="Help & support" />
        <SettingsRow label="About SermonSky" last />
      </View>
    </ScrollView>
  );
}

function VideoDetail({
  video,
  onBack,
  onSelectVideo,
}: {
  video: Video;
  onBack: () => void;
  onSelectVideo: (video: Video) => void;
}) {
  const recommendations = videos.filter((item) => item.id !== video.id);

  return (
    <View style={styles.detailScreen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.detailContent}
      >
        <View style={styles.playerWrap}>
          <Image source={{ uri: video.image }} style={styles.playerImage} />
          <View style={styles.playerScrim} />
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
          <View style={styles.bigPlay}>
            <Text style={styles.bigPlayText}>▶</Text>
          </View>
          <View style={styles.playerTime}>
            <Text style={styles.playerTimeText}>12:36 / {video.duration}</Text>
          </View>
        </View>

        <View style={styles.detailBody}>
          <Text style={styles.detailTitle}>{video.title}</Text>
          <Text style={styles.detailMeta}>
            {video.views} views · {video.age} · #{video.category.replace(" ", "")}
          </Text>

          <View style={styles.channelRow}>
            <View style={styles.channelAvatar}>
              <Text style={styles.channelAvatarText}>▲</Text>
            </View>
            <View style={styles.flexOne}>
              <View style={styles.inlineRow}>
                <Text style={styles.channelName}>{video.church}</Text>
                <VerifiedBadge />
              </View>
              <Text style={styles.metaText}>Verified Church</Text>
            </View>
            <Pressable style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionRow}
          >
            <DetailAction glyph="♡" label="1.2K" />
            <DetailAction glyph="◌" label="124" />
            <DetailAction glyph="↗" label="Share" />
            <DetailAction glyph="▱" label="Save" />
          </ScrollView>

          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>About this message</Text>
            <Text style={styles.descriptionText}>
              A message about trusting God beyond what we can see and remembering
              that our present moment is part of a bigger story.
            </Text>
          </View>

          <SectionHeader title="Up next" />
          <View style={styles.verticalList}>
            {recommendations.map((item) => (
              <WideVideoRow
                key={item.id}
                video={item}
                onPress={() => onSelectVideo(item)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function BottomNav({
  current,
  onChange,
}: {
  current: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const active = current === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={styles.navItem}
          >
            <View style={[styles.navGlyphWrap, active && styles.navGlyphActive]}>
              <Text style={[styles.navGlyph, active && styles.navGlyphTextActive]}>
                {tab.glyph}
              </Text>
            </View>
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>
              {tab.key}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.seeAll}>See all</Text>
    </View>
  );
}

function RoundAction({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <Pressable style={[styles.roundAction, dark && styles.roundActionDark]}>
      <Text style={[styles.roundActionText, dark && styles.roundActionTextDark]}>
        {label}
      </Text>
    </Pressable>
  );
}

function VerifiedBadge() {
  return (
    <View style={styles.verified}>
      <Text style={styles.verifiedText}>✓</Text>
    </View>
  );
}

function WideVideoRow({
  video,
  onPress,
}: {
  video: Video;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wideRow, pressed && styles.pressed]}
    >
      <View style={styles.wideImageWrap}>
        <Image source={{ uri: video.image }} style={styles.wideImage} />
        <View style={styles.wideDuration}>
          <Text style={styles.wideDurationText}>{video.duration}</Text>
        </View>
      </View>
      <View style={styles.wideCopy}>
        <Text numberOfLines={2} style={styles.wideTitle}>
          {video.title}
        </Text>
        <View style={styles.inlineRow}>
          <Text style={styles.wideChurch}>{video.church}</Text>
          <VerifiedBadge />
        </View>
        <Text style={styles.metaText}>
          {video.views} views · {video.age}
        </Text>
      </View>
      <Text style={styles.moreGlyph}>⋮</Text>
    </Pressable>
  );
}

function ShortAction({ glyph, value }: { glyph: string; value: string }) {
  return (
    <View style={styles.shortActionItem}>
      <View style={styles.shortActionCircle}>
        <Text style={styles.shortActionGlyph}>{glyph}</Text>
      </View>
      {!!value && <Text style={styles.shortActionValue}>{value}</Text>}
    </View>
  );
}

function DetailAction({ glyph, label }: { glyph: string; label: string }) {
  return (
    <Pressable style={styles.detailAction}>
      <Text style={styles.detailActionGlyph}>{glyph}</Text>
      <Text style={styles.detailActionLabel}>{label}</Text>
    </Pressable>
  );
}

function LibraryStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.libraryStat}>
      <Text style={styles.libraryValue}>{value}</Text>
      <Text style={styles.libraryLabel}>{label}</Text>
    </View>
  );
}

function SettingsRow({ label, last = false }: { label: string; last?: boolean }) {
  return (
    <Pressable style={[styles.settingsRow, last && styles.settingsRowLast]}>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsArrow}>›</Text>
    </Pressable>
  );
}

function CloudBackdrop() {
  return (
    <View pointerEvents="none" style={absoluteFill}>
      <View style={styles.cloudOrbOne} />
      <View style={styles.cloudOrbTwo} />
      <View style={styles.cloudOrbThree} />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.cloud,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 118,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  roundAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  roundActionDark: {
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  roundActionText: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
  },
  roundActionTextDark: {
    color: colors.white,
  },
  heroIntro: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.skyDark,
    fontSize: 11,
    letterSpacing: 1.7,
    fontWeight: "900",
    marginBottom: 7,
  },
  pageTitle: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -1,
  },
  pageSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    maxWidth: 420,
  },
  featuredCard: {
    alignSelf: "center",
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: colors.navy,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 5,
  },
  featuredImage: {
    width: "100%",
    aspectRatio: 16 / 10,
  },
  featuredScrim: {
    ...absoluteFill,
    backgroundColor: "rgba(5, 33, 58, 0.26)",
  },
  featuredTopPill: {
    position: "absolute",
    left: 16,
    top: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  featuredTopPillText: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  featuredCopy: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 17,
  },
  featuredQuote: {
    color: colors.white,
    fontSize: 25,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: 0.6,
    textShadowColor: "rgba(0,0,0,0.28)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  featuredMetaRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  featuredTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  featuredChurch: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    marginTop: 4,
  },
  playButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonText: {
    color: colors.skyStrong,
    fontSize: 18,
    marginLeft: 2,
  },
  pressed: {
    opacity: 0.8,
  },
  chipRow: {
    gap: 9,
    paddingVertical: spacing.lg,
    paddingRight: spacing.lg,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: {
    color: colors.navy,
    fontWeight: "700",
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  seeAll: {
    color: colors.skyDark,
    fontSize: 12,
    fontWeight: "800",
  },
  horizontalList: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  verticalList: {
    gap: spacing.md,
  },
  wideRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 9,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  wideImageWrap: {
    width: 130,
    aspectRatio: 16 / 9,
    borderRadius: radii.md,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.mist,
  },
  wideImage: {
    width: "100%",
    height: "100%",
  },
  wideDuration: {
    position: "absolute",
    right: 5,
    bottom: 5,
    backgroundColor: "rgba(5,25,45,0.8)",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  wideDurationText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  wideCopy: {
    flex: 1,
    gap: 4,
  },
  wideTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  wideChurch: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  metaText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  moreGlyph: {
    color: colors.muted,
    fontSize: 20,
    paddingHorizontal: 2,
  },
  verified: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.skyStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
  },
  churchCard: {
    width: 160,
    borderRadius: radii.lg,
    padding: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  churchImage: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: radii.md,
    marginBottom: 10,
  },
  churchNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  churchName: {
    flexShrink: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  churchFollowers: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
  },
  followSmall: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: colors.mist,
    borderRadius: radii.pill,
  },
  followSmallText: {
    color: colors.skyDark,
    fontSize: 11,
    fontWeight: "800",
  },
  bottomNav: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    height: 76,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  navGlyphWrap: {
    minWidth: 34,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  navGlyphActive: {
    backgroundColor: colors.mist,
  },
  navGlyph: {
    color: colors.muted,
    fontSize: 19,
    fontWeight: "800",
  },
  navGlyphTextActive: {
    color: colors.skyStrong,
  },
  navLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "700",
  },
  navLabelActive: {
    color: colors.skyDark,
  },
  shortsScreen: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 96,
  },
  shortsHeader: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    position: "absolute",
    top: 12,
    left: 18,
    right: 18,
    zIndex: 3,
  },
  shortsBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shortsHeaderText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 16,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowRadius: 5,
  },
  shortBackground: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  shortBackgroundImage: {
    borderRadius: radii.xl,
  },
  shortOverlay: {
    ...absoluteFill,
    backgroundColor: "rgba(4,31,52,0.20)",
  },
  shortCenterCopy: {
    position: "absolute",
    top: "23%",
    left: 20,
    right: 20,
    alignItems: "center",
  },
  shortVerseSmall: {
    color: colors.white,
    fontSize: 13,
    letterSpacing: 2.8,
    fontWeight: "600",
  },
  shortVerse: {
    color: colors.white,
    fontSize: 34,
    letterSpacing: 1.2,
    fontWeight: "900",
    marginTop: 5,
  },
  shortActions: {
    position: "absolute",
    right: 13,
    bottom: 120,
    gap: 17,
  },
  shortActionItem: {
    alignItems: "center",
    gap: 4,
  },
  shortActionCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  shortActionGlyph: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
  },
  shortActionValue: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  shortFooter: {
    padding: 16,
    paddingRight: 70,
    gap: 7,
  },
  shortChurchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  shortAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  shortAvatarText: {
    color: colors.skyStrong,
    fontSize: 14,
    fontWeight: "900",
  },
  shortChurchCopy: {
    flex: 1,
  },
  shortChurchName: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  shortHandle: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 10,
    marginTop: 2,
  },
  shortFollow: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  shortFollowText: {
    color: colors.skyDark,
    fontSize: 11,
    fontWeight: "900",
  },
  shortCaption: {
    color: colors.white,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  shortTags: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 11,
  },
  searchBox: {
    height: 54,
    marginTop: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 10,
  },
  searchIcon: {
    color: colors.skyDark,
    fontSize: 22,
    fontWeight: "800",
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    height: "100%",
  },
  categoryCloud: {
    paddingHorizontal: 17,
    paddingVertical: 11,
    backgroundColor: colors.mist,
    borderRadius: radii.pill,
  },
  categoryCloudText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "800",
  },
  discoverChurchList: {
    gap: 10,
  },
  discoverChurchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
  },
  discoverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  flexOne: {
    flex: 1,
  },
  discoverChurchName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  followOutline: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.sky,
  },
  followOutlineText: {
    color: colors.skyDark,
    fontSize: 11,
    fontWeight: "900",
  },
  videoGrid: {
    gap: spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyCloud: {
    fontSize: 48,
    color: colors.sky,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8,
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 5,
  },
  libraryStats: {
    marginTop: spacing.xl,
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 18,
  },
  libraryStat: {
    flex: 1,
    alignItems: "center",
  },
  libraryValue: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: "900",
  },
  libraryLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.line,
  },
  continueCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  continueImage: {
    width: "100%",
    aspectRatio: 16 / 8,
  },
  continueBody: {
    padding: 15,
  },
  continueTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line,
    overflow: "hidden",
    marginTop: 12,
  },
  progressValue: {
    width: "30%",
    height: "100%",
    backgroundColor: colors.skyStrong,
  },
  progressText: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 5,
  },
  profileCard: {
    marginTop: spacing.xl,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
  },
  profileAvatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: colors.skyDark,
    fontSize: 21,
    fontWeight: "900",
  },
  profileTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 14,
  },
  profileSubtitle: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 340,
  },
  primaryButton: {
    alignSelf: "stretch",
    marginTop: 20,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.skyStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  textButton: {
    paddingVertical: 13,
  },
  textButtonText: {
    color: colors.skyDark,
    fontSize: 12,
    fontWeight: "800",
  },
  previewAccountBadge: {
    marginTop: 13,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.mist,
  },
  previewAccountBadgeText: {
    color: colors.skyDark,
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: "900",
  },
  profileHelperText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 350,
  },
  signOutButton: {
    marginTop: 17,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutButtonText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: "900",
  },
  applicationStatusPill: {
    alignSelf: "flex-start",
    marginTop: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  applicationStatusDot: {
    color: colors.white,
    fontSize: 10,
  },
  applicationStatusText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
  studioCard: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.sky,
    padding: 23,
    overflow: "hidden",
  },
  studioCloudOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.16)",
    right: -45,
    top: -70,
  },
  studioCloudTwo: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.12)",
    right: 75,
    top: -50,
  },
  studioEyebrow: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: "900",
  },
  studioTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 7,
  },
  studioCopy: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 390,
  },
  studioButton: {
    alignSelf: "flex-start",
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
  },
  studioButtonText: {
    color: colors.skyDark,
    fontSize: 12,
    fontWeight: "900",
  },
  studioNote: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    marginTop: 13,
  },
  settingsList: {
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  settingsRow: {
    minHeight: 54,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  settingsRowLast: {
    borderBottomWidth: 0,
  },
  settingsLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  settingsArrow: {
    color: colors.muted,
    fontSize: 22,
  },
  detailScreen: {
    flex: 1,
    backgroundColor: colors.cloud,
  },
  detailContent: {
    paddingBottom: spacing.xxl,
  },
  playerWrap: {
    position: "relative",
    backgroundColor: colors.navy,
  },
  playerImage: {
    width: "100%",
    aspectRatio: 16 / 10,
  },
  playerScrim: {
    ...absoluteFill,
    backgroundColor: "rgba(5,27,45,0.20)",
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 14,
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  backButtonText: {
    color: colors.white,
    fontSize: 34,
    lineHeight: 34,
    marginTop: -3,
  },
  bigPlay: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 62,
    height: 62,
    marginLeft: -31,
    marginTop: -31,
    borderRadius: 31,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  bigPlayText: {
    color: colors.skyStrong,
    fontSize: 25,
    marginLeft: 4,
  },
  playerTime: {
    position: "absolute",
    right: 14,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.56)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  playerTimeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  detailBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
  },
  detailMeta: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  channelAvatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  channelAvatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  channelName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  followButton: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    backgroundColor: colors.skyStrong,
    borderRadius: radii.pill,
  },
  followButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
  actionRow: {
    gap: 9,
    paddingVertical: 17,
  },
  detailAction: {
    minWidth: 76,
    height: 41,
    paddingHorizontal: 13,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  detailActionGlyph: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  detailActionLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
  },
  descriptionCard: {
    borderRadius: radii.lg,
    padding: 15,
    backgroundColor: colors.mist,
  },
  descriptionTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "900",
  },
  descriptionText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  cloudOrbOne: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(89,184,246,0.07)",
    top: -110,
    right: -90,
  },
  cloudOrbTwo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(89,184,246,0.05)",
    top: -80,
    right: 80,
  },
  cloudOrbThree: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.70)",
    bottom: -110,
    left: -80,
  },
});
