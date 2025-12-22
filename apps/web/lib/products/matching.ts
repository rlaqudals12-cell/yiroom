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
function calculateCosmeticMatchScore(
  product: CosmeticProduct,
  profile: UserProfile
): MatchResult {
  const reasons: MatchReason[] = [];
  let score = 20; // 기본 점수

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
      product.targetConcerns?.some(
        (concern) => concern.toLowerCase().includes(goal.toLowerCase())
      )
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
    const hasWorkoutBenefit = product.benefits.some((b) =>
      workoutRelatedBenefits.includes(b)
    );

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
      product.targetMuscles?.includes(muscle as 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'full_body')
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
    const levelMatched =
      product.skillLevel === 'all' || product.skillLevel === profile.skillLevel;

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
function calculateHealthFoodMatchScore(
  product: HealthFood,
  profile: UserProfile
): MatchResult {
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
      const hasRelatedBenefit = product.benefits?.some((b) =>
        relatedBenefits.includes(b)
      );
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
  if (profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0 && product.dietaryInfo) {
    const matchedRestrictions = profile.dietaryRestrictions.filter((restriction) =>
      product.dietaryInfo?.includes(restriction as 'vegan' | 'vegetarian' | 'gluten_free' | 'lactose_free' | 'keto' | 'sugar_free' | 'organic' | 'non_gmo')
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
// 리뷰 평점 보너스
// ================================================

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
    label = `인기 제품 ★${rating.toFixed(1)}`;
  } else if (rating >= 4.0 && reviewCount >= 50) {
    bonus = 7;
    label = `높은 평점 ★${rating.toFixed(1)}`;
  } else if (rating >= 3.5 && reviewCount >= 20) {
    bonus = 4;
    label = `좋은 리뷰 ★${rating.toFixed(1)}`;
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
 */
export function calculateMatchScore(
  product: AnyProduct,
  profile: UserProfile
): MatchResult {
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

  // 리뷰 평점 보너스 추가
  const ratingBonus = calculateRatingBonus(product);
  if (ratingBonus.score > 0 && ratingBonus.reason) {
    result.score = Math.min(100, result.score + ratingBonus.score);
    result.reasons.push(ratingBonus.reason);
  }

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
