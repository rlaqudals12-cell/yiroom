# ADR-015: 테스트 전략 및 피라미드

## 상태

`accepted`

## 날짜

2026-01-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 변경이 즉시 검증되고, 버그가 프로덕션에 도달하지 않는 상태"

- **100% 신뢰성**: 테스트 통과 = 프로덕션 안정성 보장
- **즉각적 피드백**: 전체 테스트 < 1분
- **자동 커버리지**: 코드 변경 시 테스트 자동 생성
- **Flaky-free**: 비결정적 테스트 0건

### 물리적 한계

| 항목 | 한계 |
|------|------|
| AI 비결정성 | Gemini 응답 변동으로 100% 재현 불가 |
| E2E 속도 | 브라우저 렌더링 + 네트워크로 필연적 지연 |
| 커버리지 역설 | 100% 라인 커버리지 ≠ 버그 0 |
| 유지보수 비용 | 테스트 수 증가 → 유지보수 부담 선형 증가 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| Unit 커버리지 | 90% | 75% | lib/ 중심 |
| Integration 커버리지 | 80% | 60% | API 라우트 |
| E2E 시나리오 | 15개 | 9개 | 핵심 플로우 |
| CI 실행 시간 | < 5분 | 8분 | 병렬화 필요 |
| Flaky 테스트율 | 0% | 2% | 타이밍 이슈 |

### 현재 목표: 85%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| Property-Based Testing | 학습 곡선 대비 ROI | 복잡 알고리즘 추가 시 |
| Visual Regression | 인프라 비용 | 디자인 시스템 안정화 후 |
| Mutation Testing | CI 시간 급증 | 테스트 품질 의심 시 |
| 100% E2E 커버리지 | 속도/비용 trade-off | 핵심 시나리오 충분 |

---

## 맥락 (Context)

이룸 프로젝트는 **2,686개 테스트**로 높은 커버리지를 보유하나, **체계적 전략 부재**:

1. **테스트 레벨 기준 없음**: Unit vs Integration vs E2E 선택 기준 모호
2. **Mock 정책 불일치**: AI mock은 있으나 API mock 규칙 없음
3. **Fixture 패턴 없음**: 테스트 데이터 생성 방식 각자 다름
4. **명명 규칙 혼재**: `should...` vs `when...` vs `it...`

## 결정 (Decision)

**테스트 피라미드 + 표준 패턴** 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                        /\                                    │
│                       /  \    E2E (10%)                     │
│                      /    \   9개 핵심 시나리오              │
│                     /      \                                 │
│                    /--------\                                │
│                   /          \  Integration (30%)            │
│                  /            \ API 라우트 테스트            │
│                 /--------------\                             │
│                /                \                            │
│               /    Unit (60%)    \ Repository, Service,      │
│              /                    \ Utils, Hooks             │
│             /----------------------\                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 테스트 레벨 정의

| 레벨 | 대상 | 커버리지 목표 | 도구 |
|------|------|--------------|------|
| **Unit** | 순수 함수, 유틸, 훅 | 80%+ | Vitest |
| **Integration** | API 라우트, Service | 60%+ | Vitest + Supabase |
| **E2E** | 사용자 플로우 | 9개 시나리오 | Playwright |

### Mock 정책

| 대상 | Mock 방식 | 위치 |
|------|----------|------|
| **AI (Gemini)** | lib/mock/ fallback | 기존 유지 |
| **DB (Supabase)** | 테스트 DB 또는 Fixture | tests/fixtures/ |
| **외부 API** | MSW (향후) | tests/mocks/handlers.ts |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| E2E 위주 | 실제 동작 검증 | 느림, 불안정 | `LOW_ROI` |
| Unit 위주만 | 빠름 | 통합 버그 놓침 | `ALT_SUFFICIENT` |

## 결과 (Consequences)

### 긍정적 결과

- **빠른 피드백**: Unit 테스트 < 10초
- **신뢰성**: 통합 테스트로 경계 검증
- **사용자 관점**: E2E로 핵심 플로우 보장

### 부정적 결과

- **유지보수 비용**: 3계층 테스트 관리
- **CI 시간 증가**: E2E 테스트 느림

## 구현 가이드

### 테스트 명명 규칙 (BDD 스타일)

