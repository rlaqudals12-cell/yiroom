/**
 * BodyMeasurementCard -- 체형 측정 카드
 *
 * 신체 측정값(현재/이전/이상 범위)을 시각적으로 표시.
 * 이전 값 대비 변화 방향(증가/감소)과 이상 범위 바를 렌더링.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowUp, ArrowDown, Ruler } from 'lucide-react-native';

import { useTheme, radii} from '../../lib/theme';

export interface BodyMeasurementCardProps {
  label: string;
  value: number;
  unit: string;
  previousValue?: number;
  idealRange?: { min: number; max: number };
  testID?: string;
}

export function BodyMeasurementCard({
  label,
  value,
  unit,
  previousValue,
  idealRange,
  testID = 'body-measurement-card',
}: BodyMeasurementCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status, brand } = useTheme();

  const diff = previousValue !== undefined ? value - previousValue : null;
  const isInRange =
    idealRange !== undefined ? value >= idealRange.min && value <= idealRange.max : null;

  // 이상 범위 바에서 현재 값의 위치 비율 (0~1)
  const rangePosition =
    idealRange !== undefined
      ? Math.max(0, Math.min(1, (value - idealRange.min) / (idealRange.max - idealRange.min)))
      : 0;

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
      accessibilityLabel={`${label}: ${value}${unit}${diff !== null ? `, ${diff > 0 ? '증가' : diff < 0 ? '감소' : '유지'}` : ''}`}
    >
      {/* 헤더: 라벨 + 아이콘 */}
      <View style={styles.header}>
        <Ruler size={16} color={colors.mutedForeground} />
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.medium,
            color: colors.mutedForeground,
            marginLeft: spacing.xs,
          }}
        >
          {label}
        </Text>
      </View>

      {/* 값 + 변화 표시 */}
      <View style={[styles.valueRow, { marginTop: spacing.sm }]}>
        <Text
          style={{
            fontSize: typography.size['2xl'],
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          {value}
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.normal,
              color: colors.mutedForeground,
            }}
          >
            {unit}
          </Text>
        </Text>

        {diff !== null && diff !== 0 && (
          <View
            style={[
              styles.changeBadge,
              {
                backgroundColor: diff > 0 ? `${status.error}18` : `${status.success}18`,
                borderRadius: radii.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xxs,
                marginLeft: spacing.sm,
              },
            ]}
          >
            {diff > 0 ? (
              <ArrowUp size={12} color={status.error} />
            ) : (
              <ArrowDown size={12} color={status.success} />
            )}
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: diff > 0 ? status.error : status.success,
                marginLeft: spacing.xxs,
              }}
            >
              {Math.abs(diff).toFixed(1)}{unit}
            </Text>
          </View>
        )}
      </View>

      {/* 이상 범위 바 */}
      {idealRange !== undefined && (
        <View style={{ marginTop: spacing.sm }}>
          <View style={styles.rangeLabels}>
            <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
              {idealRange.min}{unit}
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: isInRange ? status.success : status.warning,
              }}
            >
              {isInRange ? '정상 범위' : '범위 밖'}
            </Text>
            <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
              {idealRange.max}{unit}
            </Text>
          </View>

          <View
            style={[
              styles.rangeBar,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.full,
                height: 6,
                marginTop: spacing.xs,
              },
            ]}
          >
            {/* 이상 범위 영역 (전체) */}
            <View
              style={[
                styles.rangeIdeal,
                {
                  backgroundColor: `${status.success}30`,
                  borderRadius: radii.full,
                },
              ]}
            />
            {/* 현재 값 표시 점 */}
            <View
              style={[
                styles.rangeDot,
                {
                  left: `${rangePosition * 100}%`,
                  backgroundColor: isInRange ? status.success : status.warning,
                  borderColor: colors.card,
                },
              ]}
            />
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeBar: {
    position: 'relative',
    overflow: 'hidden',
  },
  rangeIdeal: {
    ...StyleSheet.absoluteFillObject,
  },
  rangeDot: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: radii.sm,
    borderWidth: 2,
    marginLeft: -6,
  },
});
