/**
 * 바코드 서비스 + Open Food Facts 클라이언트 테스트
 * 바코드 유효성 검사, 식품 조회, 식사 기록 저장, 영양 계산 검증
 */

import {
  isValidBarcode,
  lookupBarcode,
  recordBarcodeFood,
  calculateNutrition,
  getSourceLabel,
  type BarcodeFood,
} from '../../../lib/nutrition/barcodeService';
import { lookupOpenFoodFacts } from '../../../lib/nutrition/openFoodFactsClient';

// =============================================================================
// Mock 설정
// =============================================================================

// fetch 글로벌 모킹
const mockFetch = jest.fn();
global.fetch = mockFetch;

// AbortController 모킹
const mockAbort = jest.fn();
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: 'mock-signal',
  abort: mockAbort,
})) as unknown as typeof AbortController;

// 로거 모킹
jest.mock('../../../lib/utils/logger', () => ({
  nutritionLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// lookupOpenFoodFacts 모킹 (lookupBarcode 테스트에서 사용)
// barcodeService 내부에서 import하는 openFoodFactsClient를 모킹
jest.mock('../../../lib/nutrition/openFoodFactsClient', () => {
  const actual = jest.requireActual('../../../lib/nutrition/openFoodFactsClient');
  return {
    ...actual,
    lookupOpenFoodFacts: jest.fn(),
  };
});

const mockLookupOpenFoodFacts = lookupOpenFoodFacts as jest.MockedFunction<
  typeof lookupOpenFoodFacts
>;

// 실제 lookupOpenFoodFacts 함수 참조 (openFoodFactsClient 직접 테스트용)
const {
  lookupOpenFoodFacts: realLookupOpenFoodFacts,
} = jest.requireActual('../../../lib/nutrition/openFoodFactsClient') as typeof import('../../../lib/nutrition/openFoodFactsClient');

// 타이머 정리 (lookupOpenFoodFacts의 setTimeout 정리)
afterEach(() => {
  jest.clearAllTimers();
});

// =============================================================================
// Supabase 목 생성 헬퍼
// =============================================================================
function createMockSupabase() {
  const mockSingle = jest.fn();
  const mockInsert = jest.fn();
  const mockUpsert = jest.fn();
  const mockEq = jest.fn();
  const mockSelect = jest.fn();

  // 체인: from().select().eq().single()
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle });

  return {
    supabase: {
      from: jest.fn().mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        upsert: mockUpsert,
      }),
    } as unknown as import('@supabase/supabase-js').SupabaseClient,
    mockSingle,
    mockInsert,
    mockUpsert,
    mockSelect,
    mockEq,
  };
}

// =============================================================================
// 테스트 데이터 팩토리
// =============================================================================
function createMockBarcodeFood(overrides: Partial<BarcodeFood> = {}): BarcodeFood {
  return {
    id: 'off_8801234567890',
    barcode: '8801234567890',
    name: '신라면',
    brand: '농심',
    servingSize: 100,
    servingUnit: 'g',
    calories: 500,
    protein: 10,
    carbs: 70,
    fat: 20,
    sugar: 5,
    fiber: 3,
    sodium: 1800,
    source: 'api',
    verified: false,
    ...overrides,
  };
}

// =============================================================================
// isValidBarcode 테스트
// =============================================================================
describe('isValidBarcode', () => {
  describe('유효한 바코드', () => {
    it('EAN-13 (13자리 숫자)를 유효하다고 판단한다', () => {
      expect(isValidBarcode('8801234567890')).toBe(true);
    });

    it('EAN-8 (8자리 숫자)를 유효하다고 판단한다', () => {
      expect(isValidBarcode('12345678')).toBe(true);
    });

    it('UPC-A (12자리 숫자)를 유효하다고 판단한다', () => {
      expect(isValidBarcode('012345678901')).toBe(true);
    });

    it('14자리 숫자도 유효하다고 판단한다', () => {
      expect(isValidBarcode('12345678901234')).toBe(true);
    });
  });

  describe('유효하지 않은 바코드', () => {
    it('7자리 (너무 짧은) 숫자를 거부한다', () => {
      expect(isValidBarcode('1234567')).toBe(false);
    });

    it('15자리 (너무 긴) 숫자를 거부한다', () => {
      expect(isValidBarcode('123456789012345')).toBe(false);
    });

    it('문자가 포함된 입력을 거부한다', () => {
      expect(isValidBarcode('880123456789a')).toBe(false);
    });

    it('빈 문자열을 거부한다', () => {
      expect(isValidBarcode('')).toBe(false);
    });

    it('공백이 포함된 입력을 거부한다', () => {
      expect(isValidBarcode('8801 2345678')).toBe(false);
    });

    it('특수문자가 포함된 입력을 거부한다', () => {
      expect(isValidBarcode('880123456-890')).toBe(false);
    });
  });
});

