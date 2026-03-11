/**
 * 메이크업 분석 비교 화면
 *
 * 메이크업 분석 결과의 비포/애프터를 비교한다.
 */
import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme } from '@/lib/theme';

interface MakeupMetric {
  label: string;
  emoji: string;
  before: number;
  after: number;
}

// 예시 데이터 — 실제로는 분석 기록에서 가져옴
const MOCK_METRICS: MakeupMetric[] = [
  { label: '색조 매칭', emoji: '🎨', before: 60, after: 78 },
  { label: '피부톤 조화', emoji: '🌟', before: 55, after: 72 },
  { label: '메이크업 완성도', emoji: '💄', before: 65, after: 80 },
  { label: '퍼스널컬러 적합도', emoji: '🌈', before: 50, after: 74 },
];

export default function MakeupCompareScreen(): React.ReactElement {
  const router = useRouter();
  const {
    colors,
    brand,
    spacing,
    radii,
    typography,
    status,
    module: moduleColors,
    score: scoreColors,
  } = useTheme();

  const getScoreColor = (value: number): string => {
    if (value >= 80) return scoreColors.excellent;
    if (value >= 60) return scoreColors.good;
    if (value >= 40) return scoreColors.caution;
    return scoreColors.poor;
  };

  const hasEnoughRecords = MOCK_METRICS.length >= 2;

  if (!hasEnoughRecords) {
    return (
      <ScreenContainer
        testID="makeup-compare-screen"
        backgroundGradient="analysis"
        edges={['bottom']}
        style={{ justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ fontSize: typography.size['3xl'], marginBottom: spacing.md }}>💄</Text>
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
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="makeup-compare-screen"
      backgroundGradient="analysis"
      edges={['bottom']}
    >
      <Animated.View entering={FadeInUp.delay(0).duration(TIMING.normal)}>
        <Text
          style={{
            fontSize: typography.size['2xl'],
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginBottom: spacing.xs,
          }}
        >
          메이크업 변화 비교
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
      </Animated.View>

      {/* 지표 비교 */}
      <View style={{ gap: spacing.sm }}>
        {MOCK_METRICS.map((metric, index) => {
          const diff = metric.after - metric.before;
          const improved = diff > 0;

          return (
            <Animated.View
              key={index}
              entering={FadeInUp.delay(80 + index * 80).duration(TIMING.normal)}
            >
              <GlassCard
                shadowSize="md"
                style={{ borderLeftWidth: 3, borderLeftColor: moduleColors.personalColor.base }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
                >
                  <Text style={{ fontSize: typography.size.lg, marginRight: spacing.xs }}>
                    {metric.emoji}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.size.base,
                      fontWeight: typography.weight.semibold,
                      color: colors.foreground,
                      flex: 1,
                    }}
                  >
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
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.secondary,
                        borderRadius: radii.full,
                      }}
                    >
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
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        color: colors.mutedForeground,
                        marginTop: spacing.xxs,
                      }}
                    >
                      이전 {metric.before}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.secondary,
                        borderRadius: radii.full,
                      }}
                    >
                      <View
                        style={{
                          height: 6,
                          width: `${metric.after}%`,
                          backgroundColor: getScoreColor(metric.after),
                          borderRadius: radii.full,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        color: colors.foreground,
                        fontWeight: typography.weight.medium,
                        marginTop: spacing.xxs,
                      }}
                    >
                      현재 {metric.after}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          );
        })}
      </View>

      {/* 다시 분석 버튼 */}
      <Animated.View entering={FadeInUp.delay(480).duration(TIMING.normal)}>
        <Pressable
          accessibilityLabel="메이크업 다시 분석하기"
          onPress={() => router.push('/(analysis)/makeup')}
          style={{
            backgroundColor: brand.primary,
            borderRadius: radii.xl,
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
      </Animated.View>
    </ScreenContainer>
  );
}
