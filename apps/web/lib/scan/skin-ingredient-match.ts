/**
 * 피부 타입별 성분 매칭 데이터
 * - 피부 타입에 따른 추천/주의/피해야 할 성분 정의
 */

export type SkinType = 'dry' | 'oily' | 'sensitive' | 'combination' | 'normal';

export interface IngredientRecommendation {
  beneficial: string[];
  caution: string[];
  avoid: string[];
}

/**
 * 피부 타입별 성분 권장 사항
 * - beneficial: 해당 피부 타입에 좋은 성분
 * - caution: 주의해서 사용해야 할 성분
 * - avoid: 피해야 할 성분
 */
export const SKIN_TYPE_INGREDIENTS: Record<SkinType, IngredientRecommendation> = {
  dry: {
    beneficial: [
      'HYALURONIC ACID',
      'CERAMIDE',
      'SQUALANE',
      'SHEA BUTTER',
      'GLYCERIN',
      'PANTHENOL',
      'SODIUM HYALURONATE',
      'JOJOBA OIL',
      'ARGAN OIL',
      'OLIVE OIL',
      'AVOCADO OIL',
      'COLLAGEN',
      'UREA',
      'ALLANTOIN',
    ],
    caution: [
      'ALCOHOL DENAT.',
      'SALICYLIC ACID',
      'BENZOYL PEROXIDE',
      'RETINOL',
      'GLYCOLIC ACID',
      'SD ALCOHOL',
    ],
    avoid: ['ISOPROPYL ALCOHOL', 'WITCH HAZEL', 'MENTHOL'],
  },
  oily: {
    beneficial: [
      'NIACINAMIDE',
      'SALICYLIC ACID',
      'TEA TREE OIL',
      'ZINC',
      'ZINC OXIDE',
      'ZINC PCA',
      'KAOLIN',
      'BENTONITE',
      'HYALURONIC ACID',
      'WITCH HAZEL',
      'GREEN TEA',
      'GLYCOLIC ACID',
      'LACTIC ACID',
    ],
    caution: ['MINERAL OIL', 'PETROLEUM', 'LANOLIN', 'SHEA BUTTER', 'COCOA BUTTER'],
    avoid: ['COCONUT OIL', 'ISOPROPYL MYRISTATE', 'ISOPROPYL PALMITATE', 'ALGAE EXTRACT'],
  },
  sensitive: {
    beneficial: [
      'CENTELLA ASIATICA',
      'MADECASSOSIDE',
      'ASIATICOSIDE',
      'ALLANTOIN',
      'PANTHENOL',
      'ALOE VERA',
      'ALOE BARBADENSIS LEAF EXTRACT',
      'CHAMOMILE',
      'CALENDULA',
      'OATMEAL',
      'COLLOIDAL OATMEAL',
      'BISABOLOL',
      'BETA-GLUCAN',
      'CERAMIDE',
    ],
    caution: [
      'FRAGRANCE',
      'PARFUM',
      'ESSENTIAL OILS',
      'CITRUS OILS',
      'AHA',
      'BHA',
      'GLYCOLIC ACID',
      'LACTIC ACID',
      'SALICYLIC ACID',
      'RETINOL',
      'VITAMIN C',
      'ASCORBIC ACID',
    ],
    avoid: [
      'ALCOHOL',
      'ALCOHOL DENAT.',
      'SD ALCOHOL',
      'SODIUM LAURYL SULFATE',
      'SLS',
      'SODIUM LAURETH SULFATE',
      'SLES',
      'PARABENS',
      'METHYLPARABEN',
      'PROPYLPARABEN',
      'FORMALDEHYDE',
      'DMDM HYDANTOIN',
    ],
  },
  combination: {
    beneficial: [
      'NIACINAMIDE',
      'HYALURONIC ACID',
      'GREEN TEA',
      'GLYCERIN',
      'SQUALANE',
      'CENTELLA ASIATICA',
      'PANTHENOL',
      'SODIUM HYALURONATE',
    ],
    caution: ['HEAVY OILS', 'COCONUT OIL', 'MINERAL OIL', 'RETINOL'],
    avoid: [],
  },
  normal: {
    beneficial: [
      'VITAMIN C',
      'ASCORBIC ACID',
      'PEPTIDES',
      'ANTIOXIDANTS',
      'NIACINAMIDE',
      'HYALURONIC ACID',
      'RETINOL',
      'GREEN TEA',
      'VITAMIN E',
      'TOCOPHEROL',
      'RESVERATROL',
    ],
    caution: [],
    avoid: [],
  },
};

/**
 * 피부 고민별 추가 성분 권장 사항
 */
