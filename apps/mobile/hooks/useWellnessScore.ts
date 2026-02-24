/**
 * useWellnessScore — 종합 웰니스 점수 계산
 *
 * 분석 완료도 + 운동 스트릭 + 영양 스트릭을 종합하여 0-100 점수 산출.
 * 각 영역별 가중치: 분석 40%, 운동 30%, 영양 30%.
 */
import { useMemo } from 'react';

import type { PersonalColorResult, SkinAnalysisResult, BodyAnalysisResult } from './useUserAnalyses';
import type { WorkoutStreak } from './useWorkoutData';
import type { NutritionStreak } from './useNutritionData';

export interface WellnessBreakdown {
  analysis: number; // 0-100
  workout: number;  // 0-100
  nutrition: number; // 0-100
}

export interface WellnessLevel {
  level: number;
  title: string;
  xp: number;
  nextLevelXp: number;
}

export interface UseWellnessScoreReturn {
  score: number; // 0-100
  breakdown: WellnessBreakdown;
  level: WellnessLevel;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  category: 'analysis' | 'workout' | 'nutrition' | 'streak';
}

// 분석 완료 점수 계산 (0-100)
function calcAnalysisScore(
  personalColor: PersonalColorResult | null,
  skinAnalysis: SkinAnalysisResult | null,
  bodyAnalysis: BodyAnalysisResult | null
): number {
  const count = [personalColor, skinAnalysis, bodyAnalysis].filter(Boolean).length;
  // 0: 0점, 1: 40점, 2: 70점, 3: 100점
  const scores = [0, 40, 70, 100];
  return scores[count];
}

// 운동 스트릭 점수 (0-100)
function calcWorkoutScore(streak: WorkoutStreak | null): number {
  if (!streak) return 0;
  const s = streak.currentStreak;
  if (s === 0) return 0;
  if (s <= 2) return 30;
  if (s <= 6) return 50 + (s - 2) * 5;
  if (s <= 14) return 70 + (s - 6) * 2;
  return Math.min(100, 86 + Math.floor((s - 14) / 7) * 2);
}

// 영양 스트릭 점수 (0-100)
function calcNutritionScore(streak: NutritionStreak | null): number {
  if (!streak) return 0;
  const s = streak.currentStreak;
  if (s === 0) return 0;
  if (s <= 2) return 30;
  if (s <= 6) return 50 + (s - 2) * 5;
  if (s <= 14) return 70 + (s - 6) * 2;
  return Math.min(100, 86 + Math.floor((s - 14) / 7) * 2);
}

// 레벨 계산: XP = 총 점수의 누적, 레벨당 100 XP
function calcLevel(score: number): WellnessLevel {
  // XP = score 자체 (최대 100)
  const xp = score;
  const LEVELS = [
    { threshold: 0, title: '시작' },
    { threshold: 20, title: '초보 탐험가' },
    { threshold: 40, title: '성장하는 나' },
    { threshold: 60, title: '꾸준한 관리자' },
    { threshold: 80, title: '웰니스 달인' },
    { threshold: 95, title: '완벽한 균형' },
  ];

  let level = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].threshold) {
      level = i + 1;
      break;
    }
  }

  const currentLevel = LEVELS[level - 1];
  const nextLevel = LEVELS[level] ?? LEVELS[LEVELS.length - 1];

  return {
    level,
    title: currentLevel.title,
    xp,
    nextLevelXp: nextLevel.threshold,
  };
}

