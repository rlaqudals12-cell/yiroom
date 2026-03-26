/**
 * W-1 운동 온보딩 - 시작 화면
 * UX v3: GlassCard + GradientText 히어로 + 배경 그라디언트 + coloredShadow + a11y
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Dumbbell, Target, BarChart3, Star, Flame } from 'lucide-react-native';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { GlassCard, GradientText, ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, radii, spacing, coloredShadow } from '@/lib/theme';

const WORKOUT_ACCENT = '#10B981';

export default function WorkoutOnboardingScreen(): React.JSX.Element {
  const { colors, isDark } = useTheme();

  const handleStart = (): void => {
    router.push('/(workout)/onboarding/goals');
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      backgroundGradient="workout"
      testID="workout-onboarding-screen"
    >
      {/* 글래스모피즘 히어로 헤더 */}
      <Animated.View entering={FadeIn.duration(TIMING.normal)}>
        <GlassCard shadowSize="xl" glowColor={WORKOUT_ACCENT} style={styles.hero}>
          <View style={styles.heroContent}>
            <View
              style={[styles.iconContainer, !isDark ? coloredShadow(WORKOUT_ACCENT, 'md') : {}]}
            >
              <LinearGradient
                colors={['#4ADE80', WORKOUT_ACCENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Dumbbell size={32} color="#fff" />
              </LinearGradient>
            </View>
            <GradientText
              variant="extended"
              fontSize={24}
              fontWeight="700"
              style={styles.heroTitle}
            >
              맞춤 운동 플랜
            </GradientText>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              체형과 목표에 맞는{'\n'}나만의 운동 루틴을 만들어보세요
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 특징 카드 — GlassCard */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>이룸 운동의 특징</Text>
            <View style={styles.featureList}>
              <FeatureItem
                Icon={Target}
                title="5가지 운동 타입"
                description="토너, 빌더, 버너, 무버, 플렉서"
              />
              <FeatureItem Icon={BarChart3} title="체형 기반 추천" description="C-1 분석 결과 연동" />
              <FeatureItem Icon={Star} title="연예인 루틴" description="20명의 셀럽 운동 루틴" />
              <FeatureItem Icon={Flame} title="칼로리 트래킹" description="MET 기반 정확한 계산" />
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 온보딩 단계 — GlassCard */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              온보딩 과정 (3단계)
            </Text>
            <View style={styles.stepList}>
              <StepItem number={1} title="운동 목표 선택" accent={WORKOUT_ACCENT} />
              <StepItem number={2} title="운동 빈도 설정" accent={WORKOUT_ACCENT} />
              <StepItem number={3} title="운동 타입 분석" accent={WORKOUT_ACCENT} />
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 그라디언트 CTA 버튼 */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.startButton,
            { overflow: 'hidden' },
            !isDark
              ? (Platform.select({
                  ios: {
                    shadowColor: WORKOUT_ACCENT,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                  },
                  android: { elevation: 4 },
                }) ?? {})
              : {},
          ]}
          onPress={handleStart}
          accessibilityRole="button"
          accessibilityLabel="운동 시작하기"
        >
          <LinearGradient
            colors={[WORKOUT_ACCENT, '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Text style={[styles.startButtonText, { color: '#FFFFFF' }]}>운동 시작하기</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function FeatureItem({
  Icon,
  title,
  description,
}: {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  title: string;
  description: string;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.featureItem} accessibilityLabel={`${title}: ${description}`}>
      <View style={styles.featureIconWrap}>
        <Icon size={22} color={colors.foreground} strokeWidth={2} />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function StepItem({
  number,
  title,
  accent,
}: {
  number: number;
  title: string;
  accent: string;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.stepItem} accessibilityLabel={`${number}단계: ${title}`}>
      <View style={[styles.stepNumber, { backgroundColor: accent }]}>
        <Text style={[styles.stepNumberText, { color: '#FFFFFF' }]}>{number}</Text>
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: spacing.lg },
  heroContent: { alignItems: 'center', padding: spacing.xl },
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
  heroTitle: { marginBottom: spacing.smx },
  heroSubtitle: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: { marginBottom: spacing.md },
  cardInner: { padding: spacing.mlg },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  featureList: { gap: spacing.md },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.smx,
  },
  featureIconWrap: { width: 28, alignItems: 'center', justifyContent: 'center' },
  featureContent: { flex: 1 },
  featureTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  featureDescription: { fontSize: 13 },
  stepList: { gap: spacing.smx },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smx,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  stepTitle: { fontSize: 15 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
  },
  startButton: { borderRadius: radii.full },
  startButtonGradient: { paddingVertical: spacing.md, alignItems: 'center' },
  startButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
