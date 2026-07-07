/**
 * 알림 서비스 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  predictConsumption,
  shouldSendReorderReminder,
  isExpiryApproaching,
  getNotificationStyle,
} from '@/lib/smart-matching/notifications';

describe('알림 서비스', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('predictConsumption', () => {
    it('스킨케어 제품의 소진일을 예측한다', () => {
      const purchaseDate = new Date('2024-01-01');
      const prediction = predictConsumption(purchaseDate, 'skincare', 'daily');

      expect(prediction.averageUsageDays).toBe(60);
      expect(prediction.usagePattern).toBe('daily');
      expect(prediction.estimatedEmptyDate).toEqual(new Date('2024-03-01'));
    });

    it('영양제 제품의 소진일을 예측한다', () => {
      const purchaseDate = new Date('2024-01-01');
      const prediction = predictConsumption(purchaseDate, 'supplement', 'daily');

      expect(prediction.averageUsageDays).toBe(30);
      expect(prediction.estimatedEmptyDate).toEqual(new Date('2024-01-31'));
    });

    it('사용 빈도에 따라 소진일이 조정된다', () => {
      const purchaseDate = new Date('2024-01-01');

      const daily = predictConsumption(purchaseDate, 'skincare', 'daily');
      const weekly = predictConsumption(purchaseDate, 'skincare', 'weekly');
      const occasional = predictConsumption(purchaseDate, 'skincare', 'occasional');

      expect(weekly.averageUsageDays).toBeGreaterThan(daily.averageUsageDays);
      expect(occasional.averageUsageDays).toBeGreaterThan(weekly.averageUsageDays);
    });

    it('사용 빈도가 지정되면 신뢰도가 높아진다', () => {
      const purchaseDate = new Date('2024-01-01');

      const withFrequency = predictConsumption(purchaseDate, 'skincare', 'daily');
      const withoutFrequency = predictConsumption(purchaseDate, 'skincare');

      expect(withFrequency.confidenceLevel).toBeGreaterThan(withoutFrequency.confidenceLevel);
    });

    it('알 수 없는 카테고리는 기본값(60일)을 사용한다', () => {
      const purchaseDate = new Date('2024-01-01');
      const prediction = predictConsumption(purchaseDate, 'unknown-category', 'daily');

      expect(prediction.averageUsageDays).toBe(60);
    });
  });

  describe('shouldSendReorderReminder', () => {
    it('소진일 7일 전부터 알림을 보낸다', () => {
      const prediction = {
        inventoryItemId: 'item-1',
        purchaseDate: new Date('2024-01-01'),
        averageUsageDays: 30,
        usagePattern: 'daily' as const,
        estimatedEmptyDate: new Date('2024-01-31'),
        confidenceLevel: 0.7,
        reminderDays: 7,
        autoReorderEnabled: false,
      };

      // 7일 전 (1월 24일)
      expect(shouldSendReorderReminder(prediction, new Date('2024-01-24'))).toBe(true);

      // 8일 전 (1월 23일)
      expect(shouldSendReorderReminder(prediction, new Date('2024-01-23'))).toBe(false);

      // 소진일 당일 (1월 31일)
      expect(shouldSendReorderReminder(prediction, new Date('2024-01-31'))).toBe(false);
    });
  });

  describe('isExpiryApproaching', () => {
    it('유통기한 30일 전부터 true를 반환한다', () => {
      const expiryDate = new Date('2024-02-28');

      // 30일 전 (1월 29일)
      expect(isExpiryApproaching(expiryDate, 30, new Date('2024-01-29'))).toBe(true);

      // 31일 전 (1월 28일)
      expect(isExpiryApproaching(expiryDate, 30, new Date('2024-01-28'))).toBe(false);

      // 유통기한 당일
      expect(isExpiryApproaching(expiryDate, 30, new Date('2024-02-28'))).toBe(false);
    });

    it('경고 기간을 조정할 수 있다', () => {
      const expiryDate = new Date('2024-02-28');

      // 7일 전 알림 설정
      expect(isExpiryApproaching(expiryDate, 7, new Date('2024-02-21'))).toBe(true);
      expect(isExpiryApproaching(expiryDate, 7, new Date('2024-02-20'))).toBe(false);
    });
  });

  describe('getNotificationStyle', () => {
    // 이모지 아이콘(💰/⚠️ 등)은 제품 정책(이모지 금지)으로 제거됨 — icon 필드는 빈 문자열 유지
    it('가격 하락 알림 스타일을 반환한다', () => {
      const style = getNotificationStyle('price_drop');

      expect(style.icon).toBe('');
      expect(style.color).toContain('green');
      expect(style.bgColor).toContain('green');
    });

    it('소진 예정 알림 스타일을 반환한다', () => {
      const style = getNotificationStyle('product_running_low');

      expect(style.icon).toBe('');
      expect(style.color).toContain('yellow');
      expect(style.bgColor).toContain('yellow');
    });

    it('재입고 알림 스타일을 반환한다', () => {
      const style = getNotificationStyle('back_in_stock');

      expect(style.icon).toBe('');
      expect(style.color).toContain('blue');
      expect(style.bgColor).toContain('blue');
    });

    it('유통기한 알림 스타일을 반환한다', () => {
      const style = getNotificationStyle('expiry_approaching');

      expect(style.icon).toBe('');
      expect(style.color).toContain('orange');
      expect(style.bgColor).toContain('orange');
    });
  });
});
