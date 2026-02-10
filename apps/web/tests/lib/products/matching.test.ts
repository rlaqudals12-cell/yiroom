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

describe('가격 접근성 보너스', () => {
  it('저가 제품(budget)에 가장 높은 가격 보너스', () => {
    const budgetProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      priceRange: 'budget',
      priceKrw: 15000,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(budgetProduct, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'price', label: '가성비 좋음', matched: true })
    );
  });

  it('중가 제품(mid)에 중간 가격 보너스', () => {
    const midProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      priceRange: 'mid',
      priceKrw: 40000,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(midProduct, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'price', label: '합리적 가격', matched: true })
    );
  });

  it('고가 제품(premium)에 가격 보너스 없음', () => {
    const premiumProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      priceRange: 'premium',
      priceKrw: 80000,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(premiumProduct, profile);

    expect(result.reasons.find((r) => r.type === 'price')).toBeUndefined();
  });

  it('priceRange 없고 가격이 낮으면 budget으로 판단', () => {
    const cheapSupplement: SupplementProduct = {
      ...mockSupplementProduct,
      priceKrw: 20000,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(cheapSupplement, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'price', label: '가성비 좋음', matched: true })
    );
  });

  it('priceRange 없고 가격이 높으면 premium으로 판단', () => {
    const expensiveEquipment: WorkoutEquipment = {
      ...mockWorkoutEquipment,
      priceKrw: 150000,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(expensiveEquipment, profile);

    // 고가이므로 가격 보너스 없음
    expect(result.reasons.find((r) => r.type === 'price')).toBeUndefined();
  });
});

describe('대중 브랜드 보너스', () => {
  it('올리브영 인기 브랜드에 보너스 추가', () => {
    const popularBrandProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      brand: '라운드랩',
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(popularBrandProduct, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'brand', label: '인기 브랜드', matched: true })
    );
  });

  it('영양제 인기 브랜드에 보너스 추가', () => {
    const popularSupplement: SupplementProduct = {
      ...mockSupplementProduct,
      brand: '종근당건강',
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(popularSupplement, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'brand', label: '인기 브랜드', matched: true })
    );
  });

  it('건강식품 인기 브랜드에 보너스 추가', () => {
    const popularHealthFood: HealthFood = {
      ...mockHealthFood,
      brand: '마이프로틴',
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(popularHealthFood, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'brand', label: '인기 브랜드', matched: true })
    );
  });

  it('알려지지 않은 브랜드에는 보너스 없음', () => {
    const unknownBrandProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      brand: '알수없는브랜드XYZ',
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(unknownBrandProduct, profile);

    expect(result.reasons.find((r) => r.type === 'brand')).toBeUndefined();
  });

  it('브랜드가 없으면 보너스 없음', () => {
    const noBrandProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      brand: '',
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(noBrandProduct, profile);

    expect(result.reasons.find((r) => r.type === 'brand')).toBeUndefined();
  });
});

