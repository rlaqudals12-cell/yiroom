/**
 * W-1 운동 온보딩 - 목표 선택
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { ScreenContainer } from '@/components/ui';
import { useTheme } from '@/lib/theme';

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
  const { colors, brand } = useTheme();
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

        <View style={styles.goalList}>
          {GOALS.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            const isDisabled = !isSelected && selectedGoals.length >= 3;

            return (
              <Pressable
                key={goal.id}
                style={[
                  styles.goalCard,
                  { backgroundColor: colors.card },
                  isSelected && { borderColor: brand.primary, backgroundColor: brand.primary + '10' },
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
            );
          })}
        </View>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          style={[styles.nextButton, selectedGoals.length === 0 && { backgroundColor: colors.muted }]}
          onPress={handleNext}
          disabled={selectedGoals.length === 0}
        >
          <Text style={styles.nextButtonText}>다음 ({selectedGoals.length}/3)</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  goalList: {
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: {},
  goalCardDisabled: {
    opacity: 0.5,
  },
  goalEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  goalContent: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalLabelSelected: {},
  goalDescription: {
    fontSize: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {},
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  nextButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