export const SKIN_CONCERN_INGREDIENTS: Record<string, IngredientRecommendation> = {
  acne: {
    beneficial: [
      'SALICYLIC ACID',
      'BENZOYL PEROXIDE',
      'NIACINAMIDE',
      'TEA TREE OIL',
      'ZINC',
      'SULFUR',
      'AZELAIC ACID',
    ],
    caution: ['COCONUT OIL', 'MINERAL OIL', 'ISOPROPYL MYRISTATE'],
    avoid: ['ALGAE EXTRACT', 'LAURIC ACID'],
  },
  aging: {
    beneficial: [
      'RETINOL',
      'RETINYL PALMITATE',
      'PEPTIDES',
      'VITAMIN C',
      'ASCORBIC ACID',
      'HYALURONIC ACID',
      'NIACINAMIDE',
      'COLLAGEN',
      'ADENOSINE',
      'BAKUCHIOL',
    ],
    caution: [],
    avoid: [],
  },
  hyperpigmentation: {
    beneficial: [
      'VITAMIN C',
      'ASCORBIC ACID',
      'NIACINAMIDE',
      'ARBUTIN',
      'ALPHA ARBUTIN',
      'TRANEXAMIC ACID',
      'KOJIC ACID',
      'AZELAIC ACID',
      'LICORICE ROOT',
      'GLYCYRRHIZA GLABRA',
    ],
    caution: [],
    avoid: [],
  },
  dehydration: {
    beneficial: [
      'HYALURONIC ACID',
      'SODIUM HYALURONATE',
      'GLYCERIN',
      'SQUALANE',
      'CERAMIDE',
      'PANTHENOL',
      'BETA-GLUCAN',
      'TREHALOSE',
    ],
    caution: ['ALCOHOL', 'ALCOHOL DENAT.'],
    avoid: [],
  },
  redness: {
    beneficial: [
      'CENTELLA ASIATICA',
      'MADECASSOSIDE',
      'ALLANTOIN',
      'BISABOLOL',
      'GREEN TEA',
      'CHAMOMILE',
      'ALOE VERA',
      'AZELAIC ACID',
    ],
    caution: ['FRAGRANCE', 'MENTHOL', 'PEPPERMINT', 'EUCALYPTUS'],
    avoid: [],
  },
  pores: {
    beneficial: ['NIACINAMIDE', 'SALICYLIC ACID', 'RETINOL', 'CLAY', 'KAOLIN', 'ZINC'],
    caution: [],
    avoid: ['COCONUT OIL', 'ISOPROPYL MYRISTATE'],
  },
};

/**
 * 성분이 피부 타입에 적합한지 확인
 */
export function checkIngredientForSkinType(
  ingredientName: string,
  skinType: SkinType
): 'beneficial' | 'caution' | 'avoid' | 'neutral' {
  const normalizedName = ingredientName.toUpperCase().trim();
  const recommendations = SKIN_TYPE_INGREDIENTS[skinType];

  // 피해야 할 성분 먼저 확인
  if (recommendations.avoid.some((i) => normalizedName.includes(i))) {
    return 'avoid';
  }

  // 주의할 성분 확인
  if (recommendations.caution.some((i) => normalizedName.includes(i))) {
    return 'caution';
  }

  // 좋은 성분 확인
  if (recommendations.beneficial.some((i) => normalizedName.includes(i))) {
    return 'beneficial';
  }

  return 'neutral';
}

/**
 * 성분 목록에서 피부 타입별 호환성 점수 계산
 */
export function calculateSkinTypeScore(
  ingredients: string[],
  skinType: SkinType
): {
  score: number;
  beneficial: string[];
  caution: string[];
  avoid: string[];
} {
  const result = {
    beneficial: [] as string[],
    caution: [] as string[],
    avoid: [] as string[],
  };

  for (const ingredient of ingredients) {
    const status = checkIngredientForSkinType(ingredient, skinType);
    if (status === 'beneficial') {
      result.beneficial.push(ingredient);
    } else if (status === 'caution') {
      result.caution.push(ingredient);
    } else if (status === 'avoid') {
      result.avoid.push(ingredient);
    }
  }

  // 점수 계산: 100점 기준
  // - 좋은 성분: +3점 (최대 30점)
  // - 주의 성분: -5점
  // - 피해야 할 성분: -15점
  const beneficialScore = Math.min(result.beneficial.length * 3, 30);
  const cautionPenalty = result.caution.length * 5;
  const avoidPenalty = result.avoid.length * 15;

  // 기본 점수 70점 + 좋은 성분 보너스 - 페널티
  const score = Math.max(0, Math.min(100, 70 + beneficialScore - cautionPenalty - avoidPenalty));

  return {
    score,
    ...result,
  };
}
