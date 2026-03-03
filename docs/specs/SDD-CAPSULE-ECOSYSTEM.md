# SDD-CAPSULE-ECOSYSTEM: 캡슐 에코시스템 통합 스펙

> **Version**: 1.0 | **Created**: 2026-03-03 | **Status**: Draft
> **Author**: Claude Code
> **기반 ADR**: ADR-069~075

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"9개 분석 모듈의 결과가 하나의 BeautyProfile로 수렴하고,
CapsuleEngine\<T\>를 통해 매일 1탭으로 개인 최적화된 루틴을 실행하며,
호환성 검증과 안전성 보장이 자동으로 이루어지는 통합 시스템"

### 100점 기준

| 지표                 | 100점 기준       | 현재 목표      |
| -------------------- | ---------------- | -------------- |
| 도메인 커버리지      | 9/9 모듈 캡슐화  | 50% (5/9 우선) |
| Daily Capsule 수락률 | 70%+             | 40%            |
| CCS 평균             | 85+              | 70+            |
| 안전성 FNR           | ≤ 0.1% (Level 1) | ≤ 0.1%         |
| 의사결정 시간        | < 30초           | < 60초         |

### 현재 목표: 45%

### 의도적 제외

| 제외 항목          | 이유               | 재검토 시점 |
| ------------------ | ------------------ | ----------- |
| ML 기반 N값 최적화 | 사용자 데이터 부족 | MAU 1만+    |
| 크로스 유저 학습   | 프라이버시 고려    | Phase 5     |
| 자동 구매 연동     | B2B 파트너십 필요  | Phase 4     |

---

## 1. 시스템 아키텍처

### 1.1 계층 구조 (ADR-069)

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                       │
│  app/(capsule)/    — Daily Capsule, 대시보드, 갭 분석    │
│  app/(tabs)/       — 캡슐 위젯 (홈 대시보드)             │
├─────────────────────────────────────────────────────────┤
│                  Domain Layer                             │
│  lib/capsule/engine.ts      — CapsuleEngine<T>          │
│  lib/capsule/registry.ts    — DomainRegistry             │
│  lib/capsule/scoring.ts     — CCS 계산 (ADR-071)        │
│  lib/capsule/daily.ts       — Daily Capsule (ADR-073)   │
│  lib/capsule/rotation.ts    — 로테이션 엔진 (ADR-074)   │
│  lib/capsule/safety.ts      — Safety 연동 (ADR-070)     │
│  lib/capsule/shopping.ts    — 쇼핑 컴패니언 (ADR-075)   │
│  lib/capsule/domains/       — 9개 도메인 구현체           │
├─────────────────────────────────────────────────────────┤
│                  Repository Layer                         │
│  lib/supabase/           — DB 접근                       │
│  lib/inventory/ (16함수)  — 인벤토리 CRUD                 │
│  lib/smart-matching/ (11) — 제품 매칭 알고리즘            │
│  lib/products/affiliate.ts — 어필리에이트 추적            │
├─────────────────────────────────────────────────────────┤
│                  Data Layer (Supabase)                    │
│  beauty_profiles           — 통합 프로필                  │
│  capsules                  — 캡슐 인스턴스                │
│  capsule_items             — 캡슐 내 아이템               │
│  daily_capsules            — 일일 캡슐 캐시               │
│  rotation_history          — 로테이션 기록                │
│  safety_profiles           — 안전성 프로필 (암호화)       │
│  cross_domain_rules        — 도메인 간 호환 규칙          │
│  ingredient_interactions   — 성분 상호작용 (기존)         │
│  cosmetic_ingredients      — 성분 DB (기존 100시드)       │
│  wardrobe_items/outfits    — 캡슐 옷장 (기존)            │
│  user_product_shelf        — 보유 제품 (기존)            │
└─────────────────────────────────────────────────────────┘
```

### 1.2 데이터 흐름

```
사용자 분석 완료 → BeautyProfile 자동 갱신
                      ↓
              CapsuleEngine<T>.curate()
                      ↓
              CCS 호환성 검사 (ADR-071)
                      ↓
              Safety Profile 검증 (ADR-070)
                      ↓
              Daily Capsule 생성 (ADR-073)
                      ↓
              사용자 1탭 실행
                      ↓
              사용 기록 → 로테이션 판단 (ADR-074)
                      ↓
              갭 분석 → 쇼핑 컴패니언 (ADR-075)
