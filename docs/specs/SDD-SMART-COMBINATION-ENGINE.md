# SDD: Smart Combination Engine

> **Version**: 1.3
> **Created**: 2026-01-22
> **Updated**: 2026-01-28
> **Status**: Draft
> **Author**: Claude Code

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"사용자가 '나를 완전히 이해하는 AI'로 느끼는 상태"
- 모든 추천이 "왜 이게 나한테 딱인지" 납득됨
- 원치 않는 추천이 0개
- 필요하기 전에 미리 알려줌
- 시간이 지날수록 더 정확해짐

### 물리적 한계

| 한계 | 이유 | 완화 전략 |
|------|------|----------|
| 콜드 스타트 | 신규 사용자 데이터 부족 | 온보딩 질문, 인기 기반 추천 |
| 도메인 간 충돌 | 상충되는 추천 가능 | 우선순위 기반 충돌 해결 |
| 설명 생성 | LLM 없이 자연스러운 설명 어려움 | 템플릿 기반 설명 (V1) |

### 100점 기준

| 지표 | 100점 기준 | V1 목표 |
|------|-----------|--------|
| 추천 관련성 | 100% "매우 적합" | 70% |
| 설명 신뢰도 | 100% "납득됨" | 80% |
| 충돌 해결 | 100% 안전 우선 | 100% |
| 응답 시간 | < 100ms | < 500ms |

### 현재 목표: 70%

**종합 달성률**: **70%** (V1 규칙 기반 엔진)

| 기능 | 달성률 | 상태 |
|------|--------|------|
| 3-3-3 규칙 필터링 | 80% | Draft |
| N×M 시너지 매트릭스 | 70% | Draft |
| 충돌 해결 | 90% | Draft |
| 템플릿 설명 | 60% | Draft |
| 피드백 수집 UI | 50% | V2 준비 |

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 학습 기반 가중치 (V2) | 사용자 피드백 데이터 필요 | 데이터 축적 후 |
| LLM 자연어 설명 (V3) | 비용/지연 시간 | GPT-4o-mini 가격 하락 시 |
| 선제적 추천 (V3) | 행동 예측 모델 필요 | V2 완료 후 |

---

## 1. 개요

### 1.1 목적

7개 도메인(PC, S, C, W, N, P, O)의 분석 결과를 통합하여 개인화된 추천을 제공하는 엔진.

### 1.2 범위

- **V1**: 3-3-3 규칙 기반 엔진 (이번 스펙)
- **V2**: 학습 기반 엔진 (향후) - Semi-personalized Bandits 권장
- **V3**: AI 컨시어지 (향후) - Foundation Model 접근 고려

### 1.3 관련 문서

| 문서 | 역할 |
|------|------|
| [원리: personalization-engine.md](../principles/personalization-engine.md) v2.0 | 핵심 알고리즘, XAI 실증 데이터 |
| [원리: cross-domain-synergy.md](../principles/cross-domain-synergy.md) | N×M 시너지 |
| [ADR-036](../adr/ADR-036-smart-combination-engine.md) v1.1 | 아키텍처 결정, 산업 사례 |
| [리서치](../research/claude-ai-research/RECOMMENDATION-ENGINE-RESEARCH.md) v2.0 | 웹 검색 기반 검증 완료 |

### 1.4 설계 근거 (산업 데이터)

> **XAI 효과성 (2025)**: 설명 제공 시 사용자 신뢰도 M=4.1 vs 미제공 M=3.2 (p<.001)
> — [SSRN 2025](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5789189)

