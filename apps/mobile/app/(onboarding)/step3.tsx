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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, CardContent, ProgressIndicator } from '../../components/ui';
import { useTheme } from '../../lib/theme';
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
  const { colors, brand, spacing, radii, shadows, typography } = useTheme();
  const { data, setPreferences, prevStep, completeOnboarding } =
    useOnboarding();

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

  const selectedBg = `${brand.primary}1A`;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="onboarding-step3"
    >
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🏁</Text>
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
            거의 다 왔어요!
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.sm,
              textAlign: 'center',
            }}
          >
            마지막으로 선호도를 알려주세요
          </Text>
        </View>

        {/* 운동 빈도 */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.foreground,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
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
                    shadows.sm,
                    {
                      backgroundColor: isSelected ? selectedBg : colors.card,
                      borderRadius: radii.lg + 2,
                      borderColor: isSelected ? brand.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleFrequencySelect(freq)}
                  testID={`frequency-${freq}`}
                >
                  <Text
                    style={{
                      fontSize: typography.size.sm,
                      fontWeight: typography.weight.medium,
                      color: isSelected ? brand.primary : colors.foreground,
                    }}
                  >
                    {WORKOUT_FREQUENCY_LABELS[freq]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 식습관 */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.foreground,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
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
                    shadows.sm,
                    {
                      backgroundColor: isSelected ? selectedBg : colors.card,
                      borderRadius: radii.lg + 2,
                      borderColor: isSelected ? brand.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleMealSelect(pref)}
                  testID={`meal-${pref}`}
                >
                  <Text
                    style={{
                      fontSize: typography.size.sm,
                      fontWeight: typography.weight.medium,
                      color: isSelected ? brand.primary : colors.foreground,
                    }}
                  >
                    {MEAL_PREFERENCE_LABELS[pref]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 알림 설정 */}
        <View style={{ marginBottom: spacing.lg }}>
          <View
            style={[
              styles.switchRow,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.lg + 2,
                padding: spacing.md,
              },
            ]}
          >
            <View style={styles.switchLabel}>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginBottom: spacing.xs,
                }}
              >
                알림 받기
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs + 1,
                  color: colors.mutedForeground,
                }}
              >
                운동/식단 리마인더를 받을게요
              </Text>
            </View>
            <Switch
              value={data.preferences.notificationsEnabled ?? false}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.border, true: brand.primary }}
              thumbColor="#ffffff"
              testID="notifications-switch"
            />
          </View>
        </View>

        {/* 요약 카드 */}
        <Card>
          <CardContent style={{ paddingTop: spacing.md }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.cardForeground,
                marginBottom: spacing.md,
              }}
            >
              📋 입력하신 정보
            </Text>
            <View style={styles.summaryRow}>
              <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                목표
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.medium,
                  color: colors.cardForeground,
                  maxWidth: '60%',
                  textAlign: 'right',
                }}
              >
                {data.goals.map((g) => GOAL_LABELS[g]).join(', ') || '-'}
              </Text>
            </View>
            {age && (
              <View style={styles.summaryRow}>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                  나이
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                    color: colors.cardForeground,
                  }}
                >
                  {age}세
                </Text>
              </View>
            )}
            {data.basicInfo.height && data.basicInfo.weight && (
              <View style={styles.summaryRow}>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                  신체
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                    color: colors.cardForeground,
                  }}
                >
                  {data.basicInfo.height}cm / {data.basicInfo.weight}kg
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* 진행 상황 */}
        <ProgressIndicator current={3} total={3} style={{ marginTop: spacing.xl }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.footer, { padding: spacing.lg, paddingBottom: 40, gap: spacing.sm + 4 }]}>
        <Button
          variant="secondary"
          size="lg"
          onPress={prevStep}
          testID="back-button"
          style={{ flex: 1 }}
        >
          이전
        </Button>
        <Button
          size="lg"
          onPress={completeOnboarding}
          disabled={!canComplete}
          testID="complete-button"
          style={{ flex: 2 }}
        >
          시작하기 🎉
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
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    marginBottom: 6,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
});
