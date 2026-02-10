/**
 * 제품 매칭도 계산 로직
 * @description 사용자 프로필 기반 제품 매칭 점수 계산
 */

import type {
  AnyProduct,
  CosmeticProduct,
  SupplementProduct,
  WorkoutEquipment,
  HealthFood,
  MatchReason,
  ProductWithMatch,
  SkinType,
  SkinConcern,
  PersonalColorSeason,
} from '@/types/product';
import { getProductType } from './services/search';

/**
 * 사용자 프로필 인터페이스
 */
export interface UserProfile {
  // PC-1 퍼스널컬러
  personalColorSeason?: PersonalColorSeason;

  // S-1 피부 분석
  skinType?: SkinType;
  skinConcerns?: SkinConcern[];

  // W-1 운동 분석
  workoutGoals?: string[];
  targetMuscles?: string[];
  skillLevel?: string;

  // N-1 영양 분석
  nutritionGoals?: string[];
  dietaryRestrictions?: string[];

  // H-1 헤어 분석
  hairType?: string;
  scalpType?: string;
  hairConcerns?: string[];

  // M-1 메이크업 분석
  undertone?: string; // 허용: 'warm' | 'cool' | 'neutral'
  // TODO: Phase 2에서 cosmetic_products에 face_shapes 컬럼 추가 후 매칭 로직 구현
  faceShape?: string; // 허용: 'oval' | 'round' | 'square' | 'heart' | 'oblong'
}

/**
 * 매칭 점수 계산 결과
 */
export interface MatchResult {
  score: number; // 0-100
  reasons: MatchReason[];
}

// ================================================
// 화장품 매칭
// ================================================

/**
 * 화장품 매칭 점수 계산
 * - 피부 타입 매칭: 0-30점
 * - 피부 고민 매칭: 0-30점
 * - 퍼스널 컬러 매칭: 0-20점 (메이크업만)
 * - 기본 점수: 20점
 */
function calculateCosmeticMatchScore(product: CosmeticProduct, profile: UserProfile): MatchResult {
  const reasons: MatchReason[] = [];
  let score = 20; // 기본 점수

  // 헤어케어 카테고리 감지
  const isHaircare = ['shampoo', 'conditioner', 'hair-treatment', 'scalp-care'].includes(
    product.category
  );

  if (isHaircare) {
    return calculateHaircareMatchScore(product, profile, score, reasons);
  }

  // 피부 타입 매칭 (30점)
  if (profile.skinType && product.skinTypes) {
    const skinTypeMatched = product.skinTypes.includes(profile.skinType);
    reasons.push({
      type: 'skinType',
      label: getSkinTypeLabel(profile.skinType),
      matched: skinTypeMatched,
    });
    if (skinTypeMatched) {
      score += 30;
    }
  }

  // 피부 고민 매칭 (30점)
  if (profile.skinConcerns && profile.skinConcerns.length > 0 && product.concerns) {
    const matchedConcerns = profile.skinConcerns.filter((concern) =>
      product.concerns?.includes(concern)
    );
    const concernMatch = matchedConcerns.length > 0;

    matchedConcerns.forEach((concern) => {
      reasons.push({
        type: 'concern',
        label: getSkinConcernLabel(concern),
        matched: true,
      });
    });

    if (concernMatch) {
      // 매칭된 고민 수에 비례하여 점수 부여 (최대 30점)
      const matchRatio = matchedConcerns.length / profile.skinConcerns.length;
      score += Math.round(30 * matchRatio);
    }
  }

  // 퍼스널 컬러 매칭 - 메이크업만 (20점)
  if (
    product.category === 'makeup' &&
    profile.personalColorSeason &&
    product.personalColorSeasons
  ) {
    const colorMatched = product.personalColorSeasons.includes(profile.personalColorSeason);
    reasons.push({
      type: 'personalColor',
      label: `${profile.personalColorSeason} 타입`,
      matched: colorMatched,
    });
    if (colorMatched) {
      score += 20;
    }
  }

  // 언더톤 매칭 - 메이크업 추가 점수 (15점, M-1)
  if (product.category === 'makeup' && profile.undertone) {
    // 언더톤 기반 색상 적합도 (제품 키워드/태그에 언더톤 정보가 있을 때)
    const undertoneLabel = getUndertoneLabel(profile.undertone);
    reasons.push({
      type: 'undertone',
      label: undertoneLabel,
      matched: true,
    });
    score += 15;
  }

  return {
    score: Math.min(100, score),
    reasons,
  };
}

