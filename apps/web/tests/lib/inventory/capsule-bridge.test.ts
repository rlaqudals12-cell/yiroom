import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository
vi.mock('@/lib/inventory/repository', () => ({
  getInventoryItems: vi.fn(),
}));

import {
  getItemsForCapsule,
  estimateDepletion,
  getRepurchaseNeeded,
  checkGapAgainstInventory,
} from '@/lib/inventory/capsule-bridge';
import type { GapItem } from '@/lib/inventory/capsule-bridge';
import { getInventoryItems } from '@/lib/inventory/repository';
import type { InventoryItem } from '@/types/inventory';

// 테스트용 아이템 팩토리
function createItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    clerkUserId: 'user-1',
    category: 'beauty',
    subCategory: null,
    name: '수분 크림',
    imageUrl: '/img.jpg',
    originalImageUrl: null,
    brand: '이니스프리',
    tags: ['보습', '수분'],
    isFavorite: false,
    useCount: 10,
    lastUsedAt: '2026-02-20',
    expiryDate: null,
    metadata: { productType: '스킨케어' },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

describe('getItemsForCapsule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return beauty items for skin domain', async () => {
    const items = [
      createItem({ id: 'a', metadata: { productType: '스킨케어' } }),
      createItem({ id: 'b', metadata: { productType: '클렌징' } }),
    ];
    vi.mocked(getInventoryItems).mockResolvedValue(items);

    const result = await getItemsForCapsule('user-1', 'skin');

    expect(getInventoryItems).toHaveBeenCalledWith('user-1', { category: 'beauty' });
    expect(result).toHaveLength(2);
  });

  it('should filter beauty items by productType for makeup domain', async () => {
    const items = [
      createItem({ id: 'a', metadata: { productType: '스킨케어' } }),
      createItem({ id: 'b', metadata: { productType: '메이크업' } }),
      createItem({ id: 'c', metadata: { productType: '립' } }),
    ];
    vi.mocked(getInventoryItems).mockResolvedValue(items);

    const result = await getItemsForCapsule('user-1', 'makeup');

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(['b', 'c']);
  });

  it('should return closet items for fashion domain', async () => {
    const items = [createItem({ id: 'a', category: 'closet', name: '니트' })];
    vi.mocked(getInventoryItems).mockResolvedValue(items);

    const result = await getItemsForCapsule('user-1', 'fashion');

    expect(getInventoryItems).toHaveBeenCalledWith('user-1', { category: 'closet' });
    expect(result).toHaveLength(1);
  });

  it('should return supplement + pantry items for nutrition domain', async () => {
    vi.mocked(getInventoryItems)
      .mockResolvedValueOnce([createItem({ id: 's1', category: 'supplement' })])
      .mockResolvedValueOnce([createItem({ id: 'p1', category: 'pantry' })]);

    const result = await getItemsForCapsule('user-1', 'nutrition');

    expect(getInventoryItems).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('should return empty for domain with no matching items', async () => {
    vi.mocked(getInventoryItems).mockResolvedValue([]);

    const result = await getItemsForCapsule('user-1', 'hair');

    expect(result).toHaveLength(0);
  });
});

describe('estimateDepletion', () => {
  it('should return null estimate for unused items', () => {
    const item = createItem({ useCount: 0 });
    const estimate = estimateDepletion(item);

    expect(estimate.estimatedDate).toBeNull();
    expect(estimate.daysRemaining).toBeNull();
    expect(estimate.confidence).toBe('low');
  });

  it('should use expiryDate when available', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    const item = createItem({ expiryDate: futureDate.toISOString(), useCount: 5 });
    const estimate = estimateDepletion(item);

    expect(estimate.daysRemaining).toBe(15);
    expect(estimate.confidence).toBe('high');
  });

  it('should estimate from remainingServings', () => {
    const fortyDaysAgo = new Date();
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

    const item = createItem({
      useCount: 40, // 40일간 40번 사용 = 하루 1회
      createdAt: fortyDaysAgo.toISOString(),
      metadata: { remainingServings: 60 }, // 60회분 남음
    });
    const estimate = estimateDepletion(item);

    // 하루 1회 × 60회 = 약 60일
    expect(estimate.daysRemaining).toBeGreaterThan(55);
    expect(estimate.daysRemaining).toBeLessThan(65);
    expect(estimate.confidence).toBe('high'); // 40일 > 30일 기준
  });

  it('should return 0 days for empty servings', () => {
    const item = createItem({
      useCount: 10,
      metadata: { remainingServings: 0 },
    });
    const estimate = estimateDepletion(item);

    expect(estimate.daysRemaining).toBe(0);
    expect(estimate.confidence).toBe('high');
  });

  it('should estimate from openedAt + expiresInMonths for beauty items', () => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const item = createItem({
      useCount: 20,
      metadata: {
        productType: '스킨케어',
        openedAt: twoMonthsAgo.toISOString(),
        expiresInMonths: 6,
      },
    });
    const estimate = estimateDepletion(item);

    // 6개월 사용기한 - 2개월 경과 = 약 4개월(~120일) 남음
    expect(estimate.daysRemaining).toBeGreaterThan(100);
    expect(estimate.daysRemaining).toBeLessThan(140);
    expect(estimate.confidence).toBe('medium');
  });
});

