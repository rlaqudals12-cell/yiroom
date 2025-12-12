/**
 * W-1 주간 플랜 생성 로직 (Task 4.6)
 *
 * 주요 기능:
 * - 운동 빈도에 따른 주간 분할 생성
 * - 부위별 운동 배치
 * - 장소/장비/부상 필터링
 * - 무게/횟수/칼로리 계산
 */

import type {
  Exercise,
  WorkoutType,
  DayPlan,
  WorkoutPlan,
  BodyPart,
  ExerciseCategory,
  WorkoutInputData,
} from '@/types/workout';
import { getAllExercises } from './exercises';
import { getRecommendedRepsAndSets, calculateRecommendedWeight } from './calculations';
import { calculateCaloriesWithMET } from './calorieCalculations';

// ============================================
// 타입 정의
// ============================================

/** 요일 타입 */
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** 하루 운동 포커스 */
export interface DayFocus {
  day: DayOfWeek;
  dayLabel: string;
  isRestDay: boolean;
  bodyParts: BodyPart[];
  categories: ExerciseCategory[];
}

/** 주간 플랜 생성 입력 */
export interface WeeklyPlanInput {
  workoutType: WorkoutType;
  frequency: string;
  concerns: string[];
  location: string;
  equipment: string[];
  injuries: string[];
  userWeight?: number;
}

// ============================================
// 상수 정의
// ============================================

/** 빈도별 주간 분할 템플릿 */
const WEEKLY_SPLIT_TEMPLATES: Record<string, DayFocus[]> = {
  // 주 1-2회: 전신 2일
  '1-2': [
    { day: 'mon', dayLabel: '월요일', isRestDay: false, bodyParts: ['chest', 'back', 'shoulder', 'arm'], categories: ['upper'] },
    { day: 'tue', dayLabel: '화요일', isRestDay: true, bodyParts: [], categories: [] },
    { day: 'wed', dayLabel: '수요일', isRestDay: true, bodyParts: [], categories: [] },
    { day: 'thu', dayLabel: '목요일', isRestDay: false, bodyParts: ['thigh', 'hip', 'calf', 'abs'], categories: ['lower', 'core'] },
    { day: 'fri', dayLabel: '금요일', isRestDay: true, bodyParts: [], categories: [] },
    { day: 'sat', dayLabel: '토요일', isRestDay: true, bodyParts: [], categories: [] },
    { day: 'sun', dayLabel: '일요일', isRestDay: true, bodyParts: [], categories: [] },
  ],
  // 주 3-4회: 상체/하체/전신 분할
  '3-4': [
    { day: 'mon', dayLabel: '월요일', isRestDay: false, bodyParts: ['chest', 'shoulder', 'arm'], categories: ['upper'] },
    { day: 'tue', dayLabel: '화요일', isRestDay: true, bodyParts: [], categories: [] },
    { day: 'wed', dayLabel: '수요일', isRestDay: false, bodyParts: ['thigh', 'hip', 'calf'], categories: ['lower'] },
    { day: 'thu', dayLabel: '목요일', isRestDay: true, bodyParts: [], categories: [] },
    { day: 'fri', dayLabel: '금요일', isRestDay: false, bodyParts: ['abs', 'waist', 'back'], categories: ['core', 'upper'] },
    { day: 'sat', dayLabel: '토요일', isRestDay: false, bodyParts: ['chest', 'back', 'thigh', 'hip', 'abs'], categories: ['cardio'] },
    { day: 'sun', dayLabel: '일요일', isRestDay: true, bodyParts: [], categories: [] },
  ],
  // 주 5-6회: 세분화된 분할
  '5-6': [
    { day: 'mon', dayLabel: '월요일', isRestDay: false, bodyParts: ['chest', 'arm'], categories: ['upper'] },
    { day: 'tue', dayLabel: '화요일', isRestDay: false, bodyParts: ['back', 'arm'], categories: ['upper'] },
    { day: 'wed', dayLabel: '수요일', isRestDay: false, bodyParts: ['thigh', 'calf'], categories: ['lower'] },
    { day: 'thu', dayLabel: '목요일', isRestDay: false, bodyParts: ['shoulder', 'abs'], categories: ['upper', 'core'] },
    { day: 'fri', dayLabel: '금요일', isRestDay: false, bodyParts: ['hip', 'thigh'], categories: ['lower'] },
    { day: 'sat', dayLabel: '토요일', isRestDay: false, bodyParts: ['chest', 'back', 'abs'], categories: ['cardio', 'core'] },
    { day: 'sun', dayLabel: '일요일', isRestDay: true, bodyParts: [], categories: [] },
  ],
  // 매일
  daily: [
    { day: 'mon', dayLabel: '월요일', isRestDay: false, bodyParts: ['chest', 'arm'], categories: ['upper'] },
    { day: 'tue', dayLabel: '화요일', isRestDay: false, bodyParts: ['back', 'arm'], categories: ['upper'] },
    { day: 'wed', dayLabel: '수요일', isRestDay: false, bodyParts: ['thigh', 'calf'], categories: ['lower'] },
    { day: 'thu', dayLabel: '목요일', isRestDay: false, bodyParts: ['shoulder', 'abs'], categories: ['upper', 'core'] },
    { day: 'fri', dayLabel: '금요일', isRestDay: false, bodyParts: ['hip', 'thigh'], categories: ['lower'] },
    { day: 'sat', dayLabel: '토요일', isRestDay: false, bodyParts: ['chest', 'back', 'thigh'], categories: ['cardio'] },
    { day: 'sun', dayLabel: '일요일', isRestDay: false, bodyParts: ['abs', 'waist'], categories: ['core'] },
  ],
};