> **Deezer 사례**: Semi-personalized Bandits (100개 클러스터) > 전체 개인화
> — [Eugene Yan](https://eugeneyan.com/writing/bandits/)

---

## 2. 입력/출력 정의

### 3.1 입력

```typescript
interface CombinationEngineInput {
  // 필수: 사용자 프로필
  profile: UserProfile;

  // 필수: 추천 대상 아이템
  items: Item[];

  // 선택: 필터 조건
  filters?: {
    categories?: ItemCategory[];
    priceRange?: { min: number; max: number };
    domains?: Domain[];
  };

  // 선택: 추천 개수 (기본: 3)
  limit?: number;
}

interface UserProfile {
  userId: string;

  // 도메인별 분석 결과
  personalColor?: {
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    subType: 'light' | 'true' | 'dark' | 'bright' | 'muted';
  };

  skin?: {
    type: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
    concerns: string[];
  };

  body?: {
    type: 'S' | 'W' | 'N';
    measurements?: BodyMeasurements;
  };

  posture?: {
    issues: string[];
    severity: 'mild' | 'moderate' | 'severe';
  };

  nutrition?: {
    goals: string[];
    deficiencies: string[];
    restrictions: string[];
  };

  // 선호 설정
  preferences?: {
    priceRange?: 'budget' | 'mid' | 'premium';
    brands?: string[];
    excludeBrands?: string[];
  };
}

interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  brand: string;
  price: number;

  // 매칭 속성
  suitableSkinTypes?: string[];
  targetConcerns?: string[];
  suitableSeasons?: string[];
  ingredients?: string[];

  // 인기도
  rating?: number;
  reviewCount?: number;
  popularity?: 'low' | 'medium' | 'high';
}

type ItemCategory = 'skincare' | 'makeup' | 'supplement' | 'equipment' | 'healthFood';
type Domain = 'PC' | 'S' | 'C' | 'W' | 'N' | 'P' | 'O';
```

### 3.2 출력

```typescript
interface CombinationEngineOutput {
  // 최종 추천 (최대 3개)
  recommendations: Recommendation[];

  // 사용된 시너지 조합
  usedSynergies: SynergyInfo[];

  // 메타데이터
  meta: {
    version: 'v1' | 'v2' | 'v3';
    processingTime: number;
    totalCandidates: number;
    filteredCandidates: number;
  };
}

interface Recommendation {
  item: Item;
  score: number;              // 0-100
  rank: number;               // 1, 2, 3

  // 설명
  explanation: {
    primary: string;          // 주요 이유
    supporting: string[];     // 부가 이유
    synergies: string[];      // 관련 시너지
  };

  // 매칭 상세
  matchDetails: {
    domainScore: number;      // 0-50
    synergyBonus: number;     // 0-30
    popularityScore: number;  // 0-20
  };
}

interface SynergyInfo {
  domains: [Domain, Domain];
  score: number;              // 0-100
  description: string;
}
```

---

## 4. 핵심 알고리즘

### 4.1 3-3-3 Rule

```
7.8억 조합
    │
    ▼ (1단계: Top 3 시너지 선택)
3 시너지 조합
    │
    ▼ (2단계: 각 시너지별 Top 3 추천)
9 후보
    │
    ▼ (3단계: 충돌 해결 + 중복 제거)
3 최종 추천
```

### 4.2 시너지 매트릭스

```typescript
const SYNERGY_MATRIX: Record<Domain, Record<Domain, number>> = {
  PC: { PC: 0, S: 90, C: 70, W: 40, N: 60, P: 85, O: 50 },
  S:  { PC: 90, S: 0, C: 50, W: 30, N: 95, P: 98, O: 40 },
  C:  { PC: 70, S: 50, C: 0, W: 95, N: 70, P: 60, O: 30 },
  W:  { PC: 40, S: 30, C: 95, W: 0, N: 60, P: 50, O: 20 },
  N:  { PC: 60, S: 95, C: 70, W: 60, N: 0, P: 80, O: 75 },
  P:  { PC: 85, S: 98, C: 60, W: 50, N: 80, P: 0, O: 60 },
  O:  { PC: 50, S: 40, C: 30, W: 20, N: 75, P: 60, O: 0 },
};
```

### 4.3 충돌 해결 우선순위

```typescript
const PRIORITY_HIERARCHY = {
  health_safety: 100,      // 건강/안전 (절대 우선)
  medical_warning: 90,     // 의료 경고
  domain_expertise: 80,    // 도메인 전문성
  user_preference: 70,     // 사용자 선호
  general: 50,             // 일반
};

// 성분 충돌 정의
const INGREDIENT_CONFLICTS: [string, string, string][] = [
  ['retinol', 'aha', '동시 사용 시 자극 위험'],
  ['retinol', 'bha', '동시 사용 시 자극 위험'],
  ['retinol', 'vitamin_c', '효과 감소 가능'],
  ['aha', 'bha', '과도한 각질 제거 위험'],
  ['niacinamide', 'vitamin_c', '일부 제형에서 홍조 가능'],
];
```

---

## 5. 아키텍처

### 5.1 모듈 구조

```
lib/recommendation/
├── index.ts                    # 공개 API
├── types.ts                    # 타입 정의
├── v1/
│   ├── engine.ts               # 메인 엔진
│   ├── synergy-selector.ts     # 시너지 선택
│   ├── score-calculator.ts     # 점수 계산
│   ├── conflict-resolver.ts    # 충돌 해결
│   └── explainer.ts            # 설명 생성
└── internal/
    ├── synergy-matrix.ts       # 시너지 매트릭스
    ├── priority-hierarchy.ts   # 우선순위 계층
    └── templates.ts            # 설명 템플릿
```

### 5.2 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                    V1 Engine 데이터 흐름                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  UserProfile + Items                                             │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                            │
│  │ Synergy Selector │  ← SYNERGY_MATRIX                         │
│  │ (Top 3 시너지)   │                                           │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Score Calculator │  ← Domain + Synergy + Popularity          │
│  │ (후보 점수 계산) │                                           │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Conflict Resolver│  ← PRIORITY_HIERARCHY, INGREDIENT_CONFLICTS│
│  │ (충돌 해결)      │                                           │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Explainer       │  ← EXPLANATION_TEMPLATES                   │
│  │ (설명 생성)      │                                           │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  Recommendations (최대 3개)                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. ATOM 분해 (P3)

> **P3 원칙**: 모든 ATOM ≤ 1시간

### 6.1 ATOM 목록

| ID | 이름 | 시간 | 의존성 |
|----|------|------|--------|
| SCE-1 | 타입 정의 | 1h | - |
| SCE-2 | 시너지 매트릭스 | 1h | SCE-1 |
| SCE-3-1 | 도메인 점수 계산 | 1h | SCE-1 |
| SCE-3-2 | 시너지 보너스 계산 | 1h | SCE-2 |
| SCE-3-3 | 인기도 점수 계산 | 1h | SCE-1 |
| SCE-4-1 | 성분 충돌 감지 | 1h | SCE-1 |
| SCE-4-2 | 우선순위 충돌 해결 | 1h | SCE-4-1 |
| SCE-5 | 템플릿 설명 생성 | 1h | SCE-1 |
| SCE-6 | 시너지 선택기 | 1h | SCE-2 |
| SCE-7 | 메인 엔진 통합 | 1h | SCE-3~6 |
| SCE-8 | 피드백 수집 UI | 1h | SCE-7 |
| SCE-9 | API 라우트 | 1h | SCE-7 |
| SCE-10 | 통합 테스트 | 1h | SCE-9 |
| **SCE-11** | **Cold Start 핸들러** | 1h | SCE-7 |
| **SCE-12** | **에러 복구 로직** | 1h | SCE-7 |

**총 ATOM**: 15개
**총 예상 시간**: 15시간 (순차) / 8시간 (병렬)

### 6.2 ATOM 상세

---

#### SCE-1: 타입 정의

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | 없음 |
| **병렬 가능** | Yes |

**입력**:
- 기존 `types/` 참조

**출력**:
- `lib/recommendation/types.ts`
  - `UserProfile`, `Item`, `Recommendation` 타입
  - `CombinationEngineInput`, `CombinationEngineOutput` 타입
  - `Domain`, `ItemCategory`, `FeedbackAction` 타입

**성공 기준**:
- [ ] 모든 타입 JSDoc 주석 포함
- [ ] Zod 스키마 동반 (입력 검증용)
- [ ] 테스트 커버리지 90%+

---

#### SCE-2: 시너지 매트릭스

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-1 |
| **병렬 가능** | No |

**입력**:
- `Domain` 타입

**출력**:
- `lib/recommendation/internal/synergy-matrix.ts`
  - `SYNERGY_MATRIX` 상수
  - `getSynergyScore(domain1, domain2): number`
  - `getTopSynergies(domains, limit): SynergyPair[]`

**성공 기준**:
- [ ] 7×7 매트릭스 완성 (대각선 0)
- [ ] 대칭 검증 (SYNERGY_MATRIX[A][B] === SYNERGY_MATRIX[B][A])
- [ ] Top N 시너지 정확히 반환
- [ ] 테스트 커버리지 90%+

---

#### SCE-3-1: 도메인 점수 계산

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-1 |
| **병렬 가능** | Yes |

**입력**:

```typescript
interface DomainScoreInput {
  item: Item;
  profile: UserProfile;
  category?: ItemCategory;  // 없으면 item.category 사용
}

interface SkinMatchInput {
  itemSkinTypes: string[];
  profileSkinType: string;
  itemConcerns: string[];
  profileConcerns: string[];
}

interface ColorMatchInput {
  itemSeasons: string[];
  profileSeason: string;
  profileSubType: string;
}
```

**출력**:

```typescript
// lib/recommendation/v1/score-calculator.ts
interface DomainScoreOutput {
  total: number;          // 0-50
  breakdown: {
    skinMatch: number;    // 0-30
    concernMatch: number; // 0-30
    colorMatch: number;   // 0-20 (메이크업만)
  };
}

// 함수 시그니처
function calculateDomainScore(input: DomainScoreInput): DomainScoreOutput;
function calculateSkincareScore(item: Item, profile: UserProfile): number;
function calculateMakeupScore(item: Item, profile: UserProfile): number;
function calculateSupplementScore(item: Item, profile: UserProfile): number;
function calculateSkinMatch(input: SkinMatchInput): number;
function calculateColorMatch(input: ColorMatchInput): number;
```

**성공 기준**:
- [ ] 카테고리별 점수 계산 로직
- [ ] 피부 타입 매치 (0-30점)
- [ ] 피부 고민 매치 (0-30점)
- [ ] 퍼스널컬러 매치 (0-20점, 메이크업만)
- [ ] 테스트 커버리지 90%+

---

#### SCE-3-2: 시너지 보너스 계산

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-2 |
| **병렬 가능** | No |

**입력**:
- `Item`, `Synergy[]`

**출력**:
- `lib/recommendation/v1/score-calculator.ts`
  - `calculateSynergyBonus(item, synergies): number` (0-30)

**성공 기준**:
- [ ] 시너지 점수 × 0.3 보너스
- [ ] 최대 30점 캡
- [ ] 복수 시너지 중복 적용 안 함
- [ ] 테스트 커버리지 90%+

---

#### SCE-3-3: 인기도 점수 계산

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-1 |
| **병렬 가능** | Yes |

**입력**:
- `Item`

**출력**:
- `lib/recommendation/v1/score-calculator.ts`
  - `calculatePopularityScore(item): number` (0-20)

**성공 기준**:
- [ ] 가격 접근성 (0-8점)
- [ ] 리뷰 수 (0-6점)
- [ ] 평점 (0-6점)
- [ ] 최대 20점 캡
- [ ] 테스트 커버리지 90%+

---

#### SCE-4-1: 성분 충돌 감지

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-1 |
| **병렬 가능** | Yes |

**입력**:

```typescript
interface ConflictDetectionInput {
  recommendations: Recommendation[];
  strictMode?: boolean;  // true면 경고도 충돌로 처리
}

interface IngredientConflictRule {
  ingredient1: string;
  ingredient2: string;
  severity: 'high' | 'medium' | 'low';  // high: 금지, medium: 경고, low: 정보
  reason: string;
  recommendation: string;  // 해결 방안
}
```

**출력**:

```typescript
// lib/recommendation/v1/conflict-resolver.ts
interface ConflictGroup {
  conflictId: string;
  items: [string, string];  // [itemId1, itemId2]
  ingredients: [string, string];
  severity: 'high' | 'medium' | 'low';
  reason: string;
  recommendation: string;
}

interface ConflictDetectionOutput {
  hasConflicts: boolean;
  conflicts: ConflictGroup[];
  highSeverityCount: number;
  affectedItemIds: string[];
}

// 상수 및 함수 시그니처
const INGREDIENT_CONFLICTS: IngredientConflictRule[];
function detectIngredientConflicts(input: ConflictDetectionInput): ConflictDetectionOutput;
function hasIngredientConflict(item1: Item, item2: Item): boolean;
function getConflictReason(ing1: string, ing2: string): string | null;
```

**성공 기준**:
- [ ] 레티놀+AHA, 레티놀+BHA 등 감지
- [ ] 충돌 그룹 반환
- [ ] 충돌 사유 포함
- [ ] severity 레벨 구분
- [ ] 테스트 커버리지 90%+

---

#### SCE-4-2: 우선순위 충돌 해결

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-4-1 |
| **병렬 가능** | No |

**입력**:

```typescript
interface ConflictResolutionInput {
  recommendations: Recommendation[];
  conflicts: ConflictGroup[];
  priorityOverrides?: Partial<PriorityHierarchy>;  // 커스텀 우선순위
}

interface PriorityHierarchy {
  health_safety: number;     // 기본 100
  medical_warning: number;   // 기본 90
  domain_expertise: number;  // 기본 80
  user_preference: number;   // 기본 70
  general: number;           // 기본 50
}
```

**출력**:

```typescript
// lib/recommendation/v1/conflict-resolver.ts
interface ConflictResolutionOutput {
  resolved: Recommendation[];
  removedItems: Array<{
    itemId: string;
    reason: string;
    conflictedWith: string;
  }>;
  resolutionLog: ResolutionLogEntry[];
}

interface ResolutionLogEntry {
  timestamp: number;
  conflictId: string;
  winner: string;
  loser: string;
  reason: string;
  priority: keyof PriorityHierarchy;
}

// 상수 및 함수 시그니처
const PRIORITY_HIERARCHY: PriorityHierarchy;
function resolveConflicts(input: ConflictResolutionInput): ConflictResolutionOutput;
function getPriority(item: Item): keyof PriorityHierarchy;
function selectWinner(item1: Item, item2: Item, conflict: ConflictGroup): Item;
```

**성공 기준**:
- [ ] 건강/안전 항상 최우선
- [ ] 충돌 그룹에서 1개만 선택
- [ ] 해결 로그 기록 (감사 추적용)
- [ ] 제거된 아이템 사유 반환
- [ ] 테스트 커버리지 90%+

---

#### SCE-5: 템플릿 설명 생성

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-1 |
| **병렬 가능** | Yes |

**입력**:

```typescript
interface ExplanationInput {
  recommendation: Recommendation;
  profile: UserProfile;
  synergies: SynergyInfo[];
  locale?: 'ko' | 'en';  // 기본 'ko'
}

interface ExplanationTemplate {
  id: string;
  category: 'skin' | 'color' | 'synergy' | 'general';
  pattern: string;  // 예: "{skinType} 피부에 적합한 {ingredient} 성분"
  variables: string[];
  priority: number;
}
```

**출력**:

```typescript
// lib/recommendation/v1/explainer.ts
interface Explanation {
  primary: string;           // 주요 추천 이유 (1개)
  supporting: string[];      // 부가 이유 (0-3개)
  synergies: string[];       // 시너지 설명 (0-2개)
  confidence: 'high' | 'medium' | 'low';  // XAI 신뢰도
}

interface ExplanationOutput {
  explanation: Explanation;
  usedTemplates: string[];   // 사용된 템플릿 ID
  variables: Record<string, string>;  // 치환된 변수
}

// 상수 및 함수 시그니처
const EXPLANATION_TEMPLATES: ExplanationTemplate[];
function generateExplanation(input: ExplanationInput): ExplanationOutput;
function selectTemplate(category: ItemCategory, profile: UserProfile): ExplanationTemplate;
function fillTemplate(template: ExplanationTemplate, vars: Record<string, string>): string;
function getSynergyExplanation(synergy: SynergyInfo): string;
```

**성공 기준**:
- [ ] 피부 타입 템플릿 (5개 이상)
- [ ] 시너지 템플릿 (7×7 매트릭스)
- [ ] 퍼스널컬러 템플릿 (4계절×서브타입)
- [ ] 주요 이유 + 부가 이유 구조
- [ ] 변수 치환 로직
- [ ] 테스트 커버리지 90%+

---

#### SCE-6: 시너지 선택기

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-2 |
| **병렬 가능** | No |

**입력**:

```typescript
interface SynergySelectionInput {
  profile: UserProfile;
  limit?: number;  // 기본 3
  minScore?: number;  // 최소 시너지 점수 (기본 50)
  excludeDomains?: Domain[];  // 제외할 도메인
}

interface DomainStatus {
  domain: Domain;
  active: boolean;
  completeness: number;  // 0-100, 분석 완료도
  lastUpdated?: string;
}
```

**출력**:

```typescript
// lib/recommendation/v1/synergy-selector.ts
interface SynergyPair {
  domains: [Domain, Domain];
  score: number;  // 0-100, SYNERGY_MATRIX 값
  description: string;
}

interface SynergySelectionOutput {
  synergies: SynergyPair[];
  activeDomains: Domain[];
  domainStatuses: DomainStatus[];
  totalPossibleSynergies: number;  // 활성 도메인 간 가능한 조합 수
}

// 함수 시그니처
function selectTopSynergies(input: SynergySelectionInput): SynergySelectionOutput;
function getUserActiveDomains(profile: UserProfile): Domain[];
function getDomainStatus(profile: UserProfile, domain: Domain): DomainStatus;
function getAllPossibleSynergies(domains: Domain[]): SynergyPair[];
function sortByScore(synergies: SynergyPair[]): SynergyPair[];
```

**성공 기준**:
- [ ] 프로필에서 활성 도메인 추출
- [ ] 도메인 완료도 계산 (분석 필드 채워짐 비율)
- [ ] 활성 도메인 간 Top N 시너지 선택
- [ ] 시너지 점수 내림차순
- [ ] 최소 점수 필터링
- [ ] 테스트 커버리지 90%+

---

#### SCE-7: 메인 엔진 통합

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-3~6 |
| **병렬 가능** | No |

**입력**:
- `CombinationEngineInput`

**출력**:
- `lib/recommendation/v1/engine.ts`
  - `recommend(input): CombinationEngineOutput`

**성공 기준**:
- [ ] 3-3-3 파이프라인 구현
- [ ] 모든 모듈 통합
- [ ] 에러 핸들링
- [ ] 처리 시간 < 500ms
- [ ] 테스트 커버리지 90%+

---

#### SCE-8: 피드백 수집 UI

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-7 |
| **병렬 가능** | No |

**입력**:
- `Recommendation`

**출력**:
- `components/recommendation/FeedbackButtons.tsx`
  - 👍/👎 버튼
  - 피드백 API 호출

**성공 기준**:
- [ ] 좋아요/싫어요 버튼
- [ ] API 호출 (optimistic update)
- [ ] 애니메이션 피드백
- [ ] data-testid 속성
- [ ] 테스트 커버리지 90%+

---

#### SCE-9: API 라우트

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-7 |
| **병렬 가능** | No |

**입력**:
- HTTP 요청

**출력**:
- `app/api/recommendations/route.ts`
  - `GET /api/recommendations`
- `app/api/recommendations/feedback/route.ts`
  - `POST /api/recommendations/feedback`

**성공 기준**:
- [ ] Zod 입력 검증
- [ ] 인증 필수 (auth.protect())
- [ ] Rate Limiting
- [ ] 에러 응답 표준화
- [ ] 테스트 커버리지 90%+

---

#### SCE-10: 통합 테스트

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-9 |
| **병렬 가능** | No |

**입력**:
- 테스트 시나리오

**출력**:
- `tests/lib/recommendation/engine.test.ts`
- `tests/api/recommendations.test.ts`

**성공 기준**:
- [ ] E2E 시나리오 3개 이상
- [ ] 충돌 해결 테스트
- [ ] 에러 케이스 테스트
- [ ] 테스트 커버리지 90%+

---

#### SCE-11: Cold Start 핸들러

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-7 |
| **병렬 가능** | Yes (G5에서 SCE-8, SCE-9와 병렬) |

**입력**:

```typescript
interface ColdStartInput {
  user: User;
  items: Item[];
  limit: number;
}

interface User {
  userId: string;
  analysisCount: number;
  feedbackCount: number;
  onboardingAnswers?: OnboardingAnswers;
  preferredCategory?: ItemCategory;
}
```

**출력**:

```typescript
// lib/recommendation/v1/cold-start.ts
interface ColdStartOutput {
  recommendations: Recommendation[];
  strategy: 'onboarding' | 'popularity' | 'hybrid';
  meta: {
    isColdStart: true;
    reason: 'new_user' | 'insufficient_data';
  };
}

// 함수 시그니처
function isNewUser(user: User): boolean;
function getColdStartRecommendations(input: ColdStartInput): ColdStartOutput;
function getOnboardingBasedRecommendations(answers: OnboardingAnswers): Recommendation[];
function getPopularRecommendations(options: { category?: ItemCategory; limit: number }): Recommendation[];
```

**성공 기준**:
- [ ] 신규 사용자 판별 (analysisCount < 2 && feedbackCount < 5)
- [ ] 온보딩 기반 추천 (피부타입, 관심사 활용)
- [ ] 인기 제품 Fallback
- [ ] Warm ↔ Cold 자동 전환
- [ ] 테스트 커버리지 90%+

---

#### SCE-12: 에러 복구 로직

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | SCE-7 |
| **병렬 가능** | Yes (G5에서 SCE-8, SCE-9, SCE-11과 병렬) |

**입력**:

```typescript
interface ErrorContext {
  error: Error;
  stage: 'synergy' | 'score' | 'conflict' | 'explain' | 'api';
  input: CombinationEngineInput;
  partialResult?: Partial<CombinationEngineOutput>;
}
```

**출력**:

```typescript
// lib/recommendation/v1/error-handler.ts
interface ErrorRecoveryResult {
  recovered: boolean;
  output: CombinationEngineOutput;
  fallbackUsed: boolean;
  errorLog: {
    stage: string;
    message: string;
    recoveryStrategy: 'retry' | 'fallback' | 'partial' | 'empty';
  };
}

// 함수 시그니처
function handleEngineError(context: ErrorContext): Promise<ErrorRecoveryResult>;
function getEmptyResult(input: CombinationEngineInput): CombinationEngineOutput;
function getPartialResult(partial: Partial<CombinationEngineOutput>): CombinationEngineOutput;
function logError(context: ErrorContext): void;
```

**성공 기준**:
- [ ] 단계별 에러 감지 (시너지, 점수, 충돌, 설명)
- [ ] 3단계 복구: 재시도 → 부분 결과 → 빈 결과
- [ ] 에러 로깅 (단계, 메시지, 복구 전략)
- [ ] API 타임아웃 처리 (5초 기본)
- [ ] usedFallback 플래그 설정
- [ ] 테스트 커버리지 90%+

---

### 6.3 의존성 그래프

```
┌─────────────────────────────────────────────────────────────────┐
│                   SCE ATOM 의존성 그래프 (v1.2)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  G1: 병렬 실행 가능                          ││
│  │  SCE-1          SCE-3-1        SCE-3-3        SCE-5         ││
│  │  (타입)         (도메인점수)    (인기도점수)    (설명생성)    ││
│  └─────────────────────────────────────────────────────────────┘│
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  G2: SCE-1 의존                              ││
│  │  SCE-2          SCE-4-1                                      ││
│  │  (시너지매트릭스) (성분충돌감지)                               ││
│  └─────────────────────────────────────────────────────────────┘│
│      │                 │                                         │
│      ▼                 ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  G3: G2 의존                                 ││
│  │  SCE-3-2        SCE-4-2        SCE-6                         ││
│  │  (시너지보너스)  (우선순위해결)  (시너지선택)                  ││
│  └─────────────────────────────────────────────────────────────┘│
│      │                 │              │                          │
│      └─────────────────┴──────────────┘                          │
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  G4: 통합                                    ││
│  │                  SCE-7 (메인 엔진)                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  G5: 병렬 가능 (4개 ATOM)                    ││
│  │  SCE-8          SCE-9          SCE-11         SCE-12        ││
│  │  (피드백 UI)    (API 라우트)   (Cold Start)   (에러 복구)    ││
│  └─────────────────────────────────────────────────────────────┘│
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  G6: 검증                                    ││
│  │                  SCE-10 (통합 테스트)                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

실행 흐름:
G1 (4h 병렬) → G2 (2h 병렬) → G3 (3h 병렬) → G4 (1h) → G5 (4h 병렬) → G6 (1h)

총 예상 시간: 15h (순차) / 8h (병렬)
병렬 효율: 47% 절약
```

---

## 7. 테스트 케이스

### 7.1 단위 테스트

```typescript
// tests/lib/recommendation/score-calculator.test.ts
describe('calculateDomainScore', () => {
  it('should return 30 for exact skin type match', () => {
    const item = createItem({ suitableSkinTypes: ['dry'] });
    const profile = createProfile({ skin: { type: 'dry', concerns: [] } });

    const score = calculateDomainScore(item, profile);

    expect(score).toBeGreaterThanOrEqual(30);
  });

  it('should add concern match bonus', () => {
    const item = createItem({ targetConcerns: ['acne', 'wrinkles'] });
    const profile = createProfile({
      skin: { type: 'oily', concerns: ['acne'] },
    });

    const score = calculateDomainScore(item, profile);

    expect(score).toBeGreaterThan(30);
  });
});
```

### 7.2 충돌 해결 테스트

```typescript
// tests/lib/recommendation/conflict-resolver.test.ts
describe('resolveConflicts', () => {
  it('should prioritize health_safety over user_preference', () => {
    const recs = [
      createRec({ priority: 'health_safety', item: itemA }),
      createRec({ priority: 'user_preference', item: itemB, conflictsWith: [itemA.id] }),
    ];

    const resolved = resolveConflicts(recs);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].item.id).toBe(itemA.id);
  });

  it('should detect retinol + AHA conflict', () => {
    const recs = [
      createRec({ ingredients: ['retinol'] }),
      createRec({ ingredients: ['aha'] }),
    ];

    const conflicts = detectIngredientConflicts(recs);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].reason).toContain('자극');
  });
});
```

### 7.3 통합 테스트

```typescript
// tests/lib/recommendation/engine.test.ts
describe('recommend (3-3-3)', () => {
  it('should return exactly 3 recommendations', async () => {
    const input = createEngineInput({ limit: 3 });

    const result = await recommend(input);

    expect(result.recommendations).toHaveLength(3);
  });

  it('should use high-synergy combinations', async () => {
    const profile = createProfile({
      skin: { type: 'dry', concerns: ['dehydration'] },
      nutrition: { goals: ['skin_health'] },
    });
    const input = createEngineInput({ profile });

    const result = await recommend(input);

    // S×N (95) 시너지 사용 확인
    const hasSkinNutritionSynergy = result.usedSynergies.some(
      s => s.domains.includes('S') && s.domains.includes('N')
    );
    expect(hasSkinNutritionSynergy).toBe(true);
  });

  it('should resolve all conflicts', async () => {
    const input = createEngineInput({
      items: [
        createItem({ ingredients: ['retinol'] }),
        createItem({ ingredients: ['aha'] }),
        createItem({ ingredients: ['niacinamide'] }),
      ],
    });

    const result = await recommend(input);

    // 충돌하는 레티놀+AHA가 동시에 추천되지 않음
    const hasConflict = result.recommendations.some(
      (r, i, arr) => arr.some(
        (other, j) => i !== j && hasIngredientConflict(r.item, other.item)
      )
    );
    expect(hasConflict).toBe(false);
  });
});
```

### 7.4 Edge Case 테스트

```typescript
// tests/lib/recommendation/edge-cases.test.ts
describe('Edge Cases', () => {
  it('should handle empty items array', async () => {
    const input = createEngineInput({ items: [] });

    const result = await recommend(input);

    expect(result.recommendations).toHaveLength(0);
    expect(result.meta.totalCandidates).toBe(0);
  });

  it('should handle profile with no domains (Cold Start)', async () => {
    const profile = createProfile({ userId: 'new_user' });  // 모든 도메인 undefined
    const input = createEngineInput({ profile });

    const result = await recommend(input);

    // Cold Start 경로로 처리 확인
    expect(result.meta.usedColdStart).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should handle all items having conflicts', async () => {
    const items = [
      createItem({ id: 'a', ingredients: ['retinol'] }),
      createItem({ id: 'b', ingredients: ['aha'] }),
      createItem({ id: 'c', ingredients: ['bha'] }),
    ];
    const input = createEngineInput({ items });

    const result = await recommend(input);

    // 최소 1개는 반환해야 함 (가장 안전한 것)
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle items fewer than limit', async () => {
    const items = [createItem({ id: 'only_one' })];
    const input = createEngineInput({ items, limit: 3 });

    const result = await recommend(input);

    expect(result.recommendations).toHaveLength(1);
  });

  it('should handle API timeout gracefully', async () => {
    vi.useFakeTimers();

    const slowInput = createEngineInput({ simulateDelay: 10000 });
    const promise = recommend(slowInput);

    vi.advanceTimersByTime(5000);

    await expect(promise).resolves.toMatchObject({
      success: true,
      meta: { usedFallback: true },
    });

    vi.useRealTimers();
  });
});
```

---

## 7.5 Mock 데이터 정의

> 테스트 및 개발용 팩토리 함수

### 7.5.1 팩토리 함수

```typescript
// tests/factories/recommendation.ts

/**
 * Mock UserProfile 생성
 */
export function createProfile(
  overrides: Partial<UserProfile> = {}
): UserProfile {
  return {
    userId: 'test_user_001',
    personalColor: {
      season: 'spring',
      subType: 'light',
    },
    skin: {
      type: 'combination',
      concerns: ['acne', 'dehydration'],
    },
    body: {
      type: 'S',
    },
    nutrition: {
      goals: ['skin_health'],
      deficiencies: [],
      restrictions: [],
    },
    preferences: {
      priceRange: 'mid',
    },
    ...overrides,
  };
}

/**
 * Mock Item 생성
 */
export function createItem(overrides: Partial<Item> = {}): Item {
  const id = overrides.id ?? `item_${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    name: `Test Product ${id}`,
    category: 'skincare',
    brand: 'Test Brand',
    price: 35000,
    suitableSkinTypes: ['combination', 'oily'],
    targetConcerns: ['acne'],
    suitableSeasons: ['spring', 'summer'],
    ingredients: ['niacinamide', 'salicylic_acid'],
    rating: 4.5,
    reviewCount: 120,
    popularity: 'high',
    ...overrides,
  };
}

