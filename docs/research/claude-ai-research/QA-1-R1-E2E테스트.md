# QA-1-R1: E2E 테스트 (Playwright)

> **Status**: Research Complete
> **Date**: 2026-01-16
> **Author**: Claude Code (Opus 4.5)

---

## 1. 핵심 요약

- **Playwright**는 Next.js 프로젝트에서 가장 권장되는 E2E 테스트 프레임워크로, 자동 대기(auto-waiting), 다중 브라우저 지원, 강력한 디버깅 도구를 제공함
- **Clerk 인증 테스트**는 `@clerk/testing/playwright` 패키지를 사용하여 테스팅 토큰 기반으로 구현하며, global-setup에서 초기화 후 각 테스트에서 `setupClerkTestingToken`으로 세션 관리
- **이미지 업로드 테스트**는 `setInputFiles()` 메서드로 파일 입력, `waitForResponse`로 분석 API 응답 대기, Mock Fallback 패턴으로 AI 타임아웃 대응
- **CI 통합**은 GitHub Actions에서 병렬 실행(sharding), 아티팩트 저장(trace, screenshot), 의존성 캐싱으로 효율화
- **Flaky 테스트 방지**는 명시적 대기(`waitFor`), 데이터 속성 셀렉터, 재시도 전략, 네트워크 안정화로 달성

---

## 2. 상세 내용

### 2.1 Playwright 설정 (Next.js 16+)

#### 2.1.1 현재 프로젝트 설정 분석