describe('getRepurchaseNeeded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return items expiring within threshold', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 10);
    const later = new Date();
    later.setDate(later.getDate() + 60);

    vi.mocked(getInventoryItems)
      .mockResolvedValueOnce([
        createItem({ id: 'exp-soon', expiryDate: soon.toISOString(), useCount: 1 }),
        createItem({ id: 'exp-later', expiryDate: later.toISOString(), useCount: 1 }),
      ])
      .mockResolvedValueOnce([]) // supplement
      .mockResolvedValueOnce([]); // pantry

    const result = await getRepurchaseNeeded('user-1', 30);

    expect(result).toHaveLength(1);
    expect(result[0].item.id).toBe('exp-soon');
  });

  it('should sort by days remaining ascending', async () => {
    const in5days = new Date();
    in5days.setDate(in5days.getDate() + 5);
    const in15days = new Date();
    in15days.setDate(in15days.getDate() + 15);

    vi.mocked(getInventoryItems)
      .mockResolvedValueOnce([
        createItem({ id: 'later', expiryDate: in15days.toISOString(), useCount: 1 }),
        createItem({ id: 'sooner', expiryDate: in5days.toISOString(), useCount: 1 }),
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await getRepurchaseNeeded('user-1', 30);

    expect(result[0].item.id).toBe('sooner');
    expect(result[1].item.id).toBe('later');
  });

  it('should return empty when nothing needs repurchase', async () => {
    vi.mocked(getInventoryItems)
      .mockResolvedValueOnce([createItem({ useCount: 0 })]) // 사용 기록 없음
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await getRepurchaseNeeded('user-1');

    expect(result).toHaveLength(0);
  });
});

describe('checkGapAgainstInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should identify coverable gaps', async () => {
    vi.mocked(getInventoryItems).mockResolvedValue([
      createItem({ name: '보습 크림', tags: ['보습'] }),
    ]);

    const gaps: GapItem[] = [
      { domain: 'skin', category: '보습', description: '보습 제품 필요', priority: 'high' },
    ];

    const result = await checkGapAgainstInventory('user-1', gaps);

    expect(result.coverable).toHaveLength(1);
    expect(result.needPurchase).toHaveLength(0);
  });

  it('should identify gaps needing purchase', async () => {
    vi.mocked(getInventoryItems).mockResolvedValue([
      createItem({ name: '클렌저', tags: ['클렌징'] }),
    ]);

    const gaps: GapItem[] = [
      { domain: 'skin', category: '선크림', description: '자외선 차단 필요', priority: 'high' },
    ];

    const result = await checkGapAgainstInventory('user-1', gaps);

    expect(result.coverable).toHaveLength(0);
    expect(result.needPurchase).toHaveLength(1);
  });

  it('should handle multiple domains', async () => {
    vi.mocked(getInventoryItems)
      .mockResolvedValueOnce([createItem({ name: '세럼', category: 'beauty' })])
      .mockResolvedValueOnce([createItem({ name: '니트', category: 'closet' })]);

    const gaps: GapItem[] = [
      { domain: 'skin', category: '세럼', description: '세럼 필요', priority: 'medium' },
      { domain: 'fashion', category: '코트', description: '아우터 필요', priority: 'low' },
    ];

    const result = await checkGapAgainstInventory('user-1', gaps);

    expect(result.coverable).toHaveLength(1);
    expect(result.coverable[0].category).toBe('세럼');
    expect(result.needPurchase).toHaveLength(1);
    expect(result.needPurchase[0].category).toBe('코트');
  });

  it('should cache inventory lookups per domain', async () => {
    vi.mocked(getInventoryItems).mockResolvedValue([]);

    const gaps: GapItem[] = [
      { domain: 'skin', category: '크림', description: '', priority: 'medium' },
      { domain: 'skin', category: '세럼', description: '', priority: 'low' },
    ];

    await checkGapAgainstInventory('user-1', gaps);

    // 같은 도메인(skin)은 한 번만 조회
    expect(getInventoryItems).toHaveBeenCalledTimes(1);
  });
});
