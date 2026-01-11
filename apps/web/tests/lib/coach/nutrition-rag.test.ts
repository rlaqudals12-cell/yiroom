/**
 * 영양/레시피 전용 RAG 테스트
 * @description Phase K - 냉장고 인벤토리 기반 레시피 추천 RAG 시스템 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase 모킹
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: '1',
                  name: '닭가슴살',
                  metadata: { quantity: 2, unit: '팩' },
                  expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 후
                },
                {
                  id: '2',
                  name: '양상추',
                  metadata: { quantity: 1, unit: '개' },
                  expiry_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10일 후
                },
                {
                  id: '3',
                  name: '토마토',
                  metadata: { quantity: 3, unit: '개' },
                  expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 후
                },
              ],
              error: null,
            }),
          })),
        })),
      })),
    })),
  })),
}));

// 로거 모킹
vi.mock('@/lib/utils/logger', () => ({
  coachLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// 모듈 임포트는 모킹 후에
import { searchNutritionItems, formatNutritionForPrompt } from '@/lib/coach/nutrition-rag';
import type { UserContext } from '@/lib/coach/types';

describe('Nutrition RAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchNutritionItems', () => {
    it('사용자 컨텍스트 없이 기본 검색한다', async () => {
      const result = await searchNutritionItems(null, '오늘 뭐 먹을까?');

      expect(result).toBeDefined();
      expect(result.goalTips.length).toBeGreaterThan(0);
    });

    it('다이어트 관련 질문에 다이어트 팁을 제공한다', async () => {
      const result = await searchNutritionItems(null, '다이어트 식단 추천해줘');

      expect(result).toBeDefined();
      expect(result.goalTips).toBeDefined();
      // 다이어트 관련 팁이 포함되어야 함
      const hasDietTip = result.goalTips.some(
        (tip) => tip.includes('저칼로리') || tip.includes('단백질')
      );
      expect(hasDietTip).toBe(true);
    });

    it('벌크업 관련 질문에 벌크업 팁을 제공한다', async () => {
      const result = await searchNutritionItems(null, '벌크업 식단 어떻게 해?');

      expect(result).toBeDefined();
      const hasBulkTip = result.goalTips.some(
        (tip) => tip.includes('칼로리') || tip.includes('TDEE')
      );
      expect(hasBulkTip).toBe(true);
    });

    it('레시피 관련 질문에 레시피를 추천한다', async () => {
      const result = await searchNutritionItems(null, '오늘 저녁 레시피 추천해줘');

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('단백질 관련 질문에 단백질 팁을 제공한다', async () => {
      const result = await searchNutritionItems(null, '단백질 보충 방법 알려줘');

      expect(result).toBeDefined();
      const hasProteinTip = result.goalTips.some(
        (tip) => tip.includes('단백질') || tip.includes('닭가슴살')
      );
      expect(hasProteinTip).toBe(true);
    });

    it('간식 관련 질문에 간식 팁을 제공한다', async () => {
      const result = await searchNutritionItems(null, '건강한 간식 추천해줘');

      expect(result).toBeDefined();
      const hasSnackTip = result.goalTips.some(
        (tip) => tip.includes('견과류') || tip.includes('요거트')
      );
      expect(hasSnackTip).toBe(true);
    });

    it('userId가 있으면 냉장고에서 검색한다', async () => {
      const result = await searchNutritionItems(null, '냉장고 재료로 요리', 'user-123');

      expect(result).toBeDefined();
      expect(result.hasPantryItems).toBe(true);
      expect(result.pantryItems.length).toBeGreaterThan(0);
    });

    it('유통기한 임박 재료를 감지한다', async () => {
      const result = await searchNutritionItems(null, '냉장고 정리', 'user-123');

      expect(result).toBeDefined();
      // 3일 후, 5일 후 만료되는 재료가 있으므로 expiringItems에 포함
      expect(result.expiringItems.length).toBeGreaterThan(0);
    });

    it('냉장고 재료 기반으로 레시피 매칭을 한다', async () => {
      const result = await searchNutritionItems(null, '레시피 추천', 'user-123');

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      // 닭가슴살 샐러드가 높은 매칭률을 가져야 함 (닭가슴살, 양상추, 토마토 보유)
      const chickenSalad = result.recommendations.find((r) => r.name.includes('샐러드'));
      if (chickenSalad) {
        expect(chickenSalad.matchScore).toBeGreaterThan(50);
      }
    });

    it('영양 목표가 컨텍스트에 있으면 활용한다', async () => {
      const userContext: UserContext = {
        nutrition: { goal: 'diet' },
      };

      const result = await searchNutritionItems(userContext, '오늘 뭐 먹지?', 'user-123');

      expect(result).toBeDefined();
      // 다이어트 목표에 맞는 레시피 필터링
      if (result.recommendations.length > 0) {
        const allLowCalorie = result.recommendations.every((r) => r.calories < 700);
        expect(allLowCalorie).toBe(true);
      }
    });
  });

  describe('formatNutritionForPrompt', () => {
    it('추천이 없으면 팁만 반환한다', () => {
      const result = formatNutritionForPrompt({
        hasPantryItems: false,
        pantryItems: [],
        recommendations: [],
        goalTips: ['균형 잡힌 식단을 유지하세요!'],
        expiringItems: [],
      });

      expect(result).toContain('영양 팁');
      expect(result).toContain('균형 잡힌 식단을 유지하세요!');
    });

    it('레시피 추천을 포맷한다', () => {
      const result = formatNutritionForPrompt({
        hasPantryItems: true,
        pantryItems: [],
        recommendations: [
          {
            id: '1',
            name: '닭가슴살 샐러드',
            description: '고단백 저칼로리 다이어트 샐러드',
            calories: 350,
            protein: 35,
            carbs: 15,
            fat: 12,
            cookTime: 15,
            difficulty: 'easy',
            matchScore: 80,
            matchedIngredients: ['닭가슴살', '양상추', '토마토'],
            missingIngredients: ['오이', '드레싱'],
            matchReason: '냉장고 재료 3개로 바로 만들 수 있어요',
          },
        ],
        goalTips: ['고단백 저칼로리 식단을 유지하세요'],
        expiringItems: [],
      });

      expect(result).toContain('레시피 추천');
      expect(result).toContain('닭가슴살 샐러드');
      expect(result).toContain('350kcal');
      expect(result).toContain('35g');
      expect(result).toContain('80%');
      expect(result).toContain('있는 재료');
      expect(result).toContain('필요한 재료');
    });

    it('유통기한 임박 재료를 포맷한다', () => {
      const result = formatNutritionForPrompt({
        hasPantryItems: true,
        pantryItems: [],
        recommendations: [
          {
            id: '1',
            name: '테스트 레시피',
            description: '테스트',
            calories: 300,
            protein: 20,
            carbs: 30,
            fat: 10,
            cookTime: 10,
            difficulty: 'easy',
            matchScore: 70,
            matchedIngredients: [],
            missingIngredients: [],
            matchReason: '',
          },
        ],
        goalTips: [],
        expiringItems: [
          {
            id: '1',
            name: '닭가슴살',
            quantity: 2,
            unit: '팩',
            expiryDate: '2026-01-15',
          },
        ],
      });

      expect(result).toContain('유통기한 임박');
      expect(result).toContain('닭가슴살');
      expect(result).toContain('2026-01-15까지');
    });

    it('여러 레시피를 포맷한다', () => {
      const result = formatNutritionForPrompt({
        hasPantryItems: true,
        pantryItems: [],
        recommendations: [
          {
            id: '1',
            name: '레시피1',
            description: '설명1',
            calories: 300,
            protein: 25,
            carbs: 30,
            fat: 10,
            cookTime: 15,
            difficulty: 'easy',
            matchScore: 90,
            matchedIngredients: ['재료1'],
            missingIngredients: [],
            matchReason: '완벽 매칭',
          },
          {
            id: '2',
            name: '레시피2',
            description: '설명2',
            calories: 450,
            protein: 30,
            carbs: 40,
            fat: 15,
            cookTime: 25,
            difficulty: 'medium',
            matchScore: 60,
            matchedIngredients: [],
            missingIngredients: ['재료A'],
            matchReason: '일부 재료 필요',
          },
        ],
        goalTips: ['팁1'],
        expiringItems: [],
      });

      expect(result).toContain('1. 레시피1');
      expect(result).toContain('2. 레시피2');
      expect(result).toContain('90%');
      expect(result).toContain('60%');
    });

    it('빈 결과면 빈 문자열을 반환한다', () => {
      const result = formatNutritionForPrompt({
        hasPantryItems: false,
        pantryItems: [],
        recommendations: [],
        goalTips: [],
        expiringItems: [],
      });

      expect(result).toBe('');
    });
  });
});
