/**
 * 현재 설정 화면의 알림 탭 E2E 테스트.
 * /settings는 /profile/settings로 통합되었으므로 알림 탭을 명시적으로 연다.
 */

import { expect, test } from '@playwright/test';
import { waitForLoadingToFinish } from '../fixtures';

const NOTIFICATION_SETTINGS_URL = '/profile/settings?tab=notifications';

test.describe('알림 설정', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(NOTIFICATION_SETTINGS_URL);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      test.skip(true, '알림 설정은 로그인이 필요함');
      return;
    }

    await expect(page.getByRole('tab', { name: '알림' })).toHaveAttribute('aria-selected', 'true');
  });

  test('알림 설정 본문과 마스터 토글이 표시된다', async ({ page }) => {
    await expect(page.locator('[data-testid="notification-settings"]')).toBeVisible();
    await expect(page.getByRole('switch', { name: '알림 받기' })).toBeVisible();
  });

  test('소셜·성취 알림 토글이 표시된다', async ({ page }) => {
    await expect(page.getByRole('switch', { name: '소셜 알림' })).toBeVisible();
    await expect(page.getByRole('switch', { name: '성취 알림' })).toBeVisible();
  });

  test('비활성 웰니스 모듈의 알림 설정은 노출하지 않는다', async ({ page }) => {
    await expect(page.getByRole('switch', { name: '운동 리마인더' })).toHaveCount(0);
    await expect(page.getByRole('switch', { name: '식사 리마인더' })).toHaveCount(0);
    await expect(page.getByRole('switch', { name: '연속 기록 경고' })).toHaveCount(0);
  });

  test('알림 설정 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.reload();
    await waitForLoadingToFinish(page);

    const criticalErrors = errors.filter(
      (error) => !error.includes('hydration') && !error.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
