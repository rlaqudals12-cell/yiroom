import { describe, it, expect } from 'vitest';

import {
  calculateMatchScore,
  addMatchInfo,
  addMatchInfoToProducts,
  type UserProfile,
} from '@/lib/products/matching';
import type {
  CosmeticProduct,
  SupplementProduct,
  WorkoutEquipment,
  HealthFood,
} from '@/types/product';

// Mock 데이터
const mockCosmeticProduct: CosmeticProduct = {
  id: 'cosmetic-1',
  name: '수분 세럼',
  brand: '테스트 브랜드',
  category: 'serum',
  skinTypes: ['dry', 'normal'],
  concerns: ['hydration', 'aging'],
  personalColorSeasons: ['Summer', 'Winter'],
  priceKrw: 35000,
  rating: 4.5,
};

const mockMakeupProduct: CosmeticProduct = {
  id: 'makeup-1',
  name: '립스틱',
  brand: '메이크업 브랜드',
  category: 'makeup',
  subcategory: 'lip',
  personalColorSeasons: ['Summer', 'Spring'],
  priceKrw: 28000,
  rating: 4.2,
};

const mockSupplementProduct: SupplementProduct = {
  id: 'supplement-1',
  name: '비타민 C',
  brand: '영양제 브랜드',
  category: 'vitamin',
  benefits: ['skin', 'immunity'],
  mainIngredients: [{ name: 'Vitamin C', amount: 1000, unit: 'mg' }], // getProductType 판별용
  targetConcerns: ['피부 건강', '면역력'],
  priceKrw: 25000,
  rating: 4.7,
};

const mockWorkoutEquipment: WorkoutEquipment = {
  id: 'equipment-1',
  name: '덤벨 세트',
  brand: '운동기구 브랜드',
  category: 'dumbbell',
  targetMuscles: ['arms', 'shoulders'],
  skillLevel: 'all',
  priceKrw: 50000,
  rating: 4.8,
};

const mockHealthFood: HealthFood = {
  id: 'healthfood-1',
  name: '프로틴 파우더',
  brand: '건강식품 브랜드',
  category: 'protein_powder',
  benefits: ['muscle_gain', 'recovery'],
  dietaryInfo: ['gluten_free'],
  proteinG: 25,
  caloriesPerServing: 120,
  priceKrw: 45000,
  rating: 4.6,
};

describe('calculateMatchScore', () => {
  describe('화장품 매칭', () => {
    it('피부 타입 + 고민 매칭 시 높은 점수', () => {
      const profile: UserProfile = {
        skinType: 'dry',
        skinConcerns: ['hydration'],
      };

      const result = calculateMatchScore(mockCosmeticProduct, profile);

      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.reasons).toContainEqual(
        expect.objectContaining({ type: 'skinType', matched: true })
      );
      expect(result.reasons).toContainEqual(
        expect.objectContaining({ type: 'concern', matched: true })
      );
    });

    it('피부 타입 불일치 시 낮은 점수', () => {
      const profile: UserProfile = {
        skinType: 'oily',
        skinConcerns: ['acne'],
      };

      const result = calculateMatchScore(mockCosmeticProduct, profile);

      expect(result.score).toBeLessThan(50);
    });

    it('메이크업 제품에 퍼스널 컬러 매칭', () => {
      const profile: UserProfile = {
        skinType: 'normal',
        personalColorSeason: 'Summer',
      };

      const result = calculateMatchScore(mockMakeupProduct, profile);

      expect(result.reasons).toContainEqual(
        expect.objectContaining({ type: 'personalColor', matched: true })
      );
    });
  });

  describe('영양제 매칭', () => {
    it('피부 관련 효능 매칭', () => {
      const profile: UserProfile = {
        skinConcerns: ['hydration'],
      };

      const result = calculateMatchScore(mockSupplementProduct, profile);

      expect(result.score).toBeGreaterThanOrEqual(50);
    });

    it('운동 목표 연동', () => {
      const profile: UserProfile = {
        workoutGoals: ['muscle_gain'],
      };

      const result = calculateMatchScore(mockSupplementProduct, profile);

      // muscle 효능이 있으면 운동 목표 지원
      expect(result.score).toBeGreaterThanOrEqual(20);
    });
  });

  describe('운동 기구 매칭', () => {
    it('타겟 근육 매칭', () => {
      const profile: UserProfile = {
        targetMuscles: ['arms'],
      };

      const result = calculateMatchScore(mockWorkoutEquipment, profile);

      expect(result.score).toBeGreaterThanOrEqual(50);
    });

    it('스킬 레벨 매칭', () => {
      const profile: UserProfile = {
        skillLevel: 'beginner',
      };

      const result = calculateMatchScore(mockWorkoutEquipment, profile);

      // skillLevel이 'all'이므로 매칭됨
      expect(result.reasons).toContainEqual(expect.objectContaining({ matched: true }));
    });
  });

  describe('건강식품 매칭', () => {
    it('운동 목표 연동', () => {
      const profile: UserProfile = {
        workoutGoals: ['muscle_gain'],
      };

      const result = calculateMatchScore(mockHealthFood, profile);

      expect(result.score).toBeGreaterThanOrEqual(60);
    });

    it('식이 제한 매칭', () => {
      const profile: UserProfile = {
        dietaryRestrictions: ['gluten_free'],
      };

      const result = calculateMatchScore(mockHealthFood, profile);

      expect(result.score).toBeGreaterThanOrEqual(50);
    });
  });
});

