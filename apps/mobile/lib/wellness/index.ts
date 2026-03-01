/**
 * 웰니스 점수 연산 모듈
 *
 * 운동, 영양, 피부, 체형 점수를 합산한 종합 웰니스 점수
 *
 * @module lib/wellness
 */

// ─── 타입 ────────────────────────────────────────────

export interface WellnessScore {
  total: number;
  breakdown: WellnessBreakdown;
  grade: WellnessGrade;
  streakBonus: number;
  trend: 'up' | 'down' | 'stable';
}

export interface WellnessBreakdown {
  workout: number;
  nutrition: number;
  skin: number;
  body: number;
}

export type WellnessGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface WellnessInput {
  // 운동 데이터
  weeklyWorkoutMinutes: number;
  weeklyWorkoutDays: number;

  // 영양 데이터
  avgCalorieAccuracy: number;
  avgMacroBalance: number;
  waterIntakeRatio: number;

  // 피부 데이터
  skinScore: number | null;
  skinRoutineConsistency: number;

  // 체형 데이터
  bodyScore: number | null;
  postureScore: number | null;

  // 스트릭
  currentStreak: number;
}

export interface WellnessTrend {
  date: string;
  total: number;
  workout: number;
  nutrition: number;
  skin: number;
}

// ─── 가중치 상수 ──────────────────────────────────────

const WEIGHTS = {
  workout: 25,
  nutrition: 25,
  skin: 25,
  body: 10,
  // 나머지 15점은 보너스로 분배
} as const;

const STREAK_BONUS_THRESHOLDS = [
  { days: 30, bonus: 15 },
  { days: 14, bonus: 10 },
  { days: 7, bonus: 5 },
  { days: 3, bonus: 2 },
] as const;

// ─── 개별 점수 계산 ───────────────────────────────────

/**
 * 운동 점수 (0-25)
 *
 * - 주 3회 이상 운동: 만점 기준
 * - 주 150분 이상: WHO 권장
 */
export function calculateWorkoutScore(
  weeklyMinutes: number,
  weeklyDays: number
): number {
  // 빈도 점수 (0-15): 주 5일 이상 = 만점
  const frequencyScore = Math.min(15, (weeklyDays / 5) * 15);

  // 시간 점수 (0-10): 주 150분 이상 = 만점
  const durationScore = Math.min(10, (weeklyMinutes / 150) * 10);

  return Math.round(frequencyScore + durationScore);
}

/**
 * 영양 점수 (0-25)
 *
 * - 칼로리 정확도 (0-1): 목표 대비
 * - 매크로 균형 (0-1): 탄단지 비율
 * - 수분 섭취 (0-1): 권장량 대비
 */
export function calculateNutritionScore(
  calorieAccuracy: number,
  macroBalance: number,
  waterRatio: number
): number {
  // 칼로리 정확도 (0-10)
  const calorieScore = Math.min(10, calorieAccuracy * 10);

  // 매크로 균형 (0-10)
  const macroScore = Math.min(10, macroBalance * 10);

  // 수분 섭취 (0-5)
  const waterScore = Math.min(5, waterRatio * 5);

  return Math.round(calorieScore + macroScore + waterScore);
}

/**
 * 피부 점수 (0-25)
 *
 * - AI 분석 점수 (0-15)
 * - 루틴 일관성 (0-10)
 */
export function calculateSkinScore(
  skinAnalysisScore: number | null,
  routineConsistency: number
): number {
  // AI 분석 점수 (0-15)
  const analysisScore = skinAnalysisScore != null
    ? Math.min(15, (skinAnalysisScore / 100) * 15)
    : 7.5; // 분석 미완료 시 중간값

  // 루틴 일관성 (0-10): 0-1 비율
  const consistencyScore = Math.min(10, routineConsistency * 10);

  return Math.round(analysisScore + consistencyScore);
}

/**
 * 체형 점수 (0-10)
 *
 * - 체형 분석 점수 (0-5)
 * - 자세 점수 (0-5)
 */
