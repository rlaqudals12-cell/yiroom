// ============================================================
// 웰니스 스코어 계산기
// Phase H Sprint 2
// ============================================================

import type {
  ScoreBreakdown,
  WorkoutScoreInput,
  NutritionScoreInput,
  SkinScoreInput,
  BodyScoreInput,
  WellnessInsight,
} from '@/types/wellness';
import {
  SCORE_WEIGHTS,
  STREAK_BONUS_TABLE,
  FREQUENCY_SCORE_TABLE,
  ANALYSIS_AGE_SCORE_TABLE,
  INSIGHT_THRESHOLDS,
  getScoreFromTable,
  percentToScore,
} from './constants';

// 운동 점수 계산 (0-25)
export function calculateWorkoutScore(input: WorkoutScoreInput): {
  total: number;
  breakdown: { streak: number; frequency: number; goal: number };
} {
  // 스트릭 점수 (0-10)
  const streakScore = getScoreFromTable(input.currentStreak, STREAK_BONUS_TABLE);

  // 빈도 점수 (0-10)
  const frequencyScore = getScoreFromTable(input.weeklyWorkouts, FREQUENCY_SCORE_TABLE);

  // 목표 달성률 점수 (0-5)
  const goalPercent =
    input.totalGoals > 0 ? (input.completedGoals / input.totalGoals) * 100 : 0;
  const goalScore = percentToScore(goalPercent, SCORE_WEIGHTS.workout.goal);

  const total = streakScore + frequencyScore + goalScore;

  return {
    total: Math.min(25, total),
    breakdown: { streak: streakScore, frequency: frequencyScore, goal: goalScore },
  };
}

// 영양 점수 계산 (0-25)
export function calculateNutritionScore(input: NutritionScoreInput): {
  total: number;
  breakdown: { calorie: number; balance: number; water: number };
} {
  // 칼로리 달성 점수 (0-10)
  const calorieScore = percentToScore(input.calorieAchievement, SCORE_WEIGHTS.nutrition.calorie);

  // 영양 균형 점수 (0-10) - 단백질, 탄수화물, 지방 평균
  const avgBalance = (input.proteinAchievement + input.carbsAchievement + input.fatAchievement) / 3;
  const balanceScore = percentToScore(avgBalance, SCORE_WEIGHTS.nutrition.balance);

  // 수분 섭취 점수 (0-5)
  const waterPercent =
    input.targetWaterCups > 0
      ? (input.waterCups / input.targetWaterCups) * 100
      : input.waterCups >= 8
        ? 100
        : (input.waterCups / 8) * 100;
  const waterScore = percentToScore(waterPercent, SCORE_WEIGHTS.nutrition.water);

  const total = calorieScore + balanceScore + waterScore;

  return {
    total: Math.min(25, total),
    breakdown: { calorie: calorieScore, balance: balanceScore, water: waterScore },
  };
}

// 피부 점수 계산 (0-25)
export function calculateSkinScore(input: SkinScoreInput): {
  total: number;
  breakdown: { analysis: number; routine: number; matching: number };
} {
  // 분석 점수 (0-10) - 분석 여부 + 최신성
  const analysisScore = input.hasAnalysis
    ? getScoreFromTable(input.analysisAge, ANALYSIS_AGE_SCORE_TABLE)
    : 0;

  // 루틴 점수 (0-10)
  const routineScore = input.routineCompleted ? SCORE_WEIGHTS.skin.routine : 0;

  // 매칭 점수 (0-5)
  const matchingScore = percentToScore(input.productMatchScore, SCORE_WEIGHTS.skin.matching);

  const total = analysisScore + routineScore + matchingScore;

  return {
    total: Math.min(25, total),
    breakdown: { analysis: analysisScore, routine: routineScore, matching: matchingScore },
  };
}

