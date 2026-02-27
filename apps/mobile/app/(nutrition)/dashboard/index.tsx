/**
 * N-1 영양 대시보드 화면
 *
 * 실 데이터 연동: useNutritionData + meal_records 조회
 */
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

import { ScreenContainer, DataStateWrapper } from '@/components/ui';
import { useNutritionData } from '@/hooks/useNutritionData';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme, spacing, radii, typography } from '@/lib/theme';
import type { SemanticColors } from '@/lib/theme';

// 식사 타입 라벨 매핑
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

export default function NutritionDashboardScreen() {
  const { colors, status, brand } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const { todaySummary, settings, isLoading: isNutritionLoading } = useNutritionData();

  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [isMealsLoading, setIsMealsLoading] = useState(true);

  // 오늘 식사 기록 조회
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

  // 영양 목표 (설정값 또는 기본값)
  const goal = {
    calories: settings?.dailyCalorieGoal ?? 2000,
    protein: settings?.proteinGoal ?? 100,
    carbs: settings?.carbsGoal ?? 250,
    fat: settings?.fatGoal ?? 65,
  };

  // 현재 섭취량
  const current = {
    calories: todaySummary?.totalCalories ?? 0,
    protein: todaySummary?.totalProtein ?? 0,
    carbs: todaySummary?.totalCarbs ?? 0,
    fat: todaySummary?.totalFat ?? 0,
  };

  const caloriePercentage = Math.min((current.calories / goal.calories) * 100, 100);
  const remainingCalories = goal.calories - current.calories;

  const isLoading = isNutritionLoading || isMealsLoading;

  const handleRecordMeal = () => {
    router.push('/(nutrition)/record');
  };

  return (
    <ScreenContainer
      testID="nutrition-dashboard-screen"
      edges={['bottom']}
      contentPadding={20}
    >
      <DataStateWrapper
        isLoading={isLoading}
        isEmpty={false}
      >
        {/* 칼로리 프로그레스 */}
        <View style={[styles.calorieCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>오늘</Text>
          <View style={styles.calorieRing}>
            <View style={[styles.ringOuter, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.ringProgress,
                  {
                    borderColor: brand.primary,
                    transform: [{ rotate: `${(caloriePercentage / 100) * 360}deg` }],
                  },
                ]}
              />
              <View style={[styles.ringInner, { backgroundColor: colors.card }]}>
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
        </View>

        {/* 영양소 바 차트 */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>영양소 현황</Text>
          <NutrientBar
            label="단백질"
            current={current.protein}
            goal={goal.protein}
            unit="g"
            color={status.error}
            colors={colors}
          />
          <NutrientBar
            label="탄수화물"
            current={current.carbs}
            goal={goal.carbs}
            unit="g"
            color={status.warning}
            colors={colors}
          />
          <NutrientBar
            label="지방"
            current={current.fat}
            goal={goal.fat}
            unit="g"
            color={status.success}
            colors={colors}
          />
        </View>

        {/* 오늘의 식사 */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>오늘의 식사</Text>
            <Pressable onPress={handleRecordMeal}>
              <Text style={[styles.addButton, { color: brand.primary }]}>+ 추가</Text>
            </Pressable>
          </View>
          {meals.length === 0 ? (
            <View style={styles.emptyMeals}>
              <Text style={[styles.emptyEmoji]}>🍽️</Text>
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
        </View>

        {/* 식사 기록 버튼 */}
        <Pressable
          testID="record-meal-button"
          style={[styles.recordButton, { backgroundColor: brand.primary }]}
          onPress={handleRecordMeal}
        >
          <Text style={[styles.recordButtonText, { color: colors.background }]}>
            식사 기록하기
          </Text>
        </Pressable>
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
  colors: SemanticColors;
}) {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <View style={styles.nutrientItem}>
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
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: typography.size.sm,
    marginBottom: spacing.md,
  },
  calorieRing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringProgress: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  ringInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieValue: {
    fontSize: typography.size['4xl'],
    fontWeight: '700',
  },
  calorieUnit: {
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
  },
  remainingText: {
    fontSize: typography.size.sm,
  },
  section: {
    borderRadius: radii.xl,
    padding: 20,
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
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  addButton: {
    fontSize: typography.size.sm,
    fontWeight: '600',
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
    fontWeight: '500',
  },
  nutrientValue: {
    fontSize: 13,
  },
  nutrientBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  nutrientBarFill: {
    height: '100%',
    borderRadius: 4,
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
    fontSize: 15,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mealInfo: {
    width: 60,
  },
  mealType: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  mealTime: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  mealFoods: {
    flex: 1,
    marginHorizontal: 12,
  },
  mealFoodText: {
    fontSize: typography.size.sm,
  },
  mealCalories: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  recordButton: {
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  recordButtonText: {
    fontSize: typography.size.base,
    fontWeight: '600',
  },
});
