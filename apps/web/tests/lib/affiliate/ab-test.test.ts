/**
 * A/B 테스트 프레임워크 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getExperiments,
  getExperiment,
  assignVariant,
  getAssignmentFromCookie,
  setAssignmentCookie,
  getChannelOrder,
  trackABEvent,
  getMockResults,
  calculateSignificance,
} from '@/lib/affiliate/ab-test';

describe('A/B Test Framework', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExperiments', () => {
    it('활성 실험 목록을 반환한다', () => {
      const experiments = getExperiments(true);

      expect(Array.isArray(experiments)).toBe(true);
      experiments.forEach((exp) => {
        expect(exp.isActive).toBe(true);
      });
    });

    it('모든 실험 목록을 반환한다 (activeOnly=false)', () => {
      const allExperiments = getExperiments(false);
      const activeExperiments = getExperiments(true);

      expect(allExperiments.length).toBeGreaterThanOrEqual(activeExperiments.length);
    });

    it('각 실험에 필수 필드가 있다', () => {
      const experiments = getExperiments(false);

      experiments.forEach((exp) => {
        expect(exp).toHaveProperty('id');
        expect(exp).toHaveProperty('name');
        expect(exp).toHaveProperty('description');
        expect(exp).toHaveProperty('variants');
        expect(exp).toHaveProperty('isActive');
        expect(exp).toHaveProperty('startDate');
        expect(exp.variants.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getExperiment', () => {
    it('ID로 실험을 조회한다', () => {
      const experiments = getExperiments(false);
      if (experiments.length > 0) {
        const exp = getExperiment(experiments[0].id);
        expect(exp).not.toBeNull();
        expect(exp?.id).toBe(experiments[0].id);
      }
    });

    it('존재하지 않는 ID는 null을 반환한다', () => {
      const exp = getExperiment('non-existent-id');
      expect(exp).toBeNull();
    });
  });

  describe('assignVariant', () => {
    it('활성 실험에 변형을 할당한다', () => {
      const experiments = getExperiments(true);
      if (experiments.length > 0) {
        const variant = assignVariant(experiments[0].id);
        expect(variant).not.toBeNull();
        expect(variant).toHaveProperty('id');
        expect(variant).toHaveProperty('name');
        expect(variant).toHaveProperty('weight');
        expect(variant).toHaveProperty('config');
      }
    });

    it('기존 할당이 있으면 동일 변형을 반환한다', () => {
      const experiments = getExperiments(true);
      if (experiments.length > 0) {
        const firstVariant = experiments[0].variants[0];
        const variant = assignVariant(experiments[0].id, firstVariant.id);
        expect(variant?.id).toBe(firstVariant.id);
      }
    });

    it('비활성 실험은 null을 반환한다', () => {
      const allExperiments = getExperiments(false);
      const inactiveExp = allExperiments.find((exp) => !exp.isActive);
      if (inactiveExp) {
        const variant = assignVariant(inactiveExp.id);
        expect(variant).toBeNull();
      }
    });
  });

  describe('Cookie Functions', () => {
    it('쿠키에서 할당 정보를 읽는다', () => {
      const cookies = 'ab_channel-order-v1=control; other=value';
      const assignment = getAssignmentFromCookie(cookies, 'channel-order-v1');
      expect(assignment).toBe('control');
    });

    it('쿠키가 없으면 null을 반환한다', () => {
      const cookies = 'other=value';
      const assignment = getAssignmentFromCookie(cookies, 'channel-order-v1');
      expect(assignment).toBeNull();
    });

    it('쿠키 문자열을 생성한다', () => {
      const cookie = setAssignmentCookie('channel-order-v1', 'control', 30);
      expect(cookie).toContain('ab_channel-order-v1=control');
      expect(cookie).toContain('expires=');
      expect(cookie).toContain('path=/');
    });
  });

  describe('getChannelOrder', () => {
    it('고정 순서를 반환한다', () => {
      const config = { channelOrder: ['musinsa', 'coupang', 'iherb'] };
      const channels = [
        { partnerId: 'coupang' as const, priceKrw: 20000 },
        { partnerId: 'iherb' as const, priceKrw: 15000 },
        { partnerId: 'musinsa' as const, priceKrw: 25000 },
      ];

      const order = getChannelOrder(config, channels);
      expect(order).toEqual(['musinsa', 'coupang', 'iherb']);
    });

    it('가격순으로 정렬한다', () => {
      const config = { channelOrder: 'price-asc' };
      const channels = [
        { partnerId: 'coupang' as const, priceKrw: 20000 },
        { partnerId: 'iherb' as const, priceKrw: 15000 },
        { partnerId: 'musinsa' as const, priceKrw: 25000 },
      ];

      const order = getChannelOrder(config, channels);
      expect(order).toEqual(['iherb', 'coupang', 'musinsa']);
    });
  });

  describe('trackABEvent', () => {
    it('이벤트를 기록한다 (에러 없이 실행)', () => {
      // trackABEvent가 에러 없이 실행되는지 확인
      expect(() => {
        trackABEvent({
          experimentId: 'channel-order-v1',
          variantId: 'control',
          eventType: 'click',
          productId: 'product-1',
        });
      }).not.toThrow();
    });

    it('다양한 이벤트 타입을 지원한다', () => {
      expect(() => {
        trackABEvent({
          experimentId: 'channel-order-v1',
          variantId: 'control',
          eventType: 'impression',
        });
        trackABEvent({
          experimentId: 'channel-order-v1',
          variantId: 'control',
          eventType: 'conversion',
          metadata: { value: 10000 },
        });
      }).not.toThrow();
    });
  });

  describe('getMockResults', () => {
    it('Mock 결과를 생성한다', () => {
      const experiments = getExperiments(false);
      if (experiments.length > 0) {
        const results = getMockResults(experiments[0].id);
        expect(results.length).toBe(experiments[0].variants.length);

        results.forEach((result) => {
          expect(result).toHaveProperty('experimentId');
          expect(result).toHaveProperty('variantId');
          expect(result).toHaveProperty('clicks');
          expect(result).toHaveProperty('conversions');
          expect(result).toHaveProperty('revenue');
          expect(result).toHaveProperty('conversionRate');
        });
      }
    });

    it('존재하지 않는 실험은 빈 배열을 반환한다', () => {
      const results = getMockResults('non-existent');
      expect(results).toEqual([]);
    });
  });

  describe('calculateSignificance', () => {
    it('통계적 유의성을 계산한다', () => {
      const result = calculateSignificance(50, 1000, 70, 1000);

      expect(result).toHaveProperty('isSignificant');
      expect(result).toHaveProperty('pValue');
      expect(result).toHaveProperty('lift');
      expect(typeof result.isSignificant).toBe('boolean');
      expect(typeof result.pValue).toBe('number');
      expect(typeof result.lift).toBe('number');
    });

    it('클릭이 0이면 유의하지 않음', () => {
      const result = calculateSignificance(0, 0, 0, 0);

      expect(result.isSignificant).toBe(false);
      expect(result.pValue).toBe(1);
    });

    it('lift를 올바르게 계산한다', () => {
      // Control: 5%, Treatment: 10% → lift = 100%
      const result = calculateSignificance(50, 1000, 100, 1000);
      expect(result.lift).toBeCloseTo(100, 0);
    });

    it('동일한 전환율은 lift가 0', () => {
      const result = calculateSignificance(50, 1000, 50, 1000);
      expect(result.lift).toBeCloseTo(0, 1);
    });
  });
});
