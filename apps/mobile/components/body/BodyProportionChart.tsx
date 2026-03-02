/**
 * BodyProportionChart -- 신체 비율 차트
 *
 * 수평 막대 차트로 신체 비율(어깨, 허리, 힙 등)을 시각화.
 * 각 항목별 비율을 퍼센티지와 함께 표시.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';

export interface BodyProportionMeasurement {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}

export interface BodyProportionChartProps {
  measurements: BodyProportionMeasurement[];
  title?: string;
  testID?: string;
}

export function BodyProportionChart({
  measurements,
  title = '신체 비율',
  testID = 'body-proportion-chart',
}: BodyProportionChartProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
      ]}
      testID={testID}
      accessibilityLabel={`${title}: ${measurements.length}개 항목`}
    >
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.md,
        }}
      >
        {title}
      </Text>

      {measurements.map((item, index) => {
        const percentage = Math.min(100, Math.round((item.value / item.maxValue) * 100));
        const barColor = item.color ?? brand.primary;

        return (
          <Animated.View
            key={item.label}
            entering={FadeInDown.delay(index * 80).duration(300)}
            style={[
              styles.row,
              {
                marginBottom: index < measurements.length - 1 ? spacing.sm : 0,
              },
            ]}
            accessibilityLabel={`${item.label}: ${item.value}, ${percentage}%`}
          >
            {/* 라벨 */}
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                fontWeight: typography.weight.medium,
                width: 60,
              }}
              numberOfLines={1}
            >
              {item.label}
            </Text>

            {/* 바 영역 */}
            <View style={[styles.barContainer, { flex: 1, marginHorizontal: spacing.sm }]}>
              <View
                style={[
                  styles.barTrack,
                  {
                    backgroundColor: colors.secondary,
                    borderRadius: radii.full,
                    height: 10,
                  },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: barColor,
                      borderRadius: radii.full,
                    },
                  ]}
                />
              </View>
            </View>

            {/* 퍼센티지 */}
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: colors.mutedForeground,
                width: 40,
                textAlign: 'right',
              }}
            >
              {percentage}%
            </Text>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barContainer: {},
  barTrack: {
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
});
