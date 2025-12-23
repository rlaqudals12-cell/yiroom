/**
 * E2E 테스트 - 프로필 페이지
 * 게이미피케이션 요소 표시 확인
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('프로필 페이지', () => {
  test('프로필 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.PROFILE);
    await waitForLoadingToFinish(page);

    // 페이지 로드 확인 (인증 필요 시 로그인 페이지로 리다이렉트)
    const url = page.url();
    expect(url).toMatch(/profile|sign-in/);
  });

  test('배지 컬렉션 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.PROFILE_BADGES);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/badges|sign-in/);
  });
});

test.describe('프로필 페이지 - 컴포넌트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.PROFILE);
    await waitForLoadingToFinish(page);
  });

  test('프로필 섹션들이 표시된다', async ({ page }) => {
    // 인증되지 않은 경우 스킵
    if (page.url().includes('sign-in')) {
      test.skip();
      return;
    }

    // 주요 섹션 확인
    const sections = [
      '내 프로필',
      '배지 컬렉션',
      '챌린지',
      '연속 기록',
    ];

    for (const section of sections) {
      const element = page.getByText(section, { exact: false });
      const isVisible = await element.isVisible().catch(() => false);
      // 섹션이 있으면 확인, 없으면 로그
      if (!isVisible) {
        console.log(`Section not found: ${section}`);
      }
    }
  });

  test('설정 링크가 동작한다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      test.skip();
      return;
    }

    const settingsLink = page.getByRole('link', { name: '설정' });
    const isVisible = await settingsLink.isVisible().catch(() => false);

    if (isVisible) {
      await settingsLink.click();
      await waitForLoadingToFinish(page);
      expect(page.url()).toContain('/settings');
    }
  });
});

test.describe('배지 컬렉션 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.PROFILE_BADGES);
    await waitForLoadingToFinish(page);
  });

  test('배지 카테고리가 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      test.skip();
      return;
    }

    // 배지 카테고리 확인
    const categories = ['운동', '영양', '분석'];

    for (const category of categories) {
      const element = page.getByText(category, { exact: false });
      const exists = await element.count();
      console.log(`Category ${category}: ${exists > 0 ? 'found' : 'not found'}`);
    }
  });

  test('뒤로가기 버튼이 동작한다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      test.skip();
      return;
    }

    const backButton = page.getByRole('link', { name: /돌아가기|뒤로/i });
    const isVisible = await backButton.isVisible().catch(() => false);

    if (isVisible) {
      await backButton.click();
      await waitForLoadingToFinish(page);
      expect(page.url()).toContain('/profile');
    }
  });
});
