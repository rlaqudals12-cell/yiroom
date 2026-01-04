/**
 * 온보딩 Step 1: 목표 선택
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
} from 'react-native';

import {
  useOnboarding,
  type OnboardingGoal,
  GOAL_LABELS,
  GOAL_ICONS,
} from '../../lib/onboarding';

const GOALS: OnboardingGoal[] = [
  'weight_loss',
  'muscle_gain',
  'health_maintenance',
  'stress_relief',
  'better_sleep',
];

export default function OnboardingStep1() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data, toggleGoal, nextStep } = useOnboarding();

  const canProceed = data.goals.length > 0;

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      testID="onboarding-step1"
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.emoji]}>🎯</Text>
          <Text style={[styles.title, isDark && styles.textLight]}>
            목표를 선택해주세요
          </Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            이룸이 맞춤 추천을 제공해드릴게요{'\n'}
            (복수 선택 가능)
          </Text>
        </View>

        {/* 목표 선택 카드 */}
        <View style={styles.goalsContainer}>
          {GOALS.map((goal) => {
            const isSelected = data.goals.includes(goal);
            return (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.goalCard,
                  isDark && styles.goalCardDark,
                  isSelected && styles.goalCardSelected,
                ]}
                onPress={() => toggleGoal(goal)}
                activeOpacity={0.7}
                testID={`goal-${goal}`}
              >
                <Text style={styles.goalIcon}>{GOAL_ICONS[goal]}</Text>
                <Text
                  style={[
                    styles.goalLabel,
                    isDark && styles.textLight,
                    isSelected && styles.goalLabelSelected,
                  ]}
                >
                  {GOAL_LABELS[goal]}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 진행 상황 */}
        <View style={styles.progress}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View
            style={[styles.progressDot, isDark && styles.progressDotDark]}
          />
          <View
            style={[styles.progressDot, isDark && styles.progressDotDark]}
          />
        </View>
      </ScrollView>

      {/* 다음 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={nextStep}
          disabled={!canProceed}
          testID="next-button"
        >
          <Text style={styles.nextButtonText}>다음</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  textLight: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  subtitleDark: {
    color: '#999999',
  },
  goalsContainer: {
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardDark: {
    backgroundColor: '#2a2a2a',
  },
  goalCardSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  goalIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  goalLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  goalLabelSelected: {
    color: '#ef4444',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressDotDark: {
    backgroundColor: '#444444',
  },
  progressDotActive: {
    backgroundColor: '#ef4444',
    width: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
});
