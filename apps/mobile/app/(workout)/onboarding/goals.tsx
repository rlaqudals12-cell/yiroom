/**
 * W-1 운동 온보딩 - 목표 선택
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const { colors, isDark } = useTheme();
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
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, isDark && styles.textLight]}>운동 목표를 선택해주세요</Text>
        <Text style={[styles.subtitle, isDark && styles.textMuted]}>
          복수 선택이 가능해요 (최대 3개)
        </Text>

        <View style={styles.goalList}>
          {GOALS.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            const isDisabled = !isSelected && selectedGoals.length >= 3;

            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  isDark && styles.goalCardDark,
                  isSelected && styles.goalCardSelected,
                  isDisabled && styles.goalCardDisabled,
                ]}
                onPress={() => !isDisabled && toggleGoal(goal.id)}
                activeOpacity={isDisabled ? 1 : 0.7}
              >
                <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                <View style={styles.goalContent}>
                  <Text
                    style={[
                      styles.goalLabel,
                      isDark && styles.textLight,
                      isSelected && styles.goalLabelSelected,
                    ]}
                  >
                    {goal.label}
                  </Text>
                  <Text style={[styles.goalDescription, isDark && styles.textMuted]}>
                    {goal.description}
                  </Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, isDark && styles.footerDark]}>
        <TouchableOpacity
          style={[styles.nextButton, selectedGoals.length === 0 && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={selectedGoals.length === 0}
        >
          <Text style={styles.nextButtonText}>다음 ({selectedGoals.length}/3)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  goalList: {
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardDark: {
    backgroundColor: '#1a1a1a',
  },
  goalCardSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
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
    color: '#111',
    marginBottom: 2,
  },
  goalLabelSelected: {
    color: '#ef4444',
  },
  goalDescription: {
    fontSize: 13,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#f8f9fc',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerDark: {
    backgroundColor: '#0a0a0a',
    borderTopColor: '#222',
  },
  nextButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
