/**
 * E2E 테스트 인증 헬퍼
 * Clerk 인증을 통한 테스트 유저 로그인 유틸리티
 */

import type { Page } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

/**
 * 테스트 사용자 정보 (환경 변수에서 로드)
 */
export const TEST_USER = {
  username: process.env.E2E_CLERK_USER_USERNAME ?? '',
  password: process.env.E2E_CLERK_USER_PASSWORD ?? '',
  email: process.env.TEST_USER_EMAIL ?? 'test@example.com',
};

/**
 * 테스트 유저로 로그인
 * Clerk 테스팅 토큰을 설정하고 테스트 계정으로 로그인
 *
 * @param page - Playwright Page 객체
 * @param options - 로그인 옵션
 * @returns 로그인 성공 여부
 */
export async function loginAsTestUser(
  page: Page,
  options?: {
    waitForDashboard?: boolean;
    timeout?: number;
  }
): Promise<boolean> {
  const { waitForDashboard = true, timeout = 10000 } = options ?? {};

  // 테스트 사용자 정보 확인
  if (!TEST_USER.username || !TEST_USER.password) {
    console.warn(
      '[E2E] 테스트 사용자 정보가 설정되지 않음 - E2E_CLERK_USER_USERNAME, E2E_CLERK_USER_PASSWORD 환경 변수 확인'
    );
    return false;
  }

  try {
    // Clerk 테스팅 토큰 설정
    await setupClerkTestingToken({ page });

    // 홈페이지에서 시작
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout });

    // Clerk helper로 로그인
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    // 대시보드 이동 대기 (옵션)
    if (waitForDashboard) {
      await page.waitForURL(/dashboard/, { timeout });
    }

    return true;
  } catch (error) {
    console.error('[E2E] 로그인 실패:', error);
    return false;
  }
}

/**
 * 테스트 유저로 로그아웃
 *
 * @param page - Playwright Page 객체
 */
export async function logoutTestUser(page: Page): Promise<void> {
  try {
    await clerk.signOut({ page });
    await page.waitForLoadState('networkidle');
  } catch (error) {
    console.error('[E2E] 로그아웃 실패:', error);
  }
}

/**
 * 인증 상태 확인
 *
 * @param page - Playwright Page 객체
 * @returns 로그인 상태 여부
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();

  // 로그인 페이지로 리다이렉트되었으면 미인증
  if (url.includes('/sign-in') || url.includes('/sign-up')) {
    return false;
  }

  // 대시보드 또는 보호된 페이지에 있으면 인증됨
  if (url.includes('/dashboard') || url.includes('/workout') || url.includes('/nutrition')) {
    return true;
  }

  // 세션 쿠키 또는 로그인 상태 DOM 요소 확인
  const userButton = page.locator('[data-testid="user-button"], .cl-userButtonTrigger');
  return userButton.isVisible({ timeout: 2000 }).catch(() => false);
}

/**
 * 인증이 필요한 페이지 접근 헬퍼
 * 미인증 시 자동으로 로그인 후 페이지 이동
 *
 * @param page - Playwright Page 객체
 * @param targetUrl - 목표 URL
 * @returns 페이지 접근 성공 여부
 */
export async function gotoWithAuth(page: Page, targetUrl: string): Promise<boolean> {
  // Clerk 테스팅 토큰 설정
  await setupClerkTestingToken({ page });

  // 목표 페이지로 이동 시도
  await page.goto(targetUrl);
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // 로그인 페이지로 리다이렉트 되었는지 확인
  if (page.url().includes('/sign-in')) {
    // 로그인 시도
    const loginSuccess = await loginAsTestUser(page, { waitForDashboard: false });
    if (!loginSuccess) {
      return false;
    }

    // 원래 목표 페이지로 이동
    await page.goto(targetUrl);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  return !page.url().includes('/sign-in');
}

/**
 * 테스트 사용자 정보 검증
 * 테스트 스킵 여부 결정에 사용
 *
 * @returns 테스트 사용자 정보 존재 여부
 */
export function hasTestUserCredentials(): boolean {
  return Boolean(TEST_USER.username && TEST_USER.password);
}
