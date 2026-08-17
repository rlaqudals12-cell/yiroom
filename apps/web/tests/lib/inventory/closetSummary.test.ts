/**
 * 옷장 요약(getRecommendationSummary) 회귀 테스트 — 2026-08 수리 3건
 *
 * 1) 재정규화: 요약은 기온·계절 없이 계산돼 계절 점수가 항상 상수 50점이었다.
 *    가중치 0.4가 곱해져 총점 상한이 80으로 눌리는 바람에 '잘 어울림'(70) 밴드가
 *    사실상 도달 불가 → 옷장 전량이 '무난'으로 표시됐다.
 * 2) 조사: "상의은 1벌뿐이에요" 같은 비문(하드코딩된 은/는·이/가).
 * 3) 중복 요청: 코디 불발 화면에서 불발 문구와 요약 팁이 같은 등록을 두 번 요구했다.
 */
import { describe, it, expect } from 'vitest';
import { getRecommendationSummary, calculateMatchScore } from '@/lib/inventory/closetMatcher';
import type { InventoryItem } from '@/types/inventory';

function createItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: `item-${Math.random().toString(36).slice(2)}`,
    clerkUserId: 'user-1',
    category: 'closet',
    subCategory: 'top',
    name: '테스트 아이템',
    imageUrl: 'https://example.com/a.png',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: { color: [], season: [], occasion: [] },
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

describe('요약 점수 재정규화 (계절 축 제외)', () => {
  // 봄 웜톤에 맞는 색만으로 색 점수 만점(100)을 채운 옷 — 체형 진단이 없어도
  // "잘 어울림"에 닿아야 한다(대부분의 사용자는 체형 미진단 상태다)
  const springTop = createItem({
    id: 'coral-top',
    subCategory: '티셔츠',
    metadata: { color: ['코랄', '아이보리'], season: [], occasion: [] },
  });

  it('퍼스널컬러가 잘 맞는 옷은 "잘 어울림"으로 집계된다 (계절 상수에 눌리지 않음)', () => {
    const summary = getRecommendationSummary([springTop], { personalColor: 'Spring' });

    expect(summary.wellMatched).toBe(1);
    expect(summary.needsImprovement).toBe(0);
  });

  it('수리 전 계산식(계절 50점 상수 포함)으로는 같은 옷이 70점에 못 미친다 — 재발 방지', () => {
    // 요약과 동일한 옵션(계절·기온 없음)으로 원점수를 뽑으면 계절 축이 50점 상수로 들어간다
    const raw = calculateMatchScore(springTop, { personalColor: 'Spring' });

    expect(raw.seasonScore).toBe(50);
    expect(raw.total).toBeLessThan(70); // 옛 기준으로는 '무난'으로 밀렸던 옷
  });

  it('피해야 할 색은 여전히 "개선 필요"로 남는다 (재정규화가 판정을 무르게 만들지 않음)', () => {
    const blackTop = createItem({
      id: 'black-top',
      subCategory: '티셔츠',
      metadata: { color: ['블랙'], season: [], occasion: [] },
    });

    const summary = getRecommendationSummary([blackTop], { personalColor: 'Spring' });

    expect(summary.needsImprovement).toBe(1);
    expect(summary.wellMatched).toBe(0);
  });

  it('진단이 없으면 전량 중간 밴드(무난)로 남는다 — 근거 없이 좋다고 말하지 않는다', () => {
    const summary = getRecommendationSummary([createItem(), createItem()], {});

    expect(summary.total).toBe(2);
    expect(summary.wellMatched).toBe(0);
    expect(summary.needsImprovement).toBe(0);
  });
});

describe('안내 문구 조사(은/는·이/가)', () => {
  it('받침 없는 카테고리명에 "은"을 붙이지 않는다', () => {
    // 상의 1벌 + 하의 2벌 → 상의는 '1벌뿐' 안내 대상
    const items = [
      createItem({ id: 'top-1', subCategory: 'top' }),
      createItem({ id: 'bottom-1', subCategory: 'bottom' }),
      createItem({ id: 'bottom-2', subCategory: 'bottom' }),
    ];

    const summary = getRecommendationSummary(items, {});
    const thin = summary.suggestions.find((s) => s.includes('1벌뿐')) ?? '';

    expect(thin).toContain('상의는 1벌뿐이에요');
    expect(summary.suggestions.join(' ')).not.toContain('상의은');
  });

  it('받침 있는 카테고리명에는 "이"를 붙인다', () => {
    const items = [
      createItem({ id: 'top-1', subCategory: 'top' }),
      createItem({ id: 'bottom-1', subCategory: 'bottom' }),
    ];

    const summary = getRecommendationSummary(items, {});
    const absent = summary.suggestions.find((s) => s.includes('아직 등록 안 됐어요')) ?? '';

    // '아우터, 신발' → 마지막 이름(신발)의 받침을 따른다
    expect(absent).toBe('아우터, 신발이 아직 등록 안 됐어요');
  });
});

describe('부재 안내 표현·중복 억제', () => {
  const items = [createItem({ id: 'top-1', subCategory: 'top' })];

  it('보유하지 않은 카테고리를 "없어요"로 단정하지 않는다 (미등록 사실만 말한다)', () => {
    const summary = getRecommendationSummary(items, {});

    expect(summary.suggestions.some((s) => s.includes('아직 등록 안 됐어요'))).toBe(true);
    expect(summary.suggestions.join(' ')).not.toContain('없어요');
  });

  it('hideAbsentCategoryTip이면 부재 안내만 접고 나머지 안내는 유지한다', () => {
    const summary = getRecommendationSummary(items, { hideAbsentCategoryTip: true });

    expect(summary.suggestions.some((s) => s.includes('아직 등록 안 됐어요'))).toBe(false);
    // '1벌뿐' 안내(다른 성격의 조언)는 그대로 남는다
    expect(summary.suggestions.some((s) => s.includes('1벌뿐'))).toBe(true);
  });
});
