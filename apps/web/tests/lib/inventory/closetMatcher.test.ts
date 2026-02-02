import { describe, it, expect } from 'vitest';
import {
  calculateMatchScore,
  recommendFromCloset,
  suggestOutfitFromCloset,
  getRecommendationSummary,
} from '@/lib/inventory/closetMatcher';
import type { InventoryItem } from '@/types/inventory';
import type { StyleCategory } from '@/lib/fashion/style-categories';

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

  // ============================================================================
  // K-2 확장: 스타일 카테고리 및 트렌드 매칭
  // ============================================================================

  describe('K-2: 스타일 매칭', () => {
    describe('calculateMatchScore with style option', () => {
      it('스타일 옵션이 있으면 styleScore를 반환해야 한다', () => {
        const item = createMockItem({
          name: '오버사이즈 후드티',
          metadata: { color: [], season: [], occasion: [] },
        });
        const score = calculateMatchScore(item, { style: 'street' });

        expect(score.styleScore).toBeDefined();
        expect(score.styleScore).toBeGreaterThan(0);
      });

      it('스타일 키워드와 매칭되면 높은 점수를 받아야 한다', () => {
        const streetItem = createMockItem({
          name: '오버사이즈 그래픽 티셔츠',
          metadata: { color: [], season: [], occasion: [] },
        });
        const casualItem = createMockItem({
          name: '데님 청바지 스니커즈',
          metadata: { color: [], season: [], occasion: [] },
        });

        const streetScore = calculateMatchScore(streetItem, { style: 'street' });
        const casualScore = calculateMatchScore(casualItem, { style: 'casual' });

        expect(streetScore.styleScore).toBeGreaterThan(60);
        expect(casualScore.styleScore).toBeGreaterThan(60);
      });

      it('매칭되지 않는 스타일은 기본 점수를 받아야 한다', () => {
        const item = createMockItem({
          name: '일반 상품',
          metadata: { color: [], season: [], occasion: [] },
        });
        const score = calculateMatchScore(item, { style: 'formal' });

        expect(score.styleScore).toBe(50);
      });

      it('스타일 옵션이 있으면 가중치가 변경되어야 한다', () => {
        const item = createMockItem({
          name: '블레이저 자켓',
          metadata: { color: ['네이비'], season: ['spring'], occasion: ['formal'] },
        });

        const withStyle = calculateMatchScore(item, {
          personalColor: 'Summer',
          style: 'formal',
        });
        const withoutStyle = calculateMatchScore(item, {
          personalColor: 'Summer',
        });

        // 스타일 옵션이 있으면 styleScore가 total에 영향
        expect(withStyle.styleScore).toBeDefined();
        expect(withoutStyle.styleScore).toBeUndefined();
      });
    });

    describe('calculateMatchScore with trend bonus', () => {
      it('2026 트렌드 아이템은 trendBonus를 받아야 한다', () => {
        const trendItem = createMockItem({
          name: '폴로 셔츠', // 2026 트렌드 아이템
          metadata: { color: [], season: [], occasion: [] },
        });
        const score = calculateMatchScore(trendItem, {});

        expect(score.trendBonus).toBeDefined();
        expect(score.trendBonus).toBeGreaterThan(0);
      });

      it('일반 아이템은 trendBonus가 없어야 한다', () => {
        const normalItem = createMockItem({
          name: '일반 티셔츠',
          metadata: { color: [], season: [], occasion: [] },
        });
        const score = calculateMatchScore(normalItem, {});

        expect(score.trendBonus).toBeUndefined();
      });

      it('트렌드 보너스가 total 점수에 반영되어야 한다', () => {
        const trendItem = createMockItem({
          name: '새깅 팬츠', // 2026 트렌드 아이템
          metadata: { color: [], season: [], occasion: [] },
        });
        const normalItem = createMockItem({
          name: '일반 팬츠',
          metadata: { color: [], season: [], occasion: [] },
        });

        const trendScore = calculateMatchScore(trendItem, {});
        const normalScore = calculateMatchScore(normalItem, {});

        expect(trendScore.total).toBeGreaterThan(normalScore.total);
      });

      it('여러 트렌드 아이템이 인식되어야 한다', () => {
        const trendItems = [
          '폴로 셔츠',
          '새깅 팬츠',
          '테크웨어',
          '니트 베스트',
          '고프코어 아이템',
        ];

        for (const itemName of trendItems) {
          const item = createMockItem({
            name: itemName,
            metadata: { color: [], season: [], occasion: [] },
          });
          const score = calculateMatchScore(item, {});

          expect(score.trendBonus).toBeDefined();
          expect(score.trendBonus).toBeGreaterThan(0);
        }
      });
    });

    describe('recommendFromCloset with style option', () => {
      const items: InventoryItem[] = [
        createMockItem({
          id: 'street-1',
          name: '오버사이즈 후드티',
          subCategory: 'top',
          metadata: { color: [], season: ['spring'], occasion: [] },
        }),
        createMockItem({
          id: 'formal-1',
          name: '슬림핏 블레이저',
          subCategory: 'outer',
          metadata: { color: ['네이비'], season: ['spring', 'autumn'], occasion: ['formal'] },
        }),
        createMockItem({
          id: 'casual-1',
          name: '데님 청바지',
          subCategory: 'bottom',
          metadata: { color: ['블루'], season: ['spring', 'summer'], occasion: ['casual'] },
        }),
      ];

      it('스타일 옵션으로 필터링/정렬되어야 한다', () => {
        const streetRecs = recommendFromCloset(items, { style: 'street' });
        const formalRecs = recommendFromCloset(items, { style: 'formal' });

        // street 스타일 추천에서 오버사이즈 후드티가 상위
        expect(streetRecs[0].item.name).toContain('오버사이즈');

        // formal 스타일 추천에서 블레이저가 상위
        expect(formalRecs[0].item.name).toContain('블레이저');
      });

      it('스타일 매칭 이유가 생성되어야 한다', () => {
        const recommendations = recommendFromCloset(items, { style: 'street' });
        const streetItem = recommendations.find((r) => r.item.id === 'street-1');

        // styleScore가 높으면 스타일 관련 이유 생성
        if (streetItem && streetItem.score.styleScore && streetItem.score.styleScore >= 70) {
          expect(streetItem.reasons.some((r) => r.includes('스트릿'))).toBe(true);
        }
      });

      it('트렌드 아이템에 대한 이유가 생성되어야 한다', () => {
        const trendItems: InventoryItem[] = [
          createMockItem({
            id: 'trend-1',
            name: '폴로 셔츠',
            subCategory: 'top',
            metadata: { color: [], season: ['spring'], occasion: [] },
          }),
        ];

        const recommendations = recommendFromCloset(trendItems, {});
        const trendRec = recommendations[0];

        if (trendRec.score.trendBonus && trendRec.score.trendBonus > 0) {
          expect(trendRec.reasons.some((r) => r.includes('2026') || r.includes('트렌드'))).toBe(true);
        }
      });
    });

    describe('모든 스타일 카테고리 지원', () => {
      const allStyles: StyleCategory[] = [
        'casual',
        'formal',
        'street',
        'minimal',
        'sporty',
        'classic',
        'preppy',
        'hiphop',
        'romantic',
        'workwear',
      ];

      it.each(allStyles)('스타일 "%s"가 calculateMatchScore에서 지원되어야 한다', (style) => {
        const item = createMockItem({
          name: '테스트 아이템',
          metadata: { color: [], season: [], occasion: [] },
        });
        const score = calculateMatchScore(item, { style });

        expect(score.styleScore).toBeDefined();
        expect(score.styleScore).toBeGreaterThanOrEqual(0);
        expect(score.styleScore).toBeLessThanOrEqual(100);
      });

      it.each(allStyles)('스타일 "%s"가 recommendFromCloset에서 지원되어야 한다', (style) => {
        const items = [
          createMockItem({ id: 'test-1', name: '테스트 아이템' }),
        ];

        const recommendations = recommendFromCloset(items, { style });

        expect(recommendations).toBeDefined();
        expect(Array.isArray(recommendations)).toBe(true);
      });
    });

    describe('복합 옵션 조합', () => {
      it('personalColor + style 조합이 작동해야 한다', () => {
        const item = createMockItem({
          name: '오버사이즈 그래픽 티셔츠',
          metadata: { color: ['화이트', '블랙'], season: ['summer'], occasion: [] },
        });

        const score = calculateMatchScore(item, {
          personalColor: 'Winter',
          style: 'street',
        });

        expect(score.colorScore).toBeGreaterThan(0);
        expect(score.styleScore).toBeGreaterThan(50);
      });

      it('bodyType + style 조합이 작동해야 한다', () => {
        const item = createMockItem({
          name: '오버사이즈 스트릿 후드티',
          subCategory: 'top',
          metadata: { color: [], season: [], occasion: [] },
        });

        const score = calculateMatchScore(item, {
          bodyType: 'N', // Natural 체형 - 루즈핏 추천
          style: 'street',
        });

        expect(score.bodyTypeScore).toBeGreaterThanOrEqual(50);
        expect(score.styleScore).toBeGreaterThan(50);
      });

      it('season + style + personalColor 전체 조합이 작동해야 한다', () => {
        const item = createMockItem({
          name: '아이보리 오버사이즈 니트',
          subCategory: 'top',
          metadata: { color: ['아이보리'], season: ['autumn'], occasion: [] },
        });

        const score = calculateMatchScore(item, {
          personalColor: 'Spring',
          bodyType: 'N',
          season: 'autumn',
          style: 'street',
        });

        expect(score.total).toBeGreaterThan(0);
        expect(score.total).toBeLessThanOrEqual(100);
        expect(score.colorScore).toBeDefined();
        expect(score.bodyTypeScore).toBeDefined();
        expect(score.seasonScore).toBeDefined();
        expect(score.styleScore).toBeDefined();
      });
    });
  });
});
