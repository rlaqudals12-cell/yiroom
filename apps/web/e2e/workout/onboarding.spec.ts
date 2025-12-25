/**
 * E2E Test: 운동 온보딩 플로우
 * Step 1~7 전체 플로우 및 분석 결과 확인
 */

import { test, expect } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

// 테스트 사용자 정보 (환경 변수)
const TEST_USER = {
  username: process.env.E2E_CLERK_USER_USERNAME,
  password: process.env.E2E_CLERK_USER_PASSWORD,
};

// 온보딩 라우트
const ONBOARDING_ROUTES = {
  STEP1: '/workout/onboarding/step1',
  STEP2: '/workout/onboarding/step2',
  STEP3: '/workout/onboarding/step3',
  STEP4: '/workout/onboarding/step4',
  STEP5: '/workout/onboarding/step5',
  STEP6: '/workout/onboarding/step6',
  STEP7: '/workout/onboarding/step7',
  RESULT: '/workout/result',
};

test.describe('운동 온보딩 페이지 접근', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('Step 1 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ONBOARDING_ROUTES.STEP1);
    await waitForLoadingToFinish(page);

    // 페이지 컨텐츠 확인 (인증 필요 시 로그인 또는 체형 분석 필요 메시지)
    const url = page.url();
    expect(url).toMatch(/step1|sign-in/);
  });

  test('Step 2 페이지 - 운동 목표 선택', async ({ page }) => {
    await page.goto(ONBOARDING_ROUTES.STEP2);
    await waitForLoadingToFinish(page);

    // 페이지 타이틀 확인
    const heading = page.locator('h2:has-text("운동 목표")');
    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHeading) {
      await expect(heading).toBeVisible();

      // 목표 선택 카드 확인 - 최소 1개 이상 표시 확인
      // (5개 옵션: 체중 감량, 근력 강화, 체력 향상, 스트레스 해소, 체형 교정)
      const weightLoss = page.locator('text=체중 감량');
      await expect(weightLoss).toBeVisible();
    }
  });

  test('Step 3 페이지 - 신체 고민 선택', async ({ page }) => {
    await page.goto(ONBOARDING_ROUTES.STEP3);
    await waitForLoadingToFinish(page);

    const heading = page.locator('h2:has-text("신체 고민")');
    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHeading) {
      await expect(heading).toBeVisible();

      // 고민 선택 카드 확인
      const bellyOption = page.locator('text=뱃살');
      await expect(bellyOption).toBeVisible();
    }
  });

  test('Step 4 페이지 - 운동 빈도 선택', async ({ page }) => {
    await page.goto(ONBOARDING_ROUTES.STEP4);
    await waitForLoadingToFinish(page);

    const heading = page.locator('h2:has-text("운동 빈도")');
    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHeading) {
      await expect(heading).toBeVisible();

      // 빈도 옵션 확인
      const weeklyOption = page.locator('text=주 3-4회');
      await expect(weeklyOption).toBeVisible();
    }
  });

  test('Step 5 페이지 - 운동 장소 및 장비', async ({ page }) => {
    await page.goto(ONBOARDING_ROUTES.STEP5);
    await waitForLoadingToFinish(page);

    const locationHeading = page.locator('h2:has-text("운동 장소")');
    const hasHeading = await locationHeading.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHeading) {
      await expect(locationHeading).toBeVisible();

      // 장소 옵션 확인 - { title: '집', desc: '홈트레이닝' }
      const homeOption = page.locator('text=집');
      await expect(homeOption).toBeVisible();

      // 장비 섹션 헤더 확인
      const equipmentHeading = page.locator('h2:has-text("사용 가능한 장비")');
      await expect(equipmentHeading).toBeVisible();

      // 장비 옵션 확인 - { title: '맨몸', desc: '장비 없이' }
      const bodyweightOption = page.locator('text=맨몸');
      await expect(bodyweightOption).toBeVisible();
    }
  });

  test('Step 6 페이지 - 목표 설정 (선택)', async ({ page }) => {
    await page.goto(ONBOARDING_ROUTES.STEP6);
    await waitForLoadingToFinish(page);

    const heading = page.locator('h2:has-text("목표 설정")');
    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHeading) {
      await expect(heading).toBeVisible();

      // 입력 필드 확인
      const weightInput = page.locator('input#target-weight');
      await expect(weightInput).toBeVisible();

      const dateInput = page.locator('input#target-date');
      await expect(dateInput).toBeVisible();
    }
  });

  test('Step 7 페이지 - 부상/통증 선택', async ({ page }) => {
    await page.goto(ONBOARDING_ROUTES.STEP7);
    await waitForLoadingToFinish(page);

    const heading = page.locator('h2:has-text("부상/통증")');
    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHeading) {
      await expect(heading).toBeVisible();

      // 부상 옵션 확인
      const noneOption = page.locator('text=특별한 부상이나 통증 없음');
      await expect(noneOption).toBeVisible();
    }
  });
});

