/**
 * S-2 피부 일기 존별 연동
 * 12존 점수의 시간 추적, 트렌드 분석, 악화 알림
 *
 * @description 12존 분석 결과를 일기 형태로 기록하고 트렌드를 산출합니다.
 * @see types/skin-zones.ts - DetailedZoneId
 */

import type { DetailedZoneId } from '@/types/skin-zones';
import { DETAILED_ZONE_LABELS } from '@/types/skin-zones';

// =============================================================================
// 타입
// =============================================================================

/** 일기 엔트리 (12존 스냅샷) */
export interface SkinDiaryEntry {
  /** 기록 날짜 (ISO 8601) */
  date: string;
  /** 12존 점수 */
  zoneScores: Partial<Record<DetailedZoneId, number>>;
  /** 바이탈리티 점수 */
  vitalityScore: number;
  /** 환경 정보 (선택) */
  environment?: {
    weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
    humidity?: number;
    sleepHours?: number;
    stressLevel?: number;
  };
  /** 메모 */
  note?: string;
}

/** 트렌드 방향 */
export type TrendDirection = 'improving' | 'stable' | 'worsening';

/** 존별 트렌드 */
export interface ZoneTrend {
  zoneId: DetailedZoneId;
  label: string;
  /** 최근 점수 */
  currentScore: number;
  /** 기간 시작 점수 */
  startScore: number;
  /** 점수 변화량 */
  change: number;
  /** 변화 방향 */
  direction: TrendDirection;
  /** 이동 평균 (마지막 값) */
  movingAverage: number;
}

/** 트렌드 분석 결과 */
export interface SkinTrendAnalysis {
  /** 기간 */
  periodDays: number;
  /** 엔트리 수 */
  entryCount: number;
  /** 전체 바이탈리티 트렌드 */
  vitalityTrend: TrendDirection;
  /** 바이탈리티 변화량 */
  vitalityChange: number;
  /** 존별 트렌드 */
  zoneTrends: ZoneTrend[];
  /** 개선된 존 */
  improvedZones: DetailedZoneId[];
  /** 악화된 존 */
  worsenedZones: DetailedZoneId[];
  /** 안정적인 존 */
  stableZones: DetailedZoneId[];
}

/** 악화 알림 */
export interface DeteriorationAlert {
  zoneId: DetailedZoneId;
  label: string;
  /** 현재 점수 */
  currentScore: number;
  /** 이전 기간 평균 */
  previousAverage: number;
  /** 하락폭 */
  drop: number;
  /** 심각도 */
  severity: 'mild' | 'moderate' | 'severe';
  /** 권장 조치 */
  suggestion: string;
}

/** 스트릭 정보 */
export interface DiaryStreak {
  /** 연속 기록 일수 */
  currentStreak: number;
  /** 최장 연속 기록 */
  longestStreak: number;
  /** 이번 달 기록 일수 */
  thisMonthCount: number;
}

// =============================================================================
// 트렌드 분석
// =============================================================================

// 변화 임계값: 이 값 이상이면 개선/악화, 미만이면 안정
const CHANGE_THRESHOLD = 5;

/**
 * 기간별 존 트렌드 분석
 *
 * @param entries 시간순 정렬된 일기 엔트리
 * @param periodDays 분석 기간 (7, 14, 30)
 */
export function analyzeSkinTrend(
  entries: SkinDiaryEntry[],
  periodDays: number = 30
): SkinTrendAnalysis {
  if (entries.length < 2) {
    return {
      periodDays,
      entryCount: entries.length,
      vitalityTrend: 'stable',
      vitalityChange: 0,
      zoneTrends: [],
      improvedZones: [],
      worsenedZones: [],
      stableZones: [],
    };
  }

  // 기간 필터링
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);
  const cutoffIso = cutoffDate.toISOString();
  const filtered = entries.filter((e) => e.date >= cutoffIso);

  if (filtered.length < 2) {
    return {
      periodDays,
      entryCount: filtered.length,
      vitalityTrend: 'stable',
      vitalityChange: 0,
      zoneTrends: [],
      improvedZones: [],
      worsenedZones: [],
      stableZones: [],
    };
  }

  // 바이탈리티 트렌드
  const firstVitality = filtered[0].vitalityScore;
  const lastVitality = filtered[filtered.length - 1].vitalityScore;
  const vitalityChange = lastVitality - firstVitality;
  const vitalityTrend = getDirection(vitalityChange);

  // 존별 트렌드
  const allZoneIds = collectAllZoneIds(filtered);
  const zoneTrends: ZoneTrend[] = [];
  const improvedZones: DetailedZoneId[] = [];
  const worsenedZones: DetailedZoneId[] = [];
  const stableZones: DetailedZoneId[] = [];

  for (const zoneId of allZoneIds) {
    const scores = filtered
      .map((e) => e.zoneScores[zoneId])
      .filter((s): s is number => s !== undefined);

    if (scores.length < 2) continue;

    const startScore = scores[0];
    const currentScore = scores[scores.length - 1];
    const change = currentScore - startScore;
    const direction = getDirection(change);
    const movingAverage = calculateMovingAverage(scores, 3);

    zoneTrends.push({
      zoneId,
      label: DETAILED_ZONE_LABELS[zoneId],
      currentScore,
      startScore,
      change,
      direction,
      movingAverage,
    });

    if (direction === 'improving') improvedZones.push(zoneId);
    else if (direction === 'worsening') worsenedZones.push(zoneId);
    else stableZones.push(zoneId);
  }

  return {
    periodDays,
    entryCount: filtered.length,
    vitalityTrend,
    vitalityChange,
    zoneTrends,
    improvedZones,
    worsenedZones,
    stableZones,
  };
}

