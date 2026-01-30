# 확장성 원리 (Extensibility)

> 이 문서는 이룸 시스템의 확장성 설계 원리를 설명한다.
>
> **핵심 원칙**: 기존 코드를 수정하지 않고 새 기능을 추가할 수 있어야 한다 (OCP)
> **적용 범위**: 새 기능 추가 시에만 적용, 기존 안정 코드는 유지

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 플러그인 아키텍처"

- Zero Modification: 새 기능 추가 시 기존 코드 수정 0줄
- Interface Stability: 공개 인터페이스 100% 하위 호환
- Hot Reload: 런타임 중 새 모듈 로드/언로드 가능
- Self-Registration: 새 모듈이 자동으로 시스템에 등록
- Type Safety: 확장 시에도 100% 컴파일 타임 타입 검증
- Isolation: 각 모듈 독립 테스트/배포 가능
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **추상화 비용** | 인터페이스 설계에 초기 시간 투자 필요 |
| **복잡도 증가** | 구체 클래스 대비 간접 참조 증가 |
| **런타임 오버헤드** | 동적 디스패치 비용 (미미함) |
| **Over-Engineering 위험** | "미래를 위한" 과도한 추상화 유혹 |
| **단일 구현체 낭비** | 1개 구현체에 인터페이스 = 불필요한 복잡도 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **OCP 준수율** | 100% (새 기능 추가 시 기존 파일 수정 0개) |
| **인터페이스 안정성** | 100% (Breaking Change 0회/년) |
| **확장 비용** | O(1) (n번째 기능 추가 비용 = 1번째와 동일) |
| **Registry 커버리지** | 100% (모든 확장 포인트 Registry 사용) |
| **테스트 격리** | 100% (각 구현체 독립 테스트) |
| **문서화** | 100% (모든 확장 포인트 JSDoc) |

### 현재 목표

**70%** - MVP 확장성

- ✅ OCP 원칙 정의
- ✅ Strategy Pattern 분석 모듈 적용
- ✅ Adapter Pattern 어필리에이트 적용
- ✅ Registry Pattern 구현
- ✅ DIP 적용 (AI 분석 추상화)
- ⏳ 신규 모듈 OCP 일관 적용 (60%)
- ⏳ 확장 포인트 문서화 (50%)
- ⏳ 기존 7개 분석 API 통일 (미적용, 의도적)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 기존 7개 API 리팩토링 | 안정적 운영 중, ROI 낮음 | 8번째 분석부터 새 패턴 |
| Hot Reload 모듈 | 복잡도, 보안 우려 | Phase 5 (엔터프라이즈) |
| 동적 플러그인 시스템 | 현재 규모에 과도함 | 외부 개발자 확장 시 |
| 1개 구현체 인터페이스 | YAGNI 원칙 | 2번째 구현체 추가 시 |

---

## 1. 핵심 개념

### 1.1 Open-Closed Principle (OCP)

소프트웨어 엔티티(클래스, 모듈, 함수)는:
- **확장에 열려 있어야 한다** (Open for extension)
- **수정에 닫혀 있어야 한다** (Closed for modification)

### 1.2 이룸 프로젝트 적용

| 영역 | 확장 대상 | 변경 없이 추가 가능 |
|------|----------|-------------------|
| 분석 모듈 | 새 분석 타입 | OH-1, SK-2, 새 모듈 |
| 어필리에이트 | 새 파트너 | Olive Young, 아모레퍼시픽 |
| 매칭 엔진 | 새 점수 계산 | 계절 매칭, 가격 매칭 |
| 추천 시스템 | 새 시너지 조합 | 도메인 추가 시 |

---

## 2. 수학적/논리적 기반

### 2.1 의존성 역전 원칙 (DIP)

```
고수준 모듈은 저수준 모듈에 의존해서는 안 된다.
둘 다 추상화에 의존해야 한다.

추상화는 세부사항에 의존해서는 안 된다.
세부사항이 추상화에 의존해야 한다.
```

**다이어그램**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    의존성 역전 (DIP)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [AS-IS] 고수준 → 저수준 직접 의존                                │
│                                                                  │
│  ┌───────────────┐                                              │
│  │ API Route     │──────────────▶ ┌───────────────┐             │
│  │ (고수준)       │                │ Gemini Client │             │
│  └───────────────┘                │ (저수준)       │             │
│                                    └───────────────┘             │
│                                                                  │
│  [TO-BE] 둘 다 추상화에 의존                                      │
│                                                                  │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐  │
│  │ API Route     │────▶│ <<interface>> │◀────│ Gemini Client │  │
│  │ (고수준)       │     │ AIAnalyzer    │     │ (저수준)       │  │
│  └───────────────┘     └───────────────┘     └───────────────┘  │
│                                ▲                                 │
│                                │                                 │
│                        ┌───────────────┐                        │
│                        │ Mock Analyzer │                        │
│                        │ (테스트용)     │                        │
│                        └───────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 확장 비용 공식