// 업적 계산
function calcAchievements(
  personalColor: PersonalColorResult | null,
  skinAnalysis: SkinAnalysisResult | null,
  bodyAnalysis: BodyAnalysisResult | null,
  workoutStreak: WorkoutStreak | null,
  nutritionStreak: NutritionStreak | null
): Achievement[] {
  return [
    {
      id: 'first-analysis',
      title: '첫 분석',
      description: '첫 번째 분석을 완료했어요',
      emoji: '🔬',
      unlocked: !!(personalColor || skinAnalysis || bodyAnalysis),
      category: 'analysis',
    },
    {
      id: 'color-master',
      title: '컬러 마스터',
      description: '퍼스널 컬러 분석을 완료했어요',
      emoji: '🎨',
      unlocked: !!personalColor,
      category: 'analysis',
    },
    {
      id: 'skin-expert',
      title: '피부 전문가',
      description: '피부 분석을 완료했어요',
      emoji: '✨',
      unlocked: !!skinAnalysis,
      category: 'analysis',
    },
    {
      id: 'body-aware',
      title: '체형 인식',
      description: '체형 분석을 완료했어요',
      emoji: '💪',
      unlocked: !!bodyAnalysis,
      category: 'analysis',
    },
    {
      id: 'all-analyzed',
      title: '올 클리어',
      description: '3가지 분석을 모두 완료했어요',
      emoji: '🏆',
      unlocked: !!(personalColor && skinAnalysis && bodyAnalysis),
      category: 'analysis',
    },
    {
      id: 'workout-start',
      title: '운동 시작',
      description: '첫 운동을 기록했어요',
      emoji: '🏃',
      unlocked: (workoutStreak?.currentStreak ?? 0) >= 1,
      category: 'workout',
    },
    {
      id: 'workout-3',
      title: '3일 연속 운동',
      description: '3일 연속으로 운동했어요',
      emoji: '🔥',
      unlocked: (workoutStreak?.currentStreak ?? 0) >= 3,
      category: 'streak',
    },
    {
      id: 'workout-7',
      title: '일주일 운동왕',
      description: '7일 연속으로 운동했어요',
      emoji: '👑',
      unlocked: (workoutStreak?.longestStreak ?? 0) >= 7,
      category: 'streak',
    },
    {
      id: 'nutrition-start',
      title: '식단 기록 시작',
      description: '첫 식단을 기록했어요',
      emoji: '🥗',
      unlocked: (nutritionStreak?.currentStreak ?? 0) >= 1,
      category: 'nutrition',
    },
    {
      id: 'nutrition-3',
      title: '3일 연속 기록',
      description: '3일 연속으로 식단을 기록했어요',
      emoji: '📋',
      unlocked: (nutritionStreak?.currentStreak ?? 0) >= 3,
      category: 'streak',
    },
    {
      id: 'nutrition-7',
      title: '일주일 기록왕',
      description: '7일 연속으로 식단을 기록했어요',
      emoji: '🌟',
      unlocked: (nutritionStreak?.longestStreak ?? 0) >= 7,
      category: 'streak',
    },
    {
      id: 'wellness-50',
      title: '균형 잡힌 삶',
      description: '웰니스 점수 50점을 달성했어요',
      emoji: '⚖️',
      unlocked: false, // 아래에서 재계산
      category: 'streak',
    },
  ];
}

interface UseWellnessScoreParams {
  personalColor: PersonalColorResult | null;
  skinAnalysis: SkinAnalysisResult | null;
  bodyAnalysis: BodyAnalysisResult | null;
  workoutStreak: WorkoutStreak | null;
  nutritionStreak: NutritionStreak | null;
}

export function useWellnessScore({
  personalColor,
  skinAnalysis,
  bodyAnalysis,
  workoutStreak,
  nutritionStreak,
}: UseWellnessScoreParams): UseWellnessScoreReturn {
  return useMemo(() => {
    const analysis = calcAnalysisScore(personalColor, skinAnalysis, bodyAnalysis);
    const workout = calcWorkoutScore(workoutStreak);
    const nutrition = calcNutritionScore(nutritionStreak);

    // 가중 평균: 분석 40%, 운동 30%, 영양 30%
    const score = Math.round(analysis * 0.4 + workout * 0.3 + nutrition * 0.3);

    const level = calcLevel(score);

    const achievements = calcAchievements(
      personalColor,
      skinAnalysis,
      bodyAnalysis,
      workoutStreak,
      nutritionStreak
    );

    // wellness-50 업적 갱신
    const w50 = achievements.find((a) => a.id === 'wellness-50');
    if (w50) {
      w50.unlocked = score >= 50;
    }

    return {
      score,
      breakdown: { analysis, workout, nutrition },
      level,
      achievements,
    };
  }, [personalColor, skinAnalysis, bodyAnalysis, workoutStreak, nutritionStreak]);
}

// 테스트용 export
export { calcAnalysisScore, calcWorkoutScore, calcNutritionScore, calcLevel };
