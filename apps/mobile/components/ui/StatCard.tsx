/**
 * StatCard — 숫자 통계 카드 (countUp + 트렌드)
 *
 * 대시보드, 탭 헤더 등에서 핵심 수치를 표시.
 * useCountUp 내장으로 진입 시 0→target 애니메이션 자동 적용.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { useCountUp } from '../../lib/animations/hooks';
import { useTheme , spacing } from '../../lib/theme';

type ModuleColorKey =
  | 'workout'
  | 'nutrition'
  | 'skin'
  | 'body'
  | 'personalColor'
  | 'face'
  | 'hair'
  | 'makeup'
  | 'posture'
  | 'oralHealth';

interface StatCardProps {
  /** 표시할 숫자 */
  value: number;
  /** 라벨 (숫자 아래) */
  label: string;
  /** 접미사 (%, kcal 등) */
  suffix?: string;
  /** 접두사 */
  prefix?: string;
  /** 소수점 자릿수 */
  decimals?: number;
  /** 트렌드 값 (+3, -2 등) */
  trend?: number;
  /** 모듈 색상 키 */
  moduleColor?: ModuleColorKey;
  /** countUp 애니메이션 시간 (ms) */
  duration?: number;
  /** 아이콘 이모지 (숫자 왼쪽 표시) */
  emoji?: string;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
}

export function StatCard({
  value,
  label,
  suffix = '',
  prefix = '',
  decimals = 0,
  trend,
  moduleColor,
  duration = 1000,
  emoji,
  style,
  testID = 'stat-card',
}: StatCardProps): React.JSX.Element {
  const { colors, module, spacing, radii, typography, shadows, status, isDark } = useTheme();

  // countUp 애니메이션 — SharedValue 기반
  const animatedValue = useCountUp(value, duration);
  const [displayValue, setDisplayValue] = useState('0');

  // SharedValue → JS state 브릿지
  useAnimatedReaction(
    () => animatedValue.value,
    (current) => {
      const formatted = decimals > 0
        ? current.toFixed(decimals)
        : Math.round(current).toString();
      runOnJS(setDisplayValue)(formatted);
    },
  );

  // 모듈 색상 결정
  const accentColor = moduleColor
    ? (module[moduleColor]?.base ?? colors.ring)
    : colors.ring;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.xl,
          padding: spacing.md,
          // 모듈별 accent shadow (웹 gradient-accent 카드 매칭)
          ...(isDark ? {} : {
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 3,
          }),
        },
        style,
      ]}
    >
      {/* 모듈 색상 악센트 바 (4px 두께 — 시각적 존재감) */}
      <View
        style={[
          styles.accentBar,
          {
            backgroundColor: accentColor,
            borderRadius: radii.full,
          },
        ]}
      />

      {/* 이모지 아이콘 (있을 경우) */}
      {emoji && (
        <Text
          style={{
            fontSize: typography.size.lg,
            marginTop: spacing.sm,
            marginBottom: spacing.xxs,
          }}
        >
          {emoji}
        </Text>
      )}

      {/* 숫자 */}
      <Text
        style={[
          styles.value,
          {
            color: colors.foreground,
            fontSize: typography.size['2xl'],
            fontWeight: typography.weight.bold,
            marginTop: emoji ? 0 : spacing.xs,
          },
        ]}
        accessibilityLabel={`${label} ${prefix}${value}${suffix}`}
      >
        {prefix}{displayValue}{suffix}
      </Text>

      {/* 라벨 */}
      <Text
        style={[
          styles.label,
          {
            color: colors.mutedForeground,
            fontSize: typography.size.xs,
            fontWeight: typography.weight.medium,
          },
        ]}
      >
        {label}
      </Text>

      {/* 트렌드 */}
      {trend !== undefined && trend !== 0 && (
        <View style={[styles.trendContainer, { marginTop: spacing.xs }]}>
          <Text
            style={[
              styles.trendText,
              {
                color: trend > 0 ? status.success : status.error,
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    minWidth: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  value: {},
  label: {
    marginTop: spacing.xxs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {},
});
