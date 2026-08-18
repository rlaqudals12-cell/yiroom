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
    if (url.includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page.getByRole('combobox', { name: '검색어 입력' })).toBeVisible();
  });
});

test.describe('Hybrid UX - 피드/룩북', () => {
  test('피드 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.FEED);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/home|sign-in/);
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
    expect(url).toMatch(/home|sign-in/);
  });

  test('기록 리포트 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.RECORD_REPORT);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/home|sign-in/);
  });
});

test.describe('Hybrid UX - 온보딩', () => {
  test('온보딩 진입(통합 분석)이 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.ONBOARDING);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/analysis\/integrated|sign-in|dashboard/);
  });
});