```

---

## 2. 핵심 데이터 모델

### 2.1 BeautyProfile (ADR-069)

```typescript
interface BeautyProfile {
  userId: string;
  updatedAt: string;
  personalColor?: { season: string; subType: string; palette: string[] };
  skin?: { type: string; concerns: string[]; scores: Record<string, number> };
  body?: { shape: string; measurements: Record<string, number> };
  workout?: { fitnessLevel: string; goals: string[]; history: string[] };
  nutrition?: { deficiencies: string[]; dietType: string; allergies: string[] };
  hair?: { type: string; scalp: string; concerns: string[] };
  makeup?: { preferences: Record<string, string>; skillLevel: string };
  oral?: { conditions: string[]; goals: string[] };
  fashion?: { style: string; sizeProfile: Record<string, string>; wardrobe: string[] };
  completedModules: string[];
  personalizationLevel: 1 | 2 | 3 | 4;
  lastFullUpdate: string;
}
```

### 2.2 Capsule & CapsuleItem

```typescript
interface Capsule<T> {
  id: string;
  userId: string;
  domainId: string;
  items: CapsuleItem<T>[];
  ccs: number; // Capsule Compatibility Score
  createdAt: string;
  lastRotation: string;
  status: 'active' | 'archived';
}

interface CapsuleItem<T> {
  id: string;
  capsuleId: string;
  item: T;
  addedAt: string;
  profileFitScore: number;
  usageCount: number;
  lastUsed: string | null;
}
```

### 2.3 DailyCapsule

```typescript
interface DailyCapsule {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  items: DailyItem[];
  totalCcs: number;
  estimatedMinutes: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt: string | null;
}

