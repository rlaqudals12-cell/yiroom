/**
 * assembleDailyRoutine 조립 정본 테스트 (ADR-117 / ADR-118)
 *
 * 웹 루틴 페이지와 /api/routine/daily가 공유하는 조립 함수. 어필리에이트 조회는 곁가지라
 * 빈 값으로 고정하고, 조립 결과(고민·케어 단계·아침/저녁 스텝·shelf-우선 배치·주간 사이클)를 검증.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/skincare/routine-products', () => ({
  getRoutineProductsByCategory: vi.fn().mockResolvedValue([]),
}));

import { assembleDailyRoutine } from '@/lib/skincare';
import type { ShelfItem } from '@/lib/scan/product-shelf';

// 수분·민감 저하 → 장벽 회복 단계, dryness/sensitivity 파생
const scores = {
  hydration: 35,
  oil_level: 60,
  pores: 55,
  pigmentation: 70,
  wrinkles: 65,
  sensitivity: 30,
};

function makeShelfItem(partial: Partial<ShelfItem>): ShelfItem {
  return {
    id: 'shelf-1',
    clerkUserId: 'user-1',
    productName: '테스트 제품',
    productIngredients: [],
    scannedAt: new Date('2026-07-10'),
    scanMethod: 'manual',
    status: 'owned',
    createdAt: new Date('2026-07-10'),
    updatedAt: new Date('2026-07-10'),
    ...partial,
  };
}

describe('assembleDailyRoutine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('지표에서 고민을 파생하고 장벽 회복 단계로 조립한다', async () => {
    const result = await assembleDailyRoutine({
      skinType: 'combination',
      scores,
      goals: [],
      shelfItems: [],
      now: new Date('2026-07-10T09:00:00Z'),
    });

    // dryness·sensitivity 파생 + 정렬
    expect(result.concerns).toContain('dryness');
    expect(result.concerns).toContain('sensitivity');
    // 케어 단계 = 장벽 회복
    expect(result.carePhase.phase).toBe('barrier');
    // 아침/저녁 스텝 존재
    expect(result.morning.length).toBeGreaterThan(0);
    expect(result.evening.length).toBeGreaterThan(0);
    // 주간 사이클 7칸 (장벽 단계이므로 전부 회복의 날)
    expect(result.eveningFocus.weekly.days).toHaveLength(7);
    expect(result.eveningFocus.weekly.days.every((d) => d.focus === 'recovery')).toBe(true);
  });

  it('사용자 목표를 concerns에 union한다', async () => {
    const result = await assembleDailyRoutine({
      skinType: 'normal',
      scores: {
        hydration: 70,
        oil_level: 70,
        pores: 70,
        pigmentation: 70,
        wrinkles: 70,
        sensitivity: 70,
      },
      goals: ['brightening'], // → pigmentation
      shelfItems: [],
      now: new Date('2026-07-10T09:00:00Z'),
    });
    expect(result.concerns).toContain('pigmentation');
  });

  it('보유 제품이 스텝 카테고리와 맞으면 ownedProduct를 배치한다', async () => {
    const shelf = [makeShelfItem({ productName: '데일리 선크림', productBrand: '테스트브랜드' })];
    const result = await assembleDailyRoutine({
      skinType: 'combination',
      scores,
      goals: [],
      shelfItems: shelf,
      now: new Date('2026-07-10T09:00:00Z'),
    });

    // 아침 루틴의 선크림 스텝에 보유 제품이 배치된다
    const owned = result.morning.find((s) => s.ownedProduct);
    expect(owned).toBeTruthy();
    expect(owned?.ownedProduct?.name).toBe('데일리 선크림');
    expect(owned?.category).toBe('sunscreen');
  });
});
