/**
 * W-1 칼로리 계산 로직 (Task 3.9)
 *
 * MET(Metabolic Equivalent of Task) 기반 칼로리 소모량 계산
 * 공식: 칼로리 = 체중(kg) × 시간(시간) × MET
 *
 * 주요 기능:
 * - MET 값 기반 칼로리 소모량 계산
 * - 운동 타입별 기본 MET 값 제공
 * - 세션 전체 칼로리 계산
 * - 주간 칼로리 소모량 합산
 */

import type { Exercise, ExerciseCategory, ExerciseDifficulty } from '@/types/workout';

// ============================================
// 타입 정의
// ============================================

/** 운동 타입 (MET 계산용) */
export type ExerciseType =
  // 웨이트 트레이닝
  | 'weight_light'
  | 'weight_moderate'
  | 'weight_vigorous'
  // 달리기/유산소 (스펙 7.2 기준)
  | 'jogging' // 스펙: 7.0
  | 'running' // 스펙: 10.0
  // 기타 운동
  | 'cycling'
  | 'swimming'
  | 'walking'
  | 'yoga'
  | 'pilates'
  | 'hiit'
  | 'stretching';

/** 칼로리 계산 결과 */
export interface CalorieResult {
  calories: number;
  met: number;
  durationMinutes: number;
  weightKg: number;
}

/** 세션 칼로리 계산 결과 */
export interface SessionCalorieResult {
  totalCalories: number;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    calories: number;
    durationMinutes: number;
    met: number;
  }[];
  totalDurationMinutes: number;
}

/** 주간 칼로리 요약 */
export interface WeeklyCalorieSummary {
  totalCalories: number;
  dailyAverage: number;
  activeDays: number;
  caloriesByDay: Record<string, number>;
}

// ============================================
// 상수 정의
// ============================================

/**
 * MET 값 (Metabolic Equivalent of Task)
 * Feature Spec 7.2 기준
 */
export const MET_VALUES: Record<ExerciseType, number> = {
  // 웨이트 트레이닝
  weight_light: 3.0, // 가벼운 웨이트 (몸풀기, 저강도)
  weight_moderate: 5.0, // 중간 강도 웨이트 (일반적 운동)
  weight_vigorous: 6.0, // 고강도 웨이트 (근력 훈련)

  // 유산소 (스펙 7.2 정확히 준수)
  jogging: 7.0, // 조깅
  running: 10.0, // 달리기

  // 기타 운동 (스펙 7.2 정확히 준수)
  cycling: 6.0, // 자전거
  swimming: 8.0, // 수영
  walking: 3.5, // 걷기
  yoga: 2.5, // 요가
  pilates: 3.0, // 필라테스
  hiit: 8.0, // 고강도 인터벌 트레이닝
  stretching: 2.0, // 스트레칭
};

/**
 * 운동 카테고리 → 기본 MET 매핑
 */
const CATEGORY_DEFAULT_MET: Record<ExerciseCategory, number> = {
  upper: 5.0, // 상체 운동
  lower: 5.5, // 하체 운동 (더 큰 근육군)
  core: 4.0, // 코어 운동
  cardio: 8.0, // 유산소 운동
};

/**
 * 난이도별 MET 조정 배율
 */
const DIFFICULTY_MET_MULTIPLIER: Record<ExerciseDifficulty, number> = {
  beginner: 0.8, // 초급: -20%
  intermediate: 1.0, // 중급: 기본값
  advanced: 1.2, // 고급: +20%
};

// ============================================
// 핵심 계산 함수
// ============================================

/**
 * MET 기반 칼로리 소모량 계산
 *
 * 공식: 칼로리 = 체중(kg) × 시간(시간) × MET
 *
 * @param weightKg - 체중 (kg)
 * @param durationMinutes - 운동 시간 (분)
 * @param exerciseType - 운동 타입
 * @returns 소모 칼로리 (kcal)
 */
export function calculateCaloriesBurned(
  weightKg: number,
  durationMinutes: number,
  exerciseType: ExerciseType
): number {
  if (weightKg <= 0) return 0;
  if (durationMinutes <= 0) return 0;

  const met = MET_VALUES[exerciseType] ?? 4.0;
  const hours = durationMinutes / 60;
  const calories = weightKg * hours * met;

  return Math.round(calories);
}

/**
 * MET 값을 직접 사용하여 칼로리 계산
 *
 * @param weightKg - 체중 (kg)
 * @param durationMinutes - 운동 시간 (분)
 * @param met - MET 값
 * @returns 소모 칼로리 (kcal)
 */
export function calculateCaloriesWithMET(
  weightKg: number,
  durationMinutes: number,
  met: number
): number {
  if (weightKg <= 0) return 0;
  if (durationMinutes <= 0) return 0;
  if (met <= 0) return 0;

  const hours = durationMinutes / 60;
  const calories = weightKg * hours * met;

  return Math.round(calories);
}

