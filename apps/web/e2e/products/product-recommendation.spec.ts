/**
 * E2E Test: 제품 추천 플로우
 * 분석 결과 -> 추천 제품 확인 -> 클릭 추적 테스트
 */

import { test, expect, type Page } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';
import { loginAsTestUser, hasTestUserCredentials, gotoWithAuth } from '../utils/auth';

const SKINCARE_PRODUCTS_ROUTE = `${ROUTES.PRODUCTS}?category=skincare`;
const MAKEUP_PRODUCTS_ROUTE = `${ROUTES.PRODUCTS}?category=makeup`;

async function setupClerkWhenConfigured(page: Page) {
  if (process.env.CLERK_TESTING_TOKEN) {
    await setupClerkTestingToken({ page });
  }
}

test.describe('제품 추천 - 분석 연동 플로우', () => {
  test.skip(true, '실제 분석 결과와 추천 제품 fixture가 준비된 환경에서만 검증');

  test.beforeEach(async ({ page }) => {
    await setupClerkWhenConfigured(page);
  });

  test('피부 분석 결과에서 추천 제품을 확인할 수 있다', async ({ page }) => {
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 없음');
      return;
    }

    const accessSuccess = await gotoWithAuth(page, '/analysis/skin/result/test-id');

    if (!accessSuccess) {
      test.skip(true, '인증된 상태로 페이지 접근 실패');
      return;
    }

    // 추천 제품 섹션으로 스크롤
    const recommendedProducts = page.locator('[data-testid="recommended-products"]');
    const productSection = page.locator('section:has-text("추천"), div:has-text("맞춤 제품")');

    const hasRecommended = await recommendedProducts
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasProductSection = await productSection
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasRecommended || hasProductSection) {
      await (
        hasRecommended ? recommendedProducts : productSection.first()
      ).scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // 제품 카드가 표시됨
      const productCards = page.locator('[data-testid="product-card"], .product-card');
      const hasCards = await productCards
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(hasCards).toBe(true);
    }
  });

  test('퍼스널컬러 분석 결과에서 추천 제품을 확인할 수 있다', async ({ page }) => {
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 없음');
      return;
    }

    const accessSuccess = await gotoWithAuth(page, '/analysis/personal-color/result/test-id');

    if (!accessSuccess) {
      test.skip(true, '인증된 상태로 페이지 접근 실패');
      return;
    }

    // 추천 제품/스타일 섹션 확인
    const recommendations = page.locator('[data-testid*="recommend"], [data-testid*="product"]');
    const styleSection = page.locator('text=추천 스타일, text=어울리는 컬러');

    const hasRecommendations = await recommendations
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasStyleSection = await styleSection
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasRecommendations || hasStyleSection).toBe(true);
  });
});

test.describe('제품 추천 - 어필리에이트 클릭 추적', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkWhenConfigured(page);
  });

  test('어필리에이트 링크 클릭 시 외부 사이트로 이동한다', async ({ page }) => {
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 없음');
      return;
    }

    // 제품 상세 페이지 접근
    await page.goto(SKINCARE_PRODUCTS_ROUTE);
    await waitForLoadingToFinish(page);

    // 제품 카드 클릭
    const productCard = page.locator('a:has([data-testid="product-card"])').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasProduct) {
      test.skip(true, '어필리에이트 동작을 검증할 제품 fixture가 없음');
      return;
    }

    await productCard.click();
    await waitForLoadingToFinish(page);

    // 어필리에이트 링크 찾기
    const affiliateLink = page.locator(
      '[data-testid="affiliate-link"], a[href*="coupang"], a[href*="iherb"], a[href*="musinsa"]'
    );
    const hasAffiliateLink = await affiliateLink
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasAffiliateLink) {
      test.skip(true, '어필리에이트 링크가 있는 제품 fixture가 없음');
      return;
    }

    const beforeUrl = page.url();
    const [newPage] = await Promise.all([
      page
        .context()
        .waitForEvent('page', { timeout: 10000 })
        .catch(() => null),
      affiliateLink.first().click(),
    ]);

    if (newPage) {
      await newPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      expect(newPage.url()).toMatch(/coupang|iherb|musinsa|localhost|127\.0\.0\.1/);
      await newPage.close();
      return;
    }

    await expect(page).not.toHaveURL(beforeUrl);
  });

  test('구매 버튼 클릭 시 어필리에이트 링크로 이동한다', async ({ page }) => {
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 없음');
      return;
    }

    // 제품 목록 페이지
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);

    // 첫 번째 제품 상세 페이지로 이동
    const productCard = page.locator('a:has([data-testid="product-card"])').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasProduct) {
      test.skip(true, '구매 동작을 검증할 제품 fixture가 없음');
      return;
    }

    {
      await productCard.click();
      await waitForLoadingToFinish(page);

      // 구매 버튼 찾기
      const buyButton = page.locator(
        'button:has-text("구매"), button:has-text("바로가기"), a:has-text("구매"), [data-testid="buy-button"]'
      );
      const hasBuyButton = await buyButton
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!hasBuyButton) {
        test.skip(true, '구매 링크가 있는 제품 fixture가 없음');
        return;
      }

      {
        // 클릭 전 네트워크 요청 모니터링
        const clickRequests: string[] = [];
        page.on('request', (request) => {
          if (request.url().includes('/api/affiliate') || request.url().includes('click')) {
            clickRequests.push(request.url());
          }
        });

        const beforeUrl = page.url();
        const popupPromise = page.waitForEvent('popup', { timeout: 2000 }).catch(() => null);
        await buyButton.first().click();
        const popup = await popupPromise;
        await page.waitForTimeout(1000);

        // 클릭 추적 API, 현재 탭 이동, 새 탭 중 하나가 실제로 발생해야 한다.
        expect(clickRequests.length > 0 || page.url() !== beforeUrl || popup !== null).toBe(true);
      }
    }
  });

  test('제품 카드에서 가격 정보가 표시된다', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);

    // 제품 카드 확인
    const productCard = page.locator('[data-testid="product-card"], .product-card').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasProduct) {
      test.skip(true, '가격을 검증할 제품 fixture가 없음');
      return;
    }

    await expect(productCard.getByLabel(/^가격 /)).toBeVisible();
  });
});

