/**
 * 분석 플로우 E2E 테스트
 * 퍼스널컬러, 피부, 체형, 헤어, 메이크업 분석 페이지 테스트
 */

import { test, expect } from '@playwright/test';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('분석 - 페이지 접근 @smoke @analysis', () => {
  test('퍼스널컬러 분석 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.ANALYSIS_PERSONAL_COLOR);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/personal-color|sign-in/);
  });

  test('피부 분석 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.ANALYSIS_SKIN);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/skin|sign-in/);
  });

  test('체형 분석 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.ANALYSIS_BODY);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/body|sign-in/);
  });

  test('헤어 분석 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.ANALYSIS_HAIR);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/hair|sign-in/);
  });

  test('메이크업 분석 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.ANALYSIS_MAKEUP);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/makeup|sign-in/);
  });
});

test.describe('분석 - 퍼스널컬러', () => {
  test('조명 가이드가 표시된다', async ({ page }) => {
    await page.goto(`${ROUTES.ANALYSIS_PERSONAL_COLOR}?forceNew=true`);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page.getByTestId('lighting-guide')).toBeVisible();
  });
});

test.describe('분석 - 피부', () => {
  test('피부 분석 UI가 표시된다', async ({ page }) => {
    await page.goto(`${ROUTES.ANALYSIS_SKIN}?forceNew=true`);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page.getByTestId('skin-analysis-page')).toBeVisible();
    await expect(page.getByTestId('skin-lighting-guide')).toBeVisible();
  });
});

test.describe('분석 - 체형', () => {
  test('체형 분석 UI가 표시된다', async ({ page }) => {
    await page.goto(`${ROUTES.ANALYSIS_BODY}?forceNew=true`);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page.getByTestId('body-analysis-page')).toBeVisible();
    await expect(page.getByTestId('body-photography-guide')).toBeVisible();
  });

  test('신체 정보 입력 필드가 있다', async ({ page }) => {
    await page.goto(`${ROUTES.ANALYSIS_BODY}?forceNew=true`);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await page.getByRole('button', { name: '촬영하기' }).click();
    await expect(page.getByTestId('body-input-form')).toBeVisible();
    const heightInput = page.locator('input[placeholder*="키"], input[aria-label*="키"]');
    const weightInput = page.locator('input[placeholder*="몸무게"], input[aria-label*="몸무게"]');
    await expect(heightInput.first()).toBeVisible();
    await expect(weightInput.first()).toBeVisible();
  });
});

test.describe('분석 - 헤어 (H-1)', () => {
  test('헤어 분석 UI가 표시된다', async ({ page }) => {
    await page.goto(`${ROUTES.ANALYSIS_HAIR}?forceNew=true`);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page.getByRole('heading', { name: /헤어 분석/ })).toBeVisible();
  });

  test('단일 사진 안내가 표시된다', async ({ page }) => {
    await page.goto(`${ROUTES.ANALYSIS_HAIR}?forceNew=true`);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page.getByTestId('hair-single-photo-notice')).toBeVisible();
  });
});

test.describe('분석 - 메이크업 (M-1)', () => {
  test('메이크업 분석 UI가 표시된다', async ({ page }) => {
    await page.goto(`${ROUTES.ANALYSIS_MAKEUP}?forceNew=true`);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page.getByRole('heading', { name: /메이크업 분석/ })).toBeVisible();
  });

  test('분석 시작 버튼이 표시된다', async ({ page }) => {
    await page.goto(`${ROUTES.ANALYSIS_MAKEUP}?forceNew=true`);
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    await expect(page.getByTestId('makeup-upload-button')).toBeVisible();
  });
});

