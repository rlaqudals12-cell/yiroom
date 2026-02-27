/**
 * 온보딩 Step 1: 목표 선택
 *
 * V4: 웹-모바일 시각 통일 — 파스텔 히어로 + 단색 CTA +
 *     border-2 카드 + 도트 ProgressIndicator
 */

import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Target,
  TrendingDown,
  Dumbbell,
  HeartPulse,
  Wind,
  Moon,
  Check,
} from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { ProgressIndicator, ScreenContainer } from '../../components/ui';
import { TIMING, staggeredEntry } from '../../lib/animations';
import {
  useOnboarding,
  type OnboardingGoal,
  GOAL_LABELS,
  GOAL_DESCRIPTIONS,
  GOAL_COLORS,
} from '../../lib/onboarding';
import { useTheme, typography, radii , spacing } from '../../lib/theme';

// 온보딩 Step 1 히어로 색상 (rose-500 계열 — 목표 설정 아이덴티티)
const STEP1_ACCENT = '#F43F5E';
const STEP1_HERO_BG_LIGHT = '#FFF1F2';
const STEP1_HERO_BG_DARK = `${STEP1_ACCENT}15`;

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
  const { colors, brand, spacing, radii, shadows, typography, isDark } = useTheme();
  const { data, toggleGoal, nextStep } = useOnboarding();

  const canProceed = data.goals.length > 0;

  const handleToggle = (goal: OnboardingGoal): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleGoal(goal);
  };

  return (
    <ScreenContainer scrollable={false} contentPadding={0} testID="onboarding-step1">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 파스텔 히어로 헤더 (웹 온보딩 슬라이드와 동일 패턴) */}
        <Animated.View entering={FadeIn.duration(TIMING.slow)}>
          <View
            style={[
              styles.heroHeader,
              { backgroundColor: isDark ? STEP1_HERO_BG_DARK : STEP1_HERO_BG_LIGHT, borderRadius: radii.xl + 8 },
            ]}
          >
            <View style={[styles.heroIconWrap, { backgroundColor: STEP1_ACCENT }]}>
              <Target size={36} color={colors.overlayForeground} strokeWidth={2} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              목표를 선택해주세요
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              이룸이 맞춤 추천을 제공해드릴게요{'\n'}
              (복수 선택 가능)
            </Text>
          </View>
        </Animated.View>

        {/* 목표 선택 카드 */}
        <View style={{ gap: spacing.sm + 4, marginTop: spacing.lg }}>
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
                      backgroundColor: isSelected
                        ? `${goalColor.gradient[0]}10`
                        : colors.card,
                      borderRadius: radii.xl,
                      borderColor: isSelected ? goalColor.gradient[0] : colors.border,
                      borderWidth: 2,
                      padding: spacing.md,
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                      // Android elevation 직접 지정 (shadows.lg의 0.08 opacity는 너무 약함)
                      elevation: 3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.12,
                      shadowRadius: 8,
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
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: goalColor.bg },
                      ]}
                    >
                      <IconComponent
                        size={24}
                        color={goalColor.gradient[0]}
                        strokeWidth={2}
                      />
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
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {GOAL_DESCRIPTIONS[goal]}
                    </Text>
                  </View>

                  {/* 체크마크 */}
                  {isSelected && (
                    <LinearGradient
                      colors={goalColor.gradient}
                      style={styles.checkmark}
                    >
                      <Check size={14} color={colors.overlayForeground} strokeWidth={3} />
                    </LinearGradient>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* 진행 표시 */}
        <Animated.View entering={FadeInUp.delay(600).duration(TIMING.normal)}>
          <ProgressIndicator current={1} total={3} style={{ marginTop: spacing.xl }} />
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
                backgroundColor: canProceed ? brand.primary : colors.secondary,
                borderRadius: radii.full,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !canProceed ? 0.5 : pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            testID="next-button"
            accessibilityRole="button"
            accessibilityLabel="다음"
            accessibilityState={{ disabled: !canProceed }}
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
    padding: 20,
    paddingBottom: 140,
  },
  // 히어로 (웹 파스텔 패턴)
  heroHeader: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  // 목표 카드
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
