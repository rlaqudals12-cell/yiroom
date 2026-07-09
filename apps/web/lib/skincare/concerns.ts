/**
 * 피부 지표 → 고민(concern) 파생 — 단일 정본 (ADR-117)
 *
 * @module lib/skincare/concerns
 * @description
 *   skin_analyses 지표 점수(0-100)에서 케어가 필요한 고민을 파생한다.
 *   기존에 루틴 페이지(analysis/skin/routine)는 자체 파생, 데일리 캡슐은 미전달로
 *   제각각이던 것을 하나의 공개 함수로 통일한다.
 *
 *   판정 기준: 지표 ≤ 40 = 케어 필요 (결과 페이지 warning 임계와 동일).
 *   결정론적 — AI/랜덤 없이 지표만으로 파생한다.
 */

import type { SkinConcernId } from '@/lib/mock/skin-analysis';

/** 케어 필요 임계 — 41 미만(≤40). 결과 페이지 warning 기준과 동일 */
export const CONCERN_THRESHOLD = 40;

// 지표 키(skin_analyses 컬럼명) → 대응 고민. 순서 = 루틴 페이지 파생 로직과 동일.
const METRIC_TO_CONCERN: readonly { key: string; concern: SkinConcernId }[] = [
  { key: 'hydration', concern: 'dryness' },
  { key: 'oil_level', concern: 'excess_oil' },
  { key: 'pores', concern: 'pores' },
  { key: 'pigmentation', concern: 'pigmentation' },
  { key: 'wrinkles', concern: 'wrinkles' },
  { key: 'sensitivity', concern: 'sensitivity' },
];

/**
 * 피부 지표 점수에서 고민 목록 파생 (결정론적)
 *
 * @param scores 지표 점수 맵 (예: `{ hydration: 35, oil_level: 60, sensitivity: 30 }`)
 * @returns 임계 이하 지표에 대응하는 SkinConcernId 목록 (지표 없으면 빈 배열)
 */
export function deriveConcernsFromScores(scores: Record<string, number>): SkinConcernId[] {
  const concerns: SkinConcernId[] = [];
  for (const { key, concern } of METRIC_TO_CONCERN) {
    const value = scores[key];
    if (typeof value === 'number' && value <= CONCERN_THRESHOLD) {
      concerns.push(concern);
    }
  }
  return concerns;
}
