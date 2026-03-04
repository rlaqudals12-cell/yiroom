/**
 * 안전성 규칙 상수
 *
 * @see docs/adr/ADR-070-safety-profile-architecture.md
 * @see docs/specs/SDD-SAFETY-PROFILE.md
 *
 * 5개 교차반응 그룹, 금기사항, 연령 제한, 성분 상호작용
 */

import type {
  CrossReactivityGroup,
  ContraindicationRule,
  AgeRestrictionRule,
  InteractionRule,
} from './types';

// =============================================================================
// Step 1: 알레르겐 교차반응 그룹 (Level 1, FNR ≤ 0.1%)
// =============================================================================

export const CROSS_REACTIVITY_GROUPS: CrossReactivityGroup[] = [
  {
    id: 'tree-nuts',
    name: 'Tree Nuts',
    nameKo: '견과류',
    members: [
      'almond',
      'walnut',
      'cashew',
      'pistachio',
      'brazil nut',
      'sweet almond oil',
      'walnut extract',
      'cashew oil',
    ],
  },
  {
    id: 'latex-fruit',
    name: 'Latex-Fruit Syndrome',
    nameKo: '라텍스-과일 증후군',
    members: [
      'latex',
      'banana',
      'avocado',
      'kiwi',
      'chestnut',
      'avocado oil',
      'banana extract',
      'kiwi extract',
    ],
  },
  {
    id: 'asteraceae',
    name: 'Asteraceae (Daisy Family)',
    nameKo: '국화과',
    members: [
      'chamomile',
      'arnica',
      'calendula',
      'echinacea',
      'chamomile extract',
      'arnica extract',
      'calendula extract',
      'chrysanthemum',
      'sunflower',
    ],
  },
  {
    id: 'propolis-balsam',
    name: 'Propolis-Balsam',
    nameKo: '프로폴리스-발삼',
    members: [
      'propolis',
      'peru balsam',
      'benzoin',
      'tolu balsam',
      'propolis extract',
      'balsam peru',
    ],
  },
  {
    id: 'nickel-metal',
    name: 'Nickel-Metal',
    nameKo: '니켈-금속',
    members: [
      'nickel',
      'cobalt',
      'chromium',
      'nickel sulfate',
      'cobalt chloride',
      'chromium oxide',
    ],
  },
];

// =============================================================================
// Step 2: 금기사항 규칙 (Level 2, FNR ≤ 5%)
// =============================================================================

export const CONTRAINDICATION_RULES: ContraindicationRule[] = [
  // 임신 관련
  {
    condition: 'pregnancy',
    ingredients: ['retinol', 'retinal', 'retinoic acid', 'tretinoin', 'adapalene'],
    reason: '임신 중 레티노이드 사용은 태아에 영향을 줄 수 있어요.',
    level: 2,
  },
  {
    condition: 'pregnancy',
    ingredients: ['salicylic acid', 'bha'],
    reason: '임신 중 살리실산 고농도 사용은 주의가 필요해요.',
    level: 2,
  },
  {
    condition: 'pregnancy',
    ingredients: ['hydroquinone'],
    reason: '임신 중 하이드로퀴논 사용은 권장되지 않아요.',
    level: 2,
  },
  // 아토피
  {
    condition: 'atopy',
    ingredients: ['fragrance', 'parfum', 'alcohol denat', 'denatured alcohol'],
    reason: '아토피 피부에 향료와 알코올은 자극을 줄 수 있어요.',
    level: 2,
  },
  {
    condition: 'atopy',
    ingredients: ['sodium lauryl sulfate', 'sls'],
    reason: '아토피 피부에 SLS는 피부 장벽을 손상시킬 수 있어요.',
    level: 2,
  },
  // 건선
  {
    condition: 'psoriasis',
    ingredients: ['alcohol denat', 'denatured alcohol'],
    reason: '건선 환부에 알코올은 건조함을 악화시킬 수 있어요.',
    level: 2,
  },
  // 로사시아
  {
    condition: 'rosacea',
    ingredients: ['menthol', 'peppermint', 'eucalyptus', 'camphor'],
    reason: '로사시아 피부에 자극성 성분은 홍조를 악화시킬 수 있어요.',
    level: 2,
  },
];