interface DailyItem {
  domainId: string;
  capsuleItemId: string;
  label: string; // "수분 크림 바르기"
  completed: boolean;
  order: number;
}
```

---

## 3. 핵심 기능

### 3.1 CapsuleEngine\<T\> (ADR-069)

5개 메서드: curate, checkCompatibility, personalize, shouldRotate, rotate, minimize

### 3.2 CCS 스코어링 (ADR-071)

CCS = w1×IntraDomain + w2×CrossDomain + w3×ProfileFit
임계값: CCS ≥ 70 (A등급 이상)

### 3.3 Daily Capsule (ADR-073)

5단계 파이프라인 → Progressive Disclosure UI → Hook Model 사이클

### 3.4 로테이션 엔진 (ADR-074)

shouldRotate() → rotate() → 교체 비율 20-40%

### 3.5 쇼핑 컴패니언 (ADR-075)

갭 분석 → 기존 아이템 활용 우선 → 정말 필요한 것만 구매 추천

### 3.6 Safety Profile (ADR-070)

3-Level 검증 → BLOCK/WARN/INFO → FNR ≤ 0.1%

---

## 4. API 엔드포인트

### 4.1 캡슐 API

| Method | Path                         | 설명                    |
| ------ | ---------------------------- | ----------------------- |
| GET    | /api/capsule/profile         | BeautyProfile 조회      |
| POST   | /api/capsule/daily           | Daily Capsule 생성/조회 |
| PATCH  | /api/capsule/daily/[id]      | Daily 아이템 완료 체크  |
| GET    | /api/capsule/[domain]        | 도메인별 캡슐 조회      |
| POST   | /api/capsule/[domain]/curate | 큐레이션 실행           |
| GET    | /api/capsule/gap             | 갭 분석                 |
| POST   | /api/capsule/rotate          | 로테이션 실행           |

### 4.2 안전성 API

| Method | Path                | 설명                |
| ------ | ------------------- | ------------------- |
| GET    | /api/safety/profile | Safety Profile 조회 |
| PUT    | /api/safety/profile | Safety Profile 갱신 |
| POST   | /api/safety/check   | 제품 안전성 검사    |

---

## 5. UI 화면

### 5.1 화면 목록

| 화면          | 경로                     | 설명               |
| ------------- | ------------------------ | ------------------ |
| 캡슐 대시보드 | app/(capsule)/index      | 전체 캡슐 현황     |
| Daily Capsule | app/(capsule)/daily      | 오늘의 루틴        |
| 도메인 캡슐   | app/(capsule)/[domain]   | 도메인별 상세      |
| 갭 분석       | app/(capsule)/gap        | 부족 아이템 + 추천 |
| 캡슐 온보딩   | app/(capsule)/onboarding | 첫 캡슐 설정       |
| Safety 설정   | app/settings/safety      | 안전성 프로필 입력 |

### 5.2 Daily Capsule UI (Progressive Disclosure)

```
Level 0: [오늘의 루틴 시작] 버튼
Level 1: 아이콘 + 제품명 + 체크박스 리스트
Level 2: 상세 설명 + 대안 스왑 (펼치기)
```

---

## 6. 기존 시스템 활용 매핑

| 기존 시스템                       | 캡슐 활용                    |
| --------------------------------- | ---------------------------- |
| CapsuleEngine\<T\> (lib/capsule/) | 확장: 9도메인 구현체         |
| lib/inventory/ (16함수)           | 보유 아이템 조회 → 갭 분석   |
| lib/smart-matching/ (11모듈)      | 제품 매칭 → 쇼핑 컴패니언    |
| user_product_shelf                | 보유 제품 → 캡슐 아이템 후보 |
| ingredient_interactions           | 성분 호환성 → CCS Layer 1    |
| cosmetic_ingredients (100시드)    | EWG → Safety Profile 연동    |
| wardrobe_items/outfits/wear_logs  | 옷장 → Fashion 캡슐          |

---

## 7. 마이그레이션

### 7.1 점진적 마이그레이션 (On-Read)

```
기존 사용자가 캡슐 기능 처음 접근 시:
1. 기존 분석 결과 조회 (personal_color_assessments, skin_assessments, ...)
2. BeautyProfile 자동 변환
3. beauty_profiles 테이블에 저장
4. 이후 분석 완료 시 자동 갱신
```

### 7.2 신규 테이블

| 테이블             | 목적            | RLS                   |
| ------------------ | --------------- | --------------------- |
| beauty_profiles    | 통합 프로필     | clerk_user_id         |
| capsules           | 캡슐 인스턴스   | clerk_user_id         |
| capsule_items      | 캡슐 아이템     | capsule.clerk_user_id |
| daily_capsules     | 일일 캡슐       | clerk_user_id         |
| rotation_history   | 로테이션 기록   | clerk_user_id         |
| safety_profiles    | 안전성 (암호화) | clerk_user_id         |
| cross_domain_rules | 도메인 간 규칙  | public read           |

---

## 8. 테스트 전략

| 범위   | 테스트 내용                           | 도구          |
| ------ | ------------------------------------- | ------------- |
| 단위   | CCS 계산, 로테이션 판단, 갭 분석      | Vitest        |
| 통합   | Daily Capsule 파이프라인, Safety 필터 | Vitest + DB   |
| E2E    | 캡슐 온보딩 → Daily 수락 → 완료       | Playwright    |
| 안전성 | FNR 검증 (알레르겐 100건 테스트)      | 전용 스크립트 |

---

## 부록 A: 모듈별 Optimal_N (P-1 C1)

| 모듈      | L1(초보) | L2(중급) | L3(고급) | L4(전문가) |
| --------- | -------- | -------- | -------- | ---------- |
| Skin      | 3        | 5        | 7        | 10         |
| Fashion   | 33       | 37       | 50       | 자유       |
| Workout   | 3        | 5        | 7        | 10         |
| Nutrition | 5        | 7        | 10       | 15         |
| Hair      | 3        | 4        | 5        | 7          |
| Makeup    | 5        | 7        | 10       | 15         |
| PC        | 4        | 6        | 8        | 12         |
| Oral      | 3        | 4        | 5        | 6          |
| Body      | -        | -        | -        | -          |

## 부록 B: 안전성 검사 흐름 (ADR-070)

```
입력 → 알레르겐 교차반응 → 금기사항 → 성분 상호작용 → EWG → SafetyReport
```

## 부록 C: 로테이션 주기표 (ADR-074)

| 모듈      | 최소 | 최대 | 근거        |
| --------- | ---- | ---- | ----------- |
| Skin      | 4주  | 8주  | 피부 내성   |
| Fashion   | 12주 | 16주 | 계절 전환   |
| Workout   | 4주  | 6주  | 근육 적응   |
| Nutrition | 2주  | 4주  | 식단 다양성 |
| Hair      | 8주  | 12주 | 모발 주기   |

---

**Version**: 1.0 | **Created**: 2026-03-03
