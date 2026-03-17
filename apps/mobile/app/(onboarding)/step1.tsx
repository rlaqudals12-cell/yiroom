/**
 * 온보딩 Step 1: 목표 선택
 *
 * V4: 웹-모바일 시각 통일 — 파스텔 히어로 + 단색 CTA +
 *     border-2 카드 + 도트 ProgressIndicator
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingDown, Dumbbell, HeartPulse, Wind, Moon, Check } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { OnboardingHero } from '../../components/onboarding';
import { GlassCard, StepProgressBar, ScreenContainer } from '../../components/ui';
import { TIMING, staggeredEntry } from '../../lib/animations';
import {
  useOnboarding,
  type OnboardingGoal,
  GOAL_LABELS,
  GOAL_DESCRIPTIONS,
  GOAL_COLORS,
} from '../../lib/onboarding';
import { useTheme, radii, spacing } from '../../lib/theme';

// 온보딩 Step 1 히어로 색상 (pink-500 계열 — 목표 설정 아이덴티티)
const STEP1_ACCENT = '#EC4899';

// Lucide 아이콘 매핑
const GOAL_ICON_MAP: Record<OnboardingGoal, typeof TrendingDown> = {
  weight_loss: TrendingDown,
  muscle_gain: Dumbbell,
  health_maintenance: HeartPulse,
  stress_relief: Wind,
  better_sleep: Moon,
};

const GOALS: OnboardingGoal[] = [
  'weight_loss',
  'muscle_gain',
  'health_maintenance',
  'stress_relief',
  'better_sleep',
];

export default function OnboardingStep1() {
  const { colors, brand, spacing, radii, shadows, typography } = useTheme();
  const { data, toggleGoal, nextStep } = useOnboarding();

  const canProceed = data.goals.length > 0;

  const handleToggle = (goal: OnboardingGoal): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleGoal(goal);
  };

  return (
    <ScreenContainer
      scrollable={false}
      contentPadding={0}
      testID="onboarding-step1"
      backgroundGradient="home"
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 파스텔 히어로 헤더 (OnboardingHero 컴포넌트) */}
        <OnboardingHero
          emoji="🎯"
          title="목표를 선택해주세요"
          subtitle={'이룸이 맞춤 추천을 제공해드릴게요\n(복수 선택 가능)'}
          glowColor={STEP1_ACCENT}
          testID="onboarding-hero"
        />

        {/* 목표 선택 카드 */}
        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          {GOALS.map((goal, index) => {
            const isSelected = data.goals.includes(goal);
            const IconComponent = GOAL_ICON_MAP[goal];
            const goalColor = GOAL_COLORS[goal];

            return (
              <Animated.View key={goal} entering={staggeredEntry(index, 100)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.goalCard,
                    {
                      backgroundColor: isSelected ? `${goalColor.gradient[0]}30` : `${colors.card}CC`,
                      borderRadius: radii.xl,
                      borderColor: isSelected ? goalColor.gradient[1] : `${colors.border}80`,
                      borderWidth: isSelected ? 2 : 1,
                      padding: spacing.md,
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                      ...(isSelected
                        ? { ...shadows.md, shadowColor: goalColor.gradient[1], shadowOpacity: 0.25 }
                        : {}),
                    },
                  ]}
                  onPress={() => handleToggle(goal)}
                  testID={`goal-${goal}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${GOAL_LABELS[goal]}, ${GOAL_DESCRIPTIONS[goal]}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  {/* 그라디언트 아이콘 박스 */}
                  {isSelected ? (
                    <LinearGradient
                      colors={goalColor.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconBox}
                    >
                      <IconComponent size={24} color={colors.overlayForeground} strokeWidth={2} />
                    </LinearGradient>
                  ) : (
                    <View style={[styles.iconBox, { backgroundColor: goalColor.bg }]}>
                      <IconComponent size={24} color={goalColor.gradient[0]} strokeWidth={2} />
                    </View>
                  )}

                  {/* 텍스트 영역 (제목 + 설명) */}
                  <View style={styles.goalTextWrap}>
                    <Text
                      style={{
                        color: isSelected ? goalColor.gradient[0] : colors.foreground,
                        fontSize: typography.size.base,
                        fontWeight: isSelected
                          ? typography.weight.bold
                          : typography.weight.semibold,
                      }}
                    >
                      {GOAL_LABELS[goal]}
                    </Text>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: typography.size.xs + 1,
                        marginTop: spacing.xxs,
                      }}
                      numberOfLines={1}
                    >
                      {GOAL_DESCRIPTIONS[goal]}
                    </Text>
                  </View>

                  {/* 체크마크 */}
                  {isSelected && (
                    <LinearGradient colors={goalColor.gradient} style={styles.checkmark}>
                      <Check size={14} color={colors.overlayForeground} strokeWidth={3} />
                    </LinearGradient>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* 선택 현황 요약 (웹 동일 패턴 — indigo-50 selection status) */}
        {data.goals.length > 0 && (
          <Animated.View entering={FadeInUp.delay(500).duration(TIMING.normal)}>
            <GlassCard shadowSize="md" style={{ marginTop: spacing.md }}>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginBottom: spacing.xs,
                }}
              >
                선택한 목표 ({data.goals.length}개)
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs + 1,
                  color: colors.mutedForeground,
                  lineHeight: 20,
                }}
              >
                {data.goals.map((g) => GOAL_LABELS[g]).join(' · ')}
              </Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* 진행 표시 */}
        <Animated.View entering={FadeInUp.delay(600).duration(TIMING.normal)}>
          <View style={{ marginTop: spacing.xl }}>
            <StepProgressBar
              current={1}
              total={3}
              accentColor={STEP1_ACCENT}
              testID="step-progress"
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* 푸터 페이드 + 그라디언트 CTA */}
      <View style={styles.footerWrap}>
        {/* 상단 페이드 */}
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.footerFade}
          pointerEvents="none"
        />
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing.lg,
              paddingBottom: 40,
              paddingTop: spacing.md,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Pressable
            onPress={nextStep}
            disabled={!canProceed}
            style={({ pressed }) => [
              shadows.md,
              {
                borderRadius: radii.full,
                overflow: 'hidden',
                opacity: !canProceed ? 0.5 : pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            testID="next-button"
            accessibilityRole="button"
            accessibilityLabel="다음"
            accessibilityState={{ disabled: !canProceed }}
          >
            <LinearGradient
              colors={
                canProceed ? ['#EC4899', '#A855F7'] : [colors.secondary, colors.secondary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text
                style={{
                  color: canProceed ? brand.primaryForeground : colors.mutedForeground,
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.bold,
                }}
              >
                다음
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.mlg,
    paddingBottom: 140,
  },
  // 목표 카드
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 66,
    height: 66,
    borderRadius: radii.xl + 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  goalTextWrap: {
    flex: 1,
  },
  checkmark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 푸터
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerFade: {
    height: 24,
  },
  footer: {},
});
