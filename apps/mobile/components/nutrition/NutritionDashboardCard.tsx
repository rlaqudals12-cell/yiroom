/**
 * NutritionDashboardCard — 영양 대시보드 요약 카드
 *
 * 홈 탭에 표시되는 영양 요약 위젯.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, nutrientColors } from '../../lib/theme';

export interface NutritionDashboardCardProps {
  /** 오늘 섭취 칼로리 */
  todayCalories: number;
  /** 목표 칼로리 */
  goalCalories: number;
  /** 기록된 식사 수 */
  mealsLogged: number;
  /** 수분 섭취량 (ml) */
  waterIntake?: number;
  /** 수분 목표 (ml) */
  waterGoal?: number;
  /** 탄단지 간단 표시 */
  macros?: { carbs: number; protein: number; fat: number };
  /** 카드 클릭 */
  onPress?: () => void;
  style?: ViewStyle;
}

export function NutritionDashboardCard({
  todayCalories,
  goalCalories,
  mealsLogged,
  waterIntake,
  waterGoal,
  macros,
  onPress,
  style,
}: NutritionDashboardCardProps): React.JSX.Element {
  const { colors, module, spacing, typography, radii, shadows } = useTheme();

  const calPct = goalCalories > 0 ? Math.round((todayCalories / goalCalories) * 100) : 0;

  return (
    <Pressable
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
      onPress={onPress}
      testID="nutrition-dashboard-card"
      accessibilityLabel={`오늘 영양 ${todayCalories}/${goalCalories}kcal, ${mealsLogged}끼 기록`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconBg,
              { backgroundColor: module.nutrition.base + '20', borderRadius: radii.lg },
            ]}
          >
            <Text style={{ fontSize: typography.size.lg }}>🥗</Text>
          </View>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginLeft: spacing.sm,
            }}
          >
            오늘의 영양
          </Text>
        </View>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: module.nutrition.base,
            fontWeight: typography.weight.semibold,
          }}
        >
          {calPct}%
        </Text>
      </View>

      {/* 칼로리 바 */}
      <View
        style={[
          styles.barBg,
          {
            height: 6,
            borderRadius: radii.full,
            backgroundColor: colors.muted,
            marginTop: spacing.sm,
          },
        ]}
      >
        <View
          style={{
            width: `${Math.min(calPct, 100)}%` as unknown as number,
            height: '100%',
            borderRadius: radii.full,
            backgroundColor: module.nutrition.base,
          }}
        />
      </View>

      {/* 통계 */}
      <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
        <View style={styles.stat}>
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {todayCalories}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            / {goalCalories}kcal
          </Text>
        </View>
        <View style={styles.stat}>
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {mealsLogged}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            끼 기록
          </Text>
        </View>
        {waterIntake !== undefined && waterGoal !== undefined && (
          <View style={styles.stat}>
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
              }}
            >
              {waterIntake}
            </Text>
            <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
              / {waterGoal}ml
            </Text>
          </View>
        )}
      </View>

      {/* 탄단지 칩 */}
      {macros && (
        <View style={[styles.macroRow, { marginTop: spacing.sm }]}>
          <Text style={{ fontSize: typography.size.xs, color: nutrientColors.carbs, fontWeight: typography.weight.medium }}>
            탄 {macros.carbs}g
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: nutrientColors.protein, fontWeight: typography.weight.medium }}>
            단 {macros.protein}g
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: nutrientColors.fat, fontWeight: typography.weight.medium }}>
            지 {macros.fat}g
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barBg: {
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
