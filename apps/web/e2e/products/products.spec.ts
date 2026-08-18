/**
 * E2E Test: 제품 목록·상세의 현재 라우트 계약
 */

import { test, expect, type Page } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

const SKINCARE_PRODUCTS_ROUTE = `${ROUTES.PRODUCTS}?category=skincare`;
const MAKEUP_PRODUCTS_ROUTE = `${ROUTES.PRODUCTS}?category=makeup`;

async function assertProductsRoute(page: Page, category?: string) {
  if (page.url().includes('sign-in')) {
    await expect(page).toHaveURL(/\/sign-in/);
    return false;
  }

  await expect(page).toHaveURL(/\/products/);
  if (category) {
    expect(new URL(page.url()).searchParams.get('category')).toBe(category);
  }
  return true;
}

async function requireProductsRoute(page: Page, category?: string) {
  if (page.url().includes('sign-in')) {
    test.skip(true, '인증된 제품 UI fixture가 필요함');
    return false;
  }
  return assertProductsRoute(page, category);
}

test.describe('제품 추천 - 페이지 접근', () => {
  test('제품 메인 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);
    await assertProductsRoute(page);
  });

  test('스킨케어 카테고리는 쿼리 필터로 열린다', async ({ page }) => {
    await page.goto(SKINCARE_PRODUCTS_ROUTE);
    await waitForLoadingToFinish(page);
    await assertProductsRoute(page, 'skincare');
  });

  test('메이크업 카테고리는 쿼리 필터로 열린다', async ({ page }) => {
    await page.goto(MAKEUP_PRODUCTS_ROUTE);
    await waitForLoadingToFinish(page);
    await assertProductsRoute(page, 'makeup');
  });
});

test.describe('제품 추천 - 검색과 필터', () => {
  test('검색어를 URL과 결과 상태에 반영한다', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);
    if (!(await requireProductsRoute(page))) return;

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="검색"], input[aria-label*="검색"]'
    );
    await expect(searchInput.first()).toBeVisible();
    await searchInput.first().fill('비타민');
    await expect.poll(() => new URL(page.url()).searchParams.get('search')).toBe('비타민');

    const results = page.locator('[data-testid="product-card"]');
    const emptyState = page.getByText(/검색 결과가 없습니다|표시할 제품이 없습니다/);
    await expect(results.first().or(emptyState.first())).toBeVisible();
  });

  test('카테고리 탭이 스킨케어 쿼리를 선택한다', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);
    if (!(await requireProductsRoute(page))) return;

    const skincareTab = page.getByRole('tab', { name: '스킨케어' });
    await expect(skincareTab).toBeVisible();
    await skincareTab.click();
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('skincare');
    await expect(skincareTab).toHaveAttribute('data-state', 'active');
  });
});

test.describe('제품 추천 - 상세와 비교', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SKINCARE_PRODUCTS_ROUTE);
    await waitForLoadingToFinish(page);
  });

  test('제품 카드에서 상세 페이지로 이동한다', async ({ page }) => {
    if (!(await requireProductsRoute(page, 'skincare'))) return;

    const productLink = page.locator('a:has([data-testid="product-card"])').first();
    if (!(await productLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, '상세 이동을 검증할 제품 fixture가 없음');
      return;
    }

    const targetHref = await productLink.getAttribute('href');
    expect(targetHref).toMatch(/^\/beauty\/[^/]+/);
    await productLink.click();
    await waitForLoadingToFinish(page);
    expect(new URL(page.url()).pathname).toBe(new URL(targetHref!, page.url()).pathname);
  });

  test('목록 카드의 비교 버튼이 실제 비교 상태를 바꾼다', async ({ page }) => {
    if (!(await requireProductsRoute(page, 'skincare'))) return;

    const productCard = page.getByTestId('product-card').first();
    if (!(await productCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, '비교 동작을 검증할 제품 fixture가 없음');
      return;
    }

    await productCard.hover();
    const compareButton = productCard.getByRole('button', { name: '비교 목록에 추가' });
    await expect(compareButton).toBeVisible();
    await compareButton.click();
    await expect(productCard.getByRole('button', { name: '비교 목록에서 제거' })).toBeVisible();
  });
});

test('제품 목록에서 critical JavaScript 에러가 발생하지 않는다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(ROUTES.PRODUCTS);
  await waitForLoadingToFinish(page);

  const criticalErrors = errors.filter(
    (error) => !error.includes('hydration') && !error.includes('ResizeObserver')
  );
  expect(criticalErrors).toHaveLength(0);
});
