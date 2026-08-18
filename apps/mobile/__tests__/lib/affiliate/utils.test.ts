/**
 * 어필리에이트 유틸리티 함수 테스트
 * @description 가격 포맷, 시즌 라벨, 매칭 점수 계산 테스트
 */

import {
  formatPrice,
  getSeasonLabel,
  getCategoryLabel,
  getCategoryEmoji,
  calculateSkinMatchScore,
  calculateColorMatchScore,
  calculateRatingBonus,
  calculateProductMatchScore,
  calculateDiscountRate,
  sortProducts,
} from '@/lib/affiliate/utils';

describe('formatPrice', () => {
  it('가격을 원화 형식으로 포맷해야 함', () => {
    expect(formatPrice(25000)).toBe('₩25,000');
    expect(formatPrice(1000)).toBe('₩1,000');
    expect(formatPrice(0)).toBe('₩0');
  });

  it('큰 금액도 올바르게 포맷해야 함', () => {
    expect(formatPrice(1000000)).toBe('₩1,000,000');
    expect(formatPrice(99999999)).toBe('₩99,999,999');
  });
});

describe('getSeasonLabel', () => {
  it('영어 시즌명을 한글로 변환해야 함', () => {
    expect(getSeasonLabel('Spring')).toBe('봄 웜톤');
    expect(getSeasonLabel('Summer')).toBe('여름 쿨톤');
    expect(getSeasonLabel('Autumn')).toBe('가을 웜톤');
    expect(getSeasonLabel('Winter')).toBe('겨울 쿨톤');
  });

  it('DB 키 형식도 변환해야 함', () => {
    expect(getSeasonLabel('spring_warm')).toBe('봄 웜톤');
    expect(getSeasonLabel('summer_cool')).toBe('여름 쿨톤');
    expect(getSeasonLabel('autumn_warm')).toBe('가을 웜톤');
    expect(getSeasonLabel('winter_cool')).toBe('겨울 쿨톤');
  });

  it('알 수 없는 시즌은 원본을 반환해야 함', () => {
    expect(getSeasonLabel('Unknown')).toBe('Unknown');
  });
});

describe('getCategoryLabel', () => {
  it('카테고리를 한글로 변환해야 함', () => {
    expect(getCategoryLabel('skincare')).toBe('스킨케어');
    expect(getCategoryLabel('makeup')).toBe('메이크업');
    expect(getCategoryLabel('supplement')).toBe('영양제');
    expect(getCategoryLabel('equipment')).toBe('운동용품');
    expect(getCategoryLabel('all')).toBe('전체');
  });

  it('알 수 없는 카테고리는 원본을 반환해야 함', () => {
    expect(getCategoryLabel('unknown')).toBe('unknown');
  });
});

describe('getCategoryEmoji', () => {
  it('카테고리에 맞는 이모지를 반환해야 함', () => {
    expect(getCategoryEmoji('skincare')).toBe('🧴');
    expect(getCategoryEmoji('makeup')).toBe('💄');
    expect(getCategoryEmoji('supplement')).toBe('💊');
    expect(getCategoryEmoji('equipment')).toBe('🏋️');
  });

  it('알 수 없는 카테고리는 기본 이모지를 반환해야 함', () => {
    expect(getCategoryEmoji('unknown')).toBe('📦');
  });
});

describe('calculateSkinMatchScore', () => {
  it('피부 타입이 매칭되면 15점을 반환해야 함', () => {
    const product = { skinTypes: ['dry', 'normal'] as ('dry' | 'normal')[] };
    expect(calculateSkinMatchScore(product, 'dry')).toBe(15);
    expect(calculateSkinMatchScore(product, 'normal')).toBe(15);
  });

  it('피부 타입이 매칭되지 않으면 0점을 반환해야 함', () => {
    const product = { skinTypes: ['dry'] as 'dry'[] };
    expect(calculateSkinMatchScore(product, 'oily')).toBe(0);
  });

  it('사용자 피부 타입이 없으면 0점을 반환해야 함', () => {
    const product = { skinTypes: ['dry'] as 'dry'[] };
    expect(calculateSkinMatchScore(product, undefined)).toBe(0);
  });

  it('제품에 피부 타입이 없으면 0점을 반환해야 함', () => {
    const product = { skinTypes: undefined };
    expect(calculateSkinMatchScore(product, 'dry')).toBe(0);
  });
});

describe('calculateColorMatchScore', () => {
  it('퍼스널 컬러가 매칭되면 15점을 반환해야 함', () => {
    const product = {
      personalColors: ['spring_warm', 'autumn_warm'] as ('spring_warm' | 'autumn_warm')[],
    };
    expect(calculateColorMatchScore(product, 'Spring')).toBe(15);
    expect(calculateColorMatchScore(product, 'Autumn')).toBe(15);
  });

  it('퍼스널 컬러가 매칭되지 않으면 0점을 반환해야 함', () => {
    const product = { personalColors: ['spring_warm'] as 'spring_warm'[] };
    expect(calculateColorMatchScore(product, 'Winter')).toBe(0);
  });

  it('사용자 시즌이 없으면 0점을 반환해야 함', () => {
    const product = { personalColors: ['spring_warm'] as 'spring_warm'[] };
    expect(calculateColorMatchScore(product, undefined)).toBe(0);
  });

  it('DB 키 형식의 시즌도 처리해야 함', () => {
    const product = { personalColors: ['summer_cool'] as 'summer_cool'[] };
    expect(calculateColorMatchScore(product, 'summer_cool')).toBe(15);
  });
});

