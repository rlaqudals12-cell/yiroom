// ============================================================
// 웰니스 스코어 상수
// Phase H Sprint 2
// ============================================================

// 각 영역의 최대 점수
export const MAX_AREA_SCORE = 25;
export const MAX_TOTAL_SCORE = 100;

// 세부 점수 가중치
export const SCORE_WEIGHTS = {
  workout: {
    streak: 10,
    frequency: 10,
    goal: 5,
  },
  nutrition: {
    calorie: 10,
    balance: 10,
    water: 5,
  },
  skin: {
    analysis: 10,
    routine: 10,
    matching: 5,
  },
  body: {
    analysis: 10,
    progress: 10,
    workout: 5,
  },
} as const;

// 스트릭 보너스 테이블
export const STREAK_BONUS_TABLE = [
  { min: 0, max: 2, score: 2 },
  { min: 3, max: 6, score: 4 },
  { min: 7, max: 13, score: 6 },
  { min: 14, max: 29, score: 8 },
  { min: 30, max: Infinity, score: 10 },
] as const;

// 운동 빈도 점수 (주간 기준)
export const FREQUENCY_SCORE_TABLE = [
  { min: 0, max: 0, score: 0 },
  { min: 1, max: 1, score: 2 },
  { min: 2, max: 2, score: 4 },
  { min: 3, max: 3, score: 6 },
  { min: 4, max: 4, score: 8 },
  { min: 5, max: Infinity, score: 10 },
] as const;

// 분석 최신성 점수 (일 기준)
export const ANALYSIS_AGE_SCORE_TABLE = [
  { min: 0, max: 7, score: 10 }, // 1주 이내
  { min: 8, max: 14, score: 8 }, // 2주 이내
  { min: 15, max: 30, score: 6 }, // 1달 이내
  { min: 31, max: 60, score: 4 }, // 2달 이내
  { min: 61, max: 90, score: 2 }, // 3달 이내
  { min: 91, max: Infinity, score: 0 }, // 3달 초과
] as const;

// 웰니스 등급 기준
export const GRADE_THRESHOLDS = {
  S: 90,
  A: 80,
  B: 70,
  C: 60,
  D: 50,
  F: 0,
} as const;

// 웰니스 인사이트 생성 기준
export const INSIGHT_THRESHOLDS = {
  lowScore: 50, // 이 점수 미만이면 개선 필요
  highScore: 80, // 이 점수 이상이면 칭찬
  streakMilestones: [7, 14, 30, 60, 100], // 스트릭 마일스톤
} as const;

// 점수 테이블 조회 헬퍼
export function getScoreFromTable(
  value: number,
  table: ReadonlyArray<{ min: number; max: number; score: number }>
): number {
  const entry = table.find((t) => value >= t.min && value <= t.max);
  return entry?.score ?? 0;
}

// 비율 → 점수 변환 (0-100% → 0-maxScore)
export function percentToScore(percent: number, maxScore: number): number {
  const normalizedPercent = Math.min(100, Math.max(0, percent));
  return Math.round((normalizedPercent / 100) * maxScore);
}

// 점수 → 비율 변환
export function scoreToPercent(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100);
}
