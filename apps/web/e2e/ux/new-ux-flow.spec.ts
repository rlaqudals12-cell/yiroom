/**
 * 새 UX 흐름 E2E 테스트
 * 5탭 구조: Home, Beauty, Style, Record, Me
 */

import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';
import { hasTestUserCredentials, loginAsTestUser } from '../utils/auth';

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
    expect(url).toMatch(/home|sign-in/);
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
    expect(url).toMatch(/home|sign-in/);
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

test.describe('새 UX - 인증된 모바일 하단 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.CLERK_TESTING_TOKEN || !hasTestUserCredentials(),
      'Clerk 토큰과 인증 사용자 fixture가 필요함'
    );
    await setupClerkTestingToken({ page });
    const loginSuccess = await loginAsTestUser(page, { waitForDashboard: false });
    test.skip(!loginSuccess, '인증 사용자 로그인 실패');
  });

  test('모바일에서 5탭 하단 네비게이션이 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    const bottomNav = page.getByTestId('bottom-nav');
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole('menuitem')).toHaveCount(5);
  });

  test('뷰티 탭이 뷰티 페이지로 이동한다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    const beautyTab = page.getByTestId('bottom-nav').getByRole('menuitem', { name: '뷰티' });
    await expect(beautyTab).toBeVisible();
    await beautyTab.click();
    await expect(page).toHaveURL(/\/beauty/);
  });
});

test.describe('새 UX - 리다이렉트', () => {
  test('대시보드에서 홈으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForLoadingToFinish(page);

    // 비인증이면 로그인, 인증 상태면 홈으로 이동해야 하며 /dashboard 잔류는 실패다.
    const url = page.url();
    expect(url).toMatch(/home|sign-in/);
  });

  test('루트 경로는 랜딩 페이지에 유지된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoadingToFinish(page);

    expect(new URL(page.url()).pathname).toBe('/');
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

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const searchInput = page.getByRole('combobox', { name: '검색어 입력' });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('비타민');
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option').first()).toContainText('비타민');
  });

  test('검색 실행 시 결과 탭이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.SEARCH);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const searchInput = page.getByRole('combobox', { name: '검색어 입력' });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('레티놀');
    await searchInput.press('Enter');
    await waitForLoadingToFinish(page);
    await expect(page.getByRole('tab', { name: '전체' })).toBeVisible();
  });

  test('최근 검색어 삭제 버튼이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.SEARCH);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const deleteButtons = page.locator('button[aria-label*="검색어 삭제"]');
    const initialCount = await deleteButtons.count();
    if (initialCount === 0) {
      test.skip(true, '최근 검색어 fixture가 없음');
      return;
    }

    await deleteButtons.first().click();
    await expect(deleteButtons).toHaveCount(initialCount - 1);
  });
});

test.describe('새 UX - 기록 페이지 게이트', () => {
  test('비활성 기록 화면은 인증 또는 홈 경로로 닫혀 있다', async ({ page }) => {
    await page.goto(ROUTES.RECORD);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page).toHaveURL(/\/home/);
    await expect(page.getByRole('button', { name: '물 1잔 추가' })).toHaveCount(0);
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
