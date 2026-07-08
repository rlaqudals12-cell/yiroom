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

| ID                                                                | 제목                                                                                                                              | 상태     | 날짜       |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| [ADR-001](./ADR-001-core-image-engine.md)                         | Core Image Engine 아키텍처                                                                                                        | accepted | 2026-01-15 |
| [ADR-002](./ADR-002-hybrid-data-pattern.md)                       | Hybrid 데이터 패턴                                                                                                                | accepted | 2026-01-15 |
| [ADR-003](./ADR-003-ai-model-selection.md)                        | AI 모델 선택 (Gemini 3 Flash)                                                                                                     | accepted | 2026-01-15 |
| [ADR-004](./ADR-004-auth-strategy.md)                             | 인증 전략 (Clerk + Supabase)                                                                                                      | accepted | 2026-01-15 |
| [ADR-005](./ADR-005-monorepo-structure.md)                        | 모노레포 구조                                                                                                                     | accepted | 2026-01-15 |
| [ADR-006](./ADR-006-phase-execution-order.md)                     | Phase 실행 순서 원칙                                                                                                              | accepted | 2026-01-15 |
| [ADR-007](./ADR-007-mock-fallback-strategy.md)                    | Mock Fallback 전략                                                                                                                | accepted | 2026-01-15 |
| [ADR-008](./ADR-008-repository-service-layer.md)                  | Repository-Service 계층                                                                                                           | accepted | 2026-01-15 |
| [ADR-009](./ADR-009-library-layering.md)                          | 라이브러리 계층화                                                                                                                 | accepted | 2026-01-15 |
| [ADR-010](./ADR-010-ai-pipeline.md)                               | AI 파이프라인 아키텍처                                                                                                            | accepted | 2026-01-15 |
| [ADR-011](./ADR-011-cross-module-data-flow.md)                    | Cross-Module 데이터 흐름                                                                                                          | accepted | 2026-01-15 |
| [ADR-012](./ADR-012-state-management.md)                          | 상태 관리 계층                                                                                                                    | accepted | 2026-01-15 |
| [ADR-013](./ADR-013-error-handling.md)                            | 에러 처리 전략                                                                                                                    | accepted | 2026-01-15 |
| [ADR-014](./ADR-014-caching-strategy.md)                          | 캐싱 전략                                                                                                                         | accepted | 2026-01-15 |
| [ADR-015](./ADR-015-testing-strategy.md)                          | 테스트 전략                                                                                                                       | accepted | 2026-01-15 |
| [ADR-016](./ADR-016-web-mobile-sync.md)                           | 웹-모바일 데이터 동기화                                                                                                           | accepted | 2026-01-15 |
| [ADR-017](./ADR-017-offline-support.md)                           | 오프라인 지원 아키텍처                                                                                                            | accepted | 2026-01-15 |
| [ADR-018](./ADR-018-i18n-architecture.md)                         | 국제화(i18n) 아키텍처                                                                                                             | accepted | 2026-01-15 |
| [ADR-019](./ADR-019-performance-monitoring.md)                    | 성능 모니터링 전략                                                                                                                | accepted | 2026-01-15 |
| [ADR-020](./ADR-020-api-versioning.md)                            | API 버전 관리 전략                                                                                                                | accepted | 2026-01-15 |
| [ADR-021](./ADR-021-edge-cases-fallback.md)                       | 엣지 케이스 및 폴백 전략                                                                                                          | accepted | 2026-01-15 |
| [ADR-022](./ADR-022-age-verification.md)                          | 연령 인증 아키텍처                                                                                                                | accepted | 2026-01-16 |
| [ADR-023](./ADR-023-terms-agreement-flow.md)                      | 약관 동의 플로우                                                                                                                  | accepted | 2026-01-16 |
| [ADR-024](./ADR-024-ai-transparency.md)                           | AI 투명성 표시                                                                                                                    | accepted | 2026-01-16 |
| [ADR-025](./ADR-025-audit-logging.md)                             | 감사 로깅 아키텍처                                                                                                                | accepted | 2026-01-16 |
| [ADR-026](./ADR-026-color-space-hsl-decision.md)                  | 색공간 HSL 결정                                                                                                                   | accepted | 2026-01-17 |
| [ADR-027](./ADR-027-coach-ai-streaming.md)                        | 코치 AI 스트리밍                                                                                                                  | accepted | 2026-01-17 |
| [ADR-028](./ADR-028-social-feed.md)                               | 소셜 피드 아키텍처                                                                                                                | accepted | 2026-01-17 |
| [ADR-029](./ADR-029-affiliate-integration.md)                     | 어필리에이트 통합                                                                                                                 | accepted | 2026-01-17 |
| [ADR-030](./ADR-030-nutrition-module.md)                          | 영양 모듈 아키텍처                                                                                                                | accepted | 2026-01-18 |
| [ADR-031](./ADR-031-workout-module.md)                            | 운동 모듈 아키텍처                                                                                                                | accepted | 2026-01-18 |
| [ADR-032](./ADR-032-smart-matching.md)                            | 스마트 매칭 알고리즘                                                                                                              | accepted | 2026-01-18 |
| [ADR-033](./ADR-033-face-detection-library.md)                    | 얼굴 감지 라이브러리                                                                                                              | accepted | 2026-01-19 |
| [ADR-034](./ADR-034-product-color-classification.md)              | 제품 색상 분류                                                                                                                    | accepted | 2026-01-19 |
| [ADR-035](./ADR-035-smart-link-routing.md)                        | 스마트 링크 라우팅                                                                                                                | accepted | 2026-01-19 |
| [ADR-036](./ADR-036-smart-combination-engine.md)                  | 스마트 조합 엔진                                                                                                                  | accepted | 2026-01-20 |
| [ADR-037](./ADR-037-gdpr-deletion-cron.md)                        | GDPR 삭제 크론                                                                                                                    | accepted | 2026-01-22 |
| [ADR-038](./ADR-038-rate-limiting.md)                             | Rate Limiting                                                                                                                     | accepted | 2026-01-22 |
| [ADR-039](./ADR-039-pc1-onboarding-stabilization.md)              | PC-1 온보딩 안정화                                                                                                                | accepted | 2026-01-23 |
| [ADR-040](./ADR-040-cie3-lighting-correction.md)                  | CIE-3 조명 보정 알고리즘                                                                                                          | accepted | 2026-01-23 |
| [ADR-041](./ADR-041-cie4-lighting-analysis.md)                    | CIE-4 조명 분석                                                                                                                   | accepted | 2026-01-23 |
| [ADR-042](./ADR-042-pc2-v2-architecture.md)                       | PC-2 v2 아키텍처                                                                                                                  | accepted | 2026-01-23 |
| [ADR-043](./ADR-043-s2-v2-architecture.md)                        | S-2 v2 아키텍처                                                                                                                   | accepted | 2026-01-23 |
| [ADR-044](./ADR-044-c2-v2-architecture.md)                        | C-2 v2 아키텍처                                                                                                                   | accepted | 2026-01-23 |
| [ADR-045](./ADR-045-sk1-procedure-recommendation.md)              | SK-1 피부시술 정보 제공                                                                                                           | accepted | 2026-01-23 |
| [ADR-046](./ADR-046-oh1-oral-health-analysis.md)                  | OH-1 구강건강 분석 모듈                                                                                                           | accepted | 2026-01-23 |
| [ADR-047](./ADR-047-w2-advanced-stretching.md)                    | W-2 고급 스트레칭                                                                                                                 | accepted | 2026-01-23 |
| [ADR-048](./ADR-048-accessibility-strategy.md)                    | 접근성 전략 (WCAG 2.1 AA)                                                                                                         | accepted | 2026-01-23 |
| [ADR-049](./ADR-049-cicd-pipeline.md)                             | CI/CD 파이프라인                                                                                                                  | accepted | 2026-01-23 |
| [ADR-050](./ADR-050-fashion-closet-crossmodule.md)                | Fashion-Closet 크로스모듈                                                                                                         | accepted | 2026-01-23 |
| [ADR-051](./ADR-051-2026-ux-trends.md)                            | 2026 UX 트렌드                                                                                                                    | accepted | 2026-01-23 |
| [ADR-052](./ADR-052-hair-analysis-architecture.md)                | H-1 헤어 분석 아키텍처                                                                                                            | accepted | 2026-01-23 |
| [ADR-053](./ADR-053-makeup-analysis-architecture.md)              | M-1 메이크업 분석 아키텍처                                                                                                        | accepted | 2026-01-23 |
| [ADR-054](./ADR-054-affiliate-first-monetization.md)              | 어필리에이트 우선 수익화 전략 v2.0 (ARPU 현실화, 광고 삭제)                                                                       | accepted | 2026-03-22 |
| [ADR-055](./ADR-055-multi-ai-backup-strategy.md)                  | Multi-AI 백업 전략                                                                                                                | accepted | 2026-01-24 |
| [ADR-056](./ADR-056-2026-marketing-strategy.md)                   | 2026 마케팅 전략                                                                                                                  | accepted | 2026-01-24 |
| [ADR-057](./ADR-057-design-system-v2.md)                          | 디자인 시스템 v2 (YIROOM IDENTITY)                                                                                                | accepted | 2026-01-24 |
| [ADR-058](./ADR-058-hub-pattern-deferral.md)                      | Hub 패턴 연기 결정                                                                                                                | accepted | 2026-01-24 |
| [ADR-059](./ADR-059-contextual-retrieval-deferral.md)             | Contextual Retrieval 적용 보류                                                                                                    | deferred | 2026-01-31 |
| [ADR-060](./ADR-060-claude-code-headless-mode.md)                 | Claude Code Headless Mode 도입 보류                                                                                               | deferred | 2026-01-31 |
| [ADR-061](./ADR-061-data-platform-architecture.md)                | 데이터 플랫폼 아키텍처                                                                                                            | accepted | 2026-02-01 |
| [ADR-062](./ADR-062-gradient-text-vertical-bug-fix.md)            | 그라디언트 텍스트 세로 버그 수정                                                                                                  | accepted | 2026-02-03 |
| [ADR-063](./ADR-063-pc1-terminology-simplification.md)            | PC-1 용어 단순화                                                                                                                  | accepted | 2026-02-05 |
| [ADR-064](./ADR-064-pc1-result-tab-consolidation.md)              | PC-1 결과 탭 통합                                                                                                                 | accepted | 2026-02-05 |
| [ADR-065](./ADR-065-pc1-mock-fallback-policy.md)                  | PC-1 AI 실패 시 Mock Fallback 금지                                                                                                | accepted | 2026-02-06 |
| [ADR-066](./ADR-066-ssot-consolidation-strategy.md)               | SSOT 통합 전략                                                                                                                    | accepted | 2026-02-06 |
| [ADR-067](./ADR-067-affiliate-partner-api-strategy.md)            | 어필리에이트 파트너 API 전략                                                                                                      | accepted | 2026-02-08 |
| [ADR-068](./ADR-068-analysis-api-db-resilience.md)                | 분석 API DB 저장 실패 시 합성 응답                                                                                                | accepted | 2026-03-03 |
| [ADR-069](./ADR-069-capsule-ecosystem-architecture.md)            | 캡슐 에코시스템 아키텍처                                                                                                          | proposed | 2026-03-03 |
| [ADR-070](./ADR-070-safety-profile-architecture.md)               | Safety Profile 기술 아키텍처                                                                                                      | proposed | 2026-03-03 |
| [ADR-071](./ADR-071-cross-module-scoring.md)                      | 크로스 모듈 호환성 스코어링 모델                                                                                                  | proposed | 2026-03-03 |
| [ADR-072](./ADR-072-virtual-fitting-extension.md)                 | 가상 피팅 L1-L2 확장 전략                                                                                                         | proposed | 2026-03-03 |
| [ADR-073](./ADR-073-one-button-daily.md)                          | One-Button Daily 엔진                                                                                                             | proposed | 2026-03-03 |
| [ADR-074](./ADR-074-capsule-extensibility.md)                     | 캡슐 확장성 전략                                                                                                                  | proposed | 2026-03-03 |
| [ADR-075](./ADR-075-shopping-companion.md)                        | 쇼핑 컴패니언 매칭 전략                                                                                                           | proposed | 2026-03-03 |
| [ADR-076](./ADR-076-home-3state-redesign.md)                      | 홈 화면 3-State 리디자인                                                                                                          | proposed | 2026-03-07 |
| [ADR-077](./ADR-077-concern-card-pattern.md)                      | ConcernCard 패턴 + MetricBarGaugeList Collapsible                                                                                 | accepted | 2026-03-07 |
| [ADR-078](./ADR-078-home-simulation-decisions.md)                 | 홈 3-State 사용자 시뮬레이션 기반 의사결정                                                                                        | accepted | 2026-03-07 |
| [ADR-079](./ADR-079-gemini-sdk-migration.md)                      | Gemini SDK 마이그레이션 (@google/genai)                                                                                           | accepted | 2026-03-07 |
| [ADR-080](./ADR-080-identity-first-result-framing.md)             | Identity-First 결과 프레이밍                                                                                                      | accepted | 2026-03-09 |
| [ADR-081](./ADR-081-ai-framing-principle.md)                      | AI 프레이밍 원칙                                                                                                                  | accepted | 2026-03-09 |
| [ADR-082](./ADR-082-report-block-moderation.md)                   | 신고/차단 모더레이션                                                                                                              | accepted | 2026-03-09 |
| [ADR-083](./ADR-083-connection-awareness-architecture.md)         | ConnectionAwareness 아키텍처                                                                                                      | accepted | 2026-03-10 |
| [ADR-084](./ADR-084-gender-neutralization-strategy.md)            | 성별 중립화 전략 (K-1)                                                                                                            | accepted | 2026-03-10 |
| [ADR-085](./ADR-085-analysis-api-composable-helpers.md)           | 분석 API 조합형 헬퍼                                                                                                              | accepted | 2026-03-10 |
| [ADR-086](./ADR-086-mobile-gap-sync.md)                           | 모바일 격차 해소 Thin Client 이식                                                                                                 | accepted | 2026-03-11 |
| [ADR-087](./ADR-087-skin-diary.md)                                | 피부 일기 자동 기록 시계열 트렌드                                                                                                 | accepted | 2026-03-12 |
| [ADR-088](./ADR-088-vto-mobile-rendering.md)                      | VTO 모바일 서버 렌더링 전략                                                                                                       | accepted | 2026-03-12 |
| [ADR-089](./ADR-089-biorhythm-wellness-integration.md)            | 바이오리듬 웰니스 통합                                                                                                            | accepted | 2026-03-13 |
| [ADR-090](./ADR-090-stress-skin-visualization.md)                 | 스트레스→피부 영향 시각화                                                                                                         | accepted | 2026-03-15 |
| [ADR-091](./ADR-091-cross-domain-challenge-system.md)             | 크로스도메인 챌린지 시스템                                                                                                        | accepted | 2026-03-15 |
| [ADR-092](./ADR-092-review-ai-analysis.md)                        | 리뷰 AI 분석 시스템                                                                                                               | accepted | 2026-03-15 |
| [ADR-093](./ADR-093-vto-product-bridge.md)                        | Virtual Try-On 제품 브릿지                                                                                                        | accepted | 2026-03-15 |
| [ADR-094](./ADR-094-coupon-promotion-system.md)                   | 쿠폰/프로모션 시스템                                                                                                              | accepted | 2026-03-15 |
| [ADR-095](./ADR-095-ux-simulation-improvements.md)                | 페르소나 기반 UX 시뮬레이션 개선                                                                                                  | accepted | 2026-03-15 |
| [ADR-096](./ADR-096-expo-monorepo-entry-patch.md)                 | Expo 모노레포 진입점 패치                                                                                                         | accepted | 2026-03-17 |
| [ADR-097](./ADR-097-visual-overlay-anonymous-share.md)            | 분석 결과 시각적 오버레이 + 익명 공유 아키텍처                                                                                    | proposed | 2026-03-28 |
| [ADR-098](./ADR-098-identity-redefinition-5axis-model.md)         | 이룸 정체성 재정의 — 5축 모델 확정 및 모듈 구조 정리                                                                              | accepted | 2026-04-22 |
| [ADR-099](./ADR-099-integrated-analysis-flow.md)                  | 통합 분석 플로우 — 5축 병렬 분석 아키텍처                                                                                         | accepted | 2026-04-23 |
| [ADR-100](./ADR-100-integrated-analysis-ui.md)                    | 통합 분석 UI — 입력 페이지 + 결과 페이지 아키텍처                                                                                 | accepted | 2026-04-23 |
| [ADR-101](./ADR-101-integrated-cta-unification.md)                | 통합 분석 CTA 일원화 — 랜딩 + 홈 진입점 통일                                                                                      | accepted | 2026-04-24 |
| [ADR-102](./ADR-102-mobile-integrated-porting.md)                 | 모바일 통합 분석 플로우 포팅 — 웹 API 재사용 방식                                                                                 | accepted | 2026-04-24 |
| [ADR-103](./ADR-103-cross-origin-mobile-access.md)                | 통합 분석 API 크로스 오리진 접근 허용 — 모바일 클라이언트                                                                         | accepted | 2026-04-24 |
| [ADR-104](./ADR-104-yiroom-launch-criteria.md)                    | 이룸 출시 조건 체크리스트 — 비전 완성 기준                                                                                        | accepted | 2026-04-24 |
| [ADR-105](./ADR-105-color-harmony-engine.md)                      | 배색 엔진 — 진단 위에 배색 알고리즘(LCh 회전)                                                                                     | accepted | 2026-05-16 |
| [ADR-106](./ADR-106-demo-positioning-and-investment-staging.md)   | 데모/투자 포지셔닝 — 진단 우선, 커머스 컨설턴트=use of funds, 룩핀·화해 차별점                                                    | accepted | 2026-06-17 |
| [ADR-107](./ADR-107-recommendation-model-single-vs-cross-axis.md) | 추천 모델 — 단일축 즉시추천 + 크로스축 종합 컨설팅(2-tier), 조언/쇼핑 분리                                                        | accepted | 2026-06-17 |
| [ADR-108](./ADR-108-axis-accuracy-upgrade-roadmap.md)             | 축별 정확도 업그레이드 로드맵 — 방법론·연구 매핑(ASTM·셀카TEWL·디지털드레이핑), 체형(A) 우선                                      | accepted | 2026-06-17 |
| [ADR-109](./ADR-109-profile-centric-analysis-architecture.md)     | 프로필 중심 분석 아키텍처 — 통합/개별→"하나의 나", 변동 3그룹·2층 추천·1회 캡처·솔루션 무손실                                     | accepted | 2026-06-19 |
| [ADR-110](./ADR-110-3d-body-avatar-visualization.md)              | 3D 체형 아바타 — 절차적 파라메트릭 메시(SMPL 원리 차용·에셋 비의존), 스타일라이즈드·결정론                                        | accepted | 2026-07-08 |
| [ADR-111](./ADR-111-one-canon-ia.md)                              | One Canon IA — 정보 유형별 정본 1곳(진입=ProfileCardGrid·심화=개별결과·통합=세션고유물·제품=MatchedProducts·루틴=generateRoutine) | accepted | 2026-07-09 |
| [ADR-112](./ADR-112-product-fit-scan.md)                          | 제품 스캔 "나와의 적합도" — 절대등급 배제·식약처 1차 데이터·문헌 인용 타임라인·법적 표현 코드화                                   | accepted | 2026-07-09 |

