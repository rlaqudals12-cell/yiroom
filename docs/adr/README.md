# Architecture Decision Records (ADR)

> 이룸 프로젝트의 주요 아키텍처 결정 기록

## ADR이란?

Architecture Decision Records는 프로젝트에서 내린 중요한 아키텍처 결정과 그 맥락을 기록하는 문서입니다.

## 상태 정의

| 상태         | 설명                           |
| ------------ | ------------------------------ |
| `proposed`   | 제안됨 - 검토 필요             |
| `accepted`   | 수락됨 - 구현 진행             |
| `deferred`   | 보류됨 - 검토 후 적용 연기     |
| `deprecated` | 폐기됨 - 더 이상 유효하지 않음 |
| `superseded` | 대체됨 - 다른 ADR로 교체       |

## P1 (궁극의 형태) 현황

> P1 원칙: 모든 기능은 이상적 최종 상태를 정의하고 현재 목표 %를 명시해야 함

### P1 섹션 포함 ADR (핵심 15개)

| 그룹                  | ADR         | P1 상태 | 비고           |
| --------------------- | ----------- | ------- | -------------- |
| **Core (001-005)**    | ADR-001~005 | ✅ 완료 | 핵심 아키텍처  |
| **Data/AI (006-010)** | ADR-006~010 | ✅ 완료 | 데이터/AI 계층 |
| **Legal (021-025)**   | ADR-021~025 | ✅ 완료 | 법적 준수/보안 |

### P1 섹션 템플릿

```markdown
## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

[제약 없는 완벽한 상태]

### 물리적 한계

| 항목 | 한계 |
| ---- | ---- |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
| ---- | ---------- | ---- | ---- |

### 현재 목표: X%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
| --------- | ---- | ----------- |
```

### 향후 계획

- **Phase C**: 나머지 39개 ADR에 P1 섹션 추가 예정
- **우선순위**: accepted 상태 ADR 우선 처리

## ADR 목록

