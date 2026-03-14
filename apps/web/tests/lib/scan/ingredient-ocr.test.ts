/**
 * 성분표 OCR 분석 테스트
 * Gemini Vision 기반 성분 추출 및 텍스트 파싱 검증
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Gemini 클라이언트 mock
vi.mock('@/lib/gemini/client', () => ({
  isGeminiAvailable: vi.fn(() => true),
  formatImageForGemini: vi.fn((base64: string) => ({ inlineData: { data: base64 } })),
  generateContent: vi.fn(),
}));

vi.mock('@/lib/utils/json-extract', () => ({
  extractJsonObject: vi.fn((text: string) => {
    // 단순 JSON 추출 시뮬레이션
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return text.slice(start, end + 1);
  }),
}));

import {
  analyzeIngredientImage,
  parseIngredientsFromText,
  generateMockOcrResult,
} from '@/lib/scan/ingredient-ocr';
import { isGeminiAvailable, generateContent } from '@/lib/gemini/client';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isGeminiAvailable).mockReturnValue(true);
});

// =====================================================
// analyzeIngredientImage
// =====================================================

describe('analyzeIngredientImage', () => {
  it('성분표 이미지를 분석하여 성분 목록을 반환한다', async () => {
    const mockResponse = {
      text: JSON.stringify({
        productName: 'AHA BHA PHA 토너',
        brandName: 'SOME BY MI',
        ingredients: [
          { order: 1, nameKo: '정제수', inciName: 'WATER', concentration: 'high' },
          {
            order: 2,
            nameKo: '부틸렌글라이콜',
            inciName: 'BUTYLENE GLYCOL',
            concentration: 'medium',
          },
          { order: 3, nameKo: '나이아신아마이드', inciName: 'NIACINAMIDE', concentration: 'low' },
        ],
        confidence: 'high',
        language: 'ko',
      }),
    };
    vi.mocked(generateContent).mockResolvedValue(mockResponse as never);

    const result = await analyzeIngredientImage('data:image/jpeg;base64,test123');

    expect(result.success).toBe(true);
    expect(result.productName).toBe('AHA BHA PHA 토너');
    expect(result.brandName).toBe('SOME BY MI');
    expect(result.ingredients).toHaveLength(3);
    expect(result.ingredients[0].inciName).toBe('WATER');
    expect(result.ingredients[0].nameKo).toBe('정제수');
    expect(result.ingredients[0].concentration).toBe('high');
    expect(result.confidence).toBe('high');
    expect(result.language).toBe('ko');
  });

  it('API 키가 없으면 실패 결과를 반환한다', async () => {
    vi.mocked(isGeminiAvailable).mockReturnValue(false);

    const result = await analyzeIngredientImage('data:image/jpeg;base64,test');

    expect(result.success).toBe(false);
    expect(result.ingredients).toEqual([]);
    expect(result.error).toContain('API 키');
  });

  it('JSON 파싱 실패 시 실패 결과를 반환한다', async () => {
    vi.mocked(generateContent).mockResolvedValue({ text: '이것은 JSON이 아닙니다' } as never);

    const result = await analyzeIngredientImage('data:image/jpeg;base64,test');

    expect(result.success).toBe(false);
    expect(result.ingredients).toEqual([]);
    expect(result.error).toContain('파싱 실패');
  });

  it('Gemini API 에러 시 실패 결과를 반환한다', async () => {
    vi.mocked(generateContent).mockRejectedValue(new Error('API 호출 실패'));

    const result = await analyzeIngredientImage('data:image/jpeg;base64,test');

    expect(result.success).toBe(false);
    expect(result.error).toBe('API 호출 실패');
    expect(result.confidence).toBe('low');
  });

  it('비-Error 예외 시 일반 메시지를 반환한다', async () => {
    vi.mocked(generateContent).mockRejectedValue('unknown error');

    const result = await analyzeIngredientImage('data:image/jpeg;base64,test');

    expect(result.success).toBe(false);
    expect(result.error).toBe('OCR 분석 실패');
  });

  it('inciName이 없으면 nameKo를 fallback으로 사용한다', async () => {
    const mockResponse = {
      text: JSON.stringify({
        productName: null,
        brandName: null,
        ingredients: [{ order: 1, nameKo: '정제수', concentration: 'high' }],
        confidence: 'medium',
        language: 'ko',
      }),
    };
    vi.mocked(generateContent).mockResolvedValue(mockResponse as never);

    const result = await analyzeIngredientImage('data:image/jpeg;base64,test');

    expect(result.success).toBe(true);
    expect(result.ingredients[0].inciName).toBe('정제수');
  });

  it('nameKo와 inciName 모두 없으면 Unknown을 사용한다', async () => {
    const mockResponse = {
      text: JSON.stringify({
        productName: null,
        brandName: null,
        ingredients: [{ order: 1, concentration: 'high' }],
        confidence: 'low',
        language: 'ko',
      }),
    };
    vi.mocked(generateContent).mockResolvedValue(mockResponse as never);

    const result = await analyzeIngredientImage('data:image/jpeg;base64,test');

    expect(result.success).toBe(true);
    expect(result.ingredients[0].inciName).toBe('Unknown');
  });

  it('한국어 농도 표기를 영어로 변환한다', async () => {
    const mockResponse = {
      text: JSON.stringify({
        productName: null,
        brandName: null,
        ingredients: [
          { order: 1, nameKo: '정제수', inciName: 'WATER', concentration: '높음' },
          { order: 2, nameKo: '글리세린', inciName: 'GLYCERIN', concentration: '중간' },
          { order: 3, nameKo: '향료', inciName: 'FRAGRANCE', concentration: '낮음' },
        ],
        confidence: 'high',
        language: 'ko',
      }),
    };
    vi.mocked(generateContent).mockResolvedValue(mockResponse as never);

    const result = await analyzeIngredientImage('data:image/jpeg;base64,test');

    expect(result.ingredients[0].concentration).toBe('high');
    expect(result.ingredients[1].concentration).toBe('medium');
    expect(result.ingredients[2].concentration).toBe('low');
  });

  it('알 수 없는 농도 값은 undefined로 처리한다', async () => {
    const mockResponse = {
      text: JSON.stringify({
        productName: null,
        brandName: null,
        ingredients: [
          { order: 1, nameKo: '정제수', inciName: 'WATER', concentration: 'unknown_value' },
        ],
        confidence: 'medium',
        language: 'ko',
      }),
    };
    vi.mocked(generateContent).mockResolvedValue(mockResponse as never);

    const result = await analyzeIngredientImage('data:image/jpeg;base64,test');

    expect(result.ingredients[0].concentration).toBeUndefined();
  });
});

// =====================================================
// parseIngredientsFromText
// =====================================================

describe('parseIngredientsFromText', () => {
  it('쉼표로 구분된 성분을 파싱한다', () => {
    const text = 'Water, Glycerin, Niacinamide';
    const result = parseIngredientsFromText(text);

    expect(result).toHaveLength(3);
    expect(result[0].inciName).toBe('WATER');
    expect(result[0].order).toBe(1);
    expect(result[1].inciName).toBe('GLYCERIN');
    expect(result[2].inciName).toBe('NIACINAMIDE');
  });

  it('세미콜론으로 구분된 성분을 파싱한다', () => {
    const text = 'Water;Glycerin;Niacinamide';
    const result = parseIngredientsFromText(text);

    expect(result).toHaveLength(3);
  });

  it('슬래시로 구분된 성분을 파싱한다', () => {
    const text = 'Water/Glycerin/Niacinamide';
    const result = parseIngredientsFromText(text);

    expect(result).toHaveLength(3);
  });

  it('한글 쉼표(、)로 구분된 성분을 파싱한다', () => {
    const text = '정제수、글리세린、나이아신아마이드';
    const result = parseIngredientsFromText(text);

    expect(result).toHaveLength(3);
    expect(result[0].inciName).toBe('정제수'.toUpperCase());
  });

  it('빈 문자열은 빈 배열을 반환한다', () => {
    expect(parseIngredientsFromText('')).toEqual([]);
  });

  it('공백만 있으면 빈 배열을 반환한다', () => {
    expect(parseIngredientsFromText('   ')).toEqual([]);
  });

  it('성분 앞뒤 공백을 제거한다', () => {
    const text = '  Water  ,  Glycerin  ';
    const result = parseIngredientsFromText(text);

    expect(result[0].inciName).toBe('WATER');
    expect(result[1].inciName).toBe('GLYCERIN');
  });

  it('빈 항목을 필터링한다', () => {
    const text = 'Water, , Glycerin, , Niacinamide';
    const result = parseIngredientsFromText(text);

    expect(result).toHaveLength(3);
  });

  it('처음 5개 성분은 high 농도를 부여한다', () => {
    const text = 'A, B, C, D, E, F';
    const result = parseIngredientsFromText(text);

    expect(result[0].concentration).toBe('high');
    expect(result[4].concentration).toBe('high');
    expect(result[5].concentration).toBe('medium');
  });

  it('6-15번째 성분은 medium 농도를 부여한다', () => {
    const parts = Array.from({ length: 16 }, (_, i) => `Ingredient${i + 1}`);
    const text = parts.join(', ');
    const result = parseIngredientsFromText(text);

    expect(result[5].concentration).toBe('medium');
    expect(result[14].concentration).toBe('medium');
    expect(result[15].concentration).toBe('low');
  });

  it('16번째 이후 성분은 low 농도를 부여한다', () => {
    const parts = Array.from({ length: 20 }, (_, i) => `Ingredient${i + 1}`);
    const text = parts.join(', ');
    const result = parseIngredientsFromText(text);

    expect(result[15].concentration).toBe('low');
    expect(result[19].concentration).toBe('low');
  });

  it('order는 1부터 시작한다', () => {
    const text = 'Water, Glycerin, Niacinamide';
    const result = parseIngredientsFromText(text);

    expect(result[0].order).toBe(1);
    expect(result[1].order).toBe(2);
    expect(result[2].order).toBe(3);
  });

  it('성분명을 대문자로 변환한다', () => {
    const text = 'water, glycerin, Butylene Glycol';
    const result = parseIngredientsFromText(text);

    expect(result[0].inciName).toBe('WATER');
    expect(result[1].inciName).toBe('GLYCERIN');
    expect(result[2].inciName).toBe('BUTYLENE GLYCOL');
  });
});

// =====================================================
// generateMockOcrResult
// =====================================================

describe('generateMockOcrResult', () => {
  it('유효한 Mock OCR 결과를 생성한다', () => {
    const result = generateMockOcrResult();

    expect(result.success).toBe(true);
    expect(result.productName).toBeDefined();
    expect(result.brandName).toBe('SOME BY MI');
    expect(result.ingredients.length).toBeGreaterThan(0);
    expect(result.confidence).toBe('high');
    expect(result.language).toBe('ko');
  });

  it('성분 목록이 순서대로 정렬되어 있다', () => {
    const result = generateMockOcrResult();

    for (let i = 0; i < result.ingredients.length; i++) {
      expect(result.ingredients[i].order).toBe(i + 1);
    }
  });

  it('각 성분에 inciName과 nameKo가 포함된다', () => {
    const result = generateMockOcrResult();

    for (const ingredient of result.ingredients) {
      expect(ingredient.inciName).toBeDefined();
      expect(ingredient.nameKo).toBeDefined();
      expect(ingredient.inciName.length).toBeGreaterThan(0);
    }
  });

  it('첫 번째 성분은 WATER이다', () => {
    const result = generateMockOcrResult();

    expect(result.ingredients[0].inciName).toBe('WATER');
    expect(result.ingredients[0].nameKo).toBe('정제수');
  });
});
