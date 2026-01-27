# OCP 적용 패턴 (Open-Closed Principle)

> 확장에 열려 있고, 수정에 닫혀 있는 설계 원칙
> **적용 시점**: 새 기능 추가 시에만 적용, 기존 안정 코드는 리팩토링하지 않음

---

## 핵심 원칙

```
"작동하는 코드를 고치지 마라"

기존 7개 분석 API가 정상 작동 중
→ 리팩토링 = 불필요한 복잡성 추가
→ OCP는 새 기능에만 적용
```

---

## 1. 적용 시점

### ✅ OCP 적용 (새 기능)

| 상황                   | 패턴              | 예시                             |
| ---------------------- | ----------------- | -------------------------------- |
| 새 분석 타입 추가      | Strategy Pattern  | OH-1 (구강건강), SK-2 (피부시술) |
| 새 어필리에이트 파트너 | Adapter Pattern   | Olive Young, 아모레퍼시픽        |
| 새 매칭 알고리즘       | Strategy Pattern  | 가격 기반, 계절 기반             |
| 새 점수 계산 방식      | Composite Pattern | 시너지 점수, 인기도 점수         |

### ❌ OCP 미적용 (기존 코드)

| 상황                    | 이유                                  |
| ----------------------- | ------------------------------------- |
| 기존 분석 API 7개       | 안정적으로 작동 중, 리팩토링 ROI 낮음 |
| 단순 버그 수정          | 구조 변경 불필요                      |
| 성능 최적화 (동일 기능) | 인터페이스 변경 없음                  |

---

## 2. Strategy Pattern (분석 타입)

### 2.1 새 분석 타입 추가 시

```typescript
// lib/analysis/types.ts
export interface AnalysisHandler<TInput, TOutput> {
  analyze(input: TInput): Promise<TOutput>;
  getMockResult(input: TInput): TOutput;
  saveToDatabase(userId: string, result: TOutput): Promise<void>;
  getTableName(): string;
  getBadgeType(): string;
}

// lib/analysis/registry.ts
const ANALYSIS_HANDLERS: Record<string, AnalysisHandler<unknown, unknown>> = {};

export function registerHandler(type: string, handler: AnalysisHandler<unknown, unknown>) {
  ANALYSIS_HANDLERS[type] = handler;
}

export function getHandler(type: string) {
  return ANALYSIS_HANDLERS[type];
}
```

### 2.2 새 분석 구현 예시 (OH-1 구강건강)

```typescript
// lib/analysis/oral-health/handler.ts
import { AnalysisHandler } from '../types';
import { OralHealthInput, OralHealthResult } from './types';

export const oralHealthHandler: AnalysisHandler<OralHealthInput, OralHealthResult> = {
  async analyze(input) {
    // Gemini 호출
    return await analyzeOralHealth(input);
  },

  getMockResult(input) {
    return generateOralHealthMock(input);
  },

  async saveToDatabase(userId, result) {
    await supabase.from('oral_health_assessments').insert({ userId, ...result });
  },

  getTableName: () => 'oral_health_assessments',
  getBadgeType: () => 'oral_health',
};

// 등록
registerHandler('oral-health', oralHealthHandler);
```

### 2.3 기존 코드는 그대로 유지

```typescript
// app/api/analyze/skin/route.ts - 기존 코드 유지
// 리팩토링 하지 않음

// app/api/analyze/oral-health/route.ts - 새 코드만 OCP 적용
import { getHandler } from '@/lib/analysis/registry';

export async function POST(request: Request) {
  const handler = getHandler('oral-health');
  // ...
}
```

---

## 3. Adapter Pattern (외부 API)

### 3.1 파트너 어댑터 인터페이스

```typescript
// lib/affiliate/adapters/types.ts
export interface PartnerAdapter {
  partnerId: string;
  searchProducts(query: ProductQuery): Promise<Product[]>;
  generateDeeplink(productId: string, userId: string): string;
  parseWebhook(payload: unknown): ConversionEvent | null;
}
```

### 3.2 새 파트너 추가 예시

```typescript
// lib/affiliate/adapters/olive-young.ts
export const oliveYoungAdapter: PartnerAdapter = {
  partnerId: 'olive-young',

  async searchProducts(query) {
    const response = await fetch(OLIVE_YOUNG_API, { ... });
    return mapToProducts(response);
  },

  generateDeeplink(productId, userId) {
    return `https://oliveyoung.co.kr/product/${productId}?ref=${userId}`;
  },

  parseWebhook(payload) {
    // Olive Young 웹훅 포맷 파싱
    return { ... };
  },
};

