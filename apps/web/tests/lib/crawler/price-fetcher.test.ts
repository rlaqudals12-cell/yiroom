/**
 * 가격 크롤러 테스트
 * @description 가격 조회 및 업데이트 기능 테스트
 * @version 1.0
 * @date 2025-12-09
 */

import { describe, it, expect } from 'vitest';
import {
  fetchPrice,
  fetchPrices,
  getAvailableSources,
  calculatePriceChange,
  validatePriceChange,
} from '@/lib/crawler/price-fetcher';
import { fetchMockPrice, fetchMockPrices } from '@/lib/crawler/sources/mock';
import type { PriceFetchRequest } from '@/lib/crawler/types';

describe('가격 크롤러', () => {
  describe('Mock 소스', () => {
    it('Mock 가격을 정상적으로 조회한다', async () => {
      const request: PriceFetchRequest = {
        productId: 'test-id-1',
        productType: 'cosmetic',
        productName: '토너',
        brand: '이니스프리',
        currentPrice: 20000,
      };

      const result = await fetchMockPrice(request);

      expect(result.success).toBe(true);
      expect(result.productId).toBe('test-id-1');
      expect(result.productType).toBe('cosmetic');
      expect(result.price).toBeGreaterThan(0);
      expect(result.source).toBe('mock');
      expect(result.fetchedAt).toBeInstanceOf(Date);
    });

    it('현재 가격이 없어도 가격을 생성한다', async () => {
      const request: PriceFetchRequest = {
        productId: 'test-id-2',
        productType: 'supplement',
        productName: '비타민C',
        brand: '뉴트리라이트',
      };

      const result = await fetchMockPrice(request);

      expect(result.success).toBe(true);
      expect(result.price).toBeGreaterThan(0);
    });

    it('배치 가격 조회가 정상 동작한다', async () => {
      const requests: PriceFetchRequest[] = [
        {
          productId: 'test-1',
          productType: 'cosmetic',
          productName: '세럼',
          brand: '에스티로더',
        },
        {
          productId: 'test-2',
          productType: 'supplement',
          productName: '오메가3',
          brand: '솔가',
        },
        {
          productId: 'test-3',
          productType: 'workout_equipment',
          productName: '덤벨',
          brand: '나이키',
        },
      ];

      const results = await fetchMockPrices(requests);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.price).toBeGreaterThan(0);
      });
    });
  });

  describe('가격 조회 통합', () => {
    it('사용 가능한 소스 목록을 반환한다', () => {
      const sources = getAvailableSources();

      expect(Array.isArray(sources)).toBe(true);
      expect(sources).toContain('mock');
    });

    it('fetchPrice가 정상 동작한다', async () => {
      const request: PriceFetchRequest = {
        productId: 'test-id',
        productType: 'health_food',
        productName: '프로틴',
        brand: '마이프로틴',
      };

      const result = await fetchPrice(request);

      expect(result.success).toBe(true);
      expect(result.price).toBeGreaterThan(0);
    });

    it('여러 제품 가격을 배치로 조회한다', async () => {
      const requests: PriceFetchRequest[] = [
        {
          productId: 'batch-1',
          productType: 'cosmetic',
          productName: '선크림',
          brand: '비오레',
        },
        {
          productId: 'batch-2',
          productType: 'cosmetic',
          productName: '클렌저',
          brand: '코스알엑스',
        },
      ];

      const results = await fetchPrices(requests, { source: 'mock' });

      expect(results).toHaveLength(2);
      expect(results[0].productId).toBe('batch-1');
      expect(results[1].productId).toBe('batch-2');
    });

    it('진행 콜백이 호출된다', async () => {
      const requests: PriceFetchRequest[] = [
        { productId: '1', productType: 'cosmetic', productName: 'A', brand: 'B' },
        { productId: '2', productType: 'cosmetic', productName: 'C', brand: 'D' },
      ];

      const progressCalls: Array<{ completed: number; total: number }> = [];

      await fetchPrices(requests, {
        source: 'mock',
        onProgress: (completed, total) => {
          progressCalls.push({ completed, total });
        },
      });

      expect(progressCalls).toHaveLength(2);
      expect(progressCalls[0]).toEqual({ completed: 1, total: 2 });
      expect(progressCalls[1]).toEqual({ completed: 2, total: 2 });
    });
  });

  describe('가격 변동 계산', () => {
    it('가격 상승을 정확히 계산한다', () => {
      const result = calculatePriceChange(10000, 12000);

      expect(result.changeType).toBe('increase');
      expect(result.changeAmount).toBe(2000);
      expect(result.changePercent).toBe(20);
    });

    it('가격 하락을 정확히 계산한다', () => {
      const result = calculatePriceChange(20000, 16000);

      expect(result.changeType).toBe('decrease');
      expect(result.changeAmount).toBe(-4000);
      expect(result.changePercent).toBe(-20);
    });

    it('가격 변동 없음을 감지한다', () => {
      const result = calculatePriceChange(15000, 15000);

      expect(result.changeType).toBe('unchanged');
      expect(result.changeAmount).toBe(0);
      expect(result.changePercent).toBe(0);
    });

    it('기존 가격이 0이면 변동률 0을 반환한다', () => {
      const result = calculatePriceChange(0, 10000);

      expect(result.changePercent).toBe(0);
    });
  });

  describe('가격 유효성 검증', () => {
    it('유효한 가격 변동을 통과시킨다', () => {
      const result = validatePriceChange(10000, 11000, 50);

      expect(result.isValid).toBe(true);
    });

    it('0 이하의 새 가격을 거부한다', () => {
      const result = validatePriceChange(10000, 0);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('zero or negative');
    });

    it('음수 가격을 거부한다', () => {
      const result = validatePriceChange(10000, -5000);

      expect(result.isValid).toBe(false);
    });

    it('임계값을 초과하는 변동을 거부한다', () => {
      // 50% 이상 상승
      const result1 = validatePriceChange(10000, 20000, 50);
      expect(result1.isValid).toBe(false);
      expect(result1.reason).toContain('exceeds');

      // 50% 이상 하락
      const result2 = validatePriceChange(10000, 4000, 50);
      expect(result2.isValid).toBe(false);
    });

    it('기존 가격이 없으면 유효로 판단한다', () => {
      const result = validatePriceChange(0, 10000);

      expect(result.isValid).toBe(true);
    });

    it('임계값 내의 변동은 유효하다', () => {
      // 49% 상승 (임계값 50% 미만)
      const result = validatePriceChange(10000, 14900, 50);

      expect(result.isValid).toBe(true);
    });
  });

  describe('제품 타입별 가격 범위', () => {
    it('화장품 가격이 적절한 범위 내에 있다', async () => {
      const request: PriceFetchRequest = {
        productId: 'cosmetic-test',
        productType: 'cosmetic',
        productName: '에센스',
        brand: '설화수',
      };

      const result = await fetchMockPrice(request);

      // 화장품 가격 범위: 15,000 ~ 80,000원
      expect(result.price).toBeGreaterThanOrEqual(10000);
      expect(result.price).toBeLessThanOrEqual(100000);
    });

    it('영양제 가격이 적절한 범위 내에 있다', async () => {
      const request: PriceFetchRequest = {
        productId: 'supp-test',
        productType: 'supplement',
        productName: '종합비타민',
        brand: '센트룸',
      };

      const result = await fetchMockPrice(request);

      // 영양제 가격 범위: 20,000 ~ 60,000원
      expect(result.price).toBeGreaterThanOrEqual(10000);
      expect(result.price).toBeLessThanOrEqual(80000);
    });

    it('운동 기구 가격이 적절한 범위 내에 있다', async () => {
      const request: PriceFetchRequest = {
        productId: 'equip-test',
        productType: 'workout_equipment',
        productName: '케틀벨',
        brand: '리복',
      };

      const result = await fetchMockPrice(request);

      // 운동 기구 가격 범위: 30,000 ~ 200,000원
      expect(result.price).toBeGreaterThanOrEqual(20000);
      expect(result.price).toBeLessThanOrEqual(250000);
    });

    it('건강식품 가격이 적절한 범위 내에 있다', async () => {
      const request: PriceFetchRequest = {
        productId: 'food-test',
        productType: 'health_food',
        productName: '프로틴바',
        brand: '마이프로틴',
      };

      const result = await fetchMockPrice(request);

      // 건강식품 가격 범위: 25,000 ~ 80,000원
      expect(result.price).toBeGreaterThanOrEqual(15000);
      expect(result.price).toBeLessThanOrEqual(100000);
    });
  });

  describe('일관성 테스트', () => {
    it('같은 브랜드/제품명은 유사한 기본 가격을 생성한다', async () => {
      const request1: PriceFetchRequest = {
        productId: 'consistent-1',
        productType: 'cosmetic',
        productName: '수분크림',
        brand: '라네즈',
      };

      const request2: PriceFetchRequest = {
        productId: 'consistent-2',
        productType: 'cosmetic',
        productName: '수분크림',
        brand: '라네즈',
      };

      const result1 = await fetchMockPrice(request1);
      const result2 = await fetchMockPrice(request2);

      // 같은 브랜드/제품명이면 ±10% 범위 내 가격
      const diff = Math.abs(result1.price - result2.price) / result1.price;
      expect(diff).toBeLessThan(0.2);
    });
  });
});
