/**
 * 성분 상호작용 경고 시스템
 * - 함께 사용하면 안 좋은 성분 조합
 * - 시너지 효과가 있는 조합
 * - 주의가 필요한 조합
 */

export type InteractionType = 'synergy' | 'avoid_together' | 'caution';

export interface InteractionRule {
  ingredient1: string;
  ingredient2: string;
  type: InteractionType;
  reason: string;
  recommendation: string;
}

export interface InteractionWarning {
  ingredients: [string, string];
  type: InteractionType;
  reason: string;
  recommendation: string;
}

/**
 * 성분 상호작용 규칙
 */
export const INGREDIENT_INTERACTIONS: InteractionRule[] = [
  // 레티놀 관련
  {
    ingredient1: 'RETINOL',
    ingredient2: 'AHA',
    type: 'avoid_together',
    reason: '함께 사용 시 피부 자극 가능',
    recommendation: '아침/저녁 분리 사용을 권장합니다',
  },
  {
    ingredient1: 'RETINOL',
    ingredient2: 'GLYCOLIC ACID',
    type: 'avoid_together',
    reason: 'AHA와 레티놀의 동시 사용은 피부 자극을 유발할 수 있습니다',
    recommendation: '아침에 AHA, 저녁에 레티놀을 사용하세요',
  },
  {
    ingredient1: 'RETINOL',
    ingredient2: 'LACTIC ACID',
    type: 'avoid_together',
    reason: 'AHA와 레티놀의 동시 사용은 피부 자극을 유발할 수 있습니다',
    recommendation: '아침에 AHA, 저녁에 레티놀을 사용하세요',
  },
  {
    ingredient1: 'RETINOL',
    ingredient2: 'BHA',
    type: 'avoid_together',
    reason: '과도한 각질 제거로 자극 유발',
    recommendation: '격일 사용을 권장합니다',
  },
  {
    ingredient1: 'RETINOL',
    ingredient2: 'SALICYLIC ACID',
    type: 'avoid_together',
    reason: 'BHA와 레티놀의 동시 사용은 피부 자극을 유발할 수 있습니다',
    recommendation: '격일로 번갈아 사용하세요',
  },
  {
    ingredient1: 'RETINOL',
    ingredient2: 'BENZOYL PEROXIDE',
    type: 'avoid_together',
    reason: '벤조일퍼옥사이드가 레티놀을 비활성화시킵니다',
    recommendation: '아침에 벤조일퍼옥사이드, 저녁에 레티놀을 사용하세요',
  },
  {
    ingredient1: 'RETINOL',
    ingredient2: 'VITAMIN C',
    type: 'caution',
    reason: '서로 다른 pH 환경에서 최적 작용',
    recommendation: '아침에 비타민C, 저녁에 레티놀 사용을 권장합니다',
  },

  // 비타민C 관련
  {
    ingredient1: 'VITAMIN C',
    ingredient2: 'NIACINAMIDE',
    type: 'synergy',
    reason: '미백 효과 시너지 (과거 우려와 달리 안전)',
    recommendation: '함께 사용 가능합니다',
  },
  {
    ingredient1: 'ASCORBIC ACID',
    ingredient2: 'NIACINAMIDE',
    type: 'synergy',
    reason: '미백 효과 시너지',
    recommendation: '함께 사용하면 효과적입니다',
  },
  {
    ingredient1: 'VITAMIN C',
    ingredient2: 'AHA',
    type: 'caution',
    reason: 'pH 차이로 효과 감소 가능',
    recommendation: '시간차 적용 (20분 이상)을 권장합니다',
  },
  {
    ingredient1: 'VITAMIN C',
    ingredient2: 'BHA',
    type: 'caution',
    reason: 'pH 차이로 효과 감소 가능',
    recommendation: '시간차 적용 (20분 이상)을 권장합니다',
  },
  {
    ingredient1: 'VITAMIN C',
    ingredient2: 'VITAMIN E',
    type: 'synergy',
    reason: '항산화 효과 시너지',
    recommendation: '함께 사용하면 더욱 효과적입니다',
  },
  {
    ingredient1: 'VITAMIN C',
    ingredient2: 'TOCOPHEROL',
    type: 'synergy',
    reason: '항산화 효과 시너지',
    recommendation: '함께 사용하면 더욱 효과적입니다',
  },
  {
    ingredient1: 'VITAMIN C',
    ingredient2: 'FERULIC ACID',
    type: 'synergy',
    reason: '비타민C 안정성 향상 + 효과 증대',
    recommendation: '함께 사용하면 최상의 효과를 얻을 수 있습니다',
  },

  // 나이아신아마이드 관련
  {
    ingredient1: 'NIACINAMIDE',
    ingredient2: 'HYALURONIC ACID',
    type: 'synergy',
    reason: '피지 조절 + 보습 시너지',
    recommendation: '함께 사용하면 효과적입니다',
  },
  {
    ingredient1: 'NIACINAMIDE',
    ingredient2: 'ZINC',
    type: 'synergy',
    reason: '피지 조절 효과 증대',
    recommendation: '지성 피부에 좋은 조합입니다',
  },

  // AHA/BHA 관련
  {
    ingredient1: 'AHA',
    ingredient2: 'BHA',
    type: 'caution',
    reason: '과도한 각질 제거로 자극 가능',
    recommendation: '동시 사용 시 저농도로 시작하세요',
  },
  {
    ingredient1: 'GLYCOLIC ACID',
    ingredient2: 'SALICYLIC ACID',
    type: 'caution',
    reason: '과도한 각질 제거로 자극 가능',
    recommendation: '동시 사용 시 저농도로 시작하세요',
  },

  // 기타 시너지
  {
    ingredient1: 'HYALURONIC ACID',
    ingredient2: 'CERAMIDE',
    type: 'synergy',
    reason: '보습 효과 시너지',
    recommendation: '건성 피부에 좋은 조합입니다',
  },
  {
    ingredient1: 'CENTELLA ASIATICA',
    ingredient2: 'PANTHENOL',
    type: 'synergy',
    reason: '진정 효과 시너지',
    recommendation: '민감성 피부에 좋은 조합입니다',
  },
  {
    ingredient1: 'PEPTIDES',
    ingredient2: 'HYALURONIC ACID',
    type: 'synergy',
    reason: '안티에이징 + 보습 시너지',
    recommendation: '함께 사용하면 효과적입니다',
  },
];