/** 운동 타입별 카테고리 우선순위 */
const WORKOUT_TYPE_CATEGORY_PRIORITY: Record<WorkoutType, ExerciseCategory[]> = {
  toner: ['upper', 'lower', 'core', 'cardio'],
  builder: ['upper', 'lower', 'core', 'cardio'],
  burner: ['cardio', 'lower', 'core', 'upper'],
  mover: ['cardio', 'lower', 'upper', 'core'],
  flexer: ['core', 'lower', 'upper', 'cardio'],
};

/** 신체 고민 → 부위 매핑 */
const CONCERN_TO_BODY_PARTS: Record<string, BodyPart[]> = {
  belly: ['abs', 'waist'],
  thigh: ['thigh'],
  arm: ['arm'],
  back: ['back'],
  hip: ['hip'],
  calf: ['calf'],
  shoulder: ['shoulder'],
  overall: ['chest', 'back', 'abs', 'thigh', 'hip'],
};

/** 장소별 장비 필터 */
const LOCATION_EQUIPMENT_FILTER: Record<string, string[]> = {
  home: ['bodyweight', 'dumbbell', 'band', 'mat', 'kettlebell'],
  gym: ['bodyweight', 'dumbbell', 'barbell', 'machine', 'cable', 'cardio_machine', 'pull_up_bar', 'kettlebell'],
  outdoor: ['bodyweight'],
};

// ============================================
// 핵심 함수
// ============================================

/**
 * 주간 분할 템플릿 가져오기
 */
export function getWeeklySplitTemplate(frequency: string): DayFocus[] {
  return WEEKLY_SPLIT_TEMPLATES[frequency] || WEEKLY_SPLIT_TEMPLATES['3-4'];
}

/**
 * 운동 필터링 (장소, 장비, 부상)
 */
export function filterExercises(
  exercises: Exercise[],
  location: string,
  equipment: string[],
  injuries: string[]
): Exercise[] {
  // 사용자 장비가 비어있으면 장소 기반 기본 장비 사용
  const userEquipment = equipment.length > 0
    ? equipment
    : LOCATION_EQUIPMENT_FILTER[location] || ['bodyweight'];

  return exercises.filter((ex) => {
    // 장비 필터: 운동에 필요한 장비가 사용자가 가진 장비에 포함되어야 함
    // 장비가 필요 없는 운동(equipment: [])은 항상 포함
    const hasEquipment = ex.equipment.length === 0 ||
      ex.equipment.some((eq) => userEquipment.includes(eq));

    if (!hasEquipment) return false;

    // 부상 필터: 해당 부상이 있으면 제외
    if (injuries.length > 0 && ex.suitableFor?.injuries) {
      const hasConflictingInjury = injuries.some((injury) =>
        ex.suitableFor.injuries?.includes(injury)
      );
      if (hasConflictingInjury) return false;
    }

    return true;
  });
}

