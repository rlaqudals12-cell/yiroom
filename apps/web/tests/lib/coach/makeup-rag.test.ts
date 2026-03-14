/**
 * 메이크업 전용 RAG 테스트
 * @description 메이크업 추천 Q&A + 제품 추천 RAG 시스템 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// 기본 목 데이터
const mockMakeupProducts = [
  {
    id: 'm1',
    name: '벨벳 립스틱',
    brand: '이룸뷰티',
    category: 'makeup',
    key_ingredients: ['비타민E', '호호바오일', '시어버터'],
    concerns: ['웜톤', '립', '데일리'],
    skin_types: ['모든 피부'],
    price_krw: 22000,
  },
  {
    id: 'm2',
    name: '글로우 쿠션',
    brand: '이룸뷰티',
    category: 'makeup',
    key_ingredients: ['나이아신아마이드', '히알루론산'],
    concerns: ['쿨톤', '파운데이션', 'spring'],
    skin_types: ['건성', '복합성'],
    price_krw: 35000,
  },
  {
    id: 'm3',
    name: '시머 아이섀도 팔레트',
    brand: '코랄뷰티',
    category: 'makeup',
    key_ingredients: ['마이카', '실리카'],
    concerns: ['아이', '파티', '웜톤'],
    skin_types: ['모든 피부'],
    price_krw: null,
  },
];

// 목 응답을 동적으로 제어하기 위한 변수
let mockDbResponse: { data: typeof mockMakeupProducts | null; error: unknown } = {
  data: mockMakeupProducts,
  error: null,
};

// Supabase 모킹 — makeup-rag는 .eq()를 2번 호출: .eq('is_active', true).eq('category', 'makeup')
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        // 첫 번째 .eq('is_active', true)
        eq: vi.fn(() => ({
          // 두 번째 .eq('category', 'makeup')
          eq: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve(mockDbResponse)),
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
import {
  searchMakeupProducts,
  formatMakeupProductsForPrompt,
  type MakeupProductMatch,
} from '@/lib/coach/makeup-rag';
import type { UserContext } from '@/lib/coach/types';

describe('Makeup RAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResponse = { data: mockMakeupProducts, error: null };
  });

  describe('searchMakeupProducts', () => {
    it('null userContext로 기본 검색한다', async () => {
      const results = await searchMakeupProducts(null, '메이크업 추천해줘');

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('기본 점수가 50이다 (makeup 카테고리 필터)', async () => {
      const results = await searchMakeupProducts(null, '아무 질문');

      // 키워드/언더톤/시즌 매칭 없이 기본 점수만
      results.forEach((r) => {
        expect(r.matchScore).toBeGreaterThanOrEqual(50);
      });
    });

    it('언더톤 기반으로 매칭 점수가 높아진다', async () => {
      const userContext: UserContext = {
        makeupAnalysis: {
          undertone: '웜톤',
          faceShape: '타원형',
          overallScore: 80,
        },
      };

      const results = await searchMakeupProducts(userContext, '메이크업 추천');

      // 웜톤이 concerns에 포함된 제품은 +20점
      const warmToneProduct = results.find((r) => r.id === 'm1');
      expect(warmToneProduct).toBeDefined();
      if (warmToneProduct) {
        expect(warmToneProduct.matchScore).toBeGreaterThanOrEqual(70); // 50 + 20
        expect(warmToneProduct.matchReasons).toContain('웜톤 언더톤에 적합');
      }
    });

    it('퍼스널 컬러 시즌 매칭 시 가산점이 부여된다', async () => {
      const userContext: UserContext = {
        personalColor: {
          season: 'spring',
        },
      };

      const results = await searchMakeupProducts(userContext, '메이크업 추천');

      // spring이 concerns에 포함된 제품(m2)은 +15점
      const springProduct = results.find((r) => r.id === 'm2');
      expect(springProduct).toBeDefined();
      if (springProduct) {
        expect(springProduct.matchScore).toBeGreaterThanOrEqual(65); // 50 + 15
        expect(springProduct.matchReasons).toContain('spring 시즌 컬러 맞춤');
      }
    });

    it('질문 키워드 매칭 시 가산점이 부여된다', async () => {
      const results = await searchMakeupProducts(null, '립스틱 추천해줘');

      // '립스틱' 키워드 → '립' concerns와 매칭
      const lipProduct = results.find((r) => r.id === 'm1');
      expect(lipProduct).toBeDefined();
      if (lipProduct) {
        expect(lipProduct.matchScore).toBeGreaterThanOrEqual(60); // 50 + 10(키워드)
      }
    });

    it('메이크업 타입 매칭 시 추가 가산점이 부여된다', async () => {
      const results = await searchMakeupProducts(null, '아이섀도 추천해줘');

      // '아이' 타입 매칭 → concerns에 '아이' 포함된 제품(m3)에 +5점
      const eyeProduct = results.find((r) => r.id === 'm3');
      expect(eyeProduct).toBeDefined();
      if (eyeProduct) {
        // 키워드(+10) + 타입(+5) = 최소 65
        expect(eyeProduct.matchScore).toBeGreaterThanOrEqual(65);
        expect(eyeProduct.matchReasons).toContain('메이크업 타입 일치');
      }
    });

    it('결과가 matchScore 내림차순으로 정렬된다', async () => {
      const userContext: UserContext = {
        makeupAnalysis: {
          undertone: '웜톤',
          faceShape: '타원형',
          overallScore: 80,
        },
      };

      const results = await searchMakeupProducts(userContext, '립스틱 추천');

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].matchScore).toBeGreaterThanOrEqual(results[i].matchScore);
      }
    });

    it('limit 파라미터에 따라 결과 수가 제한된다', async () => {
      const results = await searchMakeupProducts(null, '메이크업', 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('DB 에러 시 빈 배열을 반환한다', async () => {
      mockDbResponse = { data: null, error: { message: 'DB connection failed' } };

      const results = await searchMakeupProducts(null, '메이크업 추천');

      expect(results).toEqual([]);
    });

    it('DB 결과가 빈 배열이면 빈 배열을 반환한다', async () => {
      mockDbResponse = { data: [], error: null };

      const results = await searchMakeupProducts(null, '메이크업 추천');

      expect(results).toEqual([]);
    });

    it('DB 결과가 null이면 빈 배열을 반환한다', async () => {
      mockDbResponse = { data: null, error: null };

      const results = await searchMakeupProducts(null, '메이크업 추천');

      expect(results).toEqual([]);
    });

    it('다양한 메이크업 키워드를 추출한다', async () => {
      // 여러 키워드가 포함된 질문
      const results = await searchMakeupProducts(null, '웜톤 데일리 립스틱 추천');

      expect(results).toBeDefined();
      // 웜톤, 데일리, 립스틱 키워드가 모두 매칭 가능
      const topProduct = results[0];
      if (topProduct) {
        expect(topProduct.matchScore).toBeGreaterThan(50);
      }
    });

    it('점수가 100을 초과하지 않는다', async () => {
      // 모든 보너스가 적용되는 시나리오
      const userContext: UserContext = {
        makeupAnalysis: {
          undertone: '웜톤',
          faceShape: '타원형',
          overallScore: 80,
        },
        personalColor: {
          season: 'spring',
        },
      };

      // 웜톤 + spring + 키워드 + 타입 = 50+20+15+10+5 = 100 (cap)
      mockDbResponse = {
        data: [
          {
            id: 'max',
            name: '올인원 립',
            brand: '테스트',
            category: 'makeup',
            key_ingredients: ['립스틱'],
            concerns: ['웜톤', 'spring', '립', '데일리'],
            skin_types: ['모든 피부'],
            price_krw: 10000,
          },
        ],
        error: null,
      };

      const results = await searchMakeupProducts(userContext, '립스틱 추천');

      results.forEach((r) => {
        expect(r.matchScore).toBeLessThanOrEqual(100);
      });
    });

    it('언더톤과 시즌이 모두 있으면 점수가 누적된다', async () => {
      const userContext: UserContext = {
        makeupAnalysis: {
          undertone: '쿨톤',
          faceShape: '타원형',
          overallScore: 80,
        },
        personalColor: {
          season: 'spring',
        },
      };

      const results = await searchMakeupProducts(userContext, '쿠션 추천');

      // m2는 쿨톤(+20) + spring(+15) = 85
      const coolSpringProduct = results.find((r) => r.id === 'm2');
      expect(coolSpringProduct).toBeDefined();
      if (coolSpringProduct) {
        expect(coolSpringProduct.matchScore).toBeGreaterThanOrEqual(85);
      }
    });

    it('제품 결과에 필수 필드가 포함된다', async () => {
      const results = await searchMakeupProducts(null, '메이크업 추천');

      if (results.length > 0) {
        const product = results[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('brand');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('keyIngredients');
        expect(product).toHaveProperty('concerns');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('matchScore');
        expect(product).toHaveProperty('matchReasons');
      }
    });
  });

  describe('formatMakeupProductsForPrompt', () => {
    it('빈 배열이면 빈 문자열을 반환한다', () => {
      const result = formatMakeupProductsForPrompt([]);
      expect(result).toBe('');
    });

    it('제품 정보를 프롬프트 형식으로 변환한다', () => {
      const products: MakeupProductMatch[] = [
        {
          id: 'm1',
          name: '벨벳 립스틱',
          brand: '이룸뷰티',
          category: 'makeup',
          keyIngredients: ['비타민E', '호호바오일'],
          concerns: ['웜톤', '립', '데일리'],
          price: 22000,
          matchScore: 85,
          matchReasons: ['웜톤 언더톤에 적합', '질문 키워드 일치'],
        },
      ];

      const result = formatMakeupProductsForPrompt(products);

      expect(result).toContain('추천 메이크업 제품');
      expect(result).toContain('이룸뷰티');
      expect(result).toContain('벨벳 립스틱');
      expect(result).toContain('85%');
      expect(result).toContain('22,000원');
    });

    it('가격이 null이면 가격 줄을 생략한다', () => {
      const products: MakeupProductMatch[] = [
        {
          id: 'm3',
          name: '아이섀도 팔레트',
          brand: '코랄뷰티',
          category: 'makeup',
          keyIngredients: ['마이카'],
          concerns: ['아이'],
          price: null,
          matchScore: 70,
          matchReasons: [],
        },
      ];

      const result = formatMakeupProductsForPrompt(products);

      expect(result).toContain('코랄뷰티');
      expect(result).toContain('아이섀도 팔레트');
      expect(result).not.toContain('원');
    });

    it('매칭 이유가 포함된다', () => {
      const products: MakeupProductMatch[] = [
        {
          id: 'm1',
          name: '제품',
          brand: '브랜드',
          category: 'makeup',
          keyIngredients: [],
          concerns: ['웜톤'],
          price: 10000,
          matchScore: 80,
          matchReasons: ['웜톤 언더톤에 적합', '메이크업 타입 일치'],
        },
      ];

      const result = formatMakeupProductsForPrompt(products);

      expect(result).toContain('추천 이유');
      expect(result).toContain('웜톤 언더톤에 적합');
      expect(result).toContain('메이크업 타입 일치');
    });

    it('매칭 이유가 없으면 추천 이유 줄을 생략한다', () => {
      const products: MakeupProductMatch[] = [
        {
          id: 'm1',
          name: '제품',
          brand: '브랜드',
          category: 'makeup',
          keyIngredients: [],
          concerns: [],
          price: 10000,
          matchScore: 50,
          matchReasons: [],
        },
      ];

      const result = formatMakeupProductsForPrompt(products);

      expect(result).not.toContain('추천 이유');
    });

    it('여러 제품을 번호 매기기로 포맷한다', () => {
      const products: MakeupProductMatch[] = [
        {
          id: 'm1',
          name: '립스틱',
          brand: '브랜드A',
          category: 'makeup',
          keyIngredients: [],
          concerns: ['웜톤'],
          price: 20000,
          matchScore: 90,
          matchReasons: ['웜톤 언더톤에 적합'],
        },
        {
          id: 'm2',
          name: '쿠션',
          brand: '브랜드B',
          category: 'makeup',
          keyIngredients: [],
          concerns: ['쿨톤'],
          price: 30000,
          matchScore: 75,
          matchReasons: ['시즌 컬러 맞춤'],
        },
      ];

      const result = formatMakeupProductsForPrompt(products);

      expect(result).toContain('1. 브랜드A 립스틱');
      expect(result).toContain('2. 브랜드B 쿠션');
      expect(result).toContain('90%');
      expect(result).toContain('75%');
    });

    it('concerns가 3개 이하로 표시된다', () => {
      const products: MakeupProductMatch[] = [
        {
          id: 'm1',
          name: '제품',
          brand: '브랜드',
          category: 'makeup',
          keyIngredients: [],
          concerns: ['웜톤', '립', '데일리', '파티', '글리터'],
          price: null,
          matchScore: 60,
          matchReasons: [],
        },
      ];

      const result = formatMakeupProductsForPrompt(products);

      // concerns.slice(0, 3)이므로 처음 3개만 표시
      expect(result).toContain('웜톤');
      expect(result).toContain('립');
      expect(result).toContain('데일리');
      expect(result).not.toContain('글리터');
    });
  });
});
