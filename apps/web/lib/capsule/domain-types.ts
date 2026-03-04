/**
 * 도메인별 아이템 타입 정의
 *
 * 각 CapsuleEngine<T>에서 사용하는 T 타입
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

// =============================================================================
// Skin 도메인 — 스킨케어 제품
// =============================================================================

/** 스킨케어 제품 아이템 */
export interface SkinProduct {
  id: string;
  name: string;
  brand: string;
  category: SkinProductCategory;
  ingredients: string[];
  skinTypes: string[];
  concerns: string[];
  /** EWG 안전 등급 (1=안전, 10=위험) */
  ewgGrade?: number;
}

export type SkinProductCategory =
  | 'cleanser'
  | 'toner'
  | 'serum'
  | 'moisturizer'
  | 'sunscreen'
  | 'mask'
  | 'eye-cream'
  | 'exfoliator';

// 성분 상호작용 규칙 (L1 점수 계산)
export const SKIN_INGREDIENT_CONFLICTS: [string, string][] = [
  ['retinol', 'aha'],
  ['retinol', 'bha'],
  ['retinol', 'vitamin c'],
  ['aha', 'bha'],
  ['benzoyl peroxide', 'retinol'],
  ['benzoyl peroxide', 'vitamin c'],
  ['niacinamide', 'vitamin c'], // 약한 충돌 (pH 의존)
];

export const SKIN_INGREDIENT_SYNERGIES: [string, string][] = [
  ['hyaluronic acid', 'niacinamide'],
  ['vitamin c', 'vitamin e'],
  ['retinol', 'hyaluronic acid'],
  ['ceramide', 'hyaluronic acid'],
  ['centella asiatica', 'niacinamide'],
];

// =============================================================================
// Fashion 도메인 — 옷장 아이템
// =============================================================================

/** 패션 아이템 */
export interface FashionItem {
  id: string;
  name: string;
  category: FashionCategory;
  color: FashionColor;
  silhouette?: string;
  occasion?: string;
  tags?: string[];
}

export type FashionCategory = 'top' | 'bottom' | 'outer' | 'dress' | 'shoes' | 'bag' | 'accessory';

export interface FashionColor {
  name: string;
  hex: string;
  season?: string;
}

// 색상 조화 그룹 (같은 그룹 내 조화도 높음)
export const COLOR_HARMONY_GROUPS: Record<string, string[]> = {
  neutral: ['#000000', '#FFFFFF', '#808080', '#C0C0C0', '#F5F5DC'],
  warm: ['#FF6347', '#FF8C00', '#FFD700', '#DAA520', '#CD853F'],
  cool: ['#4169E1', '#6A5ACD', '#708090', '#5F9EA0', '#2F4F4F'],
  pastel: ['#FFB6C1', '#DDA0DD', '#B0E0E6', '#98FB98', '#FAFAD2'],
};

// 실루엣 매칭 규칙 (상의-하의 조합)
export const SILHOUETTE_HARMONY: Record<string, string[]> = {
  oversized: ['slim', 'straight'],
  slim: ['wide', 'oversized', 'straight'],
  straight: ['slim', 'straight', 'oversized'],
  wide: ['slim', 'fitted'],
  fitted: ['wide', 'straight', 'flare'],
  flare: ['fitted', 'slim'],
};

// =============================================================================
// Nutrition 도메인 — 영양 아이템
// =============================================================================

/** 영양 아이템 (보충제/식품) */
export interface NutritionItem {
  id: string;
  name: string;
  category: NutritionCategory;
  nutrients: NutrientInfo[];
  /** 하루 권장 복용 횟수 */
  dailyServings: number;
}

export type NutritionCategory = 'supplement' | 'functional-food' | 'meal-plan' | 'snack';

export interface NutrientInfo {
  name: string;
  amount: number;
  unit: string;
  /** 일일 권장량 대비 % */
  dailyValuePercent?: number;
}

// 영양소 상호작용 규칙
export const NUTRIENT_SYNERGIES: [string, string][] = [
  ['vitamin d', 'calcium'],
  ['vitamin c', 'iron'],
  ['vitamin d', 'magnesium'],
  ['omega-3', 'vitamin e'],
  ['probiotics', 'prebiotics'],
  ['zinc', 'vitamin c'],
];

export const NUTRIENT_CONFLICTS: [string, string][] = [
  ['calcium', 'iron'],
  ['zinc', 'copper'],
  ['calcium', 'zinc'],
  ['iron', 'vitamin e'],
];

// 영양 균형 기준 (deficiency 매칭)
export const DEFICIENCY_NUTRIENTS: Record<string, string[]> = {
  '비타민D 부족': ['vitamin d', 'calcium'],
  '철분 부족': ['iron', 'vitamin c'],
  '오메가3 부족': ['omega-3', 'vitamin e'],
  '칼슘 부족': ['calcium', 'vitamin d', 'magnesium'],
  '비타민B 부족': ['vitamin b12', 'folate', 'vitamin b6'],
  '아연 부족': ['zinc', 'vitamin c'],
};

