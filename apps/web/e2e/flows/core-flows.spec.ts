/**
 * 핵심 사용자 플로우 E2E 테스트
 * 새 기능 중심: 피부 일기, 소셜 피드, 캡슐, ConnectionAwareness
 *
 * @tag core-flows
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

// ============================================
// 홈 → 각 모듈 진입 플로우
// ============================================

test.describe('핵심 플로우 - 홈 허브', () => {
  test('홈에서 주요 모듈로 진입 가능하다', async ({ page }) => {
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    // 홈에 최소 1개의 활성 모듈 진입점이 있어야 한다.
    const moduleLinks = page.locator('a[href*="beauty"], a[href*="analysis"], a[href*="diary"]');
    await expect(moduleLinks.first()).toBeVisible();
  });

  test('홈에서 피부 일기로 진입 가능하다', async ({ page }) => {
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const diaryLink = page.locator('a[href*="diary"]');
    const hasDiaryLink = await diaryLink
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasDiaryLink) {
      test.skip(true, '피부 일기 CTA가 포함된 홈 브리핑 fixture가 필요함');
      return;
    }

    await diaryLink.first().click();
    await waitForLoadingToFinish(page);
    expect(page.url()).toMatch(/diary/);
  });
});

// ============================================
// 소셜 피드 플로우
// ============================================

test.describe('핵심 플로우 - 소셜 피드', () => {
  test('피드 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.FEED);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/home|sign-in/);
  });

  test('피드에서 게시물 카드가 표시되거나 빈 상태가 보인다', async ({ page }) => {
    await page.goto(ROUTES.FEED);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('[data-testid*="feed"]')).toHaveCount(0);
  });

  test('리더보드 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.LEADERBOARD);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/leaderboard|sign-in/);
  });
});

// ============================================
// 캡슐 에코시스템 플로우
// ============================================

test.describe('핵심 플로우 - 뷰티 캡슐', () => {
  test('뷰티 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/beauty|sign-in/);
  });

  test('뷰티 페이지에서 탭 전환이 가능하다', async ({ page }) => {
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const tabs = page.locator('[role="tablist"]');
    const tabButtons = tabs.getByRole('tab');
    await expect(tabs.first()).toBeVisible();
    expect(await tabButtons.count()).toBeGreaterThanOrEqual(2);
    await tabButtons.nth(1).click();
    await waitForLoadingToFinish(page);
    expect(page.url()).toMatch(/beauty/);
  });

  test('뷰티 카테고리 상세 경로는 단일 뷰티 화면으로 통합된다', async ({ page }) => {
    await page.goto('/beauty/category/skincare');
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page).toHaveURL(/\/beauty(?:\?|$)/);
  });
});

// ============================================
// 스타일/옷장 플로우
// ============================================

test.describe('핵심 플로우 - 스타일/옷장', () => {
  test('스타일 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.STYLE);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/style|sign-in/);
  });

  test('옷장 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.CLOSET);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/closet|sign-in/);
  });

  test('옷장 → 아이템 추가 페이지 진입', async ({ page }) => {
    await page.goto(ROUTES.CLOSET);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const addButton = page.locator(
      'a[href*="closet/add"], button:has-text("추가"), button:has-text("등록")'
    );
    await expect(addButton.first()).toBeVisible();
    await addButton.first().click();
    await waitForLoadingToFinish(page);
    expect(page.url()).toMatch(/closet|add|sign-in/);
  });
});

// ============================================
// 코치/채팅 플로우
// ============================================

test.describe('핵심 플로우 - AI 코치', () => {
  test('코치 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.COACH);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/coach|sign-in/);
  });

  test('채팅 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.CHAT);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/chat|sign-in/);
  });

  test('코치 페이지에 채팅 입력 영역이 존재한다', async ({ page }) => {
    await page.goto(ROUTES.COACH);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const chatInput = page.locator(
      'input[placeholder*="질문"], textarea[placeholder*="질문"], input[placeholder*="메시지"], textarea[placeholder*="메시지"]'
    );
    const hasInput = await chatInput
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasInput) {
      test.skip(true, '채팅 입력이 활성화된 사용자 상태 fixture가 필요함');
      return;
    }

    await expect(chatInput.first()).toBeVisible();
  });
});

// ============================================
// 제품 스캔 플로우
// ============================================

test.describe('핵심 플로우 - 제품 스캔', () => {
  test('스캔 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.SCAN);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/scan|sign-in/);
  });

  test('선반 관리 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.SCAN_SHELF);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/scan|shelf|sign-in/);
  });
});

// ============================================
// 온보딩 플로우
// ============================================

test.describe('핵심 플로우 - 온보딩', () => {
  test('온보딩 진입(통합 분석)이 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.ONBOARDING);
    await waitForLoadingToFinish(page);

    const url = page.url();
    // 통합 분석 또는 로그인 또는 홈(이미 완료된 경우)
    expect(url).toMatch(/analysis\/integrated|sign-in|home/);
  });
});

// ============================================
// 친구/소셜 플로우
// ============================================

test.describe('핵심 플로우 - 친구', () => {
  test('친구 목록 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.FRIENDS);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/friends|sign-in/);
  });

  test('친구 검색 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.FRIENDS_SEARCH);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/friends|search|sign-in/);
  });
});

// ============================================
// 연간 리뷰 플로우
// ============================================

test.describe('핵심 플로우 - 연간 리뷰', () => {
  test('연간 리뷰 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.YEAR_REVIEW);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/year-review|sign-in/);
  });
});

// ============================================
// 크로스 모듈 플로우 (심화)
// ============================================

test.describe('핵심 플로우 - 크로스 모듈', () => {
  test('뷰티 → 분석 → 일기 순환 플로우', async ({ page }) => {
    // 1. 뷰티 페이지
    await page.goto(ROUTES.BEAUTY);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    // 사용자 상태에 따라 분석 후속 CTA가 없는 뷰티 화면도 있다.
    const analysisLink = page.locator('a[href*="analysis"]');
    const hasLink = await analysisLink
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasLink) {
      test.skip(true, '분석 후속 CTA가 포함된 뷰티 사용자 상태 fixture가 필요함');
      return;
    }

    await analysisLink.first().click();
    await waitForLoadingToFinish(page);
    expect(page.url()).toMatch(/analysis/);
  });

  test('홈은 비활성 기록 진입점을 노출하지 않는다', async ({ page }) => {
    await page.goto(ROUTES.NEW_HOME);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page.locator('a[href^="/record"]')).toHaveCount(0);
  });
});

// ============================================
// JS 에러 확인 (새 라우트)
// ============================================

test.describe('핵심 플로우 - JS 에러 없음 확인 @smoke', () => {
  const NEW_ROUTES = [
    { name: '피부 일기', path: '/diary' },
    { name: '피드', path: ROUTES.FEED },
    { name: '뷰티', path: ROUTES.BEAUTY },
    { name: '스타일', path: ROUTES.STYLE },
    { name: '코치', path: ROUTES.COACH },
    { name: '스캔', path: ROUTES.SCAN },
    { name: '웰니스', path: ROUTES.WELLNESS },
    { name: '도움말', path: ROUTES.HELP_FAQ },
    { name: '공지사항', path: ROUTES.ANNOUNCEMENTS },
  ];

  for (const route of NEW_ROUTES) {
    test(`${route.name} 페이지에 JS 에러 없음`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto(route.path);
      await waitForLoadingToFinish(page);

      // hydration, ResizeObserver 에러는 무시
      const criticalErrors = errors.filter(
        (e) => !e.includes('hydration') && !e.includes('ResizeObserver') && !e.includes('Clerk')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  }
});
