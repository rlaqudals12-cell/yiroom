/**
 * 제품-사용자 호환성 분석
 * - S-1 피부 분석 데이터 연동
 * - PC-1 퍼스널 컬러 연동 (색조 제품)
 * - 성분 분석 및 상호작용 검출
 */

import { getToneCompatibility, type TwelveTone } from '@/lib/analysis/personal-color-v2';
import { hexToLab } from '@/lib/color';
import type { ProductIngredient } from '@/types/scan';

import {
  detectInteractions,
  categorizeInteractions,
  calculateInteractionPenalty,
  type InteractionWarning,
} from './ingredient-interactions';
import {
  type SkinType,
  calculateSkinTypeScore,
  checkIngredientForSkinType,
  SKIN_CONCERN_INGREDIENTS,
} from './skin-ingredient-match';

// 사용자 분석 데이터 타입
export interface UserAnalysisData {
  skinAnalysis?: {
    skinType: SkinType;
    concerns: string[];
    sensitivity: 'low' | 'medium' | 'high';
  };
  personalColor?: {
    seasonType: 'spring' | 'summer' | 'autumn' | 'winter';
    tone: 'warm' | 'cool';
    twelveTone?: TwelveTone;
  };
}

// 호환성 포인트
export interface CompatibilityPoint {
  title: string;
  description: string;
  basedOn: 'skin_type' | 'sensitivity' | 'concerns' | 'personal_color';
  confidence: 'high' | 'medium' | 'low';
}

// 성분 노트
export interface IngredientNote {
  ingredient: string;
  nameKo?: string;
  reason: string;
}

// 컬러 매칭 결과. 수치 판정과 색상명 참고를 타입 경계에서 분리한다.
export type ColorMatchResult =
  | {
      basis: 'ciede2000';
      isRecommended: boolean;
      matchScore: number;
      reason: string;
    }
  | {
      basis: 'qualitative-name';
      colorName: string;
      reason: string;
      requiresHex: true;
    };

// 전체 호환성 결과
export interface CompatibilityResult {
  overallScore: number;
  skinCompatibility: {
    score: number;
    goodPoints: CompatibilityPoint[];
    warnings: CompatibilityPoint[];
  };
  colorMatch?: ColorMatchResult;
  ingredientAnalysis: {
    beneficial: IngredientNote[];
    caution: IngredientNote[];
    avoid: IngredientNote[];
    interactions: InteractionWarning[];
  };
  hasUserAnalysis: {
    skinAnalysis: boolean;
    personalColor: boolean;
  };
}

/**
 * 피부 호환성 계산
 */
function calculateSkinCompatibility(
  ingredients: ProductIngredient[],
  skinAnalysis: UserAnalysisData['skinAnalysis']
): {
  score: number;
  goodPoints: CompatibilityPoint[];
  warnings: CompatibilityPoint[];
  beneficial: IngredientNote[];
  caution: IngredientNote[];
  avoid: IngredientNote[];
} {
  if (!skinAnalysis) {
    return {
      score: 75, // 기본 점수
      goodPoints: [],
      warnings: [],
      beneficial: [],
      caution: [],
      avoid: [],
    };
  }

  const ingredientNames = ingredients.map((i) => i.inciName);
  const skinTypeResult = calculateSkinTypeScore(ingredientNames, skinAnalysis.skinType);

  const goodPoints: CompatibilityPoint[] = [];
  const warnings: CompatibilityPoint[] = [];
  const beneficial: IngredientNote[] = [];
  const caution: IngredientNote[] = [];
  const avoid: IngredientNote[] = [];

  // 피부 타입별 성분 분석
  for (const ing of ingredients) {
    const status = checkIngredientForSkinType(ing.inciName, skinAnalysis.skinType);
    const note = {
      ingredient: ing.inciName,
      nameKo: ing.nameKo,
      reason: '',
    };

    switch (status) {
      case 'beneficial':
        note.reason = `${getSkinTypeLabel(skinAnalysis.skinType)} 피부에 좋은 성분`;
        beneficial.push(note);
        break;
      case 'caution':
        note.reason = `${getSkinTypeLabel(skinAnalysis.skinType)} 피부에 주의가 필요한 성분`;
        caution.push(note);
        break;
      case 'avoid':
        note.reason = `${getSkinTypeLabel(skinAnalysis.skinType)} 피부에 권장하지 않는 성분`;
        avoid.push(note);
        break;
    }
  }

  // 좋은 점 생성
  if (beneficial.length >= 3) {
    goodPoints.push({
      title: `${getSkinTypeLabel(skinAnalysis.skinType)} 피부에 적합`,
      description: `${beneficial
        .slice(0, 3)
        .map((b) => b.nameKo || b.ingredient)
        .join(', ')} 등 좋은 성분이 포함되어 있어요`,
      basedOn: 'skin_type',
      confidence: 'high',
    });
  } else if (beneficial.length > 0) {
    goodPoints.push({
      title: '피부에 좋은 성분 포함',
      description: `${beneficial.map((b) => b.nameKo || b.ingredient).join(', ')} 성분이 도움이 될 수 있어요`,
      basedOn: 'skin_type',
      confidence: 'medium',
    });
  }

  // 경고 생성
  if (avoid.length > 0) {
    warnings.push({
      title: '주의가 필요한 성분 포함',
      description: `${avoid.map((a) => a.nameKo || a.ingredient).join(', ')} 성분은 ${getSkinTypeLabel(skinAnalysis.skinType)} 피부에 맞지 않을 수 있어요`,
      basedOn: 'skin_type',
      confidence: 'high',
    });
  }

  if (caution.length > 0) {
    warnings.push({
      title: '패치 테스트 권장',
      description: `${caution.map((c) => c.nameKo || c.ingredient).join(', ')} 성분에 주의하세요`,
      basedOn: 'skin_type',
      confidence: 'medium',
    });
  }

  // 민감성 기반 추가 경고
  if (skinAnalysis.sensitivity === 'high') {
    const fragranceIngredients = ingredients.filter(
      (i) =>
        i.inciName.toUpperCase().includes('FRAGRANCE') ||
        i.inciName.toUpperCase().includes('PARFUM')
    );
    if (fragranceIngredients.length > 0) {
      warnings.push({
        title: '향료 포함',
        description: '민감한 피부에는 향료가 자극이 될 수 있어요',
        basedOn: 'sensitivity',
        confidence: 'high',
      });
    }
  }

  // 피부 고민 기반 분석
  for (const concern of skinAnalysis.concerns) {
    const concernRec = SKIN_CONCERN_INGREDIENTS[concern.toLowerCase()];
    if (concernRec) {
      const matchingBeneficial = ingredientNames.filter((name) =>
        concernRec.beneficial.some((b) => name.toUpperCase().includes(b))
      );
      if (matchingBeneficial.length > 0) {
        goodPoints.push({
          title: `${getConcernLabel(concern)} 케어에 효과적`,
          description: `${matchingBeneficial.slice(0, 2).join(', ')} 성분이 도움이 될 수 있어요`,
          basedOn: 'concerns',
          confidence: 'medium',
        });
      }
    }
  }

  return {
    score: skinTypeResult.score,
    goodPoints,
    warnings,
    beneficial,
    caution,
    avoid,
  };
}