test.describe('제품 추천 - 매칭률 표시', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkWhenConfigured(page);
  });

  test('분석 완료 사용자에게 매칭률이 표시된다', async ({ page }) => {
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 없음');
      return;
    }

    const loginSuccess = await loginAsTestUser(page);
    if (!loginSuccess) {
      test.skip(true, '로그인 실패');
      return;
    }

    await page.goto(SKINCARE_PRODUCTS_ROUTE);
    await waitForLoadingToFinish(page);

    // 매칭률 표시 확인
    const matchRate = page.locator('[data-testid="match-rate"], text=/%/, text=/매칭|적합/');
    const hasMatchRate = await matchRate
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    const analyzePrompt = page.locator('text=분석하고, text=진단 받기');
    const emptyState = page.getByText(/표시할 제품이 없습니다|추천 제품이 없습니다/);
    const hasPrompt = await analyzePrompt
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasEmptyState = await emptyState
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasMatchRate || hasPrompt || hasEmptyState).toBe(true);
  });

  test('제품 상세에서 피부타입 매칭 정보가 표시된다', async ({ page }) => {
    await page.goto(SKINCARE_PRODUCTS_ROUTE);
    await waitForLoadingToFinish(page);

    // 제품 상세 페이지로 이동
    const productCard = page.locator('a:has([data-testid="product-card"])').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasProduct) {
      test.skip(true, '피부타입 매칭을 검증할 제품 fixture가 없음');
      return;
    }

    await productCard.click();
    await waitForLoadingToFinish(page);

    // 피부타입 정보 확인
    const skinTypeInfo = page.locator(
      '[data-testid="skin-type-match"], text=건성, text=지성, text=복합성, text=피부 타입'
    );
    await expect(skinTypeInfo.first()).toBeVisible();
  });
});

