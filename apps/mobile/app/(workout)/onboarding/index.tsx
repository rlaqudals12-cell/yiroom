/**
 * W-1 운동 온보딩 - 시작 화면
 *
 * V2: 웹-모바일 비주얼 싱크 — 파스텔 히어로 + 그라디언트 아이콘 + 카드 그림자
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell } from 'lucide-react-native';
import { router } from 'expo-router';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, radii , spacing } from '@/lib/theme';

// 운동 모듈 악센트 (green-500 계열)
const WORKOUT_ACCENT = '#22C55E';
const WORKOUT_HERO_BG_LIGHT = '#F0FDF4';
const WORKOUT_HERO_BG_DARK = `${WORKOUT_ACCENT}15`;

export default function WorkoutOnboardingScreen() {
  const { colors, brand, typography, spacing, radii, shadows, isDark } = useTheme();

  const handleStart = () => {
    router.push('/(workout)/onboarding/goals');
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      testID="workout-onboarding-screen"
    >
        {/* 히어로 헤더 — 파스텔 그라디언트 배경 + 그라디언트 아이콘 */}
        <Animated.View entering={FadeIn.duration(TIMING.normal)}>
          <LinearGradient
            colors={isDark ? [`${WORKOUT_ACCENT}10`, `${WORKOUT_ACCENT}18`] : [WORKOUT_HERO_BG_LIGHT, '#DCFCE7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.header,
              {
                borderRadius: radii.xl,
                padding: spacing.lg,
              },
            ]}
          >
          <View style={[
            styles.iconContainer,
            !isDark ? Platform.select({
              ios: { shadowColor: WORKOUT_ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
              android: { elevation: 4 },
            }) ?? {} : {},
          ]}>
            <LinearGradient
              colors={['#4ADE80', WORKOUT_ACCENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Dumbbell size={32} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>맞춤 운동 플랜</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            체형과 목표에 맞는{'\n'}나만의 운동 루틴을 만들어보세요
          </Text>
          </LinearGradient>
        </Animated.View>

        {/* 특징 카드 — 악센트 그림자 + 테두리 */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(TIMING.normal)}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            },
            !isDark ? Platform.select({
              ios: { shadowColor: WORKOUT_ACCENT, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10 },
              android: { elevation: 3 },
            }) ?? {} : {},
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>이룸 운동의 특징</Text>
          <View style={styles.featureList}>
            <FeatureItem
              emoji="🎯"
              title="5가지 운동 타입"
              description="토너, 빌더, 버너, 무버, 플렉서"
            />
            <FeatureItem
              emoji="📊"
              title="체형 기반 추천"
              description="C-1 분석 결과 연동"
            />
            <FeatureItem
              emoji="⭐"
              title="연예인 루틴"
              description="20명의 셀럽 운동 루틴"
            />
            <FeatureItem
              emoji="🔥"
              title="칼로리 트래킹"
              description="MET 기반 정확한 계산"
            />
          </View>
        </Animated.View>

        {/* 온보딩 단계 — 악센트 그림자 + 테두리 */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(TIMING.normal)}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            },
            !isDark ? Platform.select({
              ios: { shadowColor: WORKOUT_ACCENT, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10 },
              android: { elevation: 3 },
            }) ?? {} : {},
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>온보딩 과정 (3단계)</Text>
          <View style={styles.stepList}>
            <StepItem number={1} title="운동 목표 선택" />
            <StepItem number={2} title="운동 빈도 설정" />
            <StepItem number={3} title="운동 타입 분석" />
          </View>
        </Animated.View>

      {/* 시작 버튼 — 그라디언트 CTA + 브랜드 섀도 */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          style={[
            styles.startButton,
            { overflow: 'hidden' },
            !isDark ? Platform.select({
              ios: { shadowColor: brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
              android: { elevation: 4 },
            }) ?? {} : {},
          ]}
          onPress={handleStart}
        >
          <LinearGradient
            colors={[brand.primary, '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: spacing.md, alignItems: 'center' }}
          >
            <Text style={[styles.startButtonText, { color: brand.primaryForeground }]}>운동 시작하기</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function FeatureItem({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  const { colors, brand } = useTheme();
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
    </View>
  );
}

function StepItem({ number, title }: { number: number; title: string }) {
  const { colors, brand } = useTheme();
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepNumber, { backgroundColor: brand.primary }]}>
        <Text style={[styles.stepNumberText, { color: brand.primaryForeground }]}>{number}</Text>
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.mlg,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.smx,
  },
  subtitle: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    borderRadius: radii.xl,
    padding: spacing.mlg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  featureList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.smx,
  },
  featureEmoji: {
    fontSize: typography.size['2xl'],
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  featureDescription: {
    fontSize: 13,
  },
  stepList: {
    gap: spacing.smx,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smx,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radii.xlg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  stepTitle: {
    fontSize: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
  },
  startButton: {
    borderRadius: radii.full,
  },
  startButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
