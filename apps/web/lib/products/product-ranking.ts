/**
 * 추천 제품 순위 표현 유틸 (T2 — BEST 순위·이유·비교)
 *
 * @module lib/products/product-ranking
 * @description
 *   실측 적합도 점수(matchScore)와 매칭 이유(matchReasons)로
 *   BEST 1/2/3 순위 배지 · "왜 이 순위인지" 한 줄 · 상위 2개 비교 한 줄을 조립한다.
 *
 *   ⚠️ 지어낸 별점·가짜 평점 금지 — 모든 문구는 실데이터(matchScore/matchReasons) 파생.
 *   데이터가 없으면 배지/문장을 생성하지 않는다(빈 결과 반환).
 *
 * @see components/analysis/AnalysisMatchedProducts.tsx
 * @see app/(main)/analysis/integrated/result/[sessionId]/_components/CurationCard.tsx
 */

/** 순위별 메달 배지 (0-index: BEST 1 = 금, 2 = 은, 3 = 동) */
export const RANK_BADGES = [
  { emoji: '🥇', label: 'BEST 1' },
  { emoji: '🥈', label: 'BEST 2' },
  { emoji: '🥉', label: 'BEST 3' },
] as const;

export type RankBadge = (typeof RANK_BADGES)[number];

/** 0-index 순위에 해당하는 메달 배지. 3위(index 2) 초과면 null. */
export function getRankBadge(index: number): RankBadge | null {
  return RANK_BADGES[index] ?? null;
}

/**
 * matchScore 내림차순 안정 정렬(동률이면 원래 순서 유지 — 조작 금지).
 * 원본 배열을 변형하지 않는다.
 */
export function rankByMatchScore<T extends { matchScore: number }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.matchScore - a.item.matchScore || a.index - b.index)
    .map(({ item }) => item);
}

/** 공백만 있는 이유를 제거하고 중복을 제거한 순서 보존 배열 */
function cleanReasons(reasons?: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of reasons ?? []) {
    const r = raw.trim();
    if (r.length > 0 && !seen.has(r)) {
      seen.add(r);
      out.push(r);
    }
  }
  return out;
}

/**
 * "왜 이 순위인지" 한 줄. 점수는 실측이므로 그대로 사용(별점 금지).
 *
 * @example buildRankReasonLine(92, ['여름 쿨톤', '건성'])
 *   → "나와의 적합도 92점 — 여름 쿨톤·건성에 모두 맞아요"
 * @example buildRankReasonLine(88, ['건성'])
 *   → "나와의 적합도 88점 — 건성에 맞아요"
 * @example buildRankReasonLine(80, [])
 *   → "나와의 적합도 80점"
 */
export function buildRankReasonLine(matchScore: number, matchReasons?: readonly string[]): string {
  const base = `나와의 적합도 ${Math.round(matchScore)}점`;
  const reasons = cleanReasons(matchReasons);
  if (reasons.length === 0) return base;
  if (reasons.length === 1) return `${base} — ${reasons[0]}에 맞아요`;
  return `${base} — ${reasons.join('·')}에 모두 맞아요`;
}

/** 받침 유무에 따라 주격 조사(이/가) 선택. 비한글 끝문자는 '가' 기본. */
function subjectParticle(word: string): '이' | '가' {
  if (word.length === 0) return '가';
  const code = word.charCodeAt(word.length - 1);
  // 한글 음절(가~힣) 범위 밖이면 '가'
  if (code < 0xac00 || code > 0xd7a3) return '가';
  // (음절코드 - 0xAC00) % 28 !== 0 → 받침 있음 → '이'
  return (code - 0xac00) % 28 !== 0 ? '이' : '가';
}

/**
 * BEST 1 vs BEST 2 비교 한 줄(제미나이 비교표의 정직 버전).
 * 두 제품 matchReasons의 차집합으로 각자의 "고유 강점"만 대비한다.
 * 양쪽 모두 고유 이유가 있을 때만 문장을 반환 — 하나라도 없으면 null(지어내지 않음).
 *
 * @example buildRankComparisonLine(['여름 쿨톤', '건성'], ['건성', '저자극'])
 *   → "BEST 1은 여름 쿨톤, BEST 2는 저자극이 강점이에요"
 * @example buildRankComparisonLine(['건성'], ['건성'])  // 차이 없음
 *   → null
 */
export function buildRankComparisonLine(
  best1Reasons?: readonly string[],
  best2Reasons?: readonly string[]
): string | null {
  const r1 = cleanReasons(best1Reasons);
  const r2 = cleanReasons(best2Reasons);
  const set1 = new Set(r1);
  const set2 = new Set(r2);
  const unique1 = r1.filter((r) => !set2.has(r));
  const unique2 = r2.filter((r) => !set1.has(r));
  if (unique1.length === 0 || unique2.length === 0) return null;

  const j1 = unique1.join('·');
  const j2 = unique2.join('·');
  return `BEST 1은 ${j1}, BEST 2는 ${j2}${subjectParticle(j2)} 강점이에요`;
}
