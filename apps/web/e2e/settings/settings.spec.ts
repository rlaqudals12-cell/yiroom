/** 통합 설정 화면의 라우팅과 공통 구조 E2E. */

import { expect, test } from '@playwright/test';
import { waitForLoadingToFinish } from '../fixtures';

const SETTINGS_URL = '/profile/settings';

test.describe('설정 페이지', () => {
  test('/settings가 통합 설정 화면으로 이동한다', async ({ page }) => {
    await page.goto('/settings');
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL(/\/profile\/settings|\/sign-in/);
  });

  test('설정 화면의 제목과 카테고리 탭이 표시된다', async ({ page }) => {
    await page.goto(SETTINGS_URL);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      test.skip(true, '설정 화면은 로그인이 필요함');
      return;
    }

    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: '설정' })).toBeVisible();
    await expect(page.getByRole('tablist', { name: '설정 카테고리' })).toBeVisible();
  });

  test('설정 화면에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(SETTINGS_URL);
    await waitForLoadingToFinish(page);

    const criticalErrors = errors.filter(
      (error) => !error.includes('hydration') && !error.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
