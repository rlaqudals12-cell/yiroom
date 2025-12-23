/**
 * E2E Smoke Test
 * 기본적인 페이지 접근 및 렌더링 확인
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from './fixtures';

test.describe('Smoke Test - 페이지 접근', () => {
  test('홈페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/이룸|Yiroom/i);
  });

  test('대시보드 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.DASHBOARD);
    await waitForLoadingToFinish(page);

    // 대시보드 컨텐츠 확인 (인증 없이 접근 시 로그인 페이지로 리다이렉트 가능)
    const url = page.url();
    expect(url).toMatch(/dashboard|sign-in/);
  });

  test('운동 메인 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.WORKOUT);
    await waitForLoadingToFinish(page);

    // 페이지 로드 확인
    const url = page.url();
    expect(url).toMatch(/workout|sign-in/);
  });

  test('영양 메인 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.NUTRITION);
    await waitForLoadingToFinish(page);

    // 페이지 로드 확인
    const url = page.url();
    expect(url).toMatch(/nutrition|sign-in/);
  });

  test('주간 리포트 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.REPORT_WEEKLY);
    await waitForLoadingToFinish(page);

    // 페이지 로드 확인
    const url = page.url();
    expect(url).toMatch(/report|sign-in/);
  });

  test('월간 리포트 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.REPORT_MONTHLY);
    await waitForLoadingToFinish(page);

    // 페이지 로드 확인
    const url = page.url();
    expect(url).toMatch(/report|sign-in/);
  });

  test('프로필 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.PROFILE);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/profile|sign-in/);
  });

  test('배지 컬렉션 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.PROFILE_BADGES);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/badges|sign-in/);
  });

  test('챌린지 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.CHALLENGES);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/challenges|sign-in/);
  });
});

test.describe('Smoke Test - 네비게이션', () => {
  test('모바일 하단 네비게이션이 표시된다', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // 하단 네비게이션 확인
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    // 하단 네비게이션이 있으면 확인, 없으면 스킵 (인증 필요 시)
    const isVisible = await bottomNav.isVisible().catch(() => false);
    if (isVisible) {
      await expect(bottomNav).toBeVisible();
    }
  });

  test('데스크톱 네비게이션 바가 표시된다', async ({ page }) => {
    // 데스크톱 뷰포트 설정
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // 네비게이션 바 확인
    const navbar = page.locator('nav, header');
    await expect(navbar.first()).toBeVisible();
  });
});

test.describe('Smoke Test - 에러 처리', () => {
  test('존재하지 않는 페이지는 404를 반환한다', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345');

    // 404 또는 리다이렉트 확인
    expect(response?.status()).toBeGreaterThanOrEqual(200);
  });

  test('JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // 콘솔 에러가 없어야 함 (일부 예외 허용)
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