/**
 * 성분명 정규화 (대문자 변환 + 공백 정리)
 */
function normalizeIngredient(name: string): string {
  return name.toUpperCase().trim();
}

/**
 * 두 성분 간의 상호작용 확인
 */
function checkInteraction(ingredient1: string, ingredient2: string): InteractionRule | null {
  const norm1 = normalizeIngredient(ingredient1);
  const norm2 = normalizeIngredient(ingredient2);

  for (const rule of INGREDIENT_INTERACTIONS) {
    const ruleIng1 = normalizeIngredient(rule.ingredient1);
    const ruleIng2 = normalizeIngredient(rule.ingredient2);

    // 순서 상관없이 매칭
    if (
      (norm1.includes(ruleIng1) && norm2.includes(ruleIng2)) ||
      (norm1.includes(ruleIng2) && norm2.includes(ruleIng1))
    ) {
      return rule;
    }
  }

  return null;
}

/**
 * 성분 목록에서 모든 상호작용 검출
 */
export function detectInteractions(ingredients: string[]): InteractionWarning[] {
  const warnings: InteractionWarning[] = [];
  const checked = new Set<string>();

  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i + 1; j < ingredients.length; j++) {
      const ing1 = ingredients[i];
      const ing2 = ingredients[j];

      // 이미 확인한 조합 스킵
      const key = [ing1, ing2].sort().join('|');
      if (checked.has(key)) continue;
      checked.add(key);

      const interaction = checkInteraction(ing1, ing2);
      if (interaction) {
        warnings.push({
          ingredients: [ing1, ing2],
          type: interaction.type,
          reason: interaction.reason,
          recommendation: interaction.recommendation,
        });
      }
    }
  }

  return warnings;
}

/**
 * 상호작용을 타입별로 분류
 */
export function categorizeInteractions(warnings: InteractionWarning[]): {
  synergies: InteractionWarning[];
  avoidTogether: InteractionWarning[];
  cautions: InteractionWarning[];
} {
  return {
    synergies: warnings.filter((w) => w.type === 'synergy'),
    avoidTogether: warnings.filter((w) => w.type === 'avoid_together'),
    cautions: warnings.filter((w) => w.type === 'caution'),
  };
}

/**
 * 상호작용 심각도에 따른 점수 페널티 계산
 */
export function calculateInteractionPenalty(warnings: InteractionWarning[]): number {
  let penalty = 0;

  for (const warning of warnings) {
    switch (warning.type) {
      case 'avoid_together':
        penalty += 10;
        break;
      case 'caution':
        penalty += 3;
        break;
      case 'synergy':
        // 시너지는 보너스 (음수 페널티)
        penalty -= 2;
        break;
    }
  }

  return Math.max(0, penalty); // 음수는 0으로
}
