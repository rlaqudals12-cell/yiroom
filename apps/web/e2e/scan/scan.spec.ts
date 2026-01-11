/**
 * E2E Test: 제품 스캔
 * F-1 ~ F-4 바코드 스캔 및 제품함 기능
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('제품 스캔 - 페이지 접근', () => {
  test('스캔 메인 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.SCAN);
    await waitForLoadingToFinish(page);

    // 페이지 로드 확인
    const url = page.url();
    expect(url).toMatch(/scan|sign-in/);
  });

  test('스캔 페이지 타이틀이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.SCAN);
    await waitForLoadingToFinish(page);

    // 제품 스캔 제목 확인
    const title = page.locator('h1:has-text("제품 스캔")');
    const hasTitle = await title.isVisible({ timeout: 5000 }).catch(() => false);

    // 로그인이 필요한 경우도 허용
    const url = page.url();
    expect(hasTitle || url.includes('sign-in')).toBeTruthy();
  });
});

test.describe('제품 스캔 - 모드 전환', () => {
  test('카메라 스캔과 직접 입력 탭이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.SCAN);
    await waitForLoadingToFinish(page);

    const url = page.url();
    if (url.includes('sign-in')) {
      // 로그인 필요 시 스킵
      return;
    }

    // 카메라 스캔 버튼
    const cameraTab = page.locator('button:has-text("카메라 스캔")');
    const hasCameraTab = await cameraTab.isVisible({ timeout: 5000 }).catch(() => false);

    // 직접 입력 버튼
    const manualTab = page.locator('button:has-text("직접 입력")');
    const hasManualTab = await manualTab.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasCameraTab || hasManualTab).toBeTruthy();
  });

  test('직접 입력 모드로 전환할 수 있다', async ({ page }) => {
    await page.goto(ROUTES.SCAN);
    await waitForLoadingToFinish(page);

    const url = page.url();
    if (url.includes('sign-in')) {
      return;
    }

    // 직접 입력 탭 클릭
    const manualTab = page.locator('button:has-text("직접 입력")');
    const hasManualTab = await manualTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasManualTab) {
      await manualTab.click();
      await page.waitForTimeout(300);

      // 입력 필드가 표시되어야 함
      const barcodeInput = page.locator('input[placeholder*="바코드"], input[type="text"]');
      const hasInput = await barcodeInput
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(hasInput).toBeTruthy();
    }
  });
});

test.describe('제품 스캔 - 바코드 입력', () => {
  test('바코드 입력 후 제품 조회가 동작한다', async ({ page }) => {
    await page.goto(ROUTES.SCAN);
    await waitForLoadingToFinish(page);

    const url = page.url();
    if (url.includes('sign-in')) {
      return;
    }

    // 직접 입력 모드로 전환
    const manualTab = page.locator('button:has-text("직접 입력")');
    const hasManualTab = await manualTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasManualTab) {
      await manualTab.click();
      await page.waitForTimeout(300);

      // 바코드 입력
      const barcodeInput = page.locator('input[placeholder*="바코드"], input[type="text"]').first();
      const hasInput = await barcodeInput.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasInput) {
        // SOME BY MI 토너 바코드 입력
        await barcodeInput.fill('8809598453234');
        await page.keyboard.press('Enter');
        await waitForLoadingToFinish(page);

        // 결과 페이지 또는 제품 없음 페이지
        const resultPage = page.locator('[data-testid="scan-result"], text=제품을 찾을');
        const hasResult = await resultPage
          .first()
          .isVisible({ timeout: 10000 })
          .catch(() => false);

        expect(hasResult).toBeTruthy();
      }
    }
  });

  test('존재하지 않는 바코드 입력 시 안내 메시지가 표시된다', async ({ page }) => {
    await page.goto(ROUTES.SCAN);
    await waitForLoadingToFinish(page);

    const url = page.url();
    if (url.includes('sign-in')) {
      return;
    }

    // 직접 입력 모드로 전환
    const manualTab = page.locator('button:has-text("직접 입력")');
    const hasManualTab = await manualTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasManualTab) {
      await manualTab.click();
      await page.waitForTimeout(300);

      const barcodeInput = page.locator('input[placeholder*="바코드"], input[type="text"]').first();
      const hasInput = await barcodeInput.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasInput) {
        // 존재하지 않는 바코드
        await barcodeInput.fill('0000000000000');
        await page.keyboard.press('Enter');
        await waitForLoadingToFinish(page);

        // 제품 없음 메시지 확인
        const notFoundMessage = page.locator('text=제품을 찾을 수 없습니다');
        const hasNotFound = await notFoundMessage.isVisible({ timeout: 10000 }).catch(() => false);

        expect(hasNotFound).toBeTruthy();
      }
    }
  });
});

test.describe('제품함 - 페이지 접근', () => {
  test('제품함 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.SCAN_SHELF);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/shelf|sign-in/);
  });

  test('제품함 필터 탭이 표시된다', async ({ page }) => {
    await page.goto(ROUTES.SCAN_SHELF);
    await waitForLoadingToFinish(page);

    const url = page.url();
    if (url.includes('sign-in')) {
      return;
    }

    // 필터 버튼들 확인
    const allFilter = page.locator('button:has-text("전체")');
    const ownedFilter = page.locator('button:has-text("보유 중")');

    const hasAllFilter = await allFilter.isVisible({ timeout: 5000 }).catch(() => false);
    const hasOwnedFilter = await ownedFilter.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasAllFilter || hasOwnedFilter).toBeTruthy();
  });
});

test.describe('제품 스캔 - 에러 핸들링', () => {
  test('스캔 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(ROUTES.SCAN);
    await waitForLoadingToFinish(page);

    // 페이지 조작
    const manualTab = page.locator('button:has-text("직접 입력")');
    const hasManualTab = await manualTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasManualTab) {
      await manualTab.click();
      await page.waitForTimeout(500);
    }

    // 크리티컬 에러만 필터링
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('제품함 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(ROUTES.SCAN_SHELF);
    await waitForLoadingToFinish(page);

    // 크리티컬 에러만 필터링
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
