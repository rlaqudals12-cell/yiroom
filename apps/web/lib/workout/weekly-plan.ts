/**
 * W-1 주간 플랜 AI 자동 생성 로직
 *
 * 원리 문서: docs/principles/exercise-physiology.md
 * - 운동 목표별 주간 빈도 가이드라인
 * - Progressive Overload 자동 적용
 * - 4주 주기 디로드
 *
 * 주요 기능:
 * - generateWeeklyPlan(): 목표 기반 주간 플랜 생성
 * - getWorkoutTemplate(): 운동 목표별 템플릿 조회
 * - adjustPlanForTime(): 시간 제약에 맞춘 플랜 조정
 */

import type { Exercise, WorkoutType, ExerciseCategory, BodyPart } from '@/types/workout';
import { getAllExercises } from './exercises';
import { getRecommendedRepsAndSets, calculateRecommendedWeight, roundToNearest } from './calculations';
import { calculateCaloriesWithMET } from './calorieCalculations';

// ============================================
// 타입 정의
// ============================================

/**
 * 피트니스 목표 타입 (exercise-physiology.md 기준)
 */
export type FitnessGoal = 'hypertrophy' | 'strength' | 'weight_loss' | 'endurance';

/**
 * 계획된 운동 (개별 운동 세부 정보)
 */
export interface PlannedExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number | string; // "8-12" 범위 허용
  restSeconds: number;
  weight?: number; // kg, 웨이트 운동 시
  notes?: string;
}

/**
 * 일일 플랜
 */
export interface DayPlan {
  dayOfWeek: number; // 0=일요일, 1=월요일, ..., 6=토요일
  dayLabel: string;
  isRestDay: boolean;
  workoutType: WorkoutType;
  exercises: PlannedExercise[];
  estimatedDuration: number; // 분
  targetCalories: number;
  focus?: string; // 집중 부위/목적 설명
}

/**
 * 주간 플랜
 */
export interface WeeklyPlan {
  days: DayPlan[];
  totalVolume: number; // 주간 총 볼륨 (세트 x 무게 x 반복)
  restDays: number[]; // 휴식일 (0=일요일)
  progressionRate: number; // 주간 증가율 (%)
  weekNumber?: number; // 현재 주차 (디로드 계산용)
  isDeloadWeek?: boolean; // 디로드 주간 여부
}

/**
 * 운동 템플릿 (목표별)
 */
export interface WorkoutTemplate {
  goal: FitnessGoal;
  name: string;
  description: string;
  weeklyFrequency: { min: number; max: number };
  sessionDuration: { min: number; max: number }; // 분
  splitType: 'full_body' | 'upper_lower' | 'push_pull_legs' | 'body_part';
  repRange: [number, number];
  setsRange: [number, number];
  restSeconds: number;
  progressionRate: number; // 주당 볼륨 증가율 %
  intensity: { min: number; max: number }; // %HRmax 또는 RPE
}

/**
 * 주간 플랜 생성 파라미터
 */
export interface WeeklyPlanParams {
  goal: FitnessGoal;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  weeklyFrequency: number; // 주간 운동 횟수
  maxMinutesPerDay?: number; // 일일 최대 운동 시간
  userWeight?: number; // kg
  equipment?: string[];
  injuries?: string[];
  weekNumber?: number; // 현재 훈련 주차 (디로드 판단용)
  preferredDays?: number[]; // 선호 운동일 (0-6)
}

// ============================================
// 상수 정의 (exercise-physiology.md 기반)
// ============================================

/**
 * 목표별 운동 템플릿 (exercise-physiology.md GOAL_PROTOCOLS 기반)
 */