// ================================================
// 헤어케어 매칭 (H-1)
// ================================================

/**
 * 헤어케어 제품 매칭 점수 계산
 * - 모발 타입 매칭: 0-30점
 * - 두피 타입 매칭: 0-30점
 * - 모발 고민 매칭: 0-20점
 * - 기본 점수: 20점
 */
function calculateHaircareMatchScore(
  product: CosmeticProduct,
  profile: UserProfile,
  baseScore: number,
  reasons: MatchReason[]
): MatchResult {
  let score = baseScore;

  // 모발 타입 프로필 보너스 (15점)
  // TODO: Phase 2에서 cosmetic_products에 hair_types 컬럼 추가 후 제품 기반 매칭 구현
  // 현재 CosmeticProduct에 hair_types 필드가 없으므로 프로필 완성도 보너스만 부여
  if (profile.hairType) {
    const hairTypeLabel = getHairTypeLabel(profile.hairType);
    reasons.push({
      type: 'hairType',
      label: hairTypeLabel,
      matched: false,
    });
    score += 15;
  }

  // 두피 타입 매칭 (30점) — 제품 skinTypes 필드 재활용 (두피도 dry/oily/sensitive)
  if (profile.scalpType && product.skinTypes) {
    const scalpMatched = product.skinTypes.includes(profile.scalpType as SkinType);
    const scalpLabel = getScalpTypeLabel(profile.scalpType);
    reasons.push({
      type: 'scalpType',
      label: scalpLabel,
      matched: scalpMatched,
    });
    if (scalpMatched) {
      score += 30;
    }
  }

  // 모발 고민 매칭 (20점)
  if (profile.hairConcerns && profile.hairConcerns.length > 0 && product.concerns) {
    const matchedConcerns = profile.hairConcerns.filter((concern) =>
      product.concerns?.some((c) => c.toLowerCase().includes(concern.toLowerCase()))
    );

    if (matchedConcerns.length > 0) {
      reasons.push({
        type: 'concern',
        label: '모발 고민 적합',
        matched: true,
      });
      const matchRatio = matchedConcerns.length / profile.hairConcerns.length;
      score += Math.round(20 * matchRatio);
    }
  }

  return {
    score: Math.min(100, score),
    reasons,
  };
}

// ================================================
// 영양제 매칭
// ================================================

/**
 * 영양제 매칭 점수 계산
 * - 효능 매칭: 0-40점
 * - 목표 매칭: 0-40점
 * - 기본 점수: 20점
 */
function calculateSupplementMatchScore(
  product: SupplementProduct,
  profile: UserProfile
): MatchResult {
  const reasons: MatchReason[] = [];
  let score = 20; // 기본 점수

  // 피부 관련 효능 매칭
  if (profile.skinConcerns && profile.skinConcerns.length > 0 && product.benefits) {
    const skinRelatedBenefits = ['skin', 'hair'];
    const hasSkinBenefit = product.benefits.some((b) => skinRelatedBenefits.includes(b));

    if (hasSkinBenefit) {
      reasons.push({
        type: 'concern',
        label: '피부/모발 건강',
        matched: true,
      });
      score += 30;
    }
  }

  // 영양 목표 매칭
  if (profile.nutritionGoals && profile.nutritionGoals.length > 0 && product.targetConcerns) {
    const matchedGoals = profile.nutritionGoals.filter((goal) =>
      product.targetConcerns?.some((concern) => concern.toLowerCase().includes(goal.toLowerCase()))
    );

    if (matchedGoals.length > 0) {
      reasons.push({
        type: 'goal',
        label: '영양 목표에 적합',
        matched: true,
      });
      score += 30;
    }
  }

  // 운동 목표 연동
  if (profile.workoutGoals && profile.workoutGoals.length > 0 && product.benefits) {
    const workoutRelatedBenefits = ['muscle', 'energy', 'bone'];
    const hasWorkoutBenefit = product.benefits.some((b) => workoutRelatedBenefits.includes(b));

    if (hasWorkoutBenefit) {
      reasons.push({
        type: 'goal',
        label: '운동 목표 지원',
        matched: true,
      });
      score += 20;
    }
  }

  return {
    score: Math.min(100, score),
    reasons,
  };
}