```typescript
// 표준 명명 패턴
describe('ProductService', () => {
  describe('getProductWithMatching', () => {
    describe('when user has PC-1 analysis', () => {
      it('should return product with match rate', async () => {
        // ...
      });
    });

    describe('when user has no analysis', () => {
      it('should return product with default match rate', async () => {
        // ...
      });
    });
  });
});
```

### Fixture Factory 패턴

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export function createUserFixture(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    clerk_user_id: `user_${faker.string.alphanumeric(24)}`,
    email: faker.internet.email(),
    created_at: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createPC1Fixture(
  userId: string,
  overrides: Partial<PC1Analysis> = {}
): PC1Analysis {
  return {
    id: faker.string.uuid(),
    clerk_user_id: userId,
    season: faker.helpers.arrayElement(['spring', 'summer', 'autumn', 'winter']),
    confidence: faker.number.int({ min: 70, max: 95 }),
    created_at: faker.date.past().toISOString(),
    ...overrides,
  };
}
```

### API 테스트 패턴

```typescript
// tests/api/products.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestClient } from '../helpers/test-client';
import { createProductFixture } from '../factories/product.factory';

describe('GET /api/products/:id', () => {
  let testClient: TestClient;

  beforeEach(async () => {
    testClient = await createTestClient();
  });

  describe('when product exists', () => {
    it('should return product details', async () => {
      // Arrange
      const product = createProductFixture();
      await testClient.insertProduct(product);

      // Act
      const response = await testClient.get(`/api/products/${product.id}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(product.id);
    });
  });

  describe('when product does not exist', () => {
    it('should return 404', async () => {
      const response = await testClient.get('/api/products/non-existent');
      expect(response.status).toBe(404);
    });
  });
});
```

### E2E 테스트 시나리오 (9개)

```typescript
// tests/e2e/scenarios.ts
export const E2E_SCENARIOS = [
  'signup-and-onboarding',       // 회원가입 → 온보딩 완료
  'personal-color-analysis',     // PC-1 분석 플로우
  'skin-analysis',               // S-1 분석 플로우
  'body-analysis',               // C-1 분석 플로우
  'workout-onboarding',          // 운동 온보딩 → 첫 운동
  'meal-record',                 // 식단 기록 → 영양 분석
  'product-browse-purchase',     // 제품 탐색 → 상세 → 리뷰
  'friends-and-leaderboard',     // 친구 추가 → 리더보드
  'settings-and-profile',        // 설정 변경 → 프로필 수정
] as const;
```

### 폴더 구조

```
tests/
├── unit/                    # 단위 테스트
│   ├── lib/                 # lib/ 모듈 테스트
│   ├── hooks/               # 커스텀 훅 테스트
│   └── utils/               # 유틸리티 테스트
├── integration/             # 통합 테스트
│   ├── api/                 # API 라우트 테스트
│   └── services/            # 서비스 레이어 테스트
├── e2e/                     # E2E 테스트 (Playwright)
│   └── scenarios/           # 9개 시나리오
├── factories/               # 테스트 데이터 팩토리
├── fixtures/                # 정적 테스트 데이터
├── mocks/                   # Mock 핸들러 (MSW)
└── helpers/                 # 테스트 헬퍼 함수
```

### CI 파이프라인 통합

```yaml
# .github/workflows/test.yml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:unit
    # 예상 시간: 30초

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - run: npm run test:integration
    # 예상 시간: 2분

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - run: npm run test:e2e
    # 예상 시간: 5분
```

## 리서치 티켓

```
[ADR-015-R1] 테스트 전략 고도화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. AI 기반 테스트 케이스 자동 생성 도구 비교 (Copilot, Cody, Claude)
2. Visual Regression Testing과 Snapshot Testing 조합 전략
3. Property-Based Testing(fast-check)을 활용한 엣지케이스 자동 탐색

→ 결과를 Claude Code에서 tests/ 테스트 인프라에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: AI 추론](../principles/ai-inference.md) - AI Mock 테스트, 신뢰도 검증
- [원리: 보안 패턴](../principles/security-patterns.md) - 보안 테스트 원칙

### 관련 ADR/스펙
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md)
- [Testing Patterns](../../.claude/rules/testing-patterns.md) - 테스트 패턴

---

**Author**: Claude Code
**Reviewed by**: -
