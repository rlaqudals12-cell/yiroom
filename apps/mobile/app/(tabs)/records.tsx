/**
 * 기록 탭
 * 오늘 요약, 수분 섭취, 운동/식단 기록, 주간 리포트
 */
import { useRouter } from 'expo-router';
import {
  Dumbbell,
  UtensilsCrossed,
  BarChart3,
  Calendar,
  Droplets,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MenuCard, SectionHeader } from '../../components/ui';
import {
  useWorkoutData,
  useNutritionData,
  calculateCalorieProgress,
} from '../../hooks';
import { useTheme } from '../../lib/theme';

export default function RecordsTab(): React.JSX.Element {
  const router = useRouter();
  const { colors, brand, spacing, radii, shadows, typography, module: moduleColors, status } =
    useTheme();

  const {
    streak: workoutStreak,
    todayWorkout,
    isLoading: workoutLoading,
  } = useWorkoutData();
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
      ? calculateCalorieProgress(
          todaySummary.totalCalories,
          nutritionSettings.dailyCalorieGoal
        )
      : 0;
  const waterIntake = todaySummary?.waterIntake || 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="records-tab"
    >
      <View style={{ padding: spacing.md }}>
        <Text
          style={[
            styles.heading,
            {
              color: colors.foreground,
              fontSize: typography.size['2xl'],
              fontWeight: typography.weight.bold,
              marginBottom: spacing.lg,
            },
          ]}
        >
          기록
        </Text>

        {/* 오늘의 기록 요약 */}
        <View
          style={[
            styles.todayCard,
            {
              backgroundColor: brand.primary + '1A',
              borderRadius: radii.xl,
              padding: spacing.md + 4,
              marginBottom: spacing.lg,
            },
          ]}
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
        </View>

        {/* 수분 섭취 */}
        <View
          style={[
            shadows.sm,
            {
              backgroundColor: moduleColors.skin.light + '20',
              borderRadius: radii.xl,
              padding: spacing.md,
              marginBottom: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
          ]}
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

        {/* 네비게이션 카드 */}
        <SectionHeader
          title="상세 기록"
          style={{ marginBottom: spacing.sm + 4, marginTop: spacing.sm }}
        />

        <View style={{ gap: spacing.sm + 4 }}>
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

          <MenuCard
            icon={<BarChart3 size={20} color={moduleColors.body.dark} />}
            iconBg={moduleColors.body.light + '30'}
            title="주간 리포트"
            description="일주일간의 활동을 분석한 리포트를 확인하세요"
            onPress={() => router.push('/reports')}
            testID="menu-reports"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    lineHeight: 32,
  },
  todayCard: {},
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
