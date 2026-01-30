/**
 * 제품 Q&A RAG 시스템 테스트
 *
 * @module tests/lib/rag/product-qa
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CosmeticProduct, SupplementProduct } from '@/types/product';

// Google AI Mock
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
    }),
  })),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH',
    BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
  },
}));

// Logger Mock
vi.mock('@/lib/utils/logger', () => ({
  ragLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { askProductQuestion, FAQ_TEMPLATES, type ProductQARequest } from '@/lib/rag/product-qa';

describe('lib/rag/product-qa', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // 환경변수 리셋
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // FAQ_TEMPLATES 테스트
  // ---------------------------------------------------------------------------

  describe('FAQ_TEMPLATES', () => {
    it('cosmetic 템플릿이 존재한다', () => {
      expect(FAQ_TEMPLATES.cosmetic).toBeDefined();
      expect(FAQ_TEMPLATES.cosmetic.length).toBeGreaterThan(0);
    });

    it('supplement 템플릿이 존재한다', () => {
      expect(FAQ_TEMPLATES.supplement).toBeDefined();
      expect(FAQ_TEMPLATES.supplement.length).toBeGreaterThan(0);
    });

    it('workout_equipment 템플릿이 존재한다', () => {
      expect(FAQ_TEMPLATES.workout_equipment).toBeDefined();
      expect(FAQ_TEMPLATES.workout_equipment.length).toBeGreaterThan(0);
    });

    it('health_food 템플릿이 존재한다', () => {
      expect(FAQ_TEMPLATES.health_food).toBeDefined();
      expect(FAQ_TEMPLATES.health_food.length).toBeGreaterThan(0);
    });

    it('모든 템플릿이 문자열 배열이다', () => {
      Object.values(FAQ_TEMPLATES).forEach((templates) => {
        expect(Array.isArray(templates)).toBe(true);
        templates.forEach((t) => expect(typeof t).toBe('string'));
      });
    });
  });

  // ---------------------------------------------------------------------------
  // askProductQuestion Mock 모드 테스트
  // ---------------------------------------------------------------------------

  describe('askProductQuestion (Mock Mode)', () => {
    const mockCosmeticProduct: CosmeticProduct = {
      id: 'cosmetic_123',
      name: '보습 세럼',
      brand: 'TestBrand',
      priceKrw: 25000,
      category: 'serum',
      imageUrl: 'https://example.com/image.jpg',
    };

    const baseRequest: ProductQARequest = {
      question: '이 제품 어떻게 사용해요?',
      product: mockCosmeticProduct,
      productType: 'cosmetic',
    };

    it('FORCE_MOCK_AI=true일 때 Mock 응답을 반환한다', async () => {
      process.env.FORCE_MOCK_AI = 'true';

      const result = await askProductQuestion(baseRequest);

      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('confidence');
      expect(['high', 'medium', 'low']).toContain(result.confidence);
    });

    it('API 키 없을 때 Mock 응답을 반환한다', async () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = '';
      process.env.FORCE_MOCK_AI = '';

      const result = await askProductQuestion(baseRequest);

      expect(result).toHaveProperty('answer');
      expect(result.confidence).toBe('low');
    });

    it('민감 피부 질문에 적절한 Mock 응답을 반환한다', async () => {
      process.env.FORCE_MOCK_AI = 'true';

      const request: ProductQARequest = {
        ...baseRequest,
        question: '민감성 피부에도 사용할 수 있나요?',
      };

      const result = await askProductQuestion(request);

      expect(result.answer).toContain('민감');
      expect(result.relatedTopics).toBeDefined();
    });

    it('사용법 질문에 적절한 Mock 응답을 반환한다', async () => {
      process.env.FORCE_MOCK_AI = 'true';

      const request: ProductQARequest = {
        ...baseRequest,
        question: '언제 사용하면 좋아요?',
      };

      const result = await askProductQuestion(request);

      expect(result.answer).toContain('사용');
    });

    it('일반 질문에 기본 Mock 응답을 반환한다', async () => {
      process.env.FORCE_MOCK_AI = 'true';

      const request: ProductQARequest = {
        ...baseRequest,
        question: '배송은 얼마나 걸리나요?',
      };

      const result = await askProductQuestion(request);

      expect(result.answer).toBeDefined();
      expect(result.confidence).toBe('low');
    });
  });

  // ---------------------------------------------------------------------------
  // 제품 컨텍스트 테스트 (간접)
  // ---------------------------------------------------------------------------

  describe('Product Context Building (via Mock)', () => {
    const mockSupplementProduct: SupplementProduct = {
      id: 'supplement_456',
      name: '멀티비타민',
      brand: 'HealthPlus',
      priceKrw: 35000,
      category: 'vitamin',
      imageUrl: 'https://example.com/vitamin.jpg',
    };

    it('Supplement 제품 정보로 Q&A가 동작한다', async () => {
      process.env.FORCE_MOCK_AI = 'true';

      const request: ProductQARequest = {
        question: '하루에 몇 알 먹어야 해요?',
        product: mockSupplementProduct,
        productType: 'supplement',
      };

      const result = await askProductQuestion(request);

      expect(result).toHaveProperty('answer');
    });

    it('사용자 컨텍스트가 포함된 요청이 동작한다', async () => {
      process.env.FORCE_MOCK_AI = 'true';

      const request: ProductQARequest = {
        question: '이 제품 써도 될까요?',
        product: mockSupplementProduct,
        productType: 'supplement',
        userContext: {
          skinType: '건성',
          skinConcerns: ['건조함', '각질'],
          allergies: ['글루텐'],
        },
      };

      const result = await askProductQuestion(request);

      expect(result).toHaveProperty('answer');
    });
  });

  // ---------------------------------------------------------------------------
  // 응답 구조 테스트
  // ---------------------------------------------------------------------------

  describe('Response Structure', () => {
    it('응답이 필수 필드를 포함한다', async () => {
      process.env.FORCE_MOCK_AI = 'true';

      const request: ProductQARequest = {
        question: '테스트 질문',
        product: {
          id: 'test',
          name: 'Test Product',
          brand: 'Test',
          priceKrw: 10000,
          category: 'serum',
          imageUrl: 'https://test.com/img.jpg',
        } as CosmeticProduct,
        productType: 'cosmetic',
      };

      const result = await askProductQuestion(request);

      expect(result).toHaveProperty('answer');
      expect(typeof result.answer).toBe('string');
      expect(result).toHaveProperty('confidence');
      expect(['high', 'medium', 'low']).toContain(result.confidence);
    });

    it('응답에 선택적 필드가 포함될 수 있다', async () => {
      process.env.FORCE_MOCK_AI = 'true';

      const request: ProductQARequest = {
        question: '민감한 피부에 써도 돼요?',
        product: {
          id: 'test',
          name: 'Test Product',
          brand: 'Test',
          priceKrw: 10000,
          category: 'serum',
          imageUrl: 'https://test.com/img.jpg',
        } as CosmeticProduct,
        productType: 'cosmetic',
      };

      const result = await askProductQuestion(request);

      // relatedTopics는 선택적
      if (result.relatedTopics) {
        expect(Array.isArray(result.relatedTopics)).toBe(true);
      }
    });
  });
});
