/**
 * N-1 W-1 운동 연동 인사이트 로직 (Task 3.8)
 *
 * 스펙 참조: docs/phase2/docs/N-1-feature-spec-template-v1.0.3.md
 * - N-1 ← W-1: 운동 칼로리 반영 (순 칼로리 계산)
 * - N-1 → W-1: 칼로리 초과 시 운동 추천
 * - 운동 전후 식단 추천
 */

// 운동 기록 요약 타입
export interface WorkoutSummary {
  /** 오늘 완료한 운동 수 */
  workoutCount: number;
  /** 총 운동 시간 (분) */
  totalDuration: number;
  /** 총 칼로리 소모 (kcal) */
  totalCaloriesBurned: number;
  /** 마지막 운동 완료 시간 */
  lastWorkoutTime: Date | null;
}

// 칼로리 밸런스 상태
export type CalorieBalanceStatus = 'deficit' | 'balanced' | 'surplus';

// 칼로리 밸런스 인사이트
export interface CalorieBalanceInsight {
  /** 섭취 칼로리 */
  intakeCalories: number;
  /** 소모 칼로리 (운동) */
  burnedCalories: number;
  /** 순 칼로리 (섭취 - 소모) */
  netCalories: number;
  /** 목표 칼로리 */
  targetCalories: number;
  /** 밸런스 상태 */
  status: CalorieBalanceStatus;
  /** 목표 대비 퍼센트 */
  percentage: number;
  /** 메시지 */
  message: string;
}

// 운동 추천 인사이트
export interface WorkoutRecommendation {
  /** 추천 여부 */
  shouldRecommend: boolean;
  /** 추천 이유 */
  reason: 'calorie_surplus' | 'no_workout_today' | 'post_meal' | null;
  /** 추천 메시지 */
  message: string;
  /** 추천 운동 시간 (분) */
  recommendedDuration: number;
  /** 예상 소모 칼로리 */
  estimatedCalories: number;
}

// 운동 연동 인사이트 결과
export interface WorkoutNutritionInsight {
  /** 운동 데이터 존재 여부 */
  hasWorkoutData: boolean;
  /** 오늘의 운동 요약 */
  workoutSummary: WorkoutSummary;
  /** 칼로리 밸런스 인사이트 */
  calorieBalance: CalorieBalanceInsight;
  /** 운동 추천 */
  recommendation: WorkoutRecommendation;
}

// 운동 강도별 칼로리 소모 (분당)
const CALORIES_PER_MINUTE: Record<string, number> = {
  light: 4, // 가벼운 운동 (걷기, 스트레칭)
  moderate: 7, // 중간 강도 (조깅, 자전거)
  intense: 10, // 고강도 (러닝, HIIT)
  strength: 6, // 근력 운동
};

// 기본 칼로리 목표
const DEFAULT_CALORIE_TARGET = 2000;

// 칼로리 밸런스 임계값
const CALORIE_THRESHOLDS = {
  deficit: -200, // 목표보다 200kcal 이상 적음
  surplus: 200, // 목표보다 200kcal 이상 초과
};

/**
 * 칼로리 밸런스 상태 계산
 */
function getCalorieBalanceStatus(
  netCalories: number,
  targetCalories: number
): CalorieBalanceStatus {
  const diff = netCalories - targetCalories;

  if (diff < CALORIE_THRESHOLDS.deficit) {
    return 'deficit';
  }
  if (diff > CALORIE_THRESHOLDS.surplus) {
    return 'surplus';
  }
  return 'balanced';
}

/**
 * 칼로리 밸런스 메시지 생성
 */
function getCalorieBalanceMessage(
  status: CalorieBalanceStatus,
  netCalories: number,
  targetCalories: number,
  burnedCalories: number
): string {
  const diff = Math.abs(netCalories - targetCalories);

  switch (status) {
    case 'deficit':
      return `목표보다 ${diff}kcal 부족해요. 건강한 간식을 추가해보세요!`;
    case 'surplus':
      if (burnedCalories > 0) {
        return `운동으로 ${burnedCalories}kcal를 소모했지만, 아직 ${diff}kcal 초과예요.`;
      }
      return `목표보다 ${diff}kcal 초과했어요. 가벼운 운동을 추천해요!`;
    case 'balanced':
      if (burnedCalories > 0) {
        return `운동으로 ${burnedCalories}kcal를 소모해서 목표 범위 내입니다! 👍`;
      }
      return '목표 범위 내입니다! 잘하고 있어요. 👍';
  }
}

/**
 * 운동 추천 인사이트 생성
 */
