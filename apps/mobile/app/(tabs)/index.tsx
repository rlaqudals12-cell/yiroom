/**
 * 이룸 홈 화면
 * 히어로 + 오늘 섹션 + 퀵 액션 + 인사이트 + 요약 + 모듈 카드 + 팁
 * D2-1: 그라디언트 카드, 스켈레톤 로딩, 토글 제거 → 기본 펼침
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { HomeHeader, HomeTodaySection, HomeQuickActions, CrossModuleInsight } from '../../components/home';
import {
  GradientCard,
  AnimatedCard,
  SectionHeader,
  StatCard,
  SkeletonText,
  SkeletonCard,
  SkeletonCircle,
  ScreenContainer,
} from '../../components/ui';
import {
  useWorkoutData,
  useNutritionData,
  useUserAnalyses,
  useCrossModuleInsights,
  calculateCalorieProgress,
} from '../../hooks';
import { staggeredEntry, TIMING } from '../../lib/animations';
import { useOnboardingCheck } from '../../lib/onboarding';
import { useTheme } from '../../lib/theme';
import { useWidgetSync } from '../../lib/widgets';

export default function HomeScreen(): React.JSX.Element {
  const { colors, brand, spacing, typography, module: moduleColors } = useTheme();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // 온보딩 체크
  const { isCompleted: onboardingCompleted, isLoading: onboardingLoading } = useOnboardingCheck();

  useEffect(() => {
    if (!onboardingLoading && !onboardingCompleted) {
      router.replace('/(onboarding)/step1');
    }
  }, [onboardingLoading, onboardingCompleted, router]);

  // 데이터 훅
  const { streak: workoutStreak, isLoading: workoutLoading, refetch: refetchWorkout } = useWorkoutData();
  const {
    todaySummary,
    settings: nutritionSettings,
    isLoading: nutritionLoading,
    refetch: refetchNutrition,
  } = useNutritionData();
  const {
    personalColor,
    skinAnalysis,
    bodyAnalysis,
    isLoading: analysisLoading,
    refetch: refetchAnalyses,
  } = useUserAnalyses();

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchWorkout(), refetchNutrition(), refetchAnalyses()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchWorkout, refetchNutrition, refetchAnalyses]);

  // 교차 모듈 인사이트
  const { insights } = useCrossModuleInsights();

  // 위젯 동기화
  const { syncAll } = useWidgetSync({ autoSync: true });

  useEffect(() => {
    if (workoutLoading || nutritionLoading) return;
    syncAll({
      caloriesConsumed: todaySummary?.totalCalories || 0,
      caloriesGoal: nutritionSettings?.dailyCalorieGoal || 2000,
      waterIntake: todaySummary?.waterIntake || 0,
      waterGoal: nutritionSettings?.waterGoal || 2000,
      workoutMinutes: 0,
      currentStreak: workoutStreak?.currentStreak || 0,
    });
  }, [workoutStreak, todaySummary, nutritionSettings, workoutLoading, nutritionLoading, syncAll]);

  const userName = user?.firstName || user?.username || '사용자';

  // 오늘 할 일
  const todayTasks = useMemo(() => {
    const tasks: {
      id: string;
      label: string;
      completed: boolean;
      route: string;
    }[] = [];

    tasks.push({
      id: 'workout',
      label: '오늘의 운동 완료',
      completed: workoutStreak?.lastWorkoutDate === new Date().toISOString().split('T')[0],
      route: '/(tabs)/records',
    });

    tasks.push({
      id: 'meal',
      label: '식사 기록하기',
      completed: (todaySummary?.mealCount || 0) >= 1,
      route: '/(tabs)/records',
    });

    const waterProgress =
      todaySummary && nutritionSettings && nutritionSettings.waterGoal > 0
        ? (todaySummary.waterIntake / nutritionSettings.waterGoal) * 100
        : 0;
    tasks.push({
      id: 'water',
      label: `물 마시기 (${Math.round(waterProgress)}%)`,
      completed: waterProgress >= 100,
      route: '/(tabs)/records',
    });

    if (!personalColor) {
      tasks.push({
        id: 'personal-color',
        label: '퍼스널 컬러 분석',
        completed: false,
        route: '/(analysis)/personal-color',
      });
    }

    return tasks;
  }, [workoutStreak, todaySummary, nutritionSettings, personalColor]);

  // 알림 요약
  const notifications = useMemo(() => {
    const items: {
      id: string;
      message: string;
      type: 'info' | 'warning' | 'success';
    }[] = [];

    if (workoutStreak?.currentStreak && workoutStreak.currentStreak >= 3) {
      items.push({
        id: 'workout-streak',
        message: `운동 ${workoutStreak.currentStreak}일 연속 달성 중!`,
        type: 'success',
      });
    }

    const analysisCount = [personalColor, skinAnalysis, bodyAnalysis].filter(Boolean).length;
    if (analysisCount < 3 && analysisCount > 0) {
      items.push({
        id: 'analysis-incomplete',
        message: `분석 ${3 - analysisCount}개가 남아있어요`,
        type: 'info',
      });
    }

    if (todaySummary && nutritionSettings) {
      const cp = calculateCalorieProgress(
        todaySummary.totalCalories,
        nutritionSettings.dailyCalorieGoal
      );
      if (cp >= 100) {
        items.push({
          id: 'calorie-goal',
          message: '오늘 칼로리 목표 달성!',
          type: 'success',
        });
      }
    }

    if (items.length === 0) {
      items.push({
        id: 'welcome',
        message: '오늘도 이룸과 함께 건강한 하루를!',
        type: 'info',
      });
    }

    return items;
  }, [workoutStreak, personalColor, skinAnalysis, bodyAnalysis, todaySummary, nutritionSettings]);

  // 퀵 액션
  const quickActions = useMemo(
    () => [
      {
        title: '퍼스널 컬러',
        subtitle: '나의 컬러 찾기',
        color: moduleColors.personalColor.base,
        route: '/(analysis)/personal-color',
        completed: !!personalColor,
      },
      {
        title: '피부 분석',
        subtitle: 'AI 피부 진단',
        color: moduleColors.skin.base,
        route: '/(analysis)/skin',
        completed: !!skinAnalysis,
      },
      {
        title: '체형 분석',
        subtitle: '맞춤 스타일',
        color: moduleColors.body.base,
        route: '/(analysis)/body',
        completed: !!bodyAnalysis,
      },
    ],
    [personalColor, skinAnalysis, bodyAnalysis, moduleColors]
  );

  // 오늘의 요약 수치 (StatCard용 numeric 값)
  const streakCount = workoutStreak?.currentStreak || 0;
  const calorieProgress =
    todaySummary && nutritionSettings
      ? calculateCalorieProgress(todaySummary.totalCalories || 0, nutritionSettings.dailyCalorieGoal)
      : 0;
  const analysisCount = [personalColor, skinAnalysis, bodyAnalysis].filter(Boolean).length;

  // 스켈레톤 로딩 상태 (온보딩 체크 중)
  if (onboardingLoading) {
    return (
      <ScreenContainer testID="home-screen-loading" scrollable={false}>
        <View style={[styles.loadingContainer, { padding: spacing.md + 4 }]}>
          {/* 히어로 스켈레톤 */}
          <SkeletonCard style={{ height: 100, marginBottom: spacing.lg }} testID="skeleton-hero" />
          {/* 섹션 스켈레톤 */}
          <SkeletonText style={{ width: '40%', marginBottom: spacing.md }} />
          <SkeletonCard style={{ height: 80, marginBottom: spacing.md }} />
          {/* 퀵 액션 스켈레톤 */}
          <SkeletonText style={{ width: '30%', marginBottom: spacing.md }} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <SkeletonCircle size={64} />
            <SkeletonCircle size={64} />
            <SkeletonCircle size={64} />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer testID="home-screen" contentContainerStyle={{ paddingBottom: 40 }} refreshing={refreshing} onRefresh={handleRefresh}>
      <HomeHeader userName={userName} isLoaded={isLoaded} />

      <HomeTodaySection
        tasks={todayTasks}
        notifications={notifications}
        onTaskPress={(route) => router.push(route as never)}
      />

      <HomeQuickActions
        actions={quickActions}
        onActionPress={(route) => router.push(route as never)}
        onCoachPress={() => router.push('/(coach)')}
      />

      {/* 교차 모듈 인사이트 */}
      {insights.length > 0 && (
        <CrossModuleInsight
          insights={insights}
          maxItems={3}
          style={{ marginBottom: spacing.md }}
          testID="cross-module-insight"
        />
      )}

      {/* 오늘의 요약 — StatCard 사용 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <SectionHeader title="오늘의 요약" gradient="brand" style={{ marginBottom: spacing.sm }} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <StatCard
            value={streakCount}
            label="연속 운동"
            suffix="일"
            moduleColor="workout"
            style={{ flex: 1 }}
            testID="stat-workout"
          />
          <StatCard
            value={calorieProgress}
            label="칼로리"
            suffix="%"
            moduleColor="nutrition"
            style={{ flex: 1 }}
            testID="stat-calorie"
          />
          <StatCard
            value={analysisCount}
            label="분석 완료"
            suffix="/3"
            style={{ flex: 1 }}
            testID="stat-analysis"
          />
        </View>
      </Animated.View>

      {/* 모듈 카드 — staggeredEntry 적용 */}
      <SectionHeader title="나의 여정" gradient="extended" style={{ marginBottom: spacing.sm + 4 }} />
      <View style={{ gap: spacing.sm + 4, marginBottom: spacing.lg }}>
        <Animated.View entering={staggeredEntry(0)}>
          <ModuleCard
            title="운동"
            description="맞춤 운동 플랜으로 목표 달성"
            variant="workout"
            onPress={() => router.push('/(workout)/onboarding')}
          />
        </Animated.View>
        <Animated.View entering={staggeredEntry(1)}>
          <ModuleCard
            title="영양"
            description="균형 잡힌 식단으로 건강 관리"
            variant="nutrition"
            onPress={() => router.push('/(nutrition)/dashboard')}
          />
        </Animated.View>
        <Animated.View entering={staggeredEntry(2)}>
          <ModuleCard
            title="제품 추천"
            description="나에게 맞는 제품 찾기"
            variant="brand"
            onPress={() => router.push('/products')}
          />
        </Animated.View>
      </View>

      {/* 팁 — GradientCard */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <GradientCard variant="professional" testID="daily-tip-card">
          <Text
            style={{
              fontSize: typography.size.xs,
              fontWeight: typography.weight.semibold,
              color: brand.primary,
              marginBottom: spacing.sm,
            }}
          >
            오늘의 팁
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.cardForeground,
              lineHeight: 22,
            }}
          >
            꾸준한 기록이 변화의 시작입니다.{'\n'}
            오늘도 이룸과 함께해요!
          </Text>
        </GradientCard>
      </Animated.View>
    </ScreenContainer>
  );
}

/** 모듈 카드 — GradientCard variant 적용 */
function ModuleCard({
  title,
  description,
  variant,
  onPress,
}: {
  title: string;
  description: string;
  variant: 'workout' | 'nutrition' | 'brand';
  onPress: () => void;
}): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  const handlePress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedCard onPress={handlePress} accessibilityLabel={`${title} 모듈로 이동`}>
      <GradientCard variant={variant} padding={spacing.md}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: 4,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm - 1,
                color: colors.mutedForeground,
              }}
            >
              {description}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 24,
              color: colors.mutedForeground,
              marginLeft: spacing.sm,
            }}
          >
            ›
          </Text>
        </View>
      </GradientCard>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
});
