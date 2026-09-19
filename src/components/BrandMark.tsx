import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.icon, compact && styles.iconCompact]}>
        <Text style={[styles.play, compact && styles.playCompact]}>▶</Text>
        <Text style={[styles.cross, compact && styles.crossCompact]}>+</Text>
      </View>
      {!compact && (
        <Text style={styles.wordmark}>
          Sermon<Text style={styles.sky}>Sky</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.sky,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  iconCompact: {
    width: 30,
    height: 30,
    borderRadius: 11,
  },
  play: {
    color: colors.white,
    fontSize: 23,
    marginLeft: 2,
    opacity: 0.98,
  },
  playCompact: {
    fontSize: 18,
  },
  cross: {
    position: "absolute",
    left: 8,
    top: 3,
    color: colors.white,
    fontWeight: "900",
    fontSize: 19,
    lineHeight: 21,
  },
  crossCompact: {
    left: 6,
    top: 2,
    fontSize: 15,
  },
  wordmark: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 23,
    letterSpacing: -0.8,
  },
  sky: {
    color: colors.skyStrong,
  },
});
