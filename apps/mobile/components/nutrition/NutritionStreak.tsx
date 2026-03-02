/**
 * NutritionStreak — 영양 기록 연속 달성 카드
 *
 * 식단 기록 연속일 + 주간 달성 현황.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, spacing } from '../../lib/theme';

export interface NutritionStreakProps {
  /** 현재 연속일 */
  currentStreak: number;
  /** 최장 연속일 */
  longestStreak: number;
  /** 최근 7일 기록 여부 */
  recentDays: boolean[];
  style?: ViewStyle;
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export function NutritionStreak({
  currentStreak,
  longestStreak,
  recentDays,
  style,
}: NutritionStreakProps): React.JSX.Element {
  const { colors, module, spacing, typography, radii, shadows, status } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="nutrition-streak"
      accessibilityLabel={`식단 기록 ${currentStreak}일 연속, 최장 ${longestStreak}일`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          🔥 식단 기록 연속
        </Text>
      </View>

      {/* 연속일 */}
      <View style={[styles.streakRow, { marginTop: spacing.sm }]}>
        <View style={styles.streakItem}>
          <Text
            style={{
              fontSize: typography.size['3xl'],
              fontWeight: typography.weight.bold,
              color: module.nutrition.base,
            }}
          >
            {currentStreak}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            현재
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.streakItem}>
          <Text
            style={{
              fontSize: typography.size['3xl'],
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {longestStreak}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            최장
          </Text>
        </View>
      </View>

      {/* 주간 현황 */}
      <View style={[styles.weekRow, { marginTop: spacing.md }]}>
        {recentDays.slice(0, 7).map((done, i) => (
          <View key={i} style={styles.dayCol}>
            <View
              style={[
                styles.dayDot,
                {
                  backgroundColor: done ? status.success : colors.muted,
                  borderRadius: radii.full,
                },
              ]}
            >
              {done && (
                <Text style={{ fontSize: 10, color: colors.overlayForeground }}>✓</Text>
              )}
            </View>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginTop: spacing.xs,
              }}
            >
              {DAY_LABELS[i]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {},
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  streakItem: {
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
  },
  dayDot: {
    width: spacing.lg,
    height: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
