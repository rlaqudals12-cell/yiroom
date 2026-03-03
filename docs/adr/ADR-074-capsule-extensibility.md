# ADR-074: 캡슐 확장성 전략

## 상태

**제안** (2026-03-03)

## 컨텍스트

CapsuleEngine\<T\>(ADR-069)는 9개 도메인을 지원하는 범용 인터페이스이다.
향후 새 도메인(수면, 정신건강, 향수 등) 추가 시 기존 코드 수정 없이
확장할 수 있어야 한다(OCP 원칙). 동시에 C4(로테이션) 원칙에 따라
모듈별 교체 주기가 상이하므로 로테이션 엔진도 범용이어야 한다.

### 현재 9모듈 로테이션 주기

| 모듈              | 교체 주기 | 이유           |
| ----------------- | --------- | -------------- |
| Skin (스킨케어)   | 4-8주     | 피부 내성 방지 |
| Fashion (옷장)    | 12-16주   | 계절 전환      |
| Workout (운동)    | 4-6주     | 근육 적응      |
| Nutrition (영양)  | 2-4주     | 식단 다양성    |
| Hair (헤어)       | 8-12주    | 모발 주기      |
| Makeup (메이크업) | 4-8주     | 트렌드 + 계절  |
| PC (퍼스널컬러)   | 52주      | 연 1회 재측정  |
| Oral (구강)       | 12주      | 제품 소진 주기 |
| Body (체형)       | 8-12주    | 체형 변화 관측 |

## 결정

### 1. 도메인 등록 레지스트리

```typescript
// lib/capsule/registry.ts
interface DomainConfig<T> {
  domainId: string; // 'skin', 'fashion', ...
  engine: CapsuleEngine<T>; // 도메인별 엔진 구현체
  rotationWeeks: [number, number]; // [최소, 최대] 교체 주기
  optimalN: (level: 1 | 2 | 3 | 4) => number; // 레벨별 N
  compatibilityRules: CompatRule[]; // 다른 도메인과의 호환 규칙
}

interface CompatRule {
  fromDomain: string; // 출발 도메인
  toDomain: string; // 대상 도메인
  factor: number; // -1.0 ~ 1.0 (음수=충돌, 양수=시너지)
  condition?: string; // 적용 조건 (예: "동일 색조 계열")
}

// 적응도 = 최근 2주간 사용률 (로테이션 가속에 사용)
function calculateAdaptation(history: UsageLog[]): number {
  const recentDays = 14;
  const usedDays = countUniqueDays(history, recentDays);
  return usedDays / recentDays; // 0.0 ~ 1.0
}

const DOMAIN_REGISTRY: Map<string, DomainConfig<unknown>> = new Map();

// 새 도메인 추가 = registerDomain 1회 호출
export function registerDomain<T>(config: DomainConfig<T>): void {
  DOMAIN_REGISTRY.set(config.domainId, config);
}
```

### 2. 로테이션 엔진 (범용)

```
로테이션 판단 알고리즘:

shouldRotate(capsule, profile):
  1. 경과일 = now - capsule.lastRotation
  2. 주기 = domain.rotationWeeks × 7 (일 변환)
  3. 적응도 = calculateAdaptation(capsule.usageHistory)
  4. 로테이션 필요 = 경과일 ≥ 주기 × (1 - 적응 가속도)

rotate(capsule, profile):
  1. 현재 아이템 중 교체 대상 선별 (낮은 효과/만족도)
  2. 후보 = curate(profile) - 현재 아이템
  3. 호환성 검사: CCS(후보, 잔류 아이템) ≥ 70
  4. 교체 비율: 전체의 20-40% (급격한 변화 방지)
  5. 교체 기록 저장 → rotation_history 테이블
```

### 3. 새 도메인 추가 절차

```
P7 순서 준수:

1. docs/research/ — 도메인 리서치
2. docs/principles/ — 원리 문서 작성
3. docs/adr/ — 도메인 ADR 작성
4. docs/specs/ — SDD 작성
5. 구현:
   a. lib/capsule/domains/[domain].ts — CapsuleEngine<T> 구현
   b. registerDomain() 호출
   c. 기존 코드 수정 0줄 (OCP)

체크리스트:
  □ CapsuleEngine<T> 5개 메서드 모두 구현
  □ rotationWeeks 과학적 근거 문서화
  □ optimalN 레벨별 정의
  □ compatibilityRules 최소 기존 3개 도메인과 정의
  □ 단위 테스트 작성
```

### 4. 플러그인 아키텍처

```
lib/capsule/
├── index.ts           # 공개 API (barrel export)
├── engine.ts          # CapsuleEngine<T> 인터페이스
├── registry.ts        # DomainRegistry
├── rotation.ts        # 범용 로테이션 엔진
├── scoring.ts         # CCS 계산 (ADR-071)
├── daily.ts           # Daily Capsule (ADR-073)
└── domains/           # 도메인별 구현
    ├── skin.ts
    ├── fashion.ts
    ├── workout.ts
    ├── nutrition.ts
    ├── hair.ts
    ├── makeup.ts
    ├── personal-color.ts
    ├── oral.ts
    └── body.ts
```

## 대안

| 대안                   | 장점           | 단점                     | 기각 이유        |
| ---------------------- | -------------- | ------------------------ | ---------------- |
| 모놀리식 (하나의 엔진) | 단순           | 도메인 추가 시 전체 수정 | OCP 위반         |
| 마이크로서비스 분리    | 독립 배포      | 인프라 복잡              | 현재 규모에 과도 |
| 설정 파일 기반 (JSON)  | 코드 수정 없음 | 복잡한 로직 표현 제한    | 유연성 부족      |

## 결과

### 장점

- 새 도메인 추가 = registerDomain() 1회 + 엔진 구현 1파일
- 기존 코드 수정 0줄 (OCP 완전 준수)
- 로테이션 엔진 범용화로 도메인별 중복 제거
- P8(모듈 경계) 준수: domains/ 폴더로 격리

### 단점

- 레지스트리 런타임 등록 방식은 타입 안전성 제한
- 도메인 간 호환성 규칙이 도메인 수 증가에 따라 선형 증가

## 관련 문서

- [P-1: capsule-principle.md](../principles/capsule-principle.md) — C4 로테이션 원리
- [ADR-069: 캡슐 아키텍처](./ADR-069-capsule-ecosystem-architecture.md) — CapsuleEngine\<T\>
- [OCP 패턴](../../.claude/rules/ocp-patterns.md) — Strategy/Registry 패턴

---

**Version**: 1.0 | **Created**: 2026-03-03
