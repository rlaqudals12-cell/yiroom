/**
 * 온보딩 Step 3: 선호도 설정 및 완료
 *
 * V4: 웹-모바일 시각 통일 — 파스텔 히어로 + 단색 CTA +
 *     border-2 카드 + 도트 ProgressIndicator + 요약 카드
 */

import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Flag,
  Dumbbell,
  Utensils,
  Bell,
  ClipboardCheck,
  Check,
  ChevronLeft,
} from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Button, GlassCard, ProgressIndicator, ScreenContainer } from '../../components/ui';
import { TIMING } from '../../lib/animations';
import {
  useOnboarding,
  type WorkoutFrequency,
  type MealPreference,
  WORKOUT_FREQUENCY_LABELS,
  MEAL_PREFERENCE_LABELS,
  GOAL_LABELS,
  calculateAge,
} from '../../lib/onboarding';
import { useTheme, typography, radii, spacing } from '../../lib/theme';

// 온보딩 Step 3 히어로 색상 (violet-500 계열 — 선호도 아이덴티티)
const STEP3_ACCENT = '#8B5CF6';
const STEP3_HERO_BG_LIGHT = '#F5F3FF';
const STEP3_HERO_BG_DARK = `${STEP3_ACCENT}15`;

const WORKOUT_FREQUENCIES: WorkoutFrequency[] = ['none', '1-2', '3-4', '5+'];
const MEAL_PREFERENCES: MealPreference[] = ['regular', 'intermittent', 'low_carb', 'high_protein'];

