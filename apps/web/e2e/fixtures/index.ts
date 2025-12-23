/**
 * E2E 테스트 Fixtures
 * 공통 테스트 설정 및 유틸리티
 */

import { test as base, expect } from '@playwright/test';

// 확장된 테스트 타입 정의 (추후 인증된 사용자 fixture 추가 예정)
export const test = base.extend<Record<string, never>>({
  // fixtures here
});

export { expect };

/**
 * 페이지 로드 대기 헬퍼
 */
export async function waitForPageLoad(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * 로딩 스피너 사라질 때까지 대기
 */
export async function waitForLoadingToFinish(page: import('@playwright/test').Page) {
  // 로딩 인디케이터가 있으면 사라질 때까지 대기
  const loadingIndicator = page.locator('[data-testid*="loading"], .animate-spin');

  // 로딩 인디케이터가 있는지 확인 (짧은 대기)
  const hasLoading = await loadingIndicator.first().isVisible({ timeout: 1000 }).catch(() => false);

  if (hasLoading) {
    await loadingIndicator.first().waitFor({ state: 'hidden', timeout: 30000 });
  }
}

/**
 * 테스트 URL 상수
 */
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  WORKOUT: '/workout',
  WORKOUT_ONBOARDING: '/workout/onboarding/step1',
  WORKOUT_PLAN: '/workout/plan',
  WORKOUT_SESSION: '/workout/session',
  WORKOUT_HISTORY: '/workout/history',
  NUTRITION: '/nutrition',
  NUTRITION_ONBOARDING: '/nutrition/onboarding/step1',
  REPORT_WEEKLY: '/report/weekly',
  REPORT_MONTHLY: '/report/monthly',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  // F-3 추가
  PRODUCTS: '/products',
  PRODUCTS_COSMETICS: '/products/cosmetics',
  PRODUCTS_SUPPLEMENTS: '/products/supplements',
  PRODUCTS_EQUIPMENT: '/products/equipment',
  PRODUCTS_HEALTH_FOODS: '/products/health-foods',
  WISHLIST: '/wishlist',
  ADMIN: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_FEATURES: '/admin/system/features',
  ADMIN_CRAWLER: '/admin/system/crawler',
  // Phase H: 게이미피케이션 & 챌린지
  PROFILE: '/profile',
  PROFILE_BADGES: '/profile/badges',
  CHALLENGES: '/challenges',
} as const;
