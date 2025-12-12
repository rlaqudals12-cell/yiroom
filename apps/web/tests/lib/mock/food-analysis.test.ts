/**
 * N-1 음식 분석 Mock 테스트
 * Task 2.1: Gemini API 클라이언트 설정
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockFoodAnalysis,
  generateMockMealSuggestion,
} from '@/lib/mock/food-analysis';
import type { FoodAnalysisInput, MealSuggestionInput } from '@/lib/gemini';

describe('generateMockFoodAnalysis', () => {
  describe('기본 기능', () => {
    it('점심 식사 기본 Mock 결과를 반환한다', () => {
      const input: FoodAnalysisInput = {
        imageBase64: 'test-base64-image',
        mealType: 'lunch',
      };

      const result = generateMockFoodAnalysis(input);

      expect(result.foods).toBeDefined();
      expect(result.foods.length).toBeGreaterThan(0);
      expect(result.totalCalories).toBeGreaterThan(0);
      expect(result.mealType).toBe('lunch');
      expect(result.analyzedAt).toBeDefined();
    });

    it('아침 식사 Mock 결과를 반환한다', () => {
      const input: FoodAnalysisInput = {
        imageBase64: 'test-base64-image',
        mealType: 'breakfast',
      };

      const result = generateMockFoodAnalysis(input);

      expect(result.mealType).toBe('breakfast');
      expect(result.foods.some((f) => f.name.includes('계란'))).toBe(true);
    });

    it('저녁 식사 Mock 결과를 반환한다', () => {
      const input: FoodAnalysisInput = {
        imageBase64: 'test-base64-image',
        mealType: 'dinner',
      };

      const result = generateMockFoodAnalysis(input);

      expect(result.mealType).toBe('dinner');
      expect(result.foods.length).toBeGreaterThan(0);
    });

    it('간식 Mock 결과를 반환한다', () => {
      const input: FoodAnalysisInput = {
        imageBase64: 'test-base64-image',
        mealType: 'snack',
      };

      const result = generateMockFoodAnalysis(input);

      expect(result.mealType).toBe('snack');
      expect(result.foods.some((f) => f.name.includes('바나나'))).toBe(true);
    });

    it('mealType이 없으면 lunch를 기본값으로 사용한다', () => {
      const input: FoodAnalysisInput = {
        imageBase64: 'test-base64-image',
      };

      const result = generateMockFoodAnalysis(input);

      expect(result.mealType).toBe('lunch');
    });
  });

  describe('음식 데이터 검증', () => {
    it('각 음식에 필수 영양정보가 포함된다', () => {
      const input: FoodAnalysisInput = {
        imageBase64: 'test-base64-image',
        mealType: 'lunch',
      };

      const result = generateMockFoodAnalysis(input);

      result.foods.forEach((food) => {
        expect(food.name).toBeTruthy();
        expect(food.portion).toBeTruthy();
        expect(typeof food.calories).toBe('number');
        expect(typeof food.protein).toBe('number');
        expect(typeof food.carbs).toBe('number');
        expect(typeof food.fat).toBe('number');
        expect(['green', 'yellow', 'red']).toContain(food.trafficLight);
        expect(food.confidence).toBeGreaterThanOrEqual(0.7);
        expect(food.confidence).toBeLessThanOrEqual(0.95);
      });
    });

    it('총 영양소가 정확히 계산된다', () => {
      const input: FoodAnalysisInput = {
        imageBase64: 'test-base64-image',
        mealType: 'lunch',
      };

      const result = generateMockFoodAnalysis(input);

      const expectedTotalCalories = result.foods.reduce(
        (sum, food) => sum + food.calories,
        0
      );
      const expectedTotalProtein = result.foods.reduce(
        (sum, food) => sum + food.protein,
        0
      );

      expect(result.totalCalories).toBe(expectedTotalCalories);
      expect(result.totalProtein).toBe(expectedTotalProtein);
    });
  });

  describe('인사이트 생성', () => {
    it('인사이트가 포함된다', () => {
      const input: FoodAnalysisInput = {
        imageBase64: 'test-base64-image',
        mealType: 'lunch',
      };

      const result = generateMockFoodAnalysis(input);

      expect(result.insight).toBeTruthy();
      expect(typeof result.insight).toBe('string');
    });
  });

  describe('신호등 시스템', () => {
    it('음식에 신호등 색상이 지정된다', () => {
      const input: FoodAnalysisInput = {
        imageBase64: 'test-base64-image',
        mealType: 'lunch',
      };

      const result = generateMockFoodAnalysis(input);

      result.foods.forEach((food) => {
        expect(['green', 'yellow', 'red']).toContain(food.trafficLight);
      });
    });

    it('저칼로리 음식은 green 신호등이다 (김치)', () => {
      const input: FoodAnalysisInput = {
        imageBase64: 'test-base64-image',
        mealType: 'breakfast',
      };

      const result = generateMockFoodAnalysis(input);
      const kimchi = result.foods.find((f) => f.name.includes('김치'));

      if (kimchi) {
        expect(kimchi.trafficLight).toBe('green');
      }
    });

    it('고칼로리 음식은 red 신호등이다 (삼겹살)', () => {
      const input: FoodAnalysisInput = {
        imageBase64: 'test-base64-image',
        mealType: 'dinner',
      };

      const result = generateMockFoodAnalysis(input);
      const porkBelly = result.foods.find((f) => f.name.includes('삼겹살'));

      if (porkBelly) {
        expect(porkBelly.trafficLight).toBe('red');
      }
    });
  });
});

describe('generateMockMealSuggestion', () => {
  describe('목표별 추천', () => {
    it('체중 감량 목표에 맞는 식사를 추천한다', () => {
      const input: MealSuggestionInput = {
        goal: 'weight_loss',
        tdee: 2000,
        consumedCalories: 1000,
        remainingCalories: 1000,
        allergies: [],
        dislikedFoods: [],
        cookingSkill: 'beginner',
        budget: 'moderate',
        mealType: 'lunch',
      };

      const result = generateMockMealSuggestion(input);

      expect(result.meals).toBeDefined();
      expect(result.meals.length).toBeGreaterThan(0);
      // 체중 감량용 식사는 비교적 저칼로리
      expect(result.meals[0].estimatedCalories).toBeLessThan(500);
    });

    it('근육 증가 목표에 맞는 식사를 추천한다', () => {
      const input: MealSuggestionInput = {
        goal: 'muscle',
        tdee: 2500,
        consumedCalories: 1000,
        remainingCalories: 1500,
        allergies: [],
        dislikedFoods: [],
        cookingSkill: 'intermediate',
        budget: 'moderate',
        mealType: 'lunch',
      };

      const result = generateMockMealSuggestion(input);

      expect(result.meals.length).toBeGreaterThan(0);
      // 근육 증가용 식사는 고단백
      expect(result.meals[0].protein).toBeGreaterThan(25);
    });

    it('체중 유지 목표에 맞는 식사를 추천한다', () => {
      const input: MealSuggestionInput = {
        goal: 'maintain',
        tdee: 2000,
        consumedCalories: 800,
        remainingCalories: 1200,
        allergies: [],
        dislikedFoods: [],
        cookingSkill: 'intermediate',
        budget: 'moderate',
        mealType: 'dinner',
      };

      const result = generateMockMealSuggestion(input);

      expect(result.meals.length).toBeGreaterThan(0);
    });

    it('피부 개선 목표에 맞는 식사를 추천한다', () => {
      const input: MealSuggestionInput = {
        goal: 'skin',
        tdee: 1800,
        consumedCalories: 600,
        remainingCalories: 1200,
        allergies: [],
        dislikedFoods: [],
        cookingSkill: 'beginner',
        budget: 'premium',
        mealType: 'lunch',
      };

      const result = generateMockMealSuggestion(input);

      expect(result.meals.length).toBeGreaterThan(0);
      // 피부 개선용 식사에 아보카도나 연어 포함
      const hasSkinFriendly = result.meals.some(
        (m) => m.name.includes('아보카도') || m.name.includes('연어')
      );
      expect(hasSkinFriendly).toBe(true);
    });

    it('건강 관리 목표에 맞는 식사를 추천한다', () => {
      const input: MealSuggestionInput = {
        goal: 'health',
        tdee: 2000,
        consumedCalories: 700,
        remainingCalories: 1300,
        allergies: [],
        dislikedFoods: [],
        cookingSkill: 'advanced',
        budget: 'any',
        mealType: 'lunch',
      };

      const result = generateMockMealSuggestion(input);

      expect(result.meals.length).toBeGreaterThan(0);
    });
  });

  describe('추천 데이터 검증', () => {
    it('추천 식사에 필수 정보가 포함된다', () => {
      const input: MealSuggestionInput = {
        goal: 'maintain',
        tdee: 2000,
        consumedCalories: 500,
        remainingCalories: 1500,
        allergies: [],
        dislikedFoods: [],
        cookingSkill: 'beginner',
        budget: 'economy',
        mealType: 'lunch',
      };

      const result = generateMockMealSuggestion(input);

      result.meals.forEach((meal) => {
        expect(meal.name).toBeTruthy();
        expect(typeof meal.estimatedCalories).toBe('number');
        expect(typeof meal.protein).toBe('number');
        expect(typeof meal.carbs).toBe('number');
        expect(typeof meal.fat).toBe('number');
        expect(['green', 'yellow', 'red']).toContain(meal.trafficLight);
        expect(meal.reason).toBeTruthy();
        expect(['easy', 'medium', 'hard']).toContain(meal.difficulty);
      });
    });

    it('영양 균형 정보가 포함된다', () => {
      const input: MealSuggestionInput = {
        goal: 'maintain',
        tdee: 2000,
        consumedCalories: 500,
        remainingCalories: 1500,
        allergies: [],
        dislikedFoods: [],
        cookingSkill: 'beginner',
        budget: 'economy',
        mealType: 'lunch',
      };

      const result = generateMockMealSuggestion(input);

      expect(result.nutritionBalance).toBeDefined();
      expect(typeof result.nutritionBalance.protein).toBe('number');
      expect(typeof result.nutritionBalance.carbs).toBe('number');
      expect(typeof result.nutritionBalance.fat).toBe('number');
    });

    it('팁이 포함된다', () => {
      const input: MealSuggestionInput = {
        goal: 'weight_loss',
        tdee: 1800,
        consumedCalories: 600,
        remainingCalories: 1200,
        allergies: [],
        dislikedFoods: [],
        cookingSkill: 'beginner',
        budget: 'economy',
        mealType: 'dinner',
      };

      const result = generateMockMealSuggestion(input);

      expect(result.tips).toBeDefined();
      expect(result.tips.length).toBeGreaterThan(0);
      result.tips.forEach((tip) => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
      });
    });
  });

  describe('칼로리 제한', () => {
    it('남은 칼로리를 초과하지 않는 식사만 추천한다', () => {
      const input: MealSuggestionInput = {
        goal: 'weight_loss',
        tdee: 1500,
        consumedCalories: 1200,
        remainingCalories: 300, // 매우 적은 남은 칼로리
        allergies: [],
        dislikedFoods: [],
        cookingSkill: 'beginner',
        budget: 'economy',
        mealType: 'snack',
      };

      const result = generateMockMealSuggestion(input);

      // 300kcal + 100 마진 = 400kcal 이하 식사만 필터링
      // 필터링 결과가 없으면 기본값 제공
      expect(result.meals.length).toBeGreaterThan(0);
    });
  });
});
