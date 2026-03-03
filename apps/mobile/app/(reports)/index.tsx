/**
 * R-1 통합 리포트 화면
 * 실 데이터 연동 — useUserAnalyses, useWorkoutData, useNutritionData
 */
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import { ScreenContainer } from '@/components/ui';

import {
  useUserAnalyses,
  useWorkoutData,
  useNutritionData,
  calculateCalorieProgress,
} from '../../hooks';
import { useTheme, typography, spacing } from '../../lib/theme';

// 시즌 라벨 한국어 변환
const SEASON_LABELS: Record<string, string> = {
  Spring: '봄 웜톤',
  Summer: '여름 쿨톤',
  Autumn: '가을 웜톤',
  Winter: '겨울 쿨톤',
};

// 피부 타입 한국어 변환
const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: '건성',
  oily: '지성',
  combination: '복합성',
  normal: '중성',
  sensitive: '민감성',
};

// 체형 타입 한국어 변환
const BODY_TYPE_LABELS: Record<string, string> = {
  hourglass: '모래시계형',
  pear: '삼각형',
  apple: '원형',
  rectangle: '직사각형',
  inverted_triangle: '역삼각형',
};

export default function ReportsScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography, module: moduleColors, status } = useTheme();
  const { user } = useUser();

  // 데이터 훅
  const {
    personalColor,
    skinAnalysis,
    bodyAnalysis,
    isLoading: analysisLoading,
    refetch: refetchAnalyses,
  } = useUserAnalyses();
  const { analysis: workoutAnalysis, streak: workoutStreak, isLoading: workoutLoading, refetch: refetchWorkout } = useWorkoutData();
  const {
    todaySummary,
    settings: nutritionSettings,
    isLoading: nutritionLoading,
    refetch: refetchNutrition,
  } = useNutritionData();

  const isLoading = analysisLoading || workoutLoading || nutritionLoading;

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchAnalyses(), refetchWorkout(), refetchNutrition()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAnalyses, refetchWorkout, refetchNutrition]);

  // 데이터 존재 여부
  const hasAnyAnalysis = !!(personalColor || skinAnalysis || bodyAnalysis);
  const hasWorkout = !!(workoutStreak && workoutStreak.currentStreak > 0);
  const hasNutrition = !!(todaySummary && todaySummary.totalCalories > 0);

  const userName = user?.firstName || user?.username || '사용자';
  const calorieProgress =
    todaySummary && nutritionSettings
      ? calculateCalorieProgress(todaySummary.totalCalories, nutritionSettings.dailyCalorieGoal)
      : 0;

  // 인사이트 메시지 생성
  const insightMessage = useMemo(() => {
    if (personalColor) {
      const season = SEASON_LABELS[personalColor.season] || personalColor.season;
      return `${season}인 당신에게는 따뜻한 색상의 운동복이 잘 어울려요. 오렌지, 코랄, 피치 톤을 추천합니다!`;
    }
    if (skinAnalysis) {
      const skinType = SKIN_TYPE_LABELS[skinAnalysis.skinType] || skinAnalysis.skinType;
      return `${skinType} 피부에 맞는 스킨케어 루틴으로 피부 건강을 유지해보세요!`;
    }
    if (hasWorkout) {
      return `${workoutStreak!.currentStreak}일 연속 운동 중이에요! 꾸준한 운동이 건강의 비결이에요.`;
    }
    return '분석을 시작하면 맞춤 인사이트를 제공해드려요!';
  }, [personalColor, skinAnalysis, hasWorkout, workoutStreak]);

  return (
    <ScreenContainer
      testID="reports-screen"
      edges={['bottom']}
      contentPadding={spacing.md + 4}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
        {/* 데이터 없을 때 안내 배너 */}
        {!isLoading && !hasAnyAnalysis && !hasWorkout && !hasNutrition && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: brand.primary + '15',
              borderRadius: radii.xl,
              padding: spacing.md - 2,
              marginBottom: spacing.md,
              gap: spacing.sm,
            }}
          >
            <Text style={{ fontSize: typography.size.lg }}>💡</Text>
            <Text
              style={{
                flex: 1,
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                lineHeight: 19,
              }}
            >
              분석을 완료하면 실제 결과가 여기에 표시돼요!
            </Text>
          </View>
        )}

        {/* 프로필 헤더 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: radii.xl,
            padding: spacing.md + 4,
            marginBottom: spacing.lg,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: brand.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: brand.primaryForeground }}>
              {userName.charAt(0)}
            </Text>
          </View>
          <View style={{ marginLeft: spacing.md }}>
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.xs,
              }}
            >
              {userName}
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
              }}
            >
              {hasAnyAnalysis
                ? `${[personalColor && '퍼스널컬러', skinAnalysis && '피부', bodyAnalysis && '체형'].filter(Boolean).join(', ')} 분석 완료`
                : '아직 분석 결과가 없어요'}
            </Text>
          </View>
        </View>

        {/* 분석 결과 */}
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: colors.mutedForeground,
            marginBottom: spacing.sm + 4,
          }}
        >
          나의 분석 결과
        </Text>

        {isLoading ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={brand.primary} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm + 4, marginBottom: spacing.lg }}>
            {/* 퍼스널 컬러 */}
            <Pressable
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radii.xl,
                padding: spacing.md,
                alignItems: 'center',
              }}
              onPress={() => router.push('/(analysis)/personal-color')}
              testID="report-card-pc"
            >
              <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>
                {personalColor ? '🌸' : '❓'}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginBottom: spacing.xs,
                }}
              >
                퍼스널 컬러
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  textAlign: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                {personalColor
                  ? SEASON_LABELS[personalColor.season] || personalColor.season
                  : '분석하기'}
              </Text>
              {personalColor && (
                <View
                  style={{
                    backgroundColor: moduleColors.personalColor.light + '30',
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.xl,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: typography.weight.semibold,
                      color: moduleColors.personalColor.dark,
                    }}
                  >
                    {personalColor.tone || '완료'}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* 피부 분석 */}
            <Pressable
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radii.xl,
                padding: spacing.md,
                alignItems: 'center',
              }}
              onPress={() => router.push('/(analysis)/skin')}
              testID="report-card-skin"
            >
              <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>
                {skinAnalysis ? '✨' : '❓'}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginBottom: spacing.xs,
                }}
              >
                피부 타입
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  textAlign: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                {skinAnalysis
                  ? SKIN_TYPE_LABELS[skinAnalysis.skinType] || skinAnalysis.skinType
                  : '분석하기'}
              </Text>
              {skinAnalysis && (
                <View
                  style={{
                    backgroundColor: moduleColors.skin.light + '30',
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.xl,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: typography.weight.semibold,
                      color: moduleColors.skin.dark,
                    }}
                  >
                    {skinAnalysis.overallScore}점
                  </Text>
                </View>
              )}
            </Pressable>

            {/* 체형 분석 */}
            <Pressable
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radii.xl,
                padding: spacing.md,
                alignItems: 'center',
              }}
              onPress={() => router.push('/(analysis)/body')}
              testID="report-card-body"
            >
              <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>
                {bodyAnalysis ? '💪' : '❓'}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginBottom: spacing.xs,
                }}
              >
                체형 타입
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  textAlign: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                {bodyAnalysis
                  ? BODY_TYPE_LABELS[bodyAnalysis.bodyType] || bodyAnalysis.bodyType
                  : '분석하기'}
              </Text>
              {bodyAnalysis && (
                <View
                  style={{
                    backgroundColor: moduleColors.body.light + '30',
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.xl,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: typography.weight.semibold,
                      color: moduleColors.body.dark,
                    }}
                  >
                    BMI {bodyAnalysis.bmi.toFixed(1)}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        )}

        {/* 운동 현황 */}
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: colors.mutedForeground,
            marginBottom: spacing.sm + 4,
          }}
        >
          운동 현황
        </Text>

        <Pressable
          style={{
            backgroundColor: colors.card,
            borderRadius: radii.xl,
            padding: spacing.md + 4,
            marginBottom: spacing.lg,
          }}
          onPress={() => router.push('/(workout)/onboarding')}
          testID="report-workout"
        >
          {hasWorkout ? (
            <>
              <View style={styles.workoutHeader}>
                <Text style={{ fontSize: 40 }}>🏋️</Text>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text
                    style={{
                      fontSize: typography.size.lg,
                      fontWeight: typography.weight.semibold,
                      color: colors.foreground,
                      marginBottom: spacing.xs,
                    }}
                  >
                    {workoutAnalysis?.workoutType
                      ? `${workoutAnalysis.workoutType} 타입`
                      : '운동 진행 중'}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.size.sm,
                      color: colors.mutedForeground,
                    }}
                  >
                    {workoutStreak!.currentStreak}일 연속 운동 중
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: typography.size['2xl'] }}>🔥</Text>
                  <Text
                    style={{
                      fontSize: typography.size.sm,
                      fontWeight: typography.weight.bold,
                      color: status.error,
                    }}
                  >
                    {workoutStreak!.currentStreak}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
              <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>🏋️</Text>
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginBottom: spacing.xs,
                }}
              >
                운동을 시작해보세요
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                }}
              >
                맞춤 운동 루틴을 추천받을 수 있어요
              </Text>
            </View>
          )}
        </Pressable>

        {/* 영양 현황 */}
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: colors.mutedForeground,
            marginBottom: spacing.sm + 4,
          }}
        >
          영양 현황
        </Text>

        <Pressable
          style={{
            backgroundColor: colors.card,
            borderRadius: radii.xl,
            padding: spacing.md + 4,
            marginBottom: spacing.lg,
          }}
          onPress={() => router.push('/(nutrition)/dashboard')}
          testID="report-nutrition"
        >
          {hasNutrition ? (
            <>
              <View style={styles.nutritionHeader}>
                <Text style={{ fontSize: 40 }}>🥗</Text>
                <View style={{ marginLeft: spacing.md }}>
                  <Text
                    style={{
                      fontSize: typography.size.sm,
                      color: colors.mutedForeground,
                      marginBottom: spacing.xs,
                    }}
                  >
                    오늘 섭취량
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.size['2xl'],
                      fontWeight: typography.weight.bold,
                      color: colors.foreground,
                    }}
                  >
                    {todaySummary!.totalCalories} kcal
                  </Text>
                </View>
              </View>

              {/* 칼로리 바 */}
              <View
                style={{
                  height: 8,
                  backgroundColor: colors.muted,
                  borderRadius: radii.full,
                  overflow: 'hidden',
                  marginBottom: spacing.sm,
                }}
              >
                <View
                  style={{
                    height: '100%',
                    backgroundColor: brand.primary,
                    borderRadius: radii.full,
                    width: `${Math.min(calorieProgress, 100)}%`,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  textAlign: 'right',
                }}
              >
                목표: {nutritionSettings?.dailyCalorieGoal || 2000} kcal
              </Text>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
              <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>🥗</Text>
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginBottom: spacing.xs,
                }}
              >
                식단을 기록해보세요
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                }}
              >
                영양 균형을 확인하고 맞춤 식단을 추천받아요
              </Text>
            </View>
          )}
        </Pressable>

        {/* 상세 리포트 바로가기 */}
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
          }}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: radii.xl,
              padding: spacing.md,
              alignItems: 'center',
            }}
            onPress={() => router.push('/(reports)/weekly')}
            testID="weekly-report-link"
          >
            <Text style={{ fontSize: typography.size['2xl'], marginBottom: spacing.xs }}>📊</Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
              }}
            >
              주간 리포트
            </Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: radii.xl,
              padding: spacing.md,
              alignItems: 'center',
            }}
            onPress={() => router.push('/(reports)/monthly')}
            testID="monthly-report-link"
          >
            <Text style={{ fontSize: typography.size['2xl'], marginBottom: spacing.xs }}>📅</Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
              }}
            >
              월간 리포트
            </Text>
          </Pressable>
        </View>

        {/* 인사이트 */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radii.xl,
            padding: spacing.md + 4,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 32, marginBottom: spacing.sm + 4 }}>💡</Text>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              marginBottom: spacing.sm,
            }}
          >
            오늘의 인사이트
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            {insightMessage}
          </Text>
        </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
});