// =============================================================================
// lookupOpenFoodFacts 테스트 (실제 함수 — requireActual로 직접 테스트)
// =============================================================================
describe('lookupOpenFoodFacts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('한국어 이름이 있으면 한국어 이름을 사용한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Shin Ramyun',
          product_name_ko: '신라면',
          brands: '농심',
          serving_quantity: 120,
          nutriments: {
            'energy-kcal_100g': 450,
            proteins_100g: 9,
            carbohydrates_100g: 62,
            fat_100g: 18,
            sugars_100g: 4,
            fiber_100g: 3,
            sodium_100g: 0.72,
          },
          image_front_small_url: 'https://example.com/shin.jpg',
          categories: '라면, 인스턴트',
          allergens_tags: ['en:gluten', 'ko:대두'],
        },
      }),
    });

    const result = await realLookupOpenFoodFacts('8801234567890');

    expect(result.found).toBe(true);
    expect(result.food?.name).toBe('신라면');
    expect(result.food?.brand).toBe('농심');
    expect(result.food?.servingSize).toBe(120);
    expect(result.food?.calories).toBe(450);
    expect(result.food?.protein).toBe(9);
    expect(result.food?.carbs).toBe(62);
    expect(result.food?.fat).toBe(18);
    expect(result.food?.source).toBe('api');
    expect(result.food?.verified).toBe(false);
  });

  it('한국어 이름이 없으면 영어 이름으로 대체한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Coca Cola',
          nutriments: {
            'energy-kcal_100g': 42,
            proteins_100g: 0,
            carbohydrates_100g: 10.6,
            fat_100g: 0,
          },
        },
      }),
    });

    const result = await realLookupOpenFoodFacts('5449000000996');

    expect(result.found).toBe(true);
    expect(result.food?.name).toBe('Coca Cola');
  });

  it('API 타임아웃 시 적절한 에러를 반환한다', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await realLookupOpenFoodFacts('8801234567890');

    expect(result.found).toBe(false);
    expect(result.error).toBe('조회 시간이 초과되었어요');
  });

  it('HTTP 에러 응답을 처리한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await realLookupOpenFoodFacts('8801234567890');

    expect(result.found).toBe(false);
    expect(result.error).toBe('API error: 500');
  });

  it('제품을 찾지 못한 경우 (status !== 1)를 처리한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 0,
        product: null,
      }),
    });

    const result = await realLookupOpenFoodFacts('0000000000000');

    expect(result.found).toBe(false);
    expect(result.error).toBeUndefined();
  });

  it('제품 이름과 칼로리가 모두 없으면 정보 부족 에러를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          // product_name 없음, energy-kcal 없음
          nutriments: {},
        },
      }),
    });

    const result = await realLookupOpenFoodFacts('8801234567890');

    expect(result.found).toBe(false);
    expect(result.error).toBe('제품 정보가 부족해요');
  });

  it('sodium_100g 값을 mg 단위로 변환한다 (*1000)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: '소금물',
          nutriments: {
            'energy-kcal_100g': 0,
            sodium_100g: 0.5,
          },
        },
      }),
    });

    const result = await realLookupOpenFoodFacts('1234567890123');

    expect(result.found).toBe(true);
    expect(result.food?.sodium).toBe(500); // 0.5g * 1000 = 500mg
  });

  it('sodium이 없고 salt_100g이 있으면 mg로 변환한다 (*400)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: '소금빵',
          nutriments: {
            'energy-kcal_100g': 280,
            proteins_100g: 8,
            carbohydrates_100g: 45,
            fat_100g: 8,
            salt_100g: 1.5,
          },
        },
      }),
    });

    const result = await realLookupOpenFoodFacts('1234567890123');

    expect(result.found).toBe(true);
    expect(result.food?.sodium).toBe(600); // 1.5g * 400 = 600mg
  });

  it('일반 에러를 처리한다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await realLookupOpenFoodFacts('8801234567890');

    expect(result.found).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('알 수 없는 에러 타입을 처리한다', async () => {
    mockFetch.mockRejectedValueOnce('unexpected error');

    const result = await realLookupOpenFoodFacts('8801234567890');

    expect(result.found).toBe(false);
    expect(result.error).toBe('알 수 없는 오류');
  });

  it('allergens_tags에서 언어 접두사를 제거한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: '과자',
          nutriments: { 'energy-kcal_100g': 500 },
          allergens_tags: ['en:gluten', 'en:milk', 'ko:대두'],
        },
      }),
    });

    const result = await realLookupOpenFoodFacts('1234567890123');

    expect(result.found).toBe(true);
    expect(result.food?.allergens).toEqual(['gluten', 'milk', '대두']);
  });

  it('카테고리 첫 번째 항목만 사용한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: '초코바',
          nutriments: { 'energy-kcal_100g': 530 },
          categories: '과자, 초콜릿, 스낵',
        },
      }),
    });

    const result = await realLookupOpenFoodFacts('1234567890123');

    expect(result.found).toBe(true);
    expect(result.food?.category).toBe('과자');
  });
});

