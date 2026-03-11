/**
 * N-1 영양 온보딩 Step 2 — 식사 스타일 선택
 * 식사 스타일/요리 실력/예산
 * UX v3: GlassCard + GradientText 히어로 + 배경 그라디언트 + coloredShadow + a11y
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
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

const NUTRITION_ACCENT = '#F97316';

const MEAL_STYLES = [
  { id: 'korean', label: '한식 위주', emoji: '🍚' },
  { id: 'western', label: '양식 위주', emoji: '🍝' },
  { id: 'mixed', label: '골고루', emoji: '🍱' },
  { id: 'vegetarian', label: '채식', emoji: '🥗' },
  { id: 'low_carb', label: '저탄고지', emoji: '🥩' },
  { id: 'delivery', label: '배달/외식', emoji: '🛵' },
];

const COOKING_SKILLS = [
  { id: 'beginner', label: '초보', description: '간단한 요리만', emoji: '🔰' },
  { id: 'intermediate', label: '중급', description: '기본 요리 가능', emoji: '👨‍🍳' },
  { id: 'advanced', label: '고급', description: '다양한 요리 가능', emoji: '⭐' },
];

const BUDGETS = [
  { id: 'low', label: '절약형', description: '식비 최소화' },
  { id: 'moderate', label: '보통', description: '적당한 식비' },
  { id: 'high', label: '투자형', description: '품질 우선' },
];

export default function NutritionStep2Screen(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams();
  const [mealStyle, setMealStyle] = useState('');
  const [cookingSkill, setCookingSkill] = useState('');
  const [budget, setBudget] = useState('');

  const isValid = mealStyle && cookingSkill && budget;

  const handleNext = (): void => {
    router.push({
      pathname: '/(nutrition)/onboarding/step3',
      params: { ...params, mealStyle, cookingSkill, budget },
    });
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      backgroundGradient="nutrition"
      testID="nutrition-onboarding-step2"
    >
      {/* 글래스모피즘 히어로 헤더 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GlassCard shadowSize="lg" glowColor={NUTRITION_ACCENT} style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>🍽️</Text>
            <GradientText
              variant="extended"
              fontSize={22}
              fontWeight="700"
              style={styles.heroTitle}
            >
              식사 스타일
            </GradientText>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              평소 식습관을 알려주시면 맞춤 식단을 추천해 드려요
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 스텝 프로그레스 바 */}
      <StepProgressBar
        current={2}
        total={3}
        accentColor={NUTRITION_ACCENT}
        testID="step-progress"
      />

      {/* 식사 스타일 */}
      <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>식사 스타일</Text>
        <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
          평소 즐기는 식사 스타일을 선택해주세요
        </Text>
        <View style={styles.chipGrid}>
          {MEAL_STYLES.map((s) => (
            <ScalePressable
              key={s.id}
              selected={mealStyle === s.id}
              onPress={() => setMealStyle(s.id)}
              accessibilityLabel={`${s.label} 식사 스타일 선택`}
              style={[
                styles.styleChip,
                {
                  backgroundColor: colors.card,
                  borderColor: mealStyle === s.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: mealStyle === s.id ? 2 : 1,
                },
                mealStyle === s.id ? { backgroundColor: `${NUTRITION_ACCENT}20` } : {},
                mealStyle === s.id && !isDark ? coloredShadow(NUTRITION_ACCENT, 'sm') : {},
              ]}
            >
              <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
              <Text
                style={[
                  styles.styleLabel,
                  { color: mealStyle === s.id ? NUTRITION_ACCENT : colors.foreground },
                  mealStyle === s.id && { fontWeight: typography.weight.bold },
                ]}
              >
                {s.label}
              </Text>
            </ScalePressable>
          ))}
        </View>
      </Animated.View>

      {/* 요리 실력 */}
      <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>요리 실력</Text>
        <View style={{ gap: spacing.sm }}>
          {COOKING_SKILLS.map((skill) => (
            <ScalePressable
              key={skill.id}
              selected={cookingSkill === skill.id}
              onPress={() => setCookingSkill(skill.id)}
              accessibilityLabel={`${skill.label}: ${skill.description}`}
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: cookingSkill === skill.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: cookingSkill === skill.id ? 2 : 1,
                },
                cookingSkill === skill.id ? { backgroundColor: `${NUTRITION_ACCENT}20` } : {},
                cookingSkill === skill.id && !isDark ? coloredShadow(NUTRITION_ACCENT, 'sm') : {},
              ]}
            >
              <Text style={{ fontSize: 22 }}>{skill.emoji}</Text>
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: cookingSkill === skill.id ? NUTRITION_ACCENT : colors.foreground },
                  ]}
                >
                  {skill.label}
                </Text>
                <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                  {skill.description}
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  { borderColor: cookingSkill === skill.id ? NUTRITION_ACCENT : colors.border },
                ]}
              >
                {cookingSkill === skill.id && (
                  <View style={[styles.radioInner, { backgroundColor: NUTRITION_ACCENT }]} />
                )}
              </View>
            </ScalePressable>
          ))}
        </View>
      </Animated.View>

      {/* 예산 */}
      <Animated.View entering={FadeInUp.delay(240).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>식비 예산</Text>
        <View style={styles.budgetRow}>
          {BUDGETS.map((b) => (
            <ScalePressable
              key={b.id}
              selected={budget === b.id}
              onPress={() => setBudget(b.id)}
              accessibilityLabel={`${b.label}: ${b.description}`}
              style={[
                styles.budgetChip,
                {
                  backgroundColor: colors.card,
                  borderColor: budget === b.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: budget === b.id ? 2 : 1,
                },
                budget === b.id ? { backgroundColor: `${NUTRITION_ACCENT}20` } : {},
                budget === b.id && !isDark ? coloredShadow(NUTRITION_ACCENT, 'sm') : {},
              ]}
            >
              <Text
                style={[
                  styles.budgetLabel,
                  { color: budget === b.id ? NUTRITION_ACCENT : colors.foreground },
                  budget === b.id && { fontWeight: typography.weight.bold },
                ]}
              >
                {b.label}
              </Text>
              <Text style={[styles.budgetDesc, { color: colors.mutedForeground }]}>
                {b.description}
              </Text>
            </ScalePressable>
          ))}
        </View>
      </Animated.View>

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
                    shadowColor: NUTRITION_ACCENT,
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
          accessibilityLabel="다음 단계로 이동"
          accessibilityState={{ disabled: !isValid }}
        >
          <LinearGradient
            colors={isValid ? [NUTRITION_ACCENT, '#EA580C'] : [colors.muted, colors.muted]}
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
              다음
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
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  styleChip: {
    alignItems: 'center',
    paddingVertical: spacing.smx,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.xxs,
    minWidth: '30%',
  },
  styleLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.smx,
  },
  optionContent: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: typography.weight.semibold, marginBottom: spacing.xxs },
  optionDesc: { fontSize: 13 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  budgetRow: { flexDirection: 'row', gap: spacing.sm },
  budgetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.xxs,
  },
  budgetLabel: { fontSize: 15, fontWeight: typography.weight.semibold },
  budgetDesc: { fontSize: 11 },
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
