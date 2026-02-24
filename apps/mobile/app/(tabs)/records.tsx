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
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import {
  MenuCard,
  SectionHeader,
  GlassCard,
  GradientBackground,
  CollapsibleSection,
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
import { TIMING } from '../../lib/animations';
import { useTheme } from '../../lib/theme';

// 요일 라벨 (월~일)
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

// 오늘 데이터 기반 주간 샘플 생성 (실제 DB 연동 전 표시용)
function generateWeeklyCalories(todayCalories: number, goal: number): DayCalorie[] {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // 월=0 ~ 일=6

  return DAY_LABELS.map((label, i) => {
    if (i === dayOfWeek) return { label, calories: todayCalories };
    if (i > dayOfWeek) return { label, calories: 0 }; // 미래
    // 과거: 목표 기준 ±20% 랜덤 (seed 고정)
    const seed = (i + 1) * 137;
    const variation = ((seed % 40) - 20) / 100;
    return { label, calories: Math.round(goal * (1 + variation)) };
  });
}

function generateWorkoutWeek(currentStreak: number): WeekDay[] {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;

  return DAY_LABELS.map((label, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (dayOfWeek - i));
    const dateStr = date.toISOString().split('T')[0];

    if (i > dayOfWeek) return { label, date: dateStr, completed: false, intensity: 0 };

    // 스트릭 기반: 최근 N일은 완료
    const daysFromToday = dayOfWeek - i;
    const completed = daysFromToday < currentStreak;
    return {
      label,
      date: dateStr,
      completed,
      intensity: completed ? (daysFromToday === 0 ? 3 : 2) : 0,
    };
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

  const { streak: workoutStreak, todayWorkout, isLoading: workoutLoading } = useWorkoutData();
  const {
    todaySummary,
    settings: nutritionSettings,
    isLoading: nutritionLoading,
  } = useNutritionData();

  const isLoading = workoutLoading || nutritionLoading;

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
    () => generateWeeklyCalories(todaySummary?.totalCalories || 0, calorieGoal),
    [todaySummary?.totalCalories, calorieGoal],
  );

  const workoutWeek = useMemo(
    () => generateWorkoutWeek(workoutCount),
    [workoutCount],
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} testID="records-tab">
      <View style={{ padding: spacing.md, paddingBottom: spacing.xl }}>
        {/* 히어로 헤더 */}
        <Animated.View entering={FadeIn.duration(TIMING.normal)}>
          <GradientBackground
            variant="brand"
            style={{
              borderRadius: 20,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <SectionHeader
              title="기록"
              style={{ marginBottom: 4 }}
              titleStyle={{ color: colors.overlayForeground, fontSize: 24, fontWeight: '700' }}
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
                <ActivityIndicator size="small" color={brand.primary} />
              </View>
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text
                    style={{
                      color: brand.primary,
                      fontSize: typography.size['2xl'],
                      fontWeight: typography.weight.bold,
                    }}
                  >
                    {workoutCount}일
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: typography.size.sm,
                    }}
                  >
                    연속 운동
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={{
                      color: brand.primary,
                      fontSize: typography.size['2xl'],
                      fontWeight: typography.weight.bold,
                    }}
                  >
                    {mealCount}
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: typography.size.sm,
                    }}
                  >
                    식사
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={{
                      color: brand.primary,
                      fontSize: typography.size['2xl'],
                      fontWeight: typography.weight.bold,
                    }}
                  >
                    {calorieProgress}%
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: typography.size.sm,
                    }}
                  >
                    칼로리
                  </Text>
                </View>
              </View>
            )}
          </GlassCard>
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
            <ChartSkeleton color={colors.muted} spacing={spacing} />
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
          <Animated.View entering={FadeInUp.delay(400).duration(TIMING.normal)}>
            <MenuCard
              icon={<Dumbbell size={20} color={moduleColors.workout.dark} />}
              iconBg={moduleColors.workout.light + '30'}
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

          <Animated.View entering={FadeInUp.delay(450).duration(TIMING.normal)}>
            <MenuCard
              icon={<UtensilsCrossed size={20} color={moduleColors.nutrition.dark} />}
              iconBg={moduleColors.nutrition.light + '30'}
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

          <Animated.View entering={FadeInUp.delay(500).duration(TIMING.normal)}>
            <MenuCard
              icon={<BarChart3 size={20} color={moduleColors.body.dark} />}
              iconBg={moduleColors.body.light + '30'}
              title="주간 리포트"
              description="일주일간의 활동을 분석한 리포트를 확인하세요"
              onPress={() => router.push('/reports')}
              testID="menu-reports"
            />
          </Animated.View>
        </View>
      </View>
    </ScrollView>
  );
}

// 차트 영역 로딩 스켈레톤
function ChartSkeleton({
  color,
  spacing,
}: {
  color: string;
  spacing: { sm: number; md: number };
}): React.JSX.Element {
  return (
    <View testID="chart-skeleton" accessibilityLabel="차트 로딩 중">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            height: 80,
            backgroundColor: color,
            borderRadius: 12,
            marginBottom: spacing.sm,
            opacity: 0.6 - i * 0.15,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
