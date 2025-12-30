/**
 * 식품안전나라 API 연동 테스트
 * lib/nutrition/foodsafetykorea.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lookupFoodSafetyKorea } from '@/lib/nutrition/foodsafetykorea';

describe('Food Safety Korea API', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.FOOD_SAFETY_KOREA_API_KEY;

  beforeEach(() => {
    vi.useFakeTimers();
    process.env.FOOD_SAFETY_KOREA_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    if (originalEnv) {
      process.env.FOOD_SAFETY_KOREA_API_KEY = originalEnv;
    } else {
      delete process.env.FOOD_SAFETY_KOREA_API_KEY;
    }
  });

  it('API 키가 없으면 에러를 반환한다', async () => {
    delete process.env.FOOD_SAFETY_KOREA_API_KEY;

    const result = await lookupFoodSafetyKorea('8801234567890');

    expect(result.found).toBe(false);
    expect(result.error).toBe('API key not configured');
  });

  it('바코드로 제품 정보를 조회한다', async () => {
    const mockResponse = {
      header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
      body: {
        pageNo: 1,
        totalCount: 1,
        numOfRows: 1,
        items: [
          {
            PRDLST_NM: '신라면',
            BSSH_NM: '농심',
            BARCODE: '8801234567890',
            CAPACITY: '120g',
            NUTRI_CONT_INFO: '열량: 500kcal, 탄수화물: 80g, 단백질: 10g, 지방: 16g, 나트륨: 1800mg',
            ALLERGY_INFO: '밀, 대두, 우유',
            PRDLST_DCNM: '라면',
            IMG_URL: 'https://example.com/image.jpg',
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupFoodSafetyKorea('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food).toBeDefined();
    expect(result.food?.name).toBe('신라면');
    expect(result.food?.brand).toBe('농심');
    expect(result.food?.barcode).toBe('8801234567890');
    expect(result.food?.servingSize).toBe(120);
    expect(result.food?.calories).toBe(500);
    expect(result.food?.carbs).toBe(80);
    expect(result.food?.protein).toBe(10);
    expect(result.food?.fat).toBe(16);
    expect(result.food?.sodium).toBe(1800);
    expect(result.food?.allergens).toContain('밀');
    expect(result.food?.category).toBe('라면');
    expect(result.food?.source).toBe('api');
    expect(result.food?.verified).toBe(true); // 공공데이터는 검증됨
  });

  it('제품이 없으면 found: false를 반환한다', async () => {
    const mockResponse = {
      header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
      body: {
        pageNo: 1,
        totalCount: 0,
        numOfRows: 0,
        items: [],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupFoodSafetyKorea('9999999999999');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(false);
  });

  it('API 오류 시 found: false를 반환한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const resultPromise = lookupFoodSafetyKorea('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(false);
    expect(result.error).toContain('API error');
  });

  it('네트워크 오류 시 found: false를 반환한다', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const resultPromise = lookupFoodSafetyKorea('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('타임아웃 시 found: false를 반환한다', async () => {
    global.fetch = vi.fn().mockRejectedValue(
      Object.assign(new Error('Aborted'), { name: 'AbortError' })
    );

    const resultPromise = lookupFoodSafetyKorea('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(false);
    expect(result.error).toBe('API timeout');
  });

  it('내용량 kg을 g으로 변환한다', async () => {
    const mockResponse = {
      header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
      body: {
        pageNo: 1,
        totalCount: 1,
        numOfRows: 1,
        items: [
          {
            PRDLST_NM: '쌀',
            BSSH_NM: '테스트',
            BARCODE: '8801234567890',
            CAPACITY: '2kg',
            NUTRI_CONT_INFO: '열량: 350kcal',
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupFoodSafetyKorea('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food?.servingSize).toBe(2000); // 2kg = 2000g
    expect(result.food?.servingUnit).toBe('g');
  });

  it('내용량 ml을 파싱한다', async () => {
    const mockResponse = {
      header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
      body: {
        pageNo: 1,
        totalCount: 1,
        numOfRows: 1,
        items: [
          {
            PRDLST_NM: '우유',
            BSSH_NM: '서울우유',
            BARCODE: '8801234567890',
            CAPACITY: '200ml',
            NUTRI_CONT_INFO: '열량: 130kcal',
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupFoodSafetyKorea('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food?.servingSize).toBe(200);
    expect(result.food?.servingUnit).toBe('ml');
  });

  it('알레르기 정보가 없으면 undefined를 반환한다', async () => {
    const mockResponse = {
      header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
      body: {
        pageNo: 1,
        totalCount: 1,
        numOfRows: 1,
        items: [
          {
            PRDLST_NM: '테스트 제품',
            BARCODE: '8801234567890',
            CAPACITY: '100g',
            NUTRI_CONT_INFO: '열량: 100kcal',
            ALLERGY_INFO: '해당없음',
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupFoodSafetyKorea('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food?.allergens).toBeUndefined();
  });

  it('영양성분 파싱 시 콜론(:) 포함 형식을 지원한다', async () => {
    const mockResponse = {
      header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
      body: {
        pageNo: 1,
        totalCount: 1,
        numOfRows: 1,
        items: [
          {
            PRDLST_NM: '테스트 제품',
            BARCODE: '8801234567890',
            CAPACITY: '100g',
            NUTRI_CONT_INFO: '열량 : 250kcal, 당류 : 15g, 식이섬유 : 5g',
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const resultPromise = lookupFoodSafetyKorea('8801234567890');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.found).toBe(true);
    expect(result.food?.calories).toBe(250);
    expect(result.food?.sugar).toBe(15);
    expect(result.food?.fiber).toBe(5);
  });
});
