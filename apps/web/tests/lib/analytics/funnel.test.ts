/**
 * 퍼널 분석 트래커 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  trackFunnelStep,
  onboardingFunnel,
  analysisFunnel,
  workoutFunnel,
  productFunnel,
  socialFunnel,
  calculateFunnelConversion,
} from '@/lib/analytics/funnel';
import * as tracker from '@/lib/analytics/tracker';
import * as logger from '@/lib/utils/logger';

// trackEvent 모킹
vi.mock('@/lib/analytics/tracker', () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

// analyticsLogger 모킹
vi.mock('@/lib/utils/logger', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils/logger')>();
  return {
    ...original,
    analyticsLogger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('Funnel Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackFunnelStep', () => {
    it('유효한 퍼널 단계를 트래킹한다', async () => {
      await trackFunnelStep('onboarding', 'start');

      expect(tracker.trackEvent).toHaveBeenCalledWith({
        eventType: 'feature_use',
        eventName: 'Funnel: onboarding',
        eventData: {
          funnel: 'onboarding',
          step: 'start',
          stepNumber: 1,
          totalSteps: 5,
        },
      });
    });

    it('메타데이터를 포함하여 트래킹한다', async () => {
      await trackFunnelStep('analysis', 'select_type', { analysisType: 'skin' });

      expect(tracker.trackEvent).toHaveBeenCalledWith({
        eventType: 'feature_use',
        eventName: 'Funnel: analysis',
        eventData: {
          funnel: 'analysis',
          step: 'select_type',
          stepNumber: 1,
          totalSteps: 5,
          analysisType: 'skin',
        },
      });
    });

    it('잘못된 단계는 경고를 출력하고 트래킹하지 않는다', async () => {
      await trackFunnelStep('onboarding', 'invalid_step');

      expect(logger.analyticsLogger.warn).toHaveBeenCalledWith(
        'Unknown step "invalid_step" for funnel "onboarding"'
      );
      expect(tracker.trackEvent).not.toHaveBeenCalled();
    });
  });

  describe('onboardingFunnel', () => {
    it('start 단계를 트래킹한다', async () => {
      await onboardingFunnel.start();

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            funnel: 'onboarding',
            step: 'start',
            stepNumber: 1,
          }),
        })
      );
    });

    it('complete 단계를 트래킹한다', async () => {
      await onboardingFunnel.complete();

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            funnel: 'onboarding',
            step: 'complete',
            stepNumber: 5,
          }),
        })
      );
    });
  });

  describe('analysisFunnel', () => {
    it('분석 타입을 메타데이터로 포함한다', async () => {
      await analysisFunnel.selectType('personal-color');

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            funnel: 'analysis',
            step: 'select_type',
            analysisType: 'personal-color',
          }),
        })
      );
    });
  });

  describe('workoutFunnel', () => {
    it('목표 선택을 트래킹한다', async () => {
      await workoutFunnel.goalSelect('muscle_gain');

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            funnel: 'workout',
            step: 'goal_select',
            goal: 'muscle_gain',
          }),
        })
      );
    });

    it('운동 플랜 생성을 트래킹한다', async () => {
      await workoutFunnel.planGenerated('plan-123');

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            funnel: 'workout',
            step: 'plan_generated',
            planId: 'plan-123',
          }),
        })
      );
    });
  });

  describe('productFunnel', () => {
    it('제품 조회를 트래킹한다', async () => {
      await productFunnel.viewDetail('prod-456');

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            funnel: 'product',
            step: 'view_detail',
            productId: 'prod-456',
          }),
        })
      );
    });

    it('어필리에이트 클릭을 트래킹한다', async () => {
      await productFunnel.clickAffiliate('prod-456', 'iherb');

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            funnel: 'product',
            step: 'click_affiliate',
            productId: 'prod-456',
            partnerId: 'iherb',
          }),
        })
      );
    });

    it('전환을 트래킹한다', async () => {
      await productFunnel.conversion('prod-456', 29900);

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            funnel: 'product',
            step: 'conversion',
            productId: 'prod-456',
            revenue: 29900,
          }),
        })
      );
    });
  });

  describe('socialFunnel', () => {
    it('친구 요청을 트래킹한다', async () => {
      await socialFunnel.sendRequest('user-789');

      expect(tracker.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            funnel: 'social',
            step: 'send_request',
            targetUserId: 'user-789',
          }),
        })
      );
    });
  });

  describe('calculateFunnelConversion', () => {
    it('퍼널 전환율을 계산한다', () => {
      const stepCounts = {
        browse: 1000,
        view_detail: 500,
        click_affiliate: 100,
        conversion: 20,
      };

      const result = calculateFunnelConversion('product', stepCounts);

      expect(result).toEqual([
        { step: 'browse', count: 1000, conversionRate: 100 },
        { step: 'view_detail', count: 500, conversionRate: 50 },
        { step: 'click_affiliate', count: 100, conversionRate: 10 },
        { step: 'conversion', count: 20, conversionRate: 2 },
      ]);
    });

    it('첫 단계가 0이면 전환율도 0이다', () => {
      const stepCounts = {
        browse: 0,
        view_detail: 0,
      };

      const result = calculateFunnelConversion('product', stepCounts);

      expect(result[0].conversionRate).toBe(0);
      expect(result[1].conversionRate).toBe(0);
    });

    it('누락된 단계는 0으로 처리한다', () => {
      const stepCounts = {
        start: 100,
        // profile_input 누락
        personal_color_start: 50,
      };

      const result = calculateFunnelConversion('onboarding', stepCounts);

      expect(result[1]).toEqual({
        step: 'profile_input',
        count: 0,
        conversionRate: 0,
      });
    });
  });
});
