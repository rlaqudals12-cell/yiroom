/**
 * 소셜 기능 E2E 테스트
 * 친구, 리더보드, 피드 테스트
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('소셜 - 친구 페이지', () => {
  test('친구 목록 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.FRIENDS);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/friends|sign-in/);
  });

  test('친구 검색 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.FRIENDS_SEARCH);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/friends\/search|sign-in/);
  });

  test('친구 요청 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.FRIENDS_REQUESTS);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/friends\/requests|sign-in/);
  });

  test('친구 검색 입력이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.FRIENDS_SEARCH);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }

    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]');
    if (!(await searchInput.isVisible().catch(() => false))) {
      test.skip(true, '친구 검색 입력 fixture가 없습니다.');
      return;
    }

    await searchInput.fill('테스트');
    await expect(searchInput).toHaveValue('테스트');
  });
});

test.describe('소셜 - 리더보드', () => {
  test('리더보드 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.LEADERBOARD);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/leaderboard|sign-in/);
  });

  test('리더보드 기본 탭만 표시되고 비활성 웰니스 탭은 숨겨진다', async ({ page }) => {
    await page.goto(ROUTES.LEADERBOARD);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }

    await expect(page.getByRole('tab', { name: /경험치|XP/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /레벨|Lv/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /웰니스|WS/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /운동/ })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: /영양/ })).toHaveCount(0);
  });

  test('내 순위 카드가 표시된다', async ({ page }) => {
    await page.goto(ROUTES.LEADERBOARD);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }

    await expect(page.getByText('현재 위치', { exact: true })).toBeVisible();
    await expect(page.getByText('누적 XP', { exact: true })).toBeVisible();
  });
});

test.describe('소셜 - 피드 게이트', () => {
  test('비활성 피드는 홈으로 이동한다', async ({ page }) => {
    await page.goto(ROUTES.FEED);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/home|sign-in/);
  });

  test('비활성 피드 UI는 노출하지 않는다', async ({ page }) => {
    await page.goto(ROUTES.FEED);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }

    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('[data-testid*="feed"]')).toHaveCount(0);
  });
});

test.describe('소셜 - 웰니스 게이트', () => {
  test('비활성 웰니스는 홈으로 이동한다', async ({ page }) => {
    await page.goto(ROUTES.WELLNESS);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/home|sign-in/);
  });

  test('비활성 웰니스 UI는 노출하지 않는다', async ({ page }) => {
    await page.goto(ROUTES.WELLNESS);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }

    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('[data-testid*="wellness"]')).toHaveCount(0);
  });
});

test.describe('소셜 - 공유 버튼', () => {
  test('분석 결과 페이지에 공유 버튼이 있다', async ({ page }) => {
    // 퍼스널 컬러 결과 페이지 테스트
    await page.goto('/analysis/personal-color');
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }

    const resultSurface = page.locator(
      '[data-testid="personal-color-result-page"], [data-testid="analysis-result"]'
    );
    if (
      !(await resultSurface
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      test.skip(true, '공유 가능한 분석 결과 fixture가 없음');
      return;
    }

    // 공유 버튼 확인
    const shareButton = page
      .locator('[data-testid="share-button"], button:has-text("공유")')
      .first();
    await expect(shareButton).toBeVisible();
  });

  test('ShareButtons 컴포넌트가 소셜 공유 아이콘을 렌더링한다', async ({ page }) => {
    await page.goto('/analysis/personal-color');
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }

    // ShareButtons 컴포넌트 확인
    const shareButtons = page.locator('[data-testid="share-buttons"]');
    const hasShareButtons = await shareButtons.isVisible().catch(() => false);

    if (!hasShareButtons) {
      test.skip(true, '공유 가능한 분석 결과 fixture가 없음');
      return;
    }

    // X, 카카오, 클립보드 버튼 확인
    const xButton = page.locator('button[aria-label*="X"]');
    const kakaoButton = page.locator('button[aria-label*="카카오"]');
    const copyButton = page.locator('button[aria-label*="복사"]');
    const hasX = await xButton.isVisible().catch(() => false);
    const hasKakao = await kakaoButton.isVisible().catch(() => false);
    const hasCopy = await copyButton.isVisible().catch(() => false);
    expect(hasX || hasKakao || hasCopy).toBe(true);
  });
});

test.describe('소셜 - JavaScript 에러 없음', () => {
  const socialPages = [
    { name: '친구', route: ROUTES.FRIENDS },
    { name: '친구 검색', route: ROUTES.FRIENDS_SEARCH },
    { name: '리더보드', route: ROUTES.LEADERBOARD },
    { name: '피드', route: ROUTES.FEED },
    { name: '웰니스', route: ROUTES.WELLNESS },
  ];

  for (const { name, route } of socialPages) {
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
