# P0~P2 + Phase K 종합 실행 계획

> **생성일**: 2026-02-01
> **목표**: 비공개 테스트 (D-12), 정식 출시 (D-25)
> **총 예상 기간**: 11-13일 (병렬 최적화)
> **분석 방법**: 시지푸스 복잡도 분석기

---

## 1. 복잡도 분석 요약

| Phase | 영역 | 파일 수 | 총점 | 트랙 | 병렬 그룹 |
|-------|------|---------|------|------|-----------|
| **P0** | 테스트 커버리지 75%+ | 30-50 | 45 | Light | 상시 |
| **K-1** | 성별 중립화 | 25-30 | 65 | Standard | A |
| **K-2** | 패션 확장 | 35-45 | 78 | Full | B |
| **K-3** | 체형 분석 강화 | 15-20 | 52 | Standard | C |
| **K-4** | 영양/레시피 확장 | 20-28 | 58 | Standard | C |
| **K-5** | 관리자/프로필 | 12-18 | 42 | Light | A |
| **P2** | Lighthouse 90+ | 5-10 | 35 | Light | 최종 |

---

## 2. 병렬 실행 타임라인

```
Week 1 (Day 1-3):
┌─────────────────────────────────────────────────────────┐
│  그룹 A: 병렬 실행                                      │
│  ┌────────────────┐   ┌────────────────┐               │
│  │     K-1        │   │     K-5        │               │
│  │  성별 중립화   │   │  관리자/프로필  │               │
│  │  (3일, 65점)   │   │  (2일, 42점)   │               │
│  │  Standard      │   │  Light         │               │
│  └────────────────┘   └────────────────┘               │
│                                                         │
│  P0: 테스트 커버리지 (상시 병렬)                        │
└─────────────────────────────────────────────────────────┘

Week 2 (Day 4-8):
┌─────────────────────────────────────────────────────────┐
│  그룹 B: K-1 완료 후 시작                               │
│  ┌────────────────────────────────────┐                │
│  │            K-2                     │                │
│  │         패션 확장                   │                │
│  │       (5일, 78점)                  │                │
│  │          Full                      │                │
│  └────────────────────────────────────┘                │
│                                                         │
│  P0: 테스트 커버리지 (상시 병렬)                        │
└─────────────────────────────────────────────────────────┘

Week 2-3 (Day 6-11):
┌─────────────────────────────────────────────────────────┐
│  그룹 C: K-2 50% 진행 후 병렬 시작                      │
│  ┌────────────────┐   ┌────────────────┐               │
│  │     K-3        │   │     K-4        │               │
│  │  체형 분석 강화 │   │ 영양/레시피 확장│               │
│  │  (3일, 52점)   │   │  (3일, 58점)   │               │
│  │  Standard      │   │  Standard      │               │
│  └────────────────┘   └────────────────┘               │
│                                                         │
│  P0: 테스트 커버리지 (상시 병렬)                        │
└─────────────────────────────────────────────────────────┘

Week 3 (Day 12-13):
┌─────────────────────────────────────────────────────────┐
│  최종 검증                                              │
│  ┌────────────────────────────────────┐                │
│  │            P2                      │                │
│  │      Lighthouse 90+                │                │
│  │       (1-2일, 35점)                │                │
│  │          Light                     │                │
│  └────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 의존성 그래프

```
                    ┌─────────┐
                    │  START  │
                    └────┬────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │   K-1   │    │   K-5   │    │   P0    │
    │ 성별중립│    │ 관리자  │    │ 테스트  │
    │ (3일)  │    │ (2일)   │    │ (상시)  │
    └────┬────┘    └─────────┘    └─────────┘
         │
         │ 의존
         ▼
    ┌─────────┐
    │   K-2   │
    │ 패션확장│
    │ (5일)  │
    └────┬────┘
         │
         │ 부분 의존 (50% 완료 후)
         ├───────────────┐
         ▼               ▼
    ┌─────────┐    ┌─────────┐
    │   K-3   │    │   K-4   │
    │ 체형강화│    │ 레시피  │
    │ (3일)  │    │ (3일)   │
    └────┬────┘    └────┬────┘
         │               │
         └───────┬───────┘
                 ▼
            ┌─────────┐
            │   P2    │
            │ LH 90+  │
            │ (1-2일) │
            └────┬────┘
                 │
                 ▼
            ┌─────────┐
            │   END   │
            └─────────┘