/**
 * 부위에 맞는 운동 선택
 */
export function selectExercisesForBodyParts(
  allExercises: Exercise[],
  bodyParts: BodyPart[],
  categories: ExerciseCategory[],
  workoutType: WorkoutType,
  count: number = 5
): Exercise[] {
  // 점수 계산
  const scored = allExercises.map((ex) => {
    let score = 0;

    // 부위 매칭 점수
    const matchingParts = ex.bodyParts.filter((p) => bodyParts.includes(p));
    score += matchingParts.length * 10;

    // 카테고리 매칭 점수
    if (categories.includes(ex.category)) {
      score += 8;
    }

    // 운동 타입별 카테고리 우선순위 점수
    const typePriority = WORKOUT_TYPE_CATEGORY_PRIORITY[workoutType];
    const priorityIndex = typePriority.indexOf(ex.category);
    if (priorityIndex >= 0) {
      score += (typePriority.length - priorityIndex) * 3;
    }

    // 난이도 점수 (초급 우선)
    if (ex.difficulty === 'beginner') score += 2;
    if (ex.difficulty === 'intermediate') score += 1;

    return { exercise: ex, score };
  });

  // 점수순 정렬 후 상위 N개 반환
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ exercise }) => exercise);
}

/**
 * 운동 세부 정보 계산 (세트/횟수/칼로리)
 */
export function calculateExerciseDetails(
  exercise: Exercise,
  workoutType: WorkoutType,
  userWeight: number = 60
): {
  sets: number;
  reps: number;
  restSeconds: number;
  estimatedCalories: number;
  estimatedMinutes: number;
  weight?: number;
} {
  // 목표 매핑
  const goalMap: Record<WorkoutType, string> = {
    toner: 'toning',
    builder: 'strength',
    burner: 'endurance',
    mover: 'endurance',
    flexer: 'toning',
  };

  const goal = goalMap[workoutType];
  const recommendation = getRecommendedRepsAndSets(goal, exercise.difficulty);

  // 운동 시간 계산 (세트당 1분 + 휴식 시간)
  const setDuration = 1; // 분
  const restDuration = recommendation.restSeconds / 60;
  const totalMinutes = recommendation.sets * (setDuration + restDuration);

  // 칼로리 계산
  const estimatedCalories = calculateCaloriesWithMET(
    userWeight,
    Math.round(totalMinutes),
    exercise.met
  );

  // 무게 추천 (웨이트 운동인 경우)
  let weight: number | undefined;
  if (exercise.equipment.some((eq) => ['dumbbell', 'barbell', 'kettlebell', 'machine'].includes(eq))) {
    const weightRec = calculateRecommendedWeight(userWeight, exercise.category, exercise.difficulty, goal);
    weight = weightRec.recommendedWeight;
  }

  return {
    sets: recommendation.sets,
    reps: recommendation.reps,
    restSeconds: recommendation.restSeconds,
    estimatedCalories: Math.round(estimatedCalories),
    estimatedMinutes: Math.round(totalMinutes),
    weight,
  };
}

/**
 * 하루 운동 계획 생성
 */
export function generateDayPlan(
  dayFocus: DayFocus,
  allExercises: Exercise[],
  input: WeeklyPlanInput
): DayPlan {
  // 휴식일 처리
  if (dayFocus.isRestDay) {
    return {
      day: dayFocus.day,
      dayLabel: dayFocus.dayLabel,
      isRestDay: true,
      focus: [],
      categories: [],
      exercises: [],
      estimatedMinutes: 0,
      estimatedCalories: 0,
    };
  }

  // 필터링된 운동 목록
  const filteredExercises = filterExercises(
    allExercises,
    input.location,
    input.equipment,
    input.injuries
  );

  // 고민 부위 추가
  const concernBodyParts = input.concerns.flatMap((c) => CONCERN_TO_BODY_PARTS[c] || []);
  const allBodyParts = [...new Set([...dayFocus.bodyParts, ...concernBodyParts])];

  // 운동 선택
  const selectedExercises = selectExercisesForBodyParts(
    filteredExercises,
    allBodyParts as BodyPart[],
    dayFocus.categories,
    input.workoutType,
    5
  );

  // 운동별 세부 정보 계산
  let totalMinutes = 0;
  let totalCalories = 0;

  const exercisesWithDetails = selectedExercises.map((ex) => {
    const details = calculateExerciseDetails(ex, input.workoutType, input.userWeight);
    totalMinutes += details.estimatedMinutes;
    totalCalories += details.estimatedCalories;
    return ex;
  });

  return {
    day: dayFocus.day,
    dayLabel: dayFocus.dayLabel,
    isRestDay: false,
    focus: dayFocus.bodyParts,
    categories: dayFocus.categories,
    exercises: exercisesWithDetails,
    estimatedMinutes: Math.round(totalMinutes),
    estimatedCalories: Math.round(totalCalories),
  };
}

