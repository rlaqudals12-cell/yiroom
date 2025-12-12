/**
 * 성분 상호작용 경고 시스템
 * @description 영양제/화장품 성분 간 충돌 및 시너지 분석
 */

export type InteractionType = 'avoid' | 'caution' | 'timing' | 'synergy';
export type InteractionSeverity = 'high' | 'medium' | 'low';

export interface IngredientInteraction {
  ingredients: [string, string];
  type: InteractionType;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
}

/**
 * 영양제 성분 상호작용 데이터베이스
 */
const SUPPLEMENT_INTERACTIONS: IngredientInteraction[] = [
  // 피해야 할 조합 (avoid)
  {
    ingredients: ['칼슘', '철분'],
    type: 'avoid',
    severity: 'high',
    description: '칼슘이 철분 흡수를 방해할 수 있습니다.',
    recommendation: '최소 2시간 간격을 두고 복용하세요.',
  },
  {
    ingredients: ['아연', '구리'],
    type: 'avoid',
    severity: 'medium',
    description: '아연이 구리 흡수를 감소시킬 수 있습니다.',
    recommendation: '장기 복용 시 균형을 맞춰 섭취하세요.',
  },
  {
    ingredients: ['비타민E', '비타민K'],
    type: 'caution',
    severity: 'medium',
    description: '고용량 비타민E가 비타민K 효과를 감소시킬 수 있습니다.',
    recommendation: '혈액 희석제 복용 중이라면 전문가와 상담하세요.',
  },

  // 타이밍 주의 (timing)
  {
    ingredients: ['마그네슘', '칼슘'],
    type: 'timing',
    severity: 'low',
    description: '함께 복용하면 흡수 경쟁이 발생할 수 있습니다.',
    recommendation: '칼슘은 식사 중, 마그네슘은 취침 전 복용을 권장합니다.',
  },
  {
    ingredients: ['오메가3', '비타민D'],
    type: 'synergy',
    severity: 'low',
    description: '지용성 비타민은 지방과 함께 흡수가 좋아집니다.',
    recommendation: '오메가3와 비타민D를 식사 후 함께 복용하면 좋습니다.',
  },

  // 시너지 조합 (synergy)
  {
    ingredients: ['비타민C', '철분'],
    type: 'synergy',
    severity: 'low',
    description: '비타민C가 철분 흡수를 촉진합니다.',
    recommendation: '철분제와 비타민C를 함께 복용하면 효과적입니다.',
  },
  {
    ingredients: ['비타민D', '칼슘'],
    type: 'synergy',
    severity: 'low',
    description: '비타민D가 칼슘 흡수를 돕습니다.',
    recommendation: '함께 복용하면 뼈 건강에 더 효과적입니다.',
  },
  {
    ingredients: ['비타민K', '칼슘'],
    type: 'synergy',
    severity: 'low',
    description: '비타민K가 칼슘이 뼈에 흡수되도록 돕습니다.',
    recommendation: '칼슘, 비타민D, 비타민K를 함께 복용하면 좋습니다.',
  },
];

/**
 * 화장품 성분 상호작용 데이터베이스
 */
const COSMETIC_INTERACTIONS: IngredientInteraction[] = [
  // 피해야 할 조합
  {
    ingredients: ['레티놀', '비타민C'],
    type: 'caution',
    severity: 'medium',
    description: '두 성분의 최적 pH가 달라 효과가 감소할 수 있습니다.',
    recommendation: '아침에 비타민C, 저녁에 레티놀을 사용하세요.',
  },
  {
    ingredients: ['레티놀', 'AHA'],
    type: 'avoid',
    severity: 'high',
    description: '함께 사용하면 자극이 심해질 수 있습니다.',
    recommendation: '번갈아 사용하거나, 레티놀을 저녁에만 사용하세요.',
  },
  {
    ingredients: ['레티놀', 'BHA'],
    type: 'avoid',
    severity: 'high',
    description: '피부 자극이 증가할 수 있습니다.',
    recommendation: '민감한 피부라면 함께 사용을 피하세요.',
  },
  {
    ingredients: ['비타민C', '나이아신아마이드'],
    type: 'caution',
    severity: 'low',
    description: '과거에는 충돌 우려가 있었으나 최근 연구에서는 안전하다고 합니다.',
    recommendation: '함께 사용해도 괜찮지만, 자극이 느껴지면 분리 사용하세요.',
  },
  {
    ingredients: ['AHA', 'BHA'],
    type: 'timing',
    severity: 'medium',
    description: '함께 사용하면 과도한 각질 제거로 자극이 생길 수 있습니다.',
    recommendation: '주 2-3회로 사용 빈도를 조절하세요.',
  },

  // 시너지 조합
  {
    ingredients: ['비타민C', '비타민E'],
    type: 'synergy',
    severity: 'low',
    description: '함께 사용하면 항산화 효과가 증가합니다.',
    recommendation: '아침 루틴에 함께 사용하면 좋습니다.',
  },
  {
    ingredients: ['히알루론산', '나이아신아마이드'],
    type: 'synergy',
    severity: 'low',
    description: '보습과 피부 장벽 강화에 시너지 효과가 있습니다.',
    recommendation: '함께 사용하면 촉촉한 피부에 도움이 됩니다.',
  },
  {
    ingredients: ['세라마이드', '히알루론산'],
    type: 'synergy',
    severity: 'low',
    description: '피부 장벽 강화와 보습에 탁월한 조합입니다.',
    recommendation: '건조하고 민감한 피부에 추천합니다.',
  },
];

