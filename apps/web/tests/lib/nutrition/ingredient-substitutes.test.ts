/**
 * 대체 재료 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateRecipeVariations,
  getSubstitutesForIngredient,
  INGREDIENT_SUBSTITUTES,
} from '@/lib/nutrition/ingredient-substitutes';
import { Recipe } from '@/lib/nutrition/recipe-matcher';

describe('ingredient-substitutes', () => {
  // 찜닭 레시피 (예시)
  const 찜닭_레시피: Recipe = {
    id: 'recipe-jjimdak',
    name: '찜닭',
    description: '간장 양념에 조린 닭볶음탕',
    ingredients: [
      { name: '닭고기', quantity: '500', unit: 'g', category: 'meat' },
      { name: '감자', quantity: '200', unit: 'g', category: 'vegetable' },
      { name: '당근', quantity: '100', unit: 'g', category: 'vegetable' },
      { name: '간장', quantity: '4', unit: '큰술', category: 'seasoning' },
      { name: '설탕', quantity: '2', unit: '큰술', category: 'seasoning' },
      { name: '물엿', quantity: '1', unit: '큰술', category: 'seasoning' },
      { name: '식용유', quantity: '1', unit: '큰술', category: 'seasoning' },
    ],
    steps: [
      '닭고기를 한입 크기로 자릅니다.',
      '감자와 당근을 썰어 준비합니다.',
      '양념을 섞어 조립니다.',
      '간장 양념에 조려냅니다.',
    ],
    nutritionInfo: { calories: 650, protein: 45, carbs: 55, fat: 20 },
    cookTime: 40,
    difficulty: 'medium',
    nutritionGoals: ['bulk', 'maintenance'],
    tags: ['한식', '찜닭'],
  };

  describe('INGREDIENT_SUBSTITUTES', () => {
    it('당류 대체 재료가 정의되어 있어야 함', () => {
      expect(INGREDIENT_SUBSTITUTES['설탕']).toBeDefined();
      expect(INGREDIENT_SUBSTITUTES['설탕'].length).toBeGreaterThan(0);
      expect(INGREDIENT_SUBSTITUTES['물엿']).toBeDefined();
    });

    it('밀가루/탄수화물 대체 재료가 정의되어 있어야 함', () => {
      expect(INGREDIENT_SUBSTITUTES['밀가루']).toBeDefined();
      expect(INGREDIENT_SUBSTITUTES['쌀']).toBeDefined();
      expect(INGREDIENT_SUBSTITUTES['밥']).toBeDefined();
    });

    it('오일 대체 재료가 정의되어 있어야 함', () => {
      expect(INGREDIENT_SUBSTITUTES['식용유']).toBeDefined();
      expect(INGREDIENT_SUBSTITUTES['식용유'].length).toBeGreaterThan(0);
    });

    it('각 대체 재료는 필수 필드를 가져야 함', () => {
      const 설탕_대체 = INGREDIENT_SUBSTITUTES['설탕'][0];
      expect(설탕_대체.name).toBeDefined();
      expect(설탕_대체.ratio).toBeGreaterThan(0);
      expect(설탕_대체.benefit).toBeDefined();
      expect(설탕_대체.goal).toBeDefined();
    });
  });

  describe('generateRecipeVariations', () => {
    it('레시피에 대한 변형을 생성해야 함', () => {
      const variations = generateRecipeVariations(찜닭_레시피);
      expect(variations.length).toBeGreaterThan(0);
    });

    it('다이어트 변형은 칼로리 감소를 반영해야 함', () => {
      const variations = generateRecipeVariations(찜닭_레시피, 'diet');
      expect(variations.length).toBeGreaterThan(0);

      const dietVariation = variations[0];
      expect(dietVariation.type).toBe('diet');
      expect(dietVariation.name).toContain('다이어트');
      expect(dietVariation.nutritionChange.caloriesReduction).toBeGreaterThan(0);
    });

    it('대체 재료 목록을 포함해야 함', () => {
      const variations = generateRecipeVariations(찜닭_레시피, 'diet');
      const dietVariation = variations[0];

      expect(dietVariation.substitutions.length).toBeGreaterThan(0);
      expect(dietVariation.substitutions[0]).toHaveProperty('original');
      expect(dietVariation.substitutions[0]).toHaveProperty('substitute');
      expect(dietVariation.substitutions[0]).toHaveProperty('benefit');
    });

    it('찜닭 레시피 다이어트 변형 - 실제 예시', () => {
      const variations = generateRecipeVariations(찜닭_레시피, 'diet');
      const dietVariation = variations[0];

      // 설탕 → 알룰로스/스테비아/에리스리톨
      const 설탕_대체 = dietVariation.substitutions.find((s) => s.original === '설탕');
      expect(설탕_대체).toBeDefined();
      expect(['알룰로스', '스테비아', '에리스리톨']).toContain(설탕_대체!.substitute);

      // 물엿 → 올리고당
      const 물엿_대체 = dietVariation.substitutions.find((s) => s.original === '물엿');
      expect(물엿_대체).toBeDefined();
      expect(물엿_대체!.substitute).toBe('올리고당');

      // 감자 제거 옵션
      const 감자_대체 = dietVariation.substitutions.find((s) => s.original === '감자');
      if (감자_대체) {
        expect(['제거', '고구마']).toContain(감자_대체.substitute);
      }
    });

    it('변형이 없으면 빈 배열 반환', () => {
      const 단순_레시피: Recipe = {
        id: 'recipe-simple',
        name: '물',
        description: '물',
        ingredients: [{ name: '물', quantity: '200', unit: 'ml', category: 'seasoning' }],
        steps: ['물을 따릅니다.'],
        nutritionInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        cookTime: 1,
        difficulty: 'easy',
        nutritionGoals: ['diet'],
        tags: [],
      };

      const variations = generateRecipeVariations(단순_레시피);
      expect(variations.length).toBe(0);
    });
  });

  describe('getSubstitutesForIngredient', () => {
    it('재료에 대한 대체 재료를 반환해야 함', () => {
      const substitutes = getSubstitutesForIngredient('설탕');
      expect(substitutes.length).toBeGreaterThan(0);
    });

    it('목표에 맞는 대체 재료만 반환해야 함', () => {
      const dietSubstitutes = getSubstitutesForIngredient('설탕', 'diet');
      expect(dietSubstitutes.every((s) => s.goal === 'diet')).toBe(true);
    });

    it('존재하지 않는 재료는 빈 배열 반환', () => {
      const substitutes = getSubstitutesForIngredient('존재하지않는재료');
      expect(substitutes.length).toBe(0);
    });

    it('정규화된 이름으로 검색 가능해야 함', () => {
      // '밥'과 '쌀밥'은 동일하게 처리
      const 밥_대체 = getSubstitutesForIngredient('밥');
      const 쌀밥_대체 = getSubstitutesForIngredient('쌀밥');

      expect(밥_대체.length).toBeGreaterThan(0);
      expect(밥_대체).toEqual(쌀밥_대체);
    });
  });

  describe('실전 레시피 변형 시나리오', () => {
    it('계란 볶음밥 → 다이어트 버전', () => {
      const 볶음밥: Recipe = {
        id: 'recipe-bokkeumbap',
        name: '계란 볶음밥',
        description: '간단한 볶음밥',
        ingredients: [
          { name: '밥', quantity: '200', unit: 'g', category: 'grain' },
          { name: '계란', quantity: '2', unit: '개', category: 'dairy' },
          { name: '식용유', quantity: '1', unit: '큰술', category: 'seasoning' },
        ],
        steps: [],
        nutritionInfo: { calories: 450, protein: 15, carbs: 55, fat: 18 },
        cookTime: 15,
        difficulty: 'easy',
        nutritionGoals: ['maintenance'],
        tags: ['볶음밥'],
      };

      const variations = generateRecipeVariations(볶음밥, 'diet');
      expect(variations.length).toBeGreaterThan(0);

      const dietVariation = variations[0];

      // 밥 → 곤약밥 또는 콜리플라워 라이스
      const 밥_대체 = dietVariation.substitutions.find((s) => s.original === '밥');
      expect(밥_대체).toBeDefined();

      // 식용유 → 스프레이 오일
      const 기름_대체 = dietVariation.substitutions.find((s) => s.original === '식용유');
      expect(기름_대체).toBeDefined();
    });

    it('닭가슴살 파스타 → 다이어트 버전', () => {
      const 파스타: Recipe = {
        id: 'recipe-pasta',
        name: '닭가슴살 파스타',
        description: '고단백 파스타',
        ingredients: [
          { name: '파스타', quantity: '100', unit: 'g', category: 'grain' },
          { name: '닭가슴살', quantity: '150', unit: 'g', category: 'meat' },
        ],
        steps: [],
        nutritionInfo: { calories: 520, protein: 40, carbs: 55, fat: 15 },
        cookTime: 25,
        difficulty: 'medium',
        nutritionGoals: ['bulk'],
        tags: ['파스타'],
      };

      const variations = generateRecipeVariations(파스타, 'diet');
      expect(variations.length).toBeGreaterThan(0);

      const dietVariation = variations[0];

      // 파스타 → 곤약면 또는 통밀 파스타
      const 파스타_대체 = dietVariation.substitutions.find((s) => s.original === '파스타');
      expect(파스타_대체).toBeDefined();
    });
  });
});
