/**
 * 제품 시너지/충돌 탐지 + 도포 순서 추천
 * @description 웹 lib/inventory/product-synergy.ts 포팅 (Canvas 없는 순수 로직)
 */

// ============================================
// 타입
// ============================================

/** 상호작용 유형 */
export type InteractionType = 'synergy' | 'conflict' | 'caution';

/** 상호작용 결과 */
export interface ProductInteraction {
  type: InteractionType;
  ingredientA: string;
  ingredientB: string;
  description: string;
  advice: string;
}

/** 루틴 단계 */
export type RoutineStep = 'cleansing' | 'toner' | 'essence' | 'serum' | 'cream' | 'sunscreen';

/** 도포 순서 추천 */
export interface RoutineOrderSuggestion {
  step: RoutineStep;
  productName: string;
  reason: string;
}

// ============================================
// 성분 상호작용 규칙 DB
// ============================================

const CONFLICT_RULES: {
  a: string[];
  b: string[];
  description: string;
  advice: string;
}[] = [
  {
    a: ['레티놀', 'retinol', '레틴알데하이드'],
    b: ['aha', 'bha', '글리콜산', '살리실산', '아하', '비에이치에이'],
    description: '레티놀과 AHA/BHA를 동시 사용하면 피부 자극이 심해질 수 있어요.',
    advice: '아침에 산성 성분, 저녁에 레티놀을 사용하세요.',
  },
  {
    a: ['레티놀', 'retinol'],
    b: ['비타민c', 'vitamin c', '아스코르빈산', '아스코르브산'],
    description: '레티놀과 비타민C는 pH가 달라 효과가 줄어들 수 있어요.',
    advice: '아침에 비타민C, 저녁에 레티놀을 번갈아 사용하세요.',
  },
  {
    a: ['나이아신아마이드', 'niacinamide'],
    b: ['aha', 'bha', '글리콜산', '살리실산'],
    description: '나이아신아마이드와 산성 성분은 홍조를 유발할 수 있어요.',
    advice: '최소 30분 간격을 두고 사용하세요.',
  },
  {
    a: ['벤조일퍼옥사이드', 'benzoyl peroxide'],
    b: ['레티놀', 'retinol', '비타민c', 'vitamin c'],
    description: '벤조일퍼옥사이드는 레티놀/비타민C를 산화시켜 무력화해요.',
    advice: '아침/저녁으로 분리하거나 다른 날에 사용하세요.',
  },
];

const SYNERGY_RULES: {
  a: string[];
  b: string[];
  description: string;
  advice: string;
}[] = [
  {
    a: ['비타민c', 'vitamin c', '아스코르빈산'],
    b: ['비타민e', 'vitamin e', '토코페롤'],
    description: '비타민C+E는 항산화 시너지로 자외선 방어력이 4배 높아져요.',
    advice: '비타민C 세럼 위에 비타민E 오일을 레이어링하세요.',
  },
  {
    a: ['히알루론산', 'hyaluronic acid', 'ha'],
    b: ['세라마이드', 'ceramide'],
    description: '히알루론산이 수분을 끌어당기고 세라마이드가 잠가줘요.',
    advice: '히알루론산 → 세라마이드 순서로 사용하면 보습 효과가 극대화돼요.',
  },
  {
    a: ['나이아신아마이드', 'niacinamide'],
    b: ['히알루론산', 'hyaluronic acid', 'ha'],
    description: '나이아신아마이드와 히알루론산은 피부 장벽 강화에 시너지를 내요.',
    advice: '함께 사용해도 안전하고 효과적이에요.',
  },
  {
    a: ['비타민c', 'vitamin c'],
    b: ['페룰산', 'ferulic acid'],
    description: '비타민C+페룰산은 안정성과 항산화 효과가 높아져요.',
    advice: '페룰산이 포함된 비타민C 세럼이 가장 효과적이에요.',
  },
  {
    a: ['레티놀', 'retinol'],
    b: ['세라마이드', 'ceramide', '스쿠알란', 'squalane'],
    description: '레티놀 사용 시 세라마이드/스쿠알란이 자극을 줄여줘요.',
    advice: '레티놀 후 보습제로 세라마이드 크림을 사용하세요.',
  },
];

// ============================================
// 성분 추출
// ============================================

/**
 * 제품 이름/태그에서 성분 키워드 추출
 */
export function extractIngredientKeywords(name: string, tags?: string[]): string[] {
  const text = `${name} ${(tags ?? []).join(' ')}`.toLowerCase();

  const knownIngredients = [
    '레티놀',
    'retinol',
    '레틴알데하이드',
    'aha',
    'bha',
    '글리콜산',
    '살리실산',
    '비타민c',
    'vitamin c',
    '아스코르빈산',
    '아스코르브산',
    '비타민e',
    'vitamin e',
    '토코페롤',
    '나이아신아마이드',
    'niacinamide',
    '히알루론산',
    'hyaluronic acid',
    '세라마이드',
    'ceramide',
    '벤조일퍼옥사이드',
    'benzoyl peroxide',
    '페룰산',
    'ferulic acid',
    '스쿠알란',
    'squalane',
  ];

  return knownIngredients.filter((ing) => text.includes(ing));
}

