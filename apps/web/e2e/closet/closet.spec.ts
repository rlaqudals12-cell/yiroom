/**
 * 옷장/인벤토리 E2E 테스트
 * 옷장 관리, 코디 추천 테스트
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('옷장 - 페이지 접근', () => {
  test('옷장 메인 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.CLOSET);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/closet|sign-in/);
  });

  test('옷장 추가 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.CLOSET_ADD);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/closet\/add|sign-in/);
  });

  test('코디 목록 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.CLOSET_OUTFITS);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/closet\/outfits|sign-in/);
  });
});

test.describe('옷장 - 기능', () => {
  test('카테고리 필터가 표시된다', async ({ page }) => {
    await page.goto(ROUTES.CLOSET);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const categoryFilter = page.locator('[data-testid="category-filter"]');
    await expect(categoryFilter).toBeVisible();
    await expect(categoryFilter.getByRole('button').first()).toBeVisible();
  });

  test('아이템 추가 버튼이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.CLOSET);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    // 옷장에는 등록 상태와 무관하게 추가 진입점이 항상 있어야 한다.
    const addButton = page.locator('button:has-text("추가"), a[href*="add"]');
    await expect(addButton.first()).toBeVisible();
  });

  test('이미지 업로드 영역이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.CLOSET_ADD);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page.getByTestId('item-uploader')).toBeVisible();
  });
});

test.describe('옷장 - 코디', () => {
  test('내 코디 목록이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.CLOSET_OUTFITS);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page.locator('[data-testid="outfits-page"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: '내 코디' })).toBeVisible();
  });

  test('새 코디 만들기 버튼이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.CLOSET_OUTFITS);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const newOutfitBtn = page.getByRole('button', { name: /새 코디/ });
    await expect(newOutfitBtn).toBeVisible();
    await newOutfitBtn.click();
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL(/\/closet\/outfits\/new/);
  });
});

test.describe('옷장 - JavaScript 에러 없음', () => {
  const closetPages = [
    { name: '옷장 메인', route: ROUTES.CLOSET },
    { name: '옷장 추가', route: ROUTES.CLOSET_ADD },
    { name: '코디 목록', route: ROUTES.CLOSET_OUTFITS },
  ];

  for (const { name, route } of closetPages) {
    test(`${name} 페이지에서 JavaScript 에러가 발생하지 않는다`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto(route);
      await waitForLoadingToFinish(page);

      const criticalErrors = errors.filter(
        (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  }
});
