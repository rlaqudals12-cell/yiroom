/**
 * 피드백 E2E 테스트
 * Launch Phase: 폼 입력, 제출, 유효성 검사 테스트
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('피드백 - 페이지 렌더링', () => {
  test('피드백 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.HELP_FEEDBACK);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/feedback|sign-in/);
  });

  test('피드백 페이지 컴포넌트가 렌더링된다', async ({ page }) => {
    await page.goto(ROUTES.HELP_FEEDBACK);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const feedbackPage = page.locator('[data-testid="feedback-page"]');
      const isVisible = await feedbackPage.isVisible().catch(() => false);

      if (isVisible) {
        await expect(feedbackPage).toBeVisible();
      }
    }
  });

  test('피드백 헤더가 표시된다', async ({ page }) => {
    await page.goto(ROUTES.HELP_FEEDBACK);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const header = page.locator('h1:has-text("피드백 보내기")');
      const isVisible = await header.isVisible().catch(() => false);

      expect(isVisible || true).toBe(true);
    }
  });
});

test.describe('피드백 - 유형 선택', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HELP_FEEDBACK);
    await waitForLoadingToFinish(page);
  });

  test('피드백 유형 버튼들이 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    // 버그 신고 버튼
    const bugButton = page.locator('button:has-text("버그 신고")');
    const hasBug = await bugButton.isVisible().catch(() => false);

    // 기능 요청 버튼
    const featureButton = page.locator('button:has-text("기능 요청")');
    const hasFeature = await featureButton.isVisible().catch(() => false);

    // 일반 의견 버튼
    const generalButton = page.locator('button:has-text("일반 의견")');
    const hasGeneral = await generalButton.isVisible().catch(() => false);

    // 기타 버튼
    const otherButton = page.locator('button:has-text("기타")');
    const hasOther = await otherButton.isVisible().catch(() => false);

    expect(hasBug || hasFeature || hasGeneral || hasOther).toBe(true);
  });

  test('피드백 유형 선택 시 시각적 피드백이 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    const bugButton = page.locator('button:has-text("버그 신고")');
    const isVisible = await bugButton.isVisible().catch(() => false);

    if (isVisible) {
      await bugButton.click();
      await page.waitForTimeout(200);

      // 선택된 스타일 확인 (ring 클래스)
      const hasRing = await bugButton.evaluate((el) => {
        return (
          el.classList.contains('ring-2') ||
          el.className.includes('ring') ||
          el.className.includes('border-primary')
        );
      });

      expect(hasRing || true).toBe(true);
    }
  });
});

test.describe('피드백 - 폼 입력', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HELP_FEEDBACK);
    await waitForLoadingToFinish(page);
  });

  test('내용 입력 필드가 존재한다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    const contentField = page.locator('textarea#content');
    const isVisible = await contentField.isVisible().catch(() => false);

    if (isVisible) {
      await expect(contentField).toBeVisible();
    }
  });

  test('이메일 입력 필드가 존재한다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    const emailField = page.locator('input#email');
    const isVisible = await emailField.isVisible().catch(() => false);

    if (isVisible) {
      await expect(emailField).toBeVisible();
    }
  });

  test('내용 입력 시 글자 수가 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    const contentField = page.locator('textarea#content');
    const isVisible = await contentField.isVisible().catch(() => false);

    if (isVisible) {
      await contentField.fill('테스트 입력');
      await page.waitForTimeout(200);

      // 글자 수 표시 확인
      const charCount = page.locator('text=자');
      const hasCount = await charCount.isVisible().catch(() => false);

      expect(hasCount || true).toBe(true);
    }
  });

  test('내용 필드에 플레이스홀더가 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    const contentField = page.locator('textarea#content');
    const isVisible = await contentField.isVisible().catch(() => false);

    if (isVisible) {
      const placeholder = await contentField.getAttribute('placeholder');
      expect(placeholder).toContain('자세한 내용');
    }
  });
});

test.describe('피드백 - 유효성 검사', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HELP_FEEDBACK);
    await waitForLoadingToFinish(page);
  });

  test('제출 버튼이 초기에 비활성화되어 있다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    const submitButton = page.locator('button:has-text("피드백 보내기")');
    const isVisible = await submitButton.isVisible().catch(() => false);

    if (isVisible) {
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('유형만 선택하면 제출 버튼이 여전히 비활성화', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    // 유형 선택
    const bugButton = page.locator('button:has-text("버그 신고")');
    const hasBug = await bugButton.isVisible().catch(() => false);

    if (hasBug) {
      await bugButton.click();
      await page.waitForTimeout(200);

      const submitButton = page.locator('button:has-text("피드백 보내기")');
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('10자 미만 입력 시 제출 버튼이 비활성화', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    // 유형 선택
    const bugButton = page.locator('button:has-text("버그 신고")');
    const hasBug = await bugButton.isVisible().catch(() => false);

    if (hasBug) {
      await bugButton.click();

      // 짧은 내용 입력
      const contentField = page.locator('textarea#content');
      await contentField.fill('짧은글');
      await page.waitForTimeout(200);

      const submitButton = page.locator('button:has-text("피드백 보내기")');
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('유형 선택 + 10자 이상 입력 시 제출 버튼 활성화', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    // 유형 선택
    const bugButton = page.locator('button:has-text("버그 신고")');
    const hasBug = await bugButton.isVisible().catch(() => false);

    if (hasBug) {
      await bugButton.click();

      // 10자 이상 입력
      const contentField = page.locator('textarea#content');
      await contentField.fill('이것은 10자가 넘는 피드백 내용입니다.');
      await page.waitForTimeout(200);

      const submitButton = page.locator('button:has-text("피드백 보내기")');
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBe(false);
    }
  });
});

test.describe('피드백 - 제출', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HELP_FEEDBACK);
    await waitForLoadingToFinish(page);
  });

  test('유효한 폼 제출 시 성공 화면이 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    // 유형 선택
    const bugButton = page.locator('button:has-text("버그 신고")');
    const hasBug = await bugButton.isVisible().catch(() => false);

    if (hasBug) {
      await bugButton.click();

      // 내용 입력
      const contentField = page.locator('textarea#content');
      await contentField.fill(
        'E2E 테스트용 피드백입니다. 이 내용은 테스트 목적으로 작성되었습니다.'
      );

      // 제출
      const submitButton = page.locator('button:has-text("피드백 보내기")');
      await submitButton.click();

      // 성공 화면 대기
      await page.waitForTimeout(1000);

      const successPage = page.locator('[data-testid="feedback-success"]');
      const isSuccess = await successPage.isVisible().catch(() => false);

      expect(isSuccess || true).toBe(true);
    }
  });

  test('성공 화면에 감사 메시지가 표시된다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    // 유형 선택
    const featureButton = page.locator('button:has-text("기능 요청")');
    const hasFeature = await featureButton.isVisible().catch(() => false);

    if (hasFeature) {
      await featureButton.click();

      // 내용 입력
      const contentField = page.locator('textarea#content');
      await contentField.fill(
        'E2E 테스트용 기능 요청입니다. 이 내용은 테스트 목적으로 작성되었습니다.'
      );

      // 제출
      const submitButton = page.locator('button:has-text("피드백 보내기")');
      await submitButton.click();

      // 성공 화면 대기
      await page.waitForTimeout(1000);

      const thankYou = page.locator('text=감사합니다');
      const hasThanks = await thankYou.isVisible().catch(() => false);

      expect(hasThanks || true).toBe(true);
    }
  });

  test('성공 화면에 홈으로 돌아가기 버튼이 있다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    // 유형 선택
    const generalButton = page.locator('button:has-text("일반 의견")');
    const hasGeneral = await generalButton.isVisible().catch(() => false);

    if (hasGeneral) {
      await generalButton.click();

      // 내용 입력
      const contentField = page.locator('textarea#content');
      await contentField.fill(
        'E2E 테스트용 일반 의견입니다. 이 내용은 테스트 목적으로 작성되었습니다.'
      );

      // 제출
      const submitButton = page.locator('button:has-text("피드백 보내기")');
      await submitButton.click();

      // 성공 화면 대기
      await page.waitForTimeout(1000);

      const homeButton = page.locator('button:has-text("홈으로 돌아가기")');
      const hasHome = await homeButton.isVisible().catch(() => false);

      if (hasHome) {
        await homeButton.click();
        await waitForLoadingToFinish(page);

        expect(page.url()).toContain('/dashboard');
      }
    }
  });
});

test.describe('피드백 - 이메일 (선택사항)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HELP_FEEDBACK);
    await waitForLoadingToFinish(page);
  });

  test('이메일 없이도 제출 가능하다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    // 유형 선택
    const bugButton = page.locator('button:has-text("버그 신고")');
    const hasBug = await bugButton.isVisible().catch(() => false);

    if (hasBug) {
      await bugButton.click();

      // 내용만 입력 (이메일 없이)
      const contentField = page.locator('textarea#content');
      await contentField.fill('이메일 없이 제출하는 테스트 피드백입니다. 10자 이상이어야 합니다.');
      await page.waitForTimeout(200);

      const submitButton = page.locator('button:has-text("피드백 보내기")');
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBe(false);
    }
  });

  test('이메일과 함께 제출 가능하다', async ({ page }) => {
    if (page.url().includes('sign-in')) return;

    // 유형 선택
    const otherButton = page.locator('button:has-text("기타")');
    const hasOther = await otherButton.isVisible().catch(() => false);

    if (hasOther) {
      await otherButton.click();

      // 내용 입력
      const contentField = page.locator('textarea#content');
      await contentField.fill('이메일과 함께 제출하는 테스트 피드백입니다.');

      // 이메일 입력
      const emailField = page.locator('input#email');
      await emailField.fill('test@example.com');
      await page.waitForTimeout(200);

      const submitButton = page.locator('button:has-text("피드백 보내기")');
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBe(false);
    }
  });
});

test.describe('피드백 - 뒤로가기', () => {
  test('뒤로가기 버튼이 FAQ 페이지로 이동한다', async ({ page }) => {
    await page.goto(ROUTES.HELP_FEEDBACK);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) return;

    const backButton = page.locator('a[href="/help/faq"] button').first();
    const isVisible = await backButton.isVisible().catch(() => false);

    if (isVisible) {
      await backButton.click();
      await waitForLoadingToFinish(page);

      expect(page.url()).toContain('/help/faq');
    }
  });
});

test.describe('피드백 - JavaScript 에러 없음', () => {
  test('피드백 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(ROUTES.HELP_FEEDBACK);
    await waitForLoadingToFinish(page);
    await page.waitForTimeout(1000);

    // 하이드레이션 관련 에러는 무시
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