```

---

## 4. 관련 문서

### 원리 문서
| 문서 | 적용 Phase |
|------|-----------|
| [color-science.md](../principles/color-science.md) | K-1, K-2 |
| [body-mechanics.md](../principles/body-mechanics.md) | K-3 |
| [nutrition-science.md](../principles/nutrition-science.md) | K-4 |
| [cross-domain-synergy.md](../principles/cross-domain-synergy.md) | 전체 |
| [fashion-matching.md](../principles/fashion-matching.md) | K-2 |

### ADR
| ADR | 적용 Phase |
|-----|-----------|
| [ADR-003: AI 모델 선택](../adr/ADR-003-ai-model-selection.md) | 전체 |
| [ADR-011: Cross-Module 데이터 흐름](../adr/ADR-011-cross-module-data-flow.md) | K-1, K-2, K-3, K-4 |
| [ADR-050: Fashion-Closet 크로스모듈](../adr/ADR-050-fashion-closet-crossmodule.md) | K-2 |
| [ADR-015: 테스팅 전략](../adr/ADR-015-testing-strategy.md) | P0 |

### 스펙 문서
| 스펙 | 상태 |
|------|------|
| [SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md](../specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md) | v0.8 (업데이트 필요) |

---

## 5. 상세 작업 내역

### 5.1 P0: 테스트 커버리지 75%+

**현황**: 602개 테스트 파일 존재
**목표**: 70% → 75%+
**전략**: K 작업과 병렬로 진행

| 영역 | 현재 테스트 | 추가 필요 | 우선순위 |
|------|------------|----------|----------|
| lib/image-engine/ | 4개 | 10-15개 | 높음 |
| lib/analysis/ | 8개 | 5-10개 | 높음 |
| lib/fashion/ | 2개 | 5-8개 | 중간 |
| components/ | 50개+ | 10-15개 | 중간 |

**리스크 완화**:
- 린트 에러 81개 먼저 해결 (unused imports)
- 기존 테스트 통과 확인 후 추가

---

### 5.2 K-1: 성별 중립화 (3일)

**기존 인프라**: `lib/content/gender-adaptive.ts` (354줄)

| Task | 파일 | 복잡도 |
|------|------|--------|
| 온보딩 성별 선택 UI | `app/(auth)/onboarding/gender.tsx` | 새 파일 |
| DB 스키마 변경 | `user_profiles.gender` 컬럼 | RLS 정책 필요 |
| Mock 데이터 확장 | `lib/mock/personal-color.ts` 남성 추천 | 수정 |
| 결과 페이지 탭 UI | `app/analysis/personal-color/result/*` | 수정 |
| 테스트 추가 | `tests/lib/content/gender-adaptive.test.ts` | 확장 |

**에이전트**: code-quality + test-writer (Standard)

---

### 5.3 K-2: 패션 확장 (5일)

**기존 인프라**: `lib/inventory/closetMatcher.ts` 재사용

| Task | 파일 | 복잡도 |
|------|------|--------|
| 사이즈 추천 로직 | `lib/fashion/size-recommendation.ts` | 새 파일 |
| Best 10 생성기 | `lib/fashion/best10-generator.ts` | 새 파일 |
| 스타일 카테고리 | `lib/fashion/style-categories.ts` | 새 파일 |
| closetMatcher 확장 | STYLE_CATEGORY_KEYWORDS 추가 | 수정 |
| UI 컴포넌트 | `components/fashion/*` 10-15개 | 새 파일들 |
| 페이지 | `app/(main)/fashion/*` 5-8개 | 새 파일들 |
| 테스트 | `tests/lib/fashion/*` 10개+ | 새 파일들 |

**에이전트**: 전체 파이프라인 (Full)
- spec-reviewer
- ui-validator
- code-quality
- test-writer
- ux-writer
- beauty-validator

---

### 5.4 K-3: 체형 분석 강화 (3일)

**기존 인프라**: `lib/body/korean-standards.ts` 존재

| Task | 파일 | 복잡도 |
|------|------|--------|
| BMI 계산기 | `lib/body/bmi-calculator.ts` | 새 파일 (스펙 존재) |
| 자세 교정 운동 | `lib/mock/posture-correction.ts` | 새 파일 |
| 키/몸무게 입력 UI | `components/body/PhysicalInput.tsx` | 새 파일 |
| PhysicalInfoCard 마이그레이션 | BMI 함수 → 공용 모듈 | 리팩토링 |
| 테스트 | `tests/lib/body/*` 5개+ | 새 파일들 |

**에이전트**: code-quality + test-writer (Standard)

---

### 5.5 K-4: 영양/레시피 확장 (3일)

**기존 인프라**: `lib/inventory/repository.ts`, `PantryMetadata` 타입

| Task | 파일 | 복잡도 |
|------|------|--------|
| 레시피 매처 | `lib/nutrition/recipe-matcher.ts` | 새 파일 (closetMatcher 패턴) |
| 목표 계산기 | `lib/nutrition/goal-calculator.ts` | 새 파일 |
| Mock 레시피 | `lib/mock/recipes.ts` (50개) | 새 파일 |
| 식재료 인벤토리 UI | `components/nutrition/pantry/*` | 새 파일들 |
| 레시피 추천 UI | `components/nutrition/recipe/*` | 새 파일들 |
| 테스트 | `tests/lib/nutrition/*` 6개+ | 새 파일들 |

**에이전트**: code-quality + test-writer (Standard)

---

### 5.6 K-5: 관리자/프로필 (2일)

**기존 인프라**: `lib/admin/` 존재

| Task | 파일 | 복잡도 |
|------|------|--------|
| 관리자 대시보드 | `app/(admin)/dashboard/*` | 새 파일들 |
| 사용자 통계 | `lib/admin/user-stats.ts` | 확장 |
| 프로필 벤토 박스 | `components/profile/BentoLayout.tsx` | 새 파일 |
| 웰니스 스코어 표시 | `components/profile/WellnessScore.tsx` | 수정 |
| 테스트 | `tests/lib/admin/*` 4개+ | 확장 |

**에이전트**: code-quality (Light)

---

### 5.7 P2: Lighthouse 90+ (1-2일)

**완료된 개선**:
- [x] viewport `userScalable: true`, `maximumScale: 5`
- [x] CSP `clerk-telemetry.com` 추가

**남은 작업**:
| 항목 | 상태 | 영향 |
|------|------|------|
| 콘솔 에러 확인 | 측정 필요 | Best Practices |
| 미사용 CSS/JS 제거 | 분석 필요 | Performance |
| 서드파티 쿠키 | Clerk 관련 | Best Practices |
| bfcache 최적화 | 분석 필요 | Performance |

---

## 6. 실행 우선순위

### 즉시 실행 (Day 1)

1. **린트 에러 81개 수정** (unused imports)
2. **K-1 시작** + **K-5 시작** (병렬 그룹 A)
3. **P0 테스트 추가** (상시 병렬)

### Week 1 (Day 1-3)

- K-1: 성별 중립화 완료
- K-5: 관리자/프로필 완료
- P0: 테스트 10-15개 추가

### Week 2 (Day 4-8)

- K-2: 패션 확장 시작
- P0: 테스트 15-20개 추가

### Week 2-3 (Day 6-11)

- K-2: 패션 확장 완료
- K-3 + K-4: 병렬 시작 및 완료
- P0: 테스트 최종 마무리

### Week 3 (Day 12-13)

- P2: Lighthouse 최종 검증
- QA 체크리스트 완료

---

## 7. 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| DB 스키마 변경 (K-1) | 마이그레이션 필요 | RLS 정책 사전 검토 |
| 외부 API 연동 (K-2, K-4) | 지연 가능 | Mock 데이터 우선 |
| 테스트 커버리지 미달 | 비공개 테스트 지연 | 핵심 모듈 우선 테스트 |
| Lighthouse 점수 미달 | 정식 출시 지연 | 점진적 개선, 측정 반복 |

---

## 8. 성공 기준

| 마일스톤 | 기준 | 측정 방법 |
|----------|------|----------|
| 비공개 테스트 (D-12) | 테스트 75%+, QA 완료 | coverage report |
| 정식 출시 (D-25) | 테스트 85%+, Lighthouse 90+ | CI 자동 측정 |

---

**Version**: 1.0 | **Created**: 2026-02-01
**분석 도구**: 시지푸스 복잡도 분석기 (sisyphus-adaptive)
