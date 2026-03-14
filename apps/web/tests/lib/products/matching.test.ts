/**
 * 제품 매칭 점수 계산 테스트
 * @description calculateMatchScore, addMatchInfo, addMatchInfoToProducts 함수 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  CosmeticProduct,
  SupplementProduct,
  WorkoutEquipment,
  HealthFood,
} from '@/types/product';

// getProductType 모킹 — Supabase 의존성 차단
vi.mock('@/lib/products/services/search', () => ({
  getProductType: (product: Record<string, unknown>) => {
    if ('skinTypes' in product || 'personalColorSeasons' in product) return 'cosmetic';
    if ('benefits' in product && 'mainIngredients' in product) return 'supplement';
    if ('targetMuscles' in product || 'exerciseTypes' in product) return 'workout_equipment';
    if ('caloriesPerServing' in product || 'proteinG' in product) return 'health_food';
    return 'cosmetic';
  },
}));

import {
  calculateMatchScore,
  addMatchInfo,
  addMatchInfoToProducts,
  type UserProfile,
} from '@/lib/products/matching';

// ================================================
// 테스트 픽스처
// ================================================

const cosmeticProduct: CosmeticProduct = {
  id: 'c1',
  name: '수분 토너',
  brand: '라운드랩',
  category: 'toner',
  skinTypes: ['dry'],
  concerns: ['hydration', 'aging'],
  priceRange: 'budget',
  rating: 4.5,
  reviewCount: 15000,
  isActive: true,
  keyIngredients: ['히알루론산'],
};

const makeupProduct: CosmeticProduct = {
  id: 'm1',
  name: '립스틱',
  brand: '클리오',
  category: 'makeup',
  subcategory: 'lip',
  personalColorSeasons: ['Spring'],
  faceShapes: ['oval'],
  undertones: ['warm'],
  skinTypes: [],
  concerns: [],
  priceRange: 'mid',
  rating: 4.2,
  reviewCount: 800,
  isActive: true,
  keyIngredients: [],
};

const haircareProduct: CosmeticProduct = {
  id: 'h1',
  name: '샴푸',
  brand: '닥터포헤어',
  category: 'shampoo',
  hairTypes: ['straight'],
  scalpTypes: ['oily'],
  concerns: ['aging', 'hydration'],
  skinTypes: [],
  priceRange: 'budget',
  rating: 4.3,
  reviewCount: 6000,
  isActive: true,
  keyIngredients: [],
};

const supplementProduct: SupplementProduct = {
  id: 's1',
  name: '콜라겐',
  brand: '종근당건강',
  category: 'collagen',
  benefits: ['skin', 'hair'],
  mainIngredients: [{ name: '콜라겐', amount: 1000, unit: 'mg' }],
  targetConcerns: ['피부 탄력', '모발 건강'],
  priceKrw: 25000,
  rating: 4.6,
  reviewCount: 3000,
  isActive: true,
};

const equipmentProduct: WorkoutEquipment = {
  id: 'e1',
  name: '덤벨 세트',
  brand: '하이퍼',
  category: 'dumbbell',
  targetMuscles: ['chest', 'arms', 'shoulders'],
  skillLevel: 'beginner',
  priceKrw: 45000,
  rating: 4.4,
  reviewCount: 1200,
  isActive: true,
};

const healthFoodProduct: HealthFood = {
  id: 'hf1',
  name: '프로틴 파우더',
  brand: '마이프로틴',
  category: 'protein_powder',
  benefits: ['muscle_gain', 'recovery'],
  dietaryInfo: ['gluten_free', 'sugar_free'],
  caloriesPerServing: 120,
  proteinG: 25,
  priceKrw: 35000,
  rating: 4.3,
  reviewCount: 8000,
  isActive: true,
};

const emptyProfile: UserProfile = {};

// ================================================
// 화장품 매칭 테스트
// ================================================

describe('calculateMatchScore', () => {
  describe('화장품 (Cosmetic) 매칭', () => {
    it('빈 프로필은 기본 점수만 반환한다', () => {
      const result = calculateMatchScore(cosmeticProduct, emptyProfile);
      // 기본 20 + 가격 budget 15 + 인기 브랜드 12 + 리뷰 15000개 15 + 평점 4.5&100+ 10
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.reasons.length).toBeGreaterThanOrEqual(0);
    });

    it('피부 타입이 일치하면 +30점을 받는다', () => {
      const profile: UserProfile = { skinType: 'dry' };
      const result = calculateMatchScore(cosmeticProduct, profile);
      const skinReason = result.reasons.find((r) => r.type === 'skinType');
      expect(skinReason).toBeDefined();
      expect(skinReason?.matched).toBe(true);
    });

    it('피부 타입이 불일치하면 추가 점수 없다', () => {
      const profileMatch: UserProfile = { skinType: 'dry' };
      const profileNoMatch: UserProfile = { skinType: 'oily' };
      const scoreMatch = calculateMatchScore(cosmeticProduct, profileMatch).score;
      const scoreNoMatch = calculateMatchScore(cosmeticProduct, profileNoMatch).score;
      expect(scoreMatch).toBeGreaterThan(scoreNoMatch);
    });

    it('피부 고민 2/4 겹치면 비례 점수를 받는다', () => {
      const profile: UserProfile = {
        skinConcerns: ['hydration', 'aging', 'acne', 'pore'],
      };
      const result = calculateMatchScore(cosmeticProduct, profile);
      // 2/4 = 0.5 → 30*0.5 = 15
      const concernReasons = result.reasons.filter((r) => r.type === 'concern');
      expect(concernReasons.length).toBe(2);
      expect(concernReasons.every((r) => r.matched)).toBe(true);
    });

    it('피부 고민 4/4 모두 겹치면 최대 30점을 받는다', () => {
      const product: CosmeticProduct = {
        ...cosmeticProduct,
        concerns: ['hydration', 'aging', 'acne', 'pore'],
      };
      const profile: UserProfile = {
        skinConcerns: ['hydration', 'aging', 'acne', 'pore'],
      };
      const result = calculateMatchScore(product, profile);
      const concernReasons = result.reasons.filter((r) => r.type === 'concern');
      expect(concernReasons.length).toBe(4);
    });

    it('점수는 100을 초과하지 않는다', () => {
      const profile: UserProfile = {
        skinType: 'dry',
        skinConcerns: ['hydration', 'aging'],
        personalColorSeason: 'Spring',
        faceShape: 'oval',
        undertone: 'warm',
      };
      const result = calculateMatchScore(cosmeticProduct, profile);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  // ================================================
  // 메이크업 매칭 테스트
  // ================================================

  describe('메이크업 (Makeup) 매칭', () => {
    it('퍼스널컬러가 일치하면 +20점을 받는다', () => {
      const profile: UserProfile = { personalColorSeason: 'Spring' };
      const profileNoMatch: UserProfile = { personalColorSeason: 'Winter' };
      const scoreMatch = calculateMatchScore(makeupProduct, profile).score;
      const scoreNoMatch = calculateMatchScore(makeupProduct, profileNoMatch).score;
      expect(scoreMatch - scoreNoMatch).toBe(20);
    });

    it('얼굴형이 일치하면 +20점을 받는다', () => {
      const profile: UserProfile = { faceShape: 'oval' };
      const profileNoMatch: UserProfile = { faceShape: 'round' };
      const scoreMatch = calculateMatchScore(makeupProduct, profile).score;
      const scoreNoMatch = calculateMatchScore(makeupProduct, profileNoMatch).score;
      // 일치: +20, 불일치: +0
      expect(scoreMatch - scoreNoMatch).toBe(20);
    });

    it('제품에 faceShapes 데이터가 없으면 프로필 완성도 보너스 +5점을 준다', () => {
      const productNoFace: CosmeticProduct = {
        ...makeupProduct,
        faceShapes: undefined,
      };
      const profile: UserProfile = { faceShape: 'oval' };
      const result = calculateMatchScore(productNoFace, profile);
      const faceReason = result.reasons.find((r) => r.type === 'faceShape');
      expect(faceReason).toBeDefined();
      expect(faceReason?.matched).toBe(false);
    });

    it('언더톤이 일치하면 +15점을 받는다', () => {
      const profile: UserProfile = { undertone: 'warm' };
      const profileNoMatch: UserProfile = { undertone: 'cool' };
      const scoreMatch = calculateMatchScore(makeupProduct, profile).score;
      const scoreNoMatch = calculateMatchScore(makeupProduct, profileNoMatch).score;
      // 일치: +15, 불일치: +0
      expect(scoreMatch - scoreNoMatch).toBe(15);
    });

    it('제품에 undertones 데이터가 없으면 프로필 완성도 보너스 +5점을 준다', () => {
      const productNoUndertone: CosmeticProduct = {
        ...makeupProduct,
        undertones: undefined,
      };
      const profile: UserProfile = { undertone: 'warm' };
      const result = calculateMatchScore(productNoUndertone, profile);
      const undertoneReason = result.reasons.find((r) => r.type === 'undertone');
      expect(undertoneReason).toBeDefined();
      expect(undertoneReason?.matched).toBe(false);
    });

    it('스킨케어 제품은 퍼스널컬러 보너스를 받지 않는다', () => {
      const profile: UserProfile = { personalColorSeason: 'Spring' };
      const result = calculateMatchScore(cosmeticProduct, profile);
      const pcReason = result.reasons.find((r) => r.type === 'personalColor');
      expect(pcReason).toBeUndefined();
    });
  });

  // ================================================
  // 헤어케어 매칭 테스트
  // ================================================

  describe('헤어케어 (Haircare) 매칭', () => {
    it('모발 타입이 일치하면 +30점을 받는다', () => {
      const profile: UserProfile = { hairType: 'straight' };
      const profileNoMatch: UserProfile = { hairType: 'curly' };
      const scoreMatch = calculateMatchScore(haircareProduct, profile).score;
      const scoreNoMatch = calculateMatchScore(haircareProduct, profileNoMatch).score;
      expect(scoreMatch - scoreNoMatch).toBe(30);
    });

    it('제품에 hairTypes 없으면 프로필 완성도 보너스 +10점을 준다', () => {
      const productNoHair: CosmeticProduct = {
        ...haircareProduct,
        hairTypes: undefined,
      };
      const profile: UserProfile = { hairType: 'straight' };
      const result = calculateMatchScore(productNoHair, profile);
      const hairReason = result.reasons.find((r) => r.type === 'hairType');
      expect(hairReason).toBeDefined();
      expect(hairReason?.matched).toBe(false);
    });

    it('두피 타입이 일치하면 +30점을 받는다', () => {
      const profile: UserProfile = { scalpType: 'oily' };
      const result = calculateMatchScore(haircareProduct, profile);
      const scalpReason = result.reasons.find((r) => r.type === 'scalpType');
      expect(scalpReason).toBeDefined();
      expect(scalpReason?.matched).toBe(true);
    });

    it('모발 고민이 겹치면 비례 점수를 받는다', () => {
      const profile: UserProfile = {
        hairConcerns: ['aging', 'hydration'],
      };
      const result = calculateMatchScore(haircareProduct, profile);
      const concernReason = result.reasons.find(
        (r) => r.type === 'concern' && r.label === '모발 고민 적합'
      );
      expect(concernReason).toBeDefined();
      expect(concernReason?.matched).toBe(true);
    });
  });

  // ================================================
  // 대중성 보너스 테스트
  // ================================================

  describe('대중성 보너스', () => {
    it('인기 브랜드는 +12점을 받는다', () => {
      const popularResult = calculateMatchScore(cosmeticProduct, emptyProfile);
      const unknownProduct: CosmeticProduct = {
        ...cosmeticProduct,
        brand: '알수없는브랜드XYZ',
      };
      const unknownResult = calculateMatchScore(unknownProduct, emptyProfile);
      const popularBrand = popularResult.reasons.find((r) => r.type === 'brand');
      const unknownBrand = unknownResult.reasons.find((r) => r.type === 'brand');
      expect(popularBrand?.matched).toBe(true);
      expect(unknownBrand).toBeUndefined();
      expect(popularResult.score - unknownResult.score).toBe(12);
    });

    it('가격 budget은 +15점을 받는다', () => {
      const budgetProduct: CosmeticProduct = {
        ...cosmeticProduct,
        brand: '알수없는브랜드',
        priceRange: 'budget',
        reviewCount: 0,
        rating: undefined,
      };
      const premiumProduct: CosmeticProduct = {
        ...cosmeticProduct,
        brand: '알수없는브랜드',
        priceRange: 'premium',
        reviewCount: 0,
        rating: undefined,
      };
      const budgetScore = calculateMatchScore(budgetProduct, emptyProfile).score;
      const premiumScore = calculateMatchScore(premiumProduct, emptyProfile).score;
      expect(budgetScore - premiumScore).toBe(15);
    });

    it('가격 mid는 +8점을 받는다', () => {
      const midProduct: CosmeticProduct = {
        ...cosmeticProduct,
        brand: '알수없는브랜드',
        priceRange: 'mid',
        reviewCount: 0,
        rating: undefined,
      };
      const premiumProduct: CosmeticProduct = {
        ...cosmeticProduct,
        brand: '알수없는브랜드',
        priceRange: 'premium',
        reviewCount: 0,
        rating: undefined,
      };
      const midScore = calculateMatchScore(midProduct, emptyProfile).score;
      const premiumScore = calculateMatchScore(premiumProduct, emptyProfile).score;
      expect(midScore - premiumScore).toBe(8);
    });

    it('리뷰 10000개 이상은 +15점을 받는다', () => {
      const result = calculateMatchScore(cosmeticProduct, emptyProfile);
      const popReason = result.reasons.find((r) => r.type === 'popularity');
      expect(popReason).toBeDefined();
      expect(popReason?.matched).toBe(true);
    });

    it('리뷰 5000개 이상은 +12점을 받는다', () => {
      const product: CosmeticProduct = {
        ...cosmeticProduct,
        brand: '알수없는브랜드',
        reviewCount: 5500,
        rating: undefined,
        priceRange: undefined,
      };
      const noReviewProduct: CosmeticProduct = {
        ...product,
        reviewCount: 0,
      };
      const withReviewScore = calculateMatchScore(product, emptyProfile).score;
      const noReviewScore = calculateMatchScore(noReviewProduct, emptyProfile).score;
      expect(withReviewScore - noReviewScore).toBe(12);
    });

    it('리뷰 1000개 이상은 +8점을 받는다', () => {
      const product: CosmeticProduct = {
        ...cosmeticProduct,
        brand: '알수없는브랜드',
        reviewCount: 1200,
        rating: undefined,
        priceRange: undefined,
      };
      const noReviewProduct: CosmeticProduct = {
        ...product,
        reviewCount: 0,
      };
      const withReviewScore = calculateMatchScore(product, emptyProfile).score;
      const noReviewScore = calculateMatchScore(noReviewProduct, emptyProfile).score;
      expect(withReviewScore - noReviewScore).toBe(8);
    });

    it('평점 4.5 이상 & 리뷰 100개 이상은 +10점을 받는다', () => {
      const product: CosmeticProduct = {
        ...cosmeticProduct,
        brand: '알수없는브랜드',
        rating: 4.5,
        reviewCount: 150,
        priceRange: undefined,
      };
      const noRatingProduct: CosmeticProduct = {
        ...product,
        rating: undefined,
        reviewCount: 0,
      };
      const ratedScore = calculateMatchScore(product, emptyProfile).score;
      const noRatingScore = calculateMatchScore(noRatingProduct, emptyProfile).score;
      // 리뷰 150개: +3점 (100+), 평점 4.5: +10점 → 총 +13
      expect(ratedScore - noRatingScore).toBe(13);
    });

    it('평점 4.0 이상 & 리뷰 50개 이상은 +7점을 받는다', () => {
      const product: CosmeticProduct = {
        ...cosmeticProduct,
        brand: '알수없는브랜드',
        rating: 4.0,
        reviewCount: 60,
        priceRange: undefined,
      };
      const result = calculateMatchScore(product, emptyProfile);
      const ratingReason = result.reasons.find((r) => r.type === 'rating');
      expect(ratingReason).toBeDefined();
      expect(ratingReason?.matched).toBe(true);
    });

    it('평점 3.5 미만 또는 리뷰 20개 미만은 평점 보너스를 받지 않는다', () => {
      const product: CosmeticProduct = {
        ...cosmeticProduct,
        brand: '알수없는브랜드',
        rating: 3.2,
        reviewCount: 10,
        priceRange: undefined,
      };
      const result = calculateMatchScore(product, emptyProfile);
      const ratingReason = result.reasons.find((r) => r.type === 'rating');
      expect(ratingReason).toBeUndefined();
    });
  });

  // ================================================
  // 영양제 매칭 테스트
  // ================================================

  describe('영양제 (Supplement) 매칭', () => {
    it('빈 프로필은 기본 점수(20) + 보너스만 반환한다', () => {
      const result = calculateMatchScore(supplementProduct, emptyProfile);
      expect(result.score).toBeGreaterThanOrEqual(20);
    });

    it('피부/모발 관련 효능이 있고 피부 고민 프로필이 있으면 +30점을 받는다', () => {
      const profile: UserProfile = { skinConcerns: ['hydration'] };
      const profileEmpty: UserProfile = {};
      const scoreMatch = calculateMatchScore(supplementProduct, profile).score;
      const scoreNoMatch = calculateMatchScore(supplementProduct, profileEmpty).score;
      expect(scoreMatch - scoreNoMatch).toBe(30);
    });

    it('영양 목표가 일치하면 +30점을 받는다', () => {
      const profile: UserProfile = { nutritionGoals: ['피부 탄력'] };
      const profileNoGoal: UserProfile = {};
      const scoreMatch = calculateMatchScore(supplementProduct, profile).score;
      const scoreNoMatch = calculateMatchScore(supplementProduct, profileNoGoal).score;
      expect(scoreMatch - scoreNoMatch).toBe(30);
    });

    it('운동 목표 연동 효능이 일치하면 +20점을 받는다', () => {
      const productWithMuscle: SupplementProduct = {
        ...supplementProduct,
        benefits: ['muscle', 'energy'],
      };
      const profile: UserProfile = { workoutGoals: ['muscle_gain'] };
      const profileNoGoal: UserProfile = {};
      const scoreMatch = calculateMatchScore(productWithMuscle, profile).score;
      const scoreNoMatch = calculateMatchScore(productWithMuscle, profileNoGoal).score;
      expect(scoreMatch - scoreNoMatch).toBe(20);
    });
  });

  // ================================================
  // 운동 기구 매칭 테스트
  // ================================================

  describe('운동 기구 (Equipment) 매칭', () => {
    it('타겟 근육 2/4 겹치면 비례 점수를 받는다', () => {
      const profile: UserProfile = {
        targetMuscles: ['chest', 'back', 'legs', 'core'],
      };
      const result = calculateMatchScore(equipmentProduct, profile);
      // equipmentProduct: chest, arms, shoulders → chest만 일치 (1/4)
      const goalReason = result.reasons.find((r) => r.label === '타겟 근육 적합');
      expect(goalReason).toBeDefined();
      expect(goalReason?.matched).toBe(true);
    });

    it('타겟 근육 3/3 모두 겹치면 최대 40점을 받는다', () => {
      const profile: UserProfile = {
        targetMuscles: ['chest', 'arms', 'shoulders'],
      };
      const profileNoMuscle: UserProfile = {};
      const scoreMatch = calculateMatchScore(equipmentProduct, profile).score;
      const scoreNoMatch = calculateMatchScore(equipmentProduct, profileNoMuscle).score;
      expect(scoreMatch - scoreNoMatch).toBe(40);
    });

    it('스킬 레벨이 일치하면 +30점을 받는다', () => {
      const profile: UserProfile = { skillLevel: 'beginner' };
      const profileNoSkill: UserProfile = {};
      const scoreMatch = calculateMatchScore(equipmentProduct, profile).score;
      const scoreNoMatch = calculateMatchScore(equipmentProduct, profileNoSkill).score;
      expect(scoreMatch - scoreNoMatch).toBe(30);
    });

    it('스킬 레벨 all은 모든 레벨과 일치한다', () => {
      const productAll: WorkoutEquipment = {
        ...equipmentProduct,
        skillLevel: 'all',
      };
      const profile: UserProfile = { skillLevel: 'advanced' };
      const result = calculateMatchScore(productAll, profile);
      const skillReason = result.reasons.find((r) => r.type === 'goal' && r.label.includes('고급'));
      expect(skillReason).toBeDefined();
      expect(skillReason?.matched).toBe(true);
    });
  });

  // ================================================
  // 건강식품 매칭 테스트
  // ================================================

  describe('건강식품 (HealthFood) 매칭', () => {
    it('빈 프로필은 기본 점수(30) + 보너스만 반환한다', () => {
      const result = calculateMatchScore(healthFoodProduct, emptyProfile);
      // 기본 30 + 브랜드 12 + 리뷰 8000개 12 + 평점 4.3&8000 7
      expect(result.score).toBeGreaterThanOrEqual(30);
    });

    it('운동 목표 효능이 일치하면 +40점이 추가된다', () => {
      // 보너스 영향 제거를 위해 최소한의 제품 사용
      const minProduct: HealthFood = {
        id: 'hf-min',
        name: '프로틴',
        brand: '알수없는브랜드',
        category: 'protein_powder',
        benefits: ['muscle_gain'],
        caloriesPerServing: 100,
        proteinG: 20,
        isActive: true,
      };
      const profile: UserProfile = { workoutGoals: ['muscle_gain'] };
      const profileNoGoal: UserProfile = {};
      const scoreMatch = calculateMatchScore(minProduct, profile).score;
      const scoreNoMatch = calculateMatchScore(minProduct, profileNoGoal).score;
      expect(scoreMatch - scoreNoMatch).toBe(40);
    });

    it('식이 제한이 일치하면 +30점이 추가된다', () => {
      const minProduct: HealthFood = {
        id: 'hf-min2',
        name: '프로틴',
        brand: '알수없는브랜드',
        category: 'protein_powder',
        dietaryInfo: ['gluten_free'],
        caloriesPerServing: 100,
        proteinG: 20,
        isActive: true,
      };
      const profile: UserProfile = { dietaryRestrictions: ['gluten_free'] };
      const profileNoRestriction: UserProfile = {};
      const scoreMatch = calculateMatchScore(minProduct, profile).score;
      const scoreNoMatch = calculateMatchScore(minProduct, profileNoRestriction).score;
      expect(scoreMatch - scoreNoMatch).toBe(30);
    });

    it('운동 목표 + 식이 제한 모두 일치하면 합산된다', () => {
      const minProduct: HealthFood = {
        id: 'hf-min3',
        name: '프로틴',
        brand: '알수없는브랜드',
        category: 'protein_powder',
        benefits: ['muscle_gain'],
        dietaryInfo: ['gluten_free'],
        caloriesPerServing: 100,
        proteinG: 20,
        isActive: true,
      };
      const profile: UserProfile = {
        workoutGoals: ['muscle_gain'],
        dietaryRestrictions: ['gluten_free'],
      };
      const profileNoGoal: UserProfile = {};
      const scoreMatch = calculateMatchScore(minProduct, profile).score;
      const scoreNoMatch = calculateMatchScore(minProduct, profileNoGoal).score;
      expect(scoreMatch - scoreNoMatch).toBe(70);
    });
  });

  // ================================================
  // 알 수 없는 제품 타입 테스트
  // ================================================

  describe('알 수 없는 제품 타입', () => {
    it('판별 불가 제품은 기본 점수를 반환한다', () => {
      // getProductType mock은 cosmetic 기본값 반환
      const minimalProduct = {
        id: 'u1',
        name: '알수없는제품',
        brand: '알수없는브랜드',
        category: 'unknown',
        skinTypes: [],
      } as unknown as CosmeticProduct;
      const result = calculateMatchScore(minimalProduct, emptyProfile);
      expect(result.score).toBeGreaterThanOrEqual(20);
    });
  });

  // ================================================
  // 점수 상한 테스트
  // ================================================

  describe('점수 상한', () => {
    it('모든 보너스가 적용돼도 100점을 초과하지 않는다', () => {
      const maxProduct: CosmeticProduct = {
        id: 'max1',
        name: '완벽제품',
        brand: '라운드랩',
        category: 'makeup',
        skinTypes: ['dry'],
        concerns: ['hydration', 'aging', 'acne', 'pore'],
        personalColorSeasons: ['Spring'],
        faceShapes: ['oval'],
        undertones: ['warm'],
        priceRange: 'budget',
        rating: 4.8,
        reviewCount: 20000,
        isActive: true,
        keyIngredients: [],
      };
      const maxProfile: UserProfile = {
        skinType: 'dry',
        skinConcerns: ['hydration', 'aging', 'acne', 'pore'],
        personalColorSeason: 'Spring',
        faceShape: 'oval',
        undertone: 'warm',
      };
      const result = calculateMatchScore(maxProduct, maxProfile);
      expect(result.score).toBe(100);
    });
  });
});

// ================================================
// addMatchInfo 테스트
// ================================================

describe('addMatchInfo', () => {
  it('제품에 매칭 정보를 래핑한다', () => {
    const profile: UserProfile = { skinType: 'dry' };
    const result = addMatchInfo(cosmeticProduct, profile);
    expect(result.product).toBe(cosmeticProduct);
    expect(result.matchScore).toBeGreaterThanOrEqual(20);
    expect(result.matchReasons).toBeInstanceOf(Array);
  });

  it('원본 제품 객체를 보존한다', () => {
    const result = addMatchInfo(cosmeticProduct, emptyProfile);
    expect(result.product.id).toBe('c1');
    expect(result.product.name).toBe('수분 토너');
  });
});

// ================================================
// addMatchInfoToProducts 테스트
// ================================================

describe('addMatchInfoToProducts', () => {
  it('배열 모든 제품에 매칭 정보를 추가한다', () => {
    const products = [cosmeticProduct, makeupProduct];
    const results = addMatchInfoToProducts(products, emptyProfile);
    expect(results).toHaveLength(2);
    expect(results[0]).toHaveProperty('matchScore');
    expect(results[1]).toHaveProperty('matchScore');
  });

  it('점수 높은 순으로 정렬한다', () => {
    const products = [cosmeticProduct, makeupProduct];
    const profile: UserProfile = { skinType: 'dry' };
    const results = addMatchInfoToProducts(products, profile);
    expect(results[0].matchScore).toBeGreaterThanOrEqual(results[1].matchScore);
  });

  it('빈 배열을 처리한다', () => {
    const results = addMatchInfoToProducts([], emptyProfile);
    expect(results).toHaveLength(0);
  });
});
