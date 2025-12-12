import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
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
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // 공통 설정
  use: {
    // 기본 URL (개발 서버)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // 트레이스 수집 (실패 시에만)
    trace: 'on-first-retry',

    // 스크린샷 (실패 시에만)
    screenshot: 'only-on-failure',

    // 비디오 (실패 시에만)
    video: 'on-first-retry',
  },

  // 프로젝트 설정
  projects: [
    // Clerk global setup (테스팅 토큰 초기화)
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    // 메인 테스트 (Chromium)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    // 필요 시 추가 브라우저 활성화
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    //   dependencies: ['setup'],
    // },
  ],

  // 개발 서버 설정 (테스트 전 자동 시작)
  webServer: {
    command: 'npm run dev',
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
