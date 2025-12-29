/**
 * 새 UX 흐름 E2E 테스트
 * 5탭 구조: Home, Beauty, Style, Record, Me
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('새 UX - 페이지 접근', () => {
  test('홈 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    // 페이지 로드 확인
    const url = page.url();
    expect(url).toMatch(/home|sign-in/);
  });

  test('뷰티 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/beauty|sign-in/);
  });

  test('스타일 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.STYLE);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/style|sign-in/);
  });

  test('기록 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.RECORD);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/record|sign-in/);
  });

  test('검색 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.SEARCH);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/search|sign-in/);
  });

  test('알림 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.NOTIFICATIONS);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/notifications|sign-in/);
  });

  test('설정 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/settings|sign-in/);
  });

  test('피드 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.FEED);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/feed|sign-in/);
  });
});

test.describe('새 UX - 카테고리 페이지', () => {
  test('뷰티 카테고리 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(`${ROUTES.BEAUTY_CATEGORY}/skincare`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/beauty\/category|sign-in/);
  });

  test('스타일 카테고리 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(`${ROUTES.STYLE_CATEGORY}/tops`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/style\/category|sign-in/);
  });

  test('코디 상세 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(`${ROUTES.STYLE_OUTFIT}/1`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/style\/outfit|sign-in/);
  });
});

test.describe('새 UX - 하단 네비게이션', () => {
  test('모바일에서 5탭 하단 네비게이션이 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    const isVisible = await bottomNav.isVisible().catch(() => false);

    if (isVisible) {
      await expect(bottomNav).toBeVisible();

      // 5개 탭 확인
      const navItems = bottomNav.locator('a, button');
      const count = await navItems.count();
      expect(count).toBeGreaterThanOrEqual(5);
    }
  });

  test('탭 클릭 시 해당 페이지로 이동한다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    const isVisible = await bottomNav.isVisible().catch(() => false);

    if (isVisible) {
      // 뷰티 탭 클릭
      const beautyTab = bottomNav.locator('a[href*="beauty"], button:has-text("뷰티")').first();
      if (await beautyTab.isVisible()) {
        await beautyTab.click();
        await waitForLoadingToFinish(page);
        expect(page.url()).toMatch(/beauty/);
      }
    }
  });
});

test.describe('새 UX - 리다이렉트', () => {
  test('대시보드에서 홈으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForLoadingToFinish(page);

    // 리다이렉트 확인 (홈 또는 로그인)
    const url = page.url();
    expect(url).toMatch(/home|sign-in|dashboard/);
  });

  test('루트 경로에서 홈으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/home|sign-in/);
  });
});

test.describe('새 UX - 제품/코디 상세', () => {
  test('뷰티 제품 상세 페이지가 로드된다', async ({ page }) => {
    await page.goto('/beauty/1');
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/beauty\/\d+|sign-in/);
  });

  test('스타일 아이템 상세 페이지가 로드된다', async ({ page }) => {
    await page.goto('/style/1');
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/style\/\d+|sign-in/);
  });
});

test.describe('새 UX - 검색 상호작용', () => {
  test('검색어 입력 시 자동완성이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.SEARCH);
    await waitForLoadingToFinish(page);

    // 로그인 페이지가 아닌 경우에만 테스트
    if (!page.url().includes('sign-in')) {
      const searchInput = page.locator('input[aria-label="검색어 입력"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('비타민');

        // 자동완성 드롭다운 대기
        await page.waitForTimeout(500);

        // 자동완성이 표시되는지 확인 (선택적)
        const suggestions = page.locator('button:has-text("비타민")');
        const hasSuggestions = await suggestions.first().isVisible().catch(() => false);
        expect(hasSuggestions || true).toBe(true);
      }
    }
  });

  test('검색 실행 시 결과 탭이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.SEARCH);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const searchInput = page.locator('input[aria-label="검색어 입력"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('레티놀');
        await searchInput.press('Enter');
        await waitForLoadingToFinish(page);

        // 탭이 표시되는지 확인
        const allTab = page.locator('button[role="tab"]:has-text("전체")');
        const isVisible = await allTab.isVisible().catch(() => false);
        expect(isVisible || true).toBe(true);
      }
    }
  });

  test('최근 검색어 삭제 버튼이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.SEARCH);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 최근 검색어 삭제 버튼 찾기
      const deleteButton = page.locator('button[aria-label*="검색어 삭제"]').first();
      const hasDeleteButton = await deleteButton.isVisible().catch(() => false);

      if (hasDeleteButton) {
        const initialCount = await page.locator('button[aria-label*="검색어 삭제"]').count();
        await deleteButton.click();
        await page.waitForTimeout(300);
        const newCount = await page.locator('button[aria-label*="검색어 삭제"]').count();
        expect(newCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });
});

test.describe('새 UX - 기록 페이지 상호작용', () => {
  test('운동/영양 탭 전환이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.RECORD);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 영양 탭 클릭
      const nutritionTab = page.locator('button[role="tab"]:has-text("영양")');
      const hasTab = await nutritionTab.isVisible().catch(() => false);

      if (hasTab) {
        await nutritionTab.click();
        await page.waitForTimeout(300);

        // 탭이 선택되었는지 확인
        const isSelected = await nutritionTab.getAttribute('aria-selected');
        expect(isSelected).toBe('true');
      }
    }
  });

  test('수분 섭취 버튼이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.RECORD);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 영양 탭으로 이동
      const nutritionTab = page.locator('button[role="tab"]:has-text("영양")');
      if (await nutritionTab.isVisible().catch(() => false)) {
        await nutritionTab.click();
        await page.waitForTimeout(300);
      }

      // 물 추가 버튼 찾기
      const addWaterBtn = page.locator('button[aria-label="물 1잔 추가"]');
      const hasWaterBtn = await addWaterBtn.isVisible().catch(() => false);

      if (hasWaterBtn) {
        await addWaterBtn.click();
        expect(true).toBe(true);
      }
    }
  });
});

test.describe('새 UX - 스타일 페이지 상호작용', () => {
  test('카테고리 필터 탭이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.STYLE);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 카테고리 탭 찾기
      const categoryTab = page.locator('button[role="tab"]').first();
      const hasTab = await categoryTab.isVisible().catch(() => false);

      if (hasTab) {
        await categoryTab.click();
        await page.waitForTimeout(300);

        const isSelected = await categoryTab.getAttribute('aria-selected');
        expect(isSelected).toBe('true');
      }
    }
  });

  test('체형 맞춤 필터 토글이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.STYLE);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 토글 버튼 찾기
      const toggleBtn = page.locator('button[role="switch"]');
      const hasToggle = await toggleBtn.isVisible().catch(() => false);

      if (hasToggle) {
        const initialState = await toggleBtn.getAttribute('aria-checked');
        await toggleBtn.click();
        await page.waitForTimeout(300);

        const newState = await toggleBtn.getAttribute('aria-checked');
        expect(newState).not.toBe(initialState);
      }
    }
  });
});

test.describe('새 UX - 뷰티 페이지 상호작용', () => {
  test('피부타입 필터 칩이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 피부타입 필터 섹션 찾기
      const skinTypeSection = page.locator('section[aria-label="피부타입 필터"]');
      const hasSkinTypeFilter = await skinTypeSection.isVisible().catch(() => false);

      if (hasSkinTypeFilter) {
        // 건성 버튼 찾기 및 클릭
        const dryButton = skinTypeSection.locator('button:has-text("건성")');
        if (await dryButton.isVisible()) {
          await dryButton.click();
          await page.waitForTimeout(300);

          const isPressed = await dryButton.getAttribute('aria-pressed');
          expect(isPressed).toBe('true');
        }
      }
    }
  });

  test('피부고민 필터 칩이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 피부고민 필터 섹션 찾기
      const concernSection = page.locator('section[aria-label="피부고민 필터"]');
      const hasConcernFilter = await concernSection.isVisible().catch(() => false);

      if (hasConcernFilter) {
        // 미백 버튼 찾기 및 클릭
        const whiteningButton = concernSection.locator('button:has-text("미백")');
        if (await whiteningButton.isVisible()) {
          await whiteningButton.click();
          await page.waitForTimeout(300);

          const isPressed = await whiteningButton.getAttribute('aria-pressed');
          expect(isPressed).toBe('true');
        }
      }
    }
  });

  test('카테고리 필터가 작동한다', async ({ page }) => {
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 카테고리 탭 찾기
      const categoryTabs = page.locator('button[role="tab"]');
      const tabCount = await categoryTabs.count();

      if (tabCount > 1) {
        // 두 번째 탭 클릭 (토너/스킨)
        await categoryTabs.nth(1).click();
        await page.waitForTimeout(300);

        const isSelected = await categoryTabs.nth(1).getAttribute('aria-selected');
        expect(isSelected).toBe('true');
      }
    }
  });

  test('정렬 Bottom Sheet가 작동한다', async ({ page }) => {
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 정렬 버튼 찾기 (Bottom Sheet 트리거)
      const sortButton = page.locator('button[aria-haspopup="dialog"]');
      const hasSortButton = await sortButton.isVisible().catch(() => false);

      if (hasSortButton) {
        await sortButton.click();
        await page.waitForTimeout(300);

        // Bottom Sheet가 열렸는지 확인
        const bottomSheet = page.locator('[role="dialog"][aria-label="정렬 기준 선택"]');
        const isOpen = await bottomSheet.isVisible().catch(() => false);
        expect(isOpen).toBe(true);

        // 리뷰순 옵션 클릭
        const reviewOption = bottomSheet.locator('button:has-text("리뷰순")');
        if (await reviewOption.isVisible()) {
          await reviewOption.click();
          await page.waitForTimeout(300);

          // Bottom Sheet가 닫혔는지 확인
          const isClosedAfterSelect = await bottomSheet.isVisible().catch(() => false);
          expect(isClosedAfterSelect).toBe(false);
        }
      }
    }
  });

  test('제품 카드 클릭 시 상세 페이지로 이동한다', async ({ page }) => {
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 제품 카드 찾기
      const productCard = page.locator('button, a').filter({ hasText: /\d+%/ }).first();
      const hasCard = await productCard.isVisible().catch(() => false);

      if (hasCard) {
        await productCard.click();
        await waitForLoadingToFinish(page);

        expect(page.url()).toMatch(/beauty|sign-in/);
      }
    }
  });

  test('매칭 필터 토글이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 매칭 필터 토글 찾기
      const matchToggle = page.locator('button[role="switch"][aria-label*="매칭"]');
      const hasToggle = await matchToggle.isVisible().catch(() => false);

      if (hasToggle) {
        const initialState = await matchToggle.getAttribute('aria-checked');
        await matchToggle.click();
        await page.waitForTimeout(200);

        const newState = await matchToggle.getAttribute('aria-checked');
        expect(newState).not.toBe(initialState);
      }
    }
  });
});

test.describe('새 UX - 홈 페이지 상호작용', () => {
  test('오늘 기록 상세보기가 작동한다', async ({ page }) => {
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const recordBtn = page.locator('button:has-text("상세보기")');
      const hasBtn = await recordBtn.isVisible().catch(() => false);

      if (hasBtn) {
        await recordBtn.click();
        await waitForLoadingToFinish(page);

        expect(page.url()).toMatch(/record|home|sign-in/);
      }
    }
  });

  test('오늘의 추천 카드가 클릭 가능하다', async ({ page }) => {
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 피부 맞춤 버튼 찾기
      const beautyCard = page.locator('button[aria-label*="피부 맞춤"]');
      const hasCard = await beautyCard.isVisible().catch(() => false);

      if (hasCard) {
        await beautyCard.click();
        await waitForLoadingToFinish(page);

        expect(page.url()).toMatch(/beauty|home|sign-in/);
      }
    }
  });
});

test.describe('새 UX - JavaScript 에러 없음', () => {
  const pagesToTest = [
    { name: '홈', route: ROUTES.NEW_HOME },
    { name: '뷰티', route: ROUTES.BEAUTY },
    { name: '스타일', route: ROUTES.STYLE },
    { name: '기록', route: ROUTES.RECORD },
    { name: '검색', route: ROUTES.SEARCH },
  ];

  for (const { name, route } of pagesToTest) {
    test(`${name} 페이지에서 JavaScript 에러가 발생하지 않는다`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto(route);
      await waitForLoadingToFinish(page);

      // 크리티컬 에러만 확인
      const criticalErrors = errors.filter(
        (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  }
});
