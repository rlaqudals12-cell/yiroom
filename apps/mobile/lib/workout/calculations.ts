/**
 * W-1 무게/횟수 계산 로직 (Task 3.8)
 *
 * 주요 기능:
 * - 1RM (1 Rep Max) 추정 (Epley 공식)
 * - 1RM 기반 훈련 무게 계산
 * - 세트 구성 자동 생성
 * - PR(Personal Record) 달성 확인
 * - 체중 기반 무게 추천 (초보자용)
 * - 점진적 과부하 계산
 */

import type { ExerciseDifficulty, ExerciseCategory } from '@/types/workout';

// ============================================
// 타입 정의
// ============================================

/** 운동 목표 타입 */
export type TrainingGoal = 'strength' | 'hypertrophy' | 'endurance';

/** 세트 구성 정보 */
export interface SetScheme {
  setNumber: number;
  reps: number;
  weight: number;
  percentage: number;
  label: string;
}

/** PR 달성 결과 */
export interface PRAchievementResult {
  isPR: boolean;
  previous1RM?: number;
  new1RM?: number;
  improvement?: number;
  improvementPercent?: number;
  message?: string;
}

/** 이전 운동 기록 */
export interface ExerciseRecord {
  weight: number;
  reps: number;
  date?: string;
}

/** 무게 추천 결과 */
export interface WeightRecommendation {
  recommendedWeight: number;
  minWeight: number;
  maxWeight: number;
  unit: 'kg';
}

// ============================================
// 상수 정의
// ============================================

/** 목표별 1RM 비율 */
const RM_PERCENTAGES: Record<TrainingGoal, Record<string, number>> = {
  strength: {
    '3_reps': 0.93,
    '5_reps': 0.87,
    '6_reps': 0.83,
  },
  hypertrophy: {
    '8_reps': 0.8,
    '10_reps': 0.75,
    '12_reps': 0.7,
  },
  endurance: {
    '15_reps': 0.65,
    '20_reps': 0.55,
  },
};

/** 목표별 세트 구성 */
const SET_SCHEMES: Record<
  TrainingGoal,
  Array<{ reps: number; percentage: number; label: string }>
> = {
  strength: [
    { reps: 5, percentage: 0.75, label: '웜업' },
    { reps: 5, percentage: 0.8, label: '빌드업' },
    { reps: 3, percentage: 0.87, label: '탑세트' },
    { reps: 3, percentage: 0.87, label: '탑세트' },
    { reps: 3, percentage: 0.87, label: '탑세트' },
  ],
  hypertrophy: [
    { reps: 10, percentage: 0.6, label: '웜업' },
    { reps: 10, percentage: 0.7, label: '워킹세트' },
    { reps: 10, percentage: 0.7, label: '워킹세트' },
    { reps: 10, percentage: 0.7, label: '워킹세트' },
    { reps: 12, percentage: 0.65, label: '마무리' },
  ],
  endurance: [
    { reps: 15, percentage: 0.5, label: '웜업' },
    { reps: 15, percentage: 0.55, label: '워킹세트' },
    { reps: 15, percentage: 0.55, label: '워킹세트' },
    { reps: 20, percentage: 0.5, label: '마무리' },
  ],
};

/** 체중 기반 무게 비율 (1RM 없는 초보자용) */
const BASE_RATIOS: Record<'lower_body' | 'upper_body', Record<ExerciseDifficulty, number>> = {
  lower_body: {
    beginner: 0.15,
    intermediate: 0.25,
    advanced: 0.4,
  },
  upper_body: {
    beginner: 0.08,
    intermediate: 0.15,
    advanced: 0.25,
  },
};

/** 목표별 무게 조정 배율 */
const GOAL_MULTIPLIERS: Record<string, number> = {
  muscle: 1.2, // 근력 증가
  strength: 1.2,
  toning: 1.0, // 토닝
  shape: 1.0,
  diet: 0.8, // 다이어트
  endurance: 0.8,
};

// ============================================
// 1RM 계산 함수
// ============================================

/**
 * 1RM(1 Rep Max) 추정 - Epley 공식
 * 공식: 1RM = 무게 × (1 + 횟수 / 30)
 *
 * @param weight - 들어올린 무게 (kg)
 * @param reps - 반복 횟수
 * @returns 추정 1RM (kg)
 */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0) return 0;
  if (reps <= 0) return 0;
  if (reps === 1) return weight;

  // Epley 공식 (가장 널리 사용)
  const estimated1RM = weight * (1 + reps / 30);

  return Math.round(estimated1RM * 10) / 10; // 소수점 1자리
}

