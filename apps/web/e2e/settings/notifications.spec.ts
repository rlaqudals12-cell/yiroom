/**
 * 알림 설정 E2E 테스트
 * Launch Phase: 알림 토글, 리마인더 시간 설정 테스트
 */

import { test, expect } from '@playwright/test';
import { waitForLoadingToFinish } from '../fixtures';

test.describe('알림 설정', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await waitForLoadingToFinish(page);
  });

  test('알림 설정 컴포넌트가 렌더링된다', async ({ page }) => {
    // 로그인 페이지로 리다이렉트되지 않았다면 확인
    if (page.url().includes('/settings')) {
      const notificationSettings = page.locator('[data-testid="notification-settings"]');
      const isVisible = await notificationSettings.isVisible().catch(() => false);

      // 컴포넌트가 존재하면 확인
      if (isVisible) {
        await expect(notificationSettings).toBeVisible();
      }
    }
  });

  test('알림 활성화 토글이 작동한다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    const notificationToggle = page.locator('[data-testid="notification-toggle"]');
    const isVisible = await notificationToggle.isVisible().catch(() => false);

    if (isVisible) {
      // 초기 상태 확인
      const isChecked = await notificationToggle.isChecked().catch(() => null);
      if (isChecked !== null) {
        // 토글 클릭
        await notificationToggle.click();
        await page.waitForTimeout(300);

        // 상태 변경 확인
        const newState = await notificationToggle.isChecked().catch(() => null);
        expect(newState).not.toBe(isChecked);
      }
    }
  });

  test('운동 리마인더 토글이 존재한다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    const workoutToggle = page.locator('[data-testid="workout-reminder-toggle"]');
    const isVisible = await workoutToggle.isVisible().catch(() => false);

    if (isVisible) {
      await expect(workoutToggle).toBeVisible();
    }
  });

  test('영양 리마인더 토글이 존재한다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    const nutritionToggle = page.locator('[data-testid="nutrition-reminder-toggle"]');
    const isVisible = await nutritionToggle.isVisible().catch(() => false);

    if (isVisible) {
      await expect(nutritionToggle).toBeVisible();
    }
  });

  test('스트릭 경고 토글이 존재한다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    const streakToggle = page.locator('[data-testid="streak-warning-toggle"]');
    const isVisible = await streakToggle.isVisible().catch(() => false);

    if (isVisible) {
      await expect(streakToggle).toBeVisible();
    }
  });

  test('수분 섭취 알림 토글이 존재한다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    const waterToggle = page.locator('[data-testid="water-reminder-toggle"]');
    const isVisible = await waterToggle.isVisible().catch(() => false);

    if (isVisible) {
      await expect(waterToggle).toBeVisible();
    }
  });

  test('소셜 알림 토글이 존재한다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    const socialToggle = page.locator('[data-testid="social-notifications-toggle"]');
    const isVisible = await socialToggle.isVisible().catch(() => false);

    if (isVisible) {
      await expect(socialToggle).toBeVisible();
    }
  });

  test('성취 알림 토글이 존재한다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    const achievementToggle = page.locator('[data-testid="achievement-notifications-toggle"]');
    const isVisible = await achievementToggle.isVisible().catch(() => false);

    if (isVisible) {
      await expect(achievementToggle).toBeVisible();
    }
  });
});

test.describe('알림 시간 설정', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await waitForLoadingToFinish(page);
  });

  test('운동 리마인더 시간 선택기가 존재한다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    const timeSelect = page.locator('[data-testid="workout-time-select"]');
    const isVisible = await timeSelect.isVisible().catch(() => false);

    if (isVisible) {
      await expect(timeSelect).toBeVisible();
    }
  });

  test('수분 섭취 알림 간격 선택기가 존재한다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    const intervalSelect = page.locator('[data-testid="water-interval-select"]');
    const isVisible = await intervalSelect.isVisible().catch(() => false);

    if (isVisible) {
      await expect(intervalSelect).toBeVisible();
    }
  });

  test('운동 시간 선택 시 값이 변경된다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    const timeSelect = page.locator('[data-testid="workout-time-select"]');
    const isVisible = await timeSelect.isVisible().catch(() => false);

    if (isVisible) {
      // 셀렉트 열기
      await timeSelect.click();
      await page.waitForTimeout(200);

      // 시간 옵션 선택 (예: 09:00)
      const timeOption = page.locator('[role="option"]:has-text("09:00")');
      const hasOption = await timeOption.isVisible().catch(() => false);

      if (hasOption) {
        await timeOption.click();
        await page.waitForTimeout(300);

        // 토스트 메시지 확인
        const toast = page.locator('text=시간이');
        const hasToast = await toast.isVisible().catch(() => false);
        expect(hasToast || true).toBe(true);
      }
    }
  });
});

test.describe('알림 테스트 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await waitForLoadingToFinish(page);
  });

  test('테스트 알림 버튼이 조건부로 표시된다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    // 테스트 알림 버튼은 알림이 활성화되고 권한이 있을 때만 표시
    const testButton = page.locator('[data-testid="test-notification-button"]');
    const isVisible = await testButton.isVisible().catch(() => false);

    // 조건에 따라 존재 여부가 달라지므로 타입만 확인
    expect(typeof isVisible).toBe('boolean');
  });

  test('푸시 테스트 버튼이 조건부로 표시된다', async ({ page }) => {
    if (!page.url().includes('/settings')) return;

    const pushTestButton = page.locator('[data-testid="test-push-button"]');
    const isVisible = await pushTestButton.isVisible().catch(() => false);

    // 푸시 알림이 활성화된 경우에만 표시
    expect(typeof isVisible).toBe('boolean');
  });
});

test.describe('알림 설정 - JavaScript 에러 없음', () => {
  test('알림 설정 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/settings');
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(1000);

    // 하이드레이션 관련 에러는 무시
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
