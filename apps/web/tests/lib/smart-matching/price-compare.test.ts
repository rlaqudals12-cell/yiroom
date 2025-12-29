/**
 * 가격 비교 서비스 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PLATFORMS,
  formatPrice,
  formatDiscount,
  getDeliveryLabel,
  getPlatformName,
  checkPriceAlertCondition,
} from '@/lib/smart-matching/price-compare';

// Mock price-watches
vi.mock('@/lib/smart-matching/price-watches', () => ({
  getPriceHistory: vi.fn(),
  getLowestPrice: vi.fn(),
  getPriceChangePercent: vi.fn(),
}));

describe('가격 비교 서비스', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PLATFORMS', () => {
    it('주요 플랫폼 정보가 정의되어 있다', () => {
      expect(PLATFORMS.coupang).toBeDefined();
      expect(PLATFORMS.naver).toBeDefined();
      expect(PLATFORMS.musinsa).toBeDefined();
      expect(PLATFORMS.oliveyoung).toBeDefined();
      expect(PLATFORMS.iherb).toBeDefined();
    });

    it('각 플랫폼에 필수 정보가 포함되어 있다', () => {
      Object.values(PLATFORMS).forEach((platform) => {
        expect(platform.id).toBeDefined();
        expect(platform.name).toBeDefined();
        expect(platform.baseCommissionRate).toBeGreaterThan(0);
        expect(platform.deliveryTypes.length).toBeGreaterThan(0);
        expect(platform.defaultDeliveryDays).toBeGreaterThan(0);
      });
    });

    it('쿠팡은 로켓배송을 지원한다', () => {
      expect(PLATFORMS.coupang.deliveryTypes).toContain('rocket');
    });

    it('iHerb는 해외직배송이다', () => {
      expect(PLATFORMS.iherb.deliveryTypes).toContain('international');
    });
  });

  describe('formatPrice', () => {
    it('가격을 원화 형식으로 포맷한다', () => {
      expect(formatPrice(10000)).toBe('10,000원');
      expect(formatPrice(1500000)).toBe('1,500,000원');
      expect(formatPrice(0)).toBe('0원');
    });
  });

  describe('formatDiscount', () => {
    it('할인율을 표시한다', () => {
      expect(formatDiscount(20)).toBe('20% 할인');
      expect(formatDiscount(0)).toBe('0% 할인');
    });
  });

  describe('getDeliveryLabel', () => {
    it('배송 타입별 라벨을 반환한다', () => {
      expect(getDeliveryLabel('rocket')).toBe('로켓배송');
      expect(getDeliveryLabel('next_day')).toBe('내일 도착');
      expect(getDeliveryLabel('standard')).toBe('일반배송');
      expect(getDeliveryLabel('international')).toBe('해외직배송');
    });
  });

  describe('getPlatformName', () => {
    it('플랫폼 ID로 이름을 반환한다', () => {
      expect(getPlatformName('coupang')).toBe('쿠팡');
      expect(getPlatformName('naver')).toBe('네이버쇼핑');
      expect(getPlatformName('unknown')).toBe('unknown');
    });
  });

  describe('checkPriceAlertCondition', () => {
    it('목표가 이하로 떨어지면 알림을 트리거한다', () => {
      const result = checkPriceAlertCondition(9000, 10000);

      expect(result.triggered).toBe(true);
      expect(result.reason).toContain('10,000원');
    });

    it('목표가보다 높으면 트리거하지 않는다', () => {
      const result = checkPriceAlertCondition(12000, 10000);

      expect(result.triggered).toBe(false);
    });

    it('N% 이상 할인되면 알림을 트리거한다', () => {
      const result = checkPriceAlertCondition(
        8000,
        undefined,
        20, // 20% 이상 할인
        10000 // 원가
      );

      expect(result.triggered).toBe(true);
      expect(result.reason).toContain('20%');
    });

    it('할인율이 부족하면 트리거하지 않는다', () => {
      const result = checkPriceAlertCondition(
        9500,
        undefined,
        20,
        10000
      );

      expect(result.triggered).toBe(false);
    });
  });
});
