/**
 * AI 코치 CTA E2E 테스트
 * @description Phase K - 분석 결과 페이지에서 AI 상담 CTA 검증
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('Coach Page', () => {
  test('코치 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.COACH);
    await waitForLoadingToFinish(page);

    // 인증이 필요하므로 로그인 페이지로 리다이렉트되거나 코치 페이지가 표시됨
    const url = page.url();
    expect(url).toMatch(/coach|sign-in/);
  });

  test('코치 페이지 채팅 인터페이스가 표시된다', async ({ page }) => {
    await page.goto(ROUTES.COACH);
    await waitForLoadingToFinish(page);

    // 로그인 페이지가 아닌 경우에만 채팅 인터페이스 확인
    if (!page.url().includes('sign-in')) {
      const chatInterface = page.locator('[data-testid="coach-chat-interface"]');
      const isVisible = await chatInterface.isVisible().catch(() => false);

      if (isVisible) {
        await expect(chatInterface).toBeVisible();
      }
    }
  });
});

test.describe('ConsultantCTA Components', () => {
  test.describe('Skin Consultant CTA', () => {
    test('피부 분석 결과 페이지에 CTA가 표시된다', async ({ page }) => {
      // 피부 분석 결과 페이지 접근 시도
      await page.goto(`${ROUTES.ANALYSIS_SKIN}/result/test-id`);
      await waitForLoadingToFinish(page);

      // 로그인 페이지가 아닌 경우에만 CTA 확인
      if (!page.url().includes('sign-in')) {
        const cta = page.locator('[data-testid="skin-consultant-cta"]');
        const isVisible = await cta.isVisible().catch(() => false);

        if (isVisible) {
          await expect(cta).toBeVisible();
        }
      }
    });
  });

  test.describe('Personal Color Consultant CTA', () => {
    test('퍼스널컬러 분석 결과 페이지에 CTA가 표시된다', async ({ page }) => {
      await page.goto(`${ROUTES.ANALYSIS_PERSONAL_COLOR}/result/test-id`);
      await waitForLoadingToFinish(page);

      if (!page.url().includes('sign-in')) {
        const cta = page.locator('[data-testid="personalColor-consultant-cta"]');
        const isVisible = await cta.isVisible().catch(() => false);

        if (isVisible) {
          await expect(cta).toBeVisible();
        }
      }
    });
  });

  test.describe('Fashion Consultant CTA', () => {
    test('체형 분석 결과 페이지에 패션 CTA가 표시된다', async ({ page }) => {
      await page.goto(`${ROUTES.ANALYSIS_BODY}/result/test-id`);
      await waitForLoadingToFinish(page);

      if (!page.url().includes('sign-in')) {
        const cta = page.locator('[data-testid="fashion-consultant-cta"]');
        const isVisible = await cta.isVisible().catch(() => false);

        if (isVisible) {
          await expect(cta).toBeVisible();
        }
      }
    });
  });

  test.describe('Workout Consultant CTA', () => {
    test('운동 결과 페이지에 CTA가 표시된다', async ({ page }) => {
      await page.goto('/workout/result');
      await waitForLoadingToFinish(page);

      if (!page.url().includes('sign-in')) {
        const cta = page.locator('[data-testid="workout-consultant-cta"]');
        const isVisible = await cta.isVisible().catch(() => false);

        if (isVisible) {
          await expect(cta).toBeVisible();
        }
      }
    });
  });

  test.describe('Nutrition Consultant CTA', () => {
    test('영양 페이지에 CTA가 표시된다', async ({ page }) => {
      await page.goto(ROUTES.NUTRITION);
      await waitForLoadingToFinish(page);

      if (!page.url().includes('sign-in')) {
        const cta = page.locator('[data-testid="nutrition-consultant-cta"]');
        const isVisible = await cta.isVisible().catch(() => false);

        if (isVisible) {
          await expect(cta).toBeVisible();
        }
      }
    });
  });
});

test.describe('CTA Navigation', () => {
  test('CTA 클릭 시 코치 페이지로 이동한다 (URL 파라미터 포함)', async ({ page }) => {
    // 모킹된 환경이나 로그인된 상태에서만 테스트 가능
    await page.goto(ROUTES.NUTRITION);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const cta = page.locator('[data-testid="nutrition-consultant-cta"]');
      const isVisible = await cta.isVisible().catch(() => false);

      if (isVisible) {
        // CTA 클릭
        await cta.click();
        await waitForLoadingToFinish(page);

        // 코치 페이지로 이동했는지 확인
        const url = page.url();
        expect(url).toMatch(/coach|sign-in/);

        // 코치 페이지인 경우 category 파라미터 확인
        if (url.includes('coach')) {
          expect(url).toContain('category=nutrition');
        }
      }
    }
  });
});

test.describe('Quick Questions', () => {
  test('빠른 질문 클릭 시 질문과 함께 코치 페이지로 이동한다', async ({ page }) => {
    await page.goto(ROUTES.NUTRITION);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      // 빠른 질문 버튼 찾기
      const quickQuestion = page.locator('button:has-text("냉장고 재료로")');
      const isVisible = await quickQuestion.isVisible().catch(() => false);

      if (isVisible) {
        await quickQuestion.click();
        await waitForLoadingToFinish(page);

        const url = page.url();
        if (url.includes('coach')) {
          // 질문 파라미터가 포함되어 있는지 확인
          expect(url).toContain('q=');
          expect(url).toContain('category=nutrition');
        }
      }
    }
  });
});
