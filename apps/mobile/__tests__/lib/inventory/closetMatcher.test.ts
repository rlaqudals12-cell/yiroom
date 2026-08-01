/**
 * 옷장 매칭 로직 테스트
 * 웹 tests/lib/inventory/closetMatcher.test.ts 대응 포팅 (옷장 신뢰 체인 패리티)
 */

import {
  calculateMatchScore,
  getRecommendationSummary,
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
