/**
 * 피부 일기 트렌드 엔진
 * @module lib/skin-diary
 * @description 이동평균, 트렌드 판정, 악화/개선 감지
 * @see docs/principles/skin-diary.md — 트렌드 감지 알고리즘
 */

import type {
  DiaryEntry,
  TrendAnalysis,
  TrendDirection,
  TrendPeriod,
  CategoryTrend,
  TrendAlert,
  ScoreBreakdown,
} from './types';

// ============================================
// 상수
// ============================================

/** 단기 이동평균 윈도우 (3회) */
const SHORT_TERM_WINDOW = 3;

/** 장기 이동평균 윈도우 (7회) */
const LONG_TERM_WINDOW = 7;

/** 트렌드 안정 임계값 (±5%) */
const STABLE_THRESHOLD = 5;

/** 연속 하락 알림 — 최소 횟수 */
const CONSECUTIVE_DECLINE_COUNT = 3;

/** 연속 하락 알림 — 최소 총 하락폭 */
const CONSECUTIVE_DECLINE_TOTAL = 10;

/** 카테고리별 연속 하락 — 최소 하락폭/회 */
const CATEGORY_DECLINE_PER_ENTRY = 5;

// ============================================
// 이동평균 계산
// ============================================

/** 배열의 단순 이동평균 */
export function calculateMovingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0;
  const slice = values.slice(0, Math.min(window, values.length));
  return slice.reduce((sum, v) => sum + v, 0) / slice.length;
}

// ============================================
// 트렌드 판정
// ============================================

/** 변화율 기반 트렌드 판정 */
export function determineTrend(shortTermAvg: number, longTermAvg: number): TrendDirection {
  if (longTermAvg === 0) return 'stable';

  const changeRate = ((shortTermAvg - longTermAvg) / longTermAvg) * 100;

  if (changeRate >= STABLE_THRESHOLD) return 'improving';
  if (changeRate <= -STABLE_THRESHOLD) return 'declining';
  return 'stable';
}

/** 변화율 계산 (%) */
export function calculateChangeRate(shortTermAvg: number, longTermAvg: number): number {
  if (longTermAvg === 0) return 0;
  return Math.round(((shortTermAvg - longTermAvg) / longTermAvg) * 100 * 10) / 10;
}

// ============================================
// 카테고리별 트렌드
// ============================================

/** 카테고리별 트렌드 분석 */
export function analyzeCategoryTrends(
  entries: DiaryEntry[]
): Record<keyof ScoreBreakdown, CategoryTrend> {
  const categories: (keyof ScoreBreakdown)[] = ['hydration', 'elasticity', 'clarity', 'tone'];
  const result = {} as Record<keyof ScoreBreakdown, CategoryTrend>;

  for (const cat of categories) {
    const values = entries
      .filter((e) => e.scoreBreakdown[cat] !== undefined)
      .map((e) => e.scoreBreakdown[cat]);

    const shortAvg = calculateMovingAverage(values, SHORT_TERM_WINDOW);
    const longAvg = calculateMovingAverage(values, LONG_TERM_WINDOW);

    result[cat] = {
      trend: determineTrend(shortAvg, longAvg),
      change: Math.round((shortAvg - longAvg) * 10) / 10,
      changePercent: calculateChangeRate(shortAvg, longAvg),
    };
  }

  return result;
}

// ============================================
// 알림 생성
// ============================================