/**
 * 주간 운동 플랜 생성
 */
export function generateWeeklyPlan(input: WeeklyPlanInput): DayPlan[] {
  const allExercises = getAllExercises();
  const template = getWeeklySplitTemplate(input.frequency);

  return template.map((dayFocus) => generateDayPlan(dayFocus, allExercises, input));
}

/**
 * WorkoutInputData에서 주간 플랜 생성
 */
export function createWeeklyPlanFromInput(
  inputData: WorkoutInputData,
  workoutType: WorkoutType
): WorkoutPlan {
  // 체중 데이터: bodyTypeData에서 가져오거나 기본값 60kg 사용
  const userWeight = inputData.bodyTypeData?.weight || 60;

  const input: WeeklyPlanInput = {
    workoutType,
    frequency: inputData.frequency,
    concerns: inputData.concerns,
    location: inputData.location,
    equipment: inputData.equipment,
    injuries: inputData.injuries,
    userWeight,
  };

  const days = generateWeeklyPlan(input);

  // 총계 계산
  const totalMinutes = days.reduce((sum, d) => sum + d.estimatedMinutes, 0);
  const totalCalories = days.reduce((sum, d) => sum + d.estimatedCalories, 0);

  // 현재 주 월요일 날짜 계산
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  return {
    id: `plan-${Date.now()}`,
    userId: '', // 실제 사용 시 설정
    weekStartDate: monday.toISOString().split('T')[0],
    workoutType,
    frequency: inputData.frequency,
    days,
    totalMinutes,
    totalCalories,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 운동일 수 계산
 */
export function countWorkoutDays(days: DayPlan[]): number {
  return days.filter((d) => !d.isRestDay).length;
}

/**
 * 부위 분포 계산
 */
export function calculateBodyPartDistribution(days: DayPlan[]): Record<string, number> {
  const distribution: Record<string, number> = {
    upper: 0,
    lower: 0,
    core: 0,
    cardio: 0,
  };

  let totalExercises = 0;

  days.forEach((day) => {
    if (day.isRestDay) return;

    day.exercises.forEach((ex) => {
      distribution[ex.category] = (distribution[ex.category] || 0) + 1;
      totalExercises++;
    });
  });

  // 비율로 변환
  if (totalExercises > 0) {
    Object.keys(distribution).forEach((key) => {
      distribution[key] = Math.round((distribution[key] / totalExercises) * 100) / 100;
    });
  }

  return distribution;
}

/**
 * 주간 플랜 요약 생성
 */
export function generatePlanSummary(plan: WorkoutPlan): {
  workoutDays: number;
  restDays: number;
  totalMinutes: number;
  totalCalories: number;
  bodyPartDistribution: Record<string, number>;
  avgMinutesPerDay: number;
  avgCaloriesPerDay: number;
} {
  const workoutDays = countWorkoutDays(plan.days);
  const restDays = 7 - workoutDays;
  const distribution = calculateBodyPartDistribution(plan.days);

  return {
    workoutDays,
    restDays,
    totalMinutes: plan.totalMinutes,
    totalCalories: plan.totalCalories,
    bodyPartDistribution: distribution,
    avgMinutesPerDay: workoutDays > 0 ? Math.round(plan.totalMinutes / workoutDays) : 0,
    avgCaloriesPerDay: workoutDays > 0 ? Math.round(plan.totalCalories / workoutDays) : 0,
  };
}
