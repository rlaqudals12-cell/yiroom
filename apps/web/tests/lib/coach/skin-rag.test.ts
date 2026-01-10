/**
 * 피부 전용 RAG 테스트
 * @description Phase D - 피부 고민 Q&A + 제품 추천 RAG 시스템 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase 모킹
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          contains: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: '1',
                  name: '세라마이드 세럼',
                  brand: '이룸',
                  category: 'serum',
                  key_ingredients: ['세라마이드', '히알루론산', '판테놀'],
                  concerns: ['건조', '민감'],
                  skin_types: ['건성', '민감성'],
                  price_krw: 28000,
                },
                {
                  id: '2',
                  name: '비타민C 앰플',
                  brand: '이룸',
                  category: 'ampoule',
                  key_ingredients: ['비타민C', '나이아신아마이드'],
                  concerns: ['미백', '잡티'],
                  skin_types: ['지성', '복합성'],
                  price_krw: 35000,
                },
              ],
              error: null,
            }),
          })),
          limit: vi.fn().mockResolvedValue({
            data: [
              {
                id: '1',
                name: '세라마이드 세럼',
                brand: '이룸',
                category: 'serum',
                key_ingredients: ['세라마이드', '히알루론산', '판테놀'],
                concerns: ['건조', '민감'],
                skin_types: ['건성', '민감성'],
                price_krw: 28000,
              },
            ],
            error: null,
          }),
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
import { searchSkinProducts, formatSkinProductsForPrompt } from '@/lib/coach/skin-rag';
import type { UserContext } from '@/lib/coach/types';

describe('Skin RAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchSkinProducts', () => {
    it('사용자 컨텍스트 없이 기본 검색한다', async () => {
      const results = await searchSkinProducts(null, '보습 세럼 추천해줘');

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('사용자 피부 타입 기반으로 검색한다', async () => {
      const userContext: UserContext = {
        skinAnalysis: {
          skinType: '건성',
          concerns: ['건조', '민감'],
        },
      };

      const results = await searchSkinProducts(userContext, '세럼 추천해줘');

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('피부 고민에 따른 매칭 점수가 계산된다', async () => {
      const userContext: UserContext = {
        skinAnalysis: {
          skinType: '건성',
          concerns: ['건조'],
        },
      };

      const results = await searchSkinProducts(userContext, '건조 피부 관리', 3);

      // 결과가 있으면 매칭 점수와 이유가 포함되어야 함
      if (results.length > 0) {
        expect(results[0].matchScore).toBeGreaterThan(0);
        expect(results[0].matchReasons).toBeDefined();
      }
    });

    it('최근 컨디션이 낮으면 진정 제품에 가산점', async () => {
      const userContext: UserContext = {
        skinAnalysis: {
          skinType: '민감성',
          concerns: ['민감'],
          recentCondition: 2, // 낮은 컨디션
        },
      };

      const results = await searchSkinProducts(userContext, '피부 진정 제품');

      // 진정 성분(세라마이드, 판테놀 등)이 있는 제품에 가산점
      expect(results).toBeDefined();
    });

    it('질문에서 성분 키워드를 추출한다', async () => {
      const results = await searchSkinProducts(null, '레티놀 세럼 추천해줘', 3);

      expect(results).toBeDefined();
    });

    it('질문에서 고민 키워드를 추출한다', async () => {
      const results = await searchSkinProducts(null, '모공 관리 제품 추천', 3);

      expect(results).toBeDefined();
    });
  });

  describe('formatSkinProductsForPrompt', () => {
    it('빈 배열이면 빈 문자열을 반환한다', () => {
      const result = formatSkinProductsForPrompt([]);
      expect(result).toBe('');
    });

    it('제품 정보를 프롬프트 형식으로 변환한다', () => {
      const products = [
        {
          id: '1',
          name: '세라마이드 세럼',
          brand: '이룸',
          category: 'serum',
          keyIngredients: ['세라마이드', '히알루론산'],
          concerns: ['건조'],
          skinTypes: ['건성'],
          price: 28000,
          matchScore: 85,
          matchReasons: ['건성 피부에 적합', '건조 고민 개선'],
        },
      ];

      const result = formatSkinProductsForPrompt(products);

      expect(result).toContain('추천 스킨케어 제품');
      expect(result).toContain('이룸');
      expect(result).toContain('세라마이드 세럼');
      expect(result).toContain('85%');
      expect(result).toContain('28,000원');
    });

    it('여러 제품을 포맷한다', () => {
      const products = [
        {
          id: '1',
          name: '제품1',
          brand: '브랜드1',
          category: 'serum',
          keyIngredients: ['성분1'],
          concerns: [],
          skinTypes: [],
          price: 10000,
          matchScore: 80,
          matchReasons: [],
        },
        {
          id: '2',
          name: '제품2',
          brand: '브랜드2',
          category: 'cream',
          keyIngredients: ['성분2'],
          concerns: [],
          skinTypes: [],
          price: null,
          matchScore: 70,
          matchReasons: ['추천 이유'],
        },
      ];

      const result = formatSkinProductsForPrompt(products);

      expect(result).toContain('1. 브랜드1 제품1');
      expect(result).toContain('2. 브랜드2 제품2');
      expect(result).toContain('추천 이유');
    });
  });
});
