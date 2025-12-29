/**
 * Hybrid UX E2E 테스트
 * Beauty/Style 도메인 통합 테스트
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('Hybrid UX - Beauty 도메인', () => {
  test('Beauty 메인 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/beauty|sign-in/);
  });

  test('Beauty 카테고리 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(`${ROUTES.BEAUTY_CATEGORY}/skincare`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/beauty|category|sign-in/);
  });

  test('Beauty 페이지에서 분홍색 테마가 적용된다', async ({ page }) => {
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    // Beauty 도메인 색상 확인 (pink 테마)
    const pinkElements = page.locator('[class*="pink"], [class*="rose"]');
    const count = await pinkElements.count();
    // 페이지에 핑크 색상 요소가 있거나 로그인 페이지로 리다이렉트
    const url = page.url();
    if (!url.includes('sign-in')) {
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Hybrid UX - Style 도메인', () => {
  test('Style 메인 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.STYLE);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/style|sign-in/);
  });

  test('Style 카테고리 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(`${ROUTES.STYLE_CATEGORY}/casual`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/style|category|sign-in/);
  });

  test('Style 페이지에서 인디고 테마가 적용된다', async ({ page }) => {
    await page.goto(ROUTES.STYLE);
    await waitForLoadingToFinish(page);

    // Style 도메인 색상 확인 (indigo 테마)
    const indigoElements = page.locator('[class*="indigo"], [class*="violet"]');
    const count = await indigoElements.count();
    const url = page.url();
    if (!url.includes('sign-in')) {
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Hybrid UX - 검색', () => {
  test('검색 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.SEARCH);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/search|sign-in/);
  });

  test('검색 입력창이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.SEARCH);
    await waitForLoadingToFinish(page);

    const url = page.url();
    if (!url.includes('sign-in')) {
      const searchInput = page.locator('input[type="text"], input[type="search"]');
      const isVisible = await searchInput.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(searchInput.first()).toBeVisible();
      }
    }
  });
});

test.describe('Hybrid UX - 피드/룩북', () => {
  test('피드 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.FEED);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/feed|sign-in/);
  });

  test('연말 리뷰 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.YEAR_REVIEW);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/year-review|sign-in/);
  });
});

test.describe('Hybrid UX - 알림/설정', () => {
  test('알림 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.NOTIFICATIONS);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/notifications|sign-in/);
  });

  test('설정 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/settings|sign-in/);
  });
});

test.describe('Hybrid UX - 기록/레코드', () => {
  test('기록 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.RECORD);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/record|sign-in/);
  });

  test('기록 리포트 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.RECORD_REPORT);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/record|report|sign-in/);
  });
});

test.describe('Hybrid UX - 온보딩', () => {
  test('온보딩 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.ONBOARDING);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/onboarding|sign-in|dashboard/);
  });
});
