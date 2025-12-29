import { describe, it, expect } from 'vitest';
import {
  calculateMatchScore,
  recommendFromCloset,
  suggestOutfitFromCloset,
  getRecommendationSummary,
} from '@/lib/inventory/closetMatcher';
import type { InventoryItem } from '@/types/inventory';

// 테스트용 아이템 생성 헬퍼
function createMockItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'test-item-1',
    clerkUserId: 'user-1',
    category: 'closet',
    subCategory: 'top',
    name: '아이보리 니트',
    imageUrl: 'https://example.com/image.jpg',
    originalImageUrl: null,
    brand: '테스트 브랜드',
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: {
      color: ['아이보리'],
      season: ['spring', 'autumn'],
      occasion: ['casual'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('closetMatcher', () => {
  describe('calculateMatchScore', () => {
    it('옵션 없이 기본 점수를 반환해야 한다', () => {
      const item = createMockItem();
      const score = calculateMatchScore(item, {});

      expect(score.total).toBe(50);
      expect(score.colorScore).toBe(50);
      expect(score.bodyTypeScore).toBe(50);
      expect(score.seasonScore).toBe(50);
    });

    it('Spring 퍼스널컬러와 아이보리 색상이 잘 매칭되어야 한다', () => {
      const item = createMockItem({
        metadata: {
          color: ['아이보리', '코랄'],
          season: ['spring'],
          occasion: [],
        },
      });
      const score = calculateMatchScore(item, { personalColor: 'Spring' });

      expect(score.colorScore).toBeGreaterThan(70);
    });

    it('Winter 퍼스널컬러와 아이보리 색상은 피해야 할 조합이다', () => {
      const item = createMockItem({
        metadata: {
          color: ['베이지', '머스타드'],
          season: [],
          occasion: [],
        },
      });
      const score = calculateMatchScore(item, { personalColor: 'Winter' });

      expect(score.colorScore).toBeLessThan(50);
    });

    it('체형과 아이템 타입이 매칭되어야 한다', () => {
      // S (스트레이트) 체형에 V넥 니트
      const item = createMockItem({
        name: 'V넥 니트 스웨터',
        subCategory: 'top',
      });
      const score = calculateMatchScore(item, { bodyType: 'S' });

      expect(score.bodyTypeScore).toBeGreaterThanOrEqual(50);
    });

    it('기온에 따라 계절 점수가 변해야 한다', () => {
      // 봄/가을 아이템을 여름 기온에서 테스트
      const item = createMockItem({
        metadata: {
          color: [],
          season: ['spring', 'autumn'],
          occasion: [],
        },
      });
      const summerScore = calculateMatchScore(item, { temp: 28 });
      const springScore = calculateMatchScore(item, { temp: 18 });

      expect(springScore.seasonScore).toBeGreaterThan(summerScore.seasonScore);
    });

    it('상황(occasion)이 매칭되면 보너스 점수가 추가되어야 한다', () => {
      const item = createMockItem({
        metadata: {
          color: [],
          season: [],
          occasion: ['formal'],
        },
      });
      const withOccasion = calculateMatchScore(item, { occasion: 'formal' });
      const withoutOccasion = calculateMatchScore(item, { occasion: 'casual' });

      expect(withOccasion.total).toBeGreaterThan(withoutOccasion.total);
    });
  });

  describe('recommendFromCloset', () => {
    const items: InventoryItem[] = [
      createMockItem({
        id: 'item-1',
        name: '코랄 블라우스',
        subCategory: 'top',
        metadata: { color: ['코랄'], season: ['spring'], occasion: ['casual'] },
      }),
      createMockItem({
        id: 'item-2',
        name: '블랙 티셔츠',
        subCategory: 'top',
        metadata: { color: ['블랙'], season: ['summer'], occasion: ['casual'] },
      }),
      createMockItem({
        id: 'item-3',
        name: '네이비 슬랙스',
        subCategory: 'bottom',
        metadata: { color: ['네이비'], season: ['spring', 'autumn'], occasion: ['formal'] },
      }),
    ];

    it('closet 카테고리 아이템만 추천해야 한다', () => {
      const mixedItems = [
        ...items,
        createMockItem({ id: 'beauty-1', category: 'beauty' as 'closet' }),
      ];
      const recommendations = recommendFromCloset(mixedItems, { limit: 10 });

      expect(recommendations.every((r) => r.item.category === 'closet')).toBe(true);
    });

    it('카테고리 필터가 작동해야 한다', () => {
      const recommendations = recommendFromCloset(items, { category: 'bottom' });

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].item.subCategory).toBe('bottom');
    });

    it('점수 순으로 정렬되어야 한다', () => {
      const recommendations = recommendFromCloset(items, { personalColor: 'Spring' });

      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].score.total).toBeGreaterThanOrEqual(
          recommendations[i].score.total
        );
      }
    });

    it('limit 파라미터가 작동해야 한다', () => {
      const recommendations = recommendFromCloset(items, { limit: 1 });

      expect(recommendations).toHaveLength(1);
    });

    it('추천 이유가 생성되어야 한다', () => {
      const recommendations = recommendFromCloset(items, { personalColor: 'Spring' });
      const coralItem = recommendations.find((r) => r.item.id === 'item-1');

      expect(coralItem?.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('suggestOutfitFromCloset', () => {
    const items: InventoryItem[] = [
      createMockItem({
        id: 'outer-1',
        name: '트렌치코트',
        subCategory: 'outer',
        metadata: { color: ['베이지'], season: ['spring', 'autumn'], occasion: [] },
      }),
      createMockItem({
        id: 'top-1',
        name: '화이트 셔츠',
        subCategory: 'top',
        metadata: { color: ['화이트'], season: ['spring', 'summer'], occasion: ['formal'] },
      }),
      createMockItem({
        id: 'bottom-1',
        name: '네이비 슬랙스',
        subCategory: 'bottom',
        metadata: { color: ['네이비'], season: ['spring', 'autumn'], occasion: ['formal'] },
      }),
      createMockItem({
        id: 'shoes-1',
        name: '로퍼',
        subCategory: 'shoes',
        metadata: { color: ['브라운'], season: ['spring', 'autumn'], occasion: ['formal'] },
      }),
    ];

    it('빈 배열이면 null을 반환해야 한다', () => {
      const suggestion = suggestOutfitFromCloset([], {});

      expect(suggestion).toBeNull();
    });

    it('상의와 하의가 있는 코디를 제안해야 한다', () => {
      const suggestion = suggestOutfitFromCloset(items, {});

      expect(suggestion).not.toBeNull();
      expect(suggestion?.top).toBeDefined();
      expect(suggestion?.bottom).toBeDefined();
    });

    it('추운 날씨(15도 미만)에는 아우터를 포함해야 한다', () => {
      const suggestion = suggestOutfitFromCloset(items, { temp: 10 });

      expect(suggestion?.outer).toBeDefined();
    });

    it('따뜻한 날씨(15도 이상)에는 아우터를 생략할 수 있다', () => {
      const suggestion = suggestOutfitFromCloset(items, { temp: 20 });

      // 아우터가 있을 수도 없을 수도 있음 (needsOuter = false)
      expect(suggestion?.top).toBeDefined();
    });

    it('팁이 생성되어야 한다', () => {
      const suggestion = suggestOutfitFromCloset(items, {
        personalColor: 'Spring',
        bodyType: 'S',
      });

      expect(suggestion?.tips.length).toBeGreaterThan(0);
    });

    it('totalScore가 0-100 범위여야 한다', () => {
      const suggestion = suggestOutfitFromCloset(items, {});

      expect(suggestion?.totalScore).toBeGreaterThanOrEqual(0);
      expect(suggestion?.totalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getRecommendationSummary', () => {
    const items: InventoryItem[] = [
      createMockItem({
        id: 'item-1',
        metadata: { color: ['코랄'], season: ['spring'], occasion: [] },
      }),
      createMockItem({
        id: 'item-2',
        metadata: { color: ['피치'], season: ['spring'], occasion: [] },
      }),
      createMockItem({
        id: 'item-3',
        metadata: { color: ['블랙'], season: ['winter'], occasion: [] },
      }),
    ];

    it('빈 배열이면 빈 요약을 반환해야 한다', () => {
      const summary = getRecommendationSummary([], {});

      // 빈 배열일 때도 요약 객체는 반환됨 (부족한 카테고리 제안 포함)
      expect(summary.wellMatched).toBe(0);
      expect(summary.needsImprovement).toBe(0);
      expect(summary.suggestions.length).toBeGreaterThan(0);
    });

    it('잘 어울리는 아이템과 개선 필요 아이템 수를 반환해야 한다', () => {
      const summary = getRecommendationSummary(items, { personalColor: 'Spring' });

      expect(typeof summary.wellMatched).toBe('number');
      expect(typeof summary.needsImprovement).toBe('number');
    });

    it('제안 목록이 배열이어야 한다', () => {
      const summary = getRecommendationSummary(items, { personalColor: 'Spring' });

      expect(Array.isArray(summary.suggestions)).toBe(true);
    });

    it('Spring 퍼스널컬러에 블랙 아이템은 개선 필요로 분류해야 한다', () => {
      // 블랙은 Spring에 피해야 할 색상이므로 점수가 낮음
      const summary = getRecommendationSummary(items, { personalColor: 'Spring' });

      // 블랙 아이템은 개선 필요 (needsImprovement)로 분류됨
      expect(summary.needsImprovement).toBeGreaterThanOrEqual(1);
    });
  });
});
