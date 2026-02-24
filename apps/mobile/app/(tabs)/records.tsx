/**
 * 기록 탭
 * 오늘 요약, 수분 섭취, 운동/식단 기록, 주간 리포트
 */
import { useRouter } from 'expo-router';
import { Dumbbell, UtensilsCrossed, BarChart3, Calendar, Droplets } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { MenuCard, SectionHeader, GlassCard, GradientBackground } from '../../components/ui';
import { useWorkoutData, useNutritionData, calculateCalorieProgress } from '../../hooks';
import { TIMING } from '../../lib/animations';
import { useTheme } from '../../lib/theme';

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
  const calorieProgress =
    todaySummary && nutritionSettings
      ? calculateCalorieProgress(todaySummary.totalCalories, nutritionSettings.dailyCalorieGoal)
      : 0;
  const waterIntake = todaySummary?.waterIntake || 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} testID="records-tab">
      <View style={{ padding: spacing.md }}>
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
              marginBottom: spacing.md,
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

        {/* 네비게이션 카드 */}
        <Animated.View entering={FadeInUp.delay(300).duration(TIMING.normal)}>
          <SectionHeader
            title="상세 기록"
            style={{ marginBottom: spacing.sm + 4, marginTop: spacing.sm }}
          />
        </Animated.View>

        <View style={{ gap: spacing.sm + 4 }}>
          <Animated.View entering={FadeInUp.delay(350).duration(TIMING.normal)}>
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

          <Animated.View entering={FadeInUp.delay(400).duration(TIMING.normal)}>
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

          <Animated.View entering={FadeInUp.delay(450).duration(TIMING.normal)}>
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
