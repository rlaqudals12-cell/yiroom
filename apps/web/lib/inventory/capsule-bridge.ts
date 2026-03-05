/**
 * 인벤토리-캡슐 브릿지
 * @module lib/inventory/capsule-bridge
 *
 * 인벤토리 아이템과 캡슐 도메인 간 연동 기능 제공.
 * - 도메인별 보유 아이템 조회
 * - 사용 빈도 기반 소진 예측
 * - 재구매 필요 목록
 * - 갭 vs 인벤토리 교차 확인
 */

import { getInventoryItems } from './repository';
import type { InventoryItem, InventoryCategory } from '@/types/inventory';

/** 캡슐 도메인 ID */
export type CapsuleDomain = 'skin' | 'makeup' | 'hair' | 'nutrition' | 'fashion';

/** 카테고리→도메인 매핑 */
const CATEGORY_TO_DOMAIN: Record<InventoryCategory, CapsuleDomain | null> = {
  beauty: 'skin', // 기본은 skin, productType으로 세분화
  closet: 'fashion',
  equipment: null, // 운동장비는 캡슐 도메인에 직접 매핑 안 됨
  supplement: 'nutrition',
  pantry: 'nutrition',
};

/** 뷰티 제품 타입→도메인 세분화 매핑 */
const BEAUTY_TYPE_TO_DOMAIN: Record<string, CapsuleDomain> = {
  스킨케어: 'skin',
  클렌징: 'skin',
  마스크팩: 'skin',
  선케어: 'skin',
  메이크업: 'makeup',
  베이스: 'makeup',
  립: 'makeup',
  아이: 'makeup',
  헤어: 'hair',
  샴푸: 'hair',
  트리트먼트: 'hair',
  바디: 'skin',
};

/** 소진 예측 결과 */
export interface DepletionEstimate {
  itemId: string;
  itemName: string;
  estimatedDate: Date | null;
  daysRemaining: number | null;
  confidence: 'high' | 'medium' | 'low';
}

/** 갭 아이템 (캡슐에서 필요하지만 인벤토리에 없는 것) */
export interface GapItem {
  domain: CapsuleDomain;
  category: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

/** 갭 교차 확인 결과 */
export interface GapCheckResult {
  coverable: GapItem[];
  needPurchase: GapItem[];
}

/**
 * 도메인별 보유 아이템 조회
 * 캡슐 도메인에 해당하는 인벤토리 아이템을 반환
 */
export async function getItemsForCapsule(
  userId: string,
  domain: CapsuleDomain
): Promise<InventoryItem[]> {
  // 도메인→카테고리 역매핑
  const categories = getCategoriesForDomain(domain);
  if (categories.length === 0) return [];

  const allItems: InventoryItem[] = [];

  for (const category of categories) {
    const items = await getInventoryItems(userId, { category });
    allItems.push(...items);
  }

  // 뷰티 카테고리는 productType으로 추가 필터링
  if (domain !== 'fashion' && domain !== 'nutrition') {
    return allItems.filter((item) => {
      if (item.category !== 'beauty') return true;
      const productType = (item.metadata as Record<string, unknown>).productType as string;
      if (!productType) return domain === 'skin'; // 기본값
      return BEAUTY_TYPE_TO_DOMAIN[productType] === domain;
    });
  }

  return allItems;
}

/**
 * 사용 빈도 기반 소진 예측
 * useCount와 createdAt으로 일일 사용률을 추정
 */
export function estimateDepletion(item: InventoryItem): DepletionEstimate {
  const result: DepletionEstimate = {
    itemId: item.id,
    itemName: item.name,
    estimatedDate: null,
    daysRemaining: null,
    confidence: 'low',
  };

  // 사용 기록이 없으면 예측 불가
  if (item.useCount === 0) return result;

  // 유통기한이 있으면 유통기한 우선
  if (item.expiryDate) {
    const expiry = new Date(item.expiryDate);
    const now = new Date();
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      ...result,
      estimatedDate: expiry,
      daysRemaining: Math.max(0, daysRemaining),
      confidence: 'high',
    };
  }

