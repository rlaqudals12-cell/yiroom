# ADR-069: 캡슐 에코시스템 아키텍처

## 상태

**제안** (2026-03-03)

## 컨텍스트

이룸은 현재 9개 분석 모듈(PC, S, C, W, N, H, M, OH, Fashion)이 독립적으로 작동하며,
분석 결과가 "알려주기(Knowing)"에 머물러 있다. 캡슐 에코시스템은 분석 결과를
일상 실천(Practicing → Habit → Transform)으로 연결하는 통합 시스템이다.

### 핵심 과제

1. **BeautyProfile 통합**: 9모듈 분석 결과를 하나의 프로필로 수렴
2. **CapsuleEngine\<T\>**: 도메인 불문 범용 캡슐 생성/관리 인터페이스
3. **기존 시스템 활용**: lib/inventory(16함수), lib/smart-matching(11모듈), 7개 DB 테이블
4. **크로스 모듈 시너지**: 모듈 간 데이터 흐름 및 호환성 점수 체계

### 기존 시스템 현황

| 시스템                           | 위치                | 활용 계획                   |
| -------------------------------- | ------------------- | --------------------------- |
| CapsuleEngine\<T\>               | lib/capsule/        | 범용 캡슐 인터페이스 (확장) |
| lib/inventory/ (16함수)          | lib/inventory/      | 캡슐 아이템 CRUD            |
| lib/smart-matching/ (12모듈)     | lib/smart-matching/ | 쇼핑 컴패니언 매칭          |
| user_product_shelf               | DB                  | 사용자 보유 제품            |
| ingredient_interactions          | DB                  | 성분 호환성                 |
| cosmetic_ingredients (100시드)   | DB                  | 성분 안전 검증              |
| wardrobe_items/outfits/wear_logs | DB                  | 캡슐 옷장 기반              |

## 결정

### 1. BeautyProfile 통합 데이터 구조

```typescript
// lib/capsule/types.ts
type ModuleCode = 'PC' | 'S' | 'C' | 'W' | 'N' | 'H' | 'M' | 'OH' | 'Fashion';

export interface BeautyProfile {
  userId: string;
  updatedAt: string;

  // 9모듈 분석 결과 (각 모듈 완료 시 자동 갱신)
  personalColor?: { season: string; subType: string; palette: string[] };
  skin?: { type: string; concerns: string[]; scores: Record<string, number> };
  body?: { shape: string; measurements: Record<string, number> };
  workout?: { fitnessLevel: string; goals: string[]; history: string[] };
  nutrition?: { deficiencies: string[]; dietType: string; allergies: string[] };
  hair?: { type: string; scalp: string; concerns: string[] };
  makeup?: { preferences: Record<string, string>; skillLevel: string };
  oral?: { conditions: string[]; goals: string[] };
  fashion?: { style: string; sizeProfile: Record<string, string>; wardrobe: string[] };

  // 메타데이터
  completedModules: ModuleCode[]; // 완료된 모듈 코드
  personalizationLevel: 1 | 2 | 3 | 4; // C3 개인화 레벨
  lastFullUpdate: string;
}
```

### 2. CapsuleEngine\<T\> 범용 인터페이스

```typescript
// lib/capsule/engine.ts
export interface CapsuleEngine<T> {
  // C1 큐레이션
  curate(profile: BeautyProfile, options?: CurateOptions): Promise<T[]>;
  getOptimalN(profile: BeautyProfile): number;

  // C2 호환성
  checkCompatibility(items: T[]): CompatibilityScore;
  getPairwiseScore(a: T, b: T): number;

  // C3 개인화
  personalize(items: T[], profile: BeautyProfile): T[];

  // C4 로테이션
  shouldRotate(capsule: Capsule<T>): boolean;
  rotate(capsule: Capsule<T>, profile: BeautyProfile): Promise<T[]>;

  // C5 미니멀리즘
  minimize(items: T[]): T[];
}
```

### 3. 아키텍처 계층

