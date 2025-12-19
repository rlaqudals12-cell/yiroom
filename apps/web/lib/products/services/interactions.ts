/**
 * 성분 상호작용 Service
 * @description 영양제/건강식품 간 성분 충돌 경고
 */

import { supabase } from '@/lib/supabase/client';
import type {
  IngredientInteraction,
  IngredientInteractionRow,
  ProductInteractionWarning,
  InteractionSummary,
  InteractionType,
  Severity,
} from '@/types/interaction';
import type { AnyProduct } from '@/types/product';

// ================================================
// 성분 추출 헬퍼
// ================================================

/**
 * 제품에서 성분 목록 추출
 */
function extractIngredients(product: AnyProduct): string[] {
  const ingredients: string[] = [];

  // 영양제: mainIngredients
  if ('mainIngredients' in product && product.mainIngredients) {
    for (const ing of product.mainIngredients) {
      ingredients.push(ing.name.toLowerCase());
    }
  }

  // 건강식품: additionalNutrients
  if ('additionalNutrients' in product && product.additionalNutrients) {
    for (const nut of product.additionalNutrients) {
      ingredients.push(nut.name.toLowerCase());
    }
  }

  // 건강식품: 카테고리 기반 추론
  if ('category' in product) {
    const category = product.category as string;
    // 특정 카테고리는 주요 성분을 암시
    const categoryIngredients: Record<string, string[]> = {
      protein_powder: ['단백질'],
      bcaa: ['bcaa', '아미노산'],
      creatine: ['크레아틴'],
      pre_workout: ['카페인'],
    };
    if (categoryIngredients[category]) {
      ingredients.push(...categoryIngredients[category]);
    }
  }

  return [...new Set(ingredients)]; // 중복 제거
}

/**
 * 제품 정보 추출 (경고 표시용)
 */
function getProductInfo(product: AnyProduct): { id: string; name: string; type: string } {
  let type = 'unknown';

  if ('mainIngredients' in product) {
    type = 'supplement';
  } else if ('additionalNutrients' in product) {
    type = 'healthfood';
  }

  return {
    id: product.id,
    name: product.name,
    type,
  };
}

// ================================================
// 상호작용 조회
// ================================================

/**
 * 두 성분 간 상호작용 조회
 * @param ingredientA 성분 A
 * @param ingredientB 성분 B
 */
export async function getInteractionBetween(
  ingredientA: string,
  ingredientB: string
): Promise<IngredientInteraction[]> {
  // 양방향 검색 (A-B 또는 B-A)
  const { data, error } = await supabase
    .from('ingredient_interactions')
    .select('*')
    .or(
      `and(ingredient_a.ilike.%${ingredientA}%,ingredient_b.ilike.%${ingredientB}%),` +
      `and(ingredient_a.ilike.%${ingredientB}%,ingredient_b.ilike.%${ingredientA}%)`
    );

  if (error) {
    console.error('[Interactions] Failed to fetch interaction:', error);
    return [];
  }

  return (data as IngredientInteractionRow[]).map(mapInteractionRow);
}

/**
 * 특정 성분과 관련된 모든 상호작용 조회
 * @param ingredient 성분명
 */
export async function getIngredientInteractions(
  ingredient: string
): Promise<IngredientInteraction[]> {
  const { data, error } = await supabase
    .from('ingredient_interactions')
    .select('*')
    .or(`ingredient_a.ilike.%${ingredient}%,ingredient_b.ilike.%${ingredient}%`);

  if (error) {
    console.error('[Interactions] Failed to fetch interactions:', error);
    return [];
  }

  return (data as IngredientInteractionRow[]).map(mapInteractionRow);
}

/**
 * 특정 유형의 상호작용만 조회
 * @param type 상호작용 유형
 * @param limit 최대 개수
 */
export async function getInteractionsByType(
  type: InteractionType,
  limit = 50
): Promise<IngredientInteraction[]> {
  const { data, error } = await supabase
    .from('ingredient_interactions')
    .select('*')
    .eq('interaction_type', type)
    .limit(limit);

  if (error) {
    console.error('[Interactions] Failed to fetch interactions by type:', error);
    return [];
  }

  return (data as IngredientInteractionRow[]).map(mapInteractionRow);
}

// ================================================
// 제품 간 상호작용 검사
// ================================================

/**
 * 여러 제품 간 상호작용 검사
 * @param products 제품 목록
 * @returns 제품 쌍별 상호작용 경고
 */
