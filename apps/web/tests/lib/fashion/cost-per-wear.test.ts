/**
 * Cost-per-Wear 분석 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  calculateCostPerWear,
  getDeclutterSuggestions,
  getWardrobeInsight,
  getCpwByCategory,
} from '@/lib/fashion/cost-per-wear';
import type { WardrobeItemUsage } from '@/lib/fashion/cost-per-wear';

// 고정 날짜 (2026-03-14)
const NOW = new Date('2026-03-14T00:00:00Z');

function mockItem(overrides: Partial<WardrobeItemUsage> = {}): WardrobeItemUsage {
  return {
    id: 'item-1',
    name: '기본 티셔츠',
    priceKrw: 30000,
    wearCount: 30,
    purchasedAt: new Date('2025-12-14T00:00:00Z'), // 90일 전
    lastWornAt: new Date('2026-03-10T00:00:00Z'),
    category: '상의',
    ...overrides,
  };
}

describe('cost-per-wear', () => {
  // ============================================
  // calculateCostPerWear
  // ============================================
  describe('calculateCostPerWear', () => {
    it('기본 CPW 계산 (30000원 / 30회 = 1000원)', () => {
      const result = calculateCostPerWear(mockItem(), NOW);
      expect(result.costPerWear).toBe(1000);
      expect(result.valueGrade).toBe('excellent');
    });

    it('착용 0회 → CPW = 구매가격, unused 등급', () => {
      const result = calculateCostPerWear(mockItem({ wearCount: 0 }), NOW);
      expect(result.costPerWear).toBe(30000);
      expect(result.valueGrade).toBe('unused');
    });

    it('good 등급 (1001~3000원)', () => {
      const result = calculateCostPerWear(mockItem({ priceKrw: 50000, wearCount: 20 }), NOW);
      expect(result.costPerWear).toBe(2500);
      expect(result.valueGrade).toBe('good');
    });

    it('fair 등급 (3001~10000원)', () => {
      const result = calculateCostPerWear(mockItem({ priceKrw: 50000, wearCount: 10 }), NOW);
      expect(result.costPerWear).toBe(5000);
      expect(result.valueGrade).toBe('fair');
    });

    it('poor 등급 (10001원 이상)', () => {
      const result = calculateCostPerWear(mockItem({ priceKrw: 150000, wearCount: 5 }), NOW);
      expect(result.costPerWear).toBe(30000);
      expect(result.valueGrade).toBe('poor');
    });

    it('보유 기간 계산 (90일)', () => {
      const result = calculateCostPerWear(mockItem(), NOW);
      expect(result.ownershipDays).toBe(90);
    });

    it('주당 평균 착용 횟수 계산', () => {
      const result = calculateCostPerWear(mockItem(), NOW);
      // 30회 / 90일 * 7 = 2.333... → 반올림 2.3
      expect(result.wearsPerWeek).toBe(2.3);
    });

    it('당일 구매 → 보유 기간 최소 1일', () => {
      const result = calculateCostPerWear(mockItem({ purchasedAt: NOW, wearCount: 1 }), NOW);
      expect(result.ownershipDays).toBe(1);
    });

    it('gradeLabel 존재', () => {
      const result = calculateCostPerWear(mockItem(), NOW);
      expect(result.gradeLabel).toBeTruthy();
      expect(typeof result.gradeLabel).toBe('string');
    });

    it('경계값: CPW 정확히 1000원 → excellent', () => {
      const result = calculateCostPerWear(mockItem({ priceKrw: 10000, wearCount: 10 }), NOW);
      expect(result.costPerWear).toBe(1000);
      expect(result.valueGrade).toBe('excellent');
    });

    it('경계값: CPW 정확히 3000원 → good', () => {
      const result = calculateCostPerWear(mockItem({ priceKrw: 30000, wearCount: 10 }), NOW);
      expect(result.costPerWear).toBe(3000);
      expect(result.valueGrade).toBe('good');
    });

    it('경계값: CPW 정확히 10000원 → fair', () => {
      const result = calculateCostPerWear(mockItem({ priceKrw: 100000, wearCount: 10 }), NOW);
      expect(result.costPerWear).toBe(10000);
      expect(result.valueGrade).toBe('fair');
    });
  });

  // ============================================
  // getDeclutterSuggestions
  // ============================================
  describe('getDeclutterSuggestions', () => {
    it('빈 배열 → 빈 결과', () => {
      expect(getDeclutterSuggestions([], NOW)).toHaveLength(0);
    });

    it('한 번도 안 입고 90일 이상 → 정리 추천', () => {
      const items = [
        mockItem({
          wearCount: 0,
          lastWornAt: null,
          purchasedAt: new Date('2025-12-01T00:00:00Z'), // 103일 전
        }),
      ];
      const suggestions = getDeclutterSuggestions(items, NOW);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].reason).toContain('한 번도 입지 않았어요');
    });

    it('미착용 + 고가 → sell 추천', () => {
      const items = [
        mockItem({
          wearCount: 0,
          lastWornAt: null,
          priceKrw: 100000,
          purchasedAt: new Date('2025-12-01T00:00:00Z'),
        }),
      ];
      const suggestions = getDeclutterSuggestions(items, NOW);
      expect(suggestions[0].action).toBe('sell');
    });

    it('미착용 + 저가 → donate 추천', () => {
      const items = [
        mockItem({
          wearCount: 0,
          lastWornAt: null,
          priceKrw: 20000,
          purchasedAt: new Date('2025-12-01T00:00:00Z'),
        }),
      ];
      const suggestions = getDeclutterSuggestions(items, NOW);
      expect(suggestions[0].action).toBe('donate');
    });

    it('90일 미착용 + 저활용(3회 이하) → 정리 추천', () => {
      const items = [
        mockItem({
          wearCount: 2,
          lastWornAt: new Date('2025-12-01T00:00:00Z'), // 103일 전
        }),
      ];
      const suggestions = getDeclutterSuggestions(items, NOW);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].reason).toContain('입지 않았고');
    });

    it('180일 미착용 → 활용도 높아도 정리 추천', () => {
      const items = [
        mockItem({
          wearCount: 50,
          lastWornAt: new Date('2025-09-01T00:00:00Z'), // ~194일 전
        }),
      ];
      const suggestions = getDeclutterSuggestions(items, NOW);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].reason).toContain('6개월');
      expect(suggestions[0].action).toBe('donate');
    });

    it('최근 착용 + 충분한 착용 → 정리 미추천', () => {
      const items = [mockItem()]; // 4일 전 착용, 30회
      const suggestions = getDeclutterSuggestions(items, NOW);
      expect(suggestions).toHaveLength(0);
    });

    it('미착용 90일 미만 → 정리 미추천', () => {
      const items = [
        mockItem({
          wearCount: 0,
          lastWornAt: null,
          purchasedAt: new Date('2026-02-14T00:00:00Z'), // 28일 전
        }),
      ];
      const suggestions = getDeclutterSuggestions(items, NOW);
      expect(suggestions).toHaveLength(0);
    });

    it('여러 아이템 중 일부만 추천', () => {
      const items = [
        mockItem({ id: 'ok', wearCount: 30 }), // 정상
        mockItem({
          id: 'bad',
          wearCount: 0,
          lastWornAt: null,
          purchasedAt: new Date('2025-10-01T00:00:00Z'),
        }), // 미착용
      ];
      const suggestions = getDeclutterSuggestions(items, NOW);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].item.id).toBe('bad');
    });
  });

  // ============================================
  // getWardrobeInsight
  // ============================================
  describe('getWardrobeInsight', () => {
    it('빈 배열 → 기본값 반환', () => {
      const insight = getWardrobeInsight([], NOW);
      expect(insight.totalInvestment).toBe(0);
      expect(insight.averageCpw).toBe(0);
      expect(insight.bestValue).toBeNull();
      expect(insight.worstValue).toBeNull();
      expect(insight.unusedCount).toBe(0);
      expect(insight.declutterSuggestions).toHaveLength(0);
    });

    it('총 투자 금액 계산', () => {
      const items = [mockItem({ priceKrw: 30000 }), mockItem({ priceKrw: 50000, id: 'item-2' })];
      const insight = getWardrobeInsight(items, NOW);
      expect(insight.totalInvestment).toBe(80000);
    });

    it('bestValue = 가장 낮은 CPW 아이템', () => {
      const items = [
        mockItem({ id: 'cheap', priceKrw: 10000, wearCount: 100 }), // CPW 100
        mockItem({ id: 'expensive', priceKrw: 100000, wearCount: 5 }), // CPW 20000
      ];
      const insight = getWardrobeInsight(items, NOW);
      expect(insight.bestValue?.id).toBe('cheap');
    });

    it('worstValue = 가장 높은 CPW 아이템', () => {
      const items = [
        mockItem({ id: 'cheap', priceKrw: 10000, wearCount: 100 }),
        mockItem({ id: 'expensive', priceKrw: 100000, wearCount: 5 }),
      ];
      const insight = getWardrobeInsight(items, NOW);
      expect(insight.worstValue?.id).toBe('expensive');
    });

    it('미착용 아이템 수 계산', () => {
      const items = [
        mockItem({ wearCount: 10 }),
        mockItem({ id: 'unused1', wearCount: 0 }),
        mockItem({ id: 'unused2', wearCount: 0 }),
      ];
      const insight = getWardrobeInsight(items, NOW);
      expect(insight.unusedCount).toBe(2);
    });

    it('착용 아이템만 CPW 평균에 포함', () => {
      const items = [
        mockItem({ priceKrw: 10000, wearCount: 10 }), // CPW 1000
        mockItem({ id: 'u', priceKrw: 50000, wearCount: 0 }), // 미착용 → 제외
      ];
      const insight = getWardrobeInsight(items, NOW);
      expect(insight.averageCpw).toBe(1000);
    });

    it('declutterSuggestions 포함', () => {
      const items = [
        mockItem({
          wearCount: 0,
          lastWornAt: null,
          purchasedAt: new Date('2025-10-01T00:00:00Z'),
        }),
      ];
      const insight = getWardrobeInsight(items, NOW);
      expect(insight.declutterSuggestions.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // getCpwByCategory
  // ============================================
  describe('getCpwByCategory', () => {
    it('빈 배열 → 빈 객체', () => {
      expect(getCpwByCategory([], NOW)).toEqual({});
    });

    it('미착용 아이템 제외', () => {
      const items = [mockItem({ category: '상의', wearCount: 0 })];
      expect(getCpwByCategory(items, NOW)).toEqual({});
    });

    it('카테고리별 평균 CPW', () => {
      const items = [
        mockItem({ id: '1', category: '상의', priceKrw: 20000, wearCount: 10 }), // CPW 2000
        mockItem({ id: '2', category: '상의', priceKrw: 40000, wearCount: 10 }), // CPW 4000
        mockItem({ id: '3', category: '하의', priceKrw: 30000, wearCount: 30 }), // CPW 1000
      ];
      const result = getCpwByCategory(items, NOW);
      expect(result['상의'].averageCpw).toBe(3000); // (2000+4000)/2
      expect(result['상의'].count).toBe(2);
      expect(result['하의'].averageCpw).toBe(1000);
      expect(result['하의'].count).toBe(1);
    });

    it('단일 카테고리', () => {
      const items = [
        mockItem({ category: '아우터', priceKrw: 100000, wearCount: 20 }), // CPW 5000
      ];
      const result = getCpwByCategory(items, NOW);
      expect(result['아우터'].averageCpw).toBe(5000);
      expect(result['아우터'].count).toBe(1);
    });
  });
});
