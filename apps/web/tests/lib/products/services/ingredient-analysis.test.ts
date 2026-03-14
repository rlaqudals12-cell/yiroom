/**
 * AI 성분 분석 서비스 테스트
 * @description ingredient-analysis.ts의 Mock 생성 및 AI 분석 함수 테스트
 *   - generateMockIngredientSummary: 성분 기반 Mock 요약 생성
 *   - analyzeIngredientsWithAI: Gemini AI 분석 + fallback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateMockIngredientSummary,
  analyzeIngredientsWithAI,
} from '@/lib/products/services/ingredient-analysis';
import type { CosmeticIngredient } from '@/types/ingredient';

// ================================================
// Mocks
// ================================================

const mockGenerateContent = vi.fn();
const mockIsGeminiAvailable = vi.fn();

vi.mock('@/lib/gemini/client', () => ({
  generateContent: (...args: unknown[]) => mockGenerateContent(...args),
  isGeminiAvailable: () => mockIsGeminiAvailable(),
}));

vi.mock('@/lib/utils/logger', () => ({
  productLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ================================================
// 테스트 헬퍼
// ================================================

function createIngredient(overrides: Partial<CosmeticIngredient> = {}): CosmeticIngredient {
  return {
    id: 'ing-default',
    nameKo: '히알루론산',
    nameEn: 'Hyaluronic Acid',
    category: 'moisturizer',
    functions: ['보습'],
    isCaution20: false,
    isAllergen: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// 미리 정의된 성분들
const moisturizingIngredient = createIngredient({
  id: 'ing-001',
  nameKo: '히알루론산',
  functions: ['보습', '피부장벽강화'],
});

const whiteningIngredient = createIngredient({
  id: 'ing-002',
  nameKo: '나이아신아마이드',
  category: 'whitening',
  functions: ['미백', '피지조절'],
});

const soothingIngredient = createIngredient({
  id: 'ing-003',
  nameKo: '판테놀',
  category: 'soothing',
  functions: ['진정', '보습'],
});

const antioxidantIngredient = createIngredient({
  id: 'ing-004',
  nameKo: '비타민C',
  category: 'antioxidant',
  functions: ['항산화', '주름개선'],
});

const cautionIngredient = createIngredient({
  id: 'ing-005',
  nameKo: '파라벤',
  category: 'preservative',
  functions: ['방부'],
  ewgScore: 7,
  isCaution20: true,
  isAllergen: true,
  allergenType: '방부제',
});

// ================================================
// generateMockIngredientSummary 테스트
// ================================================

describe('generateMockIngredientSummary', () => {
  it('빈 배열에서 기본 요약을 반환한다', () => {
    const result = generateMockIngredientSummary([]);

    expect(result).toBeDefined();
    expect(result.keywords).toContainEqual(expect.objectContaining({ label: '저자극' }));
    expect(result.summary).toBe('기본적인 피부 케어에 적합한 제품입니다.');
    expect(result.recommendPoints).toBeDefined();
    expect(result.cautionPoints).toBeDefined();
    expect(result.skinTypeRecommendation).toBeDefined();
  });

  it('보습 성분이 있으면 "보습력우수" 키워드를 생성한다', () => {
    const result = generateMockIngredientSummary([moisturizingIngredient]);

    expect(result.keywords).toContainEqual(
      expect.objectContaining({ label: '보습력우수', score: 0.92 })
    );
    expect(result.summary).toContain('보습');
  });

  it('미백 성분이 있으면 "톤업효과" 키워드를 생성한다', () => {
    const result = generateMockIngredientSummary([whiteningIngredient]);

    expect(result.keywords).toContainEqual(expect.objectContaining({ label: '톤업효과' }));
  });

  it('진정 성분이 있으면 "진정케어" 키워드를 생성한다', () => {
    const result = generateMockIngredientSummary([soothingIngredient]);

    expect(result.keywords).toContainEqual(expect.objectContaining({ label: '진정케어' }));
  });

  it('항산화/주름 성분이 있으면 "안티에이징" 키워드를 생성한다', () => {
    const result = generateMockIngredientSummary([antioxidantIngredient]);

    expect(result.keywords).toContainEqual(expect.objectContaining({ label: '안티에이징' }));
  });

  it('주의 성분이 없으면 "저자극" 키워드를 추가한다', () => {
    const result = generateMockIngredientSummary([moisturizingIngredient]);

    expect(result.keywords).toContainEqual(
      expect.objectContaining({ label: '저자극', score: 0.95 })
    );
  });

  it('주의 성분이 있으면 "저자극" 키워드가 없다', () => {
    const result = generateMockIngredientSummary([cautionIngredient]);

    expect(result.keywords.some((k) => k.label === '저자극')).toBe(false);
  });

  it('주의 성분 수를 cautionPoints에 포함한다', () => {
    const result = generateMockIngredientSummary([cautionIngredient]);

    expect(result.cautionPoints.some((p) => p.includes('주의 성분 1개'))).toBe(true);
  });

  it('알레르겐 성분이 있으면 cautionPoints에 포함한다', () => {
    const result = generateMockIngredientSummary([cautionIngredient]);

    expect(result.cautionPoints.some((p) => p.includes('알레르기'))).toBe(true);
  });

  it('EWG 7등급 이상 성분이 있으면 cautionPoints에 포함한다', () => {
    const result = generateMockIngredientSummary([cautionIngredient]);

    expect(result.cautionPoints.some((p) => p.includes('EWG 7등급'))).toBe(true);
  });

  it('키워드를 최대 5개까지만 반환한다', () => {
    const result = generateMockIngredientSummary([
      moisturizingIngredient,
      whiteningIngredient,
      soothingIngredient,
      antioxidantIngredient,
    ]);

    expect(result.keywords.length).toBeLessThanOrEqual(5);
  });

  it('recommendPoints를 최대 3개까지만 반환한다', () => {
    const result = generateMockIngredientSummary([
      moisturizingIngredient,
      whiteningIngredient,
      soothingIngredient,
      antioxidantIngredient,
    ]);

    expect(result.recommendPoints.length).toBeLessThanOrEqual(3);
  });

  it('cautionPoints를 최대 3개까지만 반환한다', () => {
    // 주의 성분 + 알레르겐 + EWG 7+ = 3개
    const result = generateMockIngredientSummary([cautionIngredient]);

    expect(result.cautionPoints.length).toBeLessThanOrEqual(3);
  });

  // 피부타입별 추천도 테스트
  it('보습 성분이 있으면 건성 피부 추천도가 +10된다', () => {
    const withMoist = generateMockIngredientSummary([moisturizingIngredient]);
    // 기본 dry=80, +10 = 90
    expect(withMoist.skinTypeRecommendation.dry).toBe(90);
  });

  it('보습 성분이 있으면 지성 피부 추천도가 -5된다', () => {
    const withMoist = generateMockIngredientSummary([moisturizingIngredient]);
    // 기본 oily=75, -5 = 70
    expect(withMoist.skinTypeRecommendation.oily).toBe(70);
  });

  it('진정 성분이 있으면 민감성 피부 추천도가 +10된다', () => {
    const withSoothing = generateMockIngredientSummary([soothingIngredient]);
    // 기본 sensitive=85 (주의 0개), +10 = 95
    expect(withSoothing.skinTypeRecommendation.sensitive).toBe(95);
  });

  it('주의 성분이 있으면 민감성 피부 추천도가 60이다', () => {
    const withCaution = generateMockIngredientSummary([cautionIngredient]);
    // 주의 성분 있으면 sensitive=60
    expect(withCaution.skinTypeRecommendation.sensitive).toBe(60);
  });

  it('피부타입별 추천도가 0-100 범위를 벗어나지 않는다', () => {
    // 보습+진정 조합으로 높은 점수 유도
    const result = generateMockIngredientSummary([moisturizingIngredient, soothingIngredient]);

    const { skinTypeRecommendation: rec } = result;
    for (const key of Object.keys(rec) as Array<keyof typeof rec>) {
      expect(rec[key]).toBeGreaterThanOrEqual(0);
      expect(rec[key]).toBeLessThanOrEqual(100);
    }
  });

  it('보습 성분이 있을 때 요약에 "보습" 포함', () => {
    const result = generateMockIngredientSummary([moisturizingIngredient]);

    expect(result.summary).toContain('보습');
  });

  it('주의 성분이 없으면 요약에 "데일리 사용에 적합" 포함', () => {
    const result = generateMockIngredientSummary([moisturizingIngredient]);

    expect(result.summary).toContain('데일리 사용에 적합');
  });

  it('주의 성분이 있으면 요약에 "민감성 피부는 주의" 포함', () => {
    const result = generateMockIngredientSummary([moisturizingIngredient, cautionIngredient]);

    expect(result.summary).toContain('민감성 피부는 주의');
  });

  it('보습+미백+진정+항산화 복합 요약을 생성한다', () => {
    const result = generateMockIngredientSummary([
      moisturizingIngredient,
      whiteningIngredient,
      soothingIngredient,
      antioxidantIngredient,
    ]);

    expect(result.summary).toContain('보습');
    expect(result.summary).toContain('미백');
    expect(result.summary).toContain('진정');
    expect(result.summary).toContain('안티에이징');
  });

  it('relatedIngredients에 최대 3개 성분명이 포함된다', () => {
    const manyMoisturizers = [
      createIngredient({ id: 'i1', nameKo: '성분1', functions: ['보습'] }),
      createIngredient({ id: 'i2', nameKo: '성분2', functions: ['보습'] }),
      createIngredient({ id: 'i3', nameKo: '성분3', functions: ['보습'] }),
      createIngredient({ id: 'i4', nameKo: '성분4', functions: ['보습'] }),
    ];

    const result = generateMockIngredientSummary(manyMoisturizers);
    const moistKeyword = result.keywords.find((k) => k.label === '보습력우수');

    expect(moistKeyword).toBeDefined();
    expect(moistKeyword!.relatedIngredients.length).toBeLessThanOrEqual(3);
  });
});

// ================================================
// analyzeIngredientsWithAI 테스트
// ================================================

describe('analyzeIngredientsWithAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsGeminiAvailable.mockReturnValue(true);
  });

  it('Gemini 사용 불가 시 Mock 결과를 반환한다', async () => {
    mockIsGeminiAvailable.mockReturnValue(false);

    const result = await analyzeIngredientsWithAI([moisturizingIngredient]);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('Gemini 성공 시 파싱된 AI 응답을 반환한다', async () => {
    const aiResponse = {
      keywords: [{ label: 'AI보습', score: 0.99, relatedIngredients: ['히알루론산'] }],
      summary: 'AI가 분석한 요약',
      recommendPoints: ['AI 추천 포인트'],
      cautionPoints: [],
      skinTypeRecommendation: { oily: 80, dry: 90, sensitive: 85, combination: 82, normal: 88 },
    };

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(aiResponse),
    });

    const result = await analyzeIngredientsWithAI([moisturizingIngredient]);

    expect(result.keywords[0].label).toBe('AI보습');
    expect(result.summary).toBe('AI가 분석한 요약');
  });

  it('Gemini 에러 시 재시도 후 Mock으로 fallback한다', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API Error'));

    const result = await analyzeIngredientsWithAI([moisturizingIngredient]);

    // MAX_RETRIES=2 이므로 총 3번 호출 (0, 1, 2)
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    // Mock fallback 결과
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(result.summary).toBeDefined();
  }, 15000);

  it('Gemini 타임아웃 시 Mock으로 fallback한다', async () => {
    // 5초 지연으로 3초 타임아웃 초과 유도
    mockGenerateContent.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5000))
    );

    const result = await analyzeIngredientsWithAI([moisturizingIngredient]);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
  }, 30000);

  it('잘못된 JSON 응답 시 재시도 후 Mock으로 fallback한다', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'This is not valid JSON at all',
    });

    const result = await analyzeIngredientsWithAI([moisturizingIngredient]);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
  }, 15000);

  it('필수 필드 누락 응답 시 재시도 후 Mock으로 fallback한다', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ keywords: [{ label: 'test' }] }),
      // summary, skinTypeRecommendation 누락
    });

    const result = await analyzeIngredientsWithAI([moisturizingIngredient]);

    expect(result).toBeDefined();
    expect(result.skinTypeRecommendation).toBeDefined();
  }, 15000);

  it('결과가 AIIngredientSummary 형식을 만족한다', async () => {
    mockIsGeminiAvailable.mockReturnValue(false);

    const result = await analyzeIngredientsWithAI([moisturizingIngredient, whiteningIngredient]);

    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('recommendPoints');
    expect(result).toHaveProperty('cautionPoints');
    expect(result).toHaveProperty('skinTypeRecommendation');

    expect(Array.isArray(result.keywords)).toBe(true);
    expect(typeof result.summary).toBe('string');
    expect(Array.isArray(result.recommendPoints)).toBe(true);
    expect(Array.isArray(result.cautionPoints)).toBe(true);
    expect(typeof result.skinTypeRecommendation).toBe('object');
  });

  it('첫 번째 시도 실패, 두 번째 시도 성공 시 AI 결과를 반환한다', async () => {
    const aiResponse = {
      keywords: [{ label: '재시도성공', score: 0.9, relatedIngredients: [] }],
      summary: '재시도 성공 요약',
      recommendPoints: [],
      cautionPoints: [],
      skinTypeRecommendation: { oily: 80, dry: 80, sensitive: 80, combination: 80, normal: 80 },
    };

    mockGenerateContent
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce({ text: JSON.stringify(aiResponse) });

    const result = await analyzeIngredientsWithAI([moisturizingIngredient]);

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(result.keywords[0].label).toBe('재시도성공');
  }, 15000);
});

// ================================================
// 통합 시나리오 테스트
// ================================================

describe('통합 시나리오', () => {
  it('보습 크림 성분 분석에서 보습+저자극 키워드가 나온다', () => {
    const ingredients = [
      moisturizingIngredient,
      createIngredient({ id: 'i-gly', nameKo: '글리세린', functions: ['보습', '피부연화'] }),
      createIngredient({ id: 'i-cer', nameKo: '세라마이드', functions: ['보습', '피부장벽강화'] }),
    ];

    const result = generateMockIngredientSummary(ingredients);

    expect(result.keywords.some((k) => k.label === '보습력우수')).toBe(true);
    expect(result.keywords.some((k) => k.label === '저자극')).toBe(true);
    expect(result.skinTypeRecommendation.dry).toBeGreaterThanOrEqual(80);
  });

  it('안티에이징+미백 에센스 분석', () => {
    const ingredients = [antioxidantIngredient, whiteningIngredient];

    const result = generateMockIngredientSummary(ingredients);

    expect(result.keywords.some((k) => k.label === '안티에이징')).toBe(true);
    expect(result.keywords.some((k) => k.label === '톤업효과')).toBe(true);
  });

  it('주의 성분이 여러 개인 제품 분석', () => {
    const ingredients = [
      moisturizingIngredient,
      cautionIngredient,
      createIngredient({
        id: 'i-frag',
        nameKo: '인공향료',
        category: 'fragrance',
        functions: ['향료'],
        ewgScore: 8,
        isCaution20: true,
      }),
    ];

    const result = generateMockIngredientSummary(ingredients);

    expect(result.keywords.some((k) => k.label === '저자극')).toBe(false);
    expect(result.cautionPoints.length).toBeGreaterThan(0);
    expect(result.skinTypeRecommendation.sensitive).toBeLessThan(80);
  });
});