// =============================================================================
// 악화 알림
// =============================================================================

/**
 * 악화 알림 생성
 * 최근 엔트리와 이전 기간 평균을 비교하여 급격한 하락 감지
 */
export function detectDeteriorationAlerts(
  entries: SkinDiaryEntry[],
  recentCount: number = 3
): DeteriorationAlert[] {
  if (entries.length < recentCount + 3) return [];

  const recent = entries.slice(-recentCount);
  const previous = entries.slice(0, -recentCount);
  const alerts: DeteriorationAlert[] = [];

  const allZoneIds = collectAllZoneIds(entries);

  for (const zoneId of allZoneIds) {
    const recentScores = recent
      .map((e) => e.zoneScores[zoneId])
      .filter((s): s is number => s !== undefined);
    const previousScores = previous
      .map((e) => e.zoneScores[zoneId])
      .filter((s): s is number => s !== undefined);

    if (recentScores.length === 0 || previousScores.length === 0) continue;

    const currentScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const previousAverage = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
    const drop = previousAverage - currentScore;

    // 10점 이상 하락 시 알림
    if (drop >= 10) {
      const severity = getSeverityFromDrop(drop);
      const label = DETAILED_ZONE_LABELS[zoneId];

      alerts.push({
        zoneId,
        label,
        currentScore: Math.round(currentScore),
        previousAverage: Math.round(previousAverage),
        drop: Math.round(drop),
        severity,
        suggestion: getSuggestion(zoneId, severity),
      });
    }
  }

  // 심각도 → 하락폭 순 정렬
  const severityOrder = { severe: 0, moderate: 1, mild: 2 };
  return alerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.drop - a.drop
  );
}

// =============================================================================
// 스트릭 계산
// =============================================================================

/**
 * 일기 연속 기록 스트릭 계산
 */
export function calculateDiaryStreak(entries: SkinDiaryEntry[]): DiaryStreak {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0, thisMonthCount: 0 };
  }

  // 날짜 문자열 Set (yyyy-MM-dd)
  const dates = new Set(entries.map((e) => e.date.substring(0, 10)));

  // 현재 연속 스트릭 (오늘부터 역산)
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().substring(0, 10);
    if (dates.has(key)) {
      currentStreak++;
    } else {
      break;
    }
  }

  // 최장 연속 스트릭
  const sortedDates = [...dates].sort();
  let longestStreak = 0;
  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diffDays) === 1) {
      streak++;
    } else {
      longestStreak = Math.max(longestStreak, streak);
      streak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, streak);

  // 이번 달 기록 수
  const thisMonth = today.toISOString().substring(0, 7);
  const thisMonthCount = [...dates].filter((d) => d.startsWith(thisMonth)).length;

  return { currentStreak, longestStreak, thisMonthCount };
}

// =============================================================================
// S-2 분석 결과를 일기 엔트리로 변환
// =============================================================================

/**
 * S-2 12존 분석 결과를 일기 엔트리로 변환
 */
export function createDiaryEntryFromAnalysis(
  zoneScores: Record<DetailedZoneId, number>,
  vitalityScore: number,
  environment?: SkinDiaryEntry['environment']
): SkinDiaryEntry {
  return {
    date: new Date().toISOString(),
    zoneScores,
    vitalityScore,
    environment,
  };
}

// =============================================================================
// 내부 헬퍼
// =============================================================================

function getSeverityFromDrop(drop: number): 'mild' | 'moderate' | 'severe' {
  if (drop >= 25) return 'severe';
  if (drop >= 15) return 'moderate';
  return 'mild';
}

function getDirection(change: number): TrendDirection {
  if (change >= CHANGE_THRESHOLD) return 'improving';
  if (change <= -CHANGE_THRESHOLD) return 'worsening';
  return 'stable';
}

/**
 * 단순 이동 평균 (마지막 값)
 */
function calculateMovingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0;
  const slice = values.slice(-window);
  return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
}

function collectAllZoneIds(entries: SkinDiaryEntry[]): DetailedZoneId[] {
  const zoneSet = new Set<DetailedZoneId>();
  for (const entry of entries) {
    for (const zoneId of Object.keys(entry.zoneScores) as DetailedZoneId[]) {
      zoneSet.add(zoneId);
    }
  }
  return [...zoneSet];
}

function getSuggestion(zoneId: DetailedZoneId, severity: string): string {
  const label = DETAILED_ZONE_LABELS[zoneId];
  if (severity === 'severe') {
    return `${label} 피부 상태가 크게 악화되었습니다. 피부과 상담을 권장합니다.`;
  }
  if (severity === 'moderate') {
    return `${label} 상태가 눈에 띄게 변했습니다. 해당 부위 집중 케어를 시작하세요.`;
  }
  return `${label} 상태를 주의 깊게 관찰해 주세요.`;
}