/**
 * 성분명 정규화
 */
function normalizeIngredient(ingredient: string): string {
  const normalized = ingredient.toLowerCase().trim();

  // 별칭 매핑
  const aliases: Record<string, string> = {
    'vitamin c': '비타민C',
    'ascorbic acid': '비타민C',
    'vitamin d': '비타민D',
    'vitamin e': '비타민E',
    'vitamin k': '비타민K',
    retinol: '레티놀',
    retinoid: '레티놀',
    niacinamide: '나이아신아마이드',
    'hyaluronic acid': '히알루론산',
    'salicylic acid': 'BHA',
    'glycolic acid': 'AHA',
    'lactic acid': 'AHA',
    ceramide: '세라마이드',
    iron: '철분',
    calcium: '칼슘',
    magnesium: '마그네슘',
    zinc: '아연',
    copper: '구리',
    'omega-3': '오메가3',
    'fish oil': '오메가3',
  };

  return aliases[normalized] || ingredient;
}

/**
 * 두 성분 간 상호작용 확인
 */
export function checkInteraction(
  ingredient1: string,
  ingredient2: string,
  type: 'supplement' | 'cosmetic' = 'supplement'
): IngredientInteraction | null {
  const norm1 = normalizeIngredient(ingredient1);
  const norm2 = normalizeIngredient(ingredient2);

  const database = type === 'supplement' ? SUPPLEMENT_INTERACTIONS : COSMETIC_INTERACTIONS;

  return (
    database.find(
      (i) =>
        (i.ingredients[0] === norm1 && i.ingredients[1] === norm2) ||
        (i.ingredients[0] === norm2 && i.ingredients[1] === norm1)
    ) || null
  );
}

/**
 * 여러 성분의 상호작용 분석
 */
export interface InteractionAnalysis {
  interactions: IngredientInteraction[];
  warnings: IngredientInteraction[];
  synergies: IngredientInteraction[];
  summary: string;
}

export function analyzeIngredients(
  ingredients: string[],
  type: 'supplement' | 'cosmetic' = 'supplement'
): InteractionAnalysis {
  const interactions: IngredientInteraction[] = [];

  // 모든 조합 검사
  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i + 1; j < ingredients.length; j++) {
      const interaction = checkInteraction(ingredients[i], ingredients[j], type);
      if (interaction) {
        interactions.push(interaction);
      }
    }
  }

  // 분류
  const warnings = interactions.filter((i) => i.type === 'avoid' || i.type === 'caution');
  const synergies = interactions.filter((i) => i.type === 'synergy');

  // 요약 생성
  let summary = '';
  if (warnings.length > 0) {
    summary = `${warnings.length}개의 주의가 필요한 조합이 있습니다. `;
  }
  if (synergies.length > 0) {
    summary += `${synergies.length}개의 시너지 조합이 있습니다.`;
  }
  if (!summary) {
    summary = '특별한 상호작용이 발견되지 않았습니다.';
  }

  return { interactions, warnings, synergies, summary };
}

/**
 * 제품 목록의 성분 상호작용 분석
 */
export function analyzeProductInteractions(
  products: Array<{ name: string; ingredients: string[] }>,
  type: 'supplement' | 'cosmetic' = 'supplement'
): InteractionAnalysis & { productPairs: Array<{ products: [string, string]; interaction: IngredientInteraction }> } {
  const allIngredients = products.flatMap((p) => p.ingredients);
  const baseAnalysis = analyzeIngredients(allIngredients, type);

  // 어떤 제품 간의 상호작용인지 추적
  const productPairs: Array<{ products: [string, string]; interaction: IngredientInteraction }> = [];

  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const p1 = products[i];
      const p2 = products[j];

      for (const ing1 of p1.ingredients) {
        for (const ing2 of p2.ingredients) {
          const interaction = checkInteraction(ing1, ing2, type);
          if (interaction && (interaction.type === 'avoid' || interaction.type === 'caution')) {
            productPairs.push({
              products: [p1.name, p2.name],
              interaction,
            });
          }
        }
      }
    }
  }

  return { ...baseAnalysis, productPairs };
}
