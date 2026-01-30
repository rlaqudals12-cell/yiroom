/**
 * AI 성분 분석 서비스 테스트
 * @description ingredient-analysis.ts의 Mock 생성 및 AI 분석 함수 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateMockIngredientSummary,
  analyzeIngredientsWithAI,
} from '@/lib/products/services/ingredient-analysis';
import type { CosmeticIngredient } from '@/types/ingredient';

// =============================================================================
// Mock 데이터
// =============================================================================

const createMockIngredient = (overrides: Partial<CosmeticIngredient> = {}): CosmeticIngredient => ({
  id: 'ing-001',
  nameKo: '히알루론산',
  nameEn: 'Hyaluronic Acid',
  nameInci: 'SODIUM HYALURONATE',
  aliases: ['HA'],
  ewgScore: 1,
  ewgDataAvailability: 'good',
  category: 'moisturizer',
  functions: ['보습', '피부장벽강화'],
  isCaution20: false,
  isAllergen: false,
  skinTypeCaution: {
    oily: 'recommended',
    dry: 'recommended',
    sensitive: 'recommended',
    combination: 'recommended',
    normal: 'recommended',
  },
  description: '피부 수분 유지에 탁월한 보습제',
  benefits: ['강력한 보습'],
  concerns: [],
  source: 'EWG Skin Deep',
  createdAt: '2026-01-04T00:00:00Z',
  updatedAt: '2026-01-04T00:00:00Z',
  ...overrides,
});

// 보습 성분
const moisturizingIngredient = createMockIngredient({
  id: 'ing-001',
  nameKo: '히알루론산',
  functions: ['보습', '피부장벽강화'],
});

// 미백 성분
const whiteningIngredient = createMockIngredient({
  id: 'ing-002',
  nameKo: '나이아신아마이드',
  category: 'whitening',
  functions: ['미백', '피지조절'],
});

// 진정 성분
const soothingIngredient = createMockIngredient({
  id: 'ing-003',
  nameKo: '판테놀',
  category: 'soothing',
  functions: ['진정', '보습'],
});

// 항산화 성분
const antioxidantIngredient = createMockIngredient({
  id: 'ing-004',
  nameKo: '비타민C',
  category: 'antioxidant',
  functions: ['항산화', '주름개선'],
});

// 주의 성분
const cautionIngredient = createMockIngredient({
  id: 'ing-005',
  nameKo: '파라벤',
  category: 'preservative',
  functions: ['방부'],
  ewgScore: 7,
  isCaution20: true,
  isAllergen: true,
  allergenType: '방부제',
});

// =============================================================================
// 테스트
// =============================================================================

describe('ingredient-analysis service', () => {
  // ---------------------------------------------------------------------------
  // generateMockIngredientSummary
  // ---------------------------------------------------------------------------

  describe('generateMockIngredientSummary', () => {
    it('빈 배열에 대해 기본 요약을 반환해야 함', () => {
      const result = generateMockIngredientSummary([]);

      expect(result).toBeDefined();
      // 빈 배열이어도 "저자극" 키워드는 추가됨 (주의 성분 0개이므로)
      expect(result.keywords).toContainEqual(expect.objectContaining({ label: '저자극' }));
      expect(result.summary).toBe('기본적인 피부 케어에 적합한 제품입니다.');
      expect(result.recommendPoints).toBeDefined();
      expect(result.cautionPoints).toBeDefined();
      expect(result.skinTypeRecommendation).toBeDefined();
    });

    it('보습 성분이 있으면 "보습력우수" 키워드를 생성해야 함', () => {
      const result = generateMockIngredientSummary([moisturizingIngredient]);

      expect(result.keywords).toContainEqual(
        expect.objectContaining({
          label: '보습력우수',
        })
      );
      expect(result.summary).toContain('보습');
    });

    it('미백 성분이 있으면 "톤업효과" 키워드를 생성해야 함', () => {
      const result = generateMockIngredientSummary([whiteningIngredient]);

      expect(result.keywords).toContainEqual(
        expect.objectContaining({
          label: '톤업효과',
        })
      );
    });

    it('진정 성분이 있으면 "진정케어" 키워드를 생성해야 함', () => {
      const result = generateMockIngredientSummary([soothingIngredient]);

      expect(result.keywords).toContainEqual(
        expect.objectContaining({
          label: '진정케어',
        })
      );
    });

    it('항산화 성분이 있으면 "안티에이징" 키워드를 생성해야 함', () => {
      const result = generateMockIngredientSummary([antioxidantIngredient]);

      expect(result.keywords).toContainEqual(
        expect.objectContaining({
          label: '안티에이징',
        })
      );
    });

    it('주의 성분이 없으면 "저자극" 키워드를 생성해야 함', () => {
      const result = generateMockIngredientSummary([moisturizingIngredient]);

      expect(result.keywords).toContainEqual(
        expect.objectContaining({
          label: '저자극',
        })
      );
    });

    it('주의 성분이 있으면 주의 포인트에 포함해야 함', () => {
      const result = generateMockIngredientSummary([cautionIngredient]);

      expect(result.cautionPoints.length).toBeGreaterThan(0);
      expect(result.cautionPoints.some((p) => p.includes('주의 성분'))).toBe(true);
    });

    it('알레르겐 성분이 있으면 주의 포인트에 포함해야 함', () => {
      const result = generateMockIngredientSummary([cautionIngredient]);

      expect(result.cautionPoints.some((p) => p.includes('알레르기'))).toBe(true);
    });

    it('EWG 7등급 이상 성분이 있으면 주의 포인트에 포함해야 함', () => {
      const result = generateMockIngredientSummary([cautionIngredient]);

      expect(result.cautionPoints.some((p) => p.includes('EWG 7등급'))).toBe(true);
    });

    it('복합 성분에 대해 여러 키워드를 생성해야 함', () => {
      const result = generateMockIngredientSummary([
        moisturizingIngredient,
        whiteningIngredient,
        soothingIngredient,
        antioxidantIngredient,
      ]);

      expect(result.keywords.length).toBeGreaterThanOrEqual(4);
      expect(result.keywords.length).toBeLessThanOrEqual(5); // 최대 5개 제한
    });

    it('피부타입별 추천도가 0-100 범위여야 함', () => {
      const result = generateMockIngredientSummary([moisturizingIngredient, soothingIngredient]);

      const { skinTypeRecommendation } = result;
      expect(skinTypeRecommendation.oily).toBeGreaterThanOrEqual(0);
      expect(skinTypeRecommendation.oily).toBeLessThanOrEqual(100);
      expect(skinTypeRecommendation.dry).toBeGreaterThanOrEqual(0);
      expect(skinTypeRecommendation.dry).toBeLessThanOrEqual(100);
      expect(skinTypeRecommendation.sensitive).toBeGreaterThanOrEqual(0);
      expect(skinTypeRecommendation.sensitive).toBeLessThanOrEqual(100);
      expect(skinTypeRecommendation.combination).toBeGreaterThanOrEqual(0);
      expect(skinTypeRecommendation.combination).toBeLessThanOrEqual(100);
      expect(skinTypeRecommendation.normal).toBeGreaterThanOrEqual(0);
      expect(skinTypeRecommendation.normal).toBeLessThanOrEqual(100);
    });

    it('보습 성분이 있으면 건성 피부 추천도가 높아야 함', () => {
      const withMoisturizer = generateMockIngredientSummary([moisturizingIngredient]);
      const withoutMoisturizer = generateMockIngredientSummary([whiteningIngredient]);

      expect(withMoisturizer.skinTypeRecommendation.dry).toBeGreaterThan(
        withoutMoisturizer.skinTypeRecommendation.dry - 5
      );
    });

    it('진정 성분이 있으면 민감성 피부 추천도가 높아야 함', () => {
      const withSoothing = generateMockIngredientSummary([soothingIngredient]);
      const withoutSoothing = generateMockIngredientSummary([whiteningIngredient]);

      expect(withSoothing.skinTypeRecommendation.sensitive).toBeGreaterThan(
        withoutSoothing.skinTypeRecommendation.sensitive - 5
      );
    });

    it('주의 성분이 없으면 민감성 피부 추천도가 높아야 함', () => {
      const safe = generateMockIngredientSummary([moisturizingIngredient]);
      const unsafe = generateMockIngredientSummary([cautionIngredient]);

      expect(safe.skinTypeRecommendation.sensitive).toBeGreaterThan(
        unsafe.skinTypeRecommendation.sensitive
      );
    });
  });

  // ---------------------------------------------------------------------------
  // analyzeIngredientsWithAI
  // ---------------------------------------------------------------------------

  describe('analyzeIngredientsWithAI', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('FORCE_MOCK_AI=true일 때 Mock을 반환해야 함', async () => {
      process.env.FORCE_MOCK_AI = 'true';

      const result = await analyzeIngredientsWithAI([moisturizingIngredient]);

      expect(result).toBeDefined();
      expect(result.keywords).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.skinTypeRecommendation).toBeDefined();
    });

    it('API 키가 없을 때 Mock을 반환해야 함', async () => {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.FORCE_MOCK_AI;

      const result = await analyzeIngredientsWithAI([moisturizingIngredient]);

      expect(result).toBeDefined();
      expect(result.keywords).toBeDefined();
    });

    it('결과가 AIIngredientSummary 형식이어야 함', async () => {
      process.env.FORCE_MOCK_AI = 'true';

      const result = await analyzeIngredientsWithAI([moisturizingIngredient, whiteningIngredient]);

      // 필수 필드 확인
      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendPoints');
      expect(result).toHaveProperty('cautionPoints');
      expect(result).toHaveProperty('skinTypeRecommendation');

      // 타입 확인
      expect(Array.isArray(result.keywords)).toBe(true);
      expect(typeof result.summary).toBe('string');
      expect(Array.isArray(result.recommendPoints)).toBe(true);
      expect(Array.isArray(result.cautionPoints)).toBe(true);
      expect(typeof result.skinTypeRecommendation).toBe('object');
    });
  });

  // ---------------------------------------------------------------------------
  // 통합 시나리오 테스트
  // ---------------------------------------------------------------------------

  describe('통합 시나리오', () => {
    it('일반적인 보습 크림 성분에 대한 분석', () => {
      const ingredients = [
        moisturizingIngredient,
        createMockIngredient({
          id: 'ing-006',
          nameKo: '글리세린',
          functions: ['보습', '피부연화'],
        }),
        createMockIngredient({
          id: 'ing-007',
          nameKo: '세라마이드',
          functions: ['보습', '피부장벽강화'],
        }),
      ];

      const result = generateMockIngredientSummary(ingredients);

      expect(result.keywords.some((k) => k.label === '보습력우수')).toBe(true);
      expect(result.keywords.some((k) => k.label === '저자극')).toBe(true);
      expect(result.skinTypeRecommendation.dry).toBeGreaterThanOrEqual(80);
    });

    it('안티에이징 에센스 성분에 대한 분석', () => {
      const ingredients = [
        antioxidantIngredient,
        whiteningIngredient,
        createMockIngredient({
          id: 'ing-008',
          nameKo: '레티놀',
          category: 'antioxidant',
          functions: ['주름개선', '항산화'],
        }),
      ];

      const result = generateMockIngredientSummary(ingredients);

      expect(result.keywords.some((k) => k.label === '안티에이징')).toBe(true);
      expect(result.keywords.some((k) => k.label === '톤업효과')).toBe(true);
    });

    it('민감성 피부용 진정 제품 성분에 대한 분석', () => {
      const ingredients = [
        soothingIngredient,
        createMockIngredient({
          id: 'ing-009',
          nameKo: '센텔라아시아티카',
          category: 'soothing',
          functions: ['진정', '피부재생'],
        }),
        createMockIngredient({
          id: 'ing-010',
          nameKo: '알로에베라',
          functions: ['진정', '보습'],
        }),
      ];

      const result = generateMockIngredientSummary(ingredients);

      expect(result.keywords.some((k) => k.label === '진정케어')).toBe(true);
      expect(result.keywords.some((k) => k.label === '저자극')).toBe(true);
      expect(result.skinTypeRecommendation.sensitive).toBeGreaterThanOrEqual(80);
    });

    it('주의 성분이 포함된 제품에 대한 분석', () => {
      const ingredients = [
        moisturizingIngredient,
        cautionIngredient,
        createMockIngredient({
          id: 'ing-011',
          nameKo: '인공향료',
          category: 'fragrance',
          functions: ['향료'],
          ewgScore: 8,
          isCaution20: true,
        }),
      ];

      const result = generateMockIngredientSummary(ingredients);

      // 저자극 키워드가 없어야 함
      expect(result.keywords.some((k) => k.label === '저자극')).toBe(false);

      // 주의 포인트가 있어야 함
      expect(result.cautionPoints.length).toBeGreaterThan(0);

      // 민감성 피부 추천도가 낮아야 함
      expect(result.skinTypeRecommendation.sensitive).toBeLessThan(80);
    });
  });
});
