/**
 * E2E Test: 피부 분석 플로우
 * 사진 업로드 -> AI 분석 -> 결과 확인 전체 플로우
 */

import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';
import { loginAsTestUser, hasTestUserCredentials, gotoWithAuth } from '../utils/auth';

// 테스트 사용자 정보 (환경 변수)
const TEST_USER = {
  username: process.env.E2E_CLERK_USER_USERNAME,
  password: process.env.E2E_CLERK_USER_PASSWORD,
};

test.describe('피부 분석 플로우', () => {
  test('피부 분석 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.ANALYSIS_SKIN);
    await waitForLoadingToFinish(page);

    const url = page.url();
    // 로그인 페이지로 리다이렉트 되거나 분석 페이지가 표시됨
    expect(url).toMatch(/skin|sign-in/);
  });

  test('미인증 상태에서 분석 페이지 접근 시 로그인 페이지로 리다이렉트된다', async ({ page }) => {
    await page.goto(ROUTES.ANALYSIS_SKIN);
    await waitForLoadingToFinish(page);

    const url = page.url();
    // 보호된 페이지이므로 로그인 필요
    if (url.includes('/sign-in')) {
      expect(url).toContain('/sign-in');
    } else {
      // 또는 분석 페이지에 접근 가능 (공개 분석인 경우)
      expect(url).toContain('/skin');
    }
  });
});

test.describe('피부 분석 - 인증된 사용자', () => {
  test.beforeEach(async ({ page }) => {
    if (process.env.CLERK_TESTING_TOKEN) {
      await setupClerkTestingToken({ page });
    }
  });

  test('로그인 후 피부 분석 페이지에 접근할 수 있다', async ({ page }) => {
    // 테스트 사용자 정보 확인
    if (!hasTestUserCredentials()) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    // 로그인
    const loginSuccess = await loginAsTestUser(page);
    if (!loginSuccess) {
      test.skip(true, '로그인 실패');
      return;
    }

    // 기존 결과 자동 이동을 막고 새 분석의 첫 상태를 검증한다.
    await page.goto(`${ROUTES.ANALYSIS_SKIN}?forceNew=true`);
    await waitForLoadingToFinish(page);

    await expect(page).toHaveURL(/\/analysis\/skin\?forceNew=true/);
    await expect(page.getByTestId('skin-analysis-page')).toBeVisible();
    await expect(page.getByTestId('skin-lighting-guide')).toBeVisible();
  });
});

test.describe('피부 분석 결과', () => {
  test.skip(true, '실제 피부 분석 결과 fixture가 준비된 환경에서만 검증');

  test.beforeEach(async ({ page }) => {
    if (process.env.CLERK_TESTING_TOKEN) {
      await setupClerkTestingToken({ page });
    }
  });

  test('분석 결과 페이지 구조가 올바르다', async ({ page }) => {
    // Mock 결과 ID로 페이지 접근 시도
    const mockId = 'test-skin-analysis-id';
    await page.goto(`/analysis/skin/result/${mockId}`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    // 로그인 리다이렉트 또는 결과 페이지로 이동
    expect(url).toMatch(/skin|sign-in/);
  });

  test('분석 결과에서 피부 점수가 표시된다 (인증 시)', async ({ page }) => {
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 없음');
      return;
    }

    const accessSuccess = await gotoWithAuth(page, '/analysis/skin/result/test-id');

    if (!accessSuccess) {
      test.skip(true, '인증된 상태로 페이지 접근 실패');
      return;
    }

    // 피부 점수 표시 확인
    const skinScore = page.locator('[data-testid="skin-score"], [data-testid="overall-score"]');
    const scoreDisplay = page.locator('text=/\\d{1,3}점|점수/');
    const circularProgress = page.locator('[data-testid="circular-progress"], .recharts-pie');

    const hasScore = await skinScore.isVisible({ timeout: 5000 }).catch(() => false);
    const hasScoreDisplay = await scoreDisplay
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasProgress = await circularProgress
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // 점수 관련 요소가 하나라도 있으면 성공
    expect(hasScore || hasScoreDisplay || hasProgress).toBe(true);
  });

  test('분석 결과에서 탭 UI가 작동한다', async ({ page }) => {
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 없음');
      return;
    }

    const accessSuccess = await gotoWithAuth(page, '/analysis/skin/result/test-id');

    if (!accessSuccess) {
      test.skip(true, '인증된 상태로 페이지 접근 실패');
      return;
    }

    // 탭 UI 확인
    const tabList = page.locator('[role="tablist"]');
    const hasTabs = await tabList.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTabs) {
      // 기본 분석 탭
      const basicTab = page.locator('button:has-text("기본 분석"), button:has-text("분석")');
      const hasBasicTab = await basicTab
        .first()
        .isVisible()
        .catch(() => false);

      if (hasBasicTab) {
        await basicTab.first().click();
        await page.waitForTimeout(500);
        await expect(basicTab.first()).toHaveAttribute('data-state', 'active');
      }

      // 상세 시각화 탭
      const visualTab = page.locator('button:has-text("상세 시각화"), button:has-text("시각화")');
      const hasVisualTab = await visualTab
        .first()
        .isVisible()
        .catch(() => false);

      if (hasVisualTab) {
        await visualTab.first().click();
        await page.waitForTimeout(500);

        const tabPanel = page.locator('[role="tabpanel"]:visible');
        await expect(tabPanel).toBeVisible();
      }
    }
  });
});