/** 악화/개선 알림 감지 */
export function detectAlerts(entries: DiaryEntry[]): TrendAlert[] {
  const alerts: TrendAlert[] = [];

  if (entries.length < CONSECUTIVE_DECLINE_COUNT) return alerts;

  // 바이탈리티 점수 연속 하락 감지 (entries는 최신순)
  const recentScores = entries.slice(0, CONSECUTIVE_DECLINE_COUNT).map((e) => e.vitalityScore);
  // 최신순이므로 각 점수가 다음(이전 시점) 점수보다 낮으면 하락 추세
  const isConsecutiveDecline = recentScores.every(
    (score, i) => i === recentScores.length - 1 || score < recentScores[i + 1]
  );

  if (isConsecutiveDecline) {
    const totalDecline = recentScores[recentScores.length - 1] - recentScores[0];
    if (totalDecline >= CONSECUTIVE_DECLINE_TOTAL) {
      alerts.push({
        type: 'deterioration',
        severity: 'warning',
        category: 'vitality',
        message: `최근 ${CONSECUTIVE_DECLINE_COUNT}회 분석에서 바이탈리티 점수가 ${totalDecline}점 하락했어요`,
        suggestion: '생활 패턴이나 스킨케어 루틴 변화가 있었는지 확인해보세요',
      });
    }
  }

  // 카테고리별 연속 하락 감지
  const categories: (keyof ScoreBreakdown)[] = ['hydration', 'elasticity', 'clarity', 'tone'];
  const categoryLabels: Record<keyof ScoreBreakdown, string> = {
    hydration: '수분',
    elasticity: '탄력',
    clarity: '투명도',
    tone: '톤',
  };

  for (const cat of categories) {
    const values = entries.slice(0, CONSECUTIVE_DECLINE_COUNT).map((e) => e.scoreBreakdown[cat]);

    // 연속 3회 모두 이전 시점보다 낮은지 확인 (최신순 배열)
    const isDecreasing =
      values.length >= CONSECUTIVE_DECLINE_COUNT &&
      values.every((v, i) => i === values.length - 1 || v < values[i + 1]);

    if (isDecreasing) {
      const decline = values[values.length - 1] - values[0];
      if (decline >= CATEGORY_DECLINE_PER_ENTRY * 2) {
        alerts.push({
          type: 'deterioration',
          severity: 'info',
          category: cat,
          message: `${categoryLabels[cat]} 점수가 최근 ${CONSECUTIVE_DECLINE_COUNT}회 연속 하락 중이에요`,
        });
      }
    }
  }

  // 등급 상승 마일스톤
  if (entries.length >= 2) {
    const gradeOrder: Record<string, number> = { D: 0, C: 1, B: 2, A: 3, S: 4 };
    const currentGrade = gradeOrder[entries[0].vitalityGrade] ?? 0;
    const previousGrade = gradeOrder[entries[1].vitalityGrade] ?? 0;

    if (currentGrade > previousGrade) {
      alerts.push({
        type: 'milestone',
        severity: 'info',
        category: 'vitality',
        message: `바이탈리티 등급이 ${entries[1].vitalityGrade}에서 ${entries[0].vitalityGrade}로 올랐어요!`,
      });
    }
  }

  return alerts;
}

// ============================================
// 스트릭 계산
// ============================================

/** 주 1회 기준 연속 분석 주수 */
export function calculateStreak(entries: DiaryEntry[]): number {
  if (entries.length === 0) return 0;

  // 주 단위로 그룹화 (ISO week)
  const weekSet = new Set<string>();
  for (const entry of entries) {
    const d = new Date(entry.date);
    const yearWeek = getISOYearWeek(d);
    weekSet.add(yearWeek);
  }

  // 현재 주부터 역순으로 연속 주 카운트
  const now = new Date();
  let streak = 0;

  for (let i = 0; i < 52; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - i * 7);
    const yearWeek = getISOYearWeek(checkDate);

    if (weekSet.has(yearWeek)) {
      streak++;
    } else if (streak > 0) {
      break;
    }
  }

  return streak;
}

/** ISO 연도-주 문자열 */
function getISOYearWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ============================================
// 메인 분석 함수
// ============================================

/**
 * 피부 일기 트렌드 분석 실행
 * @param entries - 최신순 정렬된 DiaryEntry 배열
 * @param period - 분석 기간
 */
export function analyzeTrend(entries: DiaryEntry[], period: TrendPeriod): TrendAnalysis {
  const scores = entries.map((e) => e.vitalityScore);

  const shortTermAvg = calculateMovingAverage(scores, SHORT_TERM_WINDOW);
  const longTermAvg = calculateMovingAverage(scores, LONG_TERM_WINDOW);

  return {
    period,
    entries,
    entryCount: entries.length,
    shortTermAvg: Math.round(shortTermAvg * 10) / 10,
    longTermAvg: Math.round(longTermAvg * 10) / 10,
    trend: determineTrend(shortTermAvg, longTermAvg),
    changeRate: calculateChangeRate(shortTermAvg, longTermAvg),
    categoryTrends: analyzeCategoryTrends(entries),
    alerts: detectAlerts(entries),
    analysisStreak: calculateStreak(entries),
  };
}