/**
 * Brzycki 공식으로 1RM 추정 (대안)
 * 공식: 1RM = 무게 × (36 / (37 - 횟수))
 */
export function estimate1RMBrzycki(weight: number, reps: number): number {
  if (weight <= 0) return 0;
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  if (reps >= 37) return weight * 2; // 37회 이상은 공식 한계

  const estimated1RM = weight * (36 / (37 - reps));

  return Math.round(estimated1RM * 10) / 10;
}

// ============================================
// 훈련 무게 계산 함수
// ============================================

/**
 * 사용자 목표를 TrainingGoal로 변환
 */
export function mapGoalToTrainingGoal(goal: string): TrainingGoal {
  const goalMap: Record<string, TrainingGoal> = {
    muscle: 'strength',
    strength: 'strength',
    toning: 'hypertrophy',
    shape: 'hypertrophy',
    diet: 'endurance',
    endurance: 'endurance',
    weightLoss: 'endurance',
  };

  return goalMap[goal] || 'hypertrophy';
}

/**
 * 1RM 기반 훈련 무게 계산
 *
 * 목표별 1RM 비율:
 * - 근력(1-5회): 80-100%
 * - 근비대(6-12회): 60-80%
 * - 근지구력(12회+): 50-60%
 *
 * @param oneRM - 1RM 값 (kg)
 * @param goal - 훈련 목표
 * @param repsTarget - 목표 반복 횟수
 * @returns 추천 훈련 무게 (kg, 2.5kg 단위)
 */
export function calculateTrainingWeightFrom1RM(
  oneRM: number,
  goal: string,
  repsTarget: number
): number {
  if (oneRM <= 0) return 0;

  const trainingGoal = mapGoalToTrainingGoal(goal);
  const percentages = RM_PERCENTAGES[trainingGoal];

  // 목표 횟수에 맞는 비율 찾기
  const key = `${repsTarget}_reps`;
  let percentage = percentages[key];

  // 정확히 일치하는 횟수가 없으면 보간
  if (!percentage) {
    // 기본값 사용
    if (repsTarget <= 6) {
      percentage = 0.83;
    } else if (repsTarget <= 12) {
      percentage = 0.7;
    } else {
      percentage = 0.55;
    }
  }

  const trainingWeight = oneRM * percentage;

  // 2.5kg 단위로 반올림
  return roundToNearest(trainingWeight, 2.5);
}

/**
 * 1RM 기반 세트 구성 자동 생성
 *
 * @param oneRM - 1RM 값 (kg)
 * @param goal - 훈련 목표
 * @returns 세트 구성 배열
 */
export function generateSetSchemeFrom1RM(oneRM: number, goal: string): SetScheme[] {
  if (oneRM <= 0) return [];

  const trainingGoal = mapGoalToTrainingGoal(goal);
  const scheme = SET_SCHEMES[trainingGoal];

  return scheme.map((setInfo, index) => ({
    setNumber: index + 1,
    reps: setInfo.reps,
    weight: roundToNearest(oneRM * setInfo.percentage, 2.5),
    percentage: setInfo.percentage,
    label: setInfo.label,
  }));
}

// ============================================
// PR 달성 확인 함수
// ============================================

/**
 * PR(Personal Record) 달성 확인
 *
 * @param exercise - 운동 이름/ID
 * @param newWeight - 새로운 무게 (kg)
 * @param newReps - 새로운 반복 횟수
 * @param previousRecords - 이전 기록들
 * @returns PR 달성 결과
 */
export function checkPRAchievement(
  exercise: string,
  newWeight: number,
  newReps: number,
  previousRecords: Record<string, ExerciseRecord[]>
): PRAchievementResult {
  // 기존 기록에서 해당 운동의 최고 1RM 찾기
  let prev1RM = 0;
  const records = previousRecords[exercise] || [];

  for (const record of records) {
    const estimated = estimate1RM(record.weight, record.reps);
    prev1RM = Math.max(prev1RM, estimated);
  }

  // 새 기록의 1RM 계산
  const new1RM = estimate1RM(newWeight, newReps);

  if (new1RM > prev1RM) {
    const improvement = Math.round((new1RM - prev1RM) * 10) / 10;
    const improvementPercent = prev1RM > 0 ? Math.round((improvement / prev1RM) * 100) : 100;

    return {
      isPR: true,
      previous1RM: prev1RM,
      new1RM: new1RM,
      improvement,
      improvementPercent,
      message: `🎉 ${exercise} PR 달성! +${improvement}kg (+${improvementPercent}%)`,
    };
  }

  return { isPR: false };
}

// ============================================
// 체중 기반 무게 추천 (초보자용)
// ============================================

/**
 * 운동 카테고리를 상/하체로 분류
 */
