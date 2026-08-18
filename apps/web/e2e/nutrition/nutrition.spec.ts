/** WELLNESS_PHASE2=false인 현행 영양 모듈의 라우트 게이트 계약. */

import { expect, test } from '@playwright/test';
import { waitForLoadingToFinish } from '../fixtures';

const GATED_NUTRITION_ROUTES = [
  '/nutrition',
  '/nutrition/dashboard',
  '/nutrition/food-capture',
] as const;

test.describe('영양 모듈 기능 게이트', () => {
  for (const route of GATED_NUTRITION_ROUTES) {
    test(`${route}는 홈으로 이동한다`, async ({ page }) => {
      await page.goto(route);
      await waitForLoadingToFinish(page);

      await expect(page).toHaveURL(/\/home|\/sign-in/);
      if (!page.url().includes('sign-in')) {
        await expect(page.locator('[data-testid="nutrition-page"]')).toHaveCount(0);
      }
    });
  }
});
