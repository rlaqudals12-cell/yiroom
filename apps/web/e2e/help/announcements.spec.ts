/**
 * 공지사항 E2E 테스트
 * Launch Phase: 목록 렌더링, 상세 시트, 읽음 배지 테스트
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('공지사항 - 페이지 렌더링', () => {
  test('공지사항 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.ANNOUNCEMENTS);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/announcements|sign-in/);
  });

  test('공지사항 헤더가 표시된다', async ({ page }) => {
    await page.goto(ROUTES.ANNOUNCEMENTS);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const header = page.locator('h1:has-text("공지사항")');
    await expect(header).toBeVisible();
  });
});

test.describe('공지사항 - 목록', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.ANNOUNCEMENTS);
    await waitForLoadingToFinish(page);
  });

  test('공지사항 목록이 렌더링된다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const announcementList = page.locator('[data-testid="announcement-list"]');
    const emptyState = page.locator('text=등록된 공지사항이 없습니다');

    // 목록 또는 빈 상태 중 하나가 표시되어야 함
    const hasList = await announcementList.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasList || hasEmpty).toBe(true);
  });

  test('공지사항 카드가 클릭 가능하다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const announcementCard = page.locator('[data-testid^="announcement-card-"]').first();
    const hasCard = await announcementCard.isVisible().catch(() => false);

    if (!hasCard) {
      test.skip(true, '상세를 열 공지사항 fixture가 없음');
      return;
    }

    // 카드 클릭 시 상세 시트가 열리는지 확인
    await announcementCard.click();
    await page.waitForTimeout(300);

    const detailSheet = page.locator('[data-testid="announcement-detail-sheet"]');
    await expect(detailSheet).toBeVisible();
  });

  test('카테고리 필터가 존재한다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const categoryFilter = page.locator('[data-testid="category-filter"]');
    if (!(await categoryFilter.isVisible().catch(() => false))) {
      test.skip(true, '카테고리 필터를 노출할 공지사항 fixture가 없음');
      return;
    }
    await expect(categoryFilter).toBeVisible();
  });

  test('카테고리 필터가 작동한다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const categoryFilter = page.locator('[data-testid="category-filter"]');
    if (!(await categoryFilter.isVisible().catch(() => false))) {
      test.skip(true, '카테고리 필터를 검증할 공지사항 fixture가 없음');
      return;
    }
    await expect(categoryFilter).toBeVisible();

    // 필터 열기
    await categoryFilter.click();
    await page.waitForTimeout(200);

    // 옵션 확인
    const filterOptions = page.locator('[role="option"]');
    const optionCount = await filterOptions.count();

    expect(optionCount).toBeGreaterThan(0);
  });
});

test.describe('공지사항 - 상세 시트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.ANNOUNCEMENTS);
    await waitForLoadingToFinish(page);
  });

  test('공지사항 클릭 시 상세 시트가 열린다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const announcementCard = page.locator('[data-testid^="announcement-card-"]').first();
    const hasCard = await announcementCard.isVisible().catch(() => false);

    if (!hasCard) {
      test.skip(true, '상세를 열 공지사항 fixture가 없음');
      return;
    }

    await announcementCard.click();
    await page.waitForTimeout(300);

    const detailSheet = page.locator('[data-testid="announcement-detail-sheet"]');
    await expect(detailSheet).toBeVisible();
  });

  test('상세 시트에 제목이 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const announcementCard = page.locator('[data-testid^="announcement-card-"]').first();
    const hasCard = await announcementCard.isVisible().catch(() => false);

    if (!hasCard) {
      test.skip(true, '제목을 검증할 공지사항 fixture가 없음');
      return;
    }

    await announcementCard.click();
    await page.waitForTimeout(300);

    const detailSheet = page.locator('[data-testid="announcement-detail-sheet"]');
    await expect(detailSheet).toBeVisible();

    // 시트 내 제목 확인
    const sheetTitle = detailSheet.locator('h2, [role="heading"]');
    await expect(sheetTitle).toBeVisible();
  });

  test('상세 시트 외부 클릭 시 닫힌다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const announcementCard = page.locator('[data-testid^="announcement-card-"]').first();
    const hasCard = await announcementCard.isVisible().catch(() => false);

    if (!hasCard) {
      test.skip(true, '닫기 동작을 검증할 공지사항 fixture가 없음');
      return;
    }

    await announcementCard.click();
    await page.waitForTimeout(300);

    const detailSheet = page.locator('[data-testid="announcement-detail-sheet"]');
    await expect(detailSheet).toBeVisible();

    // 시트 외부 클릭 (오버레이)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await expect(detailSheet).toBeHidden();
  });
});

test.describe('공지사항 - 읽음 상태', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.ANNOUNCEMENTS);
    await waitForLoadingToFinish(page);
  });

  test('읽지 않은 공지 수가 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const unreadCount = page.locator('[data-testid="unread-count"]');
    const isVisible = await unreadCount.isVisible().catch(() => false);

    // 읽지 않은 공지가 있을 때만 표시
    if (isVisible) {
      await expect(unreadCount).toContainText(/\d+/);
    } else {
      await expect(page.getByText('NEW', { exact: true })).toHaveCount(0);
    }
  });

  test('공지사항 클릭 시 읽음 처리된다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const announcementCard = page
      .locator('[data-testid^="announcement-card-"]')
      .filter({ hasText: 'NEW' })
      .first();
    const hasCard = await announcementCard.isVisible().catch(() => false);

    if (!hasCard) {
      test.skip(true, '읽지 않은 공지사항이 없음');
    }

    // 클릭 전 읽지 않은 수 확인 (비교용)
    // 공지사항 클릭
    await announcementCard.click();
    await page.waitForTimeout(500);

    // 클릭 후 읽음 처리 확인 (API 호출 발생)
    // 읽음 처리는 비동기로 진행되므로 에러 없이 완료되면 성공
    await expect(page.locator('[data-testid="announcement-detail-sheet"]')).toBeVisible();
    await expect(announcementCard.getByText('NEW', { exact: true })).toHaveCount(0);
  });
});

test.describe('공지사항 - 뒤로가기', () => {
  test('뒤로가기 버튼이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.HELP_FAQ);
    await waitForLoadingToFinish(page);
    await page.goto(ROUTES.ANNOUNCEMENTS);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const backButton = page.locator('a[href="/dashboard"] button, button:has-text("뒤로")').first();
    await expect(backButton).toBeVisible();
    await backButton.click();
    await waitForLoadingToFinish(page);

    await expect(page).toHaveURL(/\/home/);
  });
});

test.describe('공지사항 - JavaScript 에러 없음', () => {
  test('공지사항 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(ROUTES.ANNOUNCEMENTS);
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(1000);

    // 하이드레이션 관련 에러는 무시
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
