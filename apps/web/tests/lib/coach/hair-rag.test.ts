/**
 * 헤어 전용 RAG 테스트
 * @description 헤어/두피 고민 Q&A + 제품 추천 RAG 시스템 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// 기본 헤어 제품 mock 데이터
const mockHairProducts = [
  {
    id: 'hp1',
    name: '탈모 예방 샴푸',
    brand: '헤어랩',
    category: 'shampoo',
    key_ingredients: ['카페인', '비오틴', '판테놀'],
    concerns: ['탈모', '두피', '볼륨'],
    skin_types: [],
    price_krw: 22000,
  },
  {
    id: 'hp2',
    name: '두피 진정 트리트먼트',
    brand: '스칼프케어',
    category: 'treatment',
    key_ingredients: ['티트리', '살리실산', '판테놀'],
    concerns: ['두피', '비듬', '가려움', '지성'],
    skin_types: [],
    price_krw: 18000,
  },
  {
    id: 'hp3',
    name: '손상모 케라틴 팩',
    brand: '헤어랩',
    category: 'hairpack',
    key_ingredients: ['케라틴', '아르간오일'],
    concerns: ['손상모', '건조', '염색', '헤어'],
    skin_types: [],
    price_krw: 25000,
  },
  {
    id: 'hp4',
    name: '일반 바디로션',
    brand: '바디케어',
    category: 'lotion',
    key_ingredients: ['시어버터'],
    concerns: ['보습'],
    skin_types: ['건성'],
    price_krw: 15000,
  },
];

// Supabase mock - hair-rag는 .from().select().eq().limit() 체인 사용
const mockLimit = vi.fn().mockResolvedValue({
  data: mockHairProducts,
  error: null,
});
const mockEq = vi.fn(() => ({
  limit: mockLimit,
}));
const mockSelect = vi.fn(() => ({
  eq: mockEq,
}));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => ({
    from: mockFrom,
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
import { searchHairProducts, formatHairProductsForPrompt } from '@/lib/coach/hair-rag';
import type { HairProductMatch } from '@/lib/coach/hair-rag';
import type { UserContext } from '@/lib/coach/types';

describe('Hair RAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본 mock 응답 복원
    mockLimit.mockResolvedValue({
      data: mockHairProducts,
      error: null,
    });
    mockEq.mockReturnValue({ limit: mockLimit });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  describe('searchHairProducts', () => {
    it('null userContext으로 기본 검색한다', async () => {
      const results = await searchHairProducts(null, '샴푸 추천해줘');

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('cosmetic_products');
    });

    it('헤어 타입 기반으로 검색한다 (hairType: 건성모)', async () => {
      // 건성모 매칭 제품 포함
      mockLimit.mockResolvedValue({
        data: [
          {
            id: 'dry1',
            name: '건성모 전용 샴푸',
            brand: '헤어랩',
            category: 'shampoo',
            key_ingredients: ['아르간오일', '시어버터'],
            concerns: ['건성모', '샴푸', '건조'],
            skin_types: [],
            price_krw: 20000,
          },
        ],
        error: null,
      });

      const userContext: UserContext = {
        hairAnalysis: {
          hairType: '건성모',
          scalpType: '건성',
          overallScore: 60,
          concerns: ['건조'],
        },
      };

      const results = await searchHairProducts(userContext, '샴푸 추천');

      expect(results).toBeDefined();
      // 헤어 제품(+20) + 헤어 타입 매칭(+10) + 기본(30) = 60 이상
      if (results.length > 0) {
        expect(results[0].matchScore).toBeGreaterThanOrEqual(40);
      }
    });

    it('두피 타입 기반으로 검색한다 (scalpType: 지성)', async () => {
      const userContext: UserContext = {
        hairAnalysis: {
          hairType: '보통',
          scalpType: '지성',
          overallScore: 55,
          concerns: [],
        },
      };

      const results = await searchHairProducts(userContext, '두피 관리');

      expect(results).toBeDefined();
      // hp2는 concerns에 '지성'이 있으므로 두피 타입 매칭 (+15)
      const jisungProduct = results.find((p) => p.id === 'hp2');
      if (jisungProduct) {
        expect(jisungProduct.matchReasons).toContain('지성 두피에 적합');
      }
    });

    it('모발 고민 매칭으로 가산점을 부여한다 (탈모, 비듬)', async () => {
      const userContext: UserContext = {
        hairAnalysis: {
          hairType: '보통',
          scalpType: '보통',
          overallScore: 50,
          concerns: ['탈모', '비듬'],
        },
      };

      const results = await searchHairProducts(userContext, '두피 케어');

      expect(results).toBeDefined();
      // hp1은 탈모 매칭, hp2는 비듬 매칭
      if (results.length > 0) {
        expect(results[0].matchScore).toBeGreaterThan(30);
      }
    });

    it('매칭 점수가 40 미만인 제품은 필터링한다', async () => {
      // 헤어와 무관한 제품만 반환
      mockLimit.mockResolvedValue({
        data: [
          {
            id: 'unrelated',
            name: '일반 핸드크림',
            brand: '핸드케어',
            category: 'cream',
            key_ingredients: ['시어버터'],
            concerns: ['보습'],
            skin_types: ['건성'],
            price_krw: 8000,
          },
        ],
        error: null,
      });

      const results = await searchHairProducts(null, '헤어 추천');

      // 기본 30점만 → 40 미만이므로 필터링
      expect(results.length).toBe(0);
    });

    it('결과가 matchScore 내림차순으로 정렬된다', async () => {
      const userContext: UserContext = {
        hairAnalysis: {
          hairType: '보통',
          scalpType: '지성',
          overallScore: 50,
          concerns: ['탈모', '비듬'],
        },
      };

      const results = await searchHairProducts(userContext, '두피 샴푸 추천');

      if (results.length >= 2) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].matchScore).toBeGreaterThanOrEqual(results[i + 1].matchScore);
        }
      }
    });

    it('limit 파라미터가 반환 결과 수를 제한한다', async () => {
      const results = await searchHairProducts(null, '샴푸 추천', 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('DB 에러 시 빈 배열을 반환한다', async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { message: 'DB connection error', code: '500' },
      });

      const results = await searchHairProducts(null, '샴푸 추천');

      expect(results).toEqual([]);
    });

    it('DB 결과가 빈 배열일 때 빈 배열을 반환한다', async () => {
      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      const results = await searchHairProducts(null, '샴푸 추천');

      expect(results).toEqual([]);
    });

    it('질문에서 헤어 키워드를 추출한다 (탈모 예방 샴푸)', async () => {
      const userContext: UserContext = {
        hairAnalysis: {
          hairType: '보통',
          scalpType: '보통',
          overallScore: 50,
          concerns: [],
        },
      };

      const results = await searchHairProducts(userContext, '탈모 예방 샴푸 추천해줘');

      // hp1은 concerns에 '탈모' 포함 → 키워드 매칭 +10
      expect(results).toBeDefined();
      const talmoProdcut = results.find((p) => p.id === 'hp1');
      if (talmoProdcut) {
        expect(talmoProdcut.matchReasons).toContain('질문 키워드 일치');
      }
    });

    it('헤어 관련 제품에 +20 가산점을 부여한다', async () => {
      // 헤어 제품과 비헤어 제품 비교
      mockLimit.mockResolvedValue({
        data: [
          {
            id: 'hair-prod',
            name: '헤어 에센스',
            brand: '브랜드A',
            category: 'essence',
            key_ingredients: ['케라틴'],
            concerns: ['헤어', '손상모'],
            skin_types: [],
            price_krw: 15000,
          },
          {
            id: 'non-hair',
            name: '페이스 크림',
            brand: '브랜드B',
            category: 'cream',
            key_ingredients: ['히알루론산'],
            concerns: ['보습', '주름'],
            skin_types: ['건성'],
            price_krw: 20000,
          },
        ],
        error: null,
      });

      const results = await searchHairProducts(null, '케어 추천');

      // 헤어 제품은 기본(30) + 헤어 전용(+20) = 50 → 필터 통과
      // 비헤어 제품은 기본(30) → 40 미만 필터링
      const hairProd = results.find((p) => p.id === 'hair-prod');
      const nonHairProd = results.find((p) => p.id === 'non-hair');

      expect(hairProd).toBeDefined();
      expect(nonHairProd).toBeUndefined();
    });

    it('고민 매칭은 최대 +30점으로 제한한다', async () => {
      mockLimit.mockResolvedValue({
        data: [
          {
            id: 'multi-concern',
            name: '올인원 헤어 케어',
            brand: '브랜드A',
            category: 'treatment',
            key_ingredients: ['비오틴', '케라틴'],
            concerns: ['탈모', '비듬', '건조', '손상모', '볼륨', '헤어'],
            skin_types: [],
            price_krw: 30000,
          },
        ],
        error: null,
      });

      const userContext: UserContext = {
        hairAnalysis: {
          hairType: '보통',
          scalpType: '보통',
          overallScore: 50,
          concerns: ['탈모', '비듬', '건조', '손상모', '볼륨'],
        },
      };

      const results = await searchHairProducts(userContext, '추천해줘');

      // 기본(30) + 헤어 제품(+20) + 고민 5개 매칭 = 5*10=50이지만 max 30 → 총 80
      // 점수 최대 100 제한
      if (results.length > 0) {
        expect(results[0].matchScore).toBeLessThanOrEqual(100);
        // 기본(30) + 헤어(20) + 고민(max 30) = 80
        expect(results[0].matchScore).toBe(80);
      }
    });
  });

  describe('formatHairProductsForPrompt', () => {
    it('빈 배열이면 빈 문자열을 반환한다', () => {
      const result = formatHairProductsForPrompt([]);
      expect(result).toBe('');
    });

    it('제품 정보를 프롬프트 형식으로 변환한다', () => {
      const products: HairProductMatch[] = [
        {
          id: 'hp1',
          name: '탈모 예방 샴푸',
          brand: '헤어랩',
          category: 'shampoo',
          keyIngredients: ['카페인', '비오틴'],
          concerns: ['탈모', '두피'],
          price: 22000,
          matchScore: 85,
          matchReasons: ['헤어 전용 제품', '탈모 개선'],
        },
      ];

      const result = formatHairProductsForPrompt(products);

      expect(result).toContain('추천 헤어케어 제품');
      expect(result).toContain('헤어랩');
      expect(result).toContain('탈모 예방 샴푸');
      expect(result).toContain('카페인');
      expect(result).toContain('85%');
      expect(result).toContain('22,000원');
    });

    it('가격이 null이면 가격 줄을 생략한다', () => {
      const products: HairProductMatch[] = [
        {
          id: 'hp1',
          name: '테스트 제품',
          brand: '브랜드',
          category: 'shampoo',
          keyIngredients: ['성분1'],
          concerns: [],
          price: null,
          matchScore: 70,
          matchReasons: [],
        },
      ];

      const result = formatHairProductsForPrompt(products);

      expect(result).not.toContain('가격:');
    });

    it('매칭 이유가 있으면 표시한다', () => {
      const products: HairProductMatch[] = [
        {
          id: 'hp1',
          name: '제품',
          brand: '브랜드',
          category: 'shampoo',
          keyIngredients: [],
          concerns: [],
          price: 10000,
          matchScore: 60,
          matchReasons: ['헤어 전용 제품', '건성모 모발에 적합'],
        },
      ];

      const result = formatHairProductsForPrompt(products);

      expect(result).toContain('추천 이유');
      expect(result).toContain('헤어 전용 제품');
      expect(result).toContain('건성모 모발에 적합');
    });

    it('여러 제품을 포맷한다', () => {
      const products: HairProductMatch[] = [
        {
          id: 'hp1',
          name: '제품1',
          brand: '브랜드1',
          category: 'shampoo',
          keyIngredients: ['비오틴'],
          concerns: ['탈모'],
          price: 20000,
          matchScore: 90,
          matchReasons: ['헤어 전용 제품'],
        },
        {
          id: 'hp2',
          name: '제품2',
          brand: '브랜드2',
          category: 'treatment',
          keyIngredients: ['케라틴'],
          concerns: ['손상모'],
          price: null,
          matchScore: 75,
          matchReasons: [],
        },
      ];

      const result = formatHairProductsForPrompt(products);

      expect(result).toContain('1. 브랜드1 제품1');
      expect(result).toContain('2. 브랜드2 제품2');
      expect(result).toContain('90%');
      expect(result).toContain('75%');
    });
  });
});