test.describe('제품 추천 - 카테고리별 필터링', () => {
  test('레거시 스킨케어 쿼리는 뷰티 정본 경로로 통합된다', async ({ page }) => {
    await page.goto(SKINCARE_PRODUCTS_ROUTE);
    await waitForLoadingToFinish(page);

    if (page.url().includes('/sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      const redirectTarget = new URL(page.url()).searchParams.get('redirect_url');
      expect(redirectTarget).toBeTruthy();
      const beautyUrl = new URL(redirectTarget!);
      expect(beautyUrl.pathname).toBe(ROUTES.BEAUTY);
      expect(beautyUrl.searchParams.get('category')).toBe('skincare');
      return;
    }

    const url = new URL(page.url());
    expect(url.pathname).toBe(ROUTES.BEAUTY);
    expect(url.searchParams.get('category')).toBe('skincare');
  });
});

test.describe('제품 추천 - 검색 기능', () => {
  test('제품 검색은 통합 검색의 q 쿼리를 사용한다', async ({ page }) => {
    const query = '비타민';
    await page.goto(`${ROUTES.SEARCH}?q=${encodeURIComponent(query)}`);
    await waitForLoadingToFinish(page);

    if (page.url().includes('/sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      const redirectTarget = new URL(page.url()).searchParams.get('redirect_url');
      expect(redirectTarget).toBeTruthy();
      const searchUrl = new URL(redirectTarget!);
      expect(searchUrl.pathname).toBe(ROUTES.SEARCH);
      expect(searchUrl.searchParams.get('q')).toBe(query);
      return;
    }

    const url = new URL(page.url());
    expect(url.pathname).toBe(ROUTES.SEARCH);
    expect(url.searchParams.get('q')).toBe(query);
    await expect(page.getByTestId('search-input')).toHaveValue(query);
  });

  test('검색 결과에서 제품 상세로 이동할 수 있다', async ({ page }) => {
    await page.goto(ROUTES.SEARCH);
    await waitForLoadingToFinish(page);

    if (page.url().includes('/sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      const redirectTarget = new URL(page.url()).searchParams.get('redirect_url');
      expect(redirectTarget).toBeTruthy();
      expect(new URL(redirectTarget!).pathname).toBe(ROUTES.SEARCH);
      return;
    }

    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('세럼');
    await searchInput.press('Enter');
    await waitForLoadingToFinish(page);

    await expect(page).toHaveURL(
      (url) => url.pathname === ROUTES.SEARCH && url.searchParams.get('q') === '세럼'
    );

    const productResult = page.locator('section .grid > button').first();
    const hasProduct = await productResult.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasProduct) {
      test.skip(true, '상세 이동을 검증할 검색 결과 fixture가 없음');
      return;
    }

    await productResult.click();
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL(/\/beauty\/[^/?#]+/);
  });
});

test.describe('제품 추천 - JavaScript 에러 없음', () => {
  const productPages = [
    { name: '제품 메인', route: ROUTES.PRODUCTS },
    { name: '스킨케어', route: SKINCARE_PRODUCTS_ROUTE },
    { name: '메이크업', route: MAKEUP_PRODUCTS_ROUTE },
  ];

  for (const { name, route } of productPages) {
    test(`${name} 페이지에서 JavaScript 에러가 발생하지 않는다`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto(route);
      await waitForLoadingToFinish(page);

      // 허용되는 에러 필터링
      const criticalErrors = errors.filter(
        (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  }
});

test.describe('제품 추천 - 위시리스트 연동', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkWhenConfigured(page);
  });

  test('제품 상세에서 위시리스트 추가 버튼이 작동한다', async ({ page }) => {
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 없음');
      return;
    }

    const loginSuccess = await loginAsTestUser(page);
    if (!loginSuccess) {
      test.skip(true, '로그인 실패');
      return;
    }

    await page.goto(SKINCARE_PRODUCTS_ROUTE);
    await waitForLoadingToFinish(page);

    // 제품 상세 페이지로 이동
    const productCard = page.locator('a:has([data-testid="product-card"])').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasProduct) {
      test.skip(true, '위시리스트 동작을 검증할 제품 fixture가 없음');
      return;
    }

    await productCard.click();
    await waitForLoadingToFinish(page);

    const wishlistButton = page.locator(
      'button[aria-label*="위시"], button:has-text("찜"), [data-testid="wishlist-button"]'
    );
    const hasWishlistButton = await wishlistButton
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasWishlistButton).toBe(true);
    const button = wishlistButton.first();
    const beforeLabel = (await button.getAttribute('aria-label')) ?? (await button.textContent());
    await button.click();

    await expect
      .poll(async () => (await button.getAttribute('aria-label')) ?? (await button.textContent()))
      .not.toBe(beforeLabel);
  });
});

test.describe('제품 추천 - 모바일 반응형', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('모바일에서 제품 목록이 정상 표시된다', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);

    // 페이지가 정상 로드됨
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // 가로 스크롤 없음 확인
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('모바일에서 제품 카드가 적절한 크기로 표시된다', async ({ page }) => {
    await page.goto(SKINCARE_PRODUCTS_ROUTE);
    await waitForLoadingToFinish(page);

    const productCard = page.locator('[data-testid="product-card"], .product-card').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasProduct) {
      test.skip(true, '모바일 카드 너비를 검증할 제품 fixture가 없음');
      return;
    }

    const cardBox = await productCard.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.width).toBeLessThanOrEqual(375 * 0.95);
  });
});
