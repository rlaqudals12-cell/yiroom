/**
 * E2E 테스트 Fixtures
 * 공통 테스트 설정 및 유틸리티
 */

import { test as base, expect, type Page } from '@playwright/test';

// 확장된 테스트 타입 정의 (추후 인증된 사용자 fixture 추가 예정)
export const test = base.extend<Record<string, never>>({
  // fixtures here
});

export { expect };

/**
 * 테스트 픽스처 데이터
 */
export const TEST_FIXTURES = {
  // 테스트 이미지 경로
  faceImage: 'e2e/fixtures/test-face.jpg',
  skinImage: 'e2e/fixtures/test-skin.jpg',
  bodyImage: 'e2e/fixtures/test-body.jpg',

  // Mock 분석 ID
  skinAnalysisId: 'test-skin-analysis-id',
  personalColorAnalysisId: 'test-pc-analysis-id',
  bodyAnalysisId: 'test-body-analysis-id',

  // 테스트 제품 ID
  testProductId: 'test-product-id',
  testCosmeticId: 'test-cosmetic-id',
  testSupplementId: 'test-supplement-id',
} as const;

/**
 * 테스트 사용자 타입
 */
export interface TestUserCredentials {
  username: string;
  password: string;
  email?: string;
}

/**
 * 테스트 환경 설정
 */
export const TEST_CONFIG = {
  // 타임아웃 설정
  defaultTimeout: 10000,
  networkTimeout: 30000,
  animationTimeout: 500,

  // 재시도 설정
  maxRetries: 3,

  // 뷰포트
  desktop: { width: 1280, height: 720 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
} as const;

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
  const hasLoading = await loadingIndicator
    .first()
    .isVisible({ timeout: 1000 })
    .catch(() => false);

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
  // 새 UX 라우트
  NEW_HOME: '/home',
  BEAUTY: '/beauty',
  BEAUTY_CATEGORY: '/beauty/category',
  STYLE: '/style',
  STYLE_CATEGORY: '/style/category',
  STYLE_OUTFIT: '/style/outfit',
  RECORD: '/record',
  RECORD_REPORT: '/record/report',
  SEARCH: '/search',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/profile/settings',
  ONBOARDING: '/onboarding',
  YEAR_REVIEW: '/year-review',
  FEED: '/feed',
  // 분석 플로우
  ANALYSIS_PERSONAL_COLOR: '/analysis/personal-color',
  ANALYSIS_SKIN: '/analysis/skin',
  ANALYSIS_BODY: '/analysis/body',
  ANALYSIS_HAIR: '/analysis/hair',
  ANALYSIS_MAKEUP: '/analysis/makeup',
  // 옷장/인벤토리
  CLOSET: '/closet',
  CLOSET_ADD: '/closet/add',
  CLOSET_OUTFITS: '/closet/outfits',
  // 소셜
  FRIENDS: '/friends',
  FRIENDS_SEARCH: '/friends/search',
  FRIENDS_REQUESTS: '/friends/requests',
  LEADERBOARD: '/leaderboard',
  // 제품 스캔
  SCAN: '/scan',
  SCAN_SHELF: '/scan/shelf',
  // 기타
  COACH: '/coach',
  CHAT: '/chat',
  WELLNESS: '/wellness',
  HELP_FAQ: '/help/faq',
  HELP_FEEDBACK: '/help/feedback',
  ANNOUNCEMENTS: '/announcements',
} as const;
