/**
 * E2E Test: 화장품 상세의 성분 분석 계약
 */

import { test, expect, type Page } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

const SKINCARE_PRODUCTS_ROUTE = `${ROUTES.PRODUCTS}?category=skincare`;

async function openFirstSkincareDetail(page: Page): Promise<boolean> {
  await page.goto(SKINCARE_PRODUCTS_ROUTE);
  await waitForLoadingToFinish(page);

  if (page.url().includes('sign-in')) {
    test.skip(true, '인증된 제품 목록 fixture가 필요함');
    return false;
  }

  const productLink = page.locator('a:has([data-testid="product-card"])').first();
  if (!(await productLink.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.skip(true, '성분 분석을 검증할 스킨케어 제품 fixture가 없음');
    return false;
  }

  const targetHref = await productLink.getAttribute('href');
  expect(targetHref).toMatch(/^\/beauty\/[^/]+/);
  await productLink.click();
  await waitForLoadingToFinish(page);
  await expect(page).toHaveURL(/\/beauty\/[^/]+/);
  return true;
}

test.describe('제품 성분 분석 UI', () => {
  test('화장품 상세에 성분 분석 또는 정직한 빈 상태를 표시한다', async ({ page }) => {
    if (!(await openFirstSkincareDetail(page))) return;

    const ingredientSection = page.getByTestId('ingredient-analysis-section');
    const emptyState = page.getByTestId('ingredient-empty-scan-cta');
    await expect(ingredientSection.or(emptyState)).toBeVisible();
  });

  test('성분 데이터가 있으면 EWG 등급 도움말을 연다', async ({ page }) => {
    if (!(await openFirstSkincareDetail(page))) return;

    const ingredientSection = page.getByTestId('ingredient-analysis-section');
    if (!(await ingredientSection.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.skip(true, 'EWG 도움말을 검증할 성분 데이터 fixture가 없음');
      return;
    }

    const helpButton = page.getByRole('button', { name: 'EWG 등급 설명' });
    await expect(helpButton).toBeVisible();
    await helpButton.click();
    await expect(page.getByText('EWG 등급이란?')).toBeVisible();
  });

  test('숨겨진 성분이 있으면 더보기로 목록을 확장한다', async ({ page }) => {
    if (!(await openFirstSkincareDetail(page))) return;

    const ingredientSection = page.getByTestId('ingredient-analysis-section');
    if (!(await ingredientSection.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.skip(true, '성분 목록을 검증할 데이터 fixture가 없음');
      return;
    }

    const moreButton = ingredientSection.getByRole('button', { name: /더보기/ });
    if (!(await moreButton.isVisible().catch(() => false))) {
      test.skip(true, '기본 노출 수를 넘는 성분 데이터 fixture가 없음');
      return;
    }

    const cards = ingredientSection.getByTestId('ingredient-card');
    const beforeCount = await cards.count();
    await moreButton.click();
    await expect.poll(() => cards.count()).toBeGreaterThan(beforeCount);
  });
});
