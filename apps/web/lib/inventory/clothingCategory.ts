/**
 * 의류 대분류 정규화 유틸
 *
 * 근본 원인: 저장측은 sub_category에 한글 세부종류('티셔츠')를 넣고,
 * 조립기(closetMatcher)는 영문 대분류('top') 완전일치로 필터해 코디가 영구 불발됐다.
 * 이 유틸이 두 형상(한글 세부종류/영문 대분류)과 신규 저장 경로(metadata.clothingCategory)를
 * 하나의 영문 대분류로 정규화한다.
 *
 * @module lib/inventory/clothingCategory
 */

import type { ClothingCategory } from '@/types/inventory';
import { CLOTHING_SUB_CATEGORIES } from '@/types/inventory';

const CLOTHING_CATEGORIES = Object.keys(CLOTHING_SUB_CATEGORIES) as ClothingCategory[];

// 한글 세부종류 → 영문 대분류 역인덱스 — 모듈 로드 시 1회 구성 (호출마다 재구성 방지)
const SUB_TO_CATEGORY: ReadonlyMap<string, ClothingCategory> = (() => {
  const map = new Map<string, ClothingCategory>();
  for (const category of CLOTHING_CATEGORIES) {
    for (const sub of CLOTHING_SUB_CATEGORIES[category]) {
      map.set(sub, category);
    }
  }
  return map;
})();

function isClothingCategory(value: unknown): value is ClothingCategory {
  return typeof value === 'string' && (CLOTHING_CATEGORIES as string[]).includes(value);
}

/**
 * 아이템의 의류 대분류를 정규화해 반환한다.
 *
 * 우선순위:
 * 1. metadata.clothingCategory — 신규 저장 경로가 보존한 영문 대분류
 *    (AI가 목록 밖 한글 세부종류('후드티' 등)를 반환해도 폼의 대분류가 생존)
 * 2. sub_category가 이미 영문 대분류인 구 폴백 행 호환 (pass-through)
 * 3. CLOTHING_SUB_CATEGORIES 역인덱스로 한글 세부종류('티셔츠') → 영문 대분류('top')
 * 4. 미매핑이면 null — 추측하지 않는다 (해당 아이템은 코디 슬롯에서 제외)
 *
 * @param item subCategory와 metadata만 있으면 InventoryItem/ClothingItem 모두 수용
 */
export function resolveClothingCategory(item: {
  subCategory: string | null;
  metadata?: unknown;
}): ClothingCategory | null {
  // ① 신규 저장 경로가 보존한 대분류 (metadata는 DB JSONB라 형태 검증 후에만 신뢰)
  const meta = item.metadata as Record<string, unknown> | null | undefined;
  const fromMetadata = meta?.clothingCategory;
  if (isClothingCategory(fromMetadata)) return fromMetadata;

  // ② 영문 대분류 pass-through (구 폴백 행: sub_category='top' 등)
  if (isClothingCategory(item.subCategory)) return item.subCategory;

  // ③ 한글 세부종류 역매핑
  if (typeof item.subCategory === 'string') {
    const mapped = SUB_TO_CATEGORY.get(item.subCategory.trim());
    if (mapped) return mapped;
  }

  // ④ 미매핑 — null (조립기·집계에서 정직하게 제외)
  return null;
}