describe('리뷰 인기도 보너스', () => {
  it('베스트셀러(10000+ 리뷰)에 최고 보너스', () => {
    const bestsellerProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      reviewCount: 15000,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(bestsellerProduct, profile);

    const popularityReason = result.reasons.find((r) => r.type === 'popularity');
    expect(popularityReason).toBeDefined();
    expect(popularityReason?.label).toContain('베스트셀러');
    expect(popularityReason?.label).toContain('15천+ 리뷰');
  });

  it('인기 제품(5000+ 리뷰)에 높은 보너스', () => {
    const popularProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      reviewCount: 7000,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(popularProduct, profile);

    const popularityReason = result.reasons.find((r) => r.type === 'popularity');
    expect(popularityReason).toBeDefined();
    expect(popularityReason?.label).toContain('인기 제품');
    expect(popularityReason?.label).toContain('7천+ 리뷰');
  });

  it('검증된 제품(1000+ 리뷰)에 중간 보너스', () => {
    const verifiedProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      reviewCount: 2500,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(verifiedProduct, profile);

    const popularityReason = result.reasons.find((r) => r.type === 'popularity');
    expect(popularityReason).toBeDefined();
    expect(popularityReason?.label).toContain('검증된 제품');
    expect(popularityReason?.label).toContain('2천+ 리뷰');
  });

  it('500+ 리뷰에 소형 보너스', () => {
    const mediumProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      reviewCount: 600,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(mediumProduct, profile);

    const popularityReason = result.reasons.find((r) => r.type === 'popularity');
    expect(popularityReason).toBeDefined();
    expect(popularityReason?.label).toBe('600개 리뷰');
  });

  it('100개 미만 리뷰에 인기도 보너스 없음', () => {
    const lowReviewProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      reviewCount: 50,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(lowReviewProduct, profile);

    expect(result.reasons.find((r) => r.type === 'popularity')).toBeUndefined();
  });

  it('리뷰 없으면 인기도 보너스 없음', () => {
    const noReviewProduct: CosmeticProduct = {
      ...mockCosmeticProduct,
      reviewCount: undefined,
    };

    const profile: UserProfile = {};

    const result = calculateMatchScore(noReviewProduct, profile);

    expect(result.reasons.find((r) => r.type === 'popularity')).toBeUndefined();
  });
});

describe('헤어케어 매칭 (H-1)', () => {
  const mockShampooProduct: CosmeticProduct = {
    id: 'shampoo-1',
    name: '두피 케어 샴푸',
    brand: '닥터포헤어',
    category: 'shampoo',
    skinTypes: ['oily', 'normal'],
    concerns: ['hydration', 'pore'],
    priceKrw: 22000,
    rating: 4.4,
  };

  const mockTreatmentProduct: CosmeticProduct = {
    id: 'treatment-1',
    name: '헤어 트리트먼트',
    brand: '알수없는브랜드',
    category: 'hair-treatment',
    skinTypes: ['dry', 'sensitive'],
    concerns: ['hydration', 'aging'],
    priceKrw: 30000,
    rating: 4.1,
  };

  it('제품에 hairTypes 없을 때 프로필 보너스 (10점)', () => {
    const profile: UserProfile = {
      hairType: 'wavy',
    };

    const result = calculateMatchScore(mockShampooProduct, profile);

    // hairTypes 데이터 없으므로 matched: false (프로필 완성도 보너스)
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'hairType', matched: false })
    );
    // 기본 20 + hairType 10 = 30 이상
    expect(result.score).toBeGreaterThanOrEqual(30);
  });

  it('제품에 hairTypes 있고 매칭되면 30점', () => {
    const productWithHairTypes: CosmeticProduct = {
      ...mockShampooProduct,
      hairTypes: ['wavy', 'curly'],
    };
    const profile: UserProfile = { hairType: 'wavy' };
    const result = calculateMatchScore(productWithHairTypes, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'hairType', matched: true })
    );
    // 기본 20 + hairType 30 = 50 이상
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it('제품에 hairTypes 있지만 불일치면 0점', () => {
    const productWithHairTypes: CosmeticProduct = {
      ...mockShampooProduct,
      hairTypes: ['straight'],
    };
    const profile: UserProfile = { hairType: 'curly' };
    const result = calculateMatchScore(productWithHairTypes, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'hairType', matched: false })
    );
    // hairType 매칭 실패 → 0점 추가 (기본 20점만)
  });

  it('두피 타입 매칭 시 scalpType reason 추가 (30점)', () => {
    const profile: UserProfile = {
      scalpType: 'oily',
    };

    const result = calculateMatchScore(mockShampooProduct, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'scalpType', matched: true })
    );
    // 기본 20 + scalpType 30 = 50 이상
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it('두피 타입 불일치 시 scalpType matched=false', () => {
    const profile: UserProfile = {
      scalpType: 'dry',
    };

    const result = calculateMatchScore(mockShampooProduct, profile);

    // oily/normal 제품에 dry 프로필 → 불일치
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'scalpType', matched: false })
    );
  });

  it('모발 고민 매칭 시 concern reason 추가', () => {
    const profile: UserProfile = {
      hairConcerns: ['hydration'],
    };

    const result = calculateMatchScore(mockShampooProduct, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'concern', matched: true })
    );
  });

  it('hairType + scalpType + hairConcerns 복합 매칭', () => {
    const profile: UserProfile = {
      hairType: 'straight',
      scalpType: 'oily',
      hairConcerns: ['hydration'],
    };

    const result = calculateMatchScore(mockShampooProduct, profile);

    // 기본 20 + hairType 10 + scalpType 30 + concern 20 + brand 보너스 = 92
    expect(result.score).toBeGreaterThanOrEqual(80);
    // scalpType, concern 매칭 확인 (hairType은 matched: false)
    expect(result.reasons.filter((r) => r.matched).length).toBeGreaterThanOrEqual(2);
    expect(result.reasons.map((r) => r.type)).toContain('hairType');
    expect(result.reasons.map((r) => r.type)).toContain('scalpType');
    expect(result.reasons.map((r) => r.type)).toContain('concern');
  });

  it('헤어케어 인기 브랜드에 보너스 추가', () => {
    const profile: UserProfile = {};

    const result = calculateMatchScore(mockShampooProduct, profile);

    // '닥터포헤어'는 POPULAR_BRANDS.haircare에 포함
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'brand', label: '인기 브랜드', matched: true })
    );
  });

  it('hair-treatment 카테고리도 헤어케어 매칭 로직 적용', () => {
    const profile: UserProfile = {
      hairType: 'curly',
      scalpType: 'dry',
    };

    const result = calculateMatchScore(mockTreatmentProduct, profile);

    // hairType(프로필 보너스, matched: false) + scalpType(dry 매칭) → 두 reason 모두 존재
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'hairType', matched: false })
    );
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'scalpType', matched: true })
    );
  });
});

