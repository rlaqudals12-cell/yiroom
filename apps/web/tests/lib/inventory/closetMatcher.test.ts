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

    it('Summer 퍼스널컬러와 라이트블루 색상이 잘 매칭되어야 한다', () => {
      // 블루 계열 키워드 부재로 쿨톤 여름 대표색이 기본 점수(50)에 머물던 결함의 회귀 방지
      const item = createMockItem({
        metadata: {
          color: ['라이트블루'],
          season: [],
          occasion: [],
        },
      });
      const score = calculateMatchScore(item, { personalColor: 'Summer' });

      expect(score.colorScore).toBeGreaterThanOrEqual(70);
    });

    it('Summer 퍼스널컬러와 데님 색상이 잘 매칭되어야 한다', () => {
      const item = createMockItem({
        metadata: {
          color: ['데님'],
          season: [],
          occasion: [],
        },
      });
      const score = calculateMatchScore(item, { personalColor: 'Summer' });

      expect(score.colorScore).toBeGreaterThanOrEqual(70);
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

  // ============================================================================
  // T3: 원피스 슬롯 수용 (상·하의 부재 시 한 벌 조립)
  // ============================================================================

  describe('원피스 조립 경로', () => {
    const dressOnly: InventoryItem[] = [
      createMockItem({
        id: 'dress-1',
        name: '네이비 원피스',
        subCategory: 'dress',
        metadata: { color: ['네이비'], season: ['spring'], occasion: ['formal'] },
      }),
      createMockItem({
        id: 'dress-2',
        name: '블랙 원피스',
        subCategory: '원피스',
        metadata: { color: ['블랙'], season: ['spring'], occasion: ['date'] },
      }),
    ];

    it('원피스 2벌만 있어도 코디가 조립되어야 한다', () => {
      const suggestion = suggestOutfitFromCloset(dressOnly, {});

      expect(suggestion).not.toBeNull();
      expect(suggestion?.dress).toBeDefined();
      expect(suggestion?.top).toBeUndefined();
      expect(suggestion?.bottom).toBeUndefined();
      expect(suggestion?.tips.some((t) => t.includes('원피스'))).toBe(true);
    });

    it('상·하의가 모두 있으면 원피스 경로를 쓰지 않아야 한다', () => {
      const withPair: InventoryItem[] = [
        ...dressOnly,
        createMockItem({ id: 'pair-top', subCategory: 'top' }),
        createMockItem({ id: 'pair-bottom', subCategory: 'bottom' }),
      ];
      const suggestion = suggestOutfitFromCloset(withPair, {});

      expect(suggestion?.top).toBeDefined();
      expect(suggestion?.bottom).toBeDefined();
      expect(suggestion?.dress).toBeUndefined();
    });

    it('짝 없는 상의 + 원피스면 상의를 끼워넣지 않아야 한다', () => {
      const lonelyTop: InventoryItem[] = [
        ...dressOnly,
        createMockItem({ id: 'lonely-top', subCategory: 'top' }),
      ];
      const suggestion = suggestOutfitFromCloset(lonelyTop, {});

      expect(suggestion?.dress).toBeDefined();
      expect(suggestion?.top).toBeUndefined();
    });

    it('원피스 보유 시 상·하의 부재를 미등록으로 안내하지 않아야 한다', () => {
      const summary = getRecommendationSummary(dressOnly, {});

      const absentMessage =
        summary.suggestions.find((s) => s.includes('아직 등록 안 됐어요')) ?? '';
      expect(absentMessage).not.toContain('상의');
      expect(absentMessage).not.toContain('하의');
      // 대신 원피스로 조립 가능하다는 사실 + 확장 경로를 안내
      expect(
        summary.suggestions.some((s) => s.includes('원피스 2벌로 코디를 조립할 수 있어요'))
      ).toBe(true);
    });
  });

  // ============================================================================
  // T4: 계절 하드 가드 + 정직한 예외 문구
  // ============================================================================

  describe('계절 하드 가드', () => {
    const winterPadding = createMockItem({
      id: 'winter-top',
      name: '패딩 점퍼',
      subCategory: 'top',
      // 색 점수까지 높게(Spring 적합) 줘서, 가드가 없으면 점수 역전이 일어나는 조건을 만든다
      metadata: { color: ['아이보리', '코랄', '베이지'], season: ['winter'], occasion: [] },
    });
    const summerTee = createMockItem({
      id: 'summer-top',
      name: '반팔 티셔츠',
      subCategory: 'top',
      metadata: { color: ['블랙'], season: ['summer'], occasion: [] },
    });
    const bottom = createMockItem({
      id: 'any-bottom',
      name: '면바지',
      subCategory: 'bottom',
      metadata: { color: ['베이지'], season: ['spring', 'summer'], occasion: [] },
    });

    it('한여름(27도)에는 겨울 전용 아이템을 후보에서 제외해야 한다', () => {
      const recs = recommendFromCloset([winterPadding, summerTee], {
        category: 'top',
        temp: 27,
        personalColor: 'Spring',
      });

      expect(recs).toHaveLength(1);
      expect(recs[0].item.id).toBe('summer-top');
      expect(recs[0].seasonRelaxed).toBeUndefined();
    });

    it('대체 후보가 없으면 완화하되 사유를 결과에 동봉해야 한다', () => {
      const suggestion = suggestOutfitFromCloset([winterPadding, bottom], { temp: 27 });

      expect(suggestion).not.toBeNull();
      expect(suggestion?.top?.item.id).toBe('winter-top');
      expect(suggestion?.top?.seasonRelaxed).toBe(true);
      expect(suggestion?.top?.reasons.some((r) => r.includes('계절이 안 맞지만'))).toBe(true);
      // UI가 그대로 노출할 수 있게 결과 객체에 고지 문구가 실린다
      expect(suggestion?.warnings.some((w) => w.includes('상의') && w.includes('계절'))).toBe(true);
    });

    it('인접 계절(가을 아이템/겨울 기온)은 제외하지 않아야 한다', () => {
      const autumnCoat = createMockItem({
        id: 'autumn-top',
        name: '니트',
        subCategory: 'top',
        metadata: { color: ['그레이'], season: ['autumn'], occasion: [] },
      });
      const recs = recommendFromCloset([autumnCoat], { category: 'top', temp: 0 });

      expect(recs).toHaveLength(1);
      expect(recs[0].seasonRelaxed).toBeUndefined();
    });

    it('시즌 태그가 없는 아이템은 계절 가드로 제외하지 않아야 한다 (추측 금지)', () => {
      const noSeason = createMockItem({
        id: 'no-season-top',
        name: '무지 티셔츠',
        subCategory: 'top',
        metadata: { color: ['화이트'], season: [], occasion: [] },
      });
      const recs = recommendFromCloset([noSeason, winterPadding], { category: 'top', temp: 27 });

      expect(recs.map((r) => r.item.id)).toEqual(['no-season-top']);
    });

    it('계절 완화가 없으면 warnings가 비어 있어야 한다', () => {
      const suggestion = suggestOutfitFromCloset([summerTee, bottom], { temp: 27 });

      expect(suggestion?.warnings).toEqual([]);
    });
  });

  // ============================================================================
  // T6: TPO 칩 실동작화 (태그 보유 우선 필터 + 무태그 폴백 고지)
  // ============================================================================

  describe('상황(TPO) 필터', () => {
    // 무태그 상의에 색 점수 우위를 줘서, 보너스(+10)만으로는 태그 상의가 못 이기는 조건
    const formalTop = createMockItem({
      id: 'formal-top',
      name: '셔츠',
      subCategory: 'top',
      metadata: { color: ['블랙'], season: [], occasion: ['formal'] },
    });
    const untaggedTop = createMockItem({
      id: 'untagged-top',
      name: '니트',
      subCategory: 'top',
      metadata: { color: ['코랄', '피치'], season: [], occasion: [] },
    });
    const casualTop = createMockItem({
      id: 'casual-top',
      name: '맨투맨',
      subCategory: 'top',
      metadata: { color: ['코랄', '피치'], season: [], occasion: ['casual'] },
    });
    const bottom = createMockItem({
      id: 'tpo-bottom',
      name: '슬랙스',
      subCategory: 'bottom',
      metadata: { color: ['네이비'], season: [], occasion: ['formal', 'casual'] },
    });

    it('상황을 고르면 해당 태그를 가진 아이템만 후보가 되어야 한다', () => {
      const recs = recommendFromCloset([formalTop, untaggedTop], {
        category: 'top',
        occasion: 'formal',
        personalColor: 'Spring',
      });

      expect(recs).toHaveLength(1);
      expect(recs[0].item.id).toBe('formal-top');
      expect(recs[0].occasionRelaxed).toBeUndefined();
    });

    it.each([
      ['work', '출근'],
      ['wedding_guest', '하객'],
    ] as const)('%s(%s) 태그도 같은 하드 필터 계약을 따른다', (occasion, _label) => {
      const tagged = createMockItem({
        id: `${occasion}-top`,
        subCategory: 'top',
        metadata: { color: ['블랙'], season: [], occasion: [occasion] },
      });

      const recs = recommendFromCloset([tagged, untaggedTop], {
        category: 'top',
        occasion,
      });

      expect(recs.map((rec) => rec.item.id)).toEqual([`${occasion}-top`]);
    });

    it('칩을 전환하면 결과가 실제로 바뀌어야 한다', () => {
      const closet = [formalTop, casualTop, bottom];

      const formalOutfit = suggestOutfitFromCloset(closet, { occasion: 'formal' });
      const casualOutfit = suggestOutfitFromCloset(closet, { occasion: 'casual' });

      expect(formalOutfit?.top?.item.id).toBe('formal-top');
      expect(casualOutfit?.top?.item.id).toBe('casual-top');
    });

    it('태그 보유 아이템이 없으면 전체 폴백 + 고지해야 한다', () => {
      const suggestion = suggestOutfitFromCloset([untaggedTop, bottom], { occasion: 'workout' });

      expect(suggestion?.top?.item.id).toBe('untagged-top');
      expect(suggestion?.top?.occasionRelaxed).toBe(true);
      expect(suggestion?.top?.reasons.some((r) => r.includes('태그가 없어'))).toBe(true);
      expect(suggestion?.warnings.some((w) => w.includes('운동') && w.includes('태그'))).toBe(true);
    });

    it('상황을 고르지 않으면 필터도 고지도 없어야 한다', () => {
      const recs = recommendFromCloset([formalTop, untaggedTop], { category: 'top' });

      expect(recs).toHaveLength(2);
      expect(recs.every((r) => !r.occasionRelaxed)).toBe(true);
    });
  });

  // ============================================================================
  // T5: 상·하의 쌍 재랭킹 (색 조화가 설명이 아니라 선택에 반영되는지)
  // ============================================================================

  describe('상·하의 쌍 재랭킹', () => {
    const navyBottom = createMockItem({
      id: 'navy-bottom',
      name: '네이비 슬랙스',
      subCategory: 'bottom',
      metadata: { color: ['네이비'], season: [], occasion: [] },
    });

    it('기본 점수가 같으면 색 조화가 좋은 쌍을 골라야 한다', () => {
      // Winter 기준 화이트·네이비 모두 베스트 컬러 → 기본 점수 동점.
      // 톤온톤(네이비+네이비)이 무채색+컬러(화이트+네이비)보다 조화 가점이 높다
      const whiteTop = createMockItem({
        id: 'white-top',
        name: '화이트 블라우스',
        subCategory: 'top',
        metadata: { color: ['화이트'], season: [], occasion: [] },
      });
      const navyTop = createMockItem({
        id: 'navy-top',
        name: '네이비 블라우스',
        subCategory: 'top',
        metadata: { color: ['네이비'], season: [], occasion: [] },
      });

      const options = { personalColor: 'Winter' as const };
      // 재랭킹이 없으면 동점 상위(입력 순서상 먼저인 화이트)가 뽑힌다
      const topOnly = recommendFromCloset([whiteTop, navyTop, navyBottom], {
        ...options,
        category: 'top',
      });
      expect(topOnly[0].item.id).toBe('white-top');
      expect(topOnly[0].score.total).toBe(topOnly[1].score.total);

      const suggestion = suggestOutfitFromCloset([whiteTop, navyTop, navyBottom], options);
      expect(suggestion?.top?.item.id).toBe('navy-top');
      expect(suggestion?.bottom?.item.id).toBe('navy-bottom');
    });

    it('색상명이 hex로 안 풀리면 기존 순위와 동일해야 한다 (회귀 없음)', () => {
      const unknownColorTop = createMockItem({
        id: 'unknown-top-a',
        name: '무지 블라우스',
        subCategory: 'top',
        metadata: { color: ['형광'], season: [], occasion: [] },
      });
      const unknownColorTop2 = createMockItem({
        id: 'unknown-top-b',
        name: '체크 블라우스',
        subCategory: 'top',
        metadata: { color: ['체크무늬'], season: [], occasion: [] },
      });
      const unknownBottom = createMockItem({
        id: 'unknown-bottom',
        name: '무지 슬랙스',
        subCategory: 'bottom',
        metadata: { color: ['형광'], season: [], occasion: [] },
      });

      const closet = [unknownColorTop, unknownColorTop2, unknownBottom];
      const baseTop = recommendFromCloset(closet, { category: 'top' })[0];
      const suggestion = suggestOutfitFromCloset(closet, {});

      expect(suggestion?.top?.item.id).toBe(baseTop.item.id);
      expect(suggestion?.bottom?.item.id).toBe('unknown-bottom');
    });

    it('같은 입력이면 항상 같은 조합을 반환해야 한다 (결정론)', () => {
      const closet = [
        createMockItem({
          id: 'det-top-1',
          name: '코랄 블라우스',
          subCategory: 'top',
          metadata: { color: ['코랄'], season: ['spring'], occasion: ['casual'] },
        }),
        createMockItem({
          id: 'det-top-2',
          name: '민트 니트',
          subCategory: 'top',
          metadata: { color: ['민트'], season: ['spring'], occasion: ['casual'] },
        }),
        createMockItem({
          id: 'det-bottom-1',
          name: '베이지 면바지',
          subCategory: 'bottom',
          metadata: { color: ['베이지'], season: ['spring'], occasion: ['casual'] },
        }),
        createMockItem({
          id: 'det-bottom-2',
          name: '데님 청바지',
          subCategory: 'bottom',
          metadata: { color: ['데님'], season: ['spring'], occasion: ['casual'] },
        }),
      ];
      const options = { personalColor: 'Spring' as const, bodyType: 'N' as const, temp: 18 };

      const first = suggestOutfitFromCloset(closet, options);
      const second = suggestOutfitFromCloset(closet, options);

      expect(first?.top?.item.id).toBe(second?.top?.item.id);
      expect(first?.bottom?.item.id).toBe(second?.bottom?.item.id);
      expect(first?.totalScore).toBe(second?.totalScore);
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

    it('total에 옷장 전체 벌 수를 반환해야 한다 (closet 외 카테고리 제외)', () => {
      const mixed = [...items, createMockItem({ id: 'beauty-1', category: 'beauty' as 'closet' })];
      const summary = getRecommendationSummary(mixed, {});

      expect(summary.total).toBe(3);
    });

    it('0벌 카테고리는 "아직 등록 안 됐어요", 1벌 카테고리는 "1벌뿐"으로 분리 안내해야 한다', () => {
      // 상의 1벌 + 하의 2벌 → 상의=빈약(1벌뿐), 아우터·신발=부재(없어요), 하의=안내 없음
      const splitItems: InventoryItem[] = [
        createMockItem({ id: 'top-1', subCategory: 'top' }),
        createMockItem({ id: 'bottom-1', subCategory: 'bottom' }),
        createMockItem({ id: 'bottom-2', subCategory: 'bottom' }),
      ];
      const summary = getRecommendationSummary(splitItems, {});

      const absentMessage = summary.suggestions.find((s) => s.includes('아직 등록 안 됐어요'));
      const thinMessage = summary.suggestions.find((s) => s.includes('1벌뿐'));

      // 0벌(아우터·신발)은 부재 안내에만 등장
      expect(absentMessage).toContain('아우터');
      expect(absentMessage).toContain('신발');
      // 보유 1벌(상의)은 부재 안내에 섞이지 않고 '1벌뿐' 안내로 분류 (진행 안내와 정합)
      expect(absentMessage).not.toContain('상의');
      expect(thinMessage).toContain('상의');
      // 2벌 이상(하의)은 어느 안내에도 없음
      expect(absentMessage).not.toContain('하의');
      expect(thinMessage).not.toContain('하의');
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
        const trendItems = ['폴로 셔츠', '새깅 팬츠', '테크웨어', '니트 베스트', '고프코어 아이템'];

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
          expect(trendRec.reasons.some((r) => r.includes('2026') || r.includes('트렌드'))).toBe(
            true
          );
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
        const items = [createMockItem({ id: 'test-1', name: '테스트 아이템' })];

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

  // ============================================================================
  // 실데이터 형상: sub_category에 한글 세부종류 저장 (코디 영구 불발 근본 수리 검증)
  // ============================================================================

  describe('한글 sub_category 실데이터 형상', () => {
    // 저장측(closet/add)이 실제로 만드는 형상 — sub_category='티셔츠' 등 한글 세부종류
    const koreanItems: InventoryItem[] = [
      createMockItem({
        id: 'ko-top-1',
        name: '화이트 티셔츠',
        subCategory: '티셔츠',
        metadata: { color: ['화이트'], season: ['spring', 'summer'], occasion: ['casual'] },
      }),
      createMockItem({
        id: 'ko-bottom-1',
        name: '연청 청바지',
        subCategory: '청바지',
        metadata: { color: ['블루'], season: ['spring', 'autumn'], occasion: ['casual'] },
      }),
      createMockItem({
        id: 'ko-shoes-1',
        name: '흰색 스니커즈',
        subCategory: '스니커즈',
        metadata: { color: ['화이트'], season: ['spring'], occasion: ['casual'] },
      }),
    ];

    it('recommendFromCloset 카테고리 필터가 한글 sub_category를 인식해야 한다', () => {
      const tops = recommendFromCloset(koreanItems, { category: 'top' });
      const bottoms = recommendFromCloset(koreanItems, { category: 'bottom' });

      expect(tops).toHaveLength(1);
      expect(tops[0].item.id).toBe('ko-top-1');
      expect(bottoms).toHaveLength(1);
      expect(bottoms[0].item.id).toBe('ko-bottom-1');
    });

    it('한글 sub_category만으로도 코디가 조립되어야 한다', () => {
      const suggestion = suggestOutfitFromCloset(koreanItems, {});

      expect(suggestion).not.toBeNull();
      expect(suggestion?.top?.item.id).toBe('ko-top-1');
      expect(suggestion?.bottom?.item.id).toBe('ko-bottom-1');
      expect(suggestion?.shoes?.item.id).toBe('ko-shoes-1');
    });

    it('한글·영문 혼재 옷장(구 폴백 행 공존)에서도 코디가 조립되어야 한다', () => {
      const mixed: InventoryItem[] = [
        createMockItem({
          id: 'en-top-1',
          name: '화이트 셔츠',
          subCategory: 'top',
          metadata: { color: ['화이트'], season: ['spring'], occasion: [] },
        }),
        createMockItem({
          id: 'ko-bottom-2',
          name: '검정 슬랙스',
          subCategory: '슬랙스',
          metadata: { color: ['블랙'], season: ['spring'], occasion: ['formal'] },
        }),
      ];
      const suggestion = suggestOutfitFromCloset(mixed, {});

      expect(suggestion).not.toBeNull();
      expect(suggestion?.top?.item.id).toBe('en-top-1');
      expect(suggestion?.bottom?.item.id).toBe('ko-bottom-2');
    });

    it('목록 밖 한글이라도 metadata.clothingCategory가 있으면 슬롯에 포함되어야 한다', () => {
      // 신규 저장 경로: AI가 '후드티'(목록 밖)를 반환해도 폼 대분류가 metadata에 생존
      const withMetadata: InventoryItem[] = [
        createMockItem({
          id: 'meta-top-1',
          name: '그레이 후드티',
          subCategory: '후드티',
          metadata: {
            color: ['그레이'],
            season: ['spring'],
            occasion: ['casual'],
            clothingCategory: 'top',
          },
        }),
        createMockItem({
          id: 'ko-bottom-3',
          name: '조거팬츠',
          subCategory: '조거팬츠',
          metadata: { color: ['블랙'], season: ['spring'], occasion: ['casual'] },
        }),
      ];
      const suggestion = suggestOutfitFromCloset(withMetadata, {});

      expect(suggestion).not.toBeNull();
      expect(suggestion?.top?.item.id).toBe('meta-top-1');
    });

    it('목록 밖 한글 + metadata 부재(구 데이터 잔여)는 슬롯에서 제외되어야 한다', () => {
      // 수용된 잔여: 미매핑 아이템은 지어내지 않고 정직하게 제외
      const unmapped: InventoryItem[] = [
        createMockItem({
          id: 'unknown-1',
          name: '정체불명 상의',
          subCategory: '후드티',
          metadata: { color: [], season: [], occasion: [] },
        }),
      ];
      const tops = recommendFromCloset(unmapped, { category: 'top' });

      expect(tops).toHaveLength(0);
    });

    it('한글 sub_category 아이템에도 체형 점수가 계산되어야 한다', () => {
      // '니트'는 top 목록의 한글 세부종류 — S 체형 top 추천 키워드('니트')와 이름 매칭
      const item = createMockItem({
        name: '아이보리 니트',
        subCategory: '니트',
        metadata: { color: ['아이보리'], season: ['autumn'], occasion: [] },
      });
      const score = calculateMatchScore(item, { bodyType: 'S' });

      expect(score.bodyTypeScore).toBeGreaterThan(50);
    });

    it('getRecommendationSummary가 한글 sub_category를 대분류로 집계해야 한다', () => {
      // top('티셔츠')·bottom('청바지')·shoes('스니커즈') 각 1벌 → '1벌뿐' 안내에 포함,
      // 단 '상의가 없다'류의 오집계(unknown 처리·0벌 취급)는 아니어야 한다
      const summary = getRecommendationSummary(koreanItems, {});

      // 아우터 0벌은 반드시 부재(미등록) 안내에 포함
      expect(
        summary.suggestions.some((s) => s.includes('아우터') && s.includes('아직 등록 안 됐어요'))
      ).toBe(true);
      // 보유 1벌인 상의는 부재가 아니라 '1벌뿐' 안내로 분류
      expect(summary.suggestions.some((s) => s.includes('상의') && s.includes('1벌뿐'))).toBe(true);
    });
  });
});

// ============================================================================
// 시즌 라벨 한국어화 — 사용자 대면 문구에 원시 코드값('Spring')을 흘리지 않는다.
// 매칭·스코어링은 코드값 그대로 두고 문구 생성 시점에만 라벨로 바꾼다.
// ============================================================================

describe('closetMatcher 문구 — 퍼스널컬러 라벨', () => {
  it('추천 이유에 영문 시즌명 대신 한국어 라벨을 쓴다', () => {
    const item = createMockItem({
      id: 'spring-top',
      subCategory: '티셔츠',
      metadata: { color: ['아이보리', '코랄'], season: ['spring'], occasion: [] },
    });

    const [recommendation] = recommendFromCloset([item], {
      personalColor: 'Spring',
      category: 'top',
    });

    expect(recommendation.reasons).toContain('봄 웜톤 컬러와 잘 어울려요');
    expect(recommendation.reasons.join(' ')).not.toContain('Spring');
  });

  it('코디 팁에 영문 시즌명 대신 한국어 라벨을 쓴다', () => {
    const items = [
      createMockItem({
        id: 'top-1',
        subCategory: '티셔츠',
        metadata: { color: ['블랙'], season: [], occasion: [] },
      }),
      createMockItem({
        id: 'bottom-1',
        subCategory: '슬랙스',
        metadata: { color: ['차콜'], season: [], occasion: [] },
      }),
    ];

    const suggestion = suggestOutfitFromCloset(items, { personalColor: 'Winter' });

    expect(suggestion?.tips).toContain('겨울 쿨톤 색상을 중심으로 코디했어요');
    expect(suggestion?.tips.join(' ')).not.toContain('Winter');
  });

  it('요약 제안에 영문 시즌명 대신 한국어 라벨을 쓴다', () => {
    // 색 정보가 없어 잘 맞는 옷이 0벌 → 퍼스널컬러 기반 보완 제안이 뜬다
    const items = [
      createMockItem({
        id: 'plain-1',
        subCategory: '티셔츠',
        metadata: { color: [], season: [], occasion: [] },
      }),
    ];

    const summary = getRecommendationSummary(items, { personalColor: 'Autumn' });

    expect(summary.suggestions).toContain('가을 웜톤에 어울리는 옷을 추가해보세요');
    expect(summary.suggestions.join(' ')).not.toContain('Autumn');
  });
});
