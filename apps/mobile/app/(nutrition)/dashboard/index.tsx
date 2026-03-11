/**
 * N-1 영양 대시보드 화면
 * UX v3: GlassCard + GradientText + backgroundGradient + coloredShadow
 */
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { GlassCard, GradientText, ScreenContainer, DataStateWrapper } from '@/components/ui';
import { useNutritionData } from '@/hooks/useNutritionData';
import { TIMING } from '@/lib/animations';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme, spacing, radii, typography } from '@/lib/theme';

const NUTRITION_ACCENT = '#F97316';

// SVG 원형 프로그레스 링 상수
const RING_SIZE = 160;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

interface MealRecord {
  id: string;
  meal_type: string;
  meal_time: string;
  foods: string[] | null;
  ai_recognized_food: string | null;
  total_calories: number;
}

export default function NutritionDashboardScreen(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const {
    todaySummary,
    settings,
    isLoading: isNutritionLoading,
    refetch: refetchNutrition,
  } = useNutritionData();

  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [isMealsLoading, setIsMealsLoading] = useState(true);

  const fetchTodayMeals = useCallback(async () => {
    if (!user?.id) {
      setIsMealsLoading(false);
      return;
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('meal_records')
        .select('id, meal_type, meal_time, foods, ai_recognized_food, total_calories')
        .eq('meal_date', today)
        .order('meal_time', { ascending: true });
      setMeals(data ?? []);
    } catch {
      // 조회 실패 시 빈 배열 유지
    } finally {
      setIsMealsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchTodayMeals();
  }, [fetchTodayMeals]);

  const goal = {
    calories: settings?.dailyCalorieGoal ?? 2000,
    protein: settings?.proteinGoal ?? 100,
    carbs: settings?.carbsGoal ?? 250,
    fat: settings?.fatGoal ?? 65,
  };

  const current = {
    calories: todaySummary?.totalCalories ?? 0,
    protein: todaySummary?.totalProtein ?? 0,
    carbs: todaySummary?.totalCarbs ?? 0,
    fat: todaySummary?.totalFat ?? 0,
  };

  const caloriePercentage = Math.min((current.calories / goal.calories) * 100, 100);
  const remainingCalories = goal.calories - current.calories;
  const isLoading = isNutritionLoading || isMealsLoading;

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchNutrition(), fetchTodayMeals()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchNutrition, fetchTodayMeals]);

  const handleRecordMeal = (): void => {
    router.push('/(nutrition)/record');
  };

  return (
    <ScreenContainer
      testID="nutrition-dashboard-screen"
      edges={['bottom']}
      contentPadding={20}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      backgroundGradient="nutrition"
    >
      <DataStateWrapper isLoading={isLoading} isEmpty={false}>
        {/* 칼로리 프로그레스 — GlassCard */}
        <Animated.View entering={FadeIn.duration(TIMING.normal)}>
          <GlassCard shadowSize="xl" glowColor={NUTRITION_ACCENT} style={styles.calorieCard}>
            <GradientText
              variant="extended"
              fontSize={14}
              fontWeight="600"
              style={styles.dateLabel}
            >
              오늘의 영양
            </GradientText>
            <View style={styles.calorieRing}>
              <View style={{ width: RING_SIZE, height: RING_SIZE }}>
                <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={colors.border}
                    strokeWidth={RING_STROKE}
                    fill="none"
                  />
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={NUTRITION_ACCENT}
                    strokeWidth={RING_STROKE}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${RING_CIRCUMFERENCE}`}
                    strokeDashoffset={`${RING_CIRCUMFERENCE * (1 - caloriePercentage / 100)}`}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  />
                </Svg>
                <View style={styles.ringCenter}>
                  <Text style={[styles.calorieValue, { color: colors.foreground }]}>
                    {current.calories}
                  </Text>
                  <Text style={[styles.calorieUnit, { color: colors.mutedForeground }]}>kcal</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.remainingText, { color: colors.mutedForeground }]}>
              {remainingCalories > 0
                ? `${remainingCalories} kcal 더 섭취 가능`
                : '목표를 달성했어요!'}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* 영양소 바 차트 — GlassCard */}
        <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>영양소 현황</Text>
            <NutrientBar
              label="단백질"
              current={current.protein}
              goal={goal.protein}
              unit="g"
              color="#EF4444"
              colors={colors}
            />
            <NutrientBar
              label="탄수화물"
              current={current.carbs}
              goal={goal.carbs}
              unit="g"
              color="#F59E0B"
              colors={colors}
            />
            <NutrientBar
              label="지방"
              current={current.fat}
              goal={goal.fat}
              unit="g"
              color="#10B981"
              colors={colors}
            />
          </GlassCard>
        </Animated.View>

        {/* 오늘의 식사 — GlassCard */}
        <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
                오늘의 식사
              </Text>
              <Pressable onPress={handleRecordMeal}>
                <Text style={[styles.addButton, { color: NUTRITION_ACCENT }]}>+ 추가</Text>
              </Pressable>
            </View>
            {meals.length === 0 ? (
              <View style={styles.emptyMeals}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  아직 기록된 식사가 없어요
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                  식사를 기록하면 영양 분석을 받을 수 있어요
                </Text>
              </View>
            ) : (
              meals.map((meal) => {
                const mealLabel = MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type;
                const foodsText =
                  meal.foods?.join(', ') ?? meal.ai_recognized_food ?? '음식 정보 없음';
                const mealTime = meal.meal_time?.substring(0, 5) ?? '';

                return (
                  <View
                    key={meal.id}
                    style={[styles.mealItem, { borderBottomColor: colors.border }]}
                  >
                    <View style={styles.mealInfo}>
                      <Text style={[styles.mealType, { color: colors.foreground }]}>
                        {mealLabel}
                      </Text>
                      <Text style={[styles.mealTime, { color: colors.mutedForeground }]}>
                        {mealTime}
                      </Text>
                    </View>
                    <View style={styles.mealFoods}>
                      <Text
                        style={[styles.mealFoodText, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {foodsText}
                      </Text>
                    </View>
                    <Text style={[styles.mealCalories, { color: colors.foreground }]}>
                      {meal.total_calories} kcal
                    </Text>
                  </View>
                );
              })
            )}
          </GlassCard>
        </Animated.View>

        {/* 식사 기록 — 그라디언트 CTA */}
        <Animated.View entering={FadeInUp.delay(300).duration(TIMING.normal)}>
          <Pressable
            testID="record-meal-button"
            style={[
              styles.recordButton,
              { overflow: 'hidden' },
              !isDark
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
            onPress={handleRecordMeal}
            accessibilityRole="button"
            accessibilityLabel="식사 기록하기"
          >
            <LinearGradient
              colors={[NUTRITION_ACCENT, '#EA580C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.recordButtonGradient}
            >
              <Text style={styles.recordButtonText}>식사 기록하기</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </DataStateWrapper>
    </ScreenContainer>
  );
}

function NutrientBar({
  label,
  current,
  goal,
  unit,
  color,
  colors,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  colors: { foreground: string; mutedForeground: string; border: string };
}): React.JSX.Element {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <View style={styles.nutrientItem} accessibilityLabel={`${label} ${current}/${goal}${unit}`}>
      <View style={styles.nutrientHeader}>
        <Text style={[styles.nutrientLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.nutrientValue, { color: colors.mutedForeground }]}>
          {current} / {goal} {unit}
        </Text>
      </View>
      <View style={[styles.nutrientBarBg, { backgroundColor: colors.border }]}>
        <View
          style={[styles.nutrientBarFill, { width: `${percentage}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calorieCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dateLabel: {
    marginBottom: spacing.md,
  },
  calorieRing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieValue: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
  },
  calorieUnit: {
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
  },
  remainingText: {
    fontSize: typography.size.sm,
  },
  section: {
    padding: spacing.mlg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  addButton: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  nutrientItem: {
    marginBottom: spacing.md,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  nutrientLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  nutrientValue: {
    fontSize: typography.size.xs,
  },
  nutrientBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  nutrientBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  emptyMeals: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.smx,
    borderBottomWidth: 1,
  },
  mealInfo: {
    width: 60,
  },
  mealType: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  mealTime: {
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
  mealFoods: {
    flex: 1,
    marginHorizontal: spacing.smx,
  },
  mealFoodText: {
    fontSize: typography.size.sm,
  },
  mealCalories: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  recordButton: {
    borderRadius: radii.full,
    marginTop: spacing.md,
  },
  recordButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: '#FFFFFF',
  },
});
