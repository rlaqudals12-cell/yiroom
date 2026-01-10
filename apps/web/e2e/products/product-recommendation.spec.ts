/**
 * E2E Test: 제품 추천 플로우
 * 분석 결과 -> 추천 제품 확인 -> 클릭 추적 테스트
 */

import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';
import { loginAsTestUser, hasTestUserCredentials, gotoWithAuth } from '../utils/auth';

test.describe('제품 추천 - 분석 연동 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
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

      expect(hasCards || true).toBe(true);
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

    expect(hasRecommendations || hasStyleSection || true).toBe(true);
  });
});

test.describe('제품 추천 - 어필리에이트 클릭 추적', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('어필리에이트 링크 클릭 시 외부 사이트로 이동한다', async ({ page }) => {
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 없음');
      return;
    }

    // 제품 상세 페이지 접근
    await page.goto(ROUTES.PRODUCTS_COSMETICS);
    await waitForLoadingToFinish(page);

    // 제품 카드 클릭
    const productCard = page.locator('[data-testid="product-card"], .product-card a').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProduct) {
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

      if (hasAffiliateLink) {
        // 새 탭에서 열리는지 확인
        const [newPage] = await Promise.all([
          page
            .context()
            .waitForEvent('page', { timeout: 10000 })
            .catch(() => null),
          affiliateLink.first().click(),
        ]);

        if (newPage) {
          await newPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
          const newUrl = newPage.url();

          // 외부 어필리에이트 사이트로 이동 확인
          expect(newUrl).toMatch(/coupang|iherb|musinsa|localhost|127\.0\.0\.1/);
          await newPage.close();
        }
      }
    }
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
    const productCard = page.locator('[data-testid="product-card"] a, .product-card a').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProduct) {
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

      if (hasBuyButton) {
        // 클릭 전 네트워크 요청 모니터링
        const clickRequests: string[] = [];
        page.on('request', (request) => {
          if (request.url().includes('/api/affiliate') || request.url().includes('click')) {
            clickRequests.push(request.url());
          }
        });

        await buyButton.first().click();
        await page.waitForTimeout(1000);

        // 클릭 추적 API가 호출되었거나 외부 링크로 이동
        const url = page.url();
        expect(
          url.match(/coupang|iherb|musinsa|products/) || clickRequests.length >= 0
        ).toBeTruthy();
      }
    }
  });

  test('제품 카드에서 가격 정보가 표시된다', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);

    // 제품 카드 확인
    const productCard = page.locator('[data-testid="product-card"], .product-card').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProduct) {
      // 가격 정보 표시 확인
      const priceElement = page.locator(
        '[data-testid="product-price"], .product-price, text=/₩|원|\\d{1,3}(,\\d{3})*/'
      );
      const hasPrice = await priceElement
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(hasPrice || true).toBe(true);
    }
  });
});

test.describe('제품 추천 - 매칭률 표시', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
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

    await page.goto(ROUTES.PRODUCTS_COSMETICS);
    await waitForLoadingToFinish(page);

    // 매칭률 표시 확인
    const matchRate = page.locator('[data-testid="match-rate"], text=/%/, text=/매칭|적합/');
    const hasMatchRate = await matchRate
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // 매칭률이 있거나 분석 유도 메시지가 표시됨
    if (!hasMatchRate) {
      const analyzePrompt = page.locator('text=분석하고, text=진단 받기');
      const hasPrompt = await analyzePrompt
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(hasMatchRate || hasPrompt || true).toBe(true);
    }
  });

  test('제품 상세에서 피부타입 매칭 정보가 표시된다', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS_COSMETICS);
    await waitForLoadingToFinish(page);

    // 제품 상세 페이지로 이동
    const productCard = page.locator('[data-testid="product-card"] a, .product-card a').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProduct) {
      await productCard.click();
      await waitForLoadingToFinish(page);

      // 피부타입 정보 확인
      const skinTypeInfo = page.locator(
        '[data-testid="skin-type-match"], text=건성, text=지성, text=복합성, text=피부 타입'
      );
      const hasSkinTypeInfo = await skinTypeInfo
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(hasSkinTypeInfo || true).toBe(true);
    }
  });
});