describe('메이크업 언더톤 매칭 (M-1)', () => {
  const mockMakeupForUndertone: CosmeticProduct = {
    id: 'makeup-ut-1',
    name: '쿨톤 립',
    brand: '테스트 브랜드',
    category: 'makeup',
    subcategory: 'lip',
    personalColorSeasons: ['Summer'],
    priceKrw: 25000,
    rating: 4.3,
  };

  it('메이크업 제품 + undertone 프로필 시 undertone reason 추가 (15점)', () => {
    const profile: UserProfile = {
      undertone: 'cool',
    };

    const result = calculateMatchScore(mockMakeupForUndertone, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'undertone', matched: true })
    );
    // 기본 20 + undertone 15 = 35 이상
    expect(result.score).toBeGreaterThanOrEqual(35);
  });

  it('personalColor + undertone 복합 매칭', () => {
    const profile: UserProfile = {
      personalColorSeason: 'Summer',
      undertone: 'cool',
    };

    const result = calculateMatchScore(mockMakeupForUndertone, profile);

    // personalColor(20점) + undertone(15점) 모두 적용
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'personalColor', matched: true })
    );
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'undertone', matched: true })
    );
    // 기본 20 + personalColor 20 + undertone 15 = 55 이상
    expect(result.score).toBeGreaterThanOrEqual(55);
  });

  it('비메이크업 제품에는 undertone 매칭 없음', () => {
    const serumProduct: CosmeticProduct = {
      id: 'serum-ut-1',
      name: '보습 세럼',
      brand: '테스트',
      category: 'serum',
      priceKrw: 30000,
      rating: 4.0,
    };

    const profile: UserProfile = {
      undertone: 'warm',
    };

    const result = calculateMatchScore(serumProduct, profile);

    // serum은 메이크업이 아니므로 undertone reason 없음
    expect(result.reasons.find((r) => r.type === 'undertone')).toBeUndefined();
  });
});

