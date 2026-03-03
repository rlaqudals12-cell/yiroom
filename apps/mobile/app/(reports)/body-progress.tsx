/**
 * 체형 변화 추적 화면
 *
 * 체형 분석 결과의 시간에 따른 변화를 추적한다.
 */
import { View, Text, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';
import { staggeredEntry, TIMING } from '../../lib/animations';

interface BodyMeasurement {
  date: string;
  label: string;
  shoulders: number;
  waist: number;
  hips: number;
  bodyType: string;
  balanceScore: number;
}

const MOCK_MEASUREMENTS: BodyMeasurement[] = [
  {
    date: '2026-03-01',
    label: '이번 달',
    shoulders: 42,
    waist: 28,
    hips: 38,
    bodyType: '역삼각형',
    balanceScore: 82,
  },
  {
    date: '2026-02-01',
    label: '지난 달',
    shoulders: 41,
    waist: 29,
    hips: 38,
    bodyType: '역삼각형',
    balanceScore: 78,
  },
  {
    date: '2026-01-01',
    label: '2개월 전',
    shoulders: 40,
    waist: 30,
    hips: 38,
    bodyType: '직사각형',
    balanceScore: 72,
  },
];

export default function BodyProgressScreen(): React.ReactElement {
  const { colors, brand, spacing, radii, typography, status, module: moduleColors, score: scoreColors } = useTheme();

  const latest = MOCK_MEASUREMENTS[0];
  const previous = MOCK_MEASUREMENTS[1];

  const getDelta = (current: number, prev: number): { text: string; color: string } => {
    const diff = current - prev;
    if (diff === 0) return { text: '변동 없음', color: colors.mutedForeground };
    return {
      text: `${diff > 0 ? '+' : ''}${diff}`,
      color: diff > 0 ? status.success : status.info,
    };
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return scoreColors.excellent;
    if (score >= 60) return scoreColors.good;
    if (score >= 40) return scoreColors.caution;
    return scoreColors.poor;
  };

  return (
    <ScrollView
      testID="body-progress-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        체형 변화 추적
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        체형 분석 결과의 변화를 확인하세요
      </Text>

      {/* 현재 상태 카드 */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          marginBottom: spacing.lg,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground, marginBottom: spacing.xs }}>
          현재 체형
        </Text>
        <Text style={{ fontSize: typography.size['3xl'], fontWeight: typography.weight.bold, color: moduleColors.body.base }}>
          {latest.bodyType}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
          <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>균형 점수</Text>
          <Text style={{ fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: getScoreColor(latest.balanceScore) }}>
            {latest.balanceScore}점
          </Text>
        </View>
      </View>

      {/* 측정 비교 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }} accessibilityRole="header">
        측정 비교
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        {[
          { label: '어깨 너비', current: latest.shoulders, prev: previous.shoulders, unit: 'cm' },
          { label: '허리 둘레', current: latest.waist, prev: previous.waist, unit: 'cm' },
          { label: '엉덩이 둘레', current: latest.hips, prev: previous.hips, unit: 'cm' },
        ].map((item, index) => {
          const delta = getDelta(item.current, item.prev);
          return (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.sm,
                borderBottomWidth: index < 2 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ flex: 1, fontSize: typography.size.base, color: colors.foreground }}>{item.label}</Text>
              <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground, marginRight: spacing.sm }}>
                {item.current}{item.unit}
              </Text>
              <Text style={{ fontSize: typography.size.sm, color: delta.color, minWidth: 60, textAlign: 'right' }}>
                {delta.text}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 히스토리 타임라인 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }} accessibilityRole="header">
        변화 히스토리
      </Text>
      <View style={{ gap: spacing.sm }}>
        {MOCK_MEASUREMENTS.map((measurement, index) => (
          <Animated.View
            key={measurement.date}
            entering={staggeredEntry(index)}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.xl,
              padding: spacing.md,
              borderLeftWidth: 3,
              borderLeftColor: index === 0 ? moduleColors.body.base : colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                {measurement.label}
              </Text>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>{measurement.date}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                체형: {measurement.bodyType}
              </Text>
              <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: getScoreColor(measurement.balanceScore) }}>
                균형 {measurement.balanceScore}점
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs }}>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>어깨 {measurement.shoulders}cm</Text>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>허리 {measurement.waist}cm</Text>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>힙 {measurement.hips}cm</Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}