describe('addMatchInfo', () => {
  it('제품에 매칭 정보 추가', () => {
    const profile: UserProfile = {
      skinType: 'dry',
      skinConcerns: ['hydration'],
    };

    const result = addMatchInfo(mockCosmeticProduct, profile);

    expect(result.product).toBe(mockCosmeticProduct);
    expect(result.matchScore).toBeGreaterThan(0);
    expect(result.matchReasons).toBeInstanceOf(Array);
  });
});

describe('addMatchInfoToProducts', () => {
  it('제품 목록에 매칭 정보 추가 및 점수순 정렬', () => {
    const products = [mockCosmeticProduct, mockMakeupProduct];
    const profile: UserProfile = {
      skinType: 'dry',
      skinConcerns: ['hydration'],
      personalColorSeason: 'Summer',
    };

    const result = addMatchInfoToProducts(products, profile);

    expect(result).toHaveLength(2);
    // 점수순 정렬 확인
    expect(result[0].matchScore).toBeGreaterThanOrEqual(result[1].matchScore);
  });
});

describe('리뷰 평점 보너스', () => {
  it('높은 평점 + 많은 리뷰 시 보너스 점수 추가', () => {
    const highRatedProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      rating: 4.6,
      reviewCount: 150,
    };

    const profile: UserProfile = {
      skinType: 'dry',
    };

    const result = calculateMatchScore(highRatedProduct, profile);

    // 인기 제품 보너스 (+10) 포함
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'rating', matched: true })
    );
    expect(result.reasons.find((r) => r.type === 'rating')?.label).toContain('높은 평점');
  });

  it('적당한 평점 + 적당한 리뷰 시 중간 보너스', () => {
    const mediumRatedProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      rating: 4.2,
      reviewCount: 60,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(mediumRatedProduct, profile);

    expect(result.reasons.find((r) => r.type === 'rating')?.label).toContain('좋은 평점');
  });

  it('낮은 평점 시 보너스 없음', () => {
    const lowRatedProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      rating: 3.0,
      reviewCount: 50,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(lowRatedProduct, profile);

    expect(result.reasons.find((r) => r.type === 'rating')).toBeUndefined();
  });

  it('리뷰 수 적을 시 보너스 없음', () => {
    const fewReviewsProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      rating: 4.8,
      reviewCount: 5,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(fewReviewsProduct, profile);

    expect(result.reasons.find((r) => r.type === 'rating')).toBeUndefined();
  });
});
