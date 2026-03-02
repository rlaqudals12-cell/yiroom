/**
 * NutrientBarChart — 영양소 막대 차트
 *
 * 여러 영양소의 목표 대비 섭취량을 가로 막대로 표시.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface NutrientData {
  /** 영양소 이름 */
  name: string;
  /** 섭취량 */
  current: number;
  /** 목표량 */
  goal: number;
  /** 단위 */
  unit: string;
  /** 막대 색상 */
  color: string;
}

export interface NutrientBarChartProps {
  /** 영양소 데이터 목록 */
  nutrients: NutrientData[];
  /** 제목 */
  title?: string;
  style?: ViewStyle;
}

export function NutrientBarChart({
  nutrients,
  title,
  style,
}: NutrientBarChartProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status } = useTheme();

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
      testID="nutrient-bar-chart"
      accessibilityLabel={`${title ?? '영양소'} 차트, ${nutrients.length}개 항목`}
    >
      {title && (
        <Text
          style={{
            fontSize: typography.size.lg,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginBottom: spacing.sm,
          }}
        >
          {title}
        </Text>
      )}

      {nutrients.map((nutrient) => {
        const pct = nutrient.goal > 0 ? Math.min((nutrient.current / nutrient.goal) * 100, 100) : 0;
        const isOver = nutrient.current > nutrient.goal;

        return (
          <View
            key={nutrient.name}
            style={[styles.row, { marginBottom: spacing.sm }]}
            accessibilityLabel={`${nutrient.name} ${nutrient.current}/${nutrient.goal}${nutrient.unit}`}
          >
            {/* 이름 */}
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                fontWeight: typography.weight.medium,
                width: 60,
              }}
            >
              {nutrient.name}
            </Text>

            {/* 바 */}
            <View
              style={[
                styles.barBg,
                {
                  flex: 1,
                  height: 8,
                  borderRadius: radii.full,
                  backgroundColor: colors.muted,
                  marginHorizontal: spacing.sm,
                },
              ]}
            >
              <View
                style={{
                  width: `${pct}%` as unknown as number,
                  height: '100%',
                  borderRadius: radii.full,
                  backgroundColor: isOver ? status.error : nutrient.color,
                }}
              />
            </View>

            {/* 값 */}
            <Text
              style={{
                fontSize: typography.size.xs,
                color: isOver ? status.error : colors.mutedForeground,
                fontWeight: typography.weight.medium,
                width: 70,
                textAlign: 'right',
              }}
            >
              {nutrient.current}/{nutrient.goal}{nutrient.unit}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBg: {
    overflow: 'hidden',
  },
});