export function calculateBodyScore(
  bodyAnalysisScore: number | null,
  postureScore: number | null
): number {
  // 체형 분석 (0-5)
  const bodyPart = bodyAnalysisScore != null
    ? Math.min(5, (bodyAnalysisScore / 100) * 5)
    : 2.5;

  // 자세 분석 (0-5)
  const posturePart = postureScore != null
    ? Math.min(5, (postureScore / 100) * 5)
    : 2.5;

  return Math.round(bodyPart + posturePart);
}

// ─── 스트릭 보너스 ────────────────────────────────────

/**
 * 스트릭 보너스 계산 (0-15)
 */
export function calculateStreakBonus(currentStreak: number): number {
  for (const { days, bonus } of STREAK_BONUS_THRESHOLDS) {
    if (currentStreak >= days) return bonus;
  }
  return 0;
}

// ─── 종합 점수 ────────────────────────────────────────

/**
 * 종합 웰니스 점수 계산 (0-100)
 */
export function calculateWellnessScore(input: WellnessInput): WellnessScore {
  const workout = calculateWorkoutScore(
    input.weeklyWorkoutMinutes,
    input.weeklyWorkoutDays
  );
  const nutrition = calculateNutritionScore(
    input.avgCalorieAccuracy,
    input.avgMacroBalance,
    input.waterIntakeRatio
  );
  const skin = calculateSkinScore(
    input.skinScore,
    input.skinRoutineConsistency
  );
  const body = calculateBodyScore(
    input.bodyScore,
    input.postureScore
  );
  const streakBonus = calculateStreakBonus(input.currentStreak);

  const subtotal = workout + nutrition + skin + body;
  const total = Math.min(100, subtotal + streakBonus);

  return {
    total,
    breakdown: { workout, nutrition, skin, body },
    grade: getWellnessGrade(total),
    streakBonus,
    trend: 'stable',
  };
}

// ─── 등급 ─────────────────────────────────────────────

/**
 * 웰니스 등급
 */
export function getWellnessGrade(score: number): WellnessGrade {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * 등급 라벨
 */
export const GRADE_LABELS: Record<WellnessGrade, string> = {
  S: '최상',
  A: '우수',
  B: '양호',
  C: '보통',
  D: '개선 필요',
  F: '시작이 반!',
};

/**
 * 등급별 색상
 */
export const GRADE_COLORS: Record<WellnessGrade, string> = {
  S: '#8b5cf6',
  A: '#3b82f6',
  B: '#22c55e',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
};

// ─── 트렌드 계산 ──────────────────────────────────────

/**
 * 이전 점수 대비 트렌드 판단
 */
export function calculateTrend(
  currentScore: number,
  previousScore: number | null
): 'up' | 'down' | 'stable' {
  if (previousScore == null) return 'stable';
  const diff = currentScore - previousScore;
  if (diff > 3) return 'up';
  if (diff < -3) return 'down';
  return 'stable';
}

/**
 * 트렌드 라벨
 */
export function getTrendLabel(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return '상승 중 📈';
    case 'down': return '하락 중 📉';
    case 'stable': return '안정적 ➡️';
  }
}

// ─── 개선 제안 ────────────────────────────────────────

/**
 * 가장 개선이 필요한 영역
 */
export function getImprovementSuggestions(
  breakdown: WellnessBreakdown
): { area: string; message: string }[] {
  const suggestions: { area: string; message: string; score: number; max: number }[] = [
    { area: '운동', message: '주 3회 이상 운동을 추천해요', score: breakdown.workout, max: WEIGHTS.workout },
    { area: '영양', message: '균형 잡힌 식단을 기록해보세요', score: breakdown.nutrition, max: WEIGHTS.nutrition },
    { area: '피부', message: '스킨케어 루틴을 시작해보세요', score: breakdown.skin, max: WEIGHTS.skin },
    { area: '체형', message: '자세 분석을 받아보세요', score: breakdown.body, max: WEIGHTS.body },
  ];

  // 비율이 낮은 순으로 정렬
  return suggestions
    .sort((a, b) => (a.score / a.max) - (b.score / b.max))
    .slice(0, 2)
    .map(({ area, message }) => ({ area, message }));
}