export const WORKOUT_TEMPLATES: Record<FitnessGoal, WorkoutTemplate> = {
  hypertrophy: {
    goal: 'hypertrophy',
    name: '근비대',
    description: '근육 성장 및 벌크업 목표',
    weeklyFrequency: { min: 4, max: 5 },
    sessionDuration: { min: 45, max: 60 },
    splitType: 'push_pull_legs',
    repRange: [8, 12],
    setsRange: [3, 5],
    restSeconds: 90,
    progressionRate: 10,
    intensity: { min: 70, max: 85 },
  },
  strength: {
    goal: 'strength',
    name: '근력',
    description: '최대 근력 향상 목표',
    weeklyFrequency: { min: 3, max: 4 },
    sessionDuration: { min: 45, max: 60 },
    splitType: 'upper_lower',
    repRange: [3, 6],
    setsRange: [4, 6],
    restSeconds: 180,
    progressionRate: 5,
    intensity: { min: 80, max: 95 },
  },
  weight_loss: {
    goal: 'weight_loss',
    name: '체중감량',
    description: '지방 연소 및 체중 감량 목표',
    weeklyFrequency: { min: 4, max: 5 },
    sessionDuration: { min: 45, max: 60 },
    splitType: 'full_body',
    repRange: [12, 20],
    setsRange: [3, 4],
    restSeconds: 30,
    progressionRate: 5,
    intensity: { min: 60, max: 80 },
  },
  endurance: {
    goal: 'endurance',
    name: '지구력',
    description: '심폐 지구력 및 근지구력 향상 목표',
    weeklyFrequency: { min: 3, max: 5 },
    sessionDuration: { min: 30, max: 90 },
    splitType: 'full_body',
    repRange: [15, 25],
    setsRange: [2, 3],
    restSeconds: 45,
    progressionRate: 10,
    intensity: { min: 65, max: 80 },
  },
};

/**
 * 목표별 주간 스케줄 템플릿 (exercise-physiology.md 기반)
 */
const WEEKLY_SCHEDULE_TEMPLATES: Record<FitnessGoal, Record<number, number[]>> = {
  // 근비대: Push/Pull/Legs 분할
  hypertrophy: {
    3: [1, 3, 5], // 월, 수, 금
    4: [1, 2, 4, 5], // 월, 화, 목, 금
    5: [1, 2, 3, 5, 6], // 월, 화, 수, 금, 토
  },
  // 근력: Upper/Lower 분할
  strength: {
    3: [1, 3, 5], // 월, 수, 금
    4: [1, 2, 4, 5], // 월, 화, 목, 금
  },
  // 체중감량: 전신 + 유산소
  weight_loss: {
    3: [1, 3, 5], // 월, 수, 금
    4: [1, 2, 4, 5], // 월, 화, 목, 금
    5: [1, 2, 3, 5, 6], // 월, 화, 수, 금, 토
  },
  // 지구력: 장거리 + 템포 + 회복
  endurance: {
    3: [1, 3, 6], // 월, 수, 토
    4: [1, 3, 5, 6], // 월, 수, 금, 토
    5: [1, 2, 4, 5, 6], // 월, 화, 목, 금, 토
  },
};

/**
 * 분할 타입별 일별 집중 부위
 */
const SPLIT_FOCUS: Record<string, Record<number, { bodyParts: BodyPart[]; categories: ExerciseCategory[]; label: string }>> = {
  push_pull_legs: {
    0: { bodyParts: ['chest', 'shoulder', 'arm'], categories: ['upper'], label: 'Push (가슴/어깨/삼두)' },
    1: { bodyParts: ['back', 'arm'], categories: ['upper'], label: 'Pull (등/이두)' },
    2: { bodyParts: ['thigh', 'hip', 'calf'], categories: ['lower'], label: 'Legs (하체)' },
  },
  upper_lower: {
    0: { bodyParts: ['chest', 'back', 'shoulder', 'arm'], categories: ['upper'], label: '상체' },
    1: { bodyParts: ['thigh', 'hip', 'calf', 'abs'], categories: ['lower', 'core'], label: '하체/코어' },
  },
  full_body: {
    0: { bodyParts: ['chest', 'back', 'shoulder', 'thigh', 'hip', 'abs'], categories: ['upper', 'lower', 'core'], label: '전신' },
  },
  body_part: {
    0: { bodyParts: ['chest'], categories: ['upper'], label: '가슴' },
    1: { bodyParts: ['back'], categories: ['upper'], label: '등' },
    2: { bodyParts: ['shoulder'], categories: ['upper'], label: '어깨' },
    3: { bodyParts: ['arm'], categories: ['upper'], label: '팔' },
    4: { bodyParts: ['thigh', 'hip'], categories: ['lower'], label: '하체' },
    5: { bodyParts: ['abs', 'waist'], categories: ['core'], label: '코어' },
  },
};

/**
 * 요일 레이블 (한국어)
 */
const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/**
 * FitnessGoal → WorkoutType 매핑
 */
