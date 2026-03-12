/**
 * 피부 일기 모듈 공개 API
 *
 * @module lib/skin-diary
 * @description 기존 S-1/S-2 분석 결과의 시계열 트렌드 분석 + 선택적 메모
 *
 * @example
 * import { analyzeTrend, getDiaryEntries } from '@/lib/skin-diary';
 *
 * const entries = await getDiaryEntries(supabase, userId, '30d');
 * const trend = analyzeTrend(entries, '30d');
 */

// 타입
export type {
  DiaryEntry,
  DiaryNote,
  VitalityGrade,
  ScoreBreakdown,
  ConditionEmoji,
  TrendPeriod,
  TrendDirection,
  TrendAnalysis,
  TrendAlert,
  CategoryTrend,
  CalendarDay,
  CalendarMonth,
  SkinDiaryResponse,
} from './types';

export { CONDITION_EMOJIS } from './types';

// 트렌드 엔진
export {
  analyzeTrend,
  calculateMovingAverage,
  determineTrend,
  calculateChangeRate,
  analyzeCategoryTrends,
  detectAlerts,
  calculateStreak,
} from './trend-engine';

// Repository
export {
  getDiaryEntries,
  getCalendarMonth,
  saveDiaryNote,
  deleteDiaryNote,
} from './diary-repository';