/**
 * 색조 제품 컬러 매칭 (메이크업 제품용)
 */
function calculateColorMatch(
  productCategory: string,
  productColor: string | undefined,
  personalColor: UserAnalysisData['personalColor']
): ColorMatchResult | undefined {
  if (!personalColor) return undefined;

  // 색조 제품이 아니면 스킵
  const colorCategories = [
    'lip',
    'lipstick',
    'blush',
    'eyeshadow',
    'foundation',
    'contour',
    'makeup',
  ];
  if (!colorCategories.includes(productCategory.trim().toLowerCase())) {
    return undefined;
  }

  // 색이 없으면 수치나 추정 안내를 만들지 않는다.
  if (!productColor) return undefined;

  // 정확한 12톤과 HEX가 있으면 웹 정본과 동일한 CIEDE2000 판정을 우선한다.
  if (personalColor.twelveTone && /^#[0-9a-fA-F]{6}$/.test(productColor)) {
    const compatibility = getToneCompatibility(personalColor.twelveTone, hexToLab(productColor));
    return {
      basis: 'ciede2000',
      isRecommended: compatibility.grade === 'perfect' || compatibility.grade === 'good',
      matchScore: compatibility.score,
      reason: compatibility.description,
    };
  }

  // 컬러 매칭 로직 (간단한 버전)
  const warmColors = [
    'coral',
    'peach',
    'orange',
    'gold',
    'bronze',
    'warm',
    '코랄',
    '피치',
    '복숭아',
    '오렌지',
    '주황',
    '골드',
    '금색',
    '브론즈',
    '웜',
    '살구',
    '테라코타',
  ];
  const coolColors = [
    'pink',
    'berry',
    'mauve',
    'plum',
    'rose',
    'cool',
    '핑크',
    '베리',
    '모브',
    '플럼',
    '자두',
    '로즈',
    '쿨',
    '라벤더',
  ];

  const colorLower = productColor.toLowerCase();
  const isWarmColor = warmColors.some((c) => colorLower.includes(c));
  const isCoolColor = coolColors.some((c) => colorLower.includes(c));

  // 한글/영문 색상명은 정성 참고만 제공한다. 이름을 점수나 추천 판정으로 바꾸지 않는다.
  if (isWarmColor || isCoolColor) {
    const colorFamily =
      isWarmColor && isCoolColor ? '웜·쿨 혼합' : isWarmColor ? '웜 계열' : '쿨 계열';
    return {
      basis: 'qualitative-name',
      colorName: productColor,
      reason: `${productColor}은 ${colorFamily} 색상명으로만 참고할 수 있어요. 개인 적합도 판정에는 정확한 HEX 색상 코드가 필요해요.`,
      requiresHex: true,
    };
  }

  // 미분류 색상명·3자리 HEX·12톤 부재는 colorMatch를 만들지 않는다.
  return undefined;
}

/**
 * 전체 호환성 분석
 */