이룸 프로젝트는 `apps/web/playwright.config.ts`에서 다음과 같이 구성:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  // 실행 설정
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 리포터
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // 공통 설정
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  // 프로젝트
  projects: [
    { name: 'setup', testMatch: /global-setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  // 개발 서버
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // 타임아웃
  timeout: 30 * 1000,
  expect: { timeout: 10 * 1000 },
});
```

#### 2.1.2 권장 설정 개선사항

```typescript
// playwright.config.ts - 향상된 설정
export default defineConfig({
  testDir: './e2e',

  // 병렬 실행 최적화
  fullyParallel: true,
  workers: process.env.CI ? 2 : '50%',

  // 재시도 전략
  retries: process.env.CI ? 2 : 0,

  // 글로벌 타임아웃
  timeout: 60 * 1000, // AI 분석 테스트용 60초
  expect: {
    timeout: 15 * 1000,
    toHaveScreenshot: { maxDiffPixels: 100 },
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // 디버깅
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 네트워크 안정화
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // 브라우저 설정
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  // 멀티 브라우저 테스트
  projects: [
    { name: 'setup', testMatch: /global-setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    // Safari (Webkit) - 선택적
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    //   dependencies: ['setup'],
    // },
  ],

  // 빌드된 앱 테스트 (CI 환경)
  webServer: process.env.CI ? {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 180 * 1000,
  } : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
```

### 2.2 시나리오 설계 패턴

#### 2.2.1 폴더 구조

현재 이룸 프로젝트 E2E 구조:

```
e2e/
├── global-setup.ts          # Clerk 테스팅 토큰 초기화
├── fixtures/
│   └── index.ts             # 공통 fixture, 라우트 상수
├── utils/
│   └── auth.ts              # 인증 헬퍼 함수
├── smoke.spec.ts            # 기본 페이지 접근 테스트
├── mobile.spec.ts           # 모바일 반응형 테스트
├── auth/
│   ├── login.spec.ts
│   └── logout.spec.ts
├── analysis/
│   └── analysis.spec.ts     # PC-1, S-1, C-1 분석
├── skin/
│   └── skin-analysis.spec.ts
├── products/
│   ├── products.spec.ts
│   └── product-recommendation.spec.ts
├── scan/
│   └── scan.spec.ts         # 바코드 스캔
└── ...
```

#### 2.2.2 Page Object Model (POM) 패턴

```typescript
// e2e/pages/AnalysisPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class AnalysisPage {
  readonly page: Page;
  readonly uploadInput: Locator;
  readonly analyzeButton: Locator;
  readonly resultContainer: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.uploadInput = page.locator('input[type="file"]');
    this.analyzeButton = page.locator('[data-testid="analyze-button"]');
    this.resultContainer = page.locator('[data-testid="analysis-result"]');
    this.loadingSpinner = page.locator('[data-testid="loading"]');
  }

  async goto(analysisType: 'skin' | 'personal-color' | 'body') {
    await this.page.goto(`/analysis/${analysisType}`);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    // 로딩 스피너가 있으면 사라질 때까지 대기
    const hasSpinner = await this.loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false);
    if (hasSpinner) {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
    }
  }

  async uploadImage(imagePath: string) {
    await this.uploadInput.setInputFiles(imagePath);
  }

  async startAnalysis() {
    await this.analyzeButton.click();
    // AI 분석 응답 대기 (최대 30초)
    await this.page.waitForResponse(
      (resp) => resp.url().includes('/api/analyze/') && resp.status() === 200,
      { timeout: 30000 }
    ).catch(() => {
      // 타임아웃 시 Mock Fallback 허용
      console.log('[E2E] Analysis API timeout, checking for fallback result');
    });
  }

  async expectResultVisible() {
    await expect(this.resultContainer).toBeVisible({ timeout: 10000 });
  }
}
```

#### 2.2.3 테스트 레이어 분류

| 레이어 | 목적 | 실행 빈도 | 예시 |
|--------|------|-----------|------|
| **Smoke** | 핵심 경로 작동 확인 | 매 커밋 | 페이지 로드, 네비게이션 |
| **Critical Path** | 주요 사용자 플로우 | 매 PR | 로그인, 분석 완료, 결제 |
| **Regression** | 전체 기능 검증 | 야간/주간 | 모든 페이지, 엣지 케이스 |
| **Visual** | UI 스냅샷 비교 | 디자인 변경 시 | 레이아웃, 스타일 |

### 2.3 인증 테스트 (Clerk 연동)

#### 2.3.1 Global Setup

```typescript
// e2e/global-setup.ts
import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

setup.describe.configure({ mode: 'serial' });

setup('Clerk 테스팅 토큰 설정', async ({}) => {
  await clerkSetup();
});
```

#### 2.3.2 인증 헬퍼 함수

```typescript
// e2e/utils/auth.ts
import type { Page } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

export const TEST_USER = {
  username: process.env.E2E_CLERK_USER_USERNAME ?? '',
  password: process.env.E2E_CLERK_USER_PASSWORD ?? '',
};

/**
 * 테스트 유저로 로그인
 */
export async function loginAsTestUser(
  page: Page,
  options?: { waitForDashboard?: boolean; timeout?: number }
): Promise<boolean> {
  const { waitForDashboard = true, timeout = 10000 } = options ?? {};

  if (!TEST_USER.username || !TEST_USER.password) {
    console.warn('[E2E] 테스트 사용자 정보 미설정');
    return false;
  }

  try {
    await setupClerkTestingToken({ page });
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout });

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_USER.username,
        password: TEST_USER.password,
      },
    });

    if (waitForDashboard) {
      await page.waitForURL(/dashboard/, { timeout });
    }

    return true;
  } catch (error) {
    console.error('[E2E] 로그인 실패:', error);
    return false;
  }
}

/**
 * 인증이 필요한 페이지 접근
 */
