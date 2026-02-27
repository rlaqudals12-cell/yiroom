/**
 * 기록 탭
 * 오늘 요약 + 주간 차트(칼로리/매크로/운동/영양소) + 상세 기록
 */
import { useRouter } from 'expo-router';
import {
  Dumbbell,
  UtensilsCrossed,
  BarChart3,
  Calendar,
  Droplets,
  TrendingUp,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import {
  MenuCard,
  SectionHeader,
  GlassCard,
  GradientBackground,
  CollapsibleSection,
  StatCard,
  GradientProgressBar,
  ScreenContainer,
  SkeletonText,
  SkeletonCard,
} from '../../components/ui';
import {
  WeeklyCalorieChart,
  MacroBreakdownBar,
  WorkoutWeekHeatmap,
  NutrientRadar,
  type DayCalorie,
  type WeekDay,
} from '../../components/records';
import { useWorkoutData, useNutritionData, calculateCalorieProgress } from '../../hooks';
import type { DailyNutritionSummary, WorkoutLog } from '../../hooks';
import { staggeredEntry, TIMING } from '../../lib/animations';
import { useTheme, typography, spacing, radii, ICON_BG_OPACITY } from '../../lib/theme';

// 요일 라벨 (월~일)
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

// DB의 주간 영양 기록을 차트 데이터로 변환
function buildWeeklyCalories(
  weeklyHistory: DailyNutritionSummary[],
  todayCalories: number,
): DayCalorie[] {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // 월=0 ~ 일=6

  // 날짜 → 칼로리 맵
  const dateMap = new Map<string, number>();
  for (const entry of weeklyHistory) {
    dateMap.set(entry.date, entry.totalCalories);
  }

  return DAY_LABELS.map((label, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (dayOfWeek - i));
    const dateStr = date.toISOString().split('T')[0];

    if (i > dayOfWeek) return { label, calories: 0 }; // 미래
    if (i === dayOfWeek) return { label, calories: dateMap.get(dateStr) ?? todayCalories };
    return { label, calories: dateMap.get(dateStr) ?? 0 };
  });
}

// DB의 주간 운동 기록을 히트맵 데이터로 변환
function buildWorkoutWeek(weeklyLogs: WorkoutLog[]): WeekDay[] {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;

  // 날짜 → 운동 기록 맵
  const logMap = new Map<string, WorkoutLog>();
  for (const log of weeklyLogs) {
    logMap.set(log.workoutDate, log);
  }

  return DAY_LABELS.map((label, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (dayOfWeek - i));
    const dateStr = date.toISOString().split('T')[0];

    if (i > dayOfWeek) return { label, date: dateStr, completed: false, intensity: 0 };

    const log = logMap.get(dateStr);
    if (!log) return { label, date: dateStr, completed: false, intensity: 0 };

    // 강도: perceived_effort 1-10 → intensity 1-3
    const effort = log.perceivedEffort ?? 5;
    const intensity = effort <= 3 ? 1 : effort <= 7 ? 2 : 3;

    return { label, date: dateStr, completed: true, intensity };
  });
}

