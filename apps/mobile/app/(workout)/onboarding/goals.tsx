/**
 * W-1 운동 온보딩 - 목표 선택
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

const GOALS = [
  {
    id: 'weight_loss',
    label: '체중 감량',
    emoji: '🔥',
    description: '체지방 감소, 다이어트',
  },
  {
    id: 'muscle_gain',
    label: '근육 증가',
    emoji: '💪',
    description: '근력 강화, 벌크업',
  },
  {
    id: 'endurance',
    label: '체력 향상',
    emoji: '🏃',
    description: '심폐 지구력, 스태미나',
  },
  {
    id: 'flexibility',
    label: '유연성 향상',
    emoji: '🧘',
    description: '스트레칭, 요가',
  },
  {
    id: 'maintenance',
    label: '건강 유지',
    emoji: '❤️',
    description: '현재 상태 유지',
  },
  {
    id: 'stress',
    label: '스트레스 해소',
    emoji: '😌',
    description: '정신 건강, 릴렉스',
  },
];

export default function WorkoutGoalsScreen() {
  const { colors, brand, typography, spacing, radii, shadows, isDark } = useTheme();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleNext = () => {
    router.push({
      pathname: '/(workout)/onboarding/frequency',
      params: { goals: JSON.stringify(selectedGoals) },
    });
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      testID="workout-onboarding-goals-screen"
    >
        <Text style={[styles.title, { color: colors.foreground }]}>운동 목표를 선택해주세요</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          복수 선택이 가능해요 (최대 3개)
        </Text>

        <Animated.View
          entering={FadeInUp.delay(100).duration(TIMING.normal)}
          style={styles.goalList}
        >
          {GOALS.map((goal, idx) => {
            const isSelected = selectedGoals.includes(goal.id);
            const isDisabled = !isSelected && selectedGoals.length >= 3;

            return (
              <Animated.View
                key={goal.id}
                entering={FadeInUp.delay(100 + idx * 60).duration(TIMING.normal)}
              >
                <Pressable
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isSelected ? brand.primary : colors.border,
                      ...(isSelected ? { backgroundColor: brand.primary + '10' } : {}),
                    },
                    shadows.card,
                    isDisabled && styles.goalCardDisabled,
                  ]}
                  onPress={() => !isDisabled && toggleGoal(goal.id)}
                >
                <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                <View style={styles.goalContent}>
                  <Text
                    style={[
                      styles.goalLabel,
                      { color: colors.foreground },
                      isSelected && { color: brand.primary },
                    ]}
                  >
                    {goal.label}
                  </Text>
                  <Text style={[styles.goalDescription, { color: colors.mutedForeground }]}>
                    {goal.description}
                  </Text>
                </View>
                <View style={[styles.checkbox, { borderColor: colors.border }, isSelected && { backgroundColor: brand.primary, borderColor: brand.primary }]}>
                  {isSelected && <Text style={[styles.checkmark, { color: brand.primaryForeground }]}>✓</Text>}
                </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          style={[
            styles.nextButton,
            { backgroundColor: brand.primary },
            selectedGoals.length === 0 && { backgroundColor: colors.muted },
            selectedGoals.length > 0 && !isDark ? Platform.select({
              ios: { shadowColor: brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
              android: { elevation: 4 },
            }) ?? {} : {},
          ]}
          onPress={handleNext}
          disabled={selectedGoals.length === 0}
        >
          <Text style={[styles.nextButtonText, { color: brand.primaryForeground }]}>
            다음 ({selectedGoals.length}/3)
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  goalList: {
    gap: spacing.smx,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
  },
  goalCardSelected: {},
  goalCardDisabled: {
    opacity: 0.5,
  },
  goalEmoji: {
    fontSize: 28,
    marginRight: spacing.smx,
  },
  goalContent: {
    flex: 1,
  },
  goalLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  goalLabelSelected: {},
  goalDescription: {
    fontSize: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {},
  checkmark: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
  },
  nextButton: {
    borderRadius: radii.full,
    padding: spacing.md,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