// ================================================
// 운동 기구 매칭
// ================================================

/**
 * 운동 기구 매칭 점수 계산
 * - 타겟 근육 매칭: 0-40점
 * - 스킬 레벨 매칭: 0-30점
 * - 장소 매칭: 0-10점
 * - 기본 점수: 20점
 */
function calculateEquipmentMatchScore(
  product: WorkoutEquipment,
  profile: UserProfile
): MatchResult {
  const reasons: MatchReason[] = [];
  let score = 20; // 기본 점수

  // 타겟 근육 매칭
  if (profile.targetMuscles && profile.targetMuscles.length > 0 && product.targetMuscles) {
    const matchedMuscles = profile.targetMuscles.filter((muscle) =>
      product.targetMuscles?.includes(
        muscle as 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'full_body'
      )
    );

    if (matchedMuscles.length > 0) {
      reasons.push({
        type: 'goal',
        label: '타겟 근육 적합',
        matched: true,
      });
      const matchRatio = matchedMuscles.length / profile.targetMuscles.length;
      score += Math.round(40 * matchRatio);
    }
  }

  // 스킬 레벨 매칭
  if (profile.skillLevel && product.skillLevel) {
    const levelMatched = product.skillLevel === 'all' || product.skillLevel === profile.skillLevel;

    reasons.push({
      type: 'goal',
      label: getSkillLevelLabel(profile.skillLevel),
      matched: levelMatched,
    });

    if (levelMatched) {
      score += 30;
    }
  }

  return {
    score: Math.min(100, score),
    reasons,
  };
}

// ================================================
// 건강식품 매칭
// ================================================

/**
 * 건강식품 매칭 점수 계산
 * - 효능 매칭: 0-40점
 * - 식이 제한 매칭: 0-30점
 * - 기본 점수: 30점
 */
function calculateHealthFoodMatchScore(product: HealthFood, profile: UserProfile): MatchResult {
  const reasons: MatchReason[] = [];
  let score = 30; // 기본 점수

  // 운동 목표 연동 효능 매칭
  if (profile.workoutGoals && profile.workoutGoals.length > 0 && product.benefits) {
    const goalToBenefit: Record<string, string[]> = {
      muscle_gain: ['muscle_gain', 'recovery'],
      weight_loss: ['weight_loss', 'energy'],
      endurance: ['endurance', 'energy', 'hydration'],
    };

    let benefitMatched = false;
    profile.workoutGoals.forEach((goal) => {
      const relatedBenefits = goalToBenefit[goal] || [];
      const hasRelatedBenefit = product.benefits?.some((b) => relatedBenefits.includes(b));
      if (hasRelatedBenefit) {
        benefitMatched = true;
      }
    });

    if (benefitMatched) {
      reasons.push({
        type: 'goal',
        label: '운동 목표에 적합',
        matched: true,
      });
      score += 40;
    }
  }

  // 식이 제한 매칭
  if (
    profile.dietaryRestrictions &&
    profile.dietaryRestrictions.length > 0 &&
    product.dietaryInfo
  ) {
    const matchedRestrictions = profile.dietaryRestrictions.filter((restriction) =>
      product.dietaryInfo?.includes(
        restriction as
          | 'vegan'
          | 'vegetarian'
          | 'gluten_free'
          | 'lactose_free'
          | 'keto'
          | 'sugar_free'
          | 'organic'
          | 'non_gmo'
      )
    );

    if (matchedRestrictions.length > 0) {
      reasons.push({
        type: 'goal',
        label: '식이 조건 충족',
        matched: true,
      });
      score += 30;
    }
  }

  return {
    score: Math.min(100, score),
    reasons,
  };
}

// ================================================
// 대중성 관련 보너스 (가격, 브랜드, 리뷰)
// ================================================

/**
 * 올리브영/화해에서 쉽게 구할 수 있는 대중 브랜드 목록
 */
