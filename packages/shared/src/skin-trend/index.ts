/**
 * 피부 점수 추이 (ADR-109 Phase 3 — 피부=오늘의 컨디션)
 *
 * 직전 분석 대비 변화. 프로필 카드의 스킨 추이 칩(↑/↓/유지)에서 웹·앱 공유.
 * 순수 함수 — 플랫폼 의존 없음 (packages/shared 규칙).
 */

export type SkinTrendDirection = 'up' | 'down' | 'flat';

/** 최신·직전 피부 점수로 추이 계산. delta 0이면 flat. (delta 양수=개선) */
export function computeSkinTrend(
  latest: number,
  prev: number
): { delta: number; trend: SkinTrendDirection } {
  const delta = Math.round(latest - prev);
  const trend: SkinTrendDirection = delta > 0 ? 'up' : 'down';
  return { delta, trend: delta === 0 ? 'flat' : trend };
}
