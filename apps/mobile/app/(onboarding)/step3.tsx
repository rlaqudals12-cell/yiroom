/**
 * 온보딩 Step 3: 선호도 설정 및 완료
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  useColorScheme,
  SafeAreaView,
} from 'react-native';

import {
  useOnboarding,
  type WorkoutFrequency,
  type MealPreference,
  WORKOUT_FREQUENCY_LABELS,
  MEAL_PREFERENCE_LABELS,
  GOAL_LABELS,
  calculateAge,
} from '../../lib/onboarding';

const WORKOUT_FREQUENCIES: WorkoutFrequency[] = ['none', '1-2', '3-4', '5+'];
const MEAL_PREFERENCES: MealPreference[] = [
  'regular',
  'intermittent',
  'low_carb',
  'high_protein',
];

export default function OnboardingStep3() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data, setPreferences, prevStep, completeOnboarding } = useOnboarding();

  const handleFrequencySelect = (freq: WorkoutFrequency) => {
    setPreferences({ workoutFrequency: freq });
  };

  const handleMealSelect = (pref: MealPreference) => {
    setPreferences({ mealPreference: pref });
  };

  const handleNotificationsToggle = (value: boolean) => {
    setPreferences({ notificationsEnabled: value });
  };

  const canComplete =
    data.preferences.workoutFrequency !== undefined ||
    data.preferences.mealPreference !== undefined;

  // 요약 정보
  const age = data.basicInfo.birthYear
    ? calculateAge(data.basicInfo.birthYear)
    : null;

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      testID="onboarding-step3"
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🏁</Text>
          <Text style={[styles.title, isDark && styles.textLight]}>
            거의 다 왔어요!
          </Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            마지막으로 선호도를 알려주세요
          </Text>
        </View>

        {/* 운동 빈도 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            현재 운동 빈도
          </Text>
          <View style={styles.optionGrid}>
            {WORKOUT_FREQUENCIES.map((freq) => {
              const isSelected = data.preferences.workoutFrequency === freq;
              return (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.optionButton,
                    isDark && styles.optionButtonDark,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleFrequencySelect(freq)}
                  testID={`frequency-${freq}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isDark && styles.textLight,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {WORKOUT_FREQUENCY_LABELS[freq]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 식습관 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            선호하는 식습관
          </Text>
          <View style={styles.optionGrid}>
            {MEAL_PREFERENCES.map((pref) => {
              const isSelected = data.preferences.mealPreference === pref;
              return (
                <TouchableOpacity
                  key={pref}
                  style={[
                    styles.optionButton,
                    isDark && styles.optionButtonDark,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleMealSelect(pref)}
                  testID={`meal-${pref}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isDark && styles.textLight,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {MEAL_PREFERENCE_LABELS[pref]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
                알림 받기
              </Text>
              <Text style={[styles.switchHint, isDark && styles.subtitleDark]}>
                운동/식단 리마인더를 받을게요
              </Text>
            </View>
            <Switch
              value={data.preferences.notificationsEnabled ?? false}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#e0e0e0', true: '#ef4444' }}
              thumbColor="#ffffff"
              testID="notifications-switch"
            />
          </View>
        </View>

        {/* 요약 카드 */}
        <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
          <Text style={[styles.summaryTitle, isDark && styles.textLight]}>
            📋 입력하신 정보
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, isDark && styles.subtitleDark]}>
              목표
            </Text>
            <Text style={[styles.summaryValue, isDark && styles.textLight]}>
              {data.goals.map((g) => GOAL_LABELS[g]).join(', ') || '-'}
            </Text>
          </View>
          {age && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, isDark && styles.subtitleDark]}>
                나이
              </Text>
              <Text style={[styles.summaryValue, isDark && styles.textLight]}>
                {age}세
              </Text>
            </View>
          )}
          {data.basicInfo.height && data.basicInfo.weight && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, isDark && styles.subtitleDark]}>
                신체
              </Text>
              <Text style={[styles.summaryValue, isDark && styles.textLight]}>
                {data.basicInfo.height}cm / {data.basicInfo.weight}kg
              </Text>
            </View>
          )}
        </View>

        {/* 진행 상황 */}
        <View style={styles.progress}>
          <View style={[styles.progressDot, isDark && styles.progressDotDark]} />
          <View style={[styles.progressDot, isDark && styles.progressDotDark]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.backButton, isDark && styles.backButtonDark]}
          onPress={prevStep}
          testID="back-button"
        >
          <Text style={[styles.backButtonText, isDark && styles.textLight]}>
            이전
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.completeButton,
            !canComplete && styles.completeButtonDisabled,
          ]}
          onPress={completeOnboarding}
          disabled={!canComplete}
          testID="complete-button"
        >
          <Text style={styles.completeButtonText}>시작하기 🎉</Text>
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
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  },
  subtitleDark: {
    color: '#999999',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  optionButtonSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  optionTextSelected: {
    color: '#ef4444',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  switchLabel: {
    flex: 1,
  },
  switchHint: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  summaryCardDark: {
    backgroundColor: '#2a2a2a',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    maxWidth: '60%',
    textAlign: 'right',
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
    flexDirection: 'row',
    padding: 24,
    paddingBottom: 40,
    gap: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  backButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666666',
  },
  completeButton: {
    flex: 2,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
});
