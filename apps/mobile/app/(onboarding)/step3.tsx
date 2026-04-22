/**
 * 온보딩 Step 3: 웰니스 목표 + 신체정보 (선택)
 *
 * V5: 뷰티 중심 전환 — 건강 목표는 선택 사항
 *     "건너뛰기" 가능 — 뷰티 분석만 원하는 사용자 배려
 * ADR-098: WELLNESS_PHASE2=false 시 웰니스 목표 섹션 숨김, 신장/체중만 수집
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingDown, Dumbbell, HeartPulse, Wind, Moon, Ruler, Check } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { FEATURE_FLAGS } from '@yiroom/shared';

import { OnboardingHero } from '../../components/onboarding';
import { GlassCard, StepProgressBar, ScreenContainer } from '../../components/ui';
import { TIMING } from '../../lib/animations';
import {
  useOnboarding,
  type OnboardingGoal,
  GOAL_LABELS,
  GOAL_DESCRIPTIONS,
  GOAL_COLORS,
} from '../../lib/onboarding';
import { useTheme, typography, radii, spacing } from '../../lib/theme';

const STEP3_ACCENT = '#10B981'; // green — 웰니스 아이덴티티

const GOALS: OnboardingGoal[] = [
  'weight_loss',
  'muscle_gain',
  'health_maintenance',
  'stress_relief',
  'better_sleep',
];

const GOAL_ICON_MAP: Record<OnboardingGoal, typeof TrendingDown> = {
  weight_loss: TrendingDown,
  muscle_gain: Dumbbell,
  health_maintenance: HeartPulse,
  stress_relief: Wind,
  better_sleep: Moon,
};

export default function OnboardingStep3() {
  const { colors, brand, spacing, radii, shadows } = useTheme();
  const { data, toggleGoal, setBasicInfo, prevStep, completeOnboarding } = useOnboarding();

  const [height, setHeight] = useState(data.basicInfo.height?.toString() || '');
  const [weight, setWeight] = useState(data.basicInfo.weight?.toString() || '');

  const handleToggle = (goal: OnboardingGoal): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleGoal(goal);
  };

  const handleHeightChange = (value: string): void => {
    setHeight(value);
    const h = parseInt(value, 10);
    if (h > 0 && h < 300) setBasicInfo({ height: h });
  };

  const handleWeightChange = (value: string): void => {
    setWeight(value);
    const w = parseFloat(value);
    if (w > 0 && w < 500) setBasicInfo({ weight: w });
  };

  const handleComplete = (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeOnboarding();
  };

  // Step 3은 선택 사항이므로 항상 완료 가능
  const canComplete = true;

  return (
    <ScreenContainer scrollable={false} contentPadding={0} testID="onboarding-step3">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 파스텔 히어로 — ADR-098 기준 문구 분기 */}
        <OnboardingHero
          icon={Ruler}
          title={
            FEATURE_FLAGS.WELLNESS_PHASE2 ? '건강 목표도 설정해볼까요?' : '신체 정보도 알려주세요'
          }
          subtitle={'선택 사항이에요 — 건너뛰어도 괜찮아요'}
          glowColor={STEP3_ACCENT}
          testID="onboarding-hero"
        />

        {/* 진행 표시 — 히어로 바로 아래 */}
        <View style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
          <StepProgressBar
            current={3}
            total={3}
            accentColor={STEP3_ACCENT}
            testID="step-progress"
          />
        </View>

        {/* 웰니스 목표 선택 — ADR-098 기준 WELLNESS_PHASE2에 게이팅 */}
        {FEATURE_FLAGS.WELLNESS_PHASE2 && (
          <Animated.View entering={FadeInUp.delay(150).duration(TIMING.normal)}>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              {GOALS.map((goal, index) => {
                const isSelected = data.goals.includes(goal);
                const IconComponent = GOAL_ICON_MAP[goal];
                const goalColor = GOAL_COLORS[goal];

                return (
                  <Pressable
                    key={goal}
                    style={({ pressed }) => [
                      styles.goalCard,
                      {
                        backgroundColor: isSelected
                          ? `${goalColor.gradient[0]}30`
                          : `${colors.card}CC`,
                        borderRadius: radii.xl,
                        borderColor: isSelected ? goalColor.gradient[1] : `${colors.border}80`,
                        borderWidth: isSelected ? 2 : 1,
                        padding: spacing.md,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        ...(isSelected
                          ? {
                              ...shadows.md,
                              shadowColor: goalColor.gradient[1],
                              shadowOpacity: 0.25,
                            }
                          : {}),
                      },
                    ]}
                    onPress={() => handleToggle(goal)}
                    testID={`goal-${goal}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${GOAL_LABELS[goal]}, ${GOAL_DESCRIPTIONS[goal]}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={goalColor.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconBox}
                      >
                        <IconComponent size={20} color={colors.overlayForeground} strokeWidth={2} />
                      </LinearGradient>
                    ) : (
                      <View style={[styles.iconBox, { backgroundColor: goalColor.bg }]}>
                        <IconComponent size={20} color={goalColor.gradient[0]} strokeWidth={2} />
                      </View>
                    )}
                    <View style={styles.goalTextWrap}>
                      <Text
                        style={{
                          color: isSelected ? goalColor.gradient[0] : colors.foreground,
                          fontSize: typography.size.sm,
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
                          fontSize: typography.size.xs,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {GOAL_DESCRIPTIONS[goal]}
                      </Text>
                    </View>
                    {isSelected && (
                      <LinearGradient colors={goalColor.gradient} style={styles.checkmark}>
                        <Check size={12} color={colors.overlayForeground} strokeWidth={3} />
                      </LinearGradient>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* 신장/체중 (선택) */}
        <Animated.View entering={FadeInUp.delay(350).duration(TIMING.normal)}>
          <View style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
            <View style={styles.sectionTitleRow}>
              <Ruler size={16} color={STEP3_ACCENT} strokeWidth={2} />
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  marginLeft: 6,
                }}
              >
                신장 / 체중 (선택)
              </Text>
            </View>
            <GlassCard intensity={25} style={{ padding: spacing.md }}>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[
                      styles.customInput,
                      {
                        backgroundColor: colors.secondary,
                        borderRadius: radii.xl,
                        color: colors.foreground,
                        fontSize: typography.size.base,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                    ]}
                    value={height}
                    onChangeText={handleHeightChange}
                    placeholder="170"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={3}
                    testID="height-input"
                    accessibilityLabel="키 입력, cm"
                  />
                  <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                    cm
                  </Text>
                </View>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[
                      styles.customInput,
                      {
                        backgroundColor: colors.secondary,
                        borderRadius: radii.xl,
                        color: colors.foreground,
                        fontSize: typography.size.base,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                    ]}
                    value={weight}
                    onChangeText={handleWeightChange}
                    placeholder="65"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                    maxLength={5}
                    testID="weight-input"
                    accessibilityLabel="체중 입력, kg"
                  />
                  <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                    kg
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 푸터 */}
      <View style={styles.footerWrap}>
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
              gap: spacing.sm + 4,
              backgroundColor: colors.background,
              alignItems: 'center',
            },
          ]}
        >
          <Pressable
            onPress={handleComplete}
            style={({ pressed }) => ({
              width: 100,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.background,
              opacity: pressed ? 0.6 : 1,
            })}
            testID="skip-button"
            accessibilityRole="button"
            accessibilityLabel="건너뛰기"
          >
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
              }}
            >
              건너뛰기
            </Text>
          </Pressable>
          <Pressable
            onPress={handleComplete}
            style={({ pressed }) => [
              shadows.md,
              {
                flex: 1,
                borderRadius: radii.full,
                overflow: 'hidden',
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            testID="complete-button"
            accessibilityRole="button"
            accessibilityLabel="시작하기"
          >
            <LinearGradient
              colors={['#EC4899', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text
                style={{
                  color: brand.primaryForeground,
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.bold,
                }}
              >
                시작하기
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.mlg,
    paddingBottom: 140,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.smx,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  goalTextWrap: {
    flex: 1,
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    padding: spacing.md,
  },
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerFade: {
    height: 24,
  },
  footer: {
    flexDirection: 'row',
  },
});
