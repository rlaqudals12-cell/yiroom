/**
 * CalorieTrendChart — 칼로리 트렌드 차트
 *
 * 주간/월간 칼로리 섭취 추이를 막대 그래프로 표시.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface CalorieDataPoint {
  label: string;
  value: number;
}

export interface CalorieTrendChartProps {
  data: CalorieDataPoint[];
  targetCalories?: number;
  style?: ViewStyle;
}

export function CalorieTrendChart({
  data,
  targetCalories,
  style,
}: CalorieTrendChartProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, nutrient } = useTheme();

  const maxValue = Math.max(...data.map((d) => d.value), targetCalories ?? 0);

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
      testID="calorie-trend-chart"
      accessibilityLabel={`칼로리 트렌드, ${data.length}일`}
    >
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        칼로리 추이
      </Text>

      <View style={[styles.chartArea, { height: 120 }]}>
        {targetCalories !== undefined && (
          <View
            style={[
              styles.targetLine,
              {
                bottom: (targetCalories / maxValue) * 100,
                borderColor: colors.mutedForeground,
              },
            ]}
          />
        )}
        <View style={[styles.barRow, { gap: spacing.xs }]}>
          {data.map((point, i) => {
            const barHeight = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
            const isOverTarget = targetCalories !== undefined && point.value > targetCalories;
            return (
              <View key={i} style={styles.barItem}>
                <View style={[styles.barContainer, { height: 100 }]}>
                  <View
                    style={{
                      height: `${barHeight}%`,
                      backgroundColor: isOverTarget ? nutrient.fat : nutrient.carbs,
                      borderRadius: radii.sm,
                      minHeight: 4,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    color: colors.mutedForeground,
                    textAlign: 'center',
                    marginTop: spacing.xxs,
                  }}
                >
                  {point.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {targetCalories !== undefined && (
        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: spacing.sm }}>
          목표: {targetCalories}kcal
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  chartArea: {},
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    justifyContent: 'flex-end',
  },
});