test.describe('분석 - JavaScript 에러 없음 @smoke @analysis', () => {
  const analysisPages = [
    { name: '퍼스널컬러', route: ROUTES.ANALYSIS_PERSONAL_COLOR },
    { name: '피부', route: ROUTES.ANALYSIS_SKIN },
    { name: '체형', route: ROUTES.ANALYSIS_BODY },
    { name: '헤어', route: ROUTES.ANALYSIS_HAIR },
    { name: '메이크업', route: ROUTES.ANALYSIS_MAKEUP },
  ];

  for (const { name, route } of analysisPages) {
    test(`${name} 분석 페이지에서 JavaScript 에러가 발생하지 않는다`, async ({ page }) => {
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

test.describe('분석 결과 - 탭 UI (S-1+, PC-1+)', () => {
  test.skip(true, '실제 분석 결과 fixture가 없는 mock ID로는 탭 계약을 검증할 수 없음');
  // 결과 페이지는 인증 + 분석 결과가 필요하므로 기본 UI 존재 여부만 확인

  test('피부 분석 결과 페이지 구조가 올바르다', async ({ page }) => {
    // Mock 결과 ID로 페이지 접근 시도
    const mockId = 'test-skin-analysis-id';
    await page.goto(`/analysis/skin/result/${mockId}`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    // 로그인 리다이렉트 또는 에러 페이지로 이동해도 에러 없이 처리됨
    expect(url).toMatch(/skin|sign-in/);
  });

  test('퍼스널컬러 분석 결과 페이지 구조가 올바르다', async ({ page }) => {
    const mockId = 'test-pc-analysis-id';
    await page.goto(`/analysis/personal-color/result/${mockId}`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/personal-color|sign-in/);
  });

  test('피부 분석 결과 페이지에서 탭이 표시된다 (로그인 시)', async ({ page }) => {
    const mockId = 'test-analysis';
    await page.goto(`/analysis/skin/result/${mockId}`);
    await waitForLoadingToFinish(page);

    // 로그인된 상태에서만 탭이 표시됨
    if (!page.url().includes('sign-in')) {
      const tabs = page.locator('[role="tablist"]');
      const hasTabs = await tabs.isVisible().catch(() => false);

      // 탭이 있으면 기본 분석/상세 시각화 탭 확인
      if (hasTabs) {
        await expect(page.locator('button:has-text("기본 분석")')).toBeVisible();
        await expect(page.locator('button:has-text("상세 시각화")')).toBeVisible();
      }
    }
  });

  test('퍼스널컬러 분석 결과 페이지에서 탭이 표시된다 (로그인 시)', async ({ page }) => {
    const mockId = 'test-analysis';
    await page.goto(`/analysis/personal-color/result/${mockId}`);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const tabs = page.locator('[role="tablist"]');
      const hasTabs = await tabs.isVisible().catch(() => false);

      if (hasTabs) {
        await expect(page.locator('button:has-text("기본 분석")')).toBeVisible();
        await expect(page.locator('button:has-text("색상 입혀보기")')).toBeVisible();
      }
    }
  });

  test('피부 분석 상세 시각화 탭 전환이 작동한다', async ({ page }) => {
    const mockId = 'test-analysis';
    await page.goto(`/analysis/skin/result/${mockId}`);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const visualTab = page.locator('button:has-text("상세 시각화")');
      const isVisible = await visualTab.isVisible().catch(() => false);

      if (isVisible) {
        await visualTab.click();
        // 탭 전환 후 컨텐츠 영역 확인
        await page.waitForTimeout(500);
        const activePanel = page.locator('[role="tabpanel"]:visible');
        await expect(activePanel).toBeVisible();
      }
    }
  });

  test('퍼스널컬러 색상 입혀보기 탭 전환이 작동한다', async ({ page }) => {
    const mockId = 'test-analysis';
    await page.goto(`/analysis/personal-color/result/${mockId}`);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const drapingTab = page.locator('button:has-text("색상 입혀보기")');
      // 분석 사진이 없는 결과는 드레이핑 탭이 비활성(진입 차단) — 클릭 대상이 아니다
      const isVisible =
        (await drapingTab.isVisible().catch(() => false)) &&
        (await drapingTab.isEnabled().catch(() => false));

      if (isVisible) {
        await drapingTab.click();
        await page.waitForTimeout(500);
        const activePanel = page.locator('[role="tabpanel"]:visible');
        await expect(activePanel).toBeVisible();
      }
    }
  });
});

test.describe('분석 결과 - 헤어 (H-1)', () => {
  test.skip(true, '실제 헤어 분석 결과 fixture가 준비된 환경에서만 검증');

  test('헤어 분석 결과 페이지 구조가 올바르다', async ({ page }) => {
    const mockId = 'test-hair-analysis-id';
    await page.goto(`/analysis/hair/result/${mockId}`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/hair|sign-in/);
  });

  test('헤어 분석 결과 페이지에서 탭이 표시된다 (로그인 시)', async ({ page }) => {
    const mockId = 'test-analysis';
    await page.goto(`/analysis/hair/result/${mockId}`);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const tabs = page.locator('[role="tablist"]');
      const hasTabs = await tabs.isVisible().catch(() => false);

      if (hasTabs) {
        const basicTab = page.locator('button:has-text("기본 분석"), button:has-text("분석")');
        const hasBasicTab = await basicTab
          .first()
          .isVisible()
          .catch(() => false);
        expect(hasBasicTab).toBe(true);
      }
    }
  });

  test('헤어 분석 결과 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/analysis/hair/result/mock-id');
    await waitForLoadingToFinish(page);

    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('분석 결과 - 메이크업 (M-1)', () => {
  test.skip(true, '실제 메이크업 분석 결과 fixture가 준비된 환경에서만 검증');

  test('메이크업 분석 결과 페이지 구조가 올바르다', async ({ page }) => {
    const mockId = 'test-makeup-analysis-id';
    await page.goto(`/analysis/makeup/result/${mockId}`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/makeup|sign-in/);
  });

  test('메이크업 분석 결과 페이지에서 탭이 표시된다 (로그인 시)', async ({ page }) => {
    const mockId = 'test-analysis';
    await page.goto(`/analysis/makeup/result/${mockId}`);
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const tabs = page.locator('[role="tablist"]');
      const hasTabs = await tabs.isVisible().catch(() => false);

      if (hasTabs) {
        const basicTab = page.locator(
          'button:has-text("분석"), button:has-text("컬러"), button:has-text("팁")'
        );
        const hasBasicTab = await basicTab
          .first()
          .isVisible()
          .catch(() => false);
        expect(hasBasicTab).toBe(true);
      }
    }
  });

  test('메이크업 분석 결과 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/analysis/makeup/result/mock-id');
    await waitForLoadingToFinish(page);

    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('분석 히스토리 - 페이지 접근', () => {
  test.skip(true, '기간별 기록을 포함한 실제 분석 히스토리 fixture가 필요함');

  test('헤어 분석 히스토리 페이지가 로드된다', async ({ page }) => {
    await page.goto('/analysis/hair/history');
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/hair\/history|sign-in/);
  });

  test('메이크업 분석 히스토리 페이지가 로드된다', async ({ page }) => {
    await page.goto('/analysis/makeup/history');
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/makeup\/history|sign-in/);
  });

  test('헤어 히스토리 페이지에서 기간 필터가 표시된다', async ({ page }) => {
    await page.goto('/analysis/hair/history');
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const periodFilter = page.locator('[role="tablist"]');
      const hasFilter = await periodFilter.isVisible().catch(() => false);

      if (hasFilter) {
        const monthTab = page.locator('button:has-text("1개월"), button:has-text("3개월")');
        const hasMonthTab = await monthTab
          .first()
          .isVisible()
          .catch(() => false);
        expect(hasMonthTab).toBe(true);
      }
    }
  });

  test('메이크업 히스토리 페이지에서 기간 필터가 표시된다', async ({ page }) => {
    await page.goto('/analysis/makeup/history');
    await waitForLoadingToFinish(page);

    if (!page.url().includes('sign-in')) {
      const periodFilter = page.locator('[role="tablist"]');
      const hasFilter = await periodFilter.isVisible().catch(() => false);

      if (hasFilter) {
        const monthTab = page.locator('button:has-text("1개월"), button:has-text("3개월")');
        const hasMonthTab = await monthTab
          .first()
          .isVisible()
          .catch(() => false);
        expect(hasMonthTab).toBe(true);
      }
    }
  });

  test('헤어 히스토리 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/analysis/hair/history');
    await waitForLoadingToFinish(page);

    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('메이크업 히스토리 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/analysis/makeup/history');
    await waitForLoadingToFinish(page);

    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('분석 비교 - Compare 페이지', () => {
  test('헤어 비교 페이지가 로드된다', async ({ page }) => {
    await page.goto('/analysis/hair/compare?from=mock-from&to=mock-to');
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/hair\/compare|sign-in/);
  });

  test('메이크업 비교 페이지가 로드된다', async ({ page }) => {
    await page.goto('/analysis/makeup/compare?from=mock-from&to=mock-to');
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/makeup\/compare|sign-in/);
  });

  test('헤어 비교 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/analysis/hair/compare?from=mock-from&to=mock-to');
    await waitForLoadingToFinish(page);

    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('메이크업 비교 페이지에서 JavaScript 에러가 발생하지 않는다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/analysis/makeup/compare?from=mock-from&to=mock-to');
    await waitForLoadingToFinish(page);

    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('헤어 비교 페이지에서 에러 메시지가 표시된다 (파라미터 없이)', async ({ page }) => {
    await page.goto('/analysis/hair/compare');
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const errorMessage = page.locator('text=비교할 분석 정보가 없습니다');
    const backButton = page.locator('button:has-text("돌아가기")');
    await expect(errorMessage.or(backButton)).toBeVisible();
  });

  test('메이크업 비교 페이지에서 에러 메시지가 표시된다 (파라미터 없이)', async ({ page }) => {
    await page.goto('/analysis/makeup/compare');
    await waitForLoadingToFinish(page);

    if (page.url().includes('sign-in')) {
      await expect(page).toHaveURL(/\/sign-in/);
      return;
    }

    const errorMessage = page.locator('text=비교할 분석 정보가 없습니다');
    const backButton = page.locator('button:has-text("돌아가기")');
    await expect(errorMessage.or(backButton)).toBeVisible();
  });
});

test.describe('분석 결과 - Visual Analysis 컴포넌트', () => {
  test('VisualAnalysisTab 컴포넌트가 에러 없이 렌더링된다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/analysis/skin/result/mock-id');
    await waitForLoadingToFinish(page);

    // MediaPipe 로드 실패는 허용 (CDN 의존성)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('hydration') &&
        !e.includes('ResizeObserver') &&
        !e.includes('MediaPipe') &&
        !e.includes('FaceMesh')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('DrapingSection 컴포넌트가 에러 없이 렌더링된다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/analysis/personal-color/result/mock-id');
    await waitForLoadingToFinish(page);

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('hydration') &&
        !e.includes('ResizeObserver') &&
        !e.includes('MediaPipe') &&
        !e.includes('FaceMesh')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