// =============================================================================
// Step 2: 연령 제한 (Level 2)
// =============================================================================

export const AGE_RESTRICTIONS: AgeRestrictionRule[] = [
  {
    ingredient: 'aha',
    minAge: 12,
    reason: '12세 미만에게 AHA 사용은 권장되지 않아요.',
  },
  {
    ingredient: 'glycolic acid',
    minAge: 12,
    reason: '12세 미만에게 글리콜산 사용은 권장되지 않아요.',
  },
  {
    ingredient: 'bha',
    minAge: 12,
    reason: '12세 미만에게 BHA 사용은 권장되지 않아요.',
  },
  {
    ingredient: 'salicylic acid',
    minAge: 12,
    reason: '12세 미만에게 살리실산 사용은 권장되지 않아요.',
  },
  {
    ingredient: 'retinol',
    minAge: 16,
    reason: '16세 미만에게 레티놀 사용은 권장되지 않아요.',
  },
  {
    ingredient: 'benzoyl peroxide',
    minAge: 12,
    reason: '12세 미만에게 벤조일퍼옥사이드 사용은 권장되지 않아요.',
  },
];

// =============================================================================
// Step 3: 성분 상호작용 (Level 2-3)
// =============================================================================

export const INTERACTION_RULES: InteractionRule[] = [
  // pH 충돌
  {
    ingredientA: 'vitamin c',
    ingredientB: 'niacinamide',
    type: 'pH_conflict',
    reason: '비타민C(pH 2.5~3.5)와 나이아신아마이드(pH 5~7)는 pH 차이로 효과가 감소할 수 있어요.',
    level: 3,
  },
  {
    ingredientA: 'ascorbic acid',
    ingredientB: 'niacinamide',
    type: 'pH_conflict',
    reason: '아스코르빈산과 나이아신아마이드는 pH 차이로 효과가 감소할 수 있어요.',
    level: 3,
  },
  // 산화 비호환
  {
    ingredientA: 'retinol',
    ingredientB: 'benzoyl peroxide',
    type: 'oxidative',
    reason: '레티놀과 벤조일퍼옥사이드를 함께 사용하면 레티놀이 산화될 수 있어요.',
    level: 2,
  },
  {
    ingredientA: 'retinol',
    ingredientB: 'vitamin c',
    type: 'oxidative',
    reason:
      '레티놀과 비타민C를 동시 사용하면 자극이 강해질 수 있어요. 아침/저녁으로 분리 사용을 권장해요.',
    level: 3,
  },
  {
    ingredientA: 'aha',
    ingredientB: 'retinol',
    type: 'oxidative',
    reason: 'AHA와 레티놀을 함께 사용하면 피부 자극이 강해질 수 있어요.',
    level: 2,
  },
  {
    ingredientA: 'bha',
    ingredientB: 'retinol',
    type: 'oxidative',
    reason: 'BHA와 레티놀을 함께 사용하면 피부 자극이 강해질 수 있어요.',
    level: 2,
  },
  // 킬레이션
  {
    ingredientA: 'edta',
    ingredientB: 'zinc oxide',
    type: 'chelation',
    reason: 'EDTA는 아연 이온을 킬레이트하여 자외선 차단 효과를 감소시킬 수 있어요.',
    level: 3,
  },
];

// =============================================================================
// EWG 기반 점수 (Step 4)
// =============================================================================

/** EWG 등급 → 기본 점수 변환 */
export function getEWGBaseScore(ewgRating: number): number {
  if (ewgRating <= 2) return 100;
  if (ewgRating <= 4) return 80;
  if (ewgRating <= 6) return 60;
  return 40;
}

/** 조치별 점수 감점 */
export const ACTION_PENALTIES: Record<string, number> = {
  ALLERGEN: -50,
  CONTRAINDICATION: -30,
  pH_conflict: -20,
  oxidative: -15,
  chelation: -10,
};