export default function OnboardingStep3() {
  const { colors, brand, spacing, radii, shadows, isDark } = useTheme();
  const { data, setPreferences, prevStep, completeOnboarding } = useOnboarding();

  const handleFrequencySelect = (freq: WorkoutFrequency): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreferences({ workoutFrequency: freq });
  };

  const handleMealSelect = (pref: MealPreference): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreferences({ mealPreference: pref });
  };

  const handleNotificationsToggle = (value: boolean): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreferences({ notificationsEnabled: value });
  };

  const canComplete =
    data.preferences.workoutFrequency !== undefined ||
    data.preferences.mealPreference !== undefined;

  const age = data.basicInfo.birthYear ? calculateAge(data.basicInfo.birthYear) : null;

  return (
    <ScreenContainer scrollable={false} contentPadding={0} testID="onboarding-step3">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 미니 백 버튼 */}
        <Pressable
          onPress={prevStep}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          testID="mini-back-button"
          accessibilityRole="button"
          accessibilityLabel="이전 단계로 돌아가기"
        >
          <ChevronLeft size={20} color={colors.foreground} strokeWidth={2} />
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm }}>이전</Text>
        </Pressable>

        {/* 파스텔 히어로 헤더 (웹 온보딩 슬라이드와 동일 패턴) */}
        <Animated.View entering={FadeIn.duration(TIMING.slow)}>
          <View
            style={[
              styles.heroHeader,
              { backgroundColor: isDark ? STEP3_HERO_BG_DARK : STEP3_HERO_BG_LIGHT, borderRadius: radii.xl + 8 },
            ]}
          >
            <View style={[styles.heroIconWrap, { backgroundColor: STEP3_ACCENT }]}>
              <Flag size={36} color={colors.overlayForeground} strokeWidth={2} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              거의 다 왔어요!
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              마지막으로 선호도를 알려주세요
            </Text>
          </View>
        </Animated.View>

        {/* 운동 빈도 */}
        <Animated.View entering={FadeInUp.delay(150).duration(TIMING.normal)}>
          <View style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
            <View style={styles.sectionTitleRow}>
              <Dumbbell size={16} color={brand.primary} strokeWidth={2} />
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  marginLeft: 6,
                }}
              >
                현재 운동 빈도
              </Text>
            </View>
            <View style={styles.optionGrid}>
              {WORKOUT_FREQUENCIES.map((freq) => {
                const isSelected = data.preferences.workoutFrequency === freq;
                return (
                  <Pressable
                    key={freq}
                    style={({ pressed }) => [
                      styles.optionButton,
                      {
                        backgroundColor: isSelected ? `${brand.primary}14` : colors.card,
                        borderRadius: radii.xl,
                        borderColor: isSelected ? brand.primary : colors.border,
                        borderWidth: 2,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        ...shadows.card,
                      },
                    ]}
                    onPress={() => handleFrequencySelect(freq)}
                    testID={`frequency-${freq}`}
                    accessibilityRole="button"
                    accessibilityLabel={WORKOUT_FREQUENCY_LABELS[freq]}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={{
                        fontSize: typography.size.sm,
                        fontWeight: isSelected
                          ? typography.weight.bold
                          : typography.weight.medium,
                        color: isSelected ? brand.primary : colors.foreground,
                      }}
                    >
                      {WORKOUT_FREQUENCY_LABELS[freq]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* 식습관 */}
        <Animated.View entering={FadeInUp.delay(250).duration(TIMING.normal)}>
          <View style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionTitleRow}>
              <Utensils size={16} color={brand.primary} strokeWidth={2} />
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  marginLeft: 6,
                }}
              >
                선호하는 식습관
              </Text>
            </View>
            <View style={styles.optionGrid}>
              {MEAL_PREFERENCES.map((pref) => {
                const isSelected = data.preferences.mealPreference === pref;
                return (
                  <Pressable
                    key={pref}
                    style={({ pressed }) => [
                      styles.optionButton,
                      {
                        backgroundColor: isSelected ? `${brand.primary}14` : colors.card,
                        borderRadius: radii.xl,
                        borderColor: isSelected ? brand.primary : colors.border,
                        borderWidth: 2,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        ...shadows.card,
                      },
                    ]}
                    onPress={() => handleMealSelect(pref)}
                    testID={`meal-${pref}`}
                    accessibilityRole="button"
                    accessibilityLabel={MEAL_PREFERENCE_LABELS[pref]}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={{
                        fontSize: typography.size.sm,
                        fontWeight: isSelected
                          ? typography.weight.bold
                          : typography.weight.medium,
                        color: isSelected ? brand.primary : colors.foreground,
                      }}
                    >
                      {MEAL_PREFERENCE_LABELS[pref]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* 알림 설정 */}
        <Animated.View entering={FadeInUp.delay(350).duration(TIMING.normal)}>
          <View style={{ marginBottom: spacing.lg }}>
            <GlassCard intensity={25} style={{ padding: spacing.md }}>
              <View style={styles.switchRow}>
                <View style={styles.switchIconRow}>
                  <View
                    style={[
                      styles.switchIconCircle,
                      { backgroundColor: `${brand.primary}20` },
                    ]}
                  >
                    <Bell size={16} color={brand.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.switchLabel}>
                    <Text
                      style={{
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                        color: colors.foreground,
                        marginBottom: spacing.xxs,
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
                </View>
                <Switch
                  value={data.preferences.notificationsEnabled ?? false}
                  onValueChange={handleNotificationsToggle}
                  trackColor={{ false: colors.border, true: brand.primary }}
                  thumbColor={colors.card}
                  testID="notifications-switch"
                  accessibilityLabel="알림 받기"
                  accessibilityRole="switch"
                />
              </View>
            </GlassCard>
          </View>
        </Animated.View>

        {/* 요약 카드 */}
        <Animated.View entering={FadeInUp.delay(450).duration(TIMING.normal)}>
          <GlassCard intensity={20} style={{ padding: spacing.md }}>
            <View style={styles.summaryHeader}>
              <ClipboardCheck size={16} color={brand.primary} strokeWidth={2} />
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginLeft: 6,
                }}
              >
                입력하신 정보
              </Text>
            </View>

            <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                목표
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.medium,
                  color: colors.foreground,
                  maxWidth: '60%',
                  textAlign: 'right',
                }}
              >
                {data.goals.map((g) => GOAL_LABELS[g]).join(', ') || '-'}
              </Text>
            </View>

            {age && (
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                  나이
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                    color: colors.foreground,
                  }}
                >
                  {age}세
                </Text>
              </View>
            )}

            {data.basicInfo.height && data.basicInfo.weight && (
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                  신체
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                    color: colors.foreground,
                  }}
                >
                  {data.basicInfo.height}cm / {data.basicInfo.weight}kg
                </Text>
              </View>
            )}

            {data.preferences.workoutFrequency && (
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                  운동
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                    color: colors.foreground,
                  }}
                >
                  {WORKOUT_FREQUENCY_LABELS[data.preferences.workoutFrequency]}
                </Text>
              </View>
            )}

            {data.preferences.mealPreference && (
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                  식습관
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                    color: colors.foreground,
                  }}
                >
                  {MEAL_PREFERENCE_LABELS[data.preferences.mealPreference]}
                </Text>
              </View>
            )}

            {/* 완료 아이콘 */}
            <View style={styles.summaryFooter}>
              <View style={[styles.checkCircle, { backgroundColor: `${brand.primary}20` }]}>
                <Check size={16} color={brand.primary} strokeWidth={2.5} />
              </View>
              <Text
                style={{
                  fontSize: typography.size.xs + 1,
                  color: colors.mutedForeground,
                  marginLeft: spacing.sm,
                }}
              >
                모든 정보는 안전하게 보관돼요
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* 진행 표시 */}
        <ProgressIndicator current={3} total={3} style={{ marginTop: spacing.xl }} />
      </ScrollView>

      {/* 푸터 페이드 + 그라디언트 CTA */}
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
            },
          ]}
        >
          <Button
            variant="secondary"
            size="lg"
            onPress={prevStep}
            testID="back-button"
            style={{ flex: 1 }}
          >
            이전
          </Button>
          <Pressable
            onPress={completeOnboarding}
            disabled={!canComplete}
            style={({ pressed }) => [
              shadows.md,
              {
                flex: 2,
                backgroundColor: canComplete ? brand.primary : colors.secondary,
                borderRadius: radii.full,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !canComplete ? 0.5 : pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            testID="complete-button"
            accessibilityRole="button"
            accessibilityLabel="시작하기"
            accessibilityState={{ disabled: !canComplete }}
          >
            <Text
              style={{
                color: canComplete ? brand.primaryForeground : colors.mutedForeground,
                fontSize: typography.size.base,
                fontWeight: typography.weight.bold,
              }}
            >
              시작하기
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
    padding: spacing.mlg,
    paddingBottom: 140,
  },
  // 미니 백 버튼
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginBottom: spacing.smx,
    alignSelf: 'flex-start',
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
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.smx,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.smd,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.smx,
  },
  switchLabel: {
    flex: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.smd,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.xlg,
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
  footer: {
    flexDirection: 'row',
  },
});