describe('메이크업 얼굴형 매칭 (M-1 faceShape)', () => {
  const mockMakeupWithFaceShapes: CosmeticProduct = {
    id: 'makeup-fs-1',
    name: '컨투어링 팔레트',
    brand: '테스트 브랜드',
    category: 'makeup',
    subcategory: 'contour',
    faceShapes: ['round', 'square'],
    priceKrw: 25000,
    rating: 4.2,
  };

  it('faceShapes 있고 매칭되면 20점 + matched: true', () => {
    const profile: UserProfile = { faceShape: 'round' };
    const result = calculateMatchScore(mockMakeupWithFaceShapes, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'faceShape', matched: true })
    );
    // 기본 20 + faceShape 20 = 40 이상
    expect(result.score).toBeGreaterThanOrEqual(40);
  });

  it('faceShapes 있지만 불일치면 matched: false, 0점', () => {
    const profile: UserProfile = { faceShape: 'oval' };
    const result = calculateMatchScore(mockMakeupWithFaceShapes, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'faceShape', matched: false })
    );
  });

  it('faceShapes 없으면 프로필 보너스 5점', () => {
    const makeupNoFaceShapes: CosmeticProduct = {
      id: 'makeup-nofs-1',
      name: '립스틱',
      brand: '테스트',
      category: 'makeup',
      priceKrw: 20000,
      rating: 4.0,
    };
    const profile: UserProfile = { faceShape: 'heart' };
    const result = calculateMatchScore(makeupNoFaceShapes, profile);

    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'faceShape', matched: false })
    );
    // 기본 20 + faceShape 보너스 5 = 25 이상
    expect(result.score).toBeGreaterThanOrEqual(25);
  });

  it('비메이크업 제품에는 faceShape 매칭 없음', () => {
    const serumProduct: CosmeticProduct = {
      id: 'serum-fs-1',
      name: '세럼',
      brand: '테스트',
      category: 'serum',
      priceKrw: 25000,
      rating: 4.0,
    };
    const profile: UserProfile = { faceShape: 'oval' };
    const result = calculateMatchScore(serumProduct, profile);

    expect(result.reasons.find((r) => r.type === 'faceShape')).toBeUndefined();
  });
});