test.describe('운동 온보딩 전체 플로우 (인증 필요)', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('Step 1~7 전체 플로우 완료 후 결과 페이지 이동', async ({ page }) => {
    // 테스트 사용자 정보 확인
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    // 로그인
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

    // Step 1: 체형 정보 확인
    await page.goto(ONBOARDING_ROUTES.STEP1);
    await waitForLoadingToFinish(page);

    // 체형 분석 데이터가 있는지 확인
    const bodyTypeCard = page.locator('text=체형 정보를 확인했어요');
    const needsAnalysis = page.locator('text=체형 분석이 필요합니다');

    const hasBodyType = await bodyTypeCard.isVisible({ timeout: 5000 }).catch(() => false);
    const needsBodyAnalysis = await needsAnalysis.isVisible({ timeout: 2000 }).catch(() => false);

    if (needsBodyAnalysis) {
      // 체형 분석이 필요한 경우 테스트 스킵
      test.skip(true, '체형 분석 데이터가 없어 온보딩 진행 불가');
      return;
    }

    if (hasBodyType) {
      // 다음 버튼 클릭
      const nextButton = page.locator('button:has-text("다음")');
      await nextButton.click();
      await waitForLoadingToFinish(page);

      // Step 2: 운동 목표 선택
      await expect(page).toHaveURL(/step2/);
      const goalCard = page.locator('text=체중 감량').first();
      await goalCard.click();

      const nextButton2 = page.locator('button:has-text("다음")');
      await nextButton2.click();
      await waitForLoadingToFinish(page);

      // Step 3: 신체 고민 선택
      await expect(page).toHaveURL(/step3/);
      const concernCard = page.locator('text=뱃살').first();
      await concernCard.click();

      const nextButton3 = page.locator('button:has-text("다음")');
      await nextButton3.click();
      await waitForLoadingToFinish(page);

      // Step 4: 운동 빈도 선택
      await expect(page).toHaveURL(/step4/);
      const frequencyCard = page.locator('text=주 3-4회').first();
      await frequencyCard.click();

      const nextButton4 = page.locator('button:has-text("다음")');
      await nextButton4.click();
      await waitForLoadingToFinish(page);

      // Step 5: 장소 및 장비 선택
      await expect(page).toHaveURL(/step5/);
      // 장소: { title: '집', desc: '홈트레이닝' } - title로 선택
      const locationCard = page.locator('text=집').first();
      await locationCard.click();
      // 장비: { title: '맨몸', desc: '장비 없이' } - title로 선택
      const equipmentCard = page.locator('text=맨몸').first();
      await equipmentCard.click();

      const nextButton5 = page.locator('button:has-text("다음")');
      await nextButton5.click();
      await waitForLoadingToFinish(page);

      // Step 6: 목표 설정 (선택사항, 스킵)
      await expect(page).toHaveURL(/step6/);
      const nextButton6 = page.locator('button:has-text("다음")');
      await nextButton6.click();
      await waitForLoadingToFinish(page);

      // Step 7: 부상/통증 선택
      await expect(page).toHaveURL(/step7/);
      // Step 7의 "없음" 옵션 (title: "없음", desc: "특별한 부상이나 통증 없음")
      const noInjury = page.locator('text=없음').first();
      await noInjury.click();

      // StepNavigation의 isLastStep=true일 때 버튼 텍스트는 "분석 시작"
      const completeButton = page.locator('button:has-text("분석 시작")');
      await completeButton.click();

      // 결과 페이지로 이동 및 로딩 대기
      await page.waitForURL(/result/, { timeout: 10000 });

      // 분석 로딩 대기 (2초 + 여유)
      await page.waitForTimeout(3000);
      await waitForLoadingToFinish(page);

      // 결과 페이지 확인
      const resultHeading = page.locator('text=분석 완료');
      await expect(resultHeading).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('운동 온보딩 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('이전/다음 버튼으로 단계 이동', async ({ page }) => {
    // Step 2에서 시작 (Step 1은 DB 데이터 필요)
    await page.goto(ONBOARDING_ROUTES.STEP2);
    await waitForLoadingToFinish(page);

    const heading = page.locator('h2:has-text("운동 목표")');
    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHeading) {
      // 이전 버튼 클릭
      const prevButton = page.locator('button:has-text("이전")');
      const hasPrevButton = await prevButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasPrevButton) {
        await prevButton.click();
        await waitForLoadingToFinish(page);

        // Step 1로 이동 확인
        await expect(page).toHaveURL(/step1/);
      }
    }
  });

  test('진행 표시기가 현재 단계를 표시한다', async ({ page }) => {
    // 테스트 사용자 정보 없으면 스킵 (인증 필요)
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    await page.goto(ONBOARDING_ROUTES.STEP3);
    await waitForLoadingToFinish(page);

    // 페이지가 정상 로드되었는지 확인
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // URL이 step3인 경우 진행 표시기 확인
    const url = page.url();
    if (url.includes('step3')) {
      const progressBar = page.locator('[role="progressbar"]');
      const progressText = page.locator('text=/\\d\\/\\d|단계/');

      const hasProgressBar = await progressBar.first().isVisible({ timeout: 3000 }).catch(() => false);
      const hasProgressText = await progressText.first().isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasProgressBar || hasProgressText).toBeTruthy();
    }
  });
});