| ID                                                    | 제목                               | 상태     | 날짜       |
| ----------------------------------------------------- | ---------------------------------- | -------- | ---------- |
| [ADR-001](./ADR-001-core-image-engine.md)             | Core Image Engine 아키텍처         | accepted | 2026-01-15 |
| [ADR-002](./ADR-002-hybrid-data-pattern.md)           | Hybrid 데이터 패턴                 | accepted | 2026-01-15 |
| [ADR-003](./ADR-003-ai-model-selection.md)            | AI 모델 선택 (Gemini 3 Flash)      | accepted | 2026-01-15 |
| [ADR-004](./ADR-004-auth-strategy.md)                 | 인증 전략 (Clerk + Supabase)       | accepted | 2026-01-15 |
| [ADR-005](./ADR-005-monorepo-structure.md)            | 모노레포 구조                      | accepted | 2026-01-15 |
| [ADR-006](./ADR-006-phase-execution-order.md)         | Phase 실행 순서 원칙               | accepted | 2026-01-15 |
| [ADR-007](./ADR-007-mock-fallback-strategy.md)        | Mock Fallback 전략                 | accepted | 2026-01-15 |
| [ADR-008](./ADR-008-repository-service-layer.md)      | Repository-Service 계층            | accepted | 2026-01-15 |
| [ADR-009](./ADR-009-library-layering.md)              | 라이브러리 계층화                  | accepted | 2026-01-15 |
| [ADR-010](./ADR-010-ai-pipeline.md)                   | AI 파이프라인 아키텍처             | accepted | 2026-01-15 |
| [ADR-011](./ADR-011-cross-module-data-flow.md)        | Cross-Module 데이터 흐름           | accepted | 2026-01-15 |
| [ADR-012](./ADR-012-state-management.md)              | 상태 관리 계층                     | accepted | 2026-01-15 |
| [ADR-013](./ADR-013-error-handling.md)                | 에러 처리 전략                     | accepted | 2026-01-15 |
| [ADR-014](./ADR-014-caching-strategy.md)              | 캐싱 전략                          | accepted | 2026-01-15 |
| [ADR-015](./ADR-015-testing-strategy.md)              | 테스트 전략                        | accepted | 2026-01-15 |
| [ADR-016](./ADR-016-web-mobile-sync.md)               | 웹-모바일 데이터 동기화            | accepted | 2026-01-15 |
| [ADR-017](./ADR-017-offline-support.md)               | 오프라인 지원 아키텍처             | accepted | 2026-01-15 |
| [ADR-018](./ADR-018-i18n-architecture.md)             | 국제화(i18n) 아키텍처              | accepted | 2026-01-15 |
| [ADR-019](./ADR-019-performance-monitoring.md)        | 성능 모니터링 전략                 | accepted | 2026-01-15 |
| [ADR-020](./ADR-020-api-versioning.md)                | API 버전 관리 전략                 | accepted | 2026-01-15 |
| [ADR-021](./ADR-021-edge-cases-fallback.md)           | 엣지 케이스 및 폴백 전략           | accepted | 2026-01-15 |
| [ADR-022](./ADR-022-age-verification.md)              | 연령 인증 아키텍처                 | accepted | 2026-01-16 |
| [ADR-023](./ADR-023-terms-agreement-flow.md)          | 약관 동의 플로우                   | accepted | 2026-01-16 |
| [ADR-024](./ADR-024-ai-transparency.md)               | AI 투명성 표시                     | accepted | 2026-01-16 |
| [ADR-025](./ADR-025-audit-logging.md)                 | 감사 로깅 아키텍처                 | accepted | 2026-01-16 |
| [ADR-026](./ADR-026-color-space-hsl-decision.md)      | 색공간 HSL 결정                    | accepted | 2026-01-17 |
| [ADR-027](./ADR-027-coach-ai-streaming.md)            | 코치 AI 스트리밍                   | accepted | 2026-01-17 |
| [ADR-028](./ADR-028-social-feed.md)                   | 소셜 피드 아키텍처                 | accepted | 2026-01-17 |
| [ADR-029](./ADR-029-affiliate-integration.md)         | 어필리에이트 통합                  | accepted | 2026-01-17 |
| [ADR-030](./ADR-030-nutrition-module.md)              | 영양 모듈 아키텍처                 | accepted | 2026-01-18 |
| [ADR-031](./ADR-031-workout-module.md)                | 운동 모듈 아키텍처                 | accepted | 2026-01-18 |
| [ADR-032](./ADR-032-smart-matching.md)                | 스마트 매칭 알고리즘               | accepted | 2026-01-18 |
| [ADR-033](./ADR-033-face-detection-library.md)        | 얼굴 감지 라이브러리               | accepted | 2026-01-19 |
| [ADR-034](./ADR-034-product-color-classification.md)  | 제품 색상 분류                     | accepted | 2026-01-19 |
| [ADR-035](./ADR-035-smart-link-routing.md)            | 스마트 링크 라우팅                 | accepted | 2026-01-19 |
| [ADR-036](./ADR-036-smart-combination-engine.md)      | 스마트 조합 엔진                   | accepted | 2026-01-20 |
| [ADR-037](./ADR-037-gdpr-deletion-cron.md)            | GDPR 삭제 크론                     | accepted | 2026-01-22 |
| [ADR-038](./ADR-038-rate-limiting.md)                 | Rate Limiting                      | accepted | 2026-01-22 |
| [ADR-039](./ADR-039-pc1-onboarding-stabilization.md)  | PC-1 온보딩 안정화                 | accepted | 2026-01-23 |
| [ADR-040](./ADR-040-cie3-lighting-correction.md)      | CIE-3 조명 보정 알고리즘           | accepted | 2026-01-23 |
| [ADR-041](./ADR-041-cie4-lighting-analysis.md)        | CIE-4 조명 분석                    | accepted | 2026-01-23 |
| [ADR-042](./ADR-042-pc2-v2-architecture.md)           | PC-2 v2 아키텍처                   | accepted | 2026-01-23 |
| [ADR-043](./ADR-043-s2-v2-architecture.md)            | S-2 v2 아키텍처                    | accepted | 2026-01-23 |
| [ADR-044](./ADR-044-c2-v2-architecture.md)            | C-2 v2 아키텍처                    | accepted | 2026-01-23 |
| [ADR-045](./ADR-045-sk1-procedure-recommendation.md)  | SK-1 피부시술 정보 제공            | accepted | 2026-01-23 |
| [ADR-046](./ADR-046-oh1-oral-health-analysis.md)      | OH-1 구강건강 분석 모듈            | accepted | 2026-01-23 |
| [ADR-047](./ADR-047-w2-advanced-stretching.md)        | W-2 고급 스트레칭                  | accepted | 2026-01-23 |
| [ADR-048](./ADR-048-accessibility-strategy.md)        | 접근성 전략 (WCAG 2.1 AA)          | accepted | 2026-01-23 |
| [ADR-049](./ADR-049-cicd-pipeline.md)                 | CI/CD 파이프라인                   | accepted | 2026-01-23 |
| [ADR-050](./ADR-050-fashion-closet-crossmodule.md)    | Fashion-Closet 크로스모듈          | accepted | 2026-01-23 |
| [ADR-051](./ADR-051-2026-ux-trends.md)                | 2026 UX 트렌드                     | accepted | 2026-01-23 |
| [ADR-052](./ADR-052-hair-analysis-architecture.md)    | H-1 헤어 분석 아키텍처             | accepted | 2026-01-23 |
| [ADR-053](./ADR-053-makeup-analysis-architecture.md)  | M-1 메이크업 분석 아키텍처         | accepted | 2026-01-23 |
| [ADR-054](./ADR-054-affiliate-first-monetization.md)  | 어필리에이트 우선 수익화 전략      | accepted | 2026-01-24 |
| [ADR-055](./ADR-055-multi-ai-backup-strategy.md)      | Multi-AI 백업 전략                 | accepted | 2026-01-24 |
| [ADR-056](./ADR-056-2026-marketing-strategy.md)       | 2026 마케팅 전략                   | accepted | 2026-01-24 |
| [ADR-057](./ADR-057-design-system-v2.md)              | 디자인 시스템 v2 (YIROOM IDENTITY) | accepted | 2026-01-24 |
| [ADR-058](./ADR-058-hub-pattern-deferral.md)          | Hub 패턴 연기 결정                 | accepted | 2026-01-24 |
| [ADR-059](./ADR-059-contextual-retrieval-deferral.md) | Contextual Retrieval 적용 보류     | deferred | 2026-01-31 |
| [ADR-060](./ADR-060-claude-code-headless-mode.md)      | Claude Code Headless Mode 도입 보류 | deferred | 2026-01-31 |
| [ADR-061](./ADR-061-data-platform-architecture.md)     | 데이터 플랫폼 아키텍처              | accepted | 2026-02-01 |