// 체형 점수 계산 (0-25)
export function calculateBodyScore(input: BodyScoreInput): {
  total: number;
  breakdown: { analysis: number; progress: number; workout: number };
} {
  // 분석 점수 (0-10)
  const analysisScore = input.hasAnalysis
    ? getScoreFromTable(input.analysisAge, ANALYSIS_AGE_SCORE_TABLE)
    : 0;

  // 목표 진행률 점수 (0-10)
  let progressPercent = 0;
  if (input.targetWeight !== input.initialWeight) {
    const totalChange = Math.abs(input.targetWeight - input.initialWeight);
    const currentChange = Math.abs(input.currentWeight - input.initialWeight);
    progressPercent = Math.min(100, (currentChange / totalChange) * 100);
  }
  const progressScore = percentToScore(progressPercent, SCORE_WEIGHTS.body.progress);

  // 운동 연동 점수 (0-5)
  const workoutScore = input.hasWorkoutPlan ? SCORE_WEIGHTS.body.workout : 0;

  const total = analysisScore + progressScore + workoutScore;

  return {
    total: Math.min(25, total),
    breakdown: { analysis: analysisScore, progress: progressScore, workout: workoutScore },
  };
}

// 전체 웰니스 스코어 계산
export function calculateWellnessScore(
  workoutInput: WorkoutScoreInput,
  nutritionInput: NutritionScoreInput,
  skinInput: SkinScoreInput,
  bodyInput: BodyScoreInput
): {
  totalScore: number;
  workoutScore: number;
  nutritionScore: number;
  skinScore: number;
  bodyScore: number;
  breakdown: ScoreBreakdown;
} {
  const workout = calculateWorkoutScore(workoutInput);
  const nutrition = calculateNutritionScore(nutritionInput);
  const skin = calculateSkinScore(skinInput);
  const body = calculateBodyScore(bodyInput);

  const totalScore = workout.total + nutrition.total + skin.total + body.total;

  return {
    totalScore: Math.min(100, totalScore),
    workoutScore: workout.total,
    nutritionScore: nutrition.total,
    skinScore: skin.total,
    bodyScore: body.total,
    breakdown: {
      workout: workout.breakdown,
      nutrition: nutrition.breakdown,
      skin: skin.breakdown,
      body: body.breakdown,
    },
  };
}

// 인사이트 생성
export function generateInsights(
  scores: {
    workoutScore: number;
    nutritionScore: number;
    skinScore: number;
    bodyScore: number;
  },
  inputs: {
    currentStreak?: number;
    hasAnalysis?: boolean;
  } = {}
): WellnessInsight[] {
  const insights: WellnessInsight[] = [];

  // 낮은 점수 영역 개선 제안
  if (scores.workoutScore < INSIGHT_THRESHOLDS.lowScore / 4) {
    insights.push({
      type: 'improvement',
      area: 'workout',
      message: '운동을 시작해보세요! 규칙적인 운동이 건강의 기초입니다.',
      priority: 1,
    });
  }

  if (scores.nutritionScore < INSIGHT_THRESHOLDS.lowScore / 4) {
    insights.push({
      type: 'improvement',
      area: 'nutrition',
      message: '식단 기록을 시작해보세요. 먹는 것을 기록하면 건강한 식습관이 만들어집니다.',
      priority: 2,
    });
  }

  if (scores.skinScore < INSIGHT_THRESHOLDS.lowScore / 4 && !inputs.hasAnalysis) {
    insights.push({
      type: 'tip',
      area: 'skin',
      message: '피부 분석을 받아보세요. 맞춤형 스킨케어 루틴을 추천받을 수 있습니다.',
      priority: 3,
    });
  }

  // 스트릭 마일스톤 축하
  if (inputs.currentStreak) {
    const milestone = INSIGHT_THRESHOLDS.streakMilestones.find(
      (m) => inputs.currentStreak === m
    );
    if (milestone) {
      insights.push({
        type: 'achievement',
        area: 'workout',
        message: `${milestone}일 연속 운동 달성! 대단해요!`,
        priority: 1,
      });
    }
  }

  // 높은 점수 칭찬
  const totalScore = scores.workoutScore + scores.nutritionScore + scores.skinScore + scores.bodyScore;
  if (totalScore >= INSIGHT_THRESHOLDS.highScore) {
    insights.push({
      type: 'achievement',
      area: 'overall',
      message: '훌륭한 웰니스 점수입니다! 꾸준히 유지해주세요.',
      priority: 1,
    });
  }

  // 우선순위별 정렬
  return insights.sort((a, b) => (a.priority ?? 5) - (b.priority ?? 5));
}