```
확장비용(Feature) = 인터페이스 정의 비용 + 구현체 추가 비용

리팩토링 없이 확장:
  구현체 추가 비용만 발생 (O(1))

리팩토링 필요 시:
  기존 코드 수정 + 테스트 수정 + 회귀 테스트 (O(n))
```

**OCP 적용 시 이점**:

```
n번째 기능 추가 비용:

OCP 미적용: Cost = Base + n × ModificationCost
OCP 적용:   Cost = Base + AdditionCost (상수)
```

### 2.3 인터페이스 분리 원칙 (ISP)

```
클라이언트는 자신이 사용하지 않는 메서드에 의존하지 않아야 한다.
```

**이룸 적용**:

```typescript
// ❌ 하나의 거대한 인터페이스
interface AnalysisService {
  analyzeSkin(): Promise<SkinResult>;
  analyzeColor(): Promise<ColorResult>;
  analyzeBody(): Promise<BodyResult>;
  // ... 모든 분석 타입
}

// ✅ 분리된 인터페이스
interface AnalysisHandler<TInput, TOutput> {
  analyze(input: TInput): Promise<TOutput>;
  getMockResult(input: TInput): TOutput;
}
```

---

## 3. 구현 도출

### 3.1 원리 → 패턴

| 원리 | 패턴 | 적용 영역 |
|------|------|----------|
| OCP | Strategy Pattern | 분석 타입 |
| DIP | Adapter Pattern | 외부 API |
| ISP | Interface Segregation | 핸들러 인터페이스 |

### 3.2 Strategy Pattern

```typescript
// 전략 인터페이스
interface ScoringStrategy {
  calculate(item: Item, profile: UserProfile): number;
}

// 구체적 전략들
class SkinMatchStrategy implements ScoringStrategy {
  calculate(item, profile) {
    return calculateSkinMatch(item.skinTypes, profile.skinType);
  }
}

class ColorMatchStrategy implements ScoringStrategy {
  calculate(item, profile) {
    return calculateColorMatch(item.seasons, profile.season);
  }
}

// 새 전략 추가 (기존 코드 수정 없음)
class SeasonalStrategy implements ScoringStrategy {
  calculate(item, profile) {
    return calculateSeasonalRelevance(item, getCurrentSeason());
  }
}
```

### 3.3 Adapter Pattern

```typescript
// 타겟 인터페이스
interface PartnerAdapter {
  searchProducts(query: string): Promise<Product[]>;
  generateDeeplink(productId: string): string;
}

// 어댑터 구현 (기존 API를 인터페이스에 맞춤)
class CoupangAdapter implements PartnerAdapter {
  async searchProducts(query) {
    // 쿠팡 API 호출 → 공통 Product 형식으로 변환
  }
}

class OliveYoungAdapter implements PartnerAdapter {
  async searchProducts(query) {
    // Olive Young API 호출 → 공통 Product 형식으로 변환
  }
}
```

### 3.4 Registry Pattern

```typescript
// 레지스트리 (확장 포인트)
class AnalysisRegistry {
  private handlers = new Map<string, AnalysisHandler>();

  register(type: string, handler: AnalysisHandler) {
    this.handlers.set(type, handler);
  }

  get(type: string): AnalysisHandler | undefined {
    return this.handlers.get(type);
  }

  list(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// 사용
const registry = new AnalysisRegistry();
registry.register('skin', skinHandler);
registry.register('personal-color', colorHandler);
// 새 타입 추가 (기존 코드 수정 없음)
registry.register('oral-health', oralHealthHandler);
```

---

## 4. 검증 방법

### 4.1 OCP 준수 검증

| 검증 항목 | 방법 | 기준 |
|----------|------|------|
| 새 기능 추가 | 기존 파일 수정 개수 | 0개 (이상적) |
| 기존 테스트 | 테스트 실패 여부 | 0개 실패 |
| 인터페이스 | 변경 여부 | 변경 없음 |

### 4.2 확장성 테스트

