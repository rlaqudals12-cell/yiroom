/**
 * Ingredient Interaction TypeScript 타입 정의
 * @description 성분 상호작용 경고 시스템 타입
 * @version 1.0
 * @date 2025-12-19
 */

// ================================================
// 상호작용 타입
// ================================================

/** 상호작용 유형 */
export type InteractionType =
  | 'contraindication' // 금기 (절대 같이 복용 X)
  | 'caution' // 주의 (의사 상담 권장)
  | 'synergy' // 시너지 (같이 먹으면 좋음)
  | 'timing'; // 시간 분리 필요

/** 심각도 */
export type Severity = 'high' | 'medium' | 'low';

/** 성분 상호작용 */
export interface IngredientInteraction {
  id: string;
  ingredientA: string;
  ingredientB: string;
  interactionType: InteractionType;
  severity?: Severity;
  description: string;
  recommendation?: string;
  source?: string;
  createdAt: string;
}

/** 제품 간 상호작용 경고 */
export interface ProductInteractionWarning {
  /** 제품 A 정보 */
  productA: {
    id: string;
    name: string;
    type: string;
  };
  /** 제품 B 정보 */
  productB: {
    id: string;
    name: string;
    type: string;
  };
  /** 해당 제품 쌍에서 발견된 상호작용들 */
  interactions: IngredientInteraction[];
  /** 가장 높은 심각도 */
  maxSeverity: Severity;
}

/** 상호작용 요약 */
export interface InteractionSummary {
  /** 총 경고 수 */
  totalWarnings: number;
  /** 유형별 개수 */
  byType: {
    contraindication: number;
    caution: number;
    timing: number;
    synergy: number;
  };
  /** 심각도별 개수 */
  bySeverity: {
    high: number;
    medium: number;
    low: number;
  };
}

// ================================================
// Supabase 테이블 Row 타입
// ================================================

/** ingredient_interactions 테이블 row */
export interface IngredientInteractionRow {
  id: string;
  ingredient_a: string;
  ingredient_b: string;
  interaction_type: string;
  severity: string | null;
  description: string;
  recommendation: string | null;
  source: string | null;
  created_at: string;
}

// ================================================
// 유틸리티 함수
// ================================================

/** DB row → 프론트엔드 타입 변환 */
export function toIngredientInteraction(
  row: IngredientInteractionRow
): IngredientInteraction {
  return {
    id: row.id,
    ingredientA: row.ingredient_a,
    ingredientB: row.ingredient_b,
    interactionType: row.interaction_type as InteractionType,
    severity: (row.severity as Severity) ?? undefined,
    description: row.description,
    recommendation: row.recommendation ?? undefined,
    source: row.source ?? undefined,
    createdAt: row.created_at,
  };
}

/** 상호작용 유형 라벨 */
export function getInteractionTypeLabel(type: InteractionType): string {
  switch (type) {
    case 'contraindication':
      return '금기';
    case 'caution':
      return '주의';
    case 'synergy':
      return '시너지';
    case 'timing':
      return '시간 분리';
    default:
      return '';
  }
}

/** 상호작용 유형 색상 */
export function getInteractionTypeColor(type: InteractionType): string {
  switch (type) {
    case 'contraindication':
      return 'text-red-600 dark:text-red-400';
    case 'caution':
      return 'text-orange-600 dark:text-orange-400';
    case 'synergy':
      return 'text-green-600 dark:text-green-400';
    case 'timing':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return '';
  }
}

/** 상호작용 유형 배경색 */
export function getInteractionTypeBgColor(type: InteractionType): string {
  switch (type) {
    case 'contraindication':
      return 'bg-red-100 dark:bg-red-900/30';
    case 'caution':
      return 'bg-orange-100 dark:bg-orange-900/30';
    case 'synergy':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'timing':
      return 'bg-blue-100 dark:bg-blue-900/30';
    default:
      return '';
  }
}

/** 심각도 라벨 */
export function getSeverityLabel(severity: Severity): string {
  switch (severity) {
    case 'high':
      return '높음';
    case 'medium':
      return '보통';
    case 'low':
      return '낮음';
    default:
      return '';
  }
}

/** 심각도 색상 */
export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'high':
      return 'text-red-600 dark:text-red-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'low':
      return 'text-green-600 dark:text-green-400';
    default:
      return '';
  }
}
