# 테스트 패턴

> 이룸 프로젝트 테스트 전략 및 패턴

## 테스트 유형별 가이드

### 단위 테스트 (Unit Tests)

**대상**: 순수 함수, 유틸리티, 훅

```typescript
// tests/lib/utils/format.test.ts
import { formatDate, formatNumber } from '@/lib/utils/format';

describe('formatDate', () => {
  it('should format date in Korean locale', () => {
    const date = new Date('2026-01-15');
    expect(formatDate(date)).toBe('2026년 1월 15일');
  });

  it('should handle null input gracefully', () => {
    expect(formatDate(null)).toBe('-');
  });
});
```

### 컴포넌트 테스트 (Component Tests)

**대상**: UI 컴포넌트, 폼, 상호작용

```typescript
// tests/components/workout/WorkoutCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutCard } from '@/components/workout/WorkoutCard';

describe('WorkoutCard', () => {
  const mockWorkout = {
    id: '1',
    name: '스쿼트',
    duration: 30,
  };

  it('should render workout name', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    expect(screen.getByText('스쿼트')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<WorkoutCard workout={mockWorkout} onClick={handleClick} />);

    fireEvent.click(screen.getByTestId('workout-card'));
    expect(handleClick).toHaveBeenCalledWith(mockWorkout.id);
  });
});
```

### 통합 테스트 (Integration Tests)

**대상**: API 라우트, DB 연동, 서비스 레이어

```typescript
// tests/integration/api/analyze-skin.test.ts
import { POST } from '@/app/api/analyze/skin/route';
import { createMockRequest } from '@/tests/utils/mock-request';

describe('POST /api/analyze/skin', () => {
  it('should return analysis result', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { imageBase64: 'data:image/jpeg;base64,...' },
      headers: { 'x-clerk-user-id': 'user_123' },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('skinType');
    expect(data).toHaveProperty('scores');
  });
});
```

### E2E 테스트 (Playwright)

**대상**: 사용자 플로우, 크로스 페이지 상호작용

```typescript
// tests/e2e/analysis/personal-color.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Personal Color Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should complete analysis flow', async ({ page }) => {
    await page.goto('/analysis/personal-color');

    // 이미지 업로드
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/face.jpg');

    // 분석 대기
    await page.click('button:has-text("분석 시작")');
    await page.waitForSelector('[data-testid="analysis-result"]', {
      timeout: 30000,
    });

    // 결과 확인
    await expect(page.locator('[data-testid="season-type"]')).toBeVisible();
  });
});
```

## 테스트 패턴

### AAA 패턴 (Arrange-Act-Assert)

```typescript
it('should calculate match rate correctly', () => {
  // Arrange
  const product = { colorTone: 'warm', skinType: 'dry' };
  const userProfile = { season: 'spring', skinType: 'dry' };

  // Act
  const matchRate = calculateMatchRate(product, userProfile);

  // Assert
  expect(matchRate).toBeGreaterThan(80);
});
```

### 테스트 데이터 팩토리

```typescript
// tests/factories/user.ts
export function createMockUser(overrides = {}): User {
  return {
    id: 'user_123',
    clerkUserId: 'clerk_123',
    email: 'test@example.com',
    createdAt: new Date(),
    ...overrides,
  };
}

// tests/factories/analysis.ts
export function createMockSkinAnalysis(overrides = {}): SkinAnalysis {
  return {
    id: 'analysis_123',
    skinType: 'combination',
    scores: {
      hydration: 65,
      oiliness: 45,
      sensitivity: 30,
    },
    ...overrides,
  };
}
```

### Mock 패턴

#### Supabase Mock

```typescript
// tests/mocks/supabase.ts
export const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock('@/lib/supabase/client', () => ({
  useClerkSupabaseClient: () => mockSupabase,
}));
```

#### AI Mock

```typescript
// tests/mocks/gemini.ts
vi.mock('@/lib/gemini', () => ({
  analyzeWithGemini: vi.fn().mockResolvedValue({
    skinType: 'combination',
    confidence: 85,
  }),
}));
```

### 스냅샷 테스트

```typescript
// 복잡한 UI 컴포넌트에만 사용
it('should match snapshot', () => {
  const { container } = render(
    <AnalysisResultCard result={mockResult} />
  );
  expect(container).toMatchSnapshot();
});
```

## 커버리지 목표

| 영역        | 목표 | 현재 |
| ----------- | ---- | ---- |
| 전체        | 80%  | -    |
| lib/        | 90%  | -    |
| components/ | 75%  | -    |
| api/        | 85%  | -    |

### 커버리지 제외

```javascript
// vitest.config.ts
coverage: {
  exclude: [
    'tests/**',
    '**/*.d.ts',
    '**/types/**',
    '**/*.config.*',
    '**/mock/**',
  ],
}
```

## 테스트 명령어

```bash
# 전체 테스트
npm run test

# 단일 파일
npm run test -- path/to/file.test.ts

# Watch 모드
npm run test -- --watch

# 커버리지
npm run test:coverage

# E2E
npm run test:e2e

# 특정 테스트만
npm run test -- -t "테스트 이름"
```

## 테스트 작성 원칙

### 필수 사항

1. **새 함수 = 새 테스트**: 모든 새 함수에 테스트 동반
2. **data-testid**: 최상위 컨테이너에 필수
3. **에지 케이스**: null, undefined, 빈 배열 테스트
4. **에러 케이스**: 실패 시나리오 테스트

### 금지 사항

1. **구현 테스트 금지**: 내부 구현이 아닌 동작 테스트
2. **타임아웃 의존 금지**: waitFor 사용
3. **테스트 간 의존성 금지**: 각 테스트 독립적

### 네이밍 컨벤션

```typescript
// 파일명
ComponentName.test.tsx
functionName.test.ts

// describe
describe('ComponentName', () => { ... });
describe('functionName', () => { ... });

// it
it('should [동작] when [조건]', () => { ... });
it('should throw error when input is invalid', () => { ... });
```

---

**Version**: 1.0 | **Updated**: 2026-01-15
