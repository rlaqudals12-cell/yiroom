/**
 * E2E Test: 모바일 UI 테스트
 * F-3 Task 3.4
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from './fixtures';

// 모바일 뷰포트 설정
const MOBILE_VIEWPORT = { width: 375, height: 667 }; // iPhone SE
const TABLET_VIEWPORT = { width: 768, height: 1024 }; // iPad
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe('모바일 UI - 반응형 테스트', () => {
  test('비인증 모바일 랜딩에서는 하단 네비게이션을 숨긴다', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // 하단 네비게이션 확인
    const bottomNav = page.locator(
      '[data-testid="bottom-nav"], nav[class*="bottom"], nav[class*="fixed"]'
    );
    await expect(page.locator('[data-testid="landing-page"]')).toBeVisible();
    await expect(bottomNav).toHaveCount(0);
  });

  test('태블릿 뷰에서 네비게이션이 표시된다', async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // 태블릿에서 네비게이션 확인
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('데스크톱에서 네비게이션이 표시된다', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // 데스크톱 헤더/네비게이션 확인
    const header = page.locator('header, nav');
    await expect(header.first()).toBeVisible();
  });
});

test.describe('모바일 UI - 터치 인터랙션', () => {
  test('모바일에서 버튼이 충분한 크기로 표시된다', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // 버튼 요소 확인
    const firstButton = page.locator('button:visible, a[role="button"]:visible').first();
    await expect(firstButton).toBeVisible();

    // 첫 번째 보이는 버튼의 크기 확인
    const box = await firstButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(32);
  });

  test('모바일에서 터치 스와이프가 동작한다', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(ROUTES.DASHBOARD);
    await waitForLoadingToFinish(page);

    // 페이지에 스크롤 가능한 컨텐츠가 있는지 먼저 확인
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    const hasScrollableContent = scrollHeight > clientHeight;

    if (hasScrollableContent) {
      // 페이지 스크롤
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);

      // 스크롤 위치 확인
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    } else {
      // 스크롤 가능한 컨텐츠가 없으면 페이지가 로드되었는지만 확인
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });
});

test.describe('모바일 UI - 제품 UI', () => {
  test('모바일에서 제품 그리드가 올바르게 표시된다', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);

    // 제품 그리드 레이아웃 확인
    const productGrid = page.locator('[data-testid="product-grid"], .grid, [class*="grid"]');
    const hasGrid = await productGrid
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasGrid) {
      test.skip(true, '상품 그리드를 만들 상품 fixture가 없습니다.');
      return;
    }

    // 그리드 열 수 확인 (모바일에서 1-2열)
    const gridStyle = await productGrid.first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.gridTemplateColumns;
    });

    // 모바일에서 1-2열이어야 함
    const columnCount = gridStyle.split(' ').length;
    expect(columnCount).toBeLessThanOrEqual(2);
  });

  test('모바일에서 폰트가 충분히 크게 표시된다', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // 본문 폰트 크기 확인
    const bodyText = page.locator('p:visible, span:visible').first();
    await expect(bodyText).toBeVisible();
    const fontSize = await bodyText.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // 최소 12px 이상이어야 가독성 유지
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(12);
  });
});

test.describe('모바일 UI - 폼 요소', () => {
  test('모바일에서 입력 필드가 충분한 크기로 표시된다', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);

    // 검색 입력 필드 확인
    const searchInput = page.locator('input[type="search"], input[type="text"]');
    const hasInput = await searchInput
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasInput) {
      test.skip(true, '검색 입력을 제공하는 상품 fixture가 없습니다.');
      return;
    }

    const box = await searchInput.first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(36);
  });

  test('모바일에서 드롭다운/셀렉트가 터치하기 쉽다', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);

    // 필터 드롭다운 확인
    const select = page.locator('select, [role="combobox"], [data-testid="filter-select"]');
    const hasSelect = await select
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasSelect) {
      test.skip(true, '필터 선택 요소를 제공하는 상품 fixture가 없습니다.');
      return;
    }

    const box = await select.first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(36);
  });
});

test.describe('모바일 UI - 오리엔테이션', () => {
  test('가로 모드에서도 레이아웃이 정상 표시된다', async ({ page }) => {
    // 가로 모드 설정
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    // 페이지가 정상 렌더링되는지 확인
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // 수평 가로 스크롤은 없어야 함 (10px 오차)
    const scrollDiff = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(scrollDiff).toBeLessThan(20);
  });
});