/**
 * 상세 칼로리 계산 결과 반환
 *
 * @param weightKg - 체중 (kg)
 * @param durationMinutes - 운동 시간 (분)
 * @param exerciseType - 운동 타입
 * @returns 상세 계산 결과
 */
export function calculateCaloriesDetailed(
  weightKg: number,
  durationMinutes: number,
  exerciseType: ExerciseType
): CalorieResult {
  const met = MET_VALUES[exerciseType] ?? 4.0;
  const calories = calculateCaloriesWithMET(weightKg, durationMinutes, met);

  return {
    calories,
    met,
    durationMinutes,
    weightKg,
  };
}

// ============================================
// 운동 데이터 기반 계산
// ============================================

/**
 * Exercise 객체의 MET 값으로 칼로리 계산
 *
 * @param exercise - 운동 정보 (Exercise 타입)
 * @param weightKg - 체중 (kg)
 * @param durationMinutes - 운동 시간 (분)
 * @returns 소모 칼로리 (kcal)
 */
export function calculateExerciseCalories(
  exercise: Pick<Exercise, 'met' | 'category' | 'difficulty'>,
  weightKg: number,
  durationMinutes: number
): number {
  if (weightKg <= 0) return 0;
  if (durationMinutes <= 0) return 0;

  // Exercise 객체에 MET 값이 있으면 사용
  let met = exercise.met;

  // MET 값이 없거나 0이면 카테고리 기반 기본값 사용
  if (!met || met <= 0) {
    met = CATEGORY_DEFAULT_MET[exercise.category] ?? 4.0;
  }

  // 난이도에 따른 조정
  const multiplier = DIFFICULTY_MET_MULTIPLIER[exercise.difficulty] ?? 1.0;
  const adjustedMET = met * multiplier;

  return calculateCaloriesWithMET(weightKg, durationMinutes, adjustedMET);
}

/**
 * 운동 세션 전체 칼로리 계산
 *
 * @param exercises - 운동 목록 (ID, 이름, 시간, MET 포함)
 * @param weightKg - 체중 (kg)
 * @returns 세션 칼로리 계산 결과
 */
export function calculateSessionCalories(
  exercises: {
    id: string;
    name: string;
    durationMinutes: number;
    met: number;
  }[],
  weightKg: number
): SessionCalorieResult {
  if (weightKg <= 0 || exercises.length === 0) {
    return {
      totalCalories: 0,
      exercises: [],
      totalDurationMinutes: 0,
    };
  }

  let totalCalories = 0;
  let totalDurationMinutes = 0;

  const exerciseResults = exercises.map((ex) => {
    const calories = calculateCaloriesWithMET(weightKg, ex.durationMinutes, ex.met);
    totalCalories += calories;
    totalDurationMinutes += ex.durationMinutes;

    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      calories,
      durationMinutes: ex.durationMinutes,
      met: ex.met,
    };
  });

  return {
    totalCalories,
    exercises: exerciseResults,
    totalDurationMinutes,
  };
}

// ============================================
// 주간/일별 통계
// ============================================

/**
 * 주간 칼로리 소모량 계산
 *
 * @param dailyRecords - 일별 칼로리 기록 { date: calories }
 * @returns 주간 칼로리 요약
 */
export function calculateWeeklyCalories(
  dailyRecords: Record<string, number>
): WeeklyCalorieSummary {
  const days = Object.keys(dailyRecords);
  const activeDays = days.filter((day) => dailyRecords[day] > 0).length;
  const totalCalories = days.reduce((sum, day) => sum + (dailyRecords[day] || 0), 0);
  const dailyAverage = activeDays > 0 ? Math.round(totalCalories / activeDays) : 0;

  return {
    totalCalories,
    dailyAverage,
    activeDays,
    caloriesByDay: { ...dailyRecords },
  };
}

/**
 * 주간 칼로리 목표 달성률 계산
 *
 * @param currentCalories - 현재 소모 칼로리
 * @param targetCalories - 목표 칼로리
 * @returns 달성률 (0-100%)
 */
