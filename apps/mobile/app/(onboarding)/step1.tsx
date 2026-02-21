/**
 * 온보딩 Step 1: 목표 선택
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ProgressIndicator } from '../../components/ui';
import { useOnboarding, type OnboardingGoal, GOAL_LABELS, GOAL_ICONS } from '../../lib/onboarding';
import { useTheme } from '../../lib/theme';

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

  // 선택 상태 배경색 (brand.primary + 10% opacity)
  const selectedBg = `${brand.primary}1A`;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="onboarding-step1"
    >
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🎯</Text>
          <Text
            style={[
              styles.title,
              {
                color: colors.foreground,
                fontSize: typography.size['2xl'],
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            목표를 선택해주세요
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.mutedForeground,
                fontSize: typography.size.sm,
              },
            ]}
          >
            이룸이 맞춤 추천을 제공해드릴게요{'\n'}
            (복수 선택 가능)
          </Text>
        </View>

        {/* 목표 선택 카드 */}
        <View style={{ gap: spacing.sm + 4 }}>
          {GOALS.map((goal) => {
            const isSelected = data.goals.includes(goal);
            return (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.goalCard,
                  shadows.sm,
                  {
                    backgroundColor: isSelected ? selectedBg : colors.card,
                    borderRadius: radii.xl,
                    borderColor: isSelected ? brand.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                    padding: spacing.lg - 4,
                  },
                ]}
                onPress={() => toggleGoal(goal)}
                activeOpacity={0.7}
                testID={`goal-${goal}`}
              >
                <Text style={styles.goalIcon}>{GOAL_ICONS[goal]}</Text>
                <Text
                  style={[
                    styles.goalLabel,
                    {
                      color: isSelected ? brand.primary : colors.foreground,
                      fontSize: typography.size.lg - 1,
                      fontWeight: typography.weight.semibold,
                    },
                  ]}
                >
                  {GOAL_LABELS[goal]}
                </Text>
                {isSelected && (
                  <View style={[styles.checkmark, { backgroundColor: brand.primary }]}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 진행 상황 */}
        <ProgressIndicator current={1} total={3} style={{ marginTop: spacing.xl }} />
      </ScrollView>

      {/* 다음 버튼 */}
      <View style={[styles.footer, { padding: spacing.lg, paddingBottom: 40 }]}>
        <Button onPress={nextStep} disabled={!canProceed} size="lg" testID="next-button">
          다음
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 36,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  goalLabel: {
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
});