/**
 * Mock Recommendation 생성
 */
export function createRec(
  overrides: Partial<Recommendation> = {}
): Recommendation {
  const item = overrides.item ?? createItem();
  return {
    item,
    score: 85,
    rank: 1,
    explanation: {
      primary: '테스트 추천 이유',
      supporting: ['부가 이유 1', '부가 이유 2'],
      synergies: ['S×N'],
    },
    matchDetails: {
      domainScore: 45,
      synergyBonus: 25,
      popularityScore: 15,
    },
    ...overrides,
  };
}

/**
 * Mock CombinationEngineInput 생성
 */
export function createEngineInput(
  overrides: Partial<CombinationEngineInput & { simulateDelay?: number }> = {}
): CombinationEngineInput {
  return {
    profile: overrides.profile ?? createProfile(),
    items: overrides.items ?? MOCK_ITEMS,
    limit: overrides.limit ?? 3,
    filters: overrides.filters,
  };
}
```

### 7.5.2 Mock 데이터 세트

```typescript
// tests/fixtures/mock-items.ts

/**
 * 테스트용 아이템 세트 (최소 10개)
 */
export const MOCK_ITEMS: Item[] = [
  // 스킨케어 - 건성
  {
    id: 'item_001',
    name: '하이드라 부스트 세럼',
    category: 'skincare',
    brand: 'HydraLab',
    price: 42000,
    suitableSkinTypes: ['dry', 'normal'],
    targetConcerns: ['dehydration', 'dullness'],
    suitableSeasons: ['autumn', 'winter'],
    ingredients: ['hyaluronic_acid', 'ceramide'],
    rating: 4.7,
    reviewCount: 350,
    popularity: 'high',
  },
  // 스킨케어 - 지성
  {
    id: 'item_002',
    name: '포어 컨트롤 토너',
    category: 'skincare',
    brand: 'ClearSkin',
    price: 28000,
    suitableSkinTypes: ['oily', 'combination'],
    targetConcerns: ['acne', 'pores'],
    suitableSeasons: ['spring', 'summer'],
    ingredients: ['salicylic_acid', 'tea_tree'],
    rating: 4.3,
    reviewCount: 180,
    popularity: 'medium',
  },
  // 스킨케어 - 레티놀 (충돌 테스트용)
  {
    id: 'item_003',
    name: '나이트 리페어 크림',
    category: 'skincare',
    brand: 'AgeLess',
    price: 65000,
    suitableSkinTypes: ['normal', 'dry'],
    targetConcerns: ['wrinkles', 'elasticity'],
    suitableSeasons: ['all'],
    ingredients: ['retinol', 'peptide'],
    rating: 4.8,
    reviewCount: 520,
    popularity: 'high',
  },
  // 스킨케어 - AHA (충돌 테스트용)
  {
    id: 'item_004',
    name: '글로우 필링 패드',
    category: 'skincare',
    brand: 'GlowUp',
    price: 32000,
    suitableSkinTypes: ['normal', 'oily'],
    targetConcerns: ['dullness', 'texture'],
    suitableSeasons: ['all'],
    ingredients: ['aha', 'glycolic_acid'],
    rating: 4.5,
    reviewCount: 290,
    popularity: 'high',
  },
  // 메이크업 - 봄 웜톤
  {
    id: 'item_005',
    name: '피치 블러셔',
    category: 'makeup',
    brand: 'ColorPop',
    price: 18000,
    suitableSkinTypes: ['all'],
    targetConcerns: [],
    suitableSeasons: ['spring'],
    ingredients: [],
    rating: 4.6,
    reviewCount: 420,
    popularity: 'high',
  },
  // 메이크업 - 가을 웜톤
  {
    id: 'item_006',
    name: '테라코타 립스틱',
    category: 'makeup',
    brand: 'ColorPop',
    price: 22000,
    suitableSkinTypes: ['all'],
    targetConcerns: [],
    suitableSeasons: ['autumn'],
    ingredients: [],
    rating: 4.4,
    reviewCount: 180,
    popularity: 'medium',
  },
  // 영양제 - 피부 건강
  {
    id: 'item_007',
    name: '콜라겐 부스터',
    category: 'supplement',
    brand: 'VitaGlow',
    price: 45000,
    suitableSkinTypes: ['all'],
    targetConcerns: ['elasticity', 'wrinkles'],
    suitableSeasons: ['all'],
    ingredients: ['collagen', 'vitamin_c'],
    rating: 4.5,
    reviewCount: 650,
    popularity: 'high',
  },
  // 영양제 - 피부+영양 시너지
  {
    id: 'item_008',
    name: '오메가3 + 비타민E',
    category: 'supplement',
    brand: 'NutriHealth',
    price: 38000,
    suitableSkinTypes: ['dry', 'sensitive'],
    targetConcerns: ['dehydration', 'sensitivity'],
    suitableSeasons: ['all'],
    ingredients: ['omega3', 'vitamin_e'],
    rating: 4.7,
    reviewCount: 890,
    popularity: 'high',
  },
  // 저가 제품
  {
    id: 'item_009',
    name: '베이직 모이스처라이저',
    category: 'skincare',
    brand: 'BasicCare',
    price: 12000,
    suitableSkinTypes: ['all'],
    targetConcerns: ['dehydration'],
    suitableSeasons: ['all'],
    ingredients: ['glycerin', 'aloe'],
    rating: 4.0,
    reviewCount: 1200,
    popularity: 'high',
  },
  // 고가 제품
  {
    id: 'item_010',
    name: '럭셔리 안티에이징 앰플',
    category: 'skincare',
    brand: 'LuxeSkin',
    price: 120000,
    suitableSkinTypes: ['normal', 'dry'],
    targetConcerns: ['wrinkles', 'elasticity', 'dullness'],
    suitableSeasons: ['all'],
    ingredients: ['retinol', 'vitamin_c', 'peptide'],
    rating: 4.9,
    reviewCount: 85,
    popularity: 'low',
  },
];

