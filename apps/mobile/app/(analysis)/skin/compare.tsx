/**
 * 피부 분석 비교 화면
 *
 * 피부 분석 결과의 비포/애프터를 비교한다.
 */
import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme } from '@/lib/theme';

interface SkinMetric {
  label: string;
  emoji: string;
  before: number;
  after: number;
}

// 예시 데이터 — 실제로는 분석 기록에서 가져옴
const MOCK_METRICS: SkinMetric[] = [
  { label: '수분', emoji: '💧', before: 55, after: 68 },
  { label: '유분', emoji: '🫧', before: 72, after: 60 },
  { label: '민감도', emoji: '🌸', before: 45, after: 35 },
  { label: '모공', emoji: '🔬', before: 62, after: 55 },
  { label: '주름', emoji: '📏', before: 30, after: 28 },
  { label: '탄력', emoji: '✨', before: 70, after: 78 },
];

export default function SkinCompareScreen(): React.ReactElement {
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

  return (
    <ScreenContainer testID="skin-compare-screen" backgroundGradient="analysis" edges={['bottom']}>
      <Animated.View entering={FadeInUp.delay(0).duration(TIMING.normal)}>
        <Text
          style={{
            fontSize: typography.size['2xl'],
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginBottom: spacing.xs,
          }}
        >
          피부 변화 비교
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
                style={{ borderLeftWidth: 3, borderLeftColor: moduleColors.skin.base }}
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
      <Animated.View entering={FadeInUp.delay(580).duration(TIMING.normal)}>
        <Pressable
          accessibilityLabel="피부 다시 분석하기"
          onPress={() => router.push('/(analysis)/skin')}
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
