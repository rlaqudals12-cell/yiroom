/**
 * DailyCalorieSummary — 일일 칼로리 요약 카드
 *
 * 목표/섭취/남은 칼로리 + 탄단지 비율 표시.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, nutrientColors } from '../../lib/theme';

export interface DailyCalorieSummaryProps {
  /** 목표 칼로리 */
  goal: number;
  /** 섭취 칼로리 */
  consumed: number;
  /** 탄수화물 g */
  carbs: number;
  /** 단백질 g */
  protein: number;
  /** 지방 g */
  fat: number;
  style?: ViewStyle;
}

export function DailyCalorieSummary({
  goal,
  consumed,
  carbs,
  protein,
  fat,
  style,
}: DailyCalorieSummaryProps): React.JSX.Element {
  const { colors, module, spacing, typography, radii, shadows, status } = useTheme();

  const remaining = Math.max(goal - consumed, 0);
  const pct = goal > 0 ? Math.round((consumed / goal) * 100) : 0;

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
      testID="daily-calorie-summary"
      accessibilityLabel={`오늘 ${consumed}/${goal}kcal 섭취, ${pct}% 달성`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text
          style={{
            fontSize: typography.size.lg,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          오늘의 칼로리
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: module.nutrition.base,
            fontWeight: typography.weight.semibold,
          }}
        >
          {pct}%
        </Text>
      </View>

      {/* 프로그레스 바 */}
      <View
        style={[
          styles.progressBg,
          {
            height: 8,
            borderRadius: radii.full,
            backgroundColor: colors.muted,
            marginTop: spacing.sm,
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(pct, 100)}%` as unknown as number,
              backgroundColor: consumed > goal ? status.error : module.nutrition.base,
              borderRadius: radii.full,
            },
          ]}
        />
      </View>

      {/* 숫자 */}
      <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
        <StatItem
          label="섭취"
          value={`${consumed}`}
          unit="kcal"
          color={colors.foreground}
          muted={colors.mutedForeground}
          typography={typography}
        />
        <StatItem
          label="목표"
          value={`${goal}`}
          unit="kcal"
          color={colors.foreground}
          muted={colors.mutedForeground}
          typography={typography}
        />
        <StatItem
          label="남은"
          value={`${remaining}`}
          unit="kcal"
          color={remaining > 0 ? module.nutrition.base : status.error}
          muted={colors.mutedForeground}
          typography={typography}
        />
      </View>

      {/* 탄단지 */}
      <View style={[styles.macroRow, { marginTop: spacing.sm }]}>
        <MacroChip label="탄" value={carbs} color={nutrientColors.carbs} typography={typography} />
        <MacroChip label="단" value={protein} color={nutrientColors.protein} typography={typography} />
        <MacroChip label="지" value={fat} color={nutrientColors.fat} typography={typography} />
      </View>
    </View>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  muted: string;
  typography: ReturnType<typeof useTheme>['typography'];
}

function StatItem({ label, value, unit, color, muted, typography }: StatItemProps): React.JSX.Element {
  return (
    <View style={styles.statItem}>
      <Text style={{ fontSize: typography.size.xs, color: muted }}>{label}</Text>
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color }}>
        {value}
      </Text>
      <Text style={{ fontSize: typography.size.xs, color: muted }}>{unit}</Text>
    </View>
  );
}

interface MacroChipProps {
  label: string;
  value: number;
  color: string;
  typography: ReturnType<typeof useTheme>['typography'];
}

function MacroChip({ label, value, color, typography }: MacroChipProps): React.JSX.Element {
  return (
    <View style={[styles.macroChip, { backgroundColor: color + '20' }]}>
      <Text style={{ fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color }}>
        {label} {value}g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBg: {
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
});
