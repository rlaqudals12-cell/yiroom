/**
 * 기록 탭
 * 운동 기록, 식단 기록, 통계
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
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import {
  useWorkoutData,
  useNutritionData,
  calculateCalorieProgress,
} from '../../hooks';

export default function RecordsTab() {
  const router = useRouter();

  // 실제 데이터 훅 사용
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

  // 오늘의 요약 값 계산
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
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold text-foreground mb-6">기록</Text>

        {/* 오늘의 기록 요약 */}
        <View className="bg-primary/10 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-3">
            <Calendar size={20} color="#2e5afa" />
            <Text className="text-lg font-semibold text-foreground ml-2">
              오늘
            </Text>
          </View>
          {isLoading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#2e5afa" />
            </View>
          ) : (
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">
                  {workoutCount}일
                </Text>
                <Text className="text-muted-foreground text-sm">연속 운동</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">
                  {mealCount}
                </Text>
                <Text className="text-muted-foreground text-sm">식사</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">
                  {calorieProgress}%
                </Text>
                <Text className="text-muted-foreground text-sm">칼로리</Text>
              </View>
            </View>
          )}
        </View>

        {/* 수분 섭취 카드 */}
        <View className="bg-cyan-50 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-cyan-100 rounded-full items-center justify-center mr-3">
              <Droplets size={20} color="#06b6d4" />
            </View>
            <View>
              <Text className="text-base font-semibold text-foreground">
                수분 섭취
              </Text>
              <Text className="text-muted-foreground text-sm">
                {nutritionSettings
                  ? `목표: ${nutritionSettings.waterGoal}ml`
                  : '목표 설정 필요'}
              </Text>
            </View>
          </View>
          <Text className="text-xl font-bold text-cyan-600">
            {waterIntake}ml
          </Text>
        </View>

        {/* 운동 기록 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/workout')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3">
              <Dumbbell size={20} color="#f97316" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">
                운동 기록
              </Text>
              {todayWorkout && (
                <Text className="text-sm text-muted-foreground">
                  오늘 {todayWorkout.exercises.length}개 운동 예정
                </Text>
              )}
            </View>
          </View>
          <Text className="text-muted-foreground">
            운동 루틴을 기록하고 진행 상황을 확인하세요
          </Text>
        </Pressable>

        {/* 식단 기록 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/nutrition')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-emerald-100 rounded-full items-center justify-center mr-3">
              <UtensilsCrossed size={20} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">
                식단 기록
              </Text>
              {todaySummary && todaySummary.totalCalories > 0 && (
                <Text className="text-sm text-muted-foreground">
                  오늘 {todaySummary.totalCalories}kcal 섭취
                </Text>
              )}
            </View>
          </View>
          <Text className="text-muted-foreground">
            식사를 기록하고 영양 균형을 확인하세요
          </Text>
        </Pressable>

        {/* 통계 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/reports')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-violet-100 rounded-full items-center justify-center mr-3">
              <BarChart3 size={20} color="#8b5cf6" />
            </View>
            <Text className="text-lg font-semibold text-foreground">
              주간 리포트
            </Text>
          </View>
          <Text className="text-muted-foreground">
            일주일간의 활동을 분석한 리포트를 확인하세요
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