export default function RecordsTab(): React.JSX.Element {
  const router = useRouter();
  const {
    colors,
    brand,
    spacing,
    typography,
    module: moduleColors,
  } = useTheme();

  const {
    streak: workoutStreak,
    todayWorkout,
    weeklyLogs,
    isLoading: workoutLoading,
    refetch: refetchWorkout,
  } = useWorkoutData();
  const {
    todaySummary,
    weeklyHistory,
    settings: nutritionSettings,
    isLoading: nutritionLoading,
    refetch: refetchNutrition,
  } = useNutritionData();

  const isLoading = workoutLoading || nutritionLoading;

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchWorkout(), refetchNutrition()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchWorkout, refetchNutrition]);

  const workoutCount = workoutStreak?.currentStreak || 0;
  const mealCount = todaySummary?.mealCount || 0;
  const calorieGoal = nutritionSettings?.dailyCalorieGoal || 2000;
  const calorieProgress =
    todaySummary && nutritionSettings
      ? calculateCalorieProgress(todaySummary.totalCalories, nutritionSettings.dailyCalorieGoal)
      : 0;
  const waterIntake = todaySummary?.waterIntake || 0;

  // 차트 데이터
  const hasNutritionData = todaySummary && todaySummary.totalCalories > 0;

  const weeklyCalories = useMemo(
    () => buildWeeklyCalories(weeklyHistory, todaySummary?.totalCalories || 0),
    [weeklyHistory, todaySummary?.totalCalories],
  );

  const workoutWeek = useMemo(
    () => buildWorkoutWeek(weeklyLogs),
    [weeklyLogs],
  );

  const nutrientValues = useMemo(() => ({
    carbs: todaySummary?.totalCarbs || 0,
    protein: todaySummary?.totalProtein || 0,
    fat: todaySummary?.totalFat || 0,
    water: waterIntake,
    calories: todaySummary?.totalCalories || 0,
  }), [todaySummary, waterIntake]);

  const nutrientGoals = useMemo(() => ({
    carbs: nutritionSettings?.carbsGoal || 250,
    protein: nutritionSettings?.proteinGoal || 100,
    fat: nutritionSettings?.fatGoal || 65,
    water: nutritionSettings?.waterGoal || 2000,
    calories: calorieGoal,
  }), [nutritionSettings, calorieGoal]);

  return (
    <ScreenContainer testID="records-tab" contentContainerStyle={{ paddingBottom: spacing.xl }} refreshing={refreshing} onRefresh={handleRefresh}>
        {/* 히어로 헤더 */}
        <Animated.View entering={FadeIn.duration(TIMING.normal)}>
          <GradientBackground
            variant="brand"
            style={{
              borderRadius: radii.xl + spacing.xs,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <SectionHeader
              title="기록"
              style={{ marginBottom: spacing.xs }}
              titleStyle={{ color: colors.overlayForeground, fontSize: typography.size['2xl'], fontWeight: typography.weight.bold }}
            />
          </GradientBackground>
        </Animated.View>

        {/* 오늘의 기록 요약 — GlassCard */}
        <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
          <GlassCard
            intensity={30}
            style={{ padding: spacing.md + 4, marginBottom: spacing.lg }}
          >
            <View style={styles.todayHeader}>
              <Calendar size={20} color={brand.primary} />
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.lg,
                  fontWeight: typography.weight.semibold,
                  marginLeft: spacing.sm,
                }}
              >
                오늘
              </Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <SkeletonText style={{ width: 40, height: 28, marginBottom: spacing.xs }} />
                    <SkeletonText style={{ width: 56, height: 14 }} />
                  </View>
                  <View style={styles.statItem}>
                    <SkeletonText style={{ width: 40, height: 28, marginBottom: spacing.xs }} />
                    <SkeletonText style={{ width: 56, height: 14 }} />
                  </View>
                  <View style={styles.statItem}>
                    <SkeletonText style={{ width: 40, height: 28, marginBottom: spacing.xs }} />
                    <SkeletonText style={{ width: 56, height: 14 }} />
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <StatCard
                  value={workoutCount}
                  label="연속 운동"
                  suffix="일"
                  moduleColor="workout"
                  style={{ flex: 1 }}
                  testID="record-stat-workout"
                />
                <StatCard
                  value={mealCount}
                  label="식사"
                  style={{ flex: 1 }}
                  testID="record-stat-meal"
                />
                <StatCard
                  value={calorieProgress}
                  label="칼로리"
                  suffix="%"
                  moduleColor="nutrition"
                  style={{ flex: 1 }}
                  testID="record-stat-calorie"
                />
              </View>
            )}
          </GlassCard>

          {/* 칼로리 진행률 바 */}
          {!isLoading && (
            <View accessibilityLabel={`칼로리 진행률 ${calorieProgress}%, ${todaySummary?.totalCalories || 0}kcal / ${calorieGoal}kcal`}>
              <GradientProgressBar
                value={todaySummary?.totalCalories || 0}
                max={calorieGoal}
                moduleColor="nutrition"
                animated
                showLabel
                style={{ marginTop: spacing.sm }}
                testID="calorie-progress-bar"
              />
            </View>
          )}
        </Animated.View>

        {/* 수분 섭취 — GlassCard */}
        <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
          <GlassCard
            intensity={20}
            style={{
              padding: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              accessibilityLabel={`수분 섭취 ${waterIntake}ml, 목표 ${nutritionSettings?.waterGoal || 2000}ml`}
            >
              <View style={styles.waterLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: moduleColors.skin.light + '40' },
                  ]}
                >
                  <Droplets size={20} color={moduleColors.skin.dark} />
                </View>
                <View>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: typography.size.base,
                      fontWeight: typography.weight.semibold,
                    }}
                  >
                    수분 섭취
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: typography.size.sm,
                    }}
                  >
                    {nutritionSettings
                      ? `목표: ${nutritionSettings.waterGoal}ml`
                      : '목표 설정 필요'}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  color: moduleColors.skin.dark,
                  fontSize: typography.size.xl,
                  fontWeight: typography.weight.bold,
                }}
              >
                {waterIntake}ml
              </Text>
            </View>

            {/* 수분 진행률 바 */}
            <GradientProgressBar
              value={waterIntake}
              max={nutritionSettings?.waterGoal || 2000}
              moduleColor="skin"
              animated
              style={{ marginTop: spacing.sm }}
              testID="water-progress-bar"
            />
          </GlassCard>
        </Animated.View>

        {/* 주간 트렌드 섹션 */}
        <Animated.View entering={FadeInUp.delay(250).duration(TIMING.normal)}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}
            accessibilityRole="header"
          >
            <TrendingUp size={18} color={brand.primary} />
            <Text
              style={{
                color: colors.foreground,
                fontSize: typography.size.lg,
                fontWeight: typography.weight.semibold,
                marginLeft: spacing.xs + 2,
              }}
            >
              주간 트렌드
            </Text>
          </View>

          {isLoading ? (
            <View testID="chart-skeleton" accessibilityLabel="차트 로딩 중">
              {[0, 1, 2].map((i) => (
                <SkeletonCard
                  key={i}
                  style={{
                    height: spacing.xl * 2 + spacing.md,
                    marginBottom: spacing.sm,
                    opacity: 1 - i * 0.2,
                  }}
                />
              ))}
            </View>
          ) : (
            <>
              {/* 칼로리 차트 */}
              <CollapsibleSection
                title="칼로리 섭취"
                trailing={hasNutritionData ? `${todaySummary.totalCalories}kcal` : undefined}
                style={{ marginBottom: spacing.sm }}
                testID="section-weekly-calorie"
              >
                <WeeklyCalorieChart
                  data={weeklyCalories}
                  goal={calorieGoal}
                  testID="weekly-calorie-chart"
                />
              </CollapsibleSection>

              {/* 매크로 비율 */}
              {hasNutritionData && (
                <CollapsibleSection
                  title="영양소 비율"
                  style={{ marginBottom: spacing.sm }}
                  testID="section-macro"
                >
                  <MacroBreakdownBar
                    carbs={todaySummary.totalCarbs}
                    protein={todaySummary.totalProtein}
                    fat={todaySummary.totalFat}
                    testID="macro-breakdown"
                  />
                </CollapsibleSection>
              )}

              {/* 운동 히트맵 */}
              <CollapsibleSection
                title="운동 현황"
                trailing={workoutCount > 0 ? `${workoutCount}일 연속` : undefined}
                style={{ marginBottom: spacing.sm }}
                testID="section-workout-heatmap"
              >
                <WorkoutWeekHeatmap
                  days={workoutWeek}
                  testID="workout-heatmap"
                />
              </CollapsibleSection>

              {/* 영양소 레이더 */}
              {hasNutritionData && (
                <CollapsibleSection
                  title="영양 균형"
                  style={{ marginBottom: spacing.md }}
                  testID="section-nutrient-radar"
                >
                  <NutrientRadar
                    nutrients={nutrientValues}
                    goals={nutrientGoals}
                    testID="nutrient-radar"
                  />
                </CollapsibleSection>
              )}
            </>
          )}
        </Animated.View>

        {/* 네비게이션 카드 */}
        <Animated.View entering={FadeInUp.delay(350).duration(TIMING.normal)}>
          <SectionHeader
            title="상세 기록"
            style={{ marginBottom: spacing.sm + 4, marginTop: spacing.sm }}
          />
        </Animated.View>

        <View style={{ gap: spacing.sm + 4 }}>
          <Animated.View entering={staggeredEntry(0)}>
            <MenuCard
              icon={<Dumbbell size={20} color={moduleColors.workout.dark} />}
              iconBg={moduleColors.workout.light + ICON_BG_OPACITY}
              title="운동 기록"
              description={
                todayWorkout
                  ? `오늘 ${todayWorkout.exercises.length}개 운동 예정`
                  : '운동 루틴을 기록하고 진행 상황을 확인하세요'
              }
              onPress={() => router.push('/workout')}
              testID="menu-workout"
            />
          </Animated.View>

          <Animated.View entering={staggeredEntry(1)}>
            <MenuCard
              icon={<UtensilsCrossed size={20} color={moduleColors.nutrition.dark} />}
              iconBg={moduleColors.nutrition.light + ICON_BG_OPACITY}
              title="식단 기록"
              description={
                todaySummary && todaySummary.totalCalories > 0
                  ? `오늘 ${todaySummary.totalCalories}kcal 섭취`
                  : '식사를 기록하고 영양 균형을 확인하세요'
              }
              onPress={() => router.push('/nutrition')}
              testID="menu-nutrition"
            />
          </Animated.View>

          <Animated.View entering={staggeredEntry(2)}>
            <MenuCard
              icon={<BarChart3 size={20} color={moduleColors.body.dark} />}
              iconBg={moduleColors.body.light + ICON_BG_OPACITY}
              title="주간 리포트"
              description="일주일간의 활동을 분석한 리포트를 확인하세요"
              onPress={() => router.push('/reports')}
              testID="menu-reports"
            />
          </Animated.View>
        </View>
    </ScreenContainer>
  );
}


const styles = StyleSheet.create({
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + spacing.xs,
  },
  loadingContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  waterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: spacing.xl + spacing.sm,
    height: spacing.xl + spacing.sm,
    borderRadius: (spacing.xl + spacing.sm) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + spacing.xs,
  },
});
