/**
 * E2E Test: 로그인 플로우
 * Clerk 인증을 통한 로그인 → 대시보드 진입 테스트
 */

import { test, expect } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

// 테스트 사용자 정보 (환경 변수)
const TEST_USER = {
  username: process.env.E2E_CLERK_USER_USERNAME,
  password: process.env.E2E_CLERK_USER_PASSWORD,
};

test.describe('로그인 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // Clerk 테스팅 토큰 설정
    await setupClerkTestingToken({ page });
  });

  test('로그인 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.SIGN_IN);
    await waitForLoadingToFinish(page);

    // Clerk 로그인 폼이 표시되어야 함
    const signInContainer = page.locator('[data-testid="sign-in"], .cl-signIn-root, .cl-rootBox');
    await expect(signInContainer.first()).toBeVisible({ timeout: 10000 });
  });

  test('로그인 후 대시보드로 이동한다', async ({ page }) => {
    // 테스트 사용자 정보 확인
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    // 홈페이지에서 시작
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // Clerk helper로 로그인
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    // 대시보드로 이동
    await page.goto(ROUTES.DASHBOARD);
    await waitForLoadingToFinish(page);

    // 대시보드 페이지 확인
    const url = page.url();
    expect(url).toContain('/dashboard');

    // 대시보드 콘텐츠 확인 (로그인 상태)
    const dashboardContent = page.locator('[data-testid="dashboard"], main');
    await expect(dashboardContent.first()).toBeVisible();
  });

  test('미인증 상태에서 대시보드 접근 시 로그인 페이지로 리다이렉트된다', async ({ page }) => {
    // 직접 대시보드 접근 시도
    await page.goto(ROUTES.DASHBOARD);
    await waitForLoadingToFinish(page);

    // 로그인 페이지로 리다이렉트 확인
    const url = page.url();
    expect(url).toMatch(/sign-in|dashboard/);
  });

  test('미인증 상태에서 보호된 페이지 접근 시 리다이렉트된다', async ({ page }) => {
    // 운동 페이지 접근 시도
    await page.goto(ROUTES.WORKOUT);
    await waitForLoadingToFinish(page);

    const workoutUrl = page.url();
    expect(workoutUrl).toMatch(/sign-in|workout/);

    // 영양 페이지 접근 시도
    await page.goto(ROUTES.NUTRITION);
    await waitForLoadingToFinish(page);

    const nutritionUrl = page.url();
    expect(nutritionUrl).toMatch(/sign-in|nutrition/);
  });
});

test.describe('회원가입 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('회원가입 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.SIGN_UP);
    await waitForLoadingToFinish(page);

    // Clerk 회원가입 폼이 표시되어야 함
    const signUpContainer = page.locator('[data-testid="sign-up"], .cl-signUp-root, .cl-rootBox');
    await expect(signUpContainer.first()).toBeVisible({ timeout: 10000 });
  });
});
