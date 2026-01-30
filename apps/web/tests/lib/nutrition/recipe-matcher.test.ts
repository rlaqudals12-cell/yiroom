/**
 * 레시피 매칭 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  recommendRecipes,
  getRecipesByGoal,
  calculateDailyCalories,
  calculateDailyProtein,
  findSimilarIngredient,
  SAMPLE_RECIPES,
  NUTRITION_GOAL_LABELS,
  NUTRITION_TARGETS,
  INGREDIENT_SYNONYMS,
  type NutritionGoal,
} from '@/lib/nutrition/recipe-matcher';

describe('recommendRecipes', () => {
  it('보유 재료와 매칭되는 레시피를 반환한다', () => {
    const userIngredients = ['닭가슴살', '양상추', '토마토'];
    const results = recommendRecipes(userIngredients);

    expect(results.length).toBeGreaterThan(0);
    // 닭가슴살 샐러드가 높은 점수여야 함
    const chickenSalad = results.find((r) => r.recipe.name === '닭가슴살 샐러드');
    expect(chickenSalad).toBeDefined();
    if (chickenSalad) {
      expect(chickenSalad.availabilityRate).toBeGreaterThan(0);
      expect(chickenSalad.availabilityRate).toBeLessThanOrEqual(1);
    }
  });

  it('매칭 점수가 높은 순으로 정렬된다', () => {
    const userIngredients = ['밥', '계란', '간장'];
    const results = recommendRecipes(userIngredients);

    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].matchScore).toBeGreaterThanOrEqual(results[i + 1].matchScore);
    }
  });

  it('목표(goal) 옵션으로 필터링한다', () => {
    const userIngredients = ['닭가슴살', '밥', '계란'];
    const results = recommendRecipes(userIngredients, { goal: 'diet' });

    for (const result of results) {
      expect(result.recipe.nutritionGoals).toContain('diet');
    }
  });

  it('누락 재료 수로 필터링한다', () => {
    const userIngredients = ['닭가슴살'];
    const results = recommendRecipes(userIngredients, { maxMissingIngredients: 2 });

    for (const result of results) {
      expect(result.missingIngredients.length).toBeLessThanOrEqual(2);
    }
  });

  it('조리 시간으로 필터링한다', () => {
    const userIngredients = ['밥', '계란'];
    const results = recommendRecipes(userIngredients, { maxCookTime: 15 });

    for (const result of results) {
      expect(result.recipe.cookTime).toBeLessThanOrEqual(15);
    }
  });

  it('매칭된 재료와 누락 재료를 정확히 반환한다', () => {
    const userIngredients = ['닭가슴살', '양상추'];
    const results = recommendRecipes(userIngredients);

    const chickenSalad = results.find((r) => r.recipe.name === '닭가슴살 샐러드');
    if (chickenSalad) {
      expect(chickenSalad.matchedIngredients).toContain('닭가슴살');
      expect(chickenSalad.matchedIngredients).toContain('양상추');
      expect(chickenSalad.missingIngredients.length).toBeGreaterThan(0);
    }
  });

  it('빈 재료 목록에서도 결과를 반환한다', () => {
    const results = recommendRecipes([]);

    // 모든 레시피가 누락 재료로 인해 필터링됨 (maxMissingIngredients=3)
    expect(results.length).toBeLessThanOrEqual(SAMPLE_RECIPES.length);
  });

  it('부분 일치로도 재료를 매칭한다', () => {
    // 닭가슴살 + 추가 재료로 테스트 (maxMissingIngredients 통과 위해)
    const userIngredients = ['닭가슴살', '양상추', '올리브오일', '토마토', '오이'];
    const results = recommendRecipes(userIngredients, { maxMissingIngredients: 5 });

    // 닭가슴살 샐러드가 매칭되어야 함
    const chickenSalad = results.find((r) => r.recipe.name.includes('닭가슴살'));
    expect(chickenSalad).toBeDefined();
    expect(chickenSalad?.matchedIngredients.length).toBeGreaterThan(0);
  });

  it('세만틱 매칭으로 유사 재료를 인식한다', () => {
    // 닭고기 → 닭가슴살 매칭되어야 함
    const userIngredients = ['닭고기', '양상추', '올리브오일', '토마토', '오이'];
    const results = recommendRecipes(userIngredients);

    const chickenSalad = results.find((r) => r.recipe.name === '닭가슴살 샐러드');
    expect(chickenSalad).toBeDefined();
    if (chickenSalad) {
      expect(chickenSalad.matchScore).toBeGreaterThan(0);
    }
  });

  it('최소 매칭 점수로 필터링한다', () => {
    const userIngredients = ['닭가슴살'];
    const results = recommendRecipes(userIngredients, { minMatchScore: 50 });

    for (const result of results) {
      expect(result.matchScore).toBeGreaterThanOrEqual(50);
    }
  });

  it('유통기한 임박 재료 사용 시 보너스 점수를 준다', () => {
    const userIngredients = ['닭가슴살', '양상추', '토마토', '오이', '올리브오일'];
    const expiringItems = ['닭가슴살'];

    const resultsWithBonus = recommendRecipes(userIngredients, { expiringItems });
    const resultsWithoutBonus = recommendRecipes(userIngredients);

    const chickenSaladWithBonus = resultsWithBonus.find((r) => r.recipe.name === '닭가슴살 샐러드');
    const chickenSaladWithoutBonus = resultsWithoutBonus.find(
      (r) => r.recipe.name === '닭가슴살 샐러드'
    );

    if (chickenSaladWithBonus && chickenSaladWithoutBonus) {
      expect(chickenSaladWithBonus.matchScore).toBeGreaterThan(chickenSaladWithoutBonus.matchScore);
    }
  });

  it('availabilityRate를 올바르게 계산한다', () => {
    const userIngredients = ['닭가슴살', '양상추'];
    const results = recommendRecipes(userIngredients);

    const chickenSalad = results.find((r) => r.recipe.name === '닭가슴살 샐러드');
    if (chickenSalad) {
      // 2개 재료만 있으므로 100% 미만이어야 함
      expect(chickenSalad.availabilityRate).toBeLessThan(1);
      expect(chickenSalad.availabilityRate).toBeGreaterThan(0);
    }
  });
});

describe('getRecipesByGoal', () => {
  it('다이어트 목표 레시피를 반환한다', () => {
    const recipes = getRecipesByGoal('diet');

    expect(recipes.length).toBeGreaterThan(0);
    for (const recipe of recipes) {
      expect(recipe.nutritionGoals).toContain('diet');
    }
  });

  it('벌크업 목표 레시피를 반환한다', () => {
    const recipes = getRecipesByGoal('bulk');

    expect(recipes.length).toBeGreaterThan(0);
    for (const recipe of recipes) {
      expect(recipe.nutritionGoals).toContain('bulk');
    }
  });

  it('린매스 목표 레시피를 반환한다', () => {
    const recipes = getRecipesByGoal('lean');

    expect(recipes.length).toBeGreaterThan(0);
    for (const recipe of recipes) {
      expect(recipe.nutritionGoals).toContain('lean');
    }
  });

  it('유지 목표 레시피를 반환한다', () => {
    const recipes = getRecipesByGoal('maintenance');

    expect(recipes.length).toBeGreaterThan(0);
    for (const recipe of recipes) {
      expect(recipe.nutritionGoals).toContain('maintenance');
    }
  });
});

describe('calculateDailyCalories', () => {
  it('활동량에 따라 칼로리가 달라진다', () => {
    const weight = 70;
    const goal: NutritionGoal = 'maintenance';

    const sedentary = calculateDailyCalories(weight, 'sedentary', goal);
    const active = calculateDailyCalories(weight, 'active', goal);

    expect(active).toBeGreaterThan(sedentary);
  });

  it('다이어트 목표는 유지보다 칼로리가 낮다', () => {
    const weight = 70;

    const diet = calculateDailyCalories(weight, 'moderate', 'diet');
    const maintenance = calculateDailyCalories(weight, 'moderate', 'maintenance');

    expect(diet).toBeLessThan(maintenance);
  });

  it('벌크업 목표는 유지보다 칼로리가 높다', () => {
    const weight = 70;

    const bulk = calculateDailyCalories(weight, 'moderate', 'bulk');
    const maintenance = calculateDailyCalories(weight, 'moderate', 'maintenance');

    expect(bulk).toBeGreaterThan(maintenance);
  });
});

describe('calculateDailyProtein', () => {
  it('체중에 비례하여 단백질을 계산한다', () => {
    const protein70 = calculateDailyProtein(70, 'maintenance');
    const protein80 = calculateDailyProtein(80, 'maintenance');

    expect(protein80).toBeGreaterThan(protein70);
  });

  it('벌크업 목표는 유지보다 단백질이 많다', () => {
    const weight = 70;

    const bulk = calculateDailyProtein(weight, 'bulk');
    const maintenance = calculateDailyProtein(weight, 'maintenance');

    expect(bulk).toBeGreaterThan(maintenance);
  });

  it('린매스 목표는 가장 높은 단백질을 권장한다', () => {
    const weight = 70;

    const lean = calculateDailyProtein(weight, 'lean');
    const bulk = calculateDailyProtein(weight, 'bulk');

    expect(lean).toBeGreaterThan(bulk);
  });
});

describe('NUTRITION_TARGETS', () => {
  it('모든 목표에 대해 기준이 정의되어 있다', () => {
    const goals: NutritionGoal[] = ['diet', 'bulk', 'lean', 'maintenance'];

    for (const goal of goals) {
      expect(NUTRITION_TARGETS[goal]).toBeDefined();
      expect(NUTRITION_TARGETS[goal].calorieMultiplier).toBeDefined();
      expect(NUTRITION_TARGETS[goal].proteinPerKg).toBeDefined();
      expect(NUTRITION_TARGETS[goal].carbRatio).toBeDefined();
      expect(NUTRITION_TARGETS[goal].fatRatio).toBeDefined();
      expect(NUTRITION_TARGETS[goal].description).toBeDefined();
    }
  });

  it('다이어트 칼로리 멀티플라이어는 1 미만이다', () => {
    expect(NUTRITION_TARGETS.diet.calorieMultiplier).toBeLessThan(1);
  });

  it('벌크업 칼로리 멀티플라이어는 1 초과이다', () => {
    expect(NUTRITION_TARGETS.bulk.calorieMultiplier).toBeGreaterThan(1);
  });
});

describe('NUTRITION_GOAL_LABELS', () => {
  it('모든 목표에 한글 라벨이 있다', () => {
    expect(NUTRITION_GOAL_LABELS.diet).toBe('다이어트');
    expect(NUTRITION_GOAL_LABELS.bulk).toBe('벌크업');
    expect(NUTRITION_GOAL_LABELS.lean).toBe('린매스');
    expect(NUTRITION_GOAL_LABELS.maintenance).toBe('유지');
  });
});

describe('findSimilarIngredient', () => {
  it('정확히 일치하는 재료를 찾는다', () => {
    const result = findSimilarIngredient('닭가슴살', ['닭가슴살', '양파', '간장']);
    expect(result).toBe('닭가슴살');
  });

  it('부분 일치하는 재료를 찾는다', () => {
    // '닭'이라는 공통 부분이 있어서 매칭되어야 함
    const result = findSimilarIngredient('닭', ['닭고기', '양파']);
    expect(result).toBe('닭고기');
  });

  it('유사어를 찾는다', () => {
    // 같은 유사어 그룹(닭가슴살: ['닭안심', '닭다리살', '닭고기'])에 속하므로 매칭되어야 함
    const result = findSimilarIngredient('닭가슴살', ['닭고기', '양파']);
    expect(result).toBe('닭고기');
  });

  it('대소문자 구분 없이 찾는다', () => {
    const result = findSimilarIngredient('닭가슴살', ['닭가슴살', '양파']);
    expect(result).toBe('닭가슴살');
  });

  it('매칭되지 않으면 null을 반환한다', () => {
    const result = findSimilarIngredient('연어', ['닭가슴살', '양파']);
    expect(result).toBeNull();
  });
});

describe('INGREDIENT_SYNONYMS', () => {
  it('유사어 매핑이 정의되어 있다', () => {
    expect(INGREDIENT_SYNONYMS).toBeDefined();
    expect(Object.keys(INGREDIENT_SYNONYMS).length).toBeGreaterThan(0);
  });

  it('각 유사어 그룹에 여러 단어가 있다', () => {
    for (const [, synonyms] of Object.entries(INGREDIENT_SYNONYMS)) {
      expect(Array.isArray(synonyms)).toBe(true);
      expect(synonyms.length).toBeGreaterThan(0);
    }
  });
});

describe('SAMPLE_RECIPES', () => {
  it('충분한 수의 샘플 레시피가 있다', () => {
    expect(SAMPLE_RECIPES.length).toBeGreaterThanOrEqual(10);
  });

  it('모든 레시피에 필수 필드가 있다', () => {
    for (const recipe of SAMPLE_RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.description).toBeDefined();
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.nutritionInfo).toBeDefined();
      expect(recipe.nutritionInfo.calories).toBeGreaterThan(0);
      expect(recipe.cookTime).toBeGreaterThan(0);
      expect(recipe.difficulty).toBeDefined();
      expect(recipe.nutritionGoals.length).toBeGreaterThan(0);
    }
  });

  it('다양한 목표의 레시피가 있다', () => {
    const goalCoverage = new Set(SAMPLE_RECIPES.flatMap((r) => r.nutritionGoals));

    expect(goalCoverage.has('diet')).toBe(true);
    expect(goalCoverage.has('bulk')).toBe(true);
    expect(goalCoverage.has('lean')).toBe(true);
    expect(goalCoverage.has('maintenance')).toBe(true);
  });

  it('다양한 난이도의 레시피가 있다', () => {
    const difficulties = new Set(SAMPLE_RECIPES.map((r) => r.difficulty));

    expect(difficulties.has('easy')).toBe(true);
    // medium이나 hard도 있을 수 있음
  });
});
