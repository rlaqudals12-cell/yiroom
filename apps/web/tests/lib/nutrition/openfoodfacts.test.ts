/**
 * Open Food Facts API 연동 테스트
 * lib/nutrition/openfoodfacts.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lookupOpenFoodFacts } from '@/lib/nutrition/openfoodfacts';

describe('Open Food Facts API', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
  });

  it('바코드로 제품 정보를 조회한다', async () => {
    const mockResponse = {
      status: 1,
      product: {
        code: '8801234567890',
        product_name: '신라면',
        brands: '농심',
        serving_quantity: 120,
        nutriments: {
          'energy-kcal_100g': 450,
          proteins_100g: 8.5,
          carbohydrates_100g: 65,
          fat_100g: 17,
          sugars_100g: 3.5,
          fiber_100g: 2.5,
          salt_100g: 1.8,
        },
        image_front_url: 'https://example.com/image.jpg',
        categories: 'Instant noodles, Ramen',
        allergens_tags: ['en:wheat', 'en:eggs'],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food).toBeDefined();
    expect(result.food?.name).toBe('신라면');
    expect(result.food?.brand).toBe('농심');
    expect(result.food?.barcode).toBe('8801234567890');
    expect(result.food?.servingSize).toBe(120);
    expect(result.food?.calories).toBe(450); // 100g 기준
    expect(result.food?.source).toBe('api');
    expect(result.food?.verified).toBe(false);
    expect(result.food?.allergens).toContain('wheat');
  });

  it('제품이 없으면 found: false를 반환한다', async () => {
    const mockResponse = {
      status: 0,
      status_verbose: 'product not found',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupOpenFoodFacts('9999999999999');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(false);
    expect(result.food).toBeUndefined();
  });

  it('제품명과 칼로리 모두 없으면 found: false를 반환한다', async () => {
    const mockResponse = {
      status: 1,
      product: {
        code: '8801234567890',
        // product_name 없음, energy-kcal 없음
        nutriments: {},
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(false);
    expect(result.error).toContain('Insufficient');
  });

  it('API 오류 시 found: false를 반환한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(false);
    expect(result.error).toContain('API error');
  });

  it('네트워크 오류 시 found: false를 반환한다', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('타임아웃 시 found: false를 반환한다', async () => {
    // AbortError를 발생시키는 fetch 시뮬레이션
    global.fetch = vi.fn().mockRejectedValue(
      Object.assign(new Error('Aborted'), { name: 'AbortError' })
    );

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(false);
    expect(result.error).toBe('API timeout');
  });

  it('salt_100g를 sodium으로 변환한다 (g×400→mg)', async () => {
    const mockResponse = {
      status: 1,
      product: {
        code: '8801234567890',
        product_name: '테스트 제품',
        nutriments: {
          'energy-kcal_100g': 100,
          salt_100g: 2.5, // 2.5g salt × 400 = 1000mg sodium
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food?.sodium).toBe(1000); // 2.5 × 400 = 1000mg
  });

  it('sodium_100g가 있으면 g→mg로 변환한다', async () => {
    const mockResponse = {
      status: 1,
      product: {
        code: '8801234567890',
        product_name: '테스트 제품',
        nutriments: {
          'energy-kcal_100g': 100,
          sodium_100g: 0.5, // 0.5g = 500mg
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food?.sodium).toBe(500); // 0.5 × 1000 = 500mg
  });

  it('한국어 제품명을 우선 사용한다', async () => {
    const mockResponse = {
      status: 1,
      product: {
        code: '8801234567890',
        product_name: 'Shin Ramyun',
        product_name_ko: '신라면',
        nutriments: {
          'energy-kcal_100g': 100,
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food?.name).toBe('신라면'); // 한국어 우선
  });

  it('serving_quantity가 없으면 기본값 100을 사용한다', async () => {
    const mockResponse = {
      status: 1,
      product: {
        code: '8801234567890',
        product_name: '테스트 제품',
        // serving_quantity 없음
        nutriments: {
          'energy-kcal_100g': 100,
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food?.servingSize).toBe(100);
  });

  it('영양소 값을 반올림한다', async () => {
    const mockResponse = {
      status: 1,
      product: {
        code: '8801234567890',
        product_name: '테스트 제품',
        nutriments: {
          'energy-kcal_100g': 123.456,
          proteins_100g: 8.7,
          carbohydrates_100g: 65.3,
          fat_100g: 17.9,
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food?.calories).toBe(123);
    expect(result.food?.protein).toBe(9);
    expect(result.food?.carbs).toBe(65);
    expect(result.food?.fat).toBe(18);
  });

  it('카테고리 첫 번째 값만 사용한다', async () => {
    const mockResponse = {
      status: 1,
      product: {
        code: '8801234567890',
        product_name: '테스트 제품',
        categories: 'Instant noodles, Ramen, Korean food',
        nutriments: {
          'energy-kcal_100g': 100,
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food?.category).toBe('Instant noodles');
  });

  it('image_front_small_url을 우선 사용한다', async () => {
    const mockResponse = {
      status: 1,
      product: {
        code: '8801234567890',
        product_name: '테스트 제품',
        image_front_url: 'https://example.com/large.jpg',
        image_front_small_url: 'https://example.com/small.jpg',
        nutriments: {
          'energy-kcal_100g': 100,
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupOpenFoodFacts('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food?.imageUrl).toBe('https://example.com/small.jpg');
  });
});