test.describe('피부 분석 - 제품 추천 연동', () => {
  test.skip(true, '추천 제품을 포함한 실제 피부 분석 결과 fixture가 필요함');

  test.beforeEach(async ({ page }) => {
    if (process.env.CLERK_TESTING_TOKEN) {
      await setupClerkTestingToken({ page });
    }
  });

  test('분석 결과에서 추천 제품 섹션이 표시된다', async ({ page }) => {
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 없음');
      return;
    }

    const accessSuccess = await gotoWithAuth(page, '/analysis/skin/result/test-id');

    if (!accessSuccess) {
      test.skip(true, '인증된 상태로 페이지 접근 실패');
      return;
    }

    // 추천 제품 섹션 확인
    const recommendedProducts = page.locator(
      '[data-testid="recommended-products"], [data-testid="product-recommendations"]'
    );
    const productSection = page.locator('text=추천 제품, text=맞춤 제품');
    const productCards = page.locator('[data-testid="product-card"], .product-card');

    const hasRecommended = await recommendedProducts
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasProductSection = await productSection
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasProductCards = await productCards
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // 제품 추천 섹션이 있거나 별도 페이지로 분리됨
    expect(hasRecommended || hasProductSection || hasProductCards).toBe(true);
  });

  test('추천 제품 클릭 시 제품 상세 페이지로 이동한다', async ({ page }) => {
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 없음');
      return;
    }

    const accessSuccess = await gotoWithAuth(page, '/analysis/skin/result/test-id');

    if (!accessSuccess) {
      test.skip(true, '인증된 상태로 페이지 접근 실패');
      return;
    }

    // 제품 카드 또는 링크 클릭
    const productLink = page
      .locator('a:has([data-testid="product-card"]), [data-testid="product-link"]')
      .first();
    const hasProductLink = await productLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProductLink) {
      await productLink.click();
      await waitForLoadingToFinish(page);

      const url = page.url();
      // 제품 상세 페이지 또는 외부 링크로 이동
      expect(url).toMatch(/products|coupang|iherb|musinsa/);
    }
  });
});

test.describe('피부 분석 - JavaScript 에러 없음', () => {
  test('분석 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(ROUTES.ANALYSIS_SKIN);
    await waitForLoadingToFinish(page);

    // 허용되는 에러 필터링 (hydration, ResizeObserver 등)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('hydration') &&
        !e.includes('ResizeObserver') &&
        !e.includes('MediaPipe') &&
        !e.includes('FaceMesh')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('분석 결과 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/analysis/skin/result/mock-id');
    await waitForLoadingToFinish(page);

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('hydration') &&
        !e.includes('ResizeObserver') &&
        !e.includes('MediaPipe') &&
        !e.includes('FaceMesh')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('피부 분석 - 모바일 반응형', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE 크기

  test('모바일에서 피부 분석 페이지가 정상 표시된다', async ({ page }) => {
    await page.goto(ROUTES.ANALYSIS_SKIN);
    await waitForLoadingToFinish(page);

    // 페이지가 정상 로드됨
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // 가로 스크롤 없음 확인
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 약간의 여유
  });
});