## ADR 카테고리

### 핵심 아키텍처 (Core Architecture)

- ADR-001: Core Image Engine
- ADR-005: 모노레포 구조
- ADR-006: Phase 실행 순서

### 데이터 계층 (Data Layer)

- ADR-002: Hybrid 데이터 패턴
- ADR-008: Repository-Service 계층
- ADR-011: Cross-Module 데이터 흐름
- ADR-014: 캐싱 전략
- ADR-061: 데이터 플랫폼 아키텍처

### AI/외부 서비스 (AI/External Services)

- ADR-003: AI 모델 선택
- ADR-007: Mock Fallback 전략
- ADR-010: AI 파이프라인 아키텍처
- ADR-055: Multi-AI 백업 전략
- ADR-059: Contextual Retrieval 적용 보류 (deferred)

### 인프라/운영 (Infrastructure/Operations)

- ADR-004: 인증 전략
- ADR-009: 라이브러리 계층화
- ADR-012: 상태 관리
- ADR-013: 에러 처리
- ADR-015: 테스트 전략
- ADR-019: 성능 모니터링
- ADR-021: 엣지 케이스 및 폴백

### 멀티플랫폼 (Multi-Platform)

- ADR-016: 웹-모바일 데이터 동기화
- ADR-017: 오프라인 지원 아키텍처
- ADR-020: API 버전 관리

### 확장성 (Scalability)

- ADR-018: 국제화(i18n) 아키텍처