/**
 * Cold Start 테스트용 신규 사용자 프로필
 */
export const MOCK_NEW_USER_PROFILE: UserProfile = {
  userId: 'new_user_cold_start',
  // 모든 도메인 undefined - Cold Start 상황
};

/**
 * 충돌 테스트용 아이템 세트
 */
export const MOCK_CONFLICT_ITEMS: Item[] = [
  createItem({ id: 'retinol_item', ingredients: ['retinol'] }),
  createItem({ id: 'aha_item', ingredients: ['aha'] }),
  createItem({ id: 'bha_item', ingredients: ['bha'] }),
  createItem({ id: 'vitc_item', ingredients: ['vitamin_c'] }),
];
```

---

## 8. DB 스키마

### 8.1 피드백 테이블 (V2 준비)

```sql
-- 마이그레이션: 20260122_recommendation_feedback.sql
CREATE TABLE recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  recommendation_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'click', 'like', 'dislike', 'purchase', 'return')),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_rec_feedback_user ON recommendation_feedback(clerk_user_id);
CREATE INDEX idx_rec_feedback_rec ON recommendation_feedback(recommendation_id);
CREATE INDEX idx_rec_feedback_action ON recommendation_feedback(action);

-- RLS
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_feedback_select" ON recommendation_feedback
  FOR SELECT USING (clerk_user_id = auth.get_user_id());