export async function checkProductInteractions(
  products: AnyProduct[]
): Promise<ProductInteractionWarning[]> {
  if (products.length < 2) {
    return [];
  }

  // 모든 제품의 성분 추출
  const productIngredients = products.map((p) => ({
    product: p,
    info: getProductInfo(p),
    ingredients: extractIngredients(p),
  }));

  // 모든 고유 성분 수집
  const allIngredients = new Set<string>();
  for (const pi of productIngredients) {
    for (const ing of pi.ingredients) {
      allIngredients.add(ing);
    }
  }

  if (allIngredients.size === 0) {
    return [];
  }

  // 모든 상호작용 조회 (현재 24개로 규모 작음)
  // 데이터 1000개 이상 시 성분 기반 필터링 쿼리로 최적화 필요
  const { data, error } = await supabase
    .from('ingredient_interactions')
    .select('*');

  if (error || !data) {
    console.error('[Interactions] Failed to fetch interactions:', error);
    return [];
  }

  const allInteractions = (data as IngredientInteractionRow[]).map(mapInteractionRow);

  // 제품 쌍별 상호작용 검사
  const warnings: ProductInteractionWarning[] = [];

  for (let i = 0; i < productIngredients.length; i++) {
    for (let j = i + 1; j < productIngredients.length; j++) {
      const productA = productIngredients[i];
      const productB = productIngredients[j];

      // 두 제품의 성분 간 상호작용 찾기
      const foundInteractions: IngredientInteraction[] = [];

      for (const ingA of productA.ingredients) {
        for (const ingB of productB.ingredients) {
          // 상호작용 테이블에서 매칭 찾기
          const matches = allInteractions.filter((int) => {
            const a = int.ingredientA.toLowerCase();
            const b = int.ingredientB.toLowerCase();
            return (
              (a.includes(ingA) && b.includes(ingB)) ||
              (a.includes(ingB) && b.includes(ingA))
            );
          });
          foundInteractions.push(...matches);
        }
      }

      if (foundInteractions.length > 0) {
        // 중복 제거
        const uniqueInteractions = Array.from(
          new Map(foundInteractions.map((i) => [i.id, i])).values()
        );

        // 최고 심각도 계산
        const maxSeverity = getMaxSeverity(uniqueInteractions);

        warnings.push({
          productA: productA.info,
          productB: productB.info,
          interactions: uniqueInteractions,
          maxSeverity,
        });
      }
    }
  }

  // 심각도 순으로 정렬 (high > medium > low)
  return warnings.sort((a, b) => {
    const severityOrder: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.maxSeverity] - severityOrder[a.maxSeverity];
  });
}

/**
 * 위시리스트 제품 ID로 상호작용 검사
 * @param productIds 제품 ID 목록
 * @param productType 제품 타입 (supplement 또는 healthfood)
 */
export async function checkWishlistInteractions(
  productIds: string[],
  productType: 'supplement' | 'healthfood'
): Promise<ProductInteractionWarning[]> {
  if (productIds.length < 2) {
    return [];
  }

  // 제품 데이터 조회
  const tableName = productType === 'supplement' ? 'supplement_products' : 'health_foods';
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .in('id', productIds);

  if (error || !data) {
    console.error('[Interactions] Failed to fetch products:', error);
    return [];
  }

  return checkProductInteractions(data as AnyProduct[]);
}

// ================================================
// 요약 통계
// ================================================

/**
 * 상호작용 요약 생성
 */
export function summarizeInteractions(
  warnings: ProductInteractionWarning[]
): InteractionSummary {
  const summary: InteractionSummary = {
    totalWarnings: warnings.length,
    byType: {
      contraindication: 0,
      caution: 0,
      timing: 0,
      synergy: 0,
    },
    bySeverity: {
      high: 0,
      medium: 0,
      low: 0,
    },
  };

  for (const warning of warnings) {
    for (const interaction of warning.interactions) {
      summary.byType[interaction.interactionType]++;
      if (interaction.severity) {
        summary.bySeverity[interaction.severity]++;
      }
    }
  }

  return summary;
}

// ================================================
// 유틸리티
// ================================================

/**
 * DB row → IngredientInteraction 변환
 */
function mapInteractionRow(row: IngredientInteractionRow): IngredientInteraction {
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

/**
 * 상호작용 목록에서 최고 심각도 반환
 */
function getMaxSeverity(interactions: IngredientInteraction[]): Severity {
  const severityOrder: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
  let max: Severity = 'low';

  for (const int of interactions) {
    if (int.severity && severityOrder[int.severity] > severityOrder[max]) {
      max = int.severity;
    }
  }

  return max;
}

/**
 * 상호작용 필터링 (시너지 제외)
 */
export function filterWarningsOnly(
  warnings: ProductInteractionWarning[]
): ProductInteractionWarning[] {
  return warnings
    .map((w) => ({
      ...w,
      interactions: w.interactions.filter((i) => i.interactionType !== 'synergy'),
    }))
    .filter((w) => w.interactions.length > 0);
}

/**
 * 시너지만 필터링
 */
export function filterSynergiesOnly(
  warnings: ProductInteractionWarning[]
): ProductInteractionWarning[] {
  return warnings
    .map((w) => ({
      ...w,
      interactions: w.interactions.filter((i) => i.interactionType === 'synergy'),
    }))
    .filter((w) => w.interactions.length > 0);
}
