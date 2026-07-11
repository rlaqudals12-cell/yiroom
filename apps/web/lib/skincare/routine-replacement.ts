/**
 * 교체 제안 — 적합도 낮은 보유 제품을 "다 쓴 뒤" 대안으로 안내 (폐루프 v1 일부, G4)
 *
 * @module lib/skincare/routine-replacement
 * @description
 *   창업자 지시(2026-07-10): "안 맞는 보유 제품은 일단 쓰되, 다 쓰면 이런 제품으로
 *   바꿔보라고 해달라." 루틴에 배치된 내 제품(ownedProduct)의 적합도(compatibilityScore)가
 *   낮으면, 같은 스텝의 스펙(specName)이나 추천 대안(recommendedProducts)을 근거로
 *   "다 쓴 뒤" 프레이밍의 교체 제안을 만든다.
 *
 *   정직성(지어내지 않음):
 *   - 새 점수를 발명하지 않는다 — 스캔이 저장한 compatibilityScore를 그대로 재사용.
 *   - 점수 정보가 없는(미스캔) 보유 제품은 판단 불가 → 제안하지 않는다.
 *   - 바꿀 방향(direction)은 이미 파생된 스텝 스펙(specName) 또는 추천 파이프라인의
 *     대안 제품에서만 가져온다 — 둘 다 없으면 제안 자체를 만들지 않는다.
 *
 *   용어 안전(ADR-117 §7.3): "처방·치료·완치" 금지. 강요 금지(창업자 지시) —
 *   "다 쓰신 뒤에는 ~ 바꿔보는 건 어때요" 권유 톤만.
 */

import type { RoutineStep, ProductCategory } from '@/types/skincare-routine';
import type { ShelfItem } from '@/lib/scan/product-shelf';

/** 적합도가 이 값 미만이면 "낮은 적합도" — 다 쓴 뒤 교체 제안 대상 (compatibilityScore 0-100) */
export const REPLACEMENT_COMPAT_THRESHOLD = 60;

/** 교체 제안 1건 */
export interface RoutineReplacement {
  /** 지금 쓰는 보유 제품의 user_product_shelf 아이템 ID */
  shelfItemId: string;
  /** 지금 쓰는 내 제품 이름 */
  ownedName: string;
  category: ProductCategory;
  /** 재사용한 적합도 점수 (0-100, 발명 아님) */
  compatibilityScore: number;
  /** 바꿔볼 방향 — 스텝 스펙명 우선, 없으면 대안 제품 이름 */
  direction: string;
  /** "다 쓴 뒤 ~ 바꿔보는 건 어때요" 완성 문구 (강요/처방/치료 금지) */
  message: string;
  /** 대안 제품 1개 (추천 파이프라인 기존 결과 — 발명 아님) */
  alternative?: { id: string; name: string; brand?: string };
}

/** 추천 대안 제품 1개 (발명 아님 — 같은 스텝 추천 첫 번째). 이름은 "브랜드 이름" 형태. */
function pickAlternative(
  step: RoutineStep
): { id: string; name: string; brand?: string; display: string } | null {
  const alt = step.recommendedProducts?.[0];
  if (!alt) return null;
  return {
    id: alt.id,
    name: alt.name,
    ...(alt.brand ? { brand: alt.brand } : {}),
    display: alt.brand ? `${alt.brand} ${alt.name}` : alt.name,
  };
}

/** 바꿀 방향 — 스텝 스펙명 우선, 없으면 대안 제품명. 둘 다 없으면 null(지어내지 않음). */
function resolveDirection(step: RoutineStep, alt: { display: string } | null): string | null {
  const spec = step.specName?.trim();
  if (spec) return spec;
  return alt?.display ?? null;
}

/**
 * 루틴에 배치된 보유 제품 중 적합도 낮은 것에 대한 교체 제안 목록.
 *
 * @param steps 루틴 스텝 (ownedProduct·recommendedProducts·specName이 붙은 상태)
 * @param shelfItems 내 화장대 아이템 (compatibilityScore 조회용)
 * @param threshold 낮은 적합도 임계 (기본 60)
 */
export function suggestRoutineReplacements(
  steps: RoutineStep[],
  shelfItems: ShelfItem[],
  threshold = REPLACEMENT_COMPAT_THRESHOLD
): RoutineReplacement[] {
  // 보유 제품 ID → 적합도 (스캔이 저장한 값만 — 없으면 판단 불가)
  const compatById = new Map<string, number>();
  for (const item of shelfItems) {
    if (typeof item.compatibilityScore === 'number') {
      compatById.set(item.id, item.compatibilityScore);
    }
  }

  const seen = new Set<string>(); // 같은 제품이 아침/저녁 양쪽 스텝에 있어도 1회만
  const out: RoutineReplacement[] = [];

  for (const step of steps) {
    const owned = step.ownedProduct;
    if (!owned || seen.has(owned.shelfItemId)) continue;

    const score = compatById.get(owned.shelfItemId);
    // 점수 없거나(미스캔) 충분히 잘 맞으면 제안하지 않는다
    if (typeof score !== 'number' || score >= threshold) continue;

    const alt = pickAlternative(step);
    const direction = resolveDirection(step, alt);
    if (!direction) continue; // 지어낼 게 없으면 제안하지 않는다

    seen.add(owned.shelfItemId);
    out.push({
      shelfItemId: owned.shelfItemId,
      ownedName: owned.name,
      category: step.category,
      compatibilityScore: score,
      direction,
      message: `지금 쓰는 ${owned.name}은 내 피부와 적합도가 조금 낮아요(${score}점). 다 쓰신 뒤에는 ${direction} 같은 제품으로 바꿔보는 건 어때요`,
      ...(alt
        ? {
            alternative: { id: alt.id, name: alt.name, ...(alt.brand ? { brand: alt.brand } : {}) },
          }
        : {}),
    });
  }

  return out;
}
