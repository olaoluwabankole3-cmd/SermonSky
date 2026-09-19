import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Video } from "../data/mock";
import { colors, radii } from "../theme";

type VideoCardProps = {
  video: Video;
  width?: number;
  compact?: boolean;
  onPress?: () => void;
};

export function VideoCard({
  video,
  width = 245,
  compact = false,
  onPress,
}: VideoCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: video.image }}
          style={[styles.image, compact && styles.imageCompact]}
        />
        <View style={styles.duration}>
          <Text style={styles.durationText}>{video.duration}</Text>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.title}>
        {video.title}
      </Text>

      <View style={styles.metaRow}>
        <Text numberOfLines={1} style={styles.church}>
          {video.church}
        </Text>
        {video.verified && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓</Text>
          </View>
        )}
      </View>

      <Text style={styles.meta}>
        {video.views} views · {video.age}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 5,
  },
  pressed: {
    opacity: 0.78,
  },
  imageWrap: {
    position: "relative",
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.mist,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  imageCompact: {
    aspectRatio: 1.62,
  },
  duration: {
    position: "absolute",
    right: 8,
    bottom: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "rgba(5, 25, 45, 0.82)",
  },
  durationText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    marginTop: 3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  church: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    maxWidth: "86%",
  },
  badge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.skyStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 11,
  },
});
