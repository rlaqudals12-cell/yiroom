/**
 * 헤어 분석 비교 화면
 *
 * 헤어 분석 결과의 비포/애프터를 비교한다.
 */
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '@/lib/theme';

interface HairMetric {
  label: string;
  emoji: string;
  before: number;
  after: number;
}

// 예시 데이터 — 실제로는 분석 기록에서 가져옴
const MOCK_METRICS: HairMetric[] = [
  { label: '두피 건강', emoji: '🧴', before: 58, after: 71 },
  { label: '모발 윤기', emoji: '✨', before: 45, after: 62 },
  { label: '탈모 위험도', emoji: '⚠️', before: 40, after: 30 },
  { label: '손상도', emoji: '🔍', before: 55, after: 42 },
];

// 탈모 위험도·손상도는 낮을수록 개선
const LOWER_IS_BETTER = new Set(['탈모 위험도', '손상도']);

export default function HairCompareScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography, status, module: moduleColors, score: scoreColors } = useTheme();

  const getScoreColor = (value: number): string => {
    if (value >= 80) return scoreColors.excellent;
    if (value >= 60) return scoreColors.good;
    if (value >= 40) return scoreColors.caution;
    return scoreColors.poor;
  };

  const hasEnoughRecords = MOCK_METRICS.length >= 2;

  if (!hasEnoughRecords) {
    return (
      <View
        testID="hair-compare-screen"
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        }}
      >
        <Text style={{ fontSize: typography.size['3xl'], marginBottom: spacing.md }}>💇</Text>
        <Text
          style={{
            fontSize: typography.size.lg,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
            marginBottom: spacing.xs,
            textAlign: 'center',
          }}
        >
          분석 기록이 부족해요
        </Text>
        <Text
          style={{
            fontSize: typography.size.base,
            color: colors.mutedForeground,
            textAlign: 'center',
          }}
        >
          분석 기록이 2개 이상 필요합니다
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      testID="hair-compare-screen"
      accessibilityLabel="헤어 분석 비교 화면"
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
        헤어 변화 비교
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        이전 분석 결과와 비교합니다
      </Text>

      {/* 지표 비교 */}
      <View style={{ gap: spacing.sm }}>
        {MOCK_METRICS.map((metric, index) => {
          const diff = metric.after - metric.before;
          const lowerBetter = LOWER_IS_BETTER.has(metric.label);
          // 낮을수록 좋은 지표는 감소가 개선
          const improved = lowerBetter ? diff < 0 : diff > 0;

          return (
            <View
              key={index}
              style={{
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                padding: spacing.md,
                borderLeftWidth: 3,
                borderLeftColor: moduleColors.hair.base,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={{ fontSize: typography.size.lg, marginRight: spacing.xs }}>{metric.emoji}</Text>
                <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground, flex: 1 }}>
                  {metric.label}
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                    color: improved ? status.success : status.error,
                  }}
                >
                  {improved ? '▲' : '▼'} {Math.abs(diff)}점
                </Text>
              </View>

              {/* 비교 바 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <View style={{ height: 6, backgroundColor: colors.secondary, borderRadius: radii.full }}>
                    <View
                      style={{
                        height: 6,
                        width: `${metric.before}%`,
                        backgroundColor: colors.mutedForeground,
                        borderRadius: radii.full,
                        opacity: 0.5,
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: spacing.xxs }}>
                    이전 {metric.before}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ height: 6, backgroundColor: colors.secondary, borderRadius: radii.full }}>
                    <View
                      style={{
                        height: 6,
                        width: `${metric.after}%`,
                        backgroundColor: getScoreColor(metric.after),
                        borderRadius: radii.full,
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: typography.size.xs, color: colors.foreground, fontWeight: typography.weight.medium, marginTop: spacing.xxs }}>
                    현재 {metric.after}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* 다시 분석 버튼 */}
      <Pressable
        accessibilityLabel="헤어 다시 분석하기"
        onPress={() => router.push('/(analysis)/hair')}
        style={{
          backgroundColor: brand.primary,
          borderRadius: radii.lg,
          paddingVertical: spacing.smx,
          alignItems: 'center',
          marginTop: spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: brand.primaryForeground,
          }}
        >
          다시 분석하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