const POPULAR_BRANDS: Record<string, string[]> = {
  // 스킨케어 - 올리브영 어워즈 수상 브랜드
  skincare: [
    '라운드랩',
    '아누아',
    '토리든',
    '달바',
    '닥터지',
    '클레어스',
    '비플레인',
    '구달',
    '메디힐',
    '웰라쥬',
    '코스알엑스',
    '이니스프리',
    '미샤',
    '넘버즈인',
    '에스네이처',
    '메디큐브',
    '마녀공장',
    '아이소이',
    '피지오겔',
    '라로슈포제',
    '세타필',
    '더마비',
    '에뛰드',
    '클리오',
  ],
  // 영양제 - 대중적 브랜드
  supplement: [
    '종근당건강',
    '뉴트리원',
    '센트룸',
    '얼라이브',
    '솔가',
    '나우푸드',
    '닥터스베스트',
    '네이처메이드',
    '일양약품',
    'GNC',
    '뉴트리라이트',
  ],
  // 운동기구 - 인지도 있는 브랜드
  equipment: ['하이퍼', '핏번', '나이키', '아디다스', '스포틱', '반석스포츠'],
  // 건강식품 - 대중적 브랜드
  healthfood: [
    '마이프로틴',
    '옵티멈 뉴트리션',
    'BSN',
    '신타6',
    '머슬팜',
    '랩노쉬',
    '하이뮨',
    '일동후디스',
  ],
  // 헤어케어 - 대중적 브랜드 (H-1)
  haircare: [
    '다슈',
    '닥터포헤어',
    '려',
    'TS',
    '라보에이치',
    '헤드앤숄더',
    '케라시스',
    '미쟝센',
    '쿤달',
    '아모스',
    '모로칸오일',
    '라우쉬',
  ],
};

/**
 * 가격대 판단 (priceKrw 기반)
 */
function getPriceRange(product: AnyProduct): 'budget' | 'mid' | 'premium' | null {
  // CosmeticProduct는 priceRange 필드 사용
  const cosmetic = product as CosmeticProduct;
  if (cosmetic.priceRange) {
    return cosmetic.priceRange;
  }

  // 다른 제품은 가격으로 판단
  const priceKrw =
    (product as SupplementProduct).priceKrw ||
    (product as WorkoutEquipment).priceKrw ||
    (product as HealthFood).priceKrw;

  if (!priceKrw) return null;

  if (priceKrw < 30000) return 'budget';
  if (priceKrw < 60000) return 'mid';
  return 'premium';
}

/**
 * 가격대별 접근성 보너스 (저렴할수록 높은 점수)
 * - budget (저가): +15점
 * - mid (중가): +8점
 * - premium (고가): +0점
 */
function calculatePriceAccessibilityBonus(product: AnyProduct): {
  score: number;
  reason: MatchReason | null;
} {
  const priceRange = getPriceRange(product);

  if (!priceRange) return { score: 0, reason: null };

  let bonus = 0;
  let label = '';

  switch (priceRange) {
    case 'budget':
      bonus = 15;
      label = '가성비 좋음';
      break;
    case 'mid':
      bonus = 8;
      label = '합리적 가격';
      break;
    case 'premium':
      // premium은 기본값(0) 사용
      break;
  }

  if (bonus > 0) {
    return {
      score: bonus,
      reason: {
        type: 'price',
        label,
        matched: true,
      },
    };
  }

  return { score: 0, reason: null };
}

/**
 * 대중 브랜드 보너스 (구하기 쉬운 브랜드)
 * - 올리브영/쿠팡에서 쉽게 구할 수 있는 브랜드: +12점
 */
function calculatePopularBrandBonus(product: AnyProduct): {
  score: number;
  reason: MatchReason | null;
} {
  const brand = product.brand;
  if (!brand) return { score: 0, reason: null };

  const productType = getProductType(product);
  let brandList: string[] = [];

  switch (productType) {
    case 'cosmetic': {
      // 헤어케어 카테고리는 별도 브랜드 리스트 사용
      const cosmeticProduct = product as CosmeticProduct;
      const isHaircare = ['shampoo', 'conditioner', 'hair-treatment', 'scalp-care'].includes(
        cosmeticProduct.category
      );
      brandList = isHaircare ? POPULAR_BRANDS.haircare : POPULAR_BRANDS.skincare;
      break;
    }
    case 'supplement':
      brandList = POPULAR_BRANDS.supplement;
      break;
    case 'workout_equipment':
      brandList = POPULAR_BRANDS.equipment;
      break;
    case 'health_food':
      brandList = POPULAR_BRANDS.healthfood;
      break;
  }

  const isPopular = brandList.some(
    (b) =>
      brand.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(brand.toLowerCase())
  );

  if (isPopular) {
    return {
      score: 12,
      reason: {
        type: 'brand',
        label: '인기 브랜드',
        matched: true,
      },
    };
  }

  return { score: 0, reason: null };
}

