/**
 * 냉장고 재료와 레시피 매칭 통합 헬퍼
 * @description user_inventory (category='pantry')와 레시피 매칭 시스템 연동
 */

import { recommendRecipes, type NutritionGoal, type RecipeMatchResult } from './recipe-matcher';
import type { InventoryItem, PantryMetadata } from '@/types/inventory';
import { differenceInDays } from 'date-fns';

/**
 * 냉장고 재료로부터 레시피 매칭
 */
export function matchRecipesWithPantry(
  pantryItems: InventoryItem[],
  options?: {
    minMatchScore?: number;
    maxMissingIngredients?: number;
    nutritionGoal?: NutritionGoal;
    maxCookTime?: number;
    expiryWarningDays?: number; // 유통기한 임박 기준 (기본 3일)
  }
): RecipeMatchResult[] {
  const expiryWarningDays = options?.expiryWarningDays ?? 3;

  // 재료 이름 추출
  const ingredientNames = pantryItems.map((item) => item.name);

  // 유통기한 임박 재료 추출 (3일 이내)
  const expiringItems = pantryItems
    .filter((item) => {
      if (!item.expiryDate) return false;
      const daysUntilExpiry = differenceInDays(new Date(item.expiryDate), new Date());
      return daysUntilExpiry <= expiryWarningDays && daysUntilExpiry >= 0;
    })
    .map((item) => item.name);

  // 레시피 매칭 실행
  return recommendRecipes(ingredientNames, {
    goal: options?.nutritionGoal,
    minMatchScore: options?.minMatchScore,
    maxMissingIngredients: options?.maxMissingIngredients,
    maxCookTime: options?.maxCookTime,
    expiringItems,
  });
}

/**
 * 냉장고 통계 계산
 */
export interface PantryStats {
  totalItems: number;
  expiringItems: InventoryItem[];
  expiredItems: InventoryItem[];
  storageBreakdown: {
    refrigerator: number;
    freezer: number;
    room: number;
  };
  recentlyAdded: InventoryItem[];
}

export function calculatePantryStats(pantryItems: InventoryItem[]): PantryStats {
  const now = new Date();

  // 유통기한 임박 재료 (3일 이내)
  const expiringItems = pantryItems.filter((item) => {
    if (!item.expiryDate) return false;
    const daysUntilExpiry = differenceInDays(new Date(item.expiryDate), now);
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  });

  // 유통기한 지난 재료
  const expiredItems = pantryItems.filter((item) => {
    if (!item.expiryDate) return false;
    return new Date(item.expiryDate) < now;
  });

  // 보관 방법별 분류
  const storageBreakdown = pantryItems.reduce(
    (acc, item) => {
      const metadata = item.metadata as Partial<PantryMetadata>;
      const storageType = metadata?.storageType || 'room';
      acc[storageType] = (acc[storageType] || 0) + 1;
      return acc;
    },
    { refrigerator: 0, freezer: 0, room: 0 } as Record<string, number>
  );

  // 최근 추가된 재료 (7일 이내, 최대 5개)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentlyAdded = pantryItems
    .filter((item) => new Date(item.createdAt) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    totalItems: pantryItems.length,
    expiringItems,
    expiredItems,
    storageBreakdown: storageBreakdown as PantryStats['storageBreakdown'],
    recentlyAdded,
  };
}

/**
 * 재료 카테고리별 분류
 */
export interface IngredientCategoryBreakdown {
  vegetable: number;
  meat: number;
  seafood: number;
  dairy: number;
  grain: number;
  seasoning: number;
  other: number;
}

export function categorizeIngredients(pantryItems: InventoryItem[]): IngredientCategoryBreakdown {
  // 간단한 키워드 기반 분류 (향후 AI 분류 가능)
  const categories = {
    vegetable: ['채소', '야채', '상추', '토마토', '오이', '양파', '당근', '배추', '무', '시금치'],
    meat: ['고기', '소고기', '돼지고기', '닭', '양고기'],
    seafood: ['생선', '연어', '새우', '조개', '오징어', '참치'],
    dairy: ['우유', '치즈', '요거트', '계란', '달걀', '버터', '두부'],
    grain: ['밥', '쌀', '면', '빵', '파스타', '시리얼'],
    seasoning: ['소금', '간장', '된장', '고추장', '식초', '설탕', '기름', '참기름', '올리브'],
  };

  const result: IngredientCategoryBreakdown = {
    vegetable: 0,
    meat: 0,
    seafood: 0,
    dairy: 0,
    grain: 0,
    seasoning: 0,
    other: 0,
  };

  for (const item of pantryItems) {
    const itemName = item.name.toLowerCase();
    let categorized = false;

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => itemName.includes(keyword))) {
        result[category as keyof Omit<IngredientCategoryBreakdown, 'other'>]++;
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      result.other++;
    }
  }

  return result;
}