export async function analyzeCompatibility(
  productIngredients: ProductIngredient[],
  productCategory: string,
  productColor: string | undefined,
  userAnalysis: UserAnalysisData
): Promise<CompatibilityResult> {
  // 성분 이름 목록
  const ingredientNames = productIngredients.map((i) => i.inciName);

  // 피부 호환성
  const skinCompat = calculateSkinCompatibility(productIngredients, userAnalysis.skinAnalysis);

  // 색조 매칭
  const colorMatch = calculateColorMatch(productCategory, productColor, userAnalysis.personalColor);

  // 성분 상호작용
  const interactions = detectInteractions(ingredientNames);
  const categorized = categorizeInteractions(interactions);

  // 상호작용 기반 추가 포인트
  if (categorized.synergies.length > 0) {
    skinCompat.goodPoints.push({
      title: '시너지 성분 조합',
      description: `${categorized.synergies[0].ingredients.join(' + ')} 조합이 효과적이에요`,
      basedOn: 'skin_type',
      confidence: 'high',
    });
  }

  if (categorized.avoidTogether.length > 0) {
    skinCompat.warnings.push({
      title: '함께 사용 주의',
      description: `${categorized.avoidTogether[0].ingredients.join(' + ')} 성분이 함께 포함되어 있어요`,
      basedOn: 'skin_type',
      confidence: 'high',
    });
  }

  // 종합 점수 계산
  const interactionPenalty = calculateInteractionPenalty(interactions);
  const baseScore = skinCompat.score;
  // 정확한 12톤 + 6자리 HEX로 계산한 CIE 판정만 종합점수에 반영한다.
  let colorBonus = 0;
  if (colorMatch?.basis === 'ciede2000') {
    colorBonus = colorMatch.isRecommended ? 5 : -5;
  }
  const overallScore = Math.max(0, Math.min(100, baseScore - interactionPenalty + colorBonus));

  return {
    overallScore,
    skinCompatibility: {
      score: skinCompat.score,
      goodPoints: skinCompat.goodPoints,
      warnings: skinCompat.warnings,
    },
    colorMatch,
    ingredientAnalysis: {
      beneficial: skinCompat.beneficial,
      caution: skinCompat.caution,
      avoid: skinCompat.avoid,
      interactions,
    },
    hasUserAnalysis: {
      skinAnalysis: !!userAnalysis.skinAnalysis,
      personalColor: !!userAnalysis.personalColor,
    },
  };
}

/**
 * 피부 타입 한글 라벨
 */
function getSkinTypeLabel(skinType: SkinType): string {
  const labels: Record<SkinType, string> = {
    dry: '건성',
    oily: '지성',
    sensitive: '민감성',
    combination: '복합성',
    normal: '중성',
  };
  return labels[skinType];
}

/**
 * 피부 고민 한글 라벨
 */
function getConcernLabel(concern: string): string {
  const labels: Record<string, string> = {
    acne: '트러블/여드름',
    aging: '안티에이징',
    hyperpigmentation: '미백/색소침착',
    dehydration: '수분/보습',
    redness: '진정/홍조',
    pores: '모공',
  };
  return labels[concern.toLowerCase()] || concern;
}

/**
 * Mock 호환성 결과 생성 (개발/테스트용)
 */
export function generateMockCompatibilityResult(): CompatibilityResult {
  return {
    overallScore: 82,
    skinCompatibility: {
      score: 85,
      goodPoints: [
        {
          title: '지성 피부에 적합',
          description: '나이아신아마이드, 살리실릭애씨드 등 좋은 성분이 포함되어 있어요',
          basedOn: 'skin_type',
          confidence: 'high',
        },
        {
          title: '모공 케어에 효과적',
          description: 'BHA 성분이 모공 관리에 도움이 될 수 있어요',
          basedOn: 'concerns',
          confidence: 'medium',
        },
      ],
      warnings: [
        {
          title: '패치 테스트 권장',
          description: '산성 성분이 포함되어 있어 민감한 피부는 주의하세요',
          basedOn: 'sensitivity',
          confidence: 'medium',
        },
      ],
    },
    ingredientAnalysis: {
      beneficial: [
        { ingredient: 'NIACINAMIDE', nameKo: '나이아신아마이드', reason: '지성 피부에 좋은 성분' },
        { ingredient: 'SALICYLIC ACID', nameKo: '살리실릭애씨드', reason: '지성 피부에 좋은 성분' },
        { ingredient: 'HYALURONIC ACID', nameKo: '히알루론산', reason: '보습에 좋은 성분' },
      ],
      caution: [
        {
          ingredient: 'GLYCOLIC ACID',
          nameKo: '글리콜릭애씨드',
          reason: '민감한 피부에 자극될 수 있음',
        },
      ],
      avoid: [],
      interactions: [
        {
          ingredients: ['NIACINAMIDE', 'HYALURONIC ACID'],
          type: 'synergy',
          reason: '피지 조절 + 보습 시너지',
          recommendation: '함께 사용하면 효과적입니다',
        },
      ],
    },
    hasUserAnalysis: {
      skinAnalysis: true,
      personalColor: false,
    },
  };
}