## ADR 카테고리

### 핵심 아키텍처 (Core Architecture)

- ADR-001: Core Image Engine
- ADR-005: 모노레포 구조
- ADR-006: Phase 실행 순서
- ADR-069: 캡슐 에코시스템 아키텍처
- **ADR-098: 이룸 정체성 재정의 — 5축 모델 확정 (2026-04-22)** ⭐ 최상위 정체성 선언
- **ADR-099: 통합 분석 플로우 — 5축 병렬 분석 (2026-04-23)** ⭐ ADR-098 실현 메커니즘
- **ADR-104: 이룸 출시 조건 체크리스트 — 비전 완성 기준 (2026-04-24)** ⭐ 비전 완성 판정 규칙
- **ADR-106: 데모/투자 포지셔닝 — 진단 우선, 커머스 컨설턴트=use of funds (2026-06-17)** ⭐ 지원서/로드맵 서술 기준 + 룩핀·화해 차별점
- **ADR-107: 추천 모델 — 단일축 즉시추천 + 크로스축 종합 컨설팅 (2026-06-17)** ⭐ 각 축이 어디서 추천하나 + 통합=차별점 근거
- **ADR-108: 축별 정확도 업그레이드 로드맵 (2026-06-17)** ⭐ 방법론·연구 매핑 + 체형(A) 우선, 지원서 기술 로드맵 근거
- **ADR-109: 프로필 중심 분석 아키텍처 (2026-06-19)** ⭐ "분석 도구"→"채워지는 나" 전환, 변동 3그룹·2층 추천·솔루션 무손실 (구현 Phase 0~4)
- ADR-110: 3D 체형 아바타 시각화 (2026-07-08) — 절차적 파라메트릭 메시, SMPL 라이선스 회피, body_analyses 단일 소스 + BodyRatios 저장 시작 (Phase 4 잔여)
- **ADR-111: One Canon IA — 정보 유형별 정본 1곳 (2026-07-09)** ⭐ "중구난방" 해소 — /analysis 허브 폐지, 통합 결과=컨설팅 리포트(세션 고유물만), 제품·루틴 정본 단일화

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
- ADR-065: PC-1 AI 실패 시 Mock Fallback 금지
- ADR-067: 어필리에이트 파트너 API 전략
- ADR-068: 분석 API DB 저장 실패 시 합성 응답
- ADR-079: Gemini SDK 마이그레이션 (@google/genai)
- ADR-085: 분석 API 조합형 헬퍼

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
- ADR-086: 모바일 격차 해소 Thin Client 이식
- ADR-088: VTO 모바일 서버 렌더링 전략
- ADR-102: 모바일 통합 분석 플로우 포팅 — 웹 API 재사용 (2026-04-24)
- ADR-103: 통합 분석 API 크로스 오리진 접근 허용 (2026-04-24)