/**
 * 리뷰 인기도 보너스 (많이 구매/리뷰된 제품 = 대중적)
 * - 리뷰 10000개+: +15점 (베스트셀러)
 * - 리뷰 5000개+: +12점 (인기 제품)
 * - 리뷰 1000개+: +8점 (검증된 제품)
 * - 리뷰 500개+: +5점
 * - 리뷰 100개+: +3점
 */
function calculateReviewPopularityBonus(product: AnyProduct): {
  score: number;
  reason: MatchReason | null;
} {
  const reviewCount = product.reviewCount || 0;

  let bonus = 0;
  let label = '';

  if (reviewCount >= 10000) {
    bonus = 15;
    label = `베스트셀러 (${Math.floor(reviewCount / 1000)}천+ 리뷰)`;
  } else if (reviewCount >= 5000) {
    bonus = 12;
    label = `인기 제품 (${Math.floor(reviewCount / 1000)}천+ 리뷰)`;
  } else if (reviewCount >= 1000) {
    bonus = 8;
    label = `검증된 제품 (${Math.floor(reviewCount / 1000)}천+ 리뷰)`;
  } else if (reviewCount >= 500) {
    bonus = 5;
    label = `${reviewCount}개 리뷰`;
  } else if (reviewCount >= 100) {
    bonus = 3;
    label = `${reviewCount}개 리뷰`;
  }

  if (bonus > 0) {
    return {
      score: bonus,
      reason: {
        type: 'popularity',
        label,
        matched: true,
      },
    };
  }

  return { score: 0, reason: null };
}

/**
 * 리뷰 평점 기반 보너스 점수 계산
 * - 평점 4.5+ & 리뷰 100개+: 10점
 * - 평점 4.0+ & 리뷰 50개+: 7점
 * - 평점 3.5+ & 리뷰 20개+: 4점
 * - 그 외: 0점
 */
function calculateRatingBonus(product: AnyProduct): { score: number; reason: MatchReason | null } {
  const rating = product.rating;
  const reviewCount = product.reviewCount || 0;

  if (!rating || rating < 3.5 || reviewCount < 20) {
    return { score: 0, reason: null };
  }

  let bonus = 0;
  let label = '';

  if (rating >= 4.5 && reviewCount >= 100) {
    bonus = 10;
    label = `★${rating.toFixed(1)} 높은 평점`;
  } else if (rating >= 4.0 && reviewCount >= 50) {
    bonus = 7;
    label = `★${rating.toFixed(1)} 좋은 평점`;
  } else if (rating >= 3.5 && reviewCount >= 20) {
    bonus = 4;
    label = `★${rating.toFixed(1)}`;
  }

  if (bonus > 0) {
    return {
      score: bonus,
      reason: {
        type: 'rating',
        label,
        matched: true,
      },
    };
  }

  return { score: 0, reason: null };
}

// ================================================
// 통합 매칭 함수
// ================================================

/**
 * 제품 매칭 점수 계산
 * @param product 제품
 * @param profile 사용자 프로필
 * @returns 매칭 점수 (0-100) 및 매칭 이유
 *
 * 대중성 우선 정책:
 * - 저렴한 가격대 우선 (budget +15, mid +8)
 * - 올리브영/화해 인기 브랜드 우선 (+12)
 * - 리뷰 많은 제품 우선 (최대 +15)
 * - 높은 평점 우선 (최대 +10)
 */