const GOAL_TO_WORKOUT_TYPE: Record<FitnessGoal, WorkoutType> = {
  hypertrophy: 'builder',
  strength: 'builder',
  weight_loss: 'burner',
  endurance: 'mover',
};

// ============================================
// 핵심 함수
// ============================================

/**
 * 운동 목표별 템플릿 조회
 *
 * @param goal - 피트니스 목표
 * @returns 운동 템플릿
 */
export function getWorkoutTemplate(goal: FitnessGoal): WorkoutTemplate {
  return WORKOUT_TEMPLATES[goal];
}

/**
 * 주간 플랜 생성 (규칙 기반)
 *
 * exercise-physiology.md 원리 적용:
 * - 목표별 세트/반복/휴식 파라미터
 * - Progressive Overload (5-10% 주간 증가)
 * - 4주 주기 디로드
 *
 * @param params - 주간 플랜 생성 파라미터
 * @returns 주간 플랜
 */
export function generateWeeklyPlan(params: WeeklyPlanParams): WeeklyPlan {
  const {
    goal,
    fitnessLevel,
    weeklyFrequency,
    maxMinutesPerDay,
    userWeight = 60,
    equipment = ['bodyweight'],
    injuries = [],
    weekNumber = 1,
    preferredDays,
  } = params;

  const template = WORKOUT_TEMPLATES[goal];
  const workoutType = GOAL_TO_WORKOUT_TYPE[goal];

  // 디로드 주간 확인 (4주 주기)
  const isDeloadWeek = weekNumber > 0 && weekNumber % 4 === 0;

  // 실제 운동 주파수 결정 (템플릿 범위 내)
  const actualFrequency = Math.min(
    Math.max(weeklyFrequency, template.weeklyFrequency.min),
    template.weeklyFrequency.max
  );

  // 운동일 결정
  const workoutDays = preferredDays && preferredDays.length >= actualFrequency
    ? preferredDays.slice(0, actualFrequency)
    : WEEKLY_SCHEDULE_TEMPLATES[goal][actualFrequency] || [1, 3, 5];

  // 휴식일 계산 (0-6)
  const restDays = [0, 1, 2, 3, 4, 5, 6].filter(d => !workoutDays.includes(d));

  // 운동 목록 가져오기 및 필터링
  const allExercises = getAllExercises();
  const filteredExercises = filterExercisesByEquipmentAndInjuries(allExercises, equipment, injuries);

  // 7일 플랜 생성
  const days: DayPlan[] = [];
  let totalVolume = 0;
  let workoutDayIndex = 0;

  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const isRestDay = !workoutDays.includes(dayOfWeek);

    if (isRestDay) {
      // 휴식일
      days.push({
        dayOfWeek,
        dayLabel: DAY_LABELS[dayOfWeek],
        isRestDay: true,
        workoutType,
        exercises: [],
        estimatedDuration: 0,
        targetCalories: 0,
        focus: '휴식',
      });
    } else {
      // 운동일
      const dayPlan = generateDayPlan(
        dayOfWeek,
        workoutDayIndex,
        template,
        workoutType,
        filteredExercises,
        fitnessLevel,
        userWeight,
        isDeloadWeek,
        maxMinutesPerDay
      );

      // 볼륨 계산 (디로드 시 50%)
      const dayVolume = calculateDayVolume(dayPlan.exercises, userWeight);
      totalVolume += isDeloadWeek ? dayVolume * 0.5 : dayVolume;

      days.push(dayPlan);
      workoutDayIndex++;
    }
  }

  return {
    days,
    totalVolume: Math.round(totalVolume),
    restDays,
    progressionRate: isDeloadWeek ? -50 : template.progressionRate,
    weekNumber,
    isDeloadWeek,
  };
}

/**
 * 가용 시간에 맞춘 플랜 조정
 *
 * @param plan - 기존 주간 플랜
 * @param maxMinutesPerDay - 일일 최대 운동 시간 (분)
 * @returns 조정된 주간 플랜
 */