### 법적 준수/보안 (Legal/Security)

- ADR-022: 연령 인증 아키텍처
- ADR-023: 약관 동의 플로우
- ADR-024: AI 투명성 표시
- ADR-025: 감사 로깅 아키텍처
- ADR-037: GDPR 삭제 크론
- ADR-038: Rate Limiting

### 소셜/상거래 (Social/Commerce)

- ADR-028: 소셜 피드 아키텍처
- ADR-029: 어필리에이트 통합
- ADR-035: 스마트 링크 라우팅
- ADR-036: 스마트 조합 엔진
- ADR-054: 어필리에이트 우선 수익화 전략
- ADR-056: 2026 마케팅 전략

### 분석 모듈 (Analysis Modules)

- ADR-030: 영양 모듈 아키텍처
- ADR-031: 운동 모듈 아키텍처
- ADR-032: 스마트 매칭 알고리즘
- ADR-033: 얼굴 감지 라이브러리
- ADR-034: 제품 색상 분류
- ADR-042: PC-2 v2 아키텍처
- ADR-043: S-2 v2 아키텍처
- ADR-044: C-2 v2 아키텍처
- ADR-045: SK-1 피부시술 정보 제공
- ADR-046: OH-1 구강건강 분석 모듈
- ADR-047: W-2 고급 스트레칭
- ADR-052: H-1 헤어 분석 아키텍처
- ADR-053: M-1 메이크업 분석 아키텍처

### 이미지 엔진 (Image Engine)

- ADR-001: Core Image Engine
- ADR-026: 색공간 HSL 결정
- ADR-040: CIE-3 조명 보정 알고리즘
- ADR-041: CIE-4 조명 분석

### 온보딩/UX (Onboarding/UX)

- ADR-039: PC-1 온보딩 안정화
- ADR-048: 접근성 전략 (WCAG 2.1 AA)
- ADR-051: 2026 UX 트렌드
- ADR-057: 디자인 시스템 v2
- ADR-058: Hub 패턴 연기 결정

### DevOps/인프라 (DevOps/Infrastructure)

- ADR-049: CI/CD 파이프라인
- ADR-060: Claude Code Headless Mode 도입 보류 (deferred)

### 크로스 모듈 (Cross-Module)

- ADR-050: Fashion-Closet 크로스모듈

## P7 워크플로우 (리서치 → 구현)

> **순서 위반 = 기술부채** - 이 순서는 절대적이며 건너뛸 수 없음

```
┌─────────────────────────────────────────────────────────────────┐
│                     P7 워크플로우                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Deep Research                                               │
│     └── 기술 스펙, 알고리즘, 학술 자료 조사                     │
│     └── 결과: docs/research/claude-ai-research/                 │
│                           ↓                                     │
│  2. 원리 문서화                                                 │
│     └── 리서치 결과를 원리로 정리, 수학적/과학적 근거           │
│     └── 결과: docs/principles/                                  │
│                           ↓                                     │
│  3. ADR 작성                                                    │
│     └── 기술 선택 결정, 대안 기록, 원리 문서 참조               │
│     └── 결과: docs/adr/                                         │
│                           ↓                                     │
│  4. 스펙 작성                                                   │
│     └── 입출력 정의, Mock 데이터, 인터페이스                    │
│     └── 결과: docs/specs/                                       │
│                           ↓                                     │
│  5. 구현                                                        │
│     └── 코드 작성, 테스트, typecheck + lint                     │
│     └── 결과: apps/, packages/                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### ADR 필수 참조

모든 ADR은 관련 원리 문서를 참조해야 합니다:

```markdown
## 관련 문서

- [원리: xxx](../principles/xxx.md) ← 과학적/기술적 기초 (필수)
- [스펙: xxx](../specs/xxx.md) ← 구현 스펙
- [ADR: xxx](./ADR-xxx.md) ← 관련 결정
```

## ADR 템플릿

새 ADR 작성 시 [ADR-TEMPLATE.md](./ADR-TEMPLATE.md) 참조

---

**Version**: 7.9 | **Updated**: 2026-02-01 | ADR-061 추가 (데이터 플랫폼 아키텍처)
