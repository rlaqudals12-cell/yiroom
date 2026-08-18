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

describe('사용자 노출 퍼스널컬러 문구', () => {
  it('추천 이유와 코디 팁에 내부 계절 코드 대신 한국어 라벨을 쓴다', () => {
    const top = createMockItem({
      id: 'spring-top',
      subCategory: 'top',
      metadata: { color: ['코랄'], season: ['spring'], occasion: [] },
    });
    const bottom = createMockItem({
      id: 'spring-bottom',
      subCategory: 'bottom',
      metadata: { color: ['아이보리'], season: ['spring'], occasion: [] },
    });

    const recommendations = recommendFromCloset([top], { personalColor: 'Spring' });
    const outfit = suggestOutfitFromCloset([top, bottom], { personalColor: 'Spring' });
    const userCopy = [...recommendations.flatMap((item) => item.reasons), ...(outfit?.tips ?? [])];

    expect(userCopy.join(' ')).toContain('봄 웜톤');
    expect(userCopy.join(' ')).not.toContain('Spring');
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

  it('0벌 카테고리는 미등록, 1벌 카테고리는 "1벌뿐"으로 분리 안내해야 한다', () => {
    // 상의 1벌 + 하의 2벌 → 상의=빈약(1벌뿐), 아우터·신발=미등록, 하의=안내 없음
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
    expect(absentMessage).toBe('아우터, 신발이 아직 등록 안 됐어요');
    expect(thinMessage).toContain('상의는 1벌뿐이에요');
    expect(summary.suggestions.join(' ')).not.toContain('상의은');
    expect(summary.suggestions.join(' ')).not.toContain('없어요');
  });

  it('요청하면 부재 안내만 숨기고 다른 보완 안내는 유지해야 한다', () => {
    const summary = getRecommendationSummary([createMockItem({ subCategory: 'top' })], {
      hideAbsentCategoryTip: true,
    });

    expect(summary.suggestions.some((s) => s.includes('아직 등록 안 됐어요'))).toBe(false);
    expect(summary.suggestions.some((s) => s.includes('1벌뿐'))).toBe(true);
  });

  it('계절 중립 상수가 아니라 퍼스널컬러·체형 축으로 적합도를 판정해야 한다', () => {
    const springTop = createMockItem({
      name: '코랄 아이보리 상의',
      metadata: { color: ['코랄', '아이보리'], season: [], occasion: [] },
    });
    const raw = calculateMatchScore(springTop, { personalColor: 'Spring' });
    const summary = getRecommendationSummary([springTop], { personalColor: 'Spring' });

    expect(raw.seasonScore).toBe(50);
    expect(raw.total).toBeLessThan(70);
    expect(summary.wellMatched).toBe(1);
    expect(summary.needsImprovement).toBe(0);
  });

  it('보완 제안에 원시 영문 시즌을 노출하지 않는다', () => {
    const blackTop = createMockItem({
      name: '블랙 상의',
      metadata: { color: ['블랙'], season: [], occasion: [] },
    });

    const summary = getRecommendationSummary([blackTop], { personalColor: 'Spring' });
    const message = summary.suggestions.join(' ');

    expect(message).toContain('봄 웜톤에 어울리는 옷');
    expect(message).not.toContain('Spring');
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

  it('한글 sub_category 원피스만으로도 코디가 조립되어야 한다', () => {
    // 웹 저장 형상('원피스')이 대분류 완전일치에 걸려 조립 불발되던 경로의 회귀 방지
    const dressOnly: InventoryItem[] = [
      createMockItem({
        id: 'ko-dress-1',
        name: '네이비 원피스',
        subCategory: '원피스',
        metadata: { color: ['네이비'], season: ['spring'], occasion: ['date'] },
      }),
    ];
    const suggestion = suggestOutfitFromCloset(dressOnly, {});

    expect(suggestion?.dress?.item.id).toBe('ko-dress-1');
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

// ============================================================
// T3: 원피스 슬롯 수용 (상·하의 부재 시 한 벌 조립)
// — 웹 tests/lib/inventory/closetMatcher.test.ts 미러
// ============================================================

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

  it('원피스 보유 시 상·하의 부재를 "없어요"로 안내하지 않아야 한다', () => {
    const summary = getRecommendationSummary(dressOnly, {});

    const absentMessage = summary.suggestions.find((s) => s.includes('아직 등록 안 됐어요'));
    expect(absentMessage).not.toContain('상의');
    expect(absentMessage).not.toContain('하의');
    // 대신 원피스로 조립 가능하다는 사실 + 확장 경로를 안내
    expect(summary.suggestions.some((s) => s.includes('원피스 2벌로 코디를 조립할 수 있어요'))).toBe(
      true
    );
  });
});

// ============================================================
// T4: 계절 하드 가드 + 정직한 예외 문구
// ============================================================

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
    const autumnKnit = createMockItem({
      id: 'autumn-top',
      name: '니트',
      subCategory: 'top',
      metadata: { color: ['그레이'], season: ['autumn'], occasion: [] },
    });
    // 0°C — truthy 검사였다면 '기온 정보 없음'으로 흘러가 계절 판정 자체가 사라진다
    const recs = recommendFromCloset([autumnKnit], { category: 'top', temp: 0 });

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

  it('0°C에서도 계절 점수가 겨울 기준으로 계산되어야 한다', () => {
    // temp가 truthy 검사면 0°C가 통째로 무시돼 계절 점수가 중립 50으로 주저앉는다
    const winterCoat = createMockItem({
      id: 'winter-coat',
      name: '울 코트',
      subCategory: 'outer',
      metadata: { color: ['차콜'], season: ['winter'], occasion: [] },
    });
    const score = calculateMatchScore(winterCoat, { temp: 0 });

    expect(score.seasonScore).toBe(100);
  });
});
