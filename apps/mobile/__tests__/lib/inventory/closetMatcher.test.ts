/**
 * 옷장 매칭 로직 테스트
 * 웹 tests/lib/inventory/closetMatcher.test.ts 대응 포팅 (옷장 신뢰 체인 패리티)
 */

import {
  calculateMatchScore,
  getRecommendationSummary,
  recommendFromCloset,
  suggestOutfitFromCloset,
} from '../../../lib/inventory/closetMatcher';
import type { InventoryItem } from '../../../lib/inventory/types';

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

describe('calculateMatchScore', () => {
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
});

describe('getRecommendationSummary', () => {
  it('total에 옷장 전체 벌 수를 반환해야 한다 (closet 외 카테고리 제외)', () => {
    const items = [
      createMockItem({ id: 'item-1' }),
      createMockItem({ id: 'item-2', subCategory: 'bottom' }),
      createMockItem({ id: 'beauty-1', category: 'beauty' as 'closet' }),
    ];
    const summary = getRecommendationSummary(items, {});

    expect(summary.total).toBe(2);
  });

  it('0벌 카테고리는 "없어요", 1벌 카테고리는 "1벌뿐"으로 분리 안내해야 한다', () => {
    // 상의 1벌 + 하의 2벌 → 상의=빈약(1벌뿐), 아우터·신발=부재(없어요), 하의=안내 없음
    const splitItems: InventoryItem[] = [
      createMockItem({ id: 'top-1', subCategory: 'top' }),
      createMockItem({ id: 'bottom-1', subCategory: 'bottom' }),
      createMockItem({ id: 'bottom-2', subCategory: 'bottom' }),
    ];
    const summary = getRecommendationSummary(splitItems, {});

    const absentMessage = summary.suggestions.find((s) => s.includes('없어요'));
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

// ============================================================
// 실데이터(prod) 형상: sub_category에 한글 세부종류 저장
// — 웹 저장측이 만드는 형상이 앱에서 코디 0건이던 결함의 회귀 방지
// ============================================================

describe('한글 sub_category 실데이터 형상', () => {
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

    // 아우터 0벌은 반드시 부재('없어요') 안내에 포함
    expect(summary.suggestions.some((s) => s.includes('아우터') && s.includes('없어요'))).toBe(
      true
    );
    // 보유 1벌인 상의는 부재가 아니라 '1벌뿐' 안내로 분류
    expect(summary.suggestions.some((s) => s.includes('상의') && s.includes('1벌뿐'))).toBe(true);
  });
});