// ============================================
// 상호작용 분석
// ============================================

/**
 * 두 제품 간 성분 상호작용 분석
 */
export function analyzeInteraction(
  ingredientsA: string[],
  ingredientsB: string[]
): ProductInteraction[] {
  const interactions: ProductInteraction[] = [];

  for (const rule of CONFLICT_RULES) {
    const matchA = ingredientsA.some((ing) => rule.a.includes(ing));
    const matchB = ingredientsB.some((ing) => rule.b.includes(ing));
    const reverseA = ingredientsA.some((ing) => rule.b.includes(ing));
    const reverseB = ingredientsB.some((ing) => rule.a.includes(ing));

    if ((matchA && matchB) || (reverseA && reverseB)) {
      const ingA = ingredientsA.find((ing) => rule.a.includes(ing) || rule.b.includes(ing)) ?? '';
      const ingB = ingredientsB.find((ing) => rule.b.includes(ing) || rule.a.includes(ing)) ?? '';
      interactions.push({
        type: 'conflict',
        ingredientA: ingA,
        ingredientB: ingB,
        description: rule.description,
        advice: rule.advice,
      });
    }
  }

  for (const rule of SYNERGY_RULES) {
    const matchA = ingredientsA.some((ing) => rule.a.includes(ing));
    const matchB = ingredientsB.some((ing) => rule.b.includes(ing));
    const reverseA = ingredientsA.some((ing) => rule.b.includes(ing));
    const reverseB = ingredientsB.some((ing) => rule.a.includes(ing));

    if ((matchA && matchB) || (reverseA && reverseB)) {
      const ingA = ingredientsA.find((ing) => rule.a.includes(ing) || rule.b.includes(ing)) ?? '';
      const ingB = ingredientsB.find((ing) => rule.b.includes(ing) || rule.a.includes(ing)) ?? '';
      interactions.push({
        type: 'synergy',
        ingredientA: ingA,
        ingredientB: ingB,
        description: rule.description,
        advice: rule.advice,
      });
    }
  }

  return interactions;
}

// ============================================
// 도포 순서 추천
// ============================================

/** 도포 순서 (가벼운 텍스처 → 무거운 텍스처) */
const STEP_ORDER: Record<string, RoutineStep> = {
  클렌징: 'cleansing',
  클렌저: 'cleansing',
  폼: 'cleansing',
  토너: 'toner',
  스킨: 'toner',
  화장수: 'toner',
  에센스: 'essence',
  앰플: 'essence',
  세럼: 'serum',
  // 선크림/수분크림을 크림보다 먼저 매칭 (더 구체적인 키워드 우선)
  선크림: 'sunscreen',
  자외선: 'sunscreen',
  spf: 'sunscreen',
  수분크림: 'cream',
  크림: 'cream',
  로션: 'cream',
};

const STEP_PRIORITY: Record<RoutineStep, number> = {
  cleansing: 0,
  toner: 1,
  essence: 2,
  serum: 3,
  cream: 4,
  sunscreen: 5,
};

const STEP_REASON: Record<RoutineStep, string> = {
  cleansing: '먼저 피부를 깨끗하게 세정해요.',
  toner: '세안 후 피부 pH를 맞추고 수분을 공급해요.',
  essence: '가벼운 텍스처로 피부에 빠르게 흡수돼요.',
  serum: '고농축 활성 성분이 피부 깊이 전달돼요.',
  cream: '수분과 영양을 잠가주는 마지막 보습 단계에요.',
  sunscreen: '자외선 차단은 스킨케어의 마지막 단계에요.',
};

/**
 * 제품 이름에서 루틴 단계 추론
 */
export function inferRoutineStep(productName: string): RoutineStep | null {
  const name = productName.toLowerCase();
  for (const [keyword, step] of Object.entries(STEP_ORDER)) {
    if (name.includes(keyword)) return step;
  }
  return null;
}

/**
 * 스킨케어 제품 도포 순서 추천
 */
export function suggestRoutineOrder(products: { name: string }[]): RoutineOrderSuggestion[] {
  const withStep = products
    .map((p) => ({ name: p.name, step: inferRoutineStep(p.name) }))
    .filter((p): p is { name: string; step: RoutineStep } => p.step !== null);

  return withStep
    .sort((a, b) => STEP_PRIORITY[a.step] - STEP_PRIORITY[b.step])
    .map((p) => ({
      step: p.step,
      productName: p.name,
      reason: STEP_REASON[p.step],
    }));
}