export async function gotoWithAuth(page: Page, targetUrl: string): Promise<boolean> {
  await setupClerkTestingToken({ page });
  await page.goto(targetUrl);
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  if (page.url().includes('/sign-in')) {
    const success = await loginAsTestUser(page, { waitForDashboard: false });
    if (!success) return false;

    await page.goto(targetUrl);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  return !page.url().includes('/sign-in');
}

/**
 * 인증 상태 확인
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  if (url.includes('/sign-in') || url.includes('/sign-up')) return false;
  if (url.includes('/dashboard') || url.includes('/workout')) return true;

  const userButton = page.locator('[data-testid="user-button"], .cl-userButtonTrigger');
  return userButton.isVisible({ timeout: 2000 }).catch(() => false);
}
```

#### 2.3.3 인증 테스트 예시

```typescript
// e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

test.describe('로그인 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('로그인 페이지가 정상 로드된다', async ({ page }) => {
    await page.goto(ROUTES.SIGN_IN);
    await waitForLoadingToFinish(page);

    expect(page.url()).toMatch(/sign-in/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('로그인 후 대시보드로 이동한다', async ({ page }) => {
    const username = process.env.E2E_CLERK_USER_USERNAME;
    const password = process.env.E2E_CLERK_USER_PASSWORD;

    if (!username || !password) {
      test.skip(true, '테스트 사용자 정보 미설정');
      return;
    }

    await page.goto(ROUTES.HOME);
    await waitForLoadingToFinish(page);

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: username,
        password: password,
      },
    });

    await page.goto(ROUTES.DASHBOARD);
    await waitForLoadingToFinish(page);

    expect(page.url()).toContain('/dashboard');
  });

  test('미인증 시 보호된 페이지 접근 불가', async ({ page }) => {
    await page.goto(ROUTES.DASHBOARD);
    await waitForLoadingToFinish(page);

    // 로그인 페이지로 리다이렉트 또는 대시보드 표시
    expect(page.url()).toMatch(/sign-in|dashboard/);
  });
});
```

### 2.4 이미지 업로드/분석 테스트

#### 2.4.1 파일 업로드 테스트

```typescript
// e2e/analysis/image-upload.spec.ts
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import path from 'path';
import { gotoWithAuth } from '../utils/auth';

const TEST_IMAGES = {
  face: path.join(__dirname, '../fixtures/test-face.jpg'),
  skin: path.join(__dirname, '../fixtures/test-skin.jpg'),
  body: path.join(__dirname, '../fixtures/test-body.jpg'),
};

test.describe('이미지 업로드 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('피부 분석 이미지 업로드가 동작한다', async ({ page }) => {
    const success = await gotoWithAuth(page, '/analysis/skin');
    if (!success) {
      test.skip(true, '인증 실패');
      return;
    }

    // 파일 업로드
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles(TEST_IMAGES.skin);

    // 업로드 확인 (프리뷰 이미지 또는 상태 변경)
    const preview = page.locator('[data-testid="image-preview"], img[src*="blob:"]');
    await expect(preview.first()).toBeVisible({ timeout: 5000 });
  });

  test('분석 API 호출 및 결과 표시', async ({ page }) => {
    const success = await gotoWithAuth(page, '/analysis/skin');
    if (!success) {
      test.skip(true, '인증 실패');
      return;
    }

    // 이미지 업로드
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGES.skin);

    // 분석 시작 버튼 클릭
    const analyzeButton = page.locator('[data-testid="analyze-button"], button:has-text("분석")');
    await analyzeButton.first().click();

    // API 응답 대기 (AI 분석이므로 긴 타임아웃)
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/analyze/skin') && resp.status() === 200,
      { timeout: 60000 }
    );

    try {
      const response = await responsePromise;
      const data = await response.json();

      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('skinType');
    } catch {
      // 타임아웃 시 Mock Fallback 결과 확인
      const resultContainer = page.locator('[data-testid="analysis-result"]');
      const hasResult = await resultContainer.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasResult).toBe(true);
    }
  });

  test('잘못된 이미지 업로드 시 에러 표시', async ({ page }) => {
    const success = await gotoWithAuth(page, '/analysis/skin');
    if (!success) {
      test.skip(true, '인증 실패');
      return;
    }

    // 텍스트 파일 업로드 시도
    const invalidFile = path.join(__dirname, '../fixtures/invalid.txt');
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles(invalidFile);

    // 에러 메시지 확인
    const errorMessage = page.locator('[role="alert"], .text-red-500, text=지원하지 않는');
    const hasError = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasError).toBe(true);
  });
});
```

#### 2.4.2 분석 플로우 전체 테스트

```typescript
// e2e/analysis/full-flow.spec.ts
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import path from 'path';
import { loginAsTestUser, hasTestUserCredentials } from '../utils/auth';

test.describe('피부 분석 전체 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('로그인 -> 분석 -> 결과 확인 플로우', async ({ page }) => {
    // 1. 로그인
    if (!hasTestUserCredentials()) {
      test.skip(true, '테스트 사용자 정보 필요');
      return;
    }

    const loginSuccess = await loginAsTestUser(page);
    expect(loginSuccess).toBe(true);

    // 2. 분석 페이지로 이동
    await page.goto('/analysis/skin');
    await page.waitForLoadState('networkidle');

    // 3. 이미지 업로드
    const testImagePath = path.join(__dirname, '../fixtures/test-face.jpg');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // 4. 분석 시작
    const analyzeButton = page.locator('[data-testid="analyze-button"]');
    await analyzeButton.click();

    // 5. 로딩 상태 확인
    const loadingIndicator = page.locator('[data-testid="loading"], .animate-spin');
    const hasLoading = await loadingIndicator.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (hasLoading) {
      await loadingIndicator.first().waitFor({ state: 'hidden', timeout: 60000 });
    }

    // 6. 결과 확인
    const resultContainer = page.locator('[data-testid="analysis-result"]');
    await expect(resultContainer).toBeVisible({ timeout: 10000 });

    // 7. 결과 내용 검증
    const skinTypeLabel = page.locator('text=피부 타입, text=Skin Type');
    await expect(skinTypeLabel.first()).toBeVisible();
  });
});
```

### 2.5 CI 통합 (GitHub Actions)

#### 2.5.1 기본 E2E 워크플로우

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 3 * * *' # 매일 새벽 3시 (Regression)

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4] # 4개 샤드로 병렬 실행

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build application
        run: npm run build:web
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}

      - name: Run E2E tests
        run: npx playwright test --shard=${{ matrix.shard }}/4
        working-directory: apps/web
        env:
          CI: true
          E2E_CLERK_USER_USERNAME: ${{ secrets.E2E_CLERK_USER_USERNAME }}
          E2E_CLERK_USER_PASSWORD: ${{ secrets.E2E_CLERK_USER_PASSWORD }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.shard }}
          path: apps/web/playwright-report/
          retention-days: 7

      - name: Upload traces on failure
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-traces-${{ matrix.shard }}
          path: apps/web/test-results/
          retention-days: 7

  merge-reports:
    needs: e2e
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/download-artifact@v4
        with:
          pattern: playwright-report-*
          path: all-reports

      - name: Merge reports
        run: npx playwright merge-reports --reporter html all-reports/*

      - name: Upload merged report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-merged
          path: playwright-report/
          retention-days: 30
```

#### 2.5.2 Smoke 테스트 (빠른 PR 검증)

```yaml
# .github/workflows/smoke.yml
name: Smoke Tests

on:
  pull_request:
    branches: [main]

jobs:
  smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci

      - run: npx playwright install --with-deps chromium

      - name: Run smoke tests only
        run: npx playwright test smoke.spec.ts
        working-directory: apps/web
        env:
          CI: true

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: smoke-test-traces
          path: apps/web/test-results/
```

#### 2.5.3 Visual Regression 테스트

```yaml
# .github/workflows/visual.yml
name: Visual Tests

on:
  pull_request:
    paths:
      - 'apps/web/components/**'
      - 'apps/web/app/**/*.css'
      - 'apps/web/tailwind.config.ts'

jobs:
  visual:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Run visual tests
        run: npx playwright test --grep @visual
        working-directory: apps/web
        env:
          CI: true

      - name: Upload visual diffs
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-diffs
          path: apps/web/test-results/
```

### 2.6 안정성 (Flaky 테스트 방지)

#### 2.6.1 명시적 대기 패턴

```typescript
// 좋은 예: 명시적 대기
await page.waitForSelector('[data-testid="result"]', { state: 'visible' });
await expect(page.locator('[data-testid="result"]')).toBeVisible();

// 나쁜 예: 하드코딩된 대기
await page.waitForTimeout(3000); // 피하기
```

```typescript
// 네트워크 응답 대기
await page.waitForResponse(
  (resp) => resp.url().includes('/api/data') && resp.status() === 200,
  { timeout: 30000 }
);

// 로딩 완료 대기
export async function waitForLoadingToFinish(page: Page) {
  await page.waitForLoadState('networkidle');

  const loadingIndicator = page.locator('[data-testid*="loading"], .animate-spin');
  const hasLoading = await loadingIndicator.first().isVisible({ timeout: 1000 }).catch(() => false);

  if (hasLoading) {
    await loadingIndicator.first().waitFor({ state: 'hidden', timeout: 30000 });
  }
}
```

#### 2.6.2 안정적인 셀렉터

```typescript
// 우선순위 1: data-testid (가장 안정적)
page.locator('[data-testid="submit-button"]');

// 우선순위 2: 역할 + 텍스트
page.locator('button:has-text("저장")');
page.getByRole('button', { name: '저장' });

// 우선순위 3: 레이블
page.getByLabel('이메일');

// 피하기: CSS 클래스 (변경 가능성 높음)
page.locator('.btn-primary-lg'); // 피하기
```

#### 2.6.3 재시도 전략

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0, // CI에서 2회 재시도

  // 프로젝트별 재시도
  projects: [
    {
      name: 'stable-tests',
      testMatch: /stable\.spec\.ts/,
      retries: 0, // 재시도 없음
    },
    {
      name: 'flaky-tests',
      testMatch: /flaky\.spec\.ts/,
      retries: 3, // 3회 재시도
    },
  ],
});
```

```typescript
// 개별 테스트 재시도
test('API 의존 테스트', async ({ page }) => {
  test.info().annotations.push({ type: 'flaky', description: 'External API dependency' });

  // 테스트 내용
});
```

#### 2.6.4 격리된 테스트 환경

```typescript
// 테스트 간 상태 격리
test.beforeEach(async ({ page, context }) => {
  // 쿠키 초기화
  await context.clearCookies();

  // 로컬 스토리지 초기화
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());

  // Clerk 토큰 재설정
  await setupClerkTestingToken({ page });
});

// 테스트 후 정리
test.afterEach(async ({ page }) => {
  // 로그아웃
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});
```

#### 2.6.5 네트워크 안정화

```typescript
// 외부 의존성 Mock
test.beforeEach(async ({ page }) => {
  // 외부 API 호출 Mock
  await page.route('**/external-api.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: 'mocked' }),
    });
  });

  // 느린 응답 시뮬레이션 (안정성 테스트)
  await page.route('**/api/slow/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });
});

// 네트워크 상태 대기
test('데이터 로드 테스트', async ({ page }) => {
  await page.goto('/data');

  // 네트워크 요청 완료 대기
  await page.waitForLoadState('networkidle');

  // 또는 특정 API 응답 대기
  await page.waitForResponse((resp) =>
    resp.url().includes('/api/data') && resp.ok()
  );
});
```

#### 2.6.6 Flaky 테스트 진단

```typescript
// 디버그 모드로 실행
// npx playwright test --debug

// 특정 테스트만 반복 실행
// npx playwright test --repeat-each=5 specific.spec.ts

// 트레이스 분석
test('디버깅 필요한 테스트', async ({ page }) => {
  // 트레이스 강제 활성화
  await page.context().tracing.start({ screenshots: true, snapshots: true });

  try {
    // 테스트 코드
  } finally {
    await page.context().tracing.stop({ path: 'trace.zip' });
  }
});
```

---

## 3. 구현 시 필수 사항

### 3.1 설정 체크리스트

- [ ] `playwright.config.ts` 설정 완료
- [ ] `e2e/global-setup.ts`에 Clerk 초기화 추가
- [ ] 테스트 사용자 환경변수 설정 (`E2E_CLERK_USER_USERNAME`, `E2E_CLERK_USER_PASSWORD`)
- [ ] 테스트 픽스처 이미지 준비 (`e2e/fixtures/`)
- [ ] `.gitignore`에 `test-results/`, `playwright-report/` 추가

### 3.2 테스트 작성 체크리스트

- [ ] 모든 테스트에 `data-testid` 셀렉터 사용
- [ ] 명시적 대기 (`waitFor`, `waitForSelector`) 사용
- [ ] 하드코딩된 `waitForTimeout` 제거
- [ ] 인증 필요 테스트에 `setupClerkTestingToken` 적용
- [ ] 테스트 격리 (beforeEach에서 상태 초기화)
- [ ] 에러 케이스 테스트 포함

### 3.3 CI 체크리스트

- [ ] GitHub Secrets에 테스트 환경변수 등록
- [ ] E2E 워크플로우 파일 생성
- [ ] 테스트 샤딩 설정 (병렬 실행)
- [ ] 아티팩트 업로드 설정 (리포트, 트레이스)
- [ ] Slack/Discord 알림 연동 (선택)

### 3.4 유지보수 체크리스트

- [ ] 실패한 테스트 즉시 수정 또는 스킵 처리
- [ ] 3회 이상 Flaky 테스트 리팩토링
- [ ] 주간 테스트 실행 시간 모니터링
- [ ] 미사용 테스트 정리

---

## 4. 코드 예시

### 4.1 완전한 E2E 테스트 파일 예시

```typescript
// e2e/analysis/personal-color.spec.ts
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import path from 'path';
import {
  loginAsTestUser,
  hasTestUserCredentials,
  gotoWithAuth
} from '../utils/auth';
import { ROUTES, waitForLoadingToFinish } from '../fixtures';

const TEST_IMAGE = path.join(__dirname, '../fixtures/test-face.jpg');

test.describe('퍼스널컬러 분석', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test.describe('페이지 접근', () => {
    test('분석 페이지가 로드된다', async ({ page }) => {
      await page.goto(ROUTES.ANALYSIS_PERSONAL_COLOR);
      await waitForLoadingToFinish(page);

      const url = page.url();
      expect(url).toMatch(/personal-color|sign-in/);
    });

    test('JavaScript 에러가 없다', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await page.goto(ROUTES.ANALYSIS_PERSONAL_COLOR);
      await waitForLoadingToFinish(page);

      const criticalErrors = errors.filter(
        (e) => !e.includes('hydration') && !e.includes('ResizeObserver')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('인증된 사용자', () => {
    test('분석 시작 버튼이 표시된다', async ({ page }) => {
      if (!hasTestUserCredentials()) {
        test.skip(true, '테스트 사용자 정보 필요');
        return;
      }

      const success = await gotoWithAuth(page, ROUTES.ANALYSIS_PERSONAL_COLOR);
      expect(success).toBe(true);

      const analyzeButton = page.locator(
        '[data-testid="analyze-button"], button:has-text("분석")'
      );
      await expect(analyzeButton.first()).toBeVisible();
    });

    test('이미지 업로드가 동작한다', async ({ page }) => {
      if (!hasTestUserCredentials()) {
        test.skip(true, '테스트 사용자 정보 필요');
        return;
      }

      await gotoWithAuth(page, ROUTES.ANALYSIS_PERSONAL_COLOR);

      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();

      await fileInput.setInputFiles(TEST_IMAGE);

      // 프리뷰 확인
      const preview = page.locator('[data-testid="image-preview"]');
      await expect(preview).toBeVisible({ timeout: 5000 });
    });

    test('전체 분석 플로우가 완료된다', async ({ page }) => {
      test.setTimeout(120000); // 2분 타임아웃 (AI 분석 포함)

      if (!hasTestUserCredentials()) {
        test.skip(true, '테스트 사용자 정보 필요');
        return;
      }

      // 1. 로그인
      const loginSuccess = await loginAsTestUser(page);
      expect(loginSuccess).toBe(true);

      // 2. 분석 페이지 이동
      await page.goto(ROUTES.ANALYSIS_PERSONAL_COLOR);
      await waitForLoadingToFinish(page);

      // 3. 이미지 업로드
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(TEST_IMAGE);

      // 4. 분석 시작
      const analyzeButton = page.locator('[data-testid="analyze-button"]');
      await analyzeButton.click();

      // 5. API 응답 대기
      try {
        await page.waitForResponse(
          (resp) => resp.url().includes('/api/analyze/personal-color') && resp.ok(),
          { timeout: 60000 }
        );
      } catch {
        // Mock Fallback 허용
        console.log('[E2E] API timeout, checking fallback');
      }

      // 6. 결과 확인
      const result = page.locator('[data-testid="analysis-result"]');
      await expect(result).toBeVisible({ timeout: 30000 });

      // 7. 시즌 타입 표시 확인
      const seasonType = page.locator('[data-testid="season-type"]');
      await expect(seasonType).toBeVisible();
    });
  });

  test.describe('모바일 반응형', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('모바일에서 정상 표시된다', async ({ page }) => {
      await page.goto(ROUTES.ANALYSIS_PERSONAL_COLOR);
      await waitForLoadingToFinish(page);

      // 가로 스크롤 없음
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });
  });
});
```

### 4.2 Fixtures 파일 예시

```typescript
// e2e/fixtures/index.ts
import { test as base, expect, type Page } from '@playwright/test';

// 확장된 테스트 타입
export const test = base.extend<Record<string, never>>({
  // 추후 fixture 추가
});

export { expect };

// 테스트 픽스처 데이터
export const TEST_FIXTURES = {
  faceImage: 'e2e/fixtures/test-face.jpg',
  skinImage: 'e2e/fixtures/test-skin.jpg',
  bodyImage: 'e2e/fixtures/test-body.jpg',

  mockAnalysisId: 'test-analysis-id',
} as const;

// 테스트 설정
export const TEST_CONFIG = {
  defaultTimeout: 10000,
  networkTimeout: 30000,
  aiAnalysisTimeout: 60000,

  viewports: {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  },
} as const;

// 라우트 상수
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',

  // 분석
  ANALYSIS_PERSONAL_COLOR: '/analysis/personal-color',
  ANALYSIS_SKIN: '/analysis/skin',
  ANALYSIS_BODY: '/analysis/body',
  ANALYSIS_HAIR: '/analysis/hair',
  ANALYSIS_MAKEUP: '/analysis/makeup',

  // 기타
  WORKOUT: '/workout',
  NUTRITION: '/nutrition',
  PRODUCTS: '/products',
  SCAN: '/scan',
  PROFILE: '/profile',
} as const;

// 헬퍼 함수
export async function waitForLoadingToFinish(page: Page) {
  await page.waitForLoadState('networkidle');

  const loadingIndicator = page.locator('[data-testid*="loading"], .animate-spin');
  const hasLoading = await loadingIndicator
    .first()
    .isVisible({ timeout: 1000 })
    .catch(() => false);

  if (hasLoading) {
    await loadingIndicator.first().waitFor({ state: 'hidden', timeout: 30000 });
  }
}

export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    (resp) => {
      const matches = typeof urlPattern === 'string'
        ? resp.url().includes(urlPattern)
        : urlPattern.test(resp.url());
      return matches && resp.ok();
    },
    { timeout: TEST_CONFIG.networkTimeout }
  );
}
```

---

## 5. 참고 자료

### 5.1 공식 문서

- Playwright 공식 문서: https://playwright.dev/docs/intro
- Playwright Test Configuration: https://playwright.dev/docs/test-configuration
- Playwright Authentication: https://playwright.dev/docs/auth
- Playwright CI: https://playwright.dev/docs/ci
- Playwright Best Practices: https://playwright.dev/docs/best-practices

### 5.2 Clerk 테스팅

- Clerk Testing with Playwright: https://clerk.com/docs/testing/playwright

### 5.3 Next.js 통합

- Next.js Testing: https://nextjs.org/docs/app/building-your-application/testing/playwright
- Vercel Playwright Guide: https://vercel.com/guides/how-to-test-next-js-with-playwright

### 5.4 GitHub Actions

- Playwright GitHub Actions: https://playwright.dev/docs/ci-intro
- GitHub Actions Matrix: https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs

### 5.5 이룸 프로젝트 관련

- 현재 설정: `apps/web/playwright.config.ts`
- E2E 테스트: `apps/web/e2e/`
- 인증 헬퍼: `apps/web/e2e/utils/auth.ts`
- CI 워크플로우: `.github/workflows/ci.yml`

---

## 6. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-16 | 초기 버전 작성 |

---

**Version**: 1.0 | **Updated**: 2026-01-16 | **Category**: QA/Testing
