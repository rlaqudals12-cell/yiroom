/**
 * 바코드 서비스 테스트
 * lib/nutrition/barcodeService.ts
 *
 * - 바코드 유효성 검사
 * - 바코드 조회 (API 호출)
 * - 식품 등록
 * - 스캔 이력 조회
 * - 영양 정보 계산
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidBarcode,
  lookupBarcode,
  registerBarcodeFood,
  getBarcodeHistory,
  recordBarcodeFood,
  getSourceLabel,
  calculateNutrition,
} from '@/lib/nutrition/barcodeService';
import type { BarcodeFood } from '@/types/nutrition';

describe('barcodeService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('isValidBarcode', () => {
    it('유효한 EAN-13 바코드를 통과시킨다', () => {
      expect(isValidBarcode('8801234567890')).toBe(true);
    });

    it('유효한 EAN-8 바코드를 통과시킨다', () => {
      expect(isValidBarcode('12345678')).toBe(true);
    });

    it('유효한 UPC-A 바코드를 통과시킨다', () => {
      expect(isValidBarcode('012345678905')).toBe(true);
    });

    it('유효한 ITF-14 바코드를 통과시킨다', () => {
      expect(isValidBarcode('12345678901234')).toBe(true);
    });

    it('너무 짧은 바코드를 거부한다', () => {
      expect(isValidBarcode('1234567')).toBe(false);
    });

    it('너무 긴 바코드를 거부한다', () => {
      expect(isValidBarcode('123456789012345')).toBe(false);
    });

    it('숫자가 아닌 문자가 포함된 바코드를 거부한다', () => {
      expect(isValidBarcode('880123456789a')).toBe(false);
      expect(isValidBarcode('abcdefghijklm')).toBe(false);
    });

    it('빈 문자열을 거부한다', () => {
      expect(isValidBarcode('')).toBe(false);
    });
  });

  describe('lookupBarcode', () => {
    it('유효하지 않은 바코드는 즉시 반환한다', async () => {
      const result = await lookupBarcode('invalid');

      expect(result.found).toBe(false);
      expect(result.message).toContain('유효하지 않은');
    });

    it('API에서 식품을 찾으면 반환한다', async () => {
      const mockFood: BarcodeFood = {
        id: 'food-1',
        barcode: '8801234567890',
        name: '신라면',
        brand: '농심',
        servingSize: 120,
        servingUnit: 'g',
        calories: 500,
        protein: 10,
        carbs: 80,
        fat: 16,
        source: 'api',
        verified: true,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ found: true, food: mockFood, source: 'local' }),
      });

      const result = await lookupBarcode('8801234567890');

      expect(result.found).toBe(true);
      expect(result.food?.name).toBe('신라면');
      expect(result.source).toBe('local');
    });

    it('API에서 미등록 식품이면 found: false를 반환한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            found: false,
            barcode: '9999999999999',
            message: '등록되지 않은 바코드입니다',
          }),
      });

      const result = await lookupBarcode('9999999999999');

      expect(result.found).toBe(false);
      expect(result.barcode).toBe('9999999999999');
    });

    it('API 오류 시 에러 메시지를 반환한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const result = await lookupBarcode('8801234567890');

      expect(result.found).toBe(false);
      expect(result.message).toContain('Server error');
    });

    it('네트워크 오류 시 에러 메시지를 반환한다', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await lookupBarcode('8801234567890');

      expect(result.found).toBe(false);
      expect(result.message).toBe('Network error');
    });
  });

  describe('registerBarcodeFood', () => {
    it('유효하지 않은 바코드는 등록을 거부한다', async () => {
      const result = await registerBarcodeFood({
        barcode: 'invalid',
        name: '테스트',
        servingSize: 100,
        calories: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('유효하지 않은');
    });

    it('필수 필드 누락 시 등록을 거부한다', async () => {
      const result = await registerBarcodeFood({
        barcode: '8801234567890',
        name: '',
        servingSize: 100,
        calories: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('필수');
    });

    it('성공적으로 등록한다', async () => {
      const mockFood: BarcodeFood = {
        id: 'new-food-id',
        barcode: '9999999999999',
        name: '새로운 식품',
        brand: '테스트',
        servingSize: 100,
        servingUnit: 'g',
        calories: 200,
        protein: 5,
        carbs: 30,
        fat: 8,
        source: 'crowdsourced',
        verified: false,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, food: mockFood }),
      });

      const result = await registerBarcodeFood({
        barcode: '9999999999999',
        name: '새로운 식품',
        brand: '테스트',
        servingSize: 100,
        calories: 200,
        protein: 5,
        carbs: 30,
        fat: 8,
      });

      expect(result.success).toBe(true);
      expect(result.food?.name).toBe('새로운 식품');
    });

    it('API 오류 시 실패를 반환한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Already registered' }),
      });

      const result = await registerBarcodeFood({
        barcode: '8801234567890',
        name: '중복 식품',
        servingSize: 100,
        calories: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Already registered');
    });
  });

  describe('getBarcodeHistory', () => {
    it('스캔 이력을 반환한다', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          barcodeFood: {
            id: 'food-1',
            barcode: '8801234567890',
            name: '신라면',
          },
          scannedAt: '2025-01-15T10:00:00Z',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ history: mockHistory }),
      });

      const result = await getBarcodeHistory(10);

      expect(result.history).toHaveLength(1);
      expect(result.history[0].barcodeFood.name).toBe('신라면');
    });

    it('limit 범위를 1~50으로 제한한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ history: [] }),
      });

      await getBarcodeHistory(100);

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('limit=50'));
    });

    it('API 오류 시 빈 배열을 반환한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const result = await getBarcodeHistory();

      expect(result.history).toEqual([]);
      expect(result.error).toContain('Server error');
    });
  });

  describe('recordBarcodeFood', () => {
    const mockFood: BarcodeFood = {
      id: 'food-1',
      barcode: '8801234567890',
      name: '신라면',
      brand: '농심',
      servingSize: 120,
      servingUnit: 'g',
      calories: 500,
      protein: 10,
      carbs: 80,
      fat: 16,
      fiber: 3,
      sodium: 1790,
      sugar: 4,
      source: 'manual',
      verified: true,
    };

    it('식사 기록을 성공적으로 저장한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await recordBarcodeFood(mockFood, 1, 'lunch');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/nutrition/meals',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('섭취량에 따라 영양 정보를 조정한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await recordBarcodeFood(mockFood, 2, 'dinner');

      const calls = vi.mocked(global.fetch).mock.calls;
      const body = JSON.parse(calls[0][1]?.body as string);

      expect(body.foods[0].calories).toBe(1000); // 500 × 2
      expect(body.foods[0].protein).toBe(20); // 10 × 2
    });

    it('API 오류 시 실패를 반환한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: '기록 실패' }),
      });

      const result = await recordBarcodeFood(mockFood, 1, 'breakfast');

      expect(result.success).toBe(false);
      expect(result.error).toContain('기록 실패');
    });
  });

  describe('getSourceLabel', () => {
    it('알려진 소스에 대해 라벨을 반환한다', () => {
      expect(getSourceLabel('local')).toBe('로컬 DB');
      expect(getSourceLabel('openfoodfacts')).toBe('Open Food Facts');
      expect(getSourceLabel('foodsafetykorea')).toBe('식품안전나라');
      expect(getSourceLabel('crowdsourced')).toBe('사용자 등록');
      expect(getSourceLabel('api')).toBe('API');
      expect(getSourceLabel('manual')).toBe('수동 등록');
    });

    it('알 수 없는 소스는 그대로 반환한다', () => {
      expect(getSourceLabel('unknown')).toBe('unknown');
    });
  });

  describe('calculateNutrition', () => {
    const mockFood: BarcodeFood = {
      id: 'food-1',
      barcode: '8801234567890',
      name: '테스트 식품',
      servingSize: 100,
      servingUnit: 'g',
      calories: 100,
      protein: 10,
      carbs: 20,
      fat: 5,
      fiber: 3,
      sodium: 500,
      sugar: 8,
      source: 'manual',
      verified: true,
    };

    it('1인분 영양 정보를 계산한다', () => {
      const result = calculateNutrition(mockFood, 1);

      expect(result.calories).toBe(100);
      expect(result.protein).toBe(10);
      expect(result.carbs).toBe(20);
      expect(result.fat).toBe(5);
      expect(result.fiber).toBe(3);
      expect(result.sodium).toBe(500);
      expect(result.sugar).toBe(8);
    });

    it('2인분 영양 정보를 계산한다', () => {
      const result = calculateNutrition(mockFood, 2);

      expect(result.calories).toBe(200);
      expect(result.protein).toBe(20);
      expect(result.carbs).toBe(40);
      expect(result.fat).toBe(10);
    });

    it('0.5인분 영양 정보를 계산한다', () => {
      const result = calculateNutrition(mockFood, 0.5);

      expect(result.calories).toBe(50);
      expect(result.protein).toBe(5);
      expect(result.carbs).toBe(10);
      expect(result.fat).toBe(3); // Math.round(2.5) = 3
    });

    it('선택적 영양소가 없으면 undefined를 반환한다', () => {
      const foodWithoutOptional: BarcodeFood = {
        ...mockFood,
        fiber: undefined,
        sodium: undefined,
        sugar: undefined,
      };

      const result = calculateNutrition(foodWithoutOptional, 1);

      expect(result.fiber).toBeUndefined();
      expect(result.sodium).toBeUndefined();
      expect(result.sugar).toBeUndefined();
    });
  });
});
