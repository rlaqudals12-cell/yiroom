import { defineConfig, devices } from '@playwright/test';

// CI 환경에서 Clerk 테스팅 토큰이 있는지 확인
const hasClerkTestingToken = Boolean(process.env.CLERK_TESTING_TOKEN);

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 *
 * CI 실행 모드:
 * - smoke: 인증 없이 기본 페이지 접근/렌더링 확인 (기본)
 * - full: Clerk 테스팅 토큰으로 인증 플로우 포함
 *
 * 태그 규칙 (@smoke, @auth, @analysis):
 * - @smoke: CI에서 항상 실행, 인증 불필요
 * - @auth: Clerk 테스팅 토큰 필요
 * - @analysis: 분석 페이지 접근 테스트
 */
export default defineConfig({
  // 테스트 파일 위치
  testDir: './e2e',

  // 테스트 실행 설정
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: process.env.CI
    ? [['html', { open: 'never', outputFolder: 'playwright-report' }], ['list'], ['github']]
    : [['html', { open: 'never' }], ['list']],

  // 공통 설정
  use: {
    // 기본 URL (개발 서버)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // 트레이스 수집 (실패 시에만)
    trace: 'on-first-retry',

    // 스크린샷 (실패 시에만)
    screenshot: 'only-on-failure',

    // 비디오 (CI에서는 비활성화하여 속도 향상)
    video: process.env.CI ? 'off' : 'on-first-retry',
  },

  // 프로젝트 설정
  projects: [
    // Clerk global setup (테스팅 토큰이 있을 때만 실행)
    ...(hasClerkTestingToken
      ? [
          {
            name: 'setup',
            testMatch: /global-setup\.ts/,
          },
        ]
      : []),
    // 메인 테스트 (Chromium)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Clerk 토큰이 있으면 setup 의존성 추가
      ...(hasClerkTestingToken ? { dependencies: ['setup'] } : {}),
    },
    // 필요 시 추가 브라우저 활성화
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   dependencies: hasClerkTestingToken ? ['setup'] : [],
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    //   dependencies: hasClerkTestingToken ? ['setup'] : [],
    // },
  ],

  // 서버 설정
  // CI: 빌드된 .next를 next start로 실행
  // 로컬: 개발 서버 사용
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2분
  },

  // 테스트 타임아웃
  timeout: 30 * 1000, // 30초

  // expect 타임아웃
  expect: {
    timeout: 10 * 1000, // 10초
  },
});
