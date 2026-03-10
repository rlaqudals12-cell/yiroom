/**
 * N-1 영양 온보딩 Step 2 — 식사 스타일 선택
 * 식사 스타일/요리 실력/예산
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

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

export default function NutritionStep2Screen() {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams();
  const [mealStyle, setMealStyle] = useState('');
  const [cookingSkill, setCookingSkill] = useState('');
  const [budget, setBudget] = useState('');

  const isValid = mealStyle && cookingSkill && budget;

  const handleNext = (): void => {
    router.push({
      pathname: '/(nutrition)/onboarding/step3',
      params: {
        ...params,
        mealStyle,
        cookingSkill,
        budget,
      },
    });
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      testID="nutrition-onboarding-step2"
    >
      {/* 식사 스타일 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>식사 스타일</Text>
        <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
          평소 즐기는 식사 스타일을 선택해주세요
        </Text>
        <View style={styles.chipGrid}>
          {MEAL_STYLES.map((style) => (
            <Pressable
              key={style.id}
              style={[
                styles.styleChip,
                {
                  backgroundColor: colors.card,
                  borderColor: mealStyle === style.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: 1,
                },
                mealStyle === style.id && { backgroundColor: `${NUTRITION_ACCENT}15` },
              ]}
              onPress={() => setMealStyle(style.id)}
            >
              <Text style={{ fontSize: 24 }}>{style.emoji}</Text>
              <Text
                style={[
                  styles.styleLabel,
                  { color: mealStyle === style.id ? NUTRITION_ACCENT : colors.foreground },
                ]}
              >
                {style.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* 요리 실력 */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>요리 실력</Text>
        <View style={{ gap: spacing.sm }}>
          {COOKING_SKILLS.map((skill) => (
            <Pressable
              key={skill.id}
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: cookingSkill === skill.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: 1,
                },
                cookingSkill === skill.id && { backgroundColor: `${NUTRITION_ACCENT}15` },
              ]}
              onPress={() => setCookingSkill(skill.id)}
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
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* 예산 */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>식비 예산</Text>
        <View style={styles.budgetRow}>
          {BUDGETS.map((b) => (
            <Pressable
              key={b.id}
              style={[
                styles.budgetChip,
                {
                  backgroundColor: colors.card,
                  borderColor: budget === b.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: 1,
                },
                budget === b.id && { backgroundColor: `${NUTRITION_ACCENT}15` },
              ]}
              onPress={() => setBudget(b.id)}
            >
              <Text
                style={[
                  styles.budgetLabel,
                  { color: budget === b.id ? NUTRITION_ACCENT : colors.foreground },
                ]}
              >
                {b.label}
              </Text>
              <Text style={[styles.budgetDesc, { color: colors.mutedForeground }]}>
                {b.description}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* 다음 버튼 */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.nextButton,
            { backgroundColor: isValid ? NUTRITION_ACCENT : colors.muted },
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
        >
          <Text
            style={[styles.nextButtonText, { color: isValid ? '#FFFFFF' : colors.mutedForeground }]}
          >
            다음
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: spacing.smx,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  styleChip: {
    alignItems: 'center',
    paddingVertical: spacing.smx,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.xxs,
    minWidth: '30%',
  },
  styleLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.smx,
  },
  optionContent: { flex: 1 },
  optionLabel: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  optionDesc: { fontSize: 13 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  budgetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.xxs,
  },
  budgetLabel: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  budgetDesc: { fontSize: 11 },
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