// =============================================================================
// lookupBarcode 테스트
// =============================================================================
describe('lookupBarcode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('유효하지 않은 바코드에 대해 에러를 반환한다', async () => {
    const { supabase } = createMockSupabase();

    const result = await lookupBarcode('invalid', supabase);

    expect(result.found).toBe(false);
    expect(result.error).toBe('유효하지 않은 바코드 형식이에요');
  });

  it('로컬 DB에서 식품을 찾으면 로컬 결과를 반환한다', async () => {
    const { supabase, mockSingle } = createMockSupabase();

    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'local_123',
        barcode: '8801234567890',
        name: '신라면',
        brand: '농심',
        serving_size: 120,
        calories: 500,
        protein: 10,
        carbs: 70,
        fat: 20,
        sugar: 5,
        fiber: 3,
        sodium: 1800,
        image_url: null,
        category: '라면',
        source: 'local',
        verified: true,
      },
      error: null,
    });

    const result = await lookupBarcode('8801234567890', supabase);

    expect(result.found).toBe(true);
    expect(result.food?.name).toBe('신라면');
    expect(result.food?.source).toBe('local');
    expect(result.food?.verified).toBe(true);
    // OpenFoodFacts API는 호출되지 않아야 한다
    expect(mockLookupOpenFoodFacts).not.toHaveBeenCalled();
  });

  it('로컬 DB에 없으면 OpenFoodFacts API를 호출한다', async () => {
    const { supabase, mockSingle } = createMockSupabase();
    const mockFood = createMockBarcodeFood();

    // 로컬 DB에 없음
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    // API에서 찾음
    mockLookupOpenFoodFacts.mockResolvedValueOnce({
      found: true,
      food: mockFood,
    });

    const result = await lookupBarcode('8801234567890', supabase);

    expect(result.found).toBe(true);
    expect(result.food?.name).toBe('신라면');
    expect(mockLookupOpenFoodFacts).toHaveBeenCalledWith('8801234567890');
  });

  it('API 결과를 로컬 DB에 캐시 저장한다 (upsert 호출)', async () => {
    const { supabase, mockSingle, mockUpsert } = createMockSupabase();
    const mockFood = createMockBarcodeFood();

    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    mockLookupOpenFoodFacts.mockResolvedValueOnce({
      found: true,
      food: mockFood,
    });
    mockUpsert.mockResolvedValueOnce({ data: null, error: null });

    await lookupBarcode('8801234567890', supabase);

    // upsert가 비동기로 호출되므로 잠시 대기
    await new Promise((resolve) => setTimeout(resolve, 10));

    // from('barcode_foods')가 호출되었는지 확인
    const fromCalls = (supabase.from as jest.Mock).mock.calls;
    const barcodeFoodsCalls = fromCalls.filter(
      (call: string[]) => call[0] === 'barcode_foods'
    );
    expect(barcodeFoodsCalls.length).toBeGreaterThanOrEqual(2); // select + upsert
  });

  it('DB 에러를 우아하게 처리한다', async () => {
    const { supabase } = createMockSupabase();

    // Supabase에서 throw 발생 시뮬레이션
    (supabase.from as jest.Mock).mockImplementationOnce(() => {
      throw new Error('DB connection error');
    });

    const result = await lookupBarcode('8801234567890', supabase);

    expect(result.found).toBe(false);
    expect(result.error).toBe('조회 중 오류가 발생했어요');
  });

  it('API에서 못 찾은 경우 found: false를 전달한다', async () => {
    const { supabase, mockSingle } = createMockSupabase();

    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    mockLookupOpenFoodFacts.mockResolvedValueOnce({ found: false });

    const result = await lookupBarcode('8801234567890', supabase);

    expect(result.found).toBe(false);
  });
});

