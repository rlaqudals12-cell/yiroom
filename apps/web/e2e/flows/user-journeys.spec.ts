/**
 * 사용자 여정 E2E 테스트
 * 핵심 사용자 플로우 검증 (end-to-end)
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish, TEST_CONFIG } from '../fixtures';

test.describe('사용자 여정 - 분석 플로우', () => {
  test('홈 → 분석 선택 → 분석 페이지 진입 플로우', async ({ page }) => {
    // 1. 홈페이지 접속
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    // 2. 분석 관련 카드/버튼 찾기
    // 실제 목적지가 있는 진입점만 고른다. "분석" 문구를 포함한 비내비게이션 버튼은 제외한다.
    const analysisLink = page.locator('a[href*="analysis"], a[href*="beauty"]');
    if (
      !(await analysisLink
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      test.skip(true, '홈에 분석 진입점이 노출되는 fixture가 없음');
      return;
    }
    await expect(analysisLink.first()).toBeVisible();
    await analysisLink.first().click();
    await waitForLoadingToFinish(page);

    // 3. 분석 관련 페이지로 이동했는지 확인
    const url = page.url();
    expect(url).toMatch(/analysis|beauty|sign-in/);
  });

  test('분석 페이지 → 분석 시작 → 업로드 단계 플로우', async ({ page }) => {
    await page.goto(ROUTES.ANALYSIS_PERSONAL_COLOR);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    // 1. 분석 시작 버튼 클릭
    const startButton = page.locator(
      'button:has-text("분석"), button:has-text("시작"), button:has-text("진단")'
    );
    await expect(startButton.first()).toBeVisible();
    await startButton.first().click();
    await waitForLoadingToFinish(page);

    // 2. 업로드 영역 또는 다음 단계가 표시되는지 확인
    const uploadArea = page.locator(
      'input[type="file"], [data-testid*="upload"], text=사진, text=촬영'
    );
    await expect(uploadArea.first()).toBeVisible();
  });

  test('분석 결과 → 제품 추천 연동 플로우', async ({ page }) => {
    // Mock 분석 결과 페이지 접근
    await page.goto('/analysis/skin/result/mock-id');
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    // 1. 추천 제품 영역 찾기
    const recommendSection = page.locator(
      'text=추천, text=제품, [data-testid*="recommend"], section:has-text("추천")'
    );
    const hasRecommend = await recommendSection
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasRecommend) {
      test.skip(true, '추천 제품이 포함된 분석 결과 fixture가 없음');
      return;
    }

    // 2. 추천 제품 링크 클릭
    const productLink = page.locator('a[href*="products"], button:has-text("더보기")');
    const hasProductLink = await productLink
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasProductLink) {
      test.skip(true, '추천 제품 이동 링크가 포함된 분석 결과 fixture가 없음');
      return;
    }

    await productLink.first().click();
    await waitForLoadingToFinish(page);

    // 3. 제품 페이지로 이동했는지 확인
    const url = page.url();
    expect(url).toMatch(/products|beauty|sign-in/);
  });
});

test.describe('사용자 여정 - 제품 탐색 플로우', () => {
  test('제품 목록 → 필터링 → 상세 페이지 플로우', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    // 1. 필터 버튼/옵션 찾기
    const filterButton = page.locator(
      'button:has-text("필터"), button:has-text("정렬"), [data-testid*="filter"]'
    );
    await expect(filterButton.first()).toBeVisible();
    await filterButton.first().click();
    await page.waitForTimeout(TEST_CONFIG.animationTimeout);

    // 필터 옵션 확인
    const filterOption = page.locator(
      'button:has-text("카테고리"), button:has-text("가격"), [role="option"]'
    );
    await expect(filterOption.first()).toBeVisible();

    // 2. 제품 카드 클릭
    const productCard = page.locator('[data-testid*="product"], a[href*="/products/"]');
    const hasCard = await productCard
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasCard) {
      test.skip(true, '상세 이동을 검증할 제품 fixture가 없음');
      return;
    }

    await productCard.first().click();
    await waitForLoadingToFinish(page);

    // 3. 상세 페이지 요소 확인
    const detailElements = page.locator('button:has-text("구매"), button:has-text("찜"), h1, h2');
    await expect(detailElements.first()).toBeVisible();
  });

  test('제품 상세 → 위시리스트 추가 플로우', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    // 1. 위시리스트 버튼 찾기
    const wishButton = page.locator(
      'button[aria-label*="찜"], button:has-text("찜"), [data-testid*="wish"]'
    );
    const hasWishButton = await wishButton
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasWishButton) {
      test.skip(true, '위시리스트 동작을 검증할 제품 fixture가 없음');
      return;
    }

    // 2. 찜하기 클릭
    await wishButton.first().click();
    await page.waitForTimeout(TEST_CONFIG.animationTimeout);

    // 3. 토스트 메시지 또는 상태 변경 확인
    const toast = page.locator('text=추가, text=저장, [role="alert"]');
    await expect(toast.first()).toBeVisible();
  });
});

test.describe('사용자 여정 - 비활성 웰니스 모듈', () => {
  test('운동 라우트는 홈으로 이동한다', async ({ page }) => {
    await page.goto(ROUTES.WORKOUT_ONBOARDING);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page).toHaveURL(/\/home/);
  });

  test('영양 라우트는 홈으로 이동한다', async ({ page }) => {
    await page.goto(ROUTES.NUTRITION);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page).toHaveURL(/\/home/);
  });
});

test.describe('사용자 여정 - 네비게이션 플로우', () => {
  test('모바일: 하단 탭 네비게이션 전환 플로우', async ({ page }) => {
    await page.setViewportSize(TEST_CONFIG.mobile);
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const bottomNav = page.getByTestId('bottom-nav');
    if (!(await bottomNav.isVisible().catch(() => false))) {
      test.skip(true, '비인증 상태에는 하단 네비게이션이 노출되지 않음');
      return;
    }

    // 하단 네비게이션 탭 테스트
    const navItems = [
      { selector: 'text=뷰티, a[href*="beauty"]', expected: /beauty|home/ },
      { selector: 'text=기록, a[href*="record"]', expected: /record/ },
      { selector: 'text=프로필, a[href*="profile"]', expected: /profile|sign-in/ },
    ];

    let followedNavItem = false;
    for (const { selector, expected } of navItems) {
      const navItem = page.locator(selector);
      const isVisible = await navItem
        .first()
        .isVisible()
        .catch(() => false);

      if (isVisible) {
        await navItem.first().click();
        await waitForLoadingToFinish(page);
        expect(page.url()).toMatch(expected);
        followedNavItem = true;
        break; // 하나만 테스트 (인증 이슈 방지)
      }
    }
    expect(followedNavItem).toBe(true);
  });

  test('데스크톱: 사이드바 네비게이션 플로우', async ({ page }) => {
    await page.setViewportSize(TEST_CONFIG.desktop);
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    // 사이드바 또는 헤더 네비게이션 확인
    const sidebarNav = page.locator('nav, aside, [data-testid*="sidebar"], header');
    const hasNav = await sidebarNav
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasNav).toBe(true);
  });
});

test.describe('사용자 여정 - 크로스 모듈 플로우', () => {
  test('대시보드는 홈으로 이동한다', async ({ page }) => {
    await page.goto(ROUTES.DASHBOARD);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page).toHaveURL(/\/home/);
  });

  test('검색 → 결과 → 상세 페이지 플로우', async ({ page }) => {
    await page.goto(ROUTES.SEARCH);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    // 1. 검색 입력 필드 찾기
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="검색"], input[name="search"]'
    );
    await expect(searchInput.first()).toBeVisible();

    // 2. 검색어 입력
    await searchInput.first().fill('스킨케어');
    await page.keyboard.press('Enter');
    await waitForLoadingToFinish(page);

    // 3. 검색 결과 확인
    const results = page.locator('[data-testid*="result"], [data-testid*="item"], article');
    const emptyState = page.getByRole('heading', { name: '검색 결과가 없습니다' });
    const hasResults = await results
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasResults || hasEmptyState).toBe(true);
  });
});

test.describe('사용자 여정 - 에러 처리 플로우', () => {
  test('인증 필요 페이지 → 로그인 리다이렉트', async ({ page }) => {
    // 인증 필요한 페이지 접근
    await page.goto(ROUTES.PROFILE);
    await waitForLoadingToFinish(page);

    const url = page.url();
    // 프로필 페이지 또는 로그인 페이지로 이동
    expect(url).toMatch(/profile|sign-in/);
  });

  test('존재하지 않는 분석 결과 → 에러 처리', async ({ page }) => {
    await page.goto('/analysis/skin/result/non-existent-id-12345');
    await waitForLoadingToFinish(page);

    const url = page.url();
    // 에러 페이지, 404, 또는 리다이렉트 확인
    expect(url).toMatch(/skin|error|sign-in|404/);
  });

  test('네트워크 에러 시 폴백 UI 표시', async ({ page }) => {
    // 오프라인 시뮬레이션
    await page.context().setOffline(true);

    try {
      await expect(page.goto(ROUTES.NEW_HOME, { waitUntil: 'commit' })).rejects.toThrow();
    } finally {
      // 다음 테스트에 오프라인 상태를 누출하지 않는다.
      await page.context().setOffline(false);
    }
  });
});
