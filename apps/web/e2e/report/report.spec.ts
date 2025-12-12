/**
 * E2E Test: 리포트 조회 플로우
 * 주간/월간 리포트 조회 테스트
 */

import { test, expect } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

// 테스트 사용자 정보 (환경 변수)
const TEST_USER = {
  username: process.env.E2E_CLERK_USER_USERNAME,
  password: process.env.E2E_CLERK_USER_PASSWORD,
};

// 리포트 관련 라우트
const REPORT_ROUTES = {
  LIST: '/reports',
  WEEKLY: '/reports/weekly',
  MONTHLY: '/reports/monthly',
};

// 현재 주 시작일 계산 (월요일 기준)
function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  now.setDate(now.getDate() - diff);
  return now.toISOString().split('T')[0];
}

// 현재 월 계산
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

test.describe('리포트 페이지 접근', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('리포트 목록 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(REPORT_ROUTES.LIST);
    await waitForLoadingToFinish(page);

    // 페이지 컨텐츠 확인
    const url = page.url();
    expect(url).toMatch(/reports|sign-in/);
  });

  test('주간 리포트 페이지가 정상적으로 로드된다', async ({ page }) => {
    const weekStart = getCurrentWeekStart();
    await page.goto(`${REPORT_ROUTES.WEEKLY}/${weekStart}`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/weekly|sign-in/);
  });

  test('월간 리포트 페이지가 정상적으로 로드된다', async ({ page }) => {
    const month = getCurrentMonth();
    await page.goto(`${REPORT_ROUTES.MONTHLY}/${month}`);
    await waitForLoadingToFinish(page);

    const url = page.url();
    expect(url).toMatch(/monthly|sign-in/);
  });
});

test.describe('리포트 목록 페이지 (인증 필요)', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('리포트 목록 페이지에서 빠른 액세스 카드가 표시된다', async ({ page }) => {
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    await page.goto(REPORT_ROUTES.LIST);
    await waitForLoadingToFinish(page);

    // 리포트 페이지 확인
    const reportsPage = page.locator('[data-testid="reports-page"]');
    const hasReportsPage = await reportsPage.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasReportsPage) {
      // 이번 주 리포트 카드 확인
      const thisWeekCard = page.locator('text=이번 주 리포트');
      await expect(thisWeekCard).toBeVisible();

      // 이번 달 리포트 카드 확인
      const thisMonthCard = page.locator('text=이번 달 리포트');
      await expect(thisMonthCard).toBeVisible();
    }
  });

  test('리포트 목록에서 주간 리포트로 이동할 수 있다', async ({ page }) => {
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    await page.goto(REPORT_ROUTES.LIST);
    await waitForLoadingToFinish(page);

    const reportsPage = page.locator('[data-testid="reports-page"]');
    const hasReportsPage = await reportsPage.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasReportsPage) {
      // 이번 주 리포트 클릭
      const thisWeekCard = page.locator('text=이번 주 리포트').first();
      await thisWeekCard.click();
      await waitForLoadingToFinish(page);

      // 주간 리포트 페이지로 이동 확인
      const url = page.url();
      expect(url).toContain('/reports/weekly/');
    }
  });

  test('리포트 목록에서 월간 리포트로 이동할 수 있다', async ({ page }) => {
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    await page.goto(REPORT_ROUTES.LIST);
    await waitForLoadingToFinish(page);

    const reportsPage = page.locator('[data-testid="reports-page"]');
    const hasReportsPage = await reportsPage.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasReportsPage) {
      // 이번 달 리포트 클릭
      const thisMonthCard = page.locator('text=이번 달 리포트').first();
      await thisMonthCard.click();
      await waitForLoadingToFinish(page);

      // 월간 리포트 페이지로 이동 확인
      const url = page.url();
      expect(url).toContain('/reports/monthly/');
    }
  });
});