export function calculateCalorieAchievement(
  currentCalories: number,
  targetCalories: number
): number {
  if (targetCalories <= 0) return 0;
  if (currentCalories <= 0) return 0;

  const percentage = (currentCalories / targetCalories) * 100;
  return Math.min(Math.round(percentage), 100);
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 운동 타입 추론 (카테고리 + 난이도 기반)
 *
 * @param category - 운동 카테고리
 * @param difficulty - 운동 난이도
 * @returns 운동 타입
 */
export function inferExerciseType(
  category: ExerciseCategory,
  difficulty: ExerciseDifficulty
): ExerciseType {
  if (category === 'cardio') {
    switch (difficulty) {
      case 'beginner':
        return 'walking';
      case 'intermediate':
        return 'jogging'; // 스펙 7.2: jogging = 7.0
      case 'advanced':
        return 'running'; // 스펙 7.2: running = 10.0
    }
  }

  // 웨이트/코어/상체/하체 → 웨이트 트레이닝 카테고리
  switch (difficulty) {
    case 'beginner':
      return 'weight_light';
    case 'intermediate':
      return 'weight_moderate';
    case 'advanced':
      return 'weight_vigorous';
  }
}

/**
 * MET 값 조회 (운동 타입)
 *
 * @param exerciseType - 운동 타입
 * @returns MET 값
 */
export function getMETValue(exerciseType: ExerciseType): number {
  return MET_VALUES[exerciseType] ?? 4.0;
}

/**
 * 모든 MET 값 조회
 *
 * @returns MET 값 전체
 */
export function getAllMETValues(): Record<ExerciseType, number> {
  return { ...MET_VALUES };
}

/**
 * 분당 칼로리 소모량 계산
 *
 * @param weightKg - 체중 (kg)
 * @param met - MET 값
 * @returns 분당 칼로리 (kcal/min)
 */
export function calculateCaloriesPerMinute(weightKg: number, met: number): number {
  if (weightKg <= 0 || met <= 0) return 0;

  // 1시간 = 60분이므로 MET 기반 칼로리를 60으로 나눔
  const caloriesPerMinute = (weightKg * met) / 60;

  return Math.round(caloriesPerMinute * 100) / 100; // 소수점 2자리
}

/**
 * 목표 칼로리 소모에 필요한 운동 시간 계산
 *
 * @param targetCalories - 목표 칼로리 (kcal)
 * @param weightKg - 체중 (kg)
 * @param met - MET 값
 * @returns 필요 운동 시간 (분)
 */
export function calculateRequiredDuration(
  targetCalories: number,
  weightKg: number,
  met: number
): number {
  if (targetCalories <= 0 || weightKg <= 0 || met <= 0) return 0;

  // 공식: 칼로리 = 체중 × 시간(시간) × MET
  // 시간(시간) = 칼로리 / (체중 × MET)
  const hours = targetCalories / (weightKg * met);
  const minutes = hours * 60;

  return Math.round(minutes);
}

/**
 * 세트당 칼로리 소모량 계산
 * UI 표시용: "10kcal/세트"
 *
 * @param weightKg - 체중 (kg)
 * @param met - MET 값
 * @param secondsPerSet - 세트당 소요 시간 (초, 기본 45초)
 * @returns 세트당 칼로리 (kcal)
 */
export function calculateCaloriesPerSet(
  weightKg: number,
  met: number,
  secondsPerSet: number = 45
): number {
  if (weightKg <= 0 || met <= 0 || secondsPerSet <= 0) return 0;

  // 공식: 칼로리 = 체중 × 시간(시간) × MET
  const hours = secondsPerSet / 3600;
  const calories = weightKg * hours * met;

  return Math.round(calories);
}

/**
 * 운동 데이터의 caloriesPerMinute를 사용한 세트 칼로리 계산
 *
 * @param caloriesPerMinute - 분당 칼로리 (Exercise.caloriesPerMinute)
 * @param secondsPerSet - 세트당 소요 시간 (초, 기본 45초)
 * @returns 세트당 칼로리 (kcal)
 */
export function calculateCaloriesPerSetFromCPM(
  caloriesPerMinute: number,
  secondsPerSet: number = 45
): number {
  if (caloriesPerMinute <= 0 || secondsPerSet <= 0) return 0;

  const minutes = secondsPerSet / 60;
  const calories = caloriesPerMinute * minutes;

  return Math.round(calories);
}

/**
 * 운동 전체 칼로리 계산 (세트 x 횟수 기반)
 * UI 표시용: "30초 x 3세트 | 🔥 45kcal"
 *
 * @param weightKg - 체중 (kg)
 * @param met - MET 값
 * @param sets - 세트 수
 * @param secondsPerSet - 세트당 소요 시간 (초)
 * @param restSeconds - 세트간 휴식 시간 (초, 기본 60초) - 휴식 중에도 약간의 칼로리 소모
 * @returns 총 칼로리 (kcal)
 */
export function calculateExerciseTotalCalories(
  weightKg: number,
  met: number,
  sets: number,
  secondsPerSet: number,
  restSeconds: number = 60
): number {
  if (weightKg <= 0 || met <= 0 || sets <= 0 || secondsPerSet <= 0) return 0;

  // 운동 시간 칼로리
  const exerciseCalories = calculateCaloriesPerSet(weightKg, met, secondsPerSet) * sets;

  // 휴식 시간 칼로리 (MET 1.5로 계산 - 서있거나 가벼운 움직임)
  const restMET = 1.5;
  const totalRestSeconds = restSeconds * (sets - 1); // 마지막 세트 후 휴식 없음
  const restCalories = calculateCaloriesPerSet(weightKg, restMET, totalRestSeconds);

  return exerciseCalories + restCalories;
}