export function adjustPlanForTime(plan: WeeklyPlan, maxMinutesPerDay: number): WeeklyPlan {
  const adjustedDays = plan.days.map(day => {
    if (day.isRestDay || day.estimatedDuration <= maxMinutesPerDay) {
      return day;
    }

    // 시간 초과 시 운동 수 또는 세트 수 줄이기
    const ratio = maxMinutesPerDay / day.estimatedDuration;
    let adjustedExercises: typeof day.exercises;

    if (ratio < 0.5) {
      // 50% 미만이면 운동 수 줄이기
      const keepCount = Math.max(3, Math.floor(day.exercises.length * ratio));
      adjustedExercises = day.exercises.slice(0, keepCount);
    } else {
      // 50% 이상이면 세트 수 줄이기
      adjustedExercises = day.exercises.map(ex => ({
        ...ex,
        sets: Math.max(2, Math.floor(ex.sets * ratio)),
      }));
    }

    const newDuration = estimateExercisesDuration(adjustedExercises);
    const newCalories = Math.round(day.targetCalories * (newDuration / day.estimatedDuration));

    return {
      ...day,
      exercises: adjustedExercises,
      estimatedDuration: newDuration,
      targetCalories: newCalories,
    };
  });

  // 총 볼륨 재계산
  const newTotalVolume = adjustedDays.reduce((sum, day) => {
    if (day.isRestDay) return sum;
    return sum + calculateDayVolume(day.exercises, 60);
  }, 0);

  return {
    ...plan,
    days: adjustedDays,
    totalVolume: Math.round(newTotalVolume),
  };
}

// ============================================
// 내부 헬퍼 함수
// ============================================

/**
 * 장비 및 부상 기반 운동 필터링
 */
function filterExercisesByEquipmentAndInjuries(
  exercises: Exercise[],
  equipment: string[],
  injuries: string[]
): Exercise[] {
  return exercises.filter(ex => {
    // 장비 필터: 맨몸 또는 보유 장비로 가능한 운동
    const hasEquipment = ex.equipment.length === 0 ||
      ex.equipment.some(eq => equipment.includes(eq) || eq === 'bodyweight');

    if (!hasEquipment) return false;

    // 부상 필터: 부상 부위 운동 제외
    if (injuries.length > 0 && ex.suitableFor?.injuries) {
      const hasConflict = injuries.some(injury => ex.suitableFor.injuries?.includes(injury));
      if (hasConflict) return false;
    }

    return true;
  });
}

/**
 * 일일 플랜 생성
 */
function generateDayPlan(
  dayOfWeek: number,
  workoutDayIndex: number,
  template: WorkoutTemplate,
  workoutType: WorkoutType,
  allExercises: Exercise[],
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
  userWeight: number,
  isDeloadWeek: boolean,
  maxMinutesPerDay?: number
): DayPlan {
  // 분할 타입에 따른 오늘의 집중 부위 결정
  const splitFocus = SPLIT_FOCUS[template.splitType];
  const focusIndex = workoutDayIndex % Object.keys(splitFocus).length;
  const todayFocus = splitFocus[focusIndex];

  // 해당 부위 운동 선택
  const selectedExercises = selectExercisesForFocus(
    allExercises,
    todayFocus.bodyParts,
    todayFocus.categories,
    workoutType,
    5 // 기본 5개 운동
  );

  // 운동별 세부 정보 계산
  const plannedExercises: PlannedExercise[] = selectedExercises.map(ex => {
    const recommendation = getRecommendedRepsAndSets(
      template.goal === 'hypertrophy' ? 'hypertrophy' :
        template.goal === 'strength' ? 'strength' : 'endurance',
      fitnessLevel
    );

    // 반복 횟수 범위 문자열 생성
    const [minReps, maxReps] = template.repRange;
    const reps = minReps === maxReps ? minReps : `${minReps}-${maxReps}`;

    // 세트 수 (디로드 시 50%)
    const baseSets = recommendation.sets;
    const sets = isDeloadWeek ? Math.max(2, Math.floor(baseSets * 0.5)) : baseSets;

    // 무게 추천 (웨이트 운동인 경우)
    let weight: number | undefined;
    if (ex.equipment.some(eq => ['dumbbell', 'barbell', 'kettlebell', 'machine'].includes(eq))) {
      const weightRec = calculateRecommendedWeight(userWeight, ex.category, fitnessLevel, template.goal);
      weight = isDeloadWeek ? roundToNearest(weightRec.recommendedWeight * 0.6, 2.5) : weightRec.recommendedWeight;
    }

    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets,
      reps,
      restSeconds: template.restSeconds,
      weight,
      notes: isDeloadWeek ? '디로드 주간: 강도 낮춰서 진행' : undefined,
    };
  });

  // 예상 시간 계산
  let estimatedDuration = estimateExercisesDuration(plannedExercises);

  // 최대 시간 제한 적용
  if (maxMinutesPerDay && estimatedDuration > maxMinutesPerDay) {
    // 운동 수 줄이기
    const keepCount = Math.max(3, Math.floor(plannedExercises.length * (maxMinutesPerDay / estimatedDuration)));
    plannedExercises.splice(keepCount);
    estimatedDuration = estimateExercisesDuration(plannedExercises);
  }

  // 목표 칼로리 계산
  const avgMET = selectedExercises.reduce((sum, ex) => sum + ex.met, 0) / selectedExercises.length || 5;
  const targetCalories = calculateCaloriesWithMET(userWeight, estimatedDuration, avgMET);

  return {
    dayOfWeek,
    dayLabel: DAY_LABELS[dayOfWeek],
    isRestDay: false,
    workoutType,
    exercises: plannedExercises,
    estimatedDuration,
    targetCalories: Math.round(targetCalories),
    focus: todayFocus.label,
  };
}

