/**
 * 퍼널 분석 트래커
 * @description 사용자 전환 퍼널 추적
 */

import { trackEvent } from './tracker';

// 퍼널 정의
export type FunnelType =
  | 'onboarding'      // 온보딩 퍼널
  | 'analysis'        // 분석 퍼널 (PC/피부/체형)
  | 'workout'         // 운동 퍼널
  | 'product'         // 제품 퍼널 (조회 → 클릭 → 전환)
  | 'social';         // 소셜 퍼널 (친구추가 → 피드)

// 퍼널 단계
export interface FunnelStep {
  funnel: FunnelType;
  step: string;
  stepNumber: number;
  metadata?: Record<string, unknown>;
}

// 퍼널별 단계 정의
const FUNNEL_STEPS: Record<FunnelType, string[]> = {
  onboarding: [
    'start',
    'profile_input',
    'personal_color_start',
    'personal_color_complete',
    'complete',
  ],
  analysis: [
    'select_type',
    'upload_image',
    'processing',
    'result_view',
    'recommendation_view',
  ],
  workout: [
    'onboarding_start',
    'goal_select',
    'schedule_set',
    'plan_generated',
    'first_workout',
  ],
  product: [
    'browse',
    'view_detail',
    'click_affiliate',
    'conversion',
  ],
  social: [
    'view_leaderboard',
    'search_friend',
    'send_request',
    'accepted',
    'view_feed',
  ],
};

/**
 * 퍼널 단계 트래킹
 */
export async function trackFunnelStep(
  funnel: FunnelType,
  step: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const steps = FUNNEL_STEPS[funnel];
  const stepNumber = steps.indexOf(step);

  if (stepNumber === -1) {
    console.warn(`[Funnel] Unknown step "${step}" for funnel "${funnel}"`);
    return;
  }

  await trackEvent({
    eventType: 'feature_use',
    eventName: `Funnel: ${funnel}`,
    eventData: {
      funnel,
      step,
      stepNumber: stepNumber + 1,
      totalSteps: steps.length,
      ...metadata,
    },
  });
}

/**
 * 온보딩 퍼널 헬퍼
 */
export const onboardingFunnel = {
  start: () => trackFunnelStep('onboarding', 'start'),
  profileInput: () => trackFunnelStep('onboarding', 'profile_input'),
  personalColorStart: () => trackFunnelStep('onboarding', 'personal_color_start'),
  personalColorComplete: () => trackFunnelStep('onboarding', 'personal_color_complete'),
  complete: () => trackFunnelStep('onboarding', 'complete'),
};

/**
 * 분석 퍼널 헬퍼
 */
export const analysisFunnel = {
  selectType: (type: string) => trackFunnelStep('analysis', 'select_type', { analysisType: type }),
  uploadImage: (type: string) => trackFunnelStep('analysis', 'upload_image', { analysisType: type }),
  processing: (type: string) => trackFunnelStep('analysis', 'processing', { analysisType: type }),
  resultView: (type: string) => trackFunnelStep('analysis', 'result_view', { analysisType: type }),
  recommendationView: (type: string) => trackFunnelStep('analysis', 'recommendation_view', { analysisType: type }),
};

/**
 * 운동 퍼널 헬퍼
 */
export const workoutFunnel = {
  onboardingStart: () => trackFunnelStep('workout', 'onboarding_start'),
  goalSelect: (goal: string) => trackFunnelStep('workout', 'goal_select', { goal }),
  scheduleSet: (daysPerWeek: number) => trackFunnelStep('workout', 'schedule_set', { daysPerWeek }),
  planGenerated: (planId: string) => trackFunnelStep('workout', 'plan_generated', { planId }),
  firstWorkout: (planId: string) => trackFunnelStep('workout', 'first_workout', { planId }),
};

/**
 * 제품 퍼널 헬퍼
 */
export const productFunnel = {
  browse: (category: string) => trackFunnelStep('product', 'browse', { category }),
  viewDetail: (productId: string) => trackFunnelStep('product', 'view_detail', { productId }),
  clickAffiliate: (productId: string, partnerId: string) =>
    trackFunnelStep('product', 'click_affiliate', { productId, partnerId }),
  conversion: (productId: string, revenue: number) =>
    trackFunnelStep('product', 'conversion', { productId, revenue }),
};

/**
 * 소셜 퍼널 헬퍼
 */
export const socialFunnel = {
  viewLeaderboard: () => trackFunnelStep('social', 'view_leaderboard'),
  searchFriend: () => trackFunnelStep('social', 'search_friend'),
  sendRequest: (targetUserId: string) => trackFunnelStep('social', 'send_request', { targetUserId }),
  accepted: () => trackFunnelStep('social', 'accepted'),
  viewFeed: () => trackFunnelStep('social', 'view_feed'),
};

/**
 * 퍼널 완료율 계산 (서버사이드용)
 */
export function calculateFunnelConversion(
  funnel: FunnelType,
  stepCounts: Record<string, number>
): Array<{ step: string; count: number; conversionRate: number }> {
  const steps = FUNNEL_STEPS[funnel];
  const firstStepCount = stepCounts[steps[0]] || 0;

  return steps.map((step) => {
    const count = stepCounts[step] || 0;
    const conversionRate = firstStepCount > 0 ? (count / firstStepCount) * 100 : 0;
    return { step, count, conversionRate: Math.round(conversionRate * 10) / 10 };
  });
}