function getBodyPartCategory(category: ExerciseCategory): 'lower_body' | 'upper_body' {
  if (category === 'lower' || category === 'core') {
    return 'lower_body';
  }
  return 'upper_body';
}

/**
 * 체중 기반 무게 추천 (1RM 데이터 없을 때 사용)
 *
 * @param userWeight - 사용자 체중 (kg)
 * @param category - 운동 카테고리
 * @param userLevel - 사용자 레벨
 * @param goal - 운동 목표
 * @returns 추천 무게 정보
 */
export function calculateRecommendedWeight(
  userWeight: number,
  category: ExerciseCategory,
  userLevel: ExerciseDifficulty,
  goal: string
): WeightRecommendation {
  if (userWeight <= 0) {
    return { recommendedWeight: 0, minWeight: 0, maxWeight: 0, unit: 'kg' };
  }

  const bodyPartCategory = getBodyPartCategory(category);
  const baseRatio = BASE_RATIOS[bodyPartCategory][userLevel];
  const goalMultiplier = GOAL_MULTIPLIERS[goal] || 1.0;

  const recommended = userWeight * baseRatio * goalMultiplier;
  const roundedWeight = roundToNearest(recommended, 2.5);

  // 범위 계산 (±20%)
  const minWeight = roundToNearest(roundedWeight * 0.8, 2.5);
  const maxWeight = roundToNearest(roundedWeight * 1.2, 2.5);

  return {
    recommendedWeight: roundedWeight,
    minWeight: Math.max(minWeight, 2.5), // 최소 2.5kg
    maxWeight,
    unit: 'kg',
  };
}

// ============================================
// 점진적 과부하 계산
// ============================================

/**
 * 점진적 과부하 계산
 * 주당 2.5% 증가, 최대 10%
 *
 * @param currentWeight - 현재 무게 (kg)
 * @param weeksTrained - 훈련 주차
 * @returns 새로운 추천 무게 (kg, 2.5kg 단위)
 */
export function calculateProgressiveOverload(currentWeight: number, weeksTrained: number): number {
  if (currentWeight <= 0) return 0;
  if (weeksTrained <= 0) return currentWeight;

  const weeklyIncrease = 0.025; // 주당 2.5%
  const maxIncrease = 0.1; // 최대 10%

  const increaseRate = Math.min(weeklyIncrease * weeksTrained, maxIncrease);
  const newWeight = currentWeight * (1 + increaseRate);

  return roundToNearest(newWeight, 2.5);
}

// ============================================
// 횟수/세트 추천 함수
// ============================================

/** 횟수 추천 결과 */
export interface RepsRecommendation {
  reps: number;
  sets: number;
  restSeconds: number;
  description: string;
}

/**
 * 목표에 따른 횟수/세트 추천
 *
 * @param goal - 훈련 목표
 * @param userLevel - 사용자 레벨
 * @returns 횟수/세트 추천 정보
 */
export function getRecommendedRepsAndSets(
  goal: string,
  userLevel: ExerciseDifficulty
): RepsRecommendation {
  const trainingGoal = mapGoalToTrainingGoal(goal);

  // 레벨별 세트 수 조정
  const baseSets: Record<ExerciseDifficulty, number> = {
    beginner: 3,
    intermediate: 4,
    advanced: 5,
  };

  const recommendations: Record<TrainingGoal, Omit<RepsRecommendation, 'sets'>> = {
    strength: {
      reps: 5,
      restSeconds: 180, // 3분
      description: '근력 향상을 위한 고중량 저반복',
    },
    hypertrophy: {
      reps: 10,
      restSeconds: 90, // 1분 30초
      description: '근비대를 위한 중강도 중반복',
    },
    endurance: {
      reps: 15,
      restSeconds: 60, // 1분
      description: '근지구력 향상을 위한 저중량 고반복',
    },
  };

  const rec = recommendations[trainingGoal];

  return {
    ...rec,
    sets: baseSets[userLevel],
  };
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 지정된 단위로 반올림
 * @param value - 원본 값
 * @param unit - 반올림 단위
 * @returns 반올림된 값
 */
export function roundToNearest(value: number, unit: number): number {
  return Math.round(value / unit) * unit;
}

/**
 * 총 볼륨 계산 (sets × reps × weight)
 */
export function calculateTotalVolume(sets: number, reps: number, weight: number): number {
  return sets * reps * weight;
}

/**
 * 볼륨 변화율 계산
 */
export function calculateVolumeChange(currentVolume: number, previousVolume: number): number {
  if (previousVolume <= 0) return 0;
  return (currentVolume - previousVolume) / previousVolume;
}
