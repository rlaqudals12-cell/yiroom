/**
 * 제품 개인화 근거 정직성 회귀 테스트
 *
 * 제품 메타데이터가 없거나 모든 사용자에게 똑같이 붙은 블랭킷 태그라면
 * 개인화 점수나 근거로 사용할 수 없다. 실제로 변별력 있는 진단 교집합만
 * "나와 맞음" 근거가 되어야 한다.
 */
import {
  calculateMatchScore,
  calculatePersonalMatchPercentage,
  addMatchInfo,
  hasPersonalMatch,
  isBlanketTag,
} from '@/lib/products/matching';
import type { CosmeticProduct } from '@/types/product';

function cosmetic(overrides: Partial<CosmeticProduct> = {}): CosmeticProduct {
  return {
    id: 'product-1',
    name: '테스트 제품',
    brand: '테스트 브랜드',
    category: 'makeup',
    priceRange: 'premium',
    ...overrides,
  };
}

describe('제품 매칭 근거 정직성', () => {
  it('제품 메타데이터가 없으면 프로필 완성도만으로 점수나 근거를 더하지 않는다', () => {
    const product = cosmetic();
    const withoutProfile = calculateMatchScore(product, {});
    const withProfile = calculateMatchScore(product, {
      faceShape: 'oval',
      undertone: 'warm',
    });

    expect(withProfile.score).toBe(withoutProfile.score);
    expect(withProfile.reasons).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'faceShape' }),
        expect.objectContaining({ type: 'undertone' }),
      ])
    );
    expect(hasPersonalMatch(withProfile.reasons)).toBe(false);
  });

  it('헤어 제품 데이터가 없으면 모발 타입 보너스를 만들지 않는다', () => {
    const product = cosmetic({ category: 'shampoo' });
    const withoutProfile = calculateMatchScore(product, {});
    const withProfile = calculateMatchScore(product, { hairType: 'straight' });

    expect(withProfile.score).toBe(withoutProfile.score);
    expect(withProfile.reasons).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'hairType' })])
    );
    expect(hasPersonalMatch(withProfile.reasons)).toBe(false);
  });

  it('도메인 전체가 붙은 블랭킷 태그는 개인화 근거가 아니다', () => {
    const product = cosmetic({
      category: 'shampoo',
      hairTypes: ['straight', 'wavy', 'curly', 'coily'],
      scalpTypes: ['dry', 'oily', 'sensitive', 'normal'],
    });

    expect(isBlanketTag(product.hairTypes, ['straight', 'wavy', 'curly', 'coily'])).toBe(true);

    const result = calculateMatchScore(product, {
      hairType: 'straight',
      scalpType: 'dry',
    });

    expect(result.reasons).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'hairType', matched: true }),
        expect.objectContaining({ type: 'scalpType', matched: true }),
      ])
    );
    expect(hasPersonalMatch(result.reasons)).toBe(false);
  });

  it('실제 변별력 있는 진단 교집합은 개인화 근거로 유지한다', () => {
    const result = calculateMatchScore(cosmetic({ skinTypes: ['dry'], undertones: ['warm'] }), {
      skinType: 'dry',
      undertone: 'warm',
    });

    expect(result.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'skinType', matched: true }),
        expect.objectContaining({ type: 'undertone', matched: true }),
      ])
    );
    expect(hasPersonalMatch(result.reasons)).toBe(true);
  });

  it('표시 계약은 실제 개인 축 교집합만 personalMatched=true로 보존한다', () => {
    const matched = addMatchInfo(cosmetic({ skinTypes: ['dry'] }), { skinType: 'dry' });
    const unverified = addMatchInfo(cosmetic({ rating: 4.8, reviewCount: 1000 }), {
      skinType: 'dry',
    });

    expect(matched.personalMatched).toBe(true);
    expect(unverified.personalMatched).toBe(false);
  });

  it('가격·브랜드·리뷰 근거만으로는 개인화됐다고 판단하지 않는다', () => {
    const result = calculateMatchScore(
      cosmetic({ priceRange: 'budget', brand: '라운드랩', rating: 4.8, reviewCount: 1000 }),
      {}
    );

    expect(result.reasons.length).toBeGreaterThan(0);
    expect(hasPersonalMatch(result.reasons)).toBe(false);
    expect(calculatePersonalMatchPercentage(result.reasons)).toBeUndefined();
  });

  it('표시용 퍼센트에는 기본점·가격·리뷰가 아닌 실제 개인 축만 반영한다', () => {
    const result = calculateMatchScore(
      cosmetic({
        skinTypes: ['dry'],
        undertones: ['cool'],
        priceRange: 'budget',
        brand: '라운드랩',
        rating: 4.8,
        reviewCount: 1000,
      }),
      { skinType: 'dry', undertone: 'warm' }
    );

    expect(result.score).toBeGreaterThan(50);
    expect(calculatePersonalMatchPercentage(result.reasons)).toBe(50);
  });
});
