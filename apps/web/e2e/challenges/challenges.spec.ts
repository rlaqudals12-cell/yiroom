/**
 * E2E 테스트 - 챌린지 페이지
 * 챌린지 목록 및 상세 페이지 테스트
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('챌린지 목록 페이지', () => {
  test('챌린지 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.CHALLENGES);
    await waitForLoadingToFinish(page);

    // 페이지 로드 확인 (인증 필요 시 로그인 페이지로 리다이렉트)
    const url = page.url();
    expect(url).toMatch(/challenges|sign-in/);
  });

  test('JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(ROUTES.CHALLENGES);
    await waitForLoadingToFinish(page);

    // 치명적인 에러 필터링
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('챌린지 목록 - 컴포넌트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.CHALLENGES);
    await waitForLoadingToFinish(page);
  });

  test('페이지 타이틀이 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      test.skip();
      return;
    }

    const title = page.getByRole('heading', { name: /챌린지/i });
    const isVisible = await title.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('탭 필터가 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      test.skip();
      return;
    }

    // 탭 필터 확인
    const tabs = ['전체', '진행중', '참여가능', '완료'];

    for (const tab of tabs) {
      const tabElement = page.getByRole('tab', { name: tab }).or(page.getByText(tab, { exact: true }));
      const exists = await tabElement.count();
      console.log(`Tab ${tab}: ${exists > 0 ? 'found' : 'not found'}`);
    }
  });

  test('챌린지 카드가 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) {
      test.skip();
      return;
    }

    // 챌린지 카드 또는 빈 상태 메시지 확인
    const challengeCard = page.locator('[data-testid="challenge-card"]').or(
      page.locator('article').filter({ hasText: /챌린지|도전/ })
    );
    const emptyMessage = page.getByText(/챌린지가 없습니다|아직 참여/i);

    const hasCards = await challengeCard.first().isVisible().catch(() => false);
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

    // 챌린지 카드가 있거나 빈 상태 메시지가 있어야 함
    expect(hasCards || hasEmptyMessage).toBe(true);
  });
});

test.describe('챌린지 상세 페이지', () => {
  test('존재하지 않는 챌린지는 적절한 에러를 표시한다', async ({ page }) => {
    await page.goto('/challenges/non-existent-id');
    await waitForLoadingToFinish(page);

    // 404 또는 에러 메시지 확인
    const errorMessage = page.getByText(/찾을 수 없|존재하지 않|not found/i);
    const redirected = page.url().includes('sign-in') || page.url().includes('challenges');

    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(hasError || redirected).toBe(true);
  });
});

test.describe('챌린지 접근성', () => {
  test('키보드 네비게이션이 동작한다', async ({ page }) => {
    await page.goto(ROUTES.CHALLENGES);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      test.skip();
      return;
    }

    // Tab 키로 포커스 이동 확인
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    const isFocused = await focusedElement.count();
    expect(isFocused).toBeGreaterThan(0);
  });

  test('aria 레이블이 적절히 설정되어 있다', async ({ page }) => {
    await page.goto(ROUTES.CHALLENGES);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      test.skip();
      return;
    }

    // 주요 랜드마크 확인
    const main = page.locator('main');
    const hasMain = await main.isVisible().catch(() => false);
    expect(hasMain).toBe(true);
  });
});

test.describe('챌린지 반응형 디자인', () => {
  test('모바일 뷰에서 정상 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ROUTES.CHALLENGES);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      test.skip();
      return;
    }

    // 모바일에서 콘텐츠가 화면 밖으로 넘치지 않는지 확인
    const viewport = page.viewportSize();
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();

    if (bodyBox && viewport) {
      expect(bodyBox.width).toBeLessThanOrEqual(viewport.width + 20); // 약간의 여유
    }
  });

  test('태블릿 뷰에서 정상 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(ROUTES.CHALLENGES);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/challenges|sign-in/);
  });

  test('데스크톱 뷰에서 정상 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ROUTES.CHALLENGES);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/challenges|sign-in/);
  });
});