```typescript
// 새 구현체가 기존 인터페이스를 준수하는지
describe('OCP Compliance', () => {
  it('should add new analysis type without modifying existing code', () => {
    // 1. 새 핸들러 등록
    registry.register('oral-health', oralHealthHandler);

    // 2. 기존 핸들러들 정상 작동
    expect(registry.get('skin')).toBeDefined();
    expect(registry.get('personal-color')).toBeDefined();

    // 3. 새 핸들러 정상 작동
    expect(registry.get('oral-health')).toBeDefined();
  });

  it('should not modify AnalysisHandler interface', () => {
    // 인터페이스 메서드 목록이 고정됨
    const handler = registry.get('oral-health');
    expect(typeof handler.analyze).toBe('function');
    expect(typeof handler.getMockResult).toBe('function');
  });
});
```

### 4.3 코드 리뷰 체크리스트

```markdown
## OCP 검증 (새 기능 PR)

- [ ] 기존 파일 수정 최소화 (레지스트리 등록만)
- [ ] 새 인터페이스 구현체 추가
- [ ] 기존 테스트 전부 통과
- [ ] 새 구현체 테스트 추가
```

---

## 5. 적용 가이드라인

### 5.1 적용 시점

```
✅ OCP 적용:
- 새 분석 타입 추가 (PC-1 이후)
- 새 어필리에이트 파트너 연동
- 새 매칭/점수 알고리즘

❌ OCP 미적용:
- 기존 안정 코드 리팩토링
- 단순 버그 수정
- 성능 최적화 (인터페이스 변경 없음)
```

### 5.2 추상화 도입 기준

```
추상화 추가 기준:
- 구현체가 2개 이상일 때만 인터페이스 도입
- 1개 구현체만 있으면 구체 클래스 사용
- "나중을 위한" 추상화 금지 (YAGNI)
```

### 5.3 P4 (단순화) 원칙과의 조화

```
OCP는 복잡성을 추가하지만, 장기적으로 수정 비용을 줄인다.

균형점:
- 단기: 구체 클래스로 빠르게 구현
- 중기: 2번째 구현체 추가 시 인터페이스 추출
- 장기: 확장 포인트 안정화
```

---

## 6. 이룸 특화 적용

### 6.1 분석 모듈 확장 구조

```
lib/analysis/
├── types.ts              # 공통 인터페이스
├── registry.ts           # 핸들러 레지스트리
├── skin/                 # 기존 모듈 (수정 안 함)
├── personal-color/       # 기존 모듈 (수정 안 함)
├── body/                 # 기존 모듈 (수정 안 함)
├── oral-health/          # 새 모듈 (OCP 적용)
│   ├── handler.ts
│   ├── types.ts
│   └── mock.ts
└── skin-procedure/       # 새 모듈 (OCP 적용)
    ├── handler.ts
    ├── types.ts
    └── mock.ts
```

### 6.2 어필리에이트 확장 구조

```
lib/affiliate/
├── adapters/
│   ├── types.ts          # 공통 인터페이스
│   ├── registry.ts       # 어댑터 레지스트리
│   ├── coupang.ts        # 기존 (수정 안 함)
│   ├── iherb.ts          # 기존 (수정 안 함)
│   └── olive-young.ts    # 새 파트너 (OCP 적용)
```

---

## 7. 관련 문서

### 규칙 문서
- [ocp-patterns.md](../../.claude/rules/ocp-patterns.md) - 구체적 적용 패턴
- [encapsulation.md](../../.claude/rules/encapsulation.md) - 모듈 경계 (P8)

### ADR
- [ADR-001](../adr/ADR-001-core-image-engine.md) - 이미지 엔진 확장성
- [ADR-032](../adr/ADR-032-smart-matching.md) - 매칭 전략 확장

---

## 8. 참고 자료

### 학술 자료

| 주제 | 저자 | 출처 |
|------|------|------|
| OCP 원칙 | Bertrand Meyer | Object-Oriented Software Construction (1988) |
| SOLID 원칙 | Robert C. Martin | Agile Software Development (2002) |
| 디자인 패턴 | GoF | Design Patterns (1994) |

### 기술 문서

- [SOLID Principles - Wikipedia](https://en.wikipedia.org/wiki/SOLID)
- [Open-Closed Principle - Martin Fowler](https://martinfowler.com/bliki/OpenClosedPrinciple.html)

---

**Version**: 1.0 | **Created**: 2026-01-22
**관련 규칙**: [ocp-patterns.md](../../.claude/rules/ocp-patterns.md)
**적용 범위**: 새 기능 추가 시에만 적용
