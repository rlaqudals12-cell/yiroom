/**
 * W-1 운동 온보딩 - 목표 선택
 * UX v3: GlassCard + GradientText 히어로 + 배경 그라디언트 + coloredShadow + a11y
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  GlassCard,
  GradientText,
  ScalePressable,
  ScreenContainer,
  StepProgressBar,
} from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii, coloredShadow } from '@/lib/theme';

const WORKOUT_ACCENT = '#10B981';

const GOALS = [
  { id: 'weight_loss', label: '체중 감량', emoji: '🔥', description: '체지방 감소, 다이어트' },
  { id: 'muscle_gain', label: '근육 증가', emoji: '💪', description: '근력 강화, 벌크업' },
  { id: 'endurance', label: '체력 향상', emoji: '🏃', description: '심폐 지구력, 스태미나' },
  { id: 'flexibility', label: '유연성 향상', emoji: '🧘', description: '스트레칭, 요가' },
  { id: 'maintenance', label: '건강 유지', emoji: '❤️', description: '현재 상태 유지' },
  { id: 'stress', label: '스트레스 해소', emoji: '😌', description: '정신 건강, 릴렉스' },
];

export default function WorkoutGoalsScreen(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string): void => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleNext = (): void => {
    router.push({
      pathname: '/(workout)/onboarding/frequency',
      params: { goals: JSON.stringify(selectedGoals) },
    });
  };

  const isValid = selectedGoals.length > 0;

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      backgroundGradient="workout"
      testID="workout-onboarding-goals-screen"
    >
      {/* 글래스모피즘 히어로 헤더 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GlassCard shadowSize="lg" glowColor={WORKOUT_ACCENT} style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>🏋️</Text>
            <GradientText
              variant="extended"
              fontSize={22}
              fontWeight="700"
              style={styles.heroTitle}
            >
              운동 목표 설정
            </GradientText>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              나에게 맞는 운동 목표를 선택하면 맞춤 플랜을 만들어 드려요
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 스텝 프로그레스 바 */}
      <StepProgressBar current={1} total={4} accentColor={WORKOUT_ACCENT} testID="step-progress" />

      {/* 목표 선택 */}
      <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>운동 목표</Text>
        <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
          복수 선택이 가능해요 (최대 3개)
        </Text>
      </Animated.View>

      <View style={styles.goalList}>
        {GOALS.map((goal, idx) => {
          const isSelected = selectedGoals.includes(goal.id);
          const isDisabled = !isSelected && selectedGoals.length >= 3;

          return (
            <Animated.View
              key={goal.id}
              entering={FadeInUp.delay(120 + idx * 60).duration(TIMING.normal)}
            >
              <ScalePressable
                selected={isSelected}
                disabled={isDisabled}
                onPress={() => toggleGoal(goal.id)}
                accessibilityLabel={`${goal.label}: ${goal.description} ${isSelected ? '선택됨' : '선택 안됨'}${isDisabled ? ', 최대 3개 제한' : ''}`}
                style={[
                  styles.goalCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? WORKOUT_ACCENT : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                  isSelected ? { backgroundColor: `${WORKOUT_ACCENT}20` } : {},
                  isSelected && !isDark ? coloredShadow(WORKOUT_ACCENT, 'sm') : {},
                  isDisabled ? styles.goalCardDisabled : {},
                ]}
              >
                <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                <View style={styles.goalContent}>
                  <Text
                    style={[
                      styles.goalLabel,
                      { color: isSelected ? WORKOUT_ACCENT : colors.foreground },
                      isSelected && { fontWeight: typography.weight.bold },
                    ]}
                  >
                    {goal.label}
                  </Text>
                  <Text style={[styles.goalDescription, { color: colors.mutedForeground }]}>
                    {goal.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: isSelected ? WORKOUT_ACCENT : colors.border },
                    isSelected && { backgroundColor: WORKOUT_ACCENT, borderColor: WORKOUT_ACCENT },
                  ]}
                >
                  {isSelected && <Text style={[styles.checkmark, { color: '#FFFFFF' }]}>✓</Text>}
                </View>
              </ScalePressable>
            </Animated.View>
          );
        })}
      </View>

      {/* 그라디언트 CTA 버튼 */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.nextButton,
            { overflow: 'hidden' },
            isValid && !isDark
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
          onPress={handleNext}
          disabled={!isValid}
          accessibilityRole="button"
          accessibilityLabel={`다음 단계로 이동, ${selectedGoals.length}개 선택됨`}
          accessibilityState={{ disabled: !isValid }}
        >
          <LinearGradient
            colors={isValid ? [WORKOUT_ACCENT, '#059669'] : [colors.muted, colors.muted]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text
              style={[
                styles.nextButtonText,
                { color: isValid ? '#FFFFFF' : colors.mutedForeground },
              ]}
            >
              다음 ({selectedGoals.length}/3)
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: spacing.md },
  heroContent: { alignItems: 'center', padding: spacing.xl },
  heroEmoji: { fontSize: 40, marginBottom: spacing.sm },
  heroTitle: { marginBottom: spacing.xs },
  heroSubtitle: { fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  sectionDesc: { fontSize: 13, marginBottom: spacing.smx },
  goalList: { gap: spacing.smx },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  goalCardDisabled: { opacity: 0.5 },
  goalEmoji: { fontSize: 28, marginRight: spacing.smx },
  goalContent: { flex: 1 },
  goalLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  goalDescription: { fontSize: 13 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
  },
  nextButton: { borderRadius: radii.full },
  nextButtonGradient: { paddingVertical: spacing.md, alignItems: 'center' },
  nextButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