CREATE POLICY "user_own_feedback_insert" ON recommendation_feedback
  FOR INSERT WITH CHECK (clerk_user_id = auth.get_user_id());

-- 코멘트
COMMENT ON TABLE recommendation_feedback IS 'V2 학습을 위한 추천 피드백';
COMMENT ON COLUMN recommendation_feedback.action IS 'view, click, like, dislike, purchase, return';
```

### 8.2 추천 이력 테이블

```sql
CREATE TABLE recommendation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  recommendations JSONB NOT NULL,
  synergies JSONB,
  version TEXT NOT NULL DEFAULT 'v1',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_rec_history_user ON recommendation_history(clerk_user_id);
CREATE INDEX idx_rec_history_version ON recommendation_history(version);

-- RLS
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_history" ON recommendation_history
  FOR ALL USING (clerk_user_id = auth.get_user_id());
```

---

## 9. API 명세

### 9.1 GET /api/recommendations

```typescript
// 요청
GET /api/recommendations?domains=PC,S&limit=3&category=skincare

// 응답 (성공)
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "item": { "id": "...", "name": "...", ... },
        "score": 87,
        "rank": 1,
        "explanation": {
          "primary": "건성 피부에 적합한 고보습 성분",
          "supporting": ["피부×영양 시너지로 안쪽부터 수분 공급"],
          "synergies": ["S×N"]
        },
        "matchDetails": {
          "domainScore": 45,
          "synergyBonus": 25,
          "popularityScore": 17
        }
      },
      // ... 최대 3개
    ],
    "usedSynergies": [
      { "domains": ["S", "N"], "score": 95, "description": "피부×영양 시너지" }
    ],
    "meta": {
      "version": "v1",
      "processingTime": 230,
      "totalCandidates": 150,
      "filteredCandidates": 27
    }
  }
}
```

### 9.2 POST /api/recommendations/feedback

```typescript
// 요청
POST /api/recommendations/feedback
{
  "recommendationId": "uuid",
  "action": "like",
  "context": { "page": "dashboard", "position": 1 }
}

