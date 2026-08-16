/**
 * 제품 필터 어휘 브리지 (UI·분석 결과 어휘 ↔ cosmetic_products DB 실값)
 *
 * @module lib/products/vocabulary
 * @description
 *   같은 개념을 UI 칩(`soothing`), 분석 결과 지표 id(`pigmentation`), DB 컬럼 실값(`redness`,
 *   `whitening`)이 서로 다른 이름으로 부른다. 이 어휘 차이를 코드 여러 곳이 제각각 처리하다
 *   교집합이 붕괴하는 사고가 반복돼(2026-08 매칭 감사: 피부 결과 → 제품 교집합이 `hydration`
 *   1개뿐), 브리지를 한 곳에 모아 정본화한다.
 *
 *   ⚠️ 여기 적히는 DB 값은 **전부 prod `cosmetic_products`에 실재하는 값만** 쓴다
 *   (2026-08-17 실쿼리 검증). 유령 값을 넣으면 오버랩 필터가 조용히 무의미해진다.
 */

import type { SkinConcern } from '@/types/product';
import type { AgeGroup } from '@/types/hybrid';

// ================================================
// 피부 고민 — UI 칩 → DB 실값
// ================================================

/** 뷰티 탭 고민 칩 id (UI 어휘) */
export type BeautyConcernId =
  | 'hydration'
  | 'whitening'
  | 'pore'
  | 'soothing'
  | 'acne'
  | 'wrinkle'
  | 'elasticity';

/**
 * UI 고민 칩 → `cosmetic_products.concerns` DB 실값 집합 (2026-07-10 prod 실쿼리 검증,
 * 2026-08-17 재검증).
 *
 * 근본 문제: 스킨케어 제품은 concerns가 100% 태깅돼 있어(null 0건) `concerns.is.null` 탈출구가
 * 스킨케어에선 절대 적용되지 않는다. 그런데 기존 쿼리는 UI id 1개("soothing")만 그대로 매칭해
 * DB의 동의어·변형(redness/atopy/barrier 등)을 놓쳐 여러 고민이 near-0로 붕괴했다.
 * 점수 조작이 아니라 어휘 매핑 정합으로 도달 가능하게 만든다.
 */
export const CONCERN_DB_SYNONYMS: Record<BeautyConcernId, string[]> = {
  hydration: ['hydration', 'barrier', 'barrier_repair'],
  whitening: ['whitening', 'tone-up', 'dark_circles', 'dark-circle'],
  pore: ['pore', 'blackhead', 'sebum', 'oil-control'],
  soothing: ['soothing', 'redness', 'atopy', 'barrier', 'barrier_repair'],
  acne: ['acne', 'acne-scar', 'blemish', 'sebum', 'blackhead'],
  wrinkle: ['wrinkle', 'wrinkles', 'aging', 'anti-aging', 'firming'],
  elasticity: ['elasticity', 'firming', 'anti-aging'],
};

/** 선택된 UI 고민 칩들을 DB concern 실값 집합으로 확장 (중복 제거) — 쿼리 필터용 */
export function expandConcernsToDbValues(concerns: readonly BeautyConcernId[]): string[] {
  return [...new Set(concerns.flatMap((c) => CONCERN_DB_SYNONYMS[c] ?? [c]))];
}

// ================================================
// 피부 분석 결과 지표 → 정본 SkinConcern
// ================================================

/**
 * S-1 결과 지표 id → 정본 `SkinConcern` 어휘.
 *
 * 배경(2026-08 매칭 감사): 피부 결과 페이지는 경고 지표의 id(`pores`·`wrinkles`·`pigmentation`…)를
 * 그대로 `skinConcerns` 파라미터로 넘겼는데, 매칭 엔진과 DB는 `pore`·`aging`·`whitening` 어휘를
 * 쓴다. 철자가 겹치는 `hydration` 하나만 우연히 매칭돼 사실상 개인화가 죽어 있었다.
 *
 * 정본 어휘에 대응이 없는 지표는 **매핑하지 않는다**(억지 매핑 금지):
 * - `oil`(유분도) → 피부 타입 축(`oily`)이 이미 같은 신호를 나른다. 중복 매핑 불필요.
 * - `darkCircles` → DB엔 `dark-circle` 값이 있으나 정본 `SkinConcern` 유니온에 대응 값이 없다.
 *
 * 정본 값 자신도 키로 두어 **멱등**하다(이미 변환된 값을 다시 넣어도 안전).
 */