```
┌──────────────────────────────────────────────────────────────┐
│                    Presentation Layer                         │
│  app/(capsule)/ — 캡슐 UI, One-Button Daily, 대시보드       │
├──────────────────────────────────────────────────────────────┤
│                    Domain Layer                               │
│  lib/capsule/           — CapsuleEngine<T>, BeautyProfile   │
│  lib/capsule/domains/   — 모듈별 캡슐 구현체 (9개)          │
│  lib/capsule/scoring/   — 호환성/시너지 점수 계산            │
│  lib/capsule/rotation/  — 로테이션 엔진                      │
├──────────────────────────────────────────────────────────────┤
│                    Repository Layer                           │
│  lib/supabase/   — DB 접근                                   │
│  lib/inventory/  — 인벤토리 CRUD (기존 16함수)               │
│  lib/smart-matching/ — 매칭 알고리즘 (기존 11모듈)           │
├──────────────────────────────────────────────────────────────┤
│                    Data Layer (Supabase)                      │
│  beauty_profiles, capsules, capsule_items,                   │
│  wardrobe_items, ingredient_interactions, ...                │
└──────────────────────────────────────────────────────────────┘
```

### 4. 기존 사용자 데이터 마이그레이션

```
기존 분석 완료 사용자 → BeautyProfile 자동 변환:

1. personal_color_assessments → BeautyProfile.personalColor
2. skin_assessments → BeautyProfile.skin
3. body_assessments → BeautyProfile.body
4. (나머지 모듈 동일 패턴)

전략: 점진적 마이그레이션 (On-Read Migration)
- 사용자가 캡슐 기능에 처음 접근 시 기존 데이터를 BeautyProfile로 변환
- 변환 후 beauty_profiles 테이블에 저장
- 새 분석 완료 시 자동 갱신

필드 매핑:
  personalColor ← personal_color_assessments (최신 row)
  skin          ← skin_analyses (최신 row)
  body          ← body_analyses (최신 row)
  workout       ← workout_plans (최신 row)
  nutrition     ← nutrition_assessments (최신 row)
  hair          ← hair_analyses (최신 row)
  makeup        ← makeup_assessments (최신 row)
  oral          ← oral_health_assessments (최신 row)
  fashion       ← wardrobe_items + style_preferences
```

### 5. BeautyProfile 부분 완료 처리

```
BeautyProfile 완성도 3단계:

Partial (1-3 모듈 완료):
  → 해당 도메인만 캡슐 생성, 나머지 도메인은 Daily Capsule에서 제외
  → personalizationLevel = 1

Substantial (4-6 모듈 완료):
  → 미완료 도메인은 기본값 적용, Daily Capsule 생성 가능
  → personalizationLevel = 2-3

Complete (7-9 모듈 완료):
  → 모든 도메인 최적 캡슐 생성
  → personalizationLevel = 4
```

## 대안

| 대안                           | 장점        | 단점                    | 기각 이유          |
| ------------------------------ | ----------- | ----------------------- | ------------------ |
| 모듈별 독립 캡슐 (통합 없음)   | 구현 단순   | 크로스 모듈 시너지 불가 | 핵심 가치 훼손     |
| GraphQL 기반 통합              | 유연한 쿼리 | 추가 인프라 필요        | 현재 규모에 과도   |
| 실시간 분석 통합 (매번 재계산) | 항상 최신   | 성능 부담               | 캐싱 전략으로 해결 |

## 결과

### 장점

- 기존 시스템 14개 최대 활용 (신규 코드 최소화)
- P8(모듈 경계) 준수: lib/capsule/index.ts를 통한 barrel export
- 점진적 마이그레이션으로 기존 사용자 영향 최소화
- CapsuleEngine\<T\>로 새 도메인 추가 용이 (OCP)

### 단점

- BeautyProfile 크기가 커질 수 있음 (JSONB 최적화 필요)
- 9모듈 전체 완료 전까지 개인화 정밀도 제한

## 관련 문서

- [P-1: capsule-principle.md](../principles/capsule-principle.md) — C1~C5 원리
- [R-1: CAPSULE-ECOSYSTEM-R1](../research/claude-ai-research/CAPSULE-ECOSYSTEM-R1-캡슐에코시스템.md) — 리서치
- [ADR-050: fashion-closet-crossmodule](./ADR-050-fashion-closet-crossmodule.md) — 패션 크로스모듈
- [ADR-066: ssot-consolidation](./ADR-066-ssot-consolidation-strategy.md) — SSOT 통합
- [SDD-CROSS-MODULE-PROTOCOL](../specs/SDD-CROSS-MODULE-PROTOCOL.md) — 크로스 모듈 프로토콜

---

**Version**: 1.0 | **Created**: 2026-03-03
