/**
 * 성분 충돌 감지 시스템
 * @description 스펙 인터페이스에 맞춘 래퍼 모듈
 * @version 1.0
 * @date 2026-01-11
 */

import { type InteractionWarning } from './ingredient-interactions';

// ================================================
// 타입 정의 (스펙 준수)
// ================================================

export type ConflictSeverity = 'high' | 'medium' | 'low';

export interface IngredientConflict {
  ingredientA: string;
  ingredientB: string;
  severity: ConflictSeverity;
  reason: string;
  solution: string;
}

// ================================================
// 충돌 데이터 (피부과학 기반)
// ================================================

export const INGREDIENT_CONFLICTS: IngredientConflict[] = [
  // High severity - 절대 피해야 할 조합
  {
    ingredientA: 'RETINOL',
    ingredientB: 'VITAMIN C',
    severity: 'high',
    reason: 'pH 불일치로 상호 무력화',
    solution: '아침 비타민C, 저녁 레티놀 분리 사용',
  },
  {
    ingredientA: 'RETINOL',
    ingredientB: 'BENZOYL PEROXIDE',
    severity: 'high',
    reason: '벤조일퍼옥사이드가 레티놀 비활성화',
    solution: '아침 BP, 저녁 레티놀 분리 사용',
  },
  {
    ingredientA: 'RETINOL',
    ingredientB: 'AHA',
    severity: 'high',
    reason: '과도한 각질 제거, 피부 장벽 손상',
    solution: '다른 날 번갈아 사용',
  },
  {
    ingredientA: 'RETINOL',
    ingredientB: 'BHA',
    severity: 'high',
    reason: '과도한 각질 제거, 피부 장벽 손상',
    solution: '다른 날 번갈아 사용',
  },
  {
    ingredientA: 'VITAMIN C',
    ingredientB: 'BENZOYL PEROXIDE',
    severity: 'high',
    reason: 'BP가 비타민C 산화시켜 무력화',
    solution: '다른 날 번갈아 사용',
  },

  // Medium severity - 주의 필요한 조합
  {
    ingredientA: 'NIACINAMIDE',
    ingredientB: 'AHA',
    severity: 'medium',
    reason: '화학 반응으로 홍조/발적 유발 가능',
    solution: '30분 간격 또는 아침/저녁 분리',
  },
  {
    ingredientA: 'NIACINAMIDE',
    ingredientB: 'BHA',
    severity: 'medium',
    reason: '화학 반응으로 홍조/발적 유발 가능',
    solution: '30분 간격 또는 아침/저녁 분리',
  },
  {
    ingredientA: 'VITAMIN C',
    ingredientB: 'AHA',
    severity: 'medium',
    reason: 'pH 차이로 효과 감소 가능',
    solution: '시간차 적용 (20분 이상)',
  },
  {
    ingredientA: 'VITAMIN C',
    ingredientB: 'BHA',
    severity: 'medium',
    reason: 'pH 차이로 효과 감소 가능',
    solution: '시간차 적용 (20분 이상)',
  },
  {
    ingredientA: 'AHA',
    ingredientB: 'BHA',
    severity: 'medium',
    reason: '과도한 각질 제거로 자극 가능',
    solution: '저농도로 시작하거나 격일 사용',
  },

  // Low severity - 경미한 주의
  {
    ingredientA: 'RETINOL',
    ingredientB: 'VITAMIN E',
    severity: 'low',
    reason: '일부 조합에서 레티놀 효과 감소',
    solution: '문제없으면 계속 사용 가능',
  },
];

// ================================================
// 유틸리티 함수
// ================================================

/**
 * 성분명 정규화
 */
function normalizeIngredient(name: string): string {
  return name.toUpperCase().trim();
}

/**
 * 성분 목록에서 충돌 감지
 */
export function detectConflicts(ingredients: string[]): IngredientConflict[] {
  const conflicts: IngredientConflict[] = [];
  const checked = new Set<string>();

  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i + 1; j < ingredients.length; j++) {
      const ing1 = normalizeIngredient(ingredients[i]);
      const ing2 = normalizeIngredient(ingredients[j]);

      const key = [ing1, ing2].sort().join('|');
      if (checked.has(key)) continue;
      checked.add(key);

      // 충돌 규칙 확인
      for (const conflict of INGREDIENT_CONFLICTS) {
        const conflictA = normalizeIngredient(conflict.ingredientA);
        const conflictB = normalizeIngredient(conflict.ingredientB);

        if (
          (ing1.includes(conflictA) && ing2.includes(conflictB)) ||
          (ing1.includes(conflictB) && ing2.includes(conflictA))
        ) {
          conflicts.push({
            ...conflict,
            ingredientA: ingredients[i],
            ingredientB: ingredients[j],
          });
          break;
        }
      }
    }
  }

  return conflicts;
}

/**
 * 충돌을 심각도별로 분류
 */
export function categorizeConflicts(conflicts: IngredientConflict[]): {
  high: IngredientConflict[];
  medium: IngredientConflict[];
  low: IngredientConflict[];
} {
  return {
    high: conflicts.filter((c) => c.severity === 'high'),
    medium: conflicts.filter((c) => c.severity === 'medium'),
    low: conflicts.filter((c) => c.severity === 'low'),
  };
}

/**
 * 기존 InteractionWarning을 IngredientConflict로 변환
 */
export function convertFromInteractionWarning(warning: InteractionWarning): IngredientConflict {
  const severityMap: Record<string, ConflictSeverity> = {
    avoid_together: 'high',
    caution: 'medium',
    synergy: 'low', // 시너지는 충돌이 아니지만 변환용
  };

  return {
    ingredientA: warning.ingredients[0],
    ingredientB: warning.ingredients[1],
    severity: severityMap[warning.type] || 'low',
    reason: warning.reason,
    solution: warning.recommendation,
  };
}

/**
 * 제품 목록에서 모든 성분 추출 후 충돌 검사
 */
export function detectProductConflicts(
  products: Array<{ ingredients?: string[] }>
): IngredientConflict[] {
  const allIngredients = products.flatMap((p) => p.ingredients || []);
  return detectConflicts(allIngredients);
}

/**
 * 충돌 심각도에 따른 점수 페널티 계산
 */
export function calculateConflictPenalty(conflicts: IngredientConflict[]): number {
  let penalty = 0;

  for (const conflict of conflicts) {
    switch (conflict.severity) {
      case 'high':
        penalty += 15;
        break;
      case 'medium':
        penalty += 7;
        break;
      case 'low':
        penalty += 2;
        break;
    }
  }

  return penalty;
}

/**
 * 충돌 여부 간단 확인 (boolean)
 */
export function hasConflicts(ingredients: string[]): boolean {
  return detectConflicts(ingredients).length > 0;
}

/**
 * 심각한 충돌만 확인
 */
export function hasHighSeverityConflicts(ingredients: string[]): boolean {
  const conflicts = detectConflicts(ingredients);
  return conflicts.some((c) => c.severity === 'high');
}