### 확장성 (Scalability)

- ADR-018: 국제화(i18n) 아키텍처
- ADR-074: 캡슐 확장성 전략

### 법적 준수/보안 (Legal/Security)

- ADR-022: 연령 인증 아키텍처
- ADR-023: 약관 동의 플로우
- ADR-024: AI 투명성 표시
- ADR-025: 감사 로깅 아키텍처
- ADR-037: GDPR 삭제 크론
- ADR-038: Rate Limiting
- ADR-070: Safety Profile 기술 아키텍처

### 소셜/상거래 (Social/Commerce)

- ADR-028: 소셜 피드 아키텍처
- ADR-029: 어필리에이트 통합
- ADR-035: 스마트 링크 라우팅
- ADR-036: 스마트 조합 엔진
- ADR-054: 어필리에이트 우선 수익화 전략
- ADR-056: 2026 마케팅 전략
- ADR-075: 쇼핑 컴패니언 매칭 전략
- ADR-082: 신고/차단 모더레이션
- ADR-092: 리뷰 AI 분석 시스템
- ADR-093: Virtual Try-On 제품 브릿지
- ADR-094: 쿠폰/프로모션 시스템

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
- ADR-072: 가상 피팅 L1-L2 확장 전략
- ADR-087: 피부 일기 시계열 트렌드

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
- ADR-073: One-Button Daily 엔진
- ADR-076: 홈 화면 3-State 리디자인
- ADR-077: ConcernCard 패턴 + MetricBarGaugeList Collapsible
- ADR-078: 홈 3-State 사용자 시뮬레이션 기반 의사결정
- ADR-095: 페르소나 기반 UX 시뮬레이션 개선
- ADR-096: Expo 모노레포 진입점 패치
- ADR-062: 그라디언트 텍스트 세로 버그 수정
- ADR-063: PC-1 용어 단순화
- ADR-064: PC-1 결과 탭 통합
- ADR-080: Identity-First 결과 프레이밍
- ADR-081: AI 프레이밍 원칙
- ADR-097: 분석 결과 시각적 오버레이 + 익명 공유 아키텍처
- ADR-100: 통합 분석 UI — 입력 페이지 + 결과 페이지 아키텍처 (2026-04-23)
- ADR-101: 통합 분석 CTA 일원화 — 랜딩 + 홈 진입점 통일 (2026-04-24)

### 데이터 통합 (Data Consolidation)

- ADR-066: SSOT 통합 전략

### DevOps/인프라 (DevOps/Infrastructure)

- ADR-049: CI/CD 파이프라인
- ADR-060: Claude Code Headless Mode 도입 보류 (deferred)

### 크로스 모듈 (Cross-Module)

- ADR-050: Fashion-Closet 크로스모듈
- ADR-071: 크로스 모듈 호환성 스코어링 모델
- ADR-083: ConnectionAwareness 아키텍처
- ADR-084: 성별 중립화 전략 (K-1)
- ADR-091: 크로스도메인 챌린지 시스템

### 웰니스/바이오리듬 (Wellness/Biorhythm)

- ADR-089: 바이오리듬 웰니스 통합
- ADR-090: 스트레스→피부 영향 시각화

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

**Version**: 12.0 | **Updated**: 2026-03-26 | ADR-069~079 누락분 추가 (캡슐에코시스템, SafetyProfile, 크로스모듈스코어링, 가상피팅, OneButtonDaily, 캡슐확장성, 쇼핑컴패니언, 홈3State, ConcernCard, 홈시뮬레이션, GeminiSDK)