// 등록
registerAdapter(oliveYoungAdapter);
```

### 3.3 기존 파트너는 그대로

```typescript
// lib/affiliate/partners/coupang.ts - 기존 코드 유지
// lib/affiliate/partners/iherb.ts - 기존 코드 유지
// lib/affiliate/adapters/olive-young.ts - 새 코드만 Adapter 패턴
```

---

## 4. Template Method (공통 라우트 핸들러)

### 4.1 새 API 라우트 추가 시

```typescript
// lib/api/analysis-route-handler.ts
export async function createAnalysisRoute<TInput, TOutput>(
  handler: AnalysisHandler<TInput, TOutput>,
  schema: z.ZodSchema<TInput>
) {
  return async (request: Request) => {
    // 1. 인증
    const { userId } = await auth();
    if (!userId) return unauthorized();

    // 2. Rate Limit
    const { success } = await checkRateLimit(userId);
    if (!success) return rateLimited();

    // 3. 입력 검증
    const body = await request.json();
    const input = schema.parse(body);

    // 4. 분석 실행 (with fallback)
    const { result, usedFallback } = await withFallback(
      () => handler.analyze(input),
      () => handler.getMockResult(input)
    );

    // 5. DB 저장
    await handler.saveToDatabase(userId, result);

    // 6. 뱃지 업데이트
    await updateBadge(userId, handler.getBadgeType());

    return json({ ...result, usedFallback });
  };
}
```

### 4.2 사용 예시

```typescript
// app/api/analyze/oral-health/route.ts
import { createAnalysisRoute } from '@/lib/api/analysis-route-handler';
import { oralHealthHandler } from '@/lib/analysis/oral-health/handler';
import { oralHealthInputSchema } from '@/lib/analysis/oral-health/types';

export const POST = createAnalysisRoute(oralHealthHandler, oralHealthInputSchema);
```

---

## 5. 점진적 적용 전략

### 5.1 자연스러운 전환 시점

| 시점                          | 액션                            |
| ----------------------------- | ------------------------------- |
| 새 분석 타입 추가             | Strategy + Template Method 적용 |
| 새 파트너 연동                | Adapter Pattern 적용            |
| 버그 수정 (해당 코드 수정 시) | 기회가 되면 OCP 고려            |
| 성능 개선 (구조 변경 필요 시) | 리팩토링하면서 OCP 적용         |

### 5.2 코드 리뷰 체크리스트

```markdown
## OCP 체크리스트 (새 기능 추가 시)

- [ ] 기존 코드 수정 없이 확장 가능한가?
- [ ] 인터페이스/추상 타입 정의됐나?
- [ ] 새 구현체가 기존 인터페이스 준수하나?
- [ ] 레지스트리/팩토리에 등록됐나?
- [ ] 기존 테스트 깨지지 않나?
```

---

## 6. 금지 패턴

### 6.1 과도한 추상화

```typescript
// ❌ 금지: 한 번만 쓰일 코드에 추상화
interface IUserService { ... }
interface IUserRepository { ... }
interface IUserFactory { ... }
// → 사용처가 1개뿐이면 구체 클래스로 충분

// ✅ 허용: 2개 이상 구현체가 있을 때만 추상화
interface PartnerAdapter { ... }  // 쿠팡, iHerb, 무신사, Olive Young
```

### 6.2 불필요한 리팩토링

```typescript
// ❌ 금지: 작동하는 기존 코드 리팩토링
// "OCP를 위해" 기존 7개 API 전부 수정

// ✅ 허용: 새 코드만 OCP 적용
// 8번째 분석 타입부터 새 패턴 적용
```

---

## 7. P4 (단순화) 원칙과의 조화

```
OCP는 P4 (단순화)를 위반하지 않아야 한다.

추상화 추가 기준:
- 구현체가 2개 이상일 때만 인터페이스 도입
- 1개 구현체만 있으면 구체 클래스 사용
- "나중을 위한" 추상화 금지

OCP 적용 기준:
- 실제로 확장이 필요할 때만 적용
- "혹시 모르니까" 적용 금지
```

---

## 8. 관련 문서

### 원리 문서

- [extensibility.md](../../docs/principles/extensibility.md) - 확장성 원리

### 규칙 문서

- [00-first-principles.md](./00-first-principles.md) - P4: 단순화
- [encapsulation.md](./encapsulation.md) - 모듈 경계

### ADR

- [ADR-001](../../docs/adr/ADR-001-core-image-engine.md) - 이미지 엔진 확장성
- [ADR-032](../../docs/adr/ADR-032-smart-matching.md) - 매칭 전략 확장

---

**Version**: 1.0 | **Created**: 2026-01-22
**적용 범위**: 새 기능 추가 시에만 적용
