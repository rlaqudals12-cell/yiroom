/**
 * 도움말/기타 페이지 E2E 테스트
 * FAQ, 공지사항, 코치/채팅 테스트
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('도움말 - FAQ', () => {
  test('FAQ 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.HELP_FAQ);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/faq|help|sign-in/);
  });

  test('FAQ 아코디언이 작동한다', async ({ page }) => {
    await page.goto(ROUTES.HELP_FAQ);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }

    // 아코디언 항목 찾기
    const accordionTrigger = page
      .locator('[data-testid^="faq-item-"] button[aria-expanded]')
      .first();
    if (!(await accordionTrigger.isVisible().catch(() => false))) {
      test.skip(true, 'FAQ 아코디언 fixture가 없습니다.');
      return;
    }

    await accordionTrigger.click();
    await expect(accordionTrigger).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('도움말 - 공지사항', () => {
  test('공지사항 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.ANNOUNCEMENTS);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/announcements|sign-in/);
  });

  test('공지사항 목록이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.ANNOUNCEMENTS);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }

    // 공지사항 카드 또는 빈 상태 확인
    const announcementCard = page.locator('[data-testid*="announcement"]');
    const emptyState = page.getByText('공지사항이 없습니다');
    await expect(announcementCard.first().or(emptyState)).toBeVisible();
  });
});

test.describe('AI 코치/채팅', () => {
  test('코치 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.COACH);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/coach|sign-in/);
  });

  test('채팅 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.CHAT);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/chat|sign-in/);
  });

  test('채팅 입력 필드가 표시된다', async ({ page }) => {
    await page.goto(ROUTES.CHAT);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }

    // 채팅 입력 필드 찾기
    const chatInput = page.locator('input[placeholder*="메시지"], textarea[placeholder*="메시지"]');
    await expect(chatInput).toBeVisible();
  });

  test('추천 질문이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.CHAT);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/sign-in/);
      return;
    }

    // 추천 질문 버튼 찾기
    const suggestedQuestions = page
      .locator('button:has-text("추천"), [data-testid*="suggested"]')
      .first();
    await expect(suggestedQuestions).toBeVisible();
  });
});

test.describe('도움말 - JavaScript 에러 없음', () => {
  const helpPages = [
    { name: 'FAQ', route: ROUTES.HELP_FAQ },
    { name: '공지사항', route: ROUTES.ANNOUNCEMENTS },
    { name: '코치', route: ROUTES.COACH },
    { name: '채팅', route: ROUTES.CHAT },
  ];

  for (const { name, route } of helpPages) {
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