describe('점수 상한 검증', () => {
  it('모든 보너스가 적용되어도 100점 이하', () => {
    // 모든 보너스가 적용될 수 있는 완벽한 제품
    const perfectProduct: CosmeticProduct = {
      id: 'perfect-1',
      name: '완벽한 제품',
      brand: '라운드랩', // 인기 브랜드 +12
      category: 'serum',
      skinTypes: ['dry', 'normal', 'combination', 'oily', 'sensitive'],
      concerns: ['hydration', 'aging', 'acne', 'whitening'],
      priceRange: 'budget', // 가성비 +15
      priceKrw: 15000,
      rating: 4.8, // 높은 평점 +10
      reviewCount: 20000, // 베스트셀러 +15
    };

    const perfectProfile: UserProfile = {
      skinType: 'dry', // 피부 타입 매칭 +30
      skinConcerns: ['hydration', 'aging'], // 피부 고민 매칭 +30
    };

    const result = calculateMatchScore(perfectProduct, perfectProfile);

    // 기본 20 + 피부타입 30 + 고민 30 + 가격 15 + 브랜드 12 + 인기도 15 + 평점 10 = 132
    // 상한 100으로 클램프
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('복합 매칭 시나리오', () => {
  it('피부 타입 + 고민 + 브랜드 + 가격 복합 매칭', () => {
    const product: CosmeticProduct = {
      id: 'complex-1',
      name: '복합 테스트 제품',
      brand: '토리든',
      category: 'moisturizer',
      skinTypes: ['dry'],
      concerns: ['hydration'],
      priceRange: 'budget',
      priceKrw: 18000,
      rating: 4.3,
      reviewCount: 3000,
    };

    const profile: UserProfile = {
      skinType: 'dry',
      skinConcerns: ['hydration'],
    };

    const result = calculateMatchScore(product, profile);

    // 여러 매칭 이유가 있어야 함
    expect(result.reasons.length).toBeGreaterThanOrEqual(4);
    expect(result.reasons.map((r) => r.type)).toContain('skinType');
    expect(result.reasons.map((r) => r.type)).toContain('concern');
    expect(result.reasons.map((r) => r.type)).toContain('brand');
    expect(result.reasons.map((r) => r.type)).toContain('price');
  });

  it('영양제 목표 + 브랜드 + 가격 복합 매칭', () => {
    const product: SupplementProduct = {
      id: 'supp-complex-1',
      name: '복합 영양제',
      brand: '뉴트리원',
      category: 'vitamin',
      benefits: ['skin', 'muscle'],
      mainIngredients: [
        { name: 'Vitamin C', amount: 1000, unit: 'mg' },
        { name: 'Protein', amount: 20, unit: 'g' },
      ],
      targetConcerns: ['피부 건강', '근육 성장'],
      priceKrw: 25000,
      rating: 4.5,
      reviewCount: 5500,
    };

    const profile: UserProfile = {
      skinConcerns: ['hydration'],
      workoutGoals: ['muscle_gain'],
    };

    const result = calculateMatchScore(product, profile);

    // 영양제 복합 매칭 확인
    expect(result.score).toBeGreaterThan(60);
    expect(result.reasons.map((r) => r.type)).toContain('brand');
  });
});

describe('엣지 케이스', () => {
  const mockShampoo: CosmeticProduct = {
    id: 'edge-shampoo',
    name: '엣지 케이스 샴푸',
    brand: '알수없는브랜드',
    category: 'shampoo',
    priceKrw: 15000,
    rating: 4.0,
  };

  it('모든 H-1 필드가 undefined인 프로필로 헤어케어 매칭', () => {
    const profile: UserProfile = {};
    const result = calculateMatchScore(mockShampoo, profile);

    // hairType/scalpType/hairConcerns 모두 없으므로 기본점만 부여
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.reasons.find((r) => r.type === 'hairType')).toBeUndefined();
    expect(result.reasons.find((r) => r.type === 'scalpType')).toBeUndefined();
  });

  it('product.skinTypes가 undefined인 경우 scalpType 매칭 건너뜀', () => {
    const productNoSkinTypes: CosmeticProduct = {
      ...mockShampoo,
      skinTypes: undefined,
    };
    const profile: UserProfile = { scalpType: 'oily' };
    const result = calculateMatchScore(productNoSkinTypes, profile);

    // skinTypes 없으므로 scalpType reason 없어야 함
    expect(result.reasons.find((r) => r.type === 'scalpType')).toBeUndefined();
  });

  it('product.concerns가 빈 배열인 경우 hairConcerns 매칭 건너뜀', () => {
    const productEmptyConcerns: CosmeticProduct = {
      ...mockShampoo,
      concerns: [],
    };
    const profile: UserProfile = { hairConcerns: ['hydration'] };
    const result = calculateMatchScore(productEmptyConcerns, profile);

    // concerns 빈 배열이므로 concern reason 없어야 함
    expect(result.reasons.find((r) => r.type === 'concern')).toBeUndefined();
  });

  it('hairConcerns가 빈 배열인 프로필', () => {
    const productWithConcerns: CosmeticProduct = {
      ...mockShampoo,
      concerns: ['hydration'],
    };
    const profile: UserProfile = { hairConcerns: [] };
    const result = calculateMatchScore(productWithConcerns, profile);

    // 빈 배열이므로 concern 매칭 건너뜀
    expect(result.reasons.find((r) => r.type === 'concern')).toBeUndefined();
  });

  it('undertone이 undefined인 메이크업 프로필', () => {
    const makeupProduct: CosmeticProduct = {
      id: 'edge-makeup',
      name: '엣지 파운데이션',
      brand: '테스트',
      category: 'makeup',
      personalColorSeasons: ['Spring'],
      priceKrw: 30000,
      rating: 4.2,
    };
    const profile: UserProfile = { personalColorSeason: 'Spring' };
    const result = calculateMatchScore(makeupProduct, profile);

    // undertone 없으므로 undertone reason 없어야 함
    expect(result.reasons.find((r) => r.type === 'undertone')).toBeUndefined();
    // personalColor는 매칭
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ type: 'personalColor', matched: true })
    );
  });
});