export function calculateMatchScore(product: AnyProduct, profile: UserProfile): MatchResult {
  const productType = getProductType(product);

  let result: MatchResult;

  switch (productType) {
    case 'cosmetic':
      result = calculateCosmeticMatchScore(product as CosmeticProduct, profile);
      break;
    case 'supplement':
      result = calculateSupplementMatchScore(product as SupplementProduct, profile);
      break;
    case 'workout_equipment':
      result = calculateEquipmentMatchScore(product as WorkoutEquipment, profile);
      break;
    case 'health_food':
      result = calculateHealthFoodMatchScore(product as HealthFood, profile);
      break;
    default:
      result = { score: 50, reasons: [] };
  }

  // === 대중성 보너스 추가 ===

  // 1. 가격 접근성 보너스 (저렴할수록 높은 점수)
  const priceBonus = calculatePriceAccessibilityBonus(product);
  if (priceBonus.score > 0 && priceBonus.reason) {
    result.score += priceBonus.score;
    result.reasons.push(priceBonus.reason);
  }

  // 2. 대중 브랜드 보너스 (올리브영 등에서 구하기 쉬운 브랜드)
  const brandBonus = calculatePopularBrandBonus(product);
  if (brandBonus.score > 0 && brandBonus.reason) {
    result.score += brandBonus.score;
    result.reasons.push(brandBonus.reason);
  }

  // 3. 리뷰 인기도 보너스 (많이 구매된 제품)
  const popularityBonus = calculateReviewPopularityBonus(product);
  if (popularityBonus.score > 0 && popularityBonus.reason) {
    result.score += popularityBonus.score;
    result.reasons.push(popularityBonus.reason);
  }

  // 4. 리뷰 평점 보너스
  const ratingBonus = calculateRatingBonus(product);
  if (ratingBonus.score > 0 && ratingBonus.reason) {
    result.score += ratingBonus.score;
    result.reasons.push(ratingBonus.reason);
  }

  // 점수 상한 (100점)
  result.score = Math.min(100, result.score);

  return result;
}

/**
 * 제품에 매칭 정보 추가
 * @param product 제품
 * @param profile 사용자 프로필
 */
export function addMatchInfo<T extends AnyProduct>(
  product: T,
  profile: UserProfile
): ProductWithMatch<T> {
  const { score, reasons } = calculateMatchScore(product, profile);
  return {
    product,
    matchScore: score,
    matchReasons: reasons,
  };
}

/**
 * 제품 목록에 매칭 정보 추가 및 점수순 정렬
 * @param products 제품 목록
 * @param profile 사용자 프로필
 */
export function addMatchInfoToProducts<T extends AnyProduct>(
  products: T[],
  profile: UserProfile
): ProductWithMatch<T>[] {
  return products
    .map((product) => addMatchInfo(product, profile))
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ================================================
// 헬퍼 함수
// ================================================

function getSkinTypeLabel(skinType: SkinType): string {
  const labels: Record<SkinType, string> = {
    dry: '건성 피부',
    oily: '지성 피부',
    combination: '복합성 피부',
    sensitive: '민감성 피부',
    normal: '정상 피부',
  };
  return labels[skinType] || skinType;
}

function getSkinConcernLabel(concern: SkinConcern): string {
  const labels: Record<SkinConcern, string> = {
    acne: '여드름',
    aging: '노화',
    whitening: '미백',
    hydration: '수분',
    pore: '모공',
    redness: '홍조',
  };
  return labels[concern] || concern;
}

function getSkillLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    beginner: '초급자',
    intermediate: '중급자',
    advanced: '고급자',
    all: '전체',
  };
  return labels[level] || level;
}

function getHairTypeLabel(hairType: string): string {
  const labels: Record<string, string> = {
    straight: '직모',
    wavy: '웨이브',
    curly: '곱슬',
    coily: '강한 곱슬',
  };
  return labels[hairType] ? `${labels[hairType]} 적합` : `${hairType} 타입`;
}

function getScalpTypeLabel(scalpType: string): string {
  const labels: Record<string, string> = {
    dry: '건성 두피',
    oily: '지성 두피',
    sensitive: '민감 두피',
    normal: '정상 두피',
  };
  return labels[scalpType] || `${scalpType} 두피`;
}

function getUndertoneLabel(undertone: string): string {
  const labels: Record<string, string> = {
    warm: '웜톤 적합',
    cool: '쿨톤 적합',
    neutral: '뉴트럴톤 적합',
  };
  return labels[undertone] || `${undertone} 톤`;
}
