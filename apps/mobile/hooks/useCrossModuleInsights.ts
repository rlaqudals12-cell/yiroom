/**
 * useCrossModuleInsights — 교차 모듈 인사이트 훅
 *
 * 분석/영양/운동 데이터를 조합하여 규칙 기반 인사이트를 생성.
 * 예: "피부 수분↓ → 물 더 마시세요"
 */
import { useMemo } from 'react';

import { useUserAnalyses } from './useUserAnalyses';
import { useWorkoutData } from './useWorkoutData';
import { useNutritionData } from './useNutritionData';

export interface CrossModuleInsight {
  id: string;
  emoji: string;
  title: string;
  description: string;
  /** 연관 모듈 */
  modules: ('skin' | 'body' | 'personalColor' | 'workout' | 'nutrition')[];
  /** 중요도 (높을수록 상단) */
  priority: number;
}

// 규칙 기반 인사이트 생성
function generateInsights(params: {
  skinScore?: number | null;
  bodyType?: string | null;
  hasPersonalColor: boolean;
  workoutStreak: number;
  waterIntake: number;
  waterGoal: number;
  calorieIntake: number;
  calorieGoal: number;
  analysisCount: number;
}): CrossModuleInsight[] {
  const insights: CrossModuleInsight[] = [];

  // 피부 수분 + 수분 섭취 연결
  if (params.skinScore !== undefined && params.skinScore !== null && params.skinScore < 50) {
    const waterPct = params.waterGoal > 0 ? (params.waterIntake / params.waterGoal) * 100 : 0;
    if (waterPct < 60) {
      insights.push({
        id: 'skin-water',
        emoji: '💧',
        title: '피부 수분이 부족해요',
        description: '물을 더 마시면 피부 수분도가 올라갈 수 있어요',
        modules: ['skin', 'nutrition'],
        priority: 90,
      });
    }
  }

  // 운동 연속 달성
  if (params.workoutStreak >= 7) {
    insights.push({
      id: 'workout-streak-week',
      emoji: '🔥',
      title: `운동 ${params.workoutStreak}일 연속!`,
      description: '꾸준한 운동이 체형 변화로 이어지고 있어요',
      modules: ['workout', 'body'],
      priority: 85,
    });
  } else if (params.workoutStreak >= 3) {
    insights.push({
      id: 'workout-streak',
      emoji: '💪',
      title: `운동 ${params.workoutStreak}일 연속 달성`,
      description: '좋은 습관이 만들어지고 있어요!',
      modules: ['workout'],
      priority: 70,
    });
  }

  // 칼로리 목표 달성
  if (params.calorieGoal > 0 && params.calorieIntake >= params.calorieGoal * 0.8) {
    insights.push({
      id: 'calorie-on-track',
      emoji: '🥗',
      title: '식단 관리 잘 하고 있어요',
      description: '균형 잡힌 식단이 피부와 체형에 긍정적인 영향을 줘요',
      modules: ['nutrition', 'skin', 'body'],
      priority: 65,
    });
  }

  // 분석 권유
  if (params.analysisCount < 3) {
    const remaining = 3 - params.analysisCount;
    insights.push({
      id: 'analysis-encourage',
      emoji: '📊',
      title: `분석 ${remaining}개 더 해보세요`,
      description: '모든 분석을 완료하면 통합 인사이트를 받을 수 있어요',
      modules: ['skin', 'body', 'personalColor'],
      priority: 50,
    });
  }

  // 퍼스널컬러 + 체형 → 스타일 추천
  if (params.hasPersonalColor && params.bodyType) {
    insights.push({
      id: 'style-synergy',
      emoji: '✨',
      title: '스타일 시너지 발견',
      description: '퍼스널컬러와 체형 분석을 조합해 최적의 코디를 찾아보세요',
      modules: ['personalColor', 'body'],
      priority: 75,
    });
  }

  // 기본 환영 인사이트 (아무것도 없을 때)
  if (insights.length === 0) {
    insights.push({
      id: 'welcome',
      emoji: '👋',
      title: '이룸과 함께 시작해요',
      description: '분석, 운동, 식단을 기록하면 맞춤 인사이트를 받을 수 있어요',
      modules: [],
      priority: 10,
    });
  }

  return insights.sort((a, b) => b.priority - a.priority);
}

export function useCrossModuleInsights(): {
  insights: CrossModuleInsight[];
  isLoading: boolean;
} {
  const { personalColor, skinAnalysis, bodyAnalysis, isLoading: analysisLoading } =
    useUserAnalyses();
  const { streak, isLoading: workoutLoading } = useWorkoutData();
  const {
    todaySummary,
    settings: nutritionSettings,
    isLoading: nutritionLoading,
  } = useNutritionData();

  const isLoading = analysisLoading || workoutLoading || nutritionLoading;

  const insights = useMemo(() => {
    if (isLoading) return [];

    const analysisCount = [personalColor, skinAnalysis, bodyAnalysis].filter(Boolean).length;

    return generateInsights({
      skinScore: skinAnalysis?.overallScore ?? null,
      bodyType: bodyAnalysis?.bodyType ?? null,
      hasPersonalColor: !!personalColor,
      workoutStreak: streak?.currentStreak ?? 0,
      waterIntake: todaySummary?.waterIntake ?? 0,
      waterGoal: nutritionSettings?.waterGoal ?? 2000,
      calorieIntake: todaySummary?.totalCalories ?? 0,
      calorieGoal: nutritionSettings?.dailyCalorieGoal ?? 2000,
      analysisCount,
    });
  }, [
    isLoading,
    personalColor,
    skinAnalysis,
    bodyAnalysis,
    streak,
    todaySummary,
    nutritionSettings,
  ]);

  return { insights, isLoading };
}

// 테스트용 export
export { generateInsights as _testOnly_generateInsights };
