/**
 * 피부 일기 타입 정의
 * @module lib/skin-diary
 * @see docs/specs/SDD-SKIN-DIARY.md
 */

// ============================================
// 다이어리 엔트리 (skin_assessments → 변환)
// ============================================

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  vitalityScore: number; // 0-100
  vitalityGrade: VitalityGrade;
  scoreBreakdown: ScoreBreakdown;
  primaryConcerns: string[];
  skinType: string;
  zoneHighlights?: {
    improved: string[];
    worsened: string[];
  };
  note?: DiaryNote;
}

export type VitalityGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface ScoreBreakdown {
  hydration: number;
  elasticity: number;
  clarity: number;
  tone: number;
}

// ============================================
// 선택적 메모
// ============================================

export const CONDITION_EMOJIS = ['😊', '🙂', '😐', '😟', '😰'] as const;
export type ConditionEmoji = (typeof CONDITION_EMOJIS)[number];

export interface DiaryNote {
  conditionEmoji: ConditionEmoji;
  text: string; // 최대 200자
}

// ============================================
// 트렌드 분석
// ============================================

export type TrendPeriod = '7d' | '30d' | '90d';

export type TrendDirection = 'improving' | 'stable' | 'declining';

export interface CategoryTrend {
  trend: TrendDirection;
  change: number; // 절대값 변화
  changePercent: number; // % 변화
}

export interface TrendAlert {
  type: 'deterioration' | 'improvement' | 'milestone';
  severity: 'info' | 'warning';
  category: string;
  message: string;
  suggestion?: string;
}

export interface TrendAnalysis {
  period: TrendPeriod;
  entries: DiaryEntry[];
  entryCount: number;

  // 이동평균
  shortTermAvg: number; // 최근 3회
  longTermAvg: number; // 최근 7회

  // 트렌드 방향
  trend: TrendDirection;
  changeRate: number; // % 변화율

  // 카테고리별 트렌드
  categoryTrends: Record<keyof ScoreBreakdown, CategoryTrend>;

  // 알림
  alerts: TrendAlert[];

  // 스트릭
  analysisStreak: number; // 주 1회 기준 연속 주수
}

// ============================================
// 캘린더
// ============================================

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  hasAssessment: boolean;
  vitalityGrade?: VitalityGrade;
  conditionEmoji?: string;
  isToday: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number; // 1-12
  days: CalendarDay[];
  assessmentCount: number;
  averageScore: number;
}

// ============================================
// API 응답
// ============================================

export interface SkinDiaryResponse {
  trend: TrendAnalysis;
  calendar: CalendarMonth;
  recentEntries: DiaryEntry[];
}