  // 소모품 (영양제 등): remainingServings 기반 예측
  const metadata = item.metadata as Record<string, unknown>;
  if (metadata.remainingServings !== undefined && metadata.remainingServings !== null) {
    const remaining = metadata.remainingServings as number;
    if (remaining <= 0) {
      return { ...result, estimatedDate: new Date(), daysRemaining: 0, confidence: 'high' };
    }

    // 일일 사용률 계산
    const createdAt = new Date(item.createdAt);
    const now = new Date();
    const daysSinceCreated = Math.max(
      1,
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dailyUsageRate = item.useCount / daysSinceCreated;

    if (dailyUsageRate > 0) {
      const daysRemaining = Math.ceil(remaining / dailyUsageRate);
      const estimatedDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
      return {
        ...result,
        estimatedDate,
        daysRemaining,
        confidence: daysSinceCreated > 30 ? 'high' : daysSinceCreated > 7 ? 'medium' : 'low',
      };
    }
  }

  // 뷰티 제품: 개봉일 + 사용기한 기반
  if (metadata.openedAt && metadata.expiresInMonths) {
    const opened = new Date(metadata.openedAt as string);
    const expiresInMs = (metadata.expiresInMonths as number) * 30 * 24 * 60 * 60 * 1000;
    const estimatedDate = new Date(opened.getTime() + expiresInMs);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (estimatedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      ...result,
      estimatedDate,
      daysRemaining: Math.max(0, daysRemaining),
      confidence: 'medium',
    };
  }

  return result;
}

/**
 * 재구매 필요 목록
 * 30일 이내 소진 예상 아이템 반환
 */
export async function getRepurchaseNeeded(
  userId: string,
  daysThreshold: number = 30
): Promise<{ item: InventoryItem; estimate: DepletionEstimate }[]> {
  // 소모품 카테고리만 조회 (의류는 소진 개념 없음)
  const consumableCategories: InventoryCategory[] = ['beauty', 'supplement', 'pantry'];
  const allItems: InventoryItem[] = [];

  for (const category of consumableCategories) {
    const items = await getInventoryItems(userId, { category });
    allItems.push(...items);
  }

  const results: { item: InventoryItem; estimate: DepletionEstimate }[] = [];

  for (const item of allItems) {
    const estimate = estimateDepletion(item);
    if (
      estimate.daysRemaining !== null &&
      estimate.daysRemaining <= daysThreshold &&
      estimate.daysRemaining >= 0
    ) {
      results.push({ item, estimate });
    }
  }

  // 소진 임박 순으로 정렬
  return results.sort(
    (a, b) => (a.estimate.daysRemaining ?? Infinity) - (b.estimate.daysRemaining ?? Infinity)
  );
}

/**
 * 갭 vs 인벤토리 교차 확인
 * 캡슐이 식별한 갭 아이템 중 인벤토리로 커버 가능한 것과 구매 필요한 것을 분리
 */
export async function checkGapAgainstInventory(
  userId: string,
  gaps: GapItem[]
): Promise<GapCheckResult> {
  const coverable: GapItem[] = [];
  const needPurchase: GapItem[] = [];

  // 도메인별로 인벤토리 조회 (캐싱으로 중복 조회 방지)
  const inventoryByDomain = new Map<CapsuleDomain, InventoryItem[]>();

  for (const gap of gaps) {
    if (!inventoryByDomain.has(gap.domain)) {
      const items = await getItemsForCapsule(userId, gap.domain);
      inventoryByDomain.set(gap.domain, items);
    }

    const domainItems = inventoryByDomain.get(gap.domain) ?? [];

    // 갭 카테고리와 인벤토리 카테고리/서브카테고리 매칭
    const hasMatch = domainItems.some(
      (item) =>
        item.name.includes(gap.category) ||
        item.subCategory?.includes(gap.category) ||
        (item.tags && item.tags.some((tag) => gap.category.includes(tag)))
    );

    if (hasMatch) {
      coverable.push(gap);
    } else {
      needPurchase.push(gap);
    }
  }

  return { coverable, needPurchase };
}

/**
 * 도메인→카테고리 역매핑
 */
function getCategoriesForDomain(domain: CapsuleDomain): InventoryCategory[] {
  const categories: InventoryCategory[] = [];

  for (const [category, mappedDomain] of Object.entries(CATEGORY_TO_DOMAIN)) {
    if (mappedDomain === domain) {
      categories.push(category as InventoryCategory);
    }
  }

  // skin/makeup/hair 도메인은 모두 beauty 카테고리에서 필터링
  if (['skin', 'makeup', 'hair'].includes(domain) && !categories.includes('beauty')) {
    categories.push('beauty');
  }

  return categories;
}