/**
 * 집중 부위에 맞는 운동 선택
 */
function selectExercisesForFocus(
  allExercises: Exercise[],
  bodyParts: BodyPart[],
  categories: ExerciseCategory[],
  workoutType: WorkoutType,
  count: number
): Exercise[] {
  // 점수 기반 정렬
  const scored = allExercises.map(ex => {
    let score = 0;

    // 부위 매칭 점수
    const matchingParts = ex.bodyParts.filter(p => bodyParts.includes(p));
    score += matchingParts.length * 10;

    // 카테고리 매칭 점수
    if (categories.includes(ex.category)) {
      score += 8;
    }

    // 난이도 점수 (초급 우선)
    if (ex.difficulty === 'beginner') score += 3;
    if (ex.difficulty === 'intermediate') score += 2;

    return { exercise: ex, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ exercise }) => exercise);
}

/**
 * 운동 목록의 예상 소요 시간 계산
 */
function estimateExercisesDuration(exercises: PlannedExercise[]): number {
  return exercises.reduce((total, ex) => {
    const sets = ex.sets;
    const setDuration = 1; // 세트당 1분
    const restDuration = ex.restSeconds / 60;
    return total + sets * (setDuration + restDuration);
  }, 0);
}

/**
 * 일일 볼륨 계산 (세트 x 반복 x 무게)
 */
function calculateDayVolume(exercises: PlannedExercise[], defaultWeight: number): number {
  return exercises.reduce((total, ex) => {
    const sets = ex.sets;
    // 반복 횟수가 범위인 경우 평균 사용
    const reps = typeof ex.reps === 'string'
      ? parseInt(ex.reps.split('-')[0]) || 10
      : ex.reps;
    const weight = ex.weight || defaultWeight * 0.3; // 무게 없으면 체중의 30% 가정

    return total + (sets * reps * weight);
  }, 0);
}

// ============================================
// Progressive Overload 관련 함수
// ============================================

/**
 * 다음 주 플랜 생성 (Progressive Overload 적용)
 *
 * @param currentPlan - 현재 주간 플랜
 * @param params - 플랜 파라미터
 * @returns 다음 주 플랜
 */
export function generateNextWeekPlan(
  currentPlan: WeeklyPlan,
  params: WeeklyPlanParams
): WeeklyPlan {
  const nextWeekNumber = (currentPlan.weekNumber || 1) + 1;

  return generateWeeklyPlan({
    ...params,
    weekNumber: nextWeekNumber,
  });
}

/**
 * 주간 볼륨 증가량 계산
 *
 * @param currentVolume - 현재 볼륨
 * @param progressionRate - 증가율 (%)
 * @returns 목표 볼륨
 */
export function calculateTargetVolume(currentVolume: number, progressionRate: number): number {
  const increase = currentVolume * (progressionRate / 100);
  return Math.round(currentVolume + increase);
}

/**
 * 디로드 필요 여부 확인
 *
 * @param weekNumber - 현재 훈련 주차
 * @param deloadCycle - 디로드 주기 (기본 4주)
 * @returns 디로드 필요 여부
 */
export function isDeloadNeeded(weekNumber: number, deloadCycle: number = 4): boolean {
  return weekNumber > 0 && weekNumber % deloadCycle === 0;
}