// 응답 (성공)
{
  "success": true,
  "data": { "recorded": true }
}
```

---

## 10. 구현 우선순위

### Phase 1 (Day 1-2): 기반

| ATOM | 시간 | 산출물 |
|------|------|--------|
| SCE-1 | 1h | `types.ts` |
| SCE-2 | 1h | `synergy-matrix.ts` |
| SCE-5 | 1h | `explainer.ts` |

### Phase 2 (Day 3-4): 점수 계산

| ATOM | 시간 | 산출물 |
|------|------|--------|
| SCE-3-1 | 1h | `score-calculator.ts` (도메인) |
| SCE-3-2 | 1h | `score-calculator.ts` (시너지) |
| SCE-3-3 | 1h | `score-calculator.ts` (인기도) |

### Phase 3 (Day 5): 충돌 해결

| ATOM | 시간 | 산출물 |
|------|------|--------|
| SCE-4-1 | 1h | `conflict-resolver.ts` (감지) |
| SCE-4-2 | 1h | `conflict-resolver.ts` (해결) |

### Phase 4 (Day 6): 통합

| ATOM | 시간 | 산출물 |
|------|------|--------|
| SCE-6 | 1h | `synergy-selector.ts` |
| SCE-7 | 1h | `engine.ts` |

### Phase 5 (Day 7): API & 테스트

| ATOM | 시간 | 산출물 |
|------|------|--------|
| SCE-8 | 1h | `FeedbackButtons.tsx` |
| SCE-9 | 1h | `route.ts` |
| SCE-10 | 1h | `*.test.ts` |

---

## 11. 성공 지표

### 11.1 V1 목표

| 지표 | 목표 | 측정 방법 | 근거 |
|------|------|----------|------|
| 추천 클릭률 (CTR) | > 15% | 피드백 로그 | 업계 평균 5-10%, XAI 적용 시 +7.8% |
| 추천 관련성 | > 70% | 사용자 설문 | XAI 신뢰도 M=4.1 달성 목표 |
| 응답 시간 | < 500ms | API 모니터링 | 사용자 이탈 방지 |
| 충돌 해결 정확도 | 100% | 테스트 | 안전 우선 (건강>효과) |
| 테스트 커버리지 | > 90% | CI/CD | 품질 보증 |

### 11.2 XAI 효과성 근거 (설명 제공 시)

| 지표 | 미제공 | 제공 | 차이 | 출처 |
|------|--------|------|------|------|
| 사용자 신뢰도 | M=3.2 | M=4.1 | p<.001 | [SSRN 2025](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5789189) |
| CTR | baseline | +7.8% | - | [MDPI 2025](https://www.mdpi.com/2504-2289/9/5/124) |
| 사용자 참여 | baseline | +8.3% | - | [MDPI 2025](https://www.mdpi.com/2504-2289/9/5/124) |

### 11.3 Cold Start 전략 (V1)

신규 사용자/신규 아이템에 대한 처리:

```typescript
// 신규 사용자 판별
function isNewUser(user: User): boolean {
  return user.analysisCount < 2 && user.feedbackCount < 5;
}

