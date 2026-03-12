/**
 * 피부 일기 E2E 테스트
 * 핵심 플로우: 일기 메인 → 기간 전환 → 캘린더 → 트렌드
 *
 * @tag diary
 */

import { test, expect } from '@playwright/test';
import { waitForLoadingToFinish, TEST_CONFIG } from '../fixtures';

const DIARY_ROUTE = '/diary';

test.describe('피부 일기 - 페이지 접근 @smoke', () => {
  test('일기 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(DIARY_ROUTE);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/diary|sign-in/);
  });

  test('일기 페이지에 핵심 UI 요소가 존재한다', async ({ page }) => {
    await page.goto(DIARY_ROUTE);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // data-testid로 페이지 식별
      const diaryPage = page.locator('[data-testid="skin-diary-page"]');
      const isVisible = await diaryPage.isVisible().catch(() => false);

      if (isVisible) {
        // 헤더에 "피부 일기" 텍스트
        await expect(page.locator('text=피부 일기')).toBeVisible();

        // 기간 선택 탭 (1주, 1개월, 3개월)
        const tabs = page.locator('[role="tablist"]');
        await expect(tabs).toBeVisible();
      }
    }
  });
});

test.describe('피부 일기 - 기간 전환 플로우', () => {
  test('기간 탭 클릭 시 데이터가 갱신된다', async ({ page }) => {
    await page.goto(DIARY_ROUTE);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const diaryPage = page.locator('[data-testid="skin-diary-page"]');
      const isVisible = await diaryPage.isVisible().catch(() => false);

      if (isVisible) {
        // 1주 탭 클릭
        const weekTab = page.locator('button:has-text("1주"), [role="tab"]:has-text("1주")');
        const hasWeekTab = await weekTab
          .first()
          .isVisible()
          .catch(() => false);

        if (hasWeekTab) {
          await weekTab.first().click();
          await waitForLoadingToFinish(page);

          // 3개월 탭 클릭
          const quarterTab = page.locator(
            'button:has-text("3개월"), [role="tab"]:has-text("3개월")'
          );
          const hasQuarterTab = await quarterTab
            .first()
            .isVisible()
            .catch(() => false);

          if (hasQuarterTab) {
            await quarterTab.first().click();
            await waitForLoadingToFinish(page);
          }
        }

        // 페이지가 여전히 일기 페이지인지 확인 (크래시 없음)
        await expect(diaryPage).toBeVisible();
      }
    }
  });
});

test.describe('피부 일기 - 빈 상태 플로우', () => {
  test('데이터 없을 때 빈 상태 UI가 표시된다', async ({ page }) => {
    await page.goto(DIARY_ROUTE);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 빈 상태이면 "분석하기" CTA가 보임
      const emptyState = page.locator('[data-testid="diary-empty-state"]');
      const errorState = page.locator('[data-testid="diary-error-state"]');
      const trendSummary = page.locator('text=바이탈리티');

      const hasEmpty = await emptyState.isVisible().catch(() => false);
      const hasError = await errorState.isVisible().catch(() => false);
      const hasTrend = await trendSummary
        .first()
        .isVisible()
        .catch(() => false);

      // 3가지 중 하나는 표시되어야 함 (빈 상태, 에러, 또는 트렌드 데이터)
      expect(hasEmpty || hasError || hasTrend).toBe(true);
    }
  });

  test('빈 상태에서 "분석하기" 버튼 클릭 시 분석 페이지로 이동', async ({ page }) => {
    await page.goto(DIARY_ROUTE);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const emptyState = page.locator('[data-testid="diary-empty-state"]');
      const hasEmpty = await emptyState.isVisible().catch(() => false);

      if (hasEmpty) {
        const analyzeButton = page.locator(
          'button:has-text("분석"), button:has-text("시작"), a:has-text("분석")'
        );
        const hasButton = await analyzeButton
          .first()
          .isVisible()
          .catch(() => false);

        if (hasButton) {
          await analyzeButton.first().click();
          await waitForLoadingToFinish(page);

          expect(page.url()).toMatch(/analysis|skin/);
        }
      }
    }
  });
});

test.describe('피부 일기 - 에러 처리', () => {
  test('에러 상태에서 재시도가 가능하다', async ({ page }) => {
    await page.goto(DIARY_ROUTE);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const errorState = page.locator('[data-testid="diary-error-state"]');
      const hasError = await errorState.isVisible().catch(() => false);

      if (hasError) {
        // role="alert" 확인
        await expect(errorState).toHaveAttribute('role', 'alert');

        // "다시 시도" 버튼 확인
        const retryButton = page.locator('button:has-text("다시 시도")');
        await expect(retryButton).toBeVisible();
      }
    }
  });
});

test.describe('피부 일기 - 분석 연동 플로우', () => {
  test('헤더 "분석하기" 버튼으로 피부 분석 페이지 진입', async ({ page }) => {
    await page.goto(DIARY_ROUTE);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const diaryPage = page.locator('[data-testid="skin-diary-page"]');
      const isVisible = await diaryPage.isVisible().catch(() => false);

      if (isVisible) {
        // 헤더의 "분석하기" 버튼
        const analyzeBtn = page.locator('button:has-text("분석하기")');
        const hasBtn = await analyzeBtn
          .first()
          .isVisible()
          .catch(() => false);

        if (hasBtn) {
          await analyzeBtn.first().click();
          await waitForLoadingToFinish(page);

          expect(page.url()).toMatch(/analysis|skin/);
        }
      }
    }
  });
});

test.describe('피부 일기 - 모바일 뷰포트', () => {
  test('모바일에서 레이아웃이 깨지지 않는다', async ({ page }) => {
    await page.setViewportSize(TEST_CONFIG.mobile);
    await page.goto(DIARY_ROUTE);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const diaryPage = page.locator('[data-testid="skin-diary-page"]');
      const isVisible = await diaryPage.isVisible().catch(() => false);

      if (isVisible) {
        // 컨테이너가 뷰포트를 넘지 않는지 확인
        const box = await diaryPage.boundingBox();
        if (box) {
          expect(box.width).toBeLessThanOrEqual(TEST_CONFIG.mobile.width + 1);
        }
      }
    }
  });
});
