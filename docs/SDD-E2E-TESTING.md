# E2E 테스트 강화 스펙

> Playwright 기반 핵심 사용자 시나리오 테스트

## 1. 개요

### 1.1 목적

핵심 사용자 플로우의 E2E 테스트를 추가하여 회귀 방지

### 1.2 범위

- 인증 플로우
- 피부 분석 플로우
- 제품 추천 플로우
- 어필리에이트 클릭 추적

---

## 2. 테스트 시나리오

### 2.1 인증 플로우

```typescript
// tests/e2e/auth.spec.ts
test.describe('인증', () => {
  test('회원가입 → 온보딩 → 대시보드', async ({ page }) => {
    // 1. 랜딩 페이지 접속
    await page.goto('/');

    // 2. 회원가입 클릭
    await page.click('[data-testid="signup-button"]');

    // 3. Clerk 회원가입 (테스트 계정)
    await page.fill('[name="email"]', 'test@example.com');
    // ...

    // 4. 온보딩 완료 확인
    await expect(page).toHaveURL('/onboarding');

    // 5. 대시보드 리다이렉트
    await expect(page).toHaveURL('/dashboard');
  });

  test('로그인 → 대시보드', async ({ page }) => {
    await page.goto('/sign-in');
    // ...
  });
});
```

### 2.2 피부 분석 플로우

```typescript
// tests/e2e/skin-analysis.spec.ts
test.describe('피부 분석', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 유저로 로그인
    await loginAsTestUser(page);
  });

  test('사진 업로드 → 분석 → 결과 확인', async ({ page }) => {
    // 1. 분석 페이지 접속
    await page.goto('/analysis/skin');

    // 2. 이미지 업로드
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-face.jpg');

    // 3. 분석 시작
    await page.click('[data-testid="analyze-button"]');

    // 4. 로딩 대기
    await page.waitForSelector('[data-testid="analysis-result"]', {
      timeout: 30000,
    });

    // 5. 결과 확인
    await expect(page.locator('[data-testid="skin-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="circular-progress"]')).toBeVisible();
  });

  test('이전 분석 비교 (델타 표시)', async ({ page }) => {
    // 기존 분석이 있는 유저
    await page.goto('/analysis/skin/result/existing-id');

    // 델타 배지 확인
    await expect(page.locator('[data-testid="score-change-badge"]')).toBeVisible();
  });
});
```

### 2.3 제품 추천 플로우

```typescript
// tests/e2e/product-recommendation.spec.ts
test.describe('제품 추천', () => {
  test('피부 분석 → 추천 제품 → 클릭 추적', async ({ page }) => {
    await loginAsTestUser(page);

    // 1. 분석 결과에서 추천 제품 확인
    await page.goto('/analysis/skin/result/test-id');

    // 2. 추천 제품 섹션으로 스크롤
    await page.locator('[data-testid="recommended-products"]').scrollIntoViewIfNeeded();

    // 3. 제품 클릭
    const productLink = page.locator('[data-testid="affiliate-link"]').first();

    // 4. 새 탭에서 열리는지 확인
    const [newPage] = await Promise.all([page.waitForEvent('popup'), productLink.click()]);

    // 5. 외부 링크로 이동 확인
    await expect(newPage).toHaveURL(/coupang|iherb|musinsa/);
  });
});
```

### 2.4 스킨케어 루틴 플로우 (Phase B 후)

```typescript
// tests/e2e/skincare-routine.spec.ts
test.describe('스킨케어 루틴', () => {
  test('루틴 페이지 → 아침/저녁 전환 → 제품 추천', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/analysis/skin/routine');

    // 아침 루틴 확인
    await expect(page.locator('[data-testid="morning-routine"]')).toBeVisible();

    // 저녁으로 전환
    await page.click('[data-testid="evening-toggle"]');
    await expect(page.locator('[data-testid="evening-routine"]')).toBeVisible();
  });
});
```

---

## 3. 테스트 인프라

### 3.1 설정 파일

```typescript
// playwright.config.ts 수정
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3.2 테스트 유틸리티

```typescript
// tests/e2e/utils/auth.ts
export async function loginAsTestUser(page: Page) {
  await page.goto('/sign-in');
  await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
  await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
  await page.click('[type="submit"]');
  await page.waitForURL('/dashboard');
}

// tests/e2e/utils/fixtures.ts
export const TEST_FIXTURES = {
  faceImage: 'tests/fixtures/test-face.jpg',
  skinAnalysisId: 'test-analysis-id',
};
```

---

## 4. 파일 구조

```
tests/e2e/
├── auth.spec.ts              # 인증 테스트
├── skin-analysis.spec.ts     # 피부 분석 테스트
├── product-recommendation.spec.ts  # 제품 추천 테스트
├── skincare-routine.spec.ts  # 루틴 테스트 (Phase B 후)
├── utils/
│   ├── auth.ts               # 인증 헬퍼
│   └── fixtures.ts           # 테스트 데이터
└── fixtures/
    └── test-face.jpg         # 테스트 이미지
```

---

## 5. 예상 파일 수

- 신규: 6-8개
- 수정: 1개 (playwright.config.ts)

---

## 6. CI 연동

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

**작성일**: 2026-01-10
**작성자**: Claude Code