function getWorkoutRecommendation(
  intakeCalories: number,
  burnedCalories: number,
  targetCalories: number,
  hasWorkoutToday: boolean
): WorkoutRecommendation {
  const netCalories = intakeCalories - burnedCalories;
  const surplus = netCalories - targetCalories;

  // 칼로리 초과 시 운동 추천
  if (surplus > CALORIE_THRESHOLDS.surplus) {
    const recommendedCalories = surplus;
    const recommendedDuration = Math.ceil(recommendedCalories / CALORIES_PER_MINUTE.moderate);

    return {
      shouldRecommend: true,
      reason: 'calorie_surplus',
      message: `${surplus}kcal 초과! ${recommendedDuration}분 유산소로 균형 맞추기`,
      recommendedDuration,
      estimatedCalories: recommendedCalories,
    };
  }

  // 오늘 운동 안 했을 때
  if (!hasWorkoutToday && intakeCalories > targetCalories * 0.7) {
    return {
      shouldRecommend: true,
      reason: 'no_workout_today',
      message: '오늘 아직 운동 기록이 없어요. 가벼운 운동 어때요?',
      recommendedDuration: 30,
      estimatedCalories: 30 * CALORIES_PER_MINUTE.moderate,
    };
  }

  return {
    shouldRecommend: false,
    reason: null,
    message: '',
    recommendedDuration: 0,
    estimatedCalories: 0,
  };
}

/**
 * 운동 연동 인사이트 생성
 */
export function getWorkoutNutritionInsight(
  workoutSummary: WorkoutSummary | null,
  intakeCalories: number,
  targetCalories: number = DEFAULT_CALORIE_TARGET
): WorkoutNutritionInsight {
  // 운동 데이터 없는 경우
  const defaultSummary: WorkoutSummary = {
    workoutCount: 0,
    totalDuration: 0,
    totalCaloriesBurned: 0,
    lastWorkoutTime: null,
  };

  const summary = workoutSummary || defaultSummary;
  const hasWorkoutData = summary.workoutCount > 0;

  // 칼로리 밸런스 계산
  const netCalories = intakeCalories - summary.totalCaloriesBurned;
  const status = getCalorieBalanceStatus(netCalories, targetCalories);
  const percentage = targetCalories > 0 ? Math.round((netCalories / targetCalories) * 100) : 0;
  const message = getCalorieBalanceMessage(
    status,
    netCalories,
    targetCalories,
    summary.totalCaloriesBurned
  );

  const calorieBalance: CalorieBalanceInsight = {
    intakeCalories,
    burnedCalories: summary.totalCaloriesBurned,
    netCalories,
    targetCalories,
    status,
    percentage,
    message,
  };

  // 운동 추천
  const recommendation = getWorkoutRecommendation(
    intakeCalories,
    summary.totalCaloriesBurned,
    targetCalories,
    hasWorkoutData
  );

  return {
    hasWorkoutData,
    workoutSummary: summary,
    calorieBalance,
    recommendation,
  };
}

/**
 * 운동 기록에서 요약 생성
 */
export function createWorkoutSummary(
  workoutLogs: {
    completed_at: string | null;
    actual_duration: number | null;
    actual_calories: number | null;
  }[]
): WorkoutSummary {
  if (!workoutLogs || workoutLogs.length === 0) {
    return {
      workoutCount: 0,
      totalDuration: 0,
      totalCaloriesBurned: 0,
      lastWorkoutTime: null,
    };
  }

  // 오늘 완료된 운동만 필터링
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayLogs = workoutLogs.filter((log) => {
    if (!log.completed_at) return false;
    const completedDate = new Date(log.completed_at);
    completedDate.setHours(0, 0, 0, 0);
    return completedDate.getTime() === today.getTime();
  });

  const totalDuration = todayLogs.reduce((sum, log) => sum + (log.actual_duration || 0), 0);
  const totalCaloriesBurned = todayLogs.reduce((sum, log) => sum + (log.actual_calories || 0), 0);

  // 마지막 운동 시간
  const lastLog = todayLogs.sort((a, b) => {
    const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
    const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
    return bTime - aTime;
  })[0];

  return {
    workoutCount: todayLogs.length,
    totalDuration,
    totalCaloriesBurned,
    lastWorkoutTime: lastLog?.completed_at ? new Date(lastLog.completed_at) : null,
  };
}

/**
 * 운동 전/후 식단 추천 메시지 생성
 */
export function getWorkoutMealMessage(
  lastWorkoutTime: Date | null,
  isBeforeWorkout: boolean = false
): string {
  if (isBeforeWorkout) {
    return '운동 2시간 전에는 가벼운 탄수화물 위주의 식사를 추천해요!';
  }

  if (lastWorkoutTime) {
    const now = new Date();
    const diffHours = (now.getTime() - lastWorkoutTime.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      return '운동 직후에는 단백질 + 탄수화물 회복식을 섭취해보세요! 💪';
    }
  }

  return '';
}

// 상수 내보내기 (테스트용)
export { CALORIES_PER_MINUTE, DEFAULT_CALORIE_TARGET, CALORIE_THRESHOLDS };
