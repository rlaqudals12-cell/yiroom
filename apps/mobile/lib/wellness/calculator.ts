/**
 * 웰니스 점수 상세 계산 (웹 이식)
 *
 * WellnessDataInput → WellnessInput 변환 + 점수 계산
 *
 * @module lib/wellness/calculator
 */
import type { WellnessDataInput, WeeklyWellnessSummary } from './types';

import type { WellnessInput, WellnessScore } from './index';
import { calculateWellnessScore, calculateTrend } from './index';

/**
 * DB 데이터를 WellnessInput으로 변환
 */
export function convertToWellnessInput(data: WellnessDataInput): WellnessInput {
  // 주간 운동 통계
  const weeklyWorkoutMinutes = data.workoutSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const workoutDays = new Set(data.workoutSessions.map((s) => s.date)).size;

  // 평균 칼로리 정확도 (목표 대비 비율, 1에 가까울수록 좋음)
  const avgCalorieAccuracy =
    data.mealRecords.length > 0
      ? data.mealRecords.reduce((sum, m) => {
          const ratio = m.targetCalories > 0 ? m.totalCalories / m.targetCalories : 0;
          // 1에 가까울수록 정확 (0.8~1.2 범위가 이상적)
          return sum + Math.max(0, 1 - Math.abs(1 - ratio));
        }, 0) / data.mealRecords.length
      : 0.5;

  // 평균 매크로 밸런스
  const avgMacroBalance =
    data.mealRecords.length > 0
      ? data.mealRecords.reduce((sum, m) => sum + m.macroBalance, 0) / data.mealRecords.length
      : 0.5;

  // 수분 섭취 비율
  const waterIntakeRatio =
    data.waterIntake.length > 0
      ? data.waterIntake.reduce((sum, w) => {
          return sum + Math.min(1, w.amountMl / Math.max(1, w.targetMl));
        }, 0) / data.waterIntake.length
      : 0.5;

  // 피부 루틴 일관성 (7일 중 수행 비율)
  const skinRoutineConsistency = data.skinRoutineDays / 7;

  return {
    weeklyWorkoutMinutes,
    weeklyWorkoutDays: workoutDays,
    avgCalorieAccuracy,
    avgMacroBalance,
    waterIntakeRatio,
    skinScore: data.skinScore,
    skinRoutineConsistency,
    bodyScore: data.bodyScore,
    postureScore: data.postureScore,
    currentStreak: data.currentStreak,
  };
}

/**
 * DB 데이터에서 직접 웰니스 점수 계산
 */
export function calculateWellnessFromData(data: WellnessDataInput): WellnessScore {
  const input = convertToWellnessInput(data);
  return calculateWellnessScore(input);
}

/**
 * 주간 웰니스 요약 생성
 */
export function generateWeeklySummary(
  dailyScores: { date: string; score: number }[],
  previousWeekAvg: number | null
): WeeklyWellnessSummary {
  if (dailyScores.length === 0) {
    return {
      weekStart: '',
      weekEnd: '',
      averageScore: 0,
      bestDay: { date: '', score: 0 },
      worstDay: { date: '', score: 0 },
      trend: 'stable',
      improvements: [],
    };
  }

  const sorted = [...dailyScores].sort((a, b) => a.date.localeCompare(b.date));
  const avgScore = sorted.reduce((s, d) => s + d.score, 0) / sorted.length;
  const best = sorted.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = sorted.reduce((a, b) => (b.score < a.score ? b : a));

  const improvements: string[] = [];
  if (avgScore >= 80) improvements.push('전체적으로 우수한 웰니스 상태입니다');
  if (avgScore < 60) improvements.push('운동과 영양 관리에 더 신경 써보세요');

  return {
    weekStart: sorted[0].date,
    weekEnd: sorted[sorted.length - 1].date,
    averageScore: Math.round(avgScore),
    bestDay: best,
    worstDay: worst,
    trend: calculateTrend(avgScore, previousWeekAvg),
    improvements,
  };
}
