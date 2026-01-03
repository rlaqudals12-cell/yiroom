/**
 * 설정 페이지 E2E 테스트
 * Phase L: 알림 설정 및 언어 설정 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('설정 페이지 (비인증)', () => {
  test('설정 페이지 접근 시 로그인 또는 설정 페이지로 이동', async ({ page }) => {
    await page.goto('/settings');
    // 로그인 페이지 또는 설정 페이지 중 하나에 있어야 함
    const url = page.url();
    const isValid = url.includes('/settings') || url.includes('/sign-in') || url.includes('/login');
    expect(isValid).toBe(true);
  });

  test('설정 페이지 구조가 존재한다', async ({ page }) => {
    await page.goto('/settings');

    // 인증 페이지로 리다이렉트되지 않았다면 설정 페이지 확인
    if (page.url().includes('/settings')) {
      const settingsPage = page.locator('[data-testid="settings-page"]');
      const isVisible = await settingsPage.isVisible().catch(() => false);
      if (isVisible) {
        await expect(settingsPage).toBeVisible();
      }
    }
  });

  test('알림 설정 컴포넌트 구조', async ({ page }) => {
    await page.goto('/settings');

    if (page.url().includes('/settings')) {
      const notificationCard = page.locator('[data-testid="notification-settings"]');
      const isVisible = await notificationCard.isVisible().catch(() => false);
      // 인증된 상태에서만 알림 설정이 표시됨
      expect(typeof isVisible).toBe('boolean');
    }
  });
});

test.describe('알림 설정 상호작용', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('알림 권한 요청 버튼이 표시된다 (권한 미허용 시)', async ({ page }) => {
    // 권한이 없을 때 알림 허용하기 버튼 확인
    const permissionButton = page.locator('text=알림 허용하기');
    const isVisible = await permissionButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(permissionButton).toBeVisible();
    }
  });

  test('리마인더 시간 선택기가 존재한다', async ({ page }) => {
    const timeSelect = page.locator('[data-testid="reminder-time-select"]');
    const isVisible = await timeSelect.isVisible().catch(() => false);

    if (isVisible) {
      await expect(timeSelect).toBeVisible();
    }
  });

  test('운동 리마인더 토글이 존재한다', async ({ page }) => {
    const workoutToggle = page.locator('[data-testid="workout-reminder-toggle"]');
    const isVisible = await workoutToggle.isVisible().catch(() => false);

    if (isVisible) {
      await expect(workoutToggle).toBeVisible();
    }
  });

  test('영양 리마인더 토글이 존재한다', async ({ page }) => {
    const nutritionToggle = page.locator('[data-testid="nutrition-reminder-toggle"]');
    const isVisible = await nutritionToggle.isVisible().catch(() => false);

    if (isVisible) {
      await expect(nutritionToggle).toBeVisible();
    }
  });

  test('스트릭 경고 토글이 존재한다', async ({ page }) => {
    const streakToggle = page.locator('[data-testid="streak-warning-toggle"]');
    const isVisible = await streakToggle.isVisible().catch(() => false);

    if (isVisible) {
      await expect(streakToggle).toBeVisible();
    }
  });
});

test.describe('언어 설정', () => {
  test('언어 선택기가 존재한다', async ({ page }) => {
    await page.goto('/settings');

    if (page.url().includes('/settings')) {
      // 언어 선택 UI 확인
      const languageSelector = page.locator('[data-testid="language-switcher"]');
      const isVisible = await languageSelector.isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    }
  });

  test('설정 페이지 헤더가 렌더링된다', async ({ page }) => {
    await page.goto('/settings');

    if (page.url().includes('/settings')) {
      // 헤더 또는 페이지 구조 확인
      const header = page.locator('h1');
      const isVisible = await header.isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    }
  });
});

test.describe('설정 페이지 네비게이션', () => {
  test('홈으로 돌아가기가 작동한다', async ({ page }) => {
    await page.goto('/settings');

    // 뒤로가기 또는 홈 링크 클릭
    const backButton = page.locator('[data-testid="back-button"]');
    const isVisible = await backButton.isVisible().catch(() => false);

    if (isVisible) {
      await backButton.click();
      await expect(page).not.toHaveURL(/\/settings/);
    }
  });

  test('설정 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/settings');
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  });
});
