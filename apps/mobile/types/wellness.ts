// ============================================================
// 웰니스 스코어 타입 정의
// Phase H Sprint 2
// ============================================================

// 영역별 점수 상세
export interface WorkoutScoreBreakdown {
  streak: number; // 0-10: 스트릭 유지
  frequency: number; // 0-10: 운동 빈도
  goal: number; // 0-5: 목표 달성률
}

export interface NutritionScoreBreakdown {
  calorie: number; // 0-10: 칼로리 목표 달성
  balance: number; // 0-10: 영양소 균형
  water: number; // 0-5: 수분 섭취
}

export interface SkinScoreBreakdown {
  analysis: number; // 0-10: 분석 완료
  routine: number; // 0-10: 루틴 준수
  matching: number; // 0-5: 제품 매칭도
}

export interface BodyScoreBreakdown {
  analysis: number; // 0-10: 분석 완료
  progress: number; // 0-10: 목표 진행률
  workout: number; // 0-5: 운동 연동
}

export interface ScoreBreakdown {
  workout: WorkoutScoreBreakdown;
  nutrition: NutritionScoreBreakdown;
  skin: SkinScoreBreakdown;
  body: BodyScoreBreakdown;
}

// 인사이트 타입
export type WellnessInsightType = 'improvement' | 'achievement' | 'warning' | 'tip';
export type WellnessArea = 'workout' | 'nutrition' | 'skin' | 'body' | 'overall';

export interface WellnessInsight {
  type: WellnessInsightType;
  area: WellnessArea;
  message: string;
  priority?: number; // 1-5, 높을수록 중요
}

// 웰니스 스코어 메인 타입
export interface WellnessScore {
  id: string;
  clerkUserId: string;
  date: string; // YYYY-MM-DD

  // 점수
  totalScore: number; // 0-100
  workoutScore: number; // 0-25
  nutritionScore: number; // 0-25
  skinScore: number; // 0-25
  bodyScore: number; // 0-25

  // 상세
  scoreBreakdown: ScoreBreakdown;
  insights: WellnessInsight[];

  // 메타
  createdAt: Date;
  updatedAt: Date;
}

// 점수 계산 입력 타입
export interface WorkoutScoreInput {
  currentStreak: number;
  weeklyWorkouts: number;
  targetWorkouts: number;
  completedGoals: number;
  totalGoals: number;
}

export interface NutritionScoreInput {
  calorieAchievement: number; // 0-100%
  proteinAchievement: number; // 0-100%
  carbsAchievement: number; // 0-100%
  fatAchievement: number; // 0-100%
  waterCups: number;
  targetWaterCups: number;
}

export interface SkinScoreInput {
  hasAnalysis: boolean;
  analysisAge: number; // 일 수
  routineCompleted: boolean;
  productMatchScore: number; // 0-100
}

export interface BodyScoreInput {
  hasAnalysis: boolean;
  analysisAge: number; // 일 수
  targetWeight: number;
  currentWeight: number;
  initialWeight: number;
  hasWorkoutPlan: boolean;
}

// DB Row 타입
export interface WellnessScoreRow {
  id: string;
  clerk_user_id: string;
  date: string;
  total_score: number | null;
  workout_score: number | null;
  nutrition_score: number | null;
  skin_score: number | null;
  body_score: number | null;
  score_breakdown: ScoreBreakdown | null;
  insights: WellnessInsight[] | null;
  created_at: string;
  updated_at: string;
}

// DB Row → WellnessScore 변환
export function toWellnessScore(row: WellnessScoreRow): WellnessScore {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    date: row.date,
    totalScore: row.total_score ?? 0,
    workoutScore: row.workout_score ?? 0,
    nutritionScore: row.nutrition_score ?? 0,
    skinScore: row.skin_score ?? 0,
    bodyScore: row.body_score ?? 0,
    scoreBreakdown: row.score_breakdown ?? {
      workout: { streak: 0, frequency: 0, goal: 0 },
      nutrition: { calorie: 0, balance: 0, water: 0 },
      skin: { analysis: 0, routine: 0, matching: 0 },
      body: { analysis: 0, progress: 0, workout: 0 },
    },
    insights: row.insights ?? [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// 웰니스 등급
export type WellnessGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export function getWellnessGrade(score: number): WellnessGrade {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export function getWellnessGradeColor(grade: WellnessGrade): string {
  const colors: Record<WellnessGrade, string> = {
    S: 'text-yellow-500',
    A: 'text-green-500',
    B: 'text-blue-500',
    C: 'text-orange-500',
    D: 'text-red-400',
    F: 'text-gray-500',
  };
  return colors[grade];
}

export function getWellnessGradeBgColor(grade: WellnessGrade): string {
  const colors: Record<WellnessGrade, string> = {
    S: 'bg-yellow-100 dark:bg-yellow-900/30',
    A: 'bg-green-100 dark:bg-green-900/30',
    B: 'bg-blue-100 dark:bg-blue-900/30',
    C: 'bg-orange-100 dark:bg-orange-900/30',
    D: 'bg-red-100 dark:bg-red-900/30',
    F: 'bg-gray-100 dark:bg-gray-900/30',
  };
  return colors[grade];
}