describe('calculateRatingBonus', () => {
  it('평점 4.5 이상이면 5점을 반환해야 함', () => {
    expect(calculateRatingBonus(4.5)).toBe(5);
    expect(calculateRatingBonus(4.8)).toBe(5);
    expect(calculateRatingBonus(5.0)).toBe(5);
  });

  it('평점 4.5 미만이면 0점을 반환해야 함', () => {
    expect(calculateRatingBonus(4.4)).toBe(0);
    expect(calculateRatingBonus(3.0)).toBe(0);
  });

  it('평점이 없으면 0점을 반환해야 함', () => {
    expect(calculateRatingBonus(undefined)).toBe(0);
  });
});

describe('calculateProductMatchScore', () => {
  it('모든 조건 매칭 시 최대 100점을 반환해야 함', () => {
    const product = {
      skinTypes: ['dry'] as 'dry'[],
      personalColors: ['spring_warm'] as 'spring_warm'[],
      rating: 4.8,
    };
    expect(calculateProductMatchScore(product, 'dry', 'Spring')).toBe(100);
  });

  it('진단 근거가 없으면 개인화 점수를 만들지 않아야 함', () => {
    const product = {};
    expect(calculateProductMatchScore(product)).toBeNull();
  });

  it('실제 피부 타입 데이터가 매칭되면 근거 비율 100점을 반환해야 함', () => {
    const product = {
      skinTypes: ['dry'] as 'dry'[],
    };
    expect(calculateProductMatchScore(product, 'dry')).toBe(100);
  });

  it('실제 퍼스널 컬러 데이터가 매칭되면 근거 비율 100점을 반환해야 함', () => {
    const product = {
      personalColors: ['winter_cool'] as 'winter_cool'[],
    };
    expect(calculateProductMatchScore(product, undefined, 'Winter')).toBe(100);
  });

  it('평점만 높아도 개인 진단 근거가 아니므로 점수를 만들지 않아야 함', () => {
    const product = {
      rating: 4.5,
    };
    expect(calculateProductMatchScore(product)).toBeNull();
  });

  it('도메인 전체가 붙은 블랭킷 태그는 개인화 점수를 만들지 않아야 함', () => {
    const product = {
      skinTypes: ['dry', 'oily', 'combination', 'sensitive', 'normal'] as (
        | 'dry'
        | 'oily'
        | 'combination'
        | 'sensitive'
        | 'normal'
      )[],
    };

    expect(calculateProductMatchScore(product, 'dry')).toBeNull();
  });

  it('실제 제품 데이터가 진단과 불일치하면 0점을 반환해야 함', () => {
    const product = {
      skinTypes: ['oily'] as 'oily'[],
    };

    expect(calculateProductMatchScore(product, 'dry')).toBe(0);
  });
});

describe('calculateDiscountRate', () => {
  it('할인율을 올바르게 계산해야 함', () => {
    expect(calculateDiscountRate(10000, 8000)).toBe(20);
    expect(calculateDiscountRate(50000, 35000)).toBe(30);
    expect(calculateDiscountRate(100000, 50000)).toBe(50);
  });

  it('정가가 없으면 0을 반환해야 함', () => {
    expect(calculateDiscountRate(undefined, 8000)).toBe(0);
  });

  it('정가가 현재가보다 작거나 같으면 0을 반환해야 함', () => {
    expect(calculateDiscountRate(8000, 10000)).toBe(0);
    expect(calculateDiscountRate(10000, 10000)).toBe(0);
  });

  it('할인율을 반올림해야 함', () => {
    expect(calculateDiscountRate(10000, 6666)).toBe(33);
  });
});

describe('sortProducts', () => {
  const products = [
    { matchScore: 80, rating: 4.5, price: 30000 },
    { matchScore: 90, rating: 4.2, price: 20000 },
    { matchScore: 70, rating: 4.8, price: 10000 },
  ];

  it('매칭 점수 기준 내림차순 정렬해야 함', () => {
    const sorted = sortProducts(products, 'match');
    expect(sorted[0].matchScore).toBe(90);
    expect(sorted[1].matchScore).toBe(80);
    expect(sorted[2].matchScore).toBe(70);
  });

  it('평점 기준 내림차순 정렬해야 함', () => {
    const sorted = sortProducts(products, 'rating');
    expect(sorted[0].rating).toBe(4.8);
    expect(sorted[1].rating).toBe(4.5);
    expect(sorted[2].rating).toBe(4.2);
  });

  it('가격 오름차순 정렬해야 함', () => {
    const sorted = sortProducts(products, 'price_asc');
    expect(sorted[0].price).toBe(10000);
    expect(sorted[1].price).toBe(20000);
    expect(sorted[2].price).toBe(30000);
  });

  it('가격 내림차순 정렬해야 함', () => {
    const sorted = sortProducts(products, 'price_desc');
    expect(sorted[0].price).toBe(30000);
    expect(sorted[1].price).toBe(20000);
    expect(sorted[2].price).toBe(10000);
  });

  it('원본 배열을 변경하지 않아야 함', () => {
    const original = [...products];
    sortProducts(products, 'match');
    expect(products).toEqual(original);
  });

  it('기본값은 매칭 점수 정렬이어야 함', () => {
    const sorted = sortProducts(products);
    expect(sorted[0].matchScore).toBe(90);
  });
});