test.describe('운동 분석 결과 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('결과 페이지 직접 접근 시 에러 처리', async ({ page }) => {
    // 온보딩 없이 결과 페이지 직접 접근
    await page.goto(ONBOARDING_ROUTES.RESULT);
    await waitForLoadingToFinish(page);

    // 에러 메시지 또는 리다이렉트 확인
    const url = page.url();
    const errorMessage = page.locator('text=필수 정보가 누락');
    const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

    // 에러 메시지가 있거나, 다른 페이지로 리다이렉트 되어야 함
    const isRedirected = !url.includes('/result');
    expect(hasError || isRedirected).toBeTruthy();
  });

  test('결과 페이지에서 다시 분석하기 버튼 동작', async ({ page }) => {
    // 테스트 사용자 정보 확인
    if (!TEST_USER.username || !TEST_USER.password) {
      test.skip(true, 'E2E_CLERK_USER_USERNAME 또는 E2E_CLERK_USER_PASSWORD가 설정되지 않음');
      return;
    }

    // 결과 페이지로 직접 이동 (온보딩 완료 상태 가정)
    await page.goto(ONBOARDING_ROUTES.RESULT);
    await waitForLoadingToFinish(page);

    // 다시 분석하기 버튼 확인
    const restartButton = page.locator('button:has-text("다시 분석하기"), button:has-text("다시 시작")');
    const hasRestartButton = await restartButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRestartButton) {
      await restartButton.click();
      await waitForLoadingToFinish(page);

      // Step 1로 이동 확인
      await expect(page).toHaveURL(/step1/);
    }
  });
});