export const SKIN_METRIC_TO_CONCERNS: Record<string, SkinConcern[]> = {
  // 결과 지표 id
  hydration: ['hydration'],
  pores: ['pore'],
  wrinkles: ['aging'],
  elasticity: ['aging'],
  pigmentation: ['whitening'],
  trouble: ['acne'],
  sensitivity: ['redness'],
  // 정본 SkinConcern 통과 (멱등)
  acne: ['acne'],
  aging: ['aging'],
  whitening: ['whitening'],
  pore: ['pore'],
  redness: ['redness'],
};

/**
 * 분석 결과 지표 id 목록을 정본 `SkinConcern` 목록으로 변환(중복 제거).
 * 대응이 없는 id는 조용히 버린다 — 지어낸 고민을 매칭에 흘리지 않기 위함.
 */
export function mapSkinMetricsToConcerns(metricIds: readonly string[]): SkinConcern[] {
  return [...new Set(metricIds.flatMap((id) => SKIN_METRIC_TO_CONCERNS[id] ?? []))];
}

/**
 * 정본 `SkinConcern` → DB `concerns` 실값 확장 (후보 풀 오버랩 쿼리용).
 * 값은 전부 prod 실재 어휘 (2026-08-17 실쿼리 검증).
 */
const SKIN_CONCERN_DB_SYNONYMS: Record<SkinConcern, string[]> = {
  hydration: ['hydration', 'barrier', 'barrier_repair'],
  pore: ['pore', 'blackhead', 'sebum', 'oil-control'],
  acne: ['acne', 'acne-scar', 'blemish'],
  aging: ['aging', 'anti-aging', 'wrinkle', 'wrinkles', 'elasticity', 'firming'],
  whitening: ['whitening', 'tone-up', 'dark-circle', 'dark_circles'],
  redness: ['redness', 'soothing', 'atopy'],
};

export function expandSkinConcernsToDbValues(concerns: readonly SkinConcern[]): string[] {
  return [...new Set(concerns.flatMap((c) => SKIN_CONCERN_DB_SYNONYMS[c] ?? [c]))];
}

// ================================================
// 연령대 — UI 값 → DB 실값
// ================================================

/**
 * UI `AgeGroup` → `cosmetic_products.target_age_groups` DB 실값.
 * DB 어휘는 `10s|20s|30s|40s|50s` (2026-08-17 실쿼리 검증) — UI만 `50plus`를 쓴다.
 * 표를 명시해 두어 어느 한쪽 어휘가 늘어나도 조용히 0건이 되지 않게 한다.
 */
export const AGE_GROUP_TO_DB: Record<AgeGroup, string> = {
  '10s': '10s',
  '20s': '20s',
  '30s': '30s',
  '40s': '40s',
  '50plus': '50s',
};

export function mapAgeGroupsToDbValues(groups: readonly AgeGroup[]): string[] {
  return [...new Set(groups.map((g) => AGE_GROUP_TO_DB[g] ?? g))];
}

// ================================================
// 퍼스널컬러 실행 레이어 — 색이 있는 색조만
// ================================================

/**
 * 퍼스널컬러 결과에 노출해도 되는 메이크업 세분류(`subcategory`) 화이트리스트.
 *
 * 퍼스널컬러는 "내 얼굴에 어울리는 **색**"의 축이다. 프라이머·세팅스프레이·마스카라·브로우·
 * 파우더·브러시처럼 색 선택이 시즌과 무관한(또는 무채인) 세분류가 섞이면 "겨울 쿨톤 추천"이라며
 * 투명 프라이머를 내미는 어색함이 생긴다(2026-08 매칭 감사).
 *
 * 값은 prod `cosmetic_products`(category='makeup') 실측 subcategory 19종 중
 * 색 선택이 개인색과 직결되는 것만 남긴 것 (2026-08-17 실쿼리 검증).
 * 제외: primer · setting-spray · mascara · brow · powder · brush.
 */
export const PERSONAL_COLOR_MAKEUP_SUBCATEGORIES = [
  'lip',
  'lip-gloss',
  'lip-liner',
  'blush',
  'eyeshadow',
  'eye',
  'multi-palette',
  'cushion',
  'foundation',
  'concealer',
  'highlighter',
  'contour',
] as const;
