/**
 * 웰니스 모듈 타입 정의
 *
 * @module lib/wellness/types
 */

/** 웰니스 데이터 입력 (Supabase 조회 결과용) */
export interface WellnessDataInput {
  userId: string;

  // 운동 데이터 (최근 7일)
  workoutSessions: {
    date: string;
    durationMinutes: number;
    caloriesBurned: number;
  }[];

  // 영양 데이터 (최근 7일)
  mealRecords: {
    date: string;
    totalCalories: number;
    targetCalories: number;
    macroBalance: number;
  }[];

  // 수분 섭취
  waterIntake: {
    date: string;
    amountMl: number;
    targetMl: number;
  }[];

  // 분석 점수 (최신)
  skinScore: number | null;
  bodyScore: number | null;
  postureScore: number | null;

  // 루틴 데이터
  skinRoutineDays: number; // 최근 7일 중 루틴 수행한 날
  currentStreak: number;
}

/** 웰니스 히스토리 레코드 */
export interface WellnessHistoryRecord {
  date: string;
  total: number;
  workout: number;
  nutrition: number;
  skin: number;
  body: number;
  grade: string;
}

/** 웰니스 목표 */
export interface WellnessGoal {
  area: 'workout' | 'nutrition' | 'skin' | 'body';
  targetScore: number;
  currentScore: number;
  message: string;
}

/** 주간 웰니스 요약 */
export interface WeeklyWellnessSummary {
  weekStart: string;
  weekEnd: string;
  averageScore: number;
  bestDay: { date: string; score: number };
  worstDay: { date: string; score: number };
  trend: 'up' | 'down' | 'stable';
  improvements: string[];
}