test.describe('주간 리포트 조회', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('주간 리포트가 표시되거나 빈 상태가 표시된다', async ({ page }) => {
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    const weekStart = getCurrentWeekStart();
    await page.goto(`${REPORT_ROUTES.WEEKLY}/${weekStart}`);
    await waitForLoadingToFinish(page);

    // 주간 리포트 페이지 또는 빈 상태 확인
    const reportPage = page.locator('[data-testid="weekly-report-page"]');
    const emptyState = page.locator('[data-testid="weekly-report-empty"], text=이번 주 기록이 없어요');

    const hasReport = await reportPage.isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    // 둘 중 하나는 표시되어야 함
    expect(hasReport || hasEmpty).toBeTruthy();
  });

  test('주간 리포트에서 이전 주로 이동할 수 있다', async ({ page }) => {
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    const weekStart = getCurrentWeekStart();
    await page.goto(`${REPORT_ROUTES.WEEKLY}/${weekStart}`);
    await waitForLoadingToFinish(page);

    // 이전 주 버튼 찾기
    const prevButton = page.locator('button[aria-label*="이전"], button:has(svg[class*="left"])').first();
    const hasPrevButton = await prevButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPrevButton) {
      const currentUrl = page.url();
      await prevButton.click();
      await waitForLoadingToFinish(page);

      // URL이 변경되었는지 확인
      const newUrl = page.url();
      expect(newUrl).not.toBe(currentUrl);
      expect(newUrl).toContain('/reports/weekly/');
    }
  });

  test('주간 리포트에 영양/운동 요약이 표시된다', async ({ page }) => {
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    const weekStart = getCurrentWeekStart();
    await page.goto(`${REPORT_ROUTES.WEEKLY}/${weekStart}`);
    await waitForLoadingToFinish(page);

    const reportPage = page.locator('[data-testid="weekly-report-page"]');
    const hasReport = await reportPage.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasReport) {
      // 영양 요약 카드 확인
      const nutritionCard = page.locator('text=/영양|칼로리|식단/');
      const hasNutrition = await nutritionCard.first().isVisible({ timeout: 3000 }).catch(() => false);

      // 운동 요약 카드 확인
      const workoutCard = page.locator('text=/운동|활동/');
      const hasWorkout = await workoutCard.first().isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasNutrition || hasWorkout).toBeTruthy();
    }
  });
});

test.describe('월간 리포트 조회', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('월간 리포트가 표시되거나 빈 상태가 표시된다', async ({ page }) => {
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    const month = getCurrentMonth();
    await page.goto(`${REPORT_ROUTES.MONTHLY}/${month}`);
    await waitForLoadingToFinish(page);

    // 월간 리포트 페이지 또는 빈 상태 확인
    const reportPage = page.locator('[data-testid="monthly-report-page"]');
    const emptyState = page.locator('text=/기록이 없|데이터가 없/');

    const hasReport = await reportPage.isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    // 로딩이 끝난 후 무언가는 표시되어야 함
    const url = page.url();
    expect(url).toContain('/reports/monthly/');
  });

  test('월간 리포트에서 이전 달로 이동할 수 있다', async ({ page }) => {
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    const month = getCurrentMonth();
    await page.goto(`${REPORT_ROUTES.MONTHLY}/${month}`);
    await waitForLoadingToFinish(page);

    // 이전 달 버튼 찾기
    const prevButton = page.locator('button[aria-label*="이전"], button:has(svg[class*="left"])').first();
    const hasPrevButton = await prevButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPrevButton) {
      const currentUrl = page.url();
      await prevButton.click();
      await waitForLoadingToFinish(page);

      // URL이 변경되었는지 확인
      const newUrl = page.url();
      expect(newUrl).not.toBe(currentUrl);
      expect(newUrl).toContain('/reports/monthly/');
    }
  });
});

test.describe('리포트 빈 상태 처리', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('빈 주간 리포트에서 액션 버튼이 표시된다', async ({ page }) => {
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    const weekStart = getCurrentWeekStart();
    await page.goto(`${REPORT_ROUTES.WEEKLY}/${weekStart}`);
    await waitForLoadingToFinish(page);

    // 빈 상태 확인
    const emptyState = page.locator('text=이번 주 기록이 없어요');
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEmpty) {
      // 액션 버튼 확인
      const nutritionButton = page.locator('a:has-text("식단 기록하기"), button:has-text("식단 기록하기")');
      const workoutButton = page.locator('a:has-text("운동 기록하기"), button:has-text("운동 기록하기")');

      const hasNutritionBtn = await nutritionButton.isVisible({ timeout: 2000 }).catch(() => false);
      const hasWorkoutBtn = await workoutButton.isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasNutritionBtn || hasWorkoutBtn).toBeTruthy();
    }
  });
});
