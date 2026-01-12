/**
 * 냉장고-레시피 매칭 헬퍼 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  matchRecipesWithPantry,
  calculatePantryStats,
  categorizeIngredients,
} from '@/lib/nutrition/pantry-recipe-matcher';
import type { InventoryItem } from '@/types/inventory';

// 테스트용 냉장고 아이템 생성
function createPantryItem(
  name: string,
  expiryDate?: string,
  storageType: 'refrigerator' | 'freezer' | 'room' = 'refrigerator'
): InventoryItem {
  return {
    id: `item-${name}`,
    clerkUserId: 'test-user',
    category: 'pantry',
    subCategory: null,
    name,
    imageUrl: '',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: expiryDate || null,
    metadata: {
      unit: 'g',
      quantity: 100,
      storageType,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('matchRecipesWithPantry', () => {
  it('냉장고 재료로 레시피를 매칭한다', () => {
    const pantryItems = [
      createPantryItem('닭가슴살'),
      createPantryItem('양상추'),
      createPantryItem('토마토'),
      createPantryItem('오이'),
    ];

    const results = matchRecipesWithPantry(pantryItems);

    expect(results.length).toBeGreaterThan(0);
    // 닭가슴살 샐러드가 높은 점수여야 함
    const chickenSalad = results.find((r) => r.recipe.name === '닭가슴살 샐러드');
    expect(chickenSalad).toBeDefined();
  });

  it('유통기한 임박 재료에 보너스 점수를 준다', () => {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 2);

    const pantryItems = [
      createPantryItem('닭가슴살', threeDaysLater.toISOString().split('T')[0]),
      createPantryItem('양상추'),
      createPantryItem('토마토'),
      createPantryItem('오이'),
      createPantryItem('올리브오일'),
    ];

    const results = matchRecipesWithPantry(pantryItems);

    // 닭가슴살 샐러드가 높은 점수여야 함 (유통기한 임박 보너스)
    const chickenSalad = results.find((r) => r.recipe.name === '닭가슴살 샐러드');
    expect(chickenSalad).toBeDefined();
    if (chickenSalad) {
      expect(chickenSalad.matchScore).toBeGreaterThan(0);
    }
  });

  it('영양 목표로 필터링한다', () => {
    const pantryItems = [
      createPantryItem('닭가슴살'),
      createPantryItem('양상추'),
      createPantryItem('토마토'),
    ];

    const results = matchRecipesWithPantry(pantryItems, { nutritionGoal: 'diet' });

    for (const result of results) {
      expect(result.recipe.nutritionGoals).toContain('diet');
    }
  });

  it('최소 매칭 점수로 필터링한다', () => {
    const pantryItems = [createPantryItem('닭가슴살')];

    const results = matchRecipesWithPantry(pantryItems, { minMatchScore: 50 });

    for (const result of results) {
      expect(result.matchScore).toBeGreaterThanOrEqual(50);
    }
  });
});

describe('calculatePantryStats', () => {
  it('냉장고 통계를 계산한다', () => {
    const pantryItems = [
      createPantryItem('닭가슴살', undefined, 'refrigerator'),
      createPantryItem('소고기', undefined, 'freezer'),
      createPantryItem('쌀', undefined, 'room'),
    ];

    const stats = calculatePantryStats(pantryItems);

    expect(stats.totalItems).toBe(3);
    expect(stats.storageBreakdown.refrigerator).toBe(1);
    expect(stats.storageBreakdown.freezer).toBe(1);
    expect(stats.storageBreakdown.room).toBe(1);
  });

  it('유통기한 임박 재료를 감지한다', () => {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 2);

    const pantryItems = [
      createPantryItem('닭가슴살', threeDaysLater.toISOString().split('T')[0]),
      createPantryItem('양상추'),
    ];

    const stats = calculatePantryStats(pantryItems);

    expect(stats.expiringItems.length).toBe(1);
    expect(stats.expiringItems[0].name).toBe('닭가슴살');
  });

  it('유통기한 지난 재료를 감지한다', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const pantryItems = [
      createPantryItem('오래된우유', yesterday.toISOString().split('T')[0]),
      createPantryItem('신선한우유'),
    ];

    const stats = calculatePantryStats(pantryItems);

    expect(stats.expiredItems.length).toBe(1);
    expect(stats.expiredItems[0].name).toBe('오래된우유');
  });

  it('최근 추가된 재료를 추적한다', () => {
    const pantryItems = [
      createPantryItem('새재료1'),
      createPantryItem('새재료2'),
      createPantryItem('새재료3'),
    ];

    const stats = calculatePantryStats(pantryItems);

    expect(stats.recentlyAdded.length).toBeGreaterThan(0);
  });
});

describe('categorizeIngredients', () => {
  it('재료를 카테고리별로 분류한다', () => {
    const pantryItems = [
      createPantryItem('닭가슴살'),
      createPantryItem('양상추'),
      createPantryItem('토마토'),
      createPantryItem('연어'),
      createPantryItem('우유'),
      createPantryItem('밥'),
      createPantryItem('간장'),
    ];

    const categories = categorizeIngredients(pantryItems);

    expect(categories.meat).toBeGreaterThan(0); // 닭가슴살
    expect(categories.vegetable).toBeGreaterThan(0); // 양상추, 토마토
    expect(categories.seafood).toBeGreaterThan(0); // 연어
    expect(categories.dairy).toBeGreaterThan(0); // 우유
    expect(categories.grain).toBeGreaterThan(0); // 밥
    expect(categories.seasoning).toBeGreaterThan(0); // 간장
  });

  it('분류되지 않은 재료는 other로 분류한다', () => {
    const pantryItems = [createPantryItem('알수없는재료')];

    const categories = categorizeIngredients(pantryItems);

    expect(categories.other).toBe(1);
  });

  it('대소문자 구분 없이 분류한다', () => {
    const pantryItems = [createPantryItem('닭가슴살'), createPantryItem('닭고기')];

    const categories = categorizeIngredients(pantryItems);

    expect(categories.meat).toBe(2);
  });
});