// =============================================================================
// Workout 도메인 — 운동 계획
// =============================================================================

/** 운동 계획 아이템 */
export interface WorkoutPlan {
  id: string;
  name: string;
  type: WorkoutType;
  /** MET 값 */
  met: number;
  durationMinutes: number;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export type WorkoutType = 'cardio' | 'strength' | 'flexibility' | 'balance' | 'hiit';

// 근육 그룹 간 시너지 (같은 날 함께 하면 좋은 조합)
export const MUSCLE_GROUP_SYNERGIES: [string, string][] = [
  ['chest', 'triceps'],
  ['back', 'biceps'],
  ['shoulders', 'triceps'],
  ['quadriceps', 'glutes'],
  ['hamstrings', 'glutes'],
  ['core', 'back'],
];

// 같은 날 피해야 하는 조합 (과부하)
export const MUSCLE_GROUP_CONFLICTS: [string, string][] = [
  ['chest', 'shoulders'], // 전면부 과부하
  ['biceps', 'forearms'], // 당김 과부하
];

// =============================================================================
// Hair 도메인 — 헤어케어 제품
// =============================================================================

/** 헤어케어 아이템 */
export interface HairProduct {
  id: string;
  name: string;
  category: HairProductCategory;
  ingredients: string[];
  hairTypes: string[];
  scalpTypes: string[];
}

export type HairProductCategory =
  | 'shampoo'
  | 'conditioner'
  | 'treatment'
  | 'styling'
  | 'scalp-care'
  | 'hair-oil';

// 헤어 성분 시너지
export const HAIR_INGREDIENT_SYNERGIES: [string, string][] = [
  ['keratin', 'biotin'],
  ['argan oil', 'vitamin e'],
  ['tea tree', 'peppermint'],
  ['collagen', 'hyaluronic acid'],
  ['caffeine', 'niacinamide'],
];

// 헤어 성분 충돌
export const HAIR_INGREDIENT_CONFLICTS: [string, string][] = [
  ['sulfate', 'keratin'], // 설페이트가 케라틴 세척
  ['silicone', 'tea tree'], // 실리콘이 두피 흡수 차단
  ['alcohol', 'argan oil'], // 알코올이 보습 상쇄
];

// =============================================================================
// Makeup 도메인 — 메이크업 제품
// =============================================================================

/** 메이크업 아이템 */
export interface MakeupProduct {
  id: string;
  name: string;
  category: MakeupCategory;
  shade?: string;
  finish?: MakeupFinish;
  seasonMatch?: string[];
}

export type MakeupCategory = 'base' | 'eye' | 'lip' | 'cheek' | 'brow' | 'setting';

export type MakeupFinish = 'matte' | 'dewy' | 'satin' | 'shimmer' | 'glossy';

// 마감-마감 조화 (같이 쓰면 좋은 조합)
export const FINISH_HARMONY: Record<string, string[]> = {
  matte: ['shimmer', 'satin'],
  dewy: ['matte', 'satin'],
  satin: ['matte', 'dewy', 'shimmer'],
  shimmer: ['matte', 'satin'],
  glossy: ['matte'],
};

// =============================================================================
// Personal Color 도메인 — 퍼스널컬러 팔레트
// =============================================================================

/** 퍼스널컬러 팔레트 아이템 */
export interface PCPalette {
  id: string;
  name: string;
  category: PCPaletteCategory;
  colors: string[];
  season: string;
  /** 해당 시즌에 대한 적합도 (0-100) */
  seasonFit: number;
}

export type PCPaletteCategory = 'clothing' | 'makeup' | 'accessory' | 'hair-color';

// =============================================================================
// Oral Health 도메인 — 구강건강 제품
// =============================================================================

/** 구강건강 아이템 */
export interface OralProduct {
  id: string;
  name: string;
  category: OralProductCategory;
  ingredients: string[];
  targetConditions: string[];
}

export type OralProductCategory =
  | 'toothpaste'
  | 'mouthwash'
  | 'floss'
  | 'whitening'
  | 'gum-care'
  | 'tongue-cleaner';

// 구강 성분 시너지
export const ORAL_INGREDIENT_SYNERGIES: [string, string][] = [
  ['fluoride', 'calcium'],
  ['xylitol', 'fluoride'],
  ['chlorhexidine', 'cetylpyridinium'],
];

// 구강 성분 충돌
export const ORAL_INGREDIENT_CONFLICTS: [string, string][] = [
  ['hydrogen peroxide', 'chlorhexidine'], // 효과 상쇄
  ['baking soda', 'fluoride'], // pH 간섭
];

// =============================================================================
// Body 도메인 — 체형 관리 계획
// =============================================================================

/** 체형 관리 아이템 */
export interface BodyPlan {
  id: string;
  name: string;
  category: BodyPlanCategory;
  targetAreas: string[];
  approach: 'posture' | 'exercise' | 'stretching' | 'lifestyle';
  durationWeeks: number;
}

export type BodyPlanCategory =
  | 'posture-correction'
  | 'body-alignment'
  | 'stretching-routine'
  | 'strength-plan'
  | 'lifestyle-habit';