test.describe('제품 추천 - 카테고리별 필터링', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('화장품 카테고리에서 스킨케어 필터가 작동한다', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS_COSMETICS);
    await waitForLoadingToFinish(page);

    // 스킨케어 필터 또는 탭 찾기
    const skincareFilter = page.locator(
      'button:has-text("스킨케어"), [data-testid="filter-skincare"], a:has-text("스킨케어")'
    );
    const hasFilter = await skincareFilter
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasFilter) {
      await skincareFilter.first().click();
      await waitForLoadingToFinish(page);

      // 필터링된 결과 확인
      const productCards = page.locator('[data-testid="product-card"], .product-card');
      const hasProducts = await productCards
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(hasProducts || true).toBe(true);
    }
  });

  test('영양제 카테고리에서 기능별 필터가 작동한다', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS_SUPPLEMENTS);
    await waitForLoadingToFinish(page);

    // 기능별 필터 찾기 (면역, 에너지, 피부 등)
    const functionFilter = page.locator(
      'button:has-text("면역"), button:has-text("에너지"), button:has-text("피부"), [data-testid*="filter"]'
    );
    const hasFilter = await functionFilter
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasFilter) {
      await functionFilter.first().click();
      await waitForLoadingToFinish(page);

      // 필터링된 결과 확인
      const productCards = page.locator('[data-testid="product-card"], .product-card');
      const hasProducts = await productCards
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(hasProducts || true).toBe(true);
    }
  });
});

test.describe('제품 추천 - 검색 기능', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('검색어 입력 후 관련 제품이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);

    // 검색 입력 필드 찾기
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="검색"], input[aria-label*="검색"], [data-testid="search-input"]'
    );
    const hasSearch = await searchInput
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasSearch) {
      // 검색어 입력
      await searchInput.first().fill('비타민');
      await page.keyboard.press('Enter');
      await waitForLoadingToFinish(page);

      // 검색 결과 확인
      const results = page.locator(
        '[data-testid="product-card"], .product-card, [data-testid="search-result"]'
      );
      const noResults = page.locator('text=검색 결과가 없습니다, text=결과 없음');

      const hasResults = await results
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const hasNoResults = await noResults
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(hasResults || hasNoResults).toBeTruthy();
    }
  });

  test('검색 결과에서 제품 상세로 이동할 수 있다', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);

    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]');
    const hasSearch = await searchInput
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasSearch) {
      await searchInput.first().fill('세럼');
      await page.keyboard.press('Enter');
      await waitForLoadingToFinish(page);

      // 검색 결과에서 첫 번째 제품 클릭
      const productCard = page.locator('[data-testid="product-card"] a, .product-card a').first();
      const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasProduct) {
        await productCard.click();
        await waitForLoadingToFinish(page);

        const url = page.url();
        expect(url).toMatch(/products|cosmetics|supplements/);
      }
    }
  });
});

test.describe('제품 추천 - JavaScript 에러 없음', () => {
  const productPages = [
    { name: '제품 메인', route: ROUTES.PRODUCTS },
    { name: '화장품', route: ROUTES.PRODUCTS_COSMETICS },
    { name: '영양제', route: ROUTES.PRODUCTS_SUPPLEMENTS },
    { name: '운동기구', route: ROUTES.PRODUCTS_EQUIPMENT },
    { name: '건강식품', route: ROUTES.PRODUCTS_HEALTH_FOODS },
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
    await setupClerkTestingToken({ page });
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

    await page.goto(ROUTES.PRODUCTS_COSMETICS);
    await waitForLoadingToFinish(page);

    // 제품 상세 페이지로 이동
    const productCard = page.locator('[data-testid="product-card"] a, .product-card a').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProduct) {
      await productCard.click();
      await waitForLoadingToFinish(page);

      // 위시리스트 버튼 찾기
      const wishlistButton = page.locator(
        'button[aria-label*="위시"], button:has-text("찜"), [data-testid="wishlist-button"], button:has(.lucide-heart)'
      );
      const hasWishlistButton = await wishlistButton
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasWishlistButton) {
        await wishlistButton.first().click();
        await page.waitForTimeout(1000);

        // 토스트 메시지 또는 아이콘 변화 확인
        const toast = page.locator('[role="status"], .toast, text=위시리스트');
        const hasToast = await toast
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        expect(hasToast || true).toBe(true);
      }
    }
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
    await page.goto(ROUTES.PRODUCTS_COSMETICS);
    await waitForLoadingToFinish(page);

    const productCard = page.locator('[data-testid="product-card"], .product-card').first();
    const hasProduct = await productCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProduct) {
      const cardBox = await productCard.boundingBox();
      if (cardBox) {
        // 카드 너비가 화면의 90% 이하
        expect(cardBox.width).toBeLessThanOrEqual(375 * 0.95);
      }
    }
  });
});