// =============================================================================
// recordBarcodeFood 테스트
// =============================================================================
describe('recordBarcodeFood', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('올바른 데이터 구조로 meal_records에 저장한다', async () => {
    const { supabase, mockInsert } = createMockSupabase();
    const food = createMockBarcodeFood({ calories: 500, protein: 10, carbs: 70, fat: 20 });

    mockInsert.mockResolvedValueOnce({ data: null, error: null });

    const result = await recordBarcodeFood(supabase, food, 1, 'lunch');

    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('meal_records');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        meal_type: 'lunch',
        record_type: 'barcode',
        total_calories: 500,
        foods: expect.arrayContaining([
          expect.objectContaining({
            name: '신라면',
            barcode: '8801234567890',
            calories: 500,
            protein: 10,
            carbs: 70,
            fat: 20,
          }),
        ]),
      })
    );
  });

  it('서빙 배수를 적용하여 영양 정보를 계산한다', async () => {
    const { supabase, mockInsert } = createMockSupabase();
    const food = createMockBarcodeFood({ calories: 200, protein: 8, carbs: 30, fat: 5 });

    mockInsert.mockResolvedValueOnce({ data: null, error: null });

    const result = await recordBarcodeFood(supabase, food, 2, 'dinner');

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        total_calories: 400, // 200 * 2
        foods: expect.arrayContaining([
          expect.objectContaining({
            calories: 400, // 200 * 2
            protein: 16, // 8 * 2
            carbs: 60, // 30 * 2
            fat: 10, // 5 * 2
          }),
        ]),
      })
    );
  });

  it('저장 실패 시 에러를 반환한다', async () => {
    const { supabase, mockInsert } = createMockSupabase();
    const food = createMockBarcodeFood();

    mockInsert.mockResolvedValueOnce({
      data: null,
      error: { message: 'Insert failed', code: '42P01' },
    });

    const result = await recordBarcodeFood(supabase, food, 1, 'breakfast');

    expect(result.success).toBe(false);
    expect(result.error).toBe('기록 저장에 실패했어요');
  });

  it('예외 발생 시 에러를 반환한다', async () => {
    const { supabase } = createMockSupabase();
    const food = createMockBarcodeFood();

    (supabase.from as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Network error');
    });

    const result = await recordBarcodeFood(supabase, food, 1, 'snack');

    expect(result.success).toBe(false);
    expect(result.error).toBe('기록 저장에 실패했어요');
  });
});

// =============================================================================
// calculateNutrition 테스트
// =============================================================================
describe('calculateNutrition', () => {
  const baseFoodFor = (overrides: Partial<BarcodeFood> = {}): BarcodeFood =>
    createMockBarcodeFood({
      calories: 250,
      protein: 12,
      carbs: 35,
      fat: 8,
      ...overrides,
    });

  it('1 서빙에 대해 원래 값을 반환한다', () => {
    const food = baseFoodFor();
    const result = calculateNutrition(food, 1);

    expect(result).toEqual({
      calories: 250,
      protein: 12,
      carbs: 35,
      fat: 8,
    });
  });

  it('0.5 서빙에 대해 절반 값을 반환한다', () => {
    const food = baseFoodFor({ calories: 300, protein: 20, carbs: 40, fat: 10 });
    const result = calculateNutrition(food, 0.5);

    expect(result).toEqual({
      calories: 150,
      protein: 10,
      carbs: 20,
      fat: 5,
    });
  });

  it('3 서빙에 대해 3배 값을 반환한다', () => {
    const food = baseFoodFor({ calories: 100, protein: 5, carbs: 15, fat: 3 });
    const result = calculateNutrition(food, 3);

    expect(result).toEqual({
      calories: 300,
      protein: 15,
      carbs: 45,
      fat: 9,
    });
  });

  it('소수점 결과를 반올림한다', () => {
    const food = baseFoodFor({ calories: 133, protein: 7, carbs: 19, fat: 5 });
    const result = calculateNutrition(food, 0.3);

    // 133 * 0.3 = 39.9 → 40
    // 7 * 0.3 = 2.1 → 2
    // 19 * 0.3 = 5.7 → 6
    // 5 * 0.3 = 1.5 → 2
    expect(result).toEqual({
      calories: Math.round(133 * 0.3),
      protein: Math.round(7 * 0.3),
      carbs: Math.round(19 * 0.3),
      fat: Math.round(5 * 0.3),
    });
  });

  it('0 서빙에 대해 0을 반환한다', () => {
    const food = baseFoodFor();
    const result = calculateNutrition(food, 0);

    expect(result).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });
});

// =============================================================================
// getSourceLabel 테스트
// =============================================================================
describe('getSourceLabel', () => {
  it('local 소스에 "로컬 DB"를 반환한다', () => {
    expect(getSourceLabel('local')).toBe('로컬 DB');
  });

  it('api 소스에 "Open Food Facts"를 반환한다', () => {
    expect(getSourceLabel('api')).toBe('Open Food Facts');
  });

  it('crowdsourced 소스에 "사용자 등록"을 반환한다', () => {
    expect(getSourceLabel('crowdsourced')).toBe('사용자 등록');
  });

  it('알 수 없는 소스에 원본 문자열을 반환한다', () => {
    expect(getSourceLabel('unknown_source')).toBe('unknown_source');
  });

  it('빈 문자열에 빈 문자열을 반환한다', () => {
    expect(getSourceLabel('')).toBe('');
  });
});
