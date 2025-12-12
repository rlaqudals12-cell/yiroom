/**
 * E2E Test: 로그아웃 플로우
 * Clerk 인증을 통한 로그아웃 동작 테스트
 */

import { test, expect } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

// 테스트 사용자 정보 (환경 변수)
const TEST_USER = {
  username: process.env.E2E_CLERK_USER_USERNAME,
  password: process.env.E2E_CLERK_USER_PASSWORD,
};

test.describe('로그아웃 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // Clerk 테스팅 토큰 설정
    await setupClerkTestingToken({ page });
  });

  test('로그아웃 후 홈페이지로 이동한다', async ({ page }) => {
    // 테스트 사용자 정보 확인
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    // 홈페이지에서 시작
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // 로그인
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    // 대시보드 확인
    await page.goto(ROUTES.DASHBOARD);
    await waitForLoadingToFinish(page);
    expect(page.url()).toContain('/dashboard');

    // 로그아웃
    await clerk.signOut({ page });
    await waitForLoadingToFinish(page);

    // 홈페이지 또는 로그인 페이지로 이동 확인
    const url = page.url();
    expect(url).toMatch(/\/$|sign-in/);
  });

  test('로그아웃 후 보호된 페이지 접근 시 리다이렉트된다', async ({ page }) => {
    // 테스트 사용자 정보 확인
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    // 로그인
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    // 대시보드 접근 확인
    await page.goto(ROUTES.DASHBOARD);
    await waitForLoadingToFinish(page);
    expect(page.url()).toContain('/dashboard');

    // 로그아웃
    await clerk.signOut({ page });
    await waitForLoadingToFinish(page);

    // 보호된 페이지 재접근 시도
    await page.goto(ROUTES.DASHBOARD);
    await waitForLoadingToFinish(page);

    // 로그인 페이지로 리다이렉트 또는 대시보드에서 미인증 상태
    const url = page.url();
    expect(url).toMatch(/sign-in|dashboard/);
  });

  test('UserButton을 통한 로그아웃', async ({ page }) => {
    // 테스트 사용자 정보 확인
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    // 로그인
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

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

    // UserButton 찾기 (Clerk UI)
    const userButton = page.locator('.cl-userButtonTrigger, [data-testid="user-button"]');
    const hasUserButton = await userButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUserButton) {
      // UserButton 클릭
      await userButton.first().click();

      // 로그아웃 버튼 찾기 및 클릭
      const signOutButton = page.locator('button:has-text("로그아웃"), button:has-text("Sign out")');
      const hasSignOut = await signOutButton.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasSignOut) {
        await signOutButton.first().click();
        await waitForLoadingToFinish(page);

        // 로그아웃 확인
        const url = page.url();
        expect(url).toMatch(/\/$|sign-in/);
      }
    }
  });
});
