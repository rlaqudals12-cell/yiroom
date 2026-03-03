/**
 * NutritionSummaryCard — 영양 요약 카드
 *
 * 주간/월간 영양 섭취 요약을 표시.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface NutritionSummaryCardProps {
  avgCalories: number;
  avgCarbs: number;
  avgProtein: number;
  avgFat: number;
  period: string;
  style?: ViewStyle;
}

export function NutritionSummaryCard({
  avgCalories,
  avgCarbs,
  avgProtein,
  avgFat,
  period,
  style,
}: NutritionSummaryCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, nutrient, module } = useTheme();

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
      testID="nutrition-summary-card"
      accessibilityLabel={`${period} 영양 요약`}
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.base }}>🍽️</Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginLeft: spacing.xs,
          }}
        >
          영양 요약
        </Text>
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
            marginLeft: spacing.xs,
          }}
        >
          {period}
        </Text>
      </View>

      <View style={{ marginTop: spacing.sm }}>
        <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: module.nutrition.base }}>
          평균 {avgCalories}kcal
        </Text>
      </View>

      <View style={[styles.macroRow, { marginTop: spacing.sm, gap: spacing.sm }]}>
        <View style={[styles.macroItem, { backgroundColor: nutrient.carbs + '20', borderRadius: radii.xl, padding: spacing.sm }]}>
          <Text style={{ fontSize: typography.size.xs, color: nutrient.carbs, fontWeight: typography.weight.medium }}>
            탄수화물
          </Text>
          <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: nutrient.carbs, marginTop: spacing.xxs }}>
            {avgCarbs}g
          </Text>
        </View>
        <View style={[styles.macroItem, { backgroundColor: nutrient.protein + '20', borderRadius: radii.xl, padding: spacing.sm }]}>
          <Text style={{ fontSize: typography.size.xs, color: nutrient.protein, fontWeight: typography.weight.medium }}>
            단백질
          </Text>
          <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: nutrient.protein, marginTop: spacing.xxs }}>
            {avgProtein}g
          </Text>
        </View>
        <View style={[styles.macroItem, { backgroundColor: nutrient.fat + '20', borderRadius: radii.xl, padding: spacing.sm }]}>
          <Text style={{ fontSize: typography.size.xs, color: nutrient.fat, fontWeight: typography.weight.medium }}>
            지방
          </Text>
          <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: nutrient.fat, marginTop: spacing.xxs }}>
            {avgFat}g
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroRow: {
    flexDirection: 'row',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
});
