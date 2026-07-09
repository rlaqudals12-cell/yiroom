/**
 * 캡슐 화장대 — 중복 자산 지적 ("덜 사게도 말해준다", ADR-117 루틴 v2)
 *
 * @module lib/skincare/capsule-vanity
 * @description
 *   보유 제품에서 역할이 겹치는 것을 찾아 알려준다 — 새로 사기 전에 참고하도록.
 *   캡슐 옷장 이론의 "중복 아이템 지적"을 화장대로 전이(리서치 §5.2). 어필리에이트와
 *   충돌하지 않는다(신뢰 = 리텐션 → 실수요만 구매 연결).
 */

import type { ShelfItem } from '@/lib/scan/product-shelf';
import type { ProductCategory } from '@/types/skincare-routine';
import { detectProductCategory } from './shelf-routine-sync';
import { detectItemActives, ACTIVE_INGREDIENT_CATEGORIES } from './active-categories';

/** 중복 자산 알림 */
export interface RedundancyNote {
  /** 겹치는 역할(제품 카테고리 라벨 또는 활성 라벨) */
  category: string;
  /** 해당 역할의 보유 개수 */
  count: number;
  message: string;
}

/** 같은 제품 카테고리 중복으로 볼 최소 개수 */
const CATEGORY_REDUNDANT_MIN = 3;
/** 같은 활성 카테고리 중복으로 볼 최소 개수 */
const ACTIVE_REDUNDANT_MIN = 2;

/** 제품 카테고리 → 한국어 라벨 */
const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cleanser: '클렌저',
  toner: '토너',
  essence: '에센스',
  serum: '세럼',
  ampoule: '앰플',
  cream: '크림',
  sunscreen: '선크림',
  mask: '마스크',
  eye_cream: '아이크림',
  oil: '페이스오일',
  spot_treatment: '스팟 트리트먼트',
};

function redundancyMessage(label: string, count: number): string {
  return `비슷한 역할의 ${label}가 ${count}개 있어요 — 새로 사기 전에 참고해요`;
}

/**
 * 보유 제품(owned)에서 중복 역할 탐지 (결정론적).
 * 1) 같은 제품 카테고리 3개 이상, 2) 같은 활성 카테고리 2개 이상.
 * count 내림차순 → 라벨 오름차순으로 정렬(결정론).
 */
export function findRedundantProducts(shelfItems: ShelfItem[]): RedundancyNote[] {
  const owned = shelfItems.filter((item) => item.status === 'owned');
  const notes: RedundancyNote[] = [];

  // 1. 제품 카테고리 중복
  const categoryCount = new Map<ProductCategory, number>();
  for (const item of owned) {
    const category = detectProductCategory(item);
    if (!category) continue;
    categoryCount.set(category, (categoryCount.get(category) ?? 0) + 1);
  }
  for (const [category, count] of categoryCount) {
    if (count >= CATEGORY_REDUNDANT_MIN) {
      const label = CATEGORY_LABELS[category];
      notes.push({ category: label, count, message: redundancyMessage(label, count) });
    }
  }

  // 2. 활성 성분 카테고리 중복 (제품마다 보유 활성 1회씩 카운트)
  const activeCount = new Map<string, number>();
  for (const item of owned) {
    for (const active of detectItemActives(item)) {
      activeCount.set(active, (activeCount.get(active) ?? 0) + 1);
    }
  }
  for (const [active, count] of activeCount) {
    if (count >= ACTIVE_REDUNDANT_MIN) {
      const label =
        ACTIVE_INGREDIENT_CATEGORIES[active as keyof typeof ACTIVE_INGREDIENT_CATEGORIES].label;
      notes.push({ category: label, count, message: redundancyMessage(label, count) });
    }
  }

  return notes.sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}