// Cold Start 추천 (규칙 기반 + 인기 기반)
function getColdStartRecommendations(user: User): Recommendation[] {
  // 1. 온보딩 설문 기반
  if (user.onboardingAnswers) {
    return getOnboardingBasedRecommendations(user.onboardingAnswers);
  }
  // 2. 인기 제품 추천 (Fallback)
  return getPopularRecommendations({ limit: 3 });
}
```

**근거**: "간단하고 설명 가능한 휴리스틱으로 시작하라. 데이터가 쌓이면 복잡성을 추가하라."
— [Medium 2025](https://medium.com/@khayyam.h/the-cold-start-problem-my-hybrid-approach-to-starting-from-zero-8beadd4135f0)

---

## 12. 리스크 및 완화

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|----------|
| 조합 폭발 성능 | 낮음 | 중간 | 3-3-3로 상수 시간 보장 |
| 피드백 부족 (V2) | 중간 | 중간 | V1에서 피드백 UI 필수 |
| 충돌 규칙 누락 | 중간 | 높음 | 전문가 검토, 점진적 추가 |
| 설명 품질 | 중간 | 낮음 | 템플릿 A/B 테스트 |

---

## 13. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.2 | 2026-01-22 | P3 보완: SCE-11/SCE-12 ATOM 추가, ATOM별 상세 TypeScript 인터페이스 보완, Mock 데이터 정의, Edge Case 테스트 |
| 1.1 | 2026-01-22 | 웹 리서치 기반 업데이트 (XAI 실증 데이터, Cold Start 전략, 산업 사례 참조) |
| 1.0 | 2026-01-22 | 초기 버전 (V1 스펙) |

---

## 14. 참고 자료 (외부 출처)

| 출처 | 주제 | URL |
|------|------|-----|
| SSRN 2025 | XAI 신뢰도 연구 (M=4.1 vs 3.2) | [Link](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5789189) |
| MDPI 2025 | 적응형 학습 (CTR +7.8%) | [Link](https://www.mdpi.com/2504-2289/9/5/124) |
| Eugene Yan | Bandits 실전 사례 | [Link](https://eugeneyan.com/writing/bandits/) |
| Netflix | Foundation Model | [Link](https://netflixtechblog.com/foundation-model-for-personalized-recommendation-1a0bd8e02d39) |

---

**Author**: Claude Code
**Reviewed by**: -
