# 스펙 문서 인덱스 (SDD Index)

> **Version**: 3.0 | **Created**: 2026-01-19 | **Updated**: 2026-03-26

> 이룸 프로젝트 스펙 문서 (Software Design Document) 인덱스
> P7 워크플로우: 리서치 → 원리 → ADR → **스펙** → 구현

---

## P3 원자 분해 현황

> P3 원칙: 모든 작업은 2시간 이내, 독립 테스트 가능한 원자로 분해

### P3 완료 핵심 SDD (16개)

| 모듈                    | SDD                               | P3 상태 | ATOM 수 |
| ----------------------- | --------------------------------- | ------- | ------- |
| **영양 (N-1)**          | SDD-N1-NUTRITION                  | ✅ 완료 | 11개    |
| **운동 (W-1)**          | SDD-W1-WORKOUT                    | ✅ 완료 | 13개    |
| **퍼스널컬러 v2**       | SDD-PERSONAL-COLOR-v2             | ✅ 완료 | 12개    |
| **피부 v2**             | SDD-SKIN-ANALYSIS-v2              | ✅ 완료 | 10개+   |
| **체형 v2**             | SDD-BODY-ANALYSIS-v2              | ✅ 완료 | 10개+   |
| **Hybrid 데이터**       | SDD-HYBRID-DATA-EXTENSION         | ✅ 완료 | 6개     |
| **AI 투명성**           | SDD-AI-TRANSPARENCY               | ✅ 완료 | 5개     |
| **감사 로깅**           | SDD-AUDIT-LOGGING                 | ✅ 완료 | 7개     |
| **GDPR 삭제**           | SDD-GDPR-DELETION-CRON            | ✅ 완료 | 4개     |
| **Rate Limiting**       | SDD-RATE-LIMITING                 | ✅ 완료 | 5개     |
| **크로스모듈 프로토콜** | SDD-CROSS-MODULE-PROTOCOL         | ✅ 완료 | 8개     |
| **접근성 가이드**       | SDD-ACCESSIBILITY-GUIDELINES      | ✅ 완료 | 6개     |
| **Hub 패턴**            | SDD-HUB-PATTERN                   | ✅ 완료 | 8개     |
| **스마트 조합 엔진**    | SDD-SMART-COMBINATION-ENGINE      | ✅ 완료 | 15개    |
| **패션-옷장 통합**      | SDD-FASHION-CLOSET-INTEGRATION    | ✅ 완료 | 20개    |
| **Phase-K 종합**        | SDD-PHASE-K-COMPREHENSIVE-UPGRADE | ✅ 완료 | 26개    |

### P3 체크리스트 (스펙 작성 시 확인)

```
□ 모든 원자가 2시간 이내
□ 모든 원자에 소요시간 명시
□ 모든 원자에 의존성 명시
□ 모든 원자에 입력/출력 스펙
□ 모든 원자에 성공 기준
□ 의존성 그래프 시각화 (Mermaid)
□ 파일 배치 위치 명시
```

---

## 빠른 탐색

| 카테고리                                  | 문서 수 | 상태          |
| ----------------------------------------- | ------- | ------------- |
| [분석 모듈](#1-분석-모듈-pc-1-s-1-c-1)    | 25개    | 대부분 구현됨 |
| [이미지 엔진](#2-이미지-엔진-cie)         | 6개     | 부분 구현     |
| [웰니스 모듈](#3-웰니스-모듈-n-1-w-1)     | 6개     | 구현됨/계획됨 |
| [법률/규정 준수](#4-법률규정-준수)        | 8개     | 구현됨        |
| [AI 기능](#5-ai-기능)                     | 5개     | 부분 구현     |
| [UX/디자인](#6-ux디자인)                  | 16개    | 부분 구현     |
| [소셜/수익화](#7-소셜수익화)              | 4개     | 계획됨/구현됨 |
| [메타/계획](#8-메타계획)                  | 11개    | 참조 문서     |
| [스마트 매칭/조합](#9-스마트-매칭조합)    | 2개     | 작성됨        |
| [쇼핑 고도화](#13-쇼핑-고도화)            | 3개     | 구현됨        |
| [인프라/DevOps](#10-인프라devops)         | 3개     | 계획됨        |
| [크로스 모듈](#11-크로스-모듈)            | 5개     | 부분 구현     |
| [웰니스/바이오리듬](#12-웰니스바이오리듬) | 2개     | 구현됨        |

**총 문서 수**: 95개

---

## 1. 분석 모듈 (PC-1, S-1, C-1)

### 피부 분석 (S-1)

| 문서                                                              | 상태      | 설명                    | 관련 ADR         |
| ----------------------------------------------------------------- | --------- | ----------------------- | ---------------- |
| [SDD-S-1-SKIN-ANALYSIS](SDD-S-1-SKIN-ANALYSIS.md)                 | 구현됨    | S-1 피부 분석 통합 스펙 | ADR-001, ADR-010 |
| [SDD-S1-PROFESSIONAL-ANALYSIS](SDD-S1-PROFESSIONAL-ANALYSIS.md)   | 구현됨    | 전문가 수준 피부 분석   | ADR-001, ADR-010 |
| [SDD-S1-SKINCARE-SOLUTION-TAB](SDD-S1-SKINCARE-SOLUTION-TAB.md)   | 구현됨    | 스킨케어 솔루션 탭      | ADR-010          |
| [SDD-S1-UX-IMPROVEMENT](SDD-S1-UX-IMPROVEMENT.md)                 | 구현됨    | S-1 UX 개선             | ADR-010          |
| [SDD-S1-C1-UX-IMPROVEMENT](SDD-S1-C1-UX-IMPROVEMENT.md)           | 구현됨    | S-1/C-1 통합 UX         | ADR-011          |
| [SDD-VISUAL-SKIN-REPORT](SDD-VISUAL-SKIN-REPORT.md)               | 구현됨    | 시각적 피부 리포트      | ADR-001          |
| [SDD-PHASE-E-SKIN-ZOOM](SDD-PHASE-E-SKIN-ZOOM.md)                 | 부분 구현 | 피부 확대 분석          | ADR-001          |
| [SDD-PHASE-D-SKIN-CONSULTATION](SDD-PHASE-D-SKIN-CONSULTATION.md) | 계획됨    | AI 피부 상담            | ADR-021          |
| [SDD-SKIN-DIARY](SDD-SKIN-DIARY.md)                               | 구현됨    | 피부 일기 시계열 트렌드 | ADR-087          |

### 퍼스널컬러 (PC-1)

| 문서                                                                  | 상태      | 설명                 | 관련 ADR         |
| --------------------------------------------------------------------- | --------- | -------------------- | ---------------- |
| [SDD-PC-1-PERSONAL-COLOR](SDD-PC-1-PERSONAL-COLOR.md)                 | 구현됨    | PC-1 통합 스펙       | ADR-001, ADR-003 |
| [PC1-detailed-evidence-report](PC1-detailed-evidence-report.md)       | 구현됨    | 상세 근거 리포트     | ADR-001, ADR-003 |
| [SDD-PHASE-J-AI-STYLING](SDD-PHASE-J-AI-STYLING.md)                   | 구현됨    | AI 스타일링 Phase J  | ADR-003, ADR-010 |
| [SDD-PHASE-J-P2-ACCESSORY-MAKEUP](SDD-PHASE-J-P2-ACCESSORY-MAKEUP.md) | 구현됨    | 액세서리/메이크업    | ADR-010          |
| [SDD-PHASE-J-P3-FULL-OUTFIT](SDD-PHASE-J-P3-FULL-OUTFIT.md)           | 계획됨    | 전체 코디네이션      | ADR-010          |
| [SDD-AUTO-COLOR-CLASSIFICATION](SDD-AUTO-COLOR-CLASSIFICATION.md)     | 구현됨    | 자동 컬러 분류       | ADR-034          |
| [SDD-CAPSULE-WARDROBE](SDD-CAPSULE-WARDROBE.md)                       | 구현됨    | 캡슐 워드로브        | ADR-069          |
| [SDD-PERSONAL-COLOR-v2](SDD-PERSONAL-COLOR-v2.md)                     | 스펙 완료 | 퍼스널컬러 v2 (PC-2) | ADR-001, ADR-003 |

### 피부 분석 v2 (S-2)

| 문서                                            | 상태      | 설명                     | 관련 ADR         |
| ----------------------------------------------- | --------- | ------------------------ | ---------------- |
| [SDD-SKIN-ANALYSIS-v2](SDD-SKIN-ANALYSIS-v2.md) | 스펙 완료 | 전문가 수준 피부 분석 v2 | ADR-001, ADR-010 |

### 체형 분석 (C-1)

| 문서                                            | 상태      | 설명               | 관련 ADR |
| ----------------------------------------------- | --------- | ------------------ | -------- |
| [SDD-BODY-ANALYSIS](SDD-BODY-ANALYSIS.md)       | 구현됨    | 체형 분석 모듈     | ADR-001  |
| [SDD-BODY-ANALYSIS-v2](SDD-BODY-ANALYSIS-v2.md) | 스펙 완료 | 체형 분석 v2 (C-2) | ADR-001  |

### 헤어/메이크업 분석

| 문서                                          | 상태   | 설명                                                        | 관련 ADR                                                  |
| --------------------------------------------- | ------ | ----------------------------------------------------------- | --------------------------------------------------------- |
| [SDD-HAIR-ANALYSIS](SDD-HAIR-ANALYSIS.md)     | 작성됨 | H-1 헤어 분석 (얼굴형, 헤어컬러, 모발 타입)                 | [ADR-052](../adr/ADR-052-hair-analysis-architecture.md)   |
| [SDD-MAKEUP-ANALYSIS](SDD-MAKEUP-ANALYSIS.md) | 작성됨 | M-1 메이크업 분석 (립, 아이, 블러셔, 컨투어링)              | [ADR-053](../adr/ADR-053-makeup-analysis-architecture.md) |
| [SDD-MAKEUP-ENGINE](SDD-MAKEUP-ENGINE.md)     | 작성됨 | M-1 메이크업 분석 + Virtual Try-On 엔진 (5 엔진, 에러 처리) | [ADR-053](../adr/ADR-053-makeup-analysis.md)              |

### 통합 분석 플로우 (5축 병렬)

| 문서                                                          | 상태                                        | 설명                                                                                                        | 관련 ADR                                                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SDD-INTEGRATED-ANALYSIS](SDD-INTEGRATED-ANALYSIS.md)         | implemented (Phase A, F.3 연결)             | 5축(PC/S/C/H/M) 병렬 분석 API + 세션 테이블 + Partial Success + 실제 Gemini 연결 (22 tests pass)            | [ADR-099](../adr/ADR-099-integrated-analysis-flow.md), [ADR-098](../adr/ADR-098-identity-redefinition-5axis-model.md), [ADR-104](../adr/ADR-104-yiroom-launch-criteria.md) |
| [SDD-INTEGRATED-RESULT-UI](SDD-INTEGRATED-RESULT-UI.md)       | implemented (Phase B + F.1/F.2/F.4/F.5 + G) | 입력 + 결과 UI + Storage + persona/action-plan/cross-insights/curation + Phase G 링크 보강 (85+ tests pass) | [ADR-100](../adr/ADR-100-integrated-analysis-ui.md), [ADR-104](../adr/ADR-104-yiroom-launch-criteria.md)                                                                   |
| [SDD-PHASE-C-CTA-UNIFICATION](SDD-PHASE-C-CTA-UNIFICATION.md) | implemented (Phase C)                       | 랜딩 + 홈 CTA를 통합 플로우로 일원화 (6 tests pass)                                                         | [ADR-101](../adr/ADR-101-integrated-cta-unification.md)                                                                                                                    |
| [SDD-MOBILE-INTEGRATED](SDD-MOBILE-INTEGRATED.md)             | implemented (Phase D + G 포팅)              | 모바일 입력/결과/CTA + 큐레이션 링크 보강 (`useHasClosetItems` 훅 + 파라미터 수신) (13+10 tests pass)       | [ADR-102](../adr/ADR-102-mobile-integrated-porting.md)                                                                                                                     |

### Phase 1.5 (출시 후 4~8주, 사전 SDD 작성)

| 문서                                                        | 상태       | 설명                                                                                              | 관련 ADR                                                                         |
| ----------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [SDD-PROFILE-CARD-PHASE-1.5](SDD-PROFILE-CARD-PHASE-1.5.md) | 초안 (0.1) | "나 프로필" 통합 카드 — 5축 결과를 홈 상단에 압축 노출 (`PROFILE_CARD_PHASE_1_5` 플래그)          | [ADR-098](../adr/ADR-098-identity-redefinition-5axis-model.md) §6 R1             |
| [SDD-CLOSET-INVENTORY-WEB](SDD-CLOSET-INVENTORY-WEB.md)     | 초안 (0.1) | 웹 옷장 등록/편집/매칭 UI — 모바일 1:1 포팅 + 매칭 로직 shared 이관 (`CLOSET_INTEGRATION` 플래그) | [ADR-098](../adr/ADR-098-identity-redefinition-5axis-model.md) §0 의도적 제외 #2 |

### Virtual Try-On

| 문서                                                            | 상태      | 설명                          | 관련 ADR |
| --------------------------------------------------------------- | --------- | ----------------------------- | -------- |
| [SDD-VIRTUAL-TRY-ON-EXTENSION](SDD-VIRTUAL-TRY-ON-EXTENSION.md) | 작성됨    | 가상 시착 확장 v1 (Phase L)   | -        |
| [SDD-VIRTUAL-TRY-ON-V2](SDD-VIRTUAL-TRY-ON-V2.md)               | 부분 구현 | 가상 시착 v2 (립/블러셔/헤어) | ADR-072  |

---

## 2. 이미지 엔진 (CIE)

| 문서                                                          | 상태      | 설명                     | 관련 ADR                                                                                              |
| ------------------------------------------------------------- | --------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| [SDD-CIE-IMAGE-PIPELINE](SDD-CIE-IMAGE-PIPELINE.md)           | 부분 구현 | **통합 파이프라인 스펙** | [ADR-001](../adr/ADR-001-core-image-engine.md)                                                        |
| [SDD-CIE-1-IMAGE-QUALITY](SDD-CIE-1-IMAGE-QUALITY.md)         | 부분 구현 | 이미지 품질 검증         | [ADR-001](../adr/ADR-001-core-image-engine.md)                                                        |
| [SDD-CIE-2-FACE-DETECTION](SDD-CIE-2-FACE-DETECTION.md)       | 구현됨    | 얼굴 감지 (80%)          | [ADR-001](../adr/ADR-001-core-image-engine.md), [ADR-033](../adr/ADR-033-face-detection-library.md)   |
| [SDD-CIE-3-AWB-CORRECTION](SDD-CIE-3-AWB-CORRECTION.md)       | 계획됨    | 화이트 밸런스 보정       | [ADR-001](../adr/ADR-001-core-image-engine.md), [ADR-040](../adr/ADR-040-cie3-lighting-correction.md) |
| [SDD-CIE-4-LIGHTING-ANALYSIS](SDD-CIE-4-LIGHTING-ANALYSIS.md) | 계획됨    | 조명 분석                | [ADR-001](../adr/ADR-001-core-image-engine.md), [ADR-041](../adr/ADR-041-cie4-lighting-analysis.md)   |
| [SDD-CIE-P3-DECOMPOSITION](SDD-CIE-P3-DECOMPOSITION.md)       | 참조 문서 | CIE-2/3/4 P3 원자 분해   | [ADR-001](../adr/ADR-001-core-image-engine.md)                                                        |

---

## 3. 웰니스 모듈 (N-1, W-1)

| 문서                                                                      | 상태   | 설명                         | 관련 ADR                                            |
| ------------------------------------------------------------------------- | ------ | ---------------------------- | --------------------------------------------------- |
| [SDD-N1-NUTRITION](SDD-N1-NUTRITION.md)                                   | 구현됨 | 영양 모듈 (BMR/TDEE, 바코드) | [ADR-030](../adr/ADR-030-nutrition-module.md)       |
| [SDD-W1-WORKOUT](SDD-W1-WORKOUT.md)                                       | 구현됨 | 운동 모듈 (5-Type, MET)      | [ADR-031](../adr/ADR-031-workout-module.md)         |
| [cross-module-insights-hair-makeup](cross-module-insights-hair-makeup.md) | 구현됨 | 크로스 모듈 인사이트         | ADR-011                                             |
| [SDD-W-2-ADVANCED-STRETCHING](SDD-W-2-ADVANCED-STRETCHING.md)             | 계획됨 | 고급 스트레칭 (W-2)          | [ADR-047](../adr/ADR-047-w2-advanced-stretching.md) |

### 피부 시술 (SK-1)

| 문서                                                                      | 상태   | 설명              | 관련 ADR                                                  |
| ------------------------------------------------------------------------- | ------ | ----------------- | --------------------------------------------------------- |
| [SDD-SK-1-PROCEDURE-RECOMMENDATION](SDD-SK-1-PROCEDURE-RECOMMENDATION.md) | 계획됨 | AI 피부 시술 추천 | [ADR-045](../adr/ADR-045-sk1-procedure-recommendation.md) |

### 구강 건강 (OH-1)

| 문서                                            | 상태   | 설명                                   | 관련 ADR                                              |
| ----------------------------------------------- | ------ | -------------------------------------- | ----------------------------------------------------- |
| [SDD-OH-1-ORAL-HEALTH](SDD-OH-1-ORAL-HEALTH.md) | 작성됨 | OH-1 구강 건강 분석 (치아, 잇몸, 위생) | [ADR-046](../adr/ADR-046-oh1-oral-health-analysis.md) |

---

## 4. 법률/규정 준수

| 문서                                                    | 상태   | 설명                        | 관련 ADR                                        |
| ------------------------------------------------------- | ------ | --------------------------- | ----------------------------------------------- |
| [SDD-N-1-AGE-VERIFICATION](SDD-N-1-AGE-VERIFICATION.md) | 구현됨 | 연령 확인 (만 14세)         | [ADR-022](../adr/ADR-022-age-verification.md)   |
| [SDD-AI-TRANSPARENCY](SDD-AI-TRANSPARENCY.md)           | 구현됨 | AI 투명성 고지              | [ADR-024](../adr/ADR-024-ai-transparency.md)    |
| [SDD-AUDIT-LOGGING](SDD-AUDIT-LOGGING.md)               | 구현됨 | 감사 로그 시스템            | [ADR-025](../adr/ADR-025-audit-logging.md)      |
| [SDD-LEGAL-SUPPORT](SDD-LEGAL-SUPPORT.md)               | 구현됨 | 법적 지원 기능              | ADR-023                                         |
| [SDD-GDPR-DELETION-CRON](SDD-GDPR-DELETION-CRON.md)     | 구현됨 | GDPR 데이터 삭제 크론       | [ADR-037](../adr/ADR-037-gdpr-deletion-cron.md) |
| [SDD-RATE-LIMITING](SDD-RATE-LIMITING.md)               | 구현됨 | Rate Limiting               | [ADR-038](../adr/ADR-038-rate-limiting.md)      |
| [SDD-SAFETY-PROFILE](SDD-SAFETY-PROFILE.md)             | 구현됨 | 안전성 프로필               | ADR-070                                         |
| [SDD-SOCIAL-LOGIN](SDD-SOCIAL-LOGIN.md)                 | 구현됨 | 소셜 로그인 (카카오/네이버) | ADR-004                                         |

---

## 5. AI 기능

| 문서                                                                                  | 상태        | 설명                                 | 관련 ADR         |
| ------------------------------------------------------------------------------------- | ----------- | ------------------------------------ | ---------------- |
| [SDD-COACH-AI-CHAT](SDD-COACH-AI-CHAT.md)                                             | 구현됨      | AI 코치 채팅                         | ADR-021          |
| [SDD-COACH-AI-COMPREHENSIVE](SDD-COACH-AI-COMPREHENSIVE.md)                           | 대부분 구현 | AI 코치 종합 (RAG, 가드레일, 심리학) | ADR-021, ADR-027 |
| [SDD-HYBRID-DATA-EXTENSION](SDD-HYBRID-DATA-EXTENSION.md)                             | 구현됨      | 하이브리드 데이터 패턴               | ADR-014          |
| [SDD-PROFESSIONAL-ENHANCEMENT](SDD-PROFESSIONAL-ENHANCEMENT.md)                       | 부분 구현   | 전문가 기능 강화                     | ADR-010          |
| [SDD-PROFESSIONAL-ENHANCEMENT-SUPPLEMENT](SDD-PROFESSIONAL-ENHANCEMENT-SUPPLEMENT.md) | 계획됨      | 전문가 기능 보충                     | ADR-010          |

---

## 6. UX/디자인

| 문서                                                                      | 상태      | 설명                                                  | 관련 ADR                                                    |
| ------------------------------------------------------------------------- | --------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| [SDD-GLOBAL-DESIGN-SPECIFICATION](SDD-GLOBAL-DESIGN-SPECIFICATION.md)     | 구현됨    | 글로벌 디자인 시스템                                  | -                                                           |
| [SDD-2026-UX-TRENDS](SDD-2026-UX-TRENDS.md)                               | 계획됨    | 2026 UX 트렌드 적용                                   | [ADR-051](../adr/ADR-051-2026-ux-trends.md)                 |
| [SDD-UX-SIMULATION-V1](SDD-UX-SIMULATION-V1.md)                           | 구현됨    | 페르소나 UX 시뮬레이션 개선                           | [ADR-095](../adr/ADR-095-ux-simulation-improvements.md)     |
| [SDD-ACCESSIBILITY](SDD-ACCESSIBILITY.md)                                 | 부분 구현 | 접근성 (WCAG 2.1 AA)                                  | [ADR-048](../adr/ADR-048-accessibility-strategy.md)         |
| [SDD-ACCESSIBILITY-GUIDELINES](SDD-ACCESSIBILITY-GUIDELINES.md)           | 구현됨    | 접근성 가이드라인 (WCAG 2.1)                          | -                                                           |
| [SDD-MARKETING-TOGGLE-UI](SDD-MARKETING-TOGGLE-UI.md)                     | 구현됨    | 마케팅 토글 UI                                        | ADR-029                                                     |
| [SDD-MY-INFO-SECTION](SDD-MY-INFO-SECTION.md)                             | 구현됨    | 내 정보 섹션                                          | -                                                           |
| [SDD-GAP-FIXES](SDD-GAP-FIXES.md)                                         | 구현됨    | 갭 수정 사항                                          | -                                                           |
| [SDD-PHASE-K-COMPREHENSIVE-UPGRADE](SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md) | 스펙 완료 | Phase K 종합 업그레이드                               | -                                                           |
| [SDD-GLOBAL-PARTNERS-EXPANSION](SDD-GLOBAL-PARTNERS-EXPANSION.md)         | 계획됨    | 글로벌 파트너 확장                                    | -                                                           |
| [SDD-PC1-ONBOARDING](SDD-PC1-ONBOARDING.md)                               | 구현됨    | PC-1 온보딩 플로우                                    | [ADR-039](../adr/ADR-039-pc1-onboarding-stabilization.md)   |
| [SDD-LOGO-IDENTITY](SDD-LOGO-IDENTITY.md)                                 | 작성됨    | 로고 아이덴티티 스펙                                  | [ADR-057](../adr/ADR-057-design-system-v2.md)               |
| [SDD-VISUAL-ENHANCEMENT](SDD-VISUAL-ENHANCEMENT.md)                       | 구현 완료 | 7모듈 시각적 오버레이 + 익명 공유 (42 ATOM, 71 tests) | [ADR-097](../adr/ADR-097-visual-overlay-anonymous-share.md) |
| [SDD-HOME-3STATE](SDD-HOME-3STATE.md)                                     | 구현됨    | 홈 3-State 리디자인                                   | [ADR-076](../adr/ADR-076-home-3state-redesign.md)           |
| [SDD-CONCERN-CARD](SDD-CONCERN-CARD.md)                                   | 구현됨    | ConcernCard 시각화 패턴                               | [ADR-077](../adr/ADR-077-concern-card-pattern.md)           |
| [SDD-ANALYSIS-RESULT-STANDARD](SDD-ANALYSIS-RESULT-STANDARD.md)           | 작성됨    | 분석 결과 화면 100점 표준                             | -                                                           |
| [SDD-HUB-PATTERN](SDD-HUB-PATTERN.md)                                     | 연기됨    | 분석 모듈 Hub 패턴                                    | [ADR-058](../adr/ADR-058-hub-pattern-deferral.md)           |

---

## 7. 소셜/수익화

| 문서                                                      | 상태   | 설명                    | 관련 ADR                                                |
| --------------------------------------------------------- | ------ | ----------------------- | ------------------------------------------------------- |
| [SDD-SOCIAL-FEED](SDD-SOCIAL-FEED.md)                     | 구현됨 | 소셜 피드 기능          | ADR-028                                                 |
| [SDD-AFFILIATE-INTEGRATION](SDD-AFFILIATE-INTEGRATION.md) | 구현됨 | 어필리에이트 통합       | ADR-029                                                 |
| [SDD-DATA-PLATFORM-L1](SDD-DATA-PLATFORM-L1.md)           | 계획됨 | 데이터 플랫폼 (Phase L) | [ADR-061](../adr/ADR-061-data-platform-architecture.md) |
| [SDD-MODERATION](SDD-MODERATION.md)                       | 구현됨 | 모더레이션 (신고/차단)  | ADR-082                                                 |

---

## 8. 메타/계획

| 문서                                                          | 설명                       | 용도                |
| ------------------------------------------------------------- | -------------------------- | ------------------- |
| [SDD-MASTER-REFACTORING-PLAN](SDD-MASTER-REFACTORING-PLAN.md) | 마스터 리팩토링 계획       | 프로젝트 로드맵     |
| [SDD-ULTIMATE-CHECKLIST](SDD-ULTIMATE-CHECKLIST.md)           | 궁극의 형태 체크리스트     | 품질 검증           |
| [SYNC-ANALYSIS-REPORT](SYNC-ANALYSIS-REPORT.md)               | 동기화 분석 리포트         | 상태 점검           |
| [ATOMIC-DECOMPOSITION-REVIEW](ATOMIC-DECOMPOSITION-REVIEW.md) | 원자 분해 검토             | P3 검증             |
| [SDD-DB-MIGRATION-MANAGEMENT](SDD-DB-MIGRATION-MANAGEMENT.md) | DB 마이그레이션 관리       | 스키마 변경         |
| [SDD-MOBILE-SHARED-LIBRARY](SDD-MOBILE-SHARED-LIBRARY.md)     | 모바일 공유 라이브러리     | 웹/모바일 코드 공유 |
| [SDD-ANALYSIS-DB-SCHEMA](SDD-ANALYSIS-DB-SCHEMA.md)           | 분석 테이블 DB 스키마      | 참조 문서           |
| [GEMINI-UI-UX-SPEC-BUNDLE](GEMINI-UI-UX-SPEC-BUNDLE.md)       | Gemini용 UI/UX 통합 스펙   | AI 디자인 참조      |
| [GEMINI-REQUEST-PROMPTS](GEMINI-REQUEST-PROMPTS.md)           | Gemini UI/UX 요청 프롬프트 | AI 디자인 참조      |
| [GEMINI-ULTIMATE-BUNDLE](GEMINI-ULTIMATE-BUNDLE.md)           | Gemini Ultimate 요청 번들  | AI 디자인 참조      |
| [ULTIMATE-UI-STRATEGY](ULTIMATE-UI-STRATEGY.md)               | 궁극의 UI/UX 전략          | 디자인 전략         |

---

## 9. 스마트 매칭/조합

| 문서                                                            | 상태      | 설명                                       | 관련 ADR                                              |
| --------------------------------------------------------------- | --------- | ------------------------------------------ | ----------------------------------------------------- |
| [SDD-SMART-COMBINATION-ENGINE](SDD-SMART-COMBINATION-ENGINE.md) | 스펙 완료 | 스마트 조합 엔진                           | [ADR-036](../adr/ADR-036-smart-combination-engine.md) |
| [SDD-SMART-MATCHING-v2](SDD-SMART-MATCHING-v2.md)               | 작성됨    | 3-Tier 사이즈 매칭 + 11체형 조정 + 핏 학습 | [ADR-032](../adr/ADR-032-smart-matching.md)           |

---

## 10. 인프라/DevOps

| 문서                                                    | 상태      | 설명                                       | 관련 ADR                                            |
| ------------------------------------------------------- | --------- | ------------------------------------------ | --------------------------------------------------- |
| [SDD-CI-CD-PIPELINE](SDD-CI-CD-PIPELINE.md)             | 계획됨    | CI/CD 파이프라인 (GitHub Actions + Vercel) | [ADR-049](../adr/ADR-049-cicd-pipeline.md)          |
| [SDD-MONITORING](SDD-MONITORING.md)                     | 계획됨    | 모니터링/관측성 (Sentry, Core Web Vitals)  | [ADR-019](../adr/ADR-019-performance-monitoring.md) |
| [SDD-API-VERSION-STRATEGY](SDD-API-VERSION-STRATEGY.md) | 참조 문서 | API 버전 전략                              | -                                                   |

---

## 11. 크로스 모듈

| 문서                                                                | 상태      | 설명                                       | 관련 ADR                                                   |
| ------------------------------------------------------------------- | --------- | ------------------------------------------ | ---------------------------------------------------------- |
| [SDD-FASHION-CLOSET-INTEGRATION](SDD-FASHION-CLOSET-INTEGRATION.md) | 스펙 완료 | Fashion-Closet 통합 (DAG 기반 데이터 흐름) | [ADR-050](../adr/ADR-050-fashion-closet-crossmodule.md)    |
| [SDD-CROSS-DOMAIN-CHALLENGES](SDD-CROSS-DOMAIN-CHALLENGES.md)       | 구현됨    | 크로스도메인 챌린지 시스템                 | [ADR-091](../adr/ADR-091-cross-domain-challenge-system.md) |
| [SDD-CROSS-MODULE-PROTOCOL](SDD-CROSS-MODULE-PROTOCOL.md)           | 구현됨    | 크로스 모듈 연동 프로토콜                  | -                                                          |
| [SDD-CAPSULE-ECOSYSTEM](SDD-CAPSULE-ECOSYSTEM.md)                   | 구현됨    | 캡슐 에코시스템 통합 스펙                  | ADR-069~075                                                |
| [SDD-INVENTORY-EXTENSION](SDD-INVENTORY-EXTENSION.md)               | 부분 구현 | 인벤토리 캡슐 확장                         | ADR-069                                                    |

## 12. 웰니스/바이오리듬

| 문서                                                    | 상태   | 설명                      | 관련 ADR                                               |
| ------------------------------------------------------- | ------ | ------------------------- | ------------------------------------------------------ |
| [SDD-STRESS-VISUALIZATION](SDD-STRESS-VISUALIZATION.md) | 구현됨 | 스트레스→피부 영향 시각화 | [ADR-090](../adr/ADR-090-stress-skin-visualization.md) |
| [SDD-SKIN-DIARY](SDD-SKIN-DIARY.md)                     | 구현됨 | 피부 일기 시계열 트렌드   | [ADR-087](../adr/ADR-087-skin-diary.md)                |

## 13. 쇼핑 고도화

| 문서                                                    | 상태   | 설명                                                    | 관련 ADR                                                                                                                                               |
| ------------------------------------------------------- | ------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [SDD-SHOPPING-ENHANCEMENT](SDD-SHOPPING-ENHANCEMENT.md) | 구현됨 | 바코드→구매, 가격알림, VTO→구매, 리뷰AI, 올리브영, 쿠폰 | [ADR-092](../adr/ADR-092-review-ai-analysis.md), [ADR-093](../adr/ADR-093-vto-product-bridge.md), [ADR-094](../adr/ADR-094-coupon-promotion-system.md) |
| [SDD-BARCODE-EXTENSION](SDD-BARCODE-EXTENSION.md)       | 구현됨 | 바코드 스캔 확장                                        | -                                                                                                                                                      |
| [SDD-CAMERA-INGREDIENT](SDD-CAMERA-INGREDIENT.md)       | 구현됨 | 카메라 성분 스캔                                        | ADR-070, ADR-071                                                                                                                                       |

---

## 스펙 문서 작성 가이드

### 필수 섹션

```markdown
# SDD-[ID]-[NAME]

> **Status**: draft | in-progress | implemented
> **Version**: X.Y
> **Created**: YYYY-MM-DD
> **Updated**: YYYY-MM-DD

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

[제약 없는 완벽한 상태 설명]

### 물리적 한계

| 항목   | 한계   |
| ------ | ------ |
| [항목] | [한계] |

### 100점 기준

- [측정 가능한 기준]

### 현재 목표: X%

- [이번 구현에서 달성할 목표]

### 의도적 제외

| 제외 항목 | 이유   | 재검토 시점 |
| --------- | ------ | ----------- |
| [항목]    | [이유] | [시점]      |

## 1. 개요

## 2. 요구사항

## 3. 설계

## 4. 원자 분해 (P3)

## 5. 테스트 케이스

## 6. 관련 문서
```

> **참조**: [P1-SECTION-TEMPLATE.md](../templates/P1-SECTION-TEMPLATE.md) - P1 섹션 상세 작성 가이드

### 관련 문서 섹션 템플릿

```markdown
## 관련 문서

### 원리 문서

- [원리: xxx](../principles/xxx.md) - 설명

### ADR

- [ADR-xxx: xxx](../adr/ADR-xxx.md)

### 관련 스펙

- [SDD-xxx](./SDD-xxx.md)
```

### 상태 정의

| 상태          | 의미         |
| ------------- | ------------ |
| `draft`       | 초안 작성 중 |
| `in-progress` | 구현 진행 중 |
| `implemented` | 구현 완료    |
| `deprecated`  | 폐기됨       |

---

## P3 원자 분해 체크리스트

스펙 문서의 P3 (원자 분해) 품질 기준:

```
□ 모든 원자가 2시간 이내
□ 모든 원자에 소요시간 명시
□ 모든 원자에 의존성 명시
□ 모든 원자에 입력/출력 스펙
□ 모든 원자에 성공 기준
□ 의존성 그래프 시각화 (Mermaid)
□ 파일 배치 위치 명시
```

---

## P4 단순화 가이드

스펙 문서의 P4 (단순화) 품질 기준:

### Mock 데이터 분리 (권장)

```
✅ 좋은 예: lib/mock/ 파일 참조
   "Mock 데이터는 lib/mock/skin-analysis.ts 참조"

❌ 피할 예: 스펙 내 인라인 Mock
   스펙에 직접 50줄+ JSON 예시 삽입
```

**이유**: Mock 데이터를 lib/mock/에 분리하면:

- 스펙 문서 가독성 향상
- 테스트/개발에서 재사용 가능
- Mock 변경 시 단일 위치 수정

### P4 체크리스트

```
□ 중복 표현 없음 (같은 내용 반복 X)
□ Mock 데이터는 lib/mock/ 참조 또는 최소 예시만
□ 불필요한 세부사항 제거
□ 공통 패턴은 별도 문서로 분리
□ 스펙 크기 적정 (200KB 이하 권장)
```

### lib/mock/ 파일 현황

| 파일                  | 용도                 |
| --------------------- | -------------------- |
| `skin-analysis.ts`    | S-1 피부 분석 Mock   |
| `body-analysis.ts`    | C-1 체형 분석 Mock   |
| `personal-color.ts`   | PC-1 퍼스널컬러 Mock |
| `workout-analysis.ts` | W-1 운동 분석 Mock   |
| `oral-health.ts`      | OH-1 구강건강 Mock   |
| ...                   | 총 21개 파일         |

---

## 네비게이션

| 목적             | 문서                                            |
| ---------------- | ----------------------------------------------- |
| 전체 문서 진입점 | [docs/INDEX.md](../INDEX.md)                    |
| 제1원칙          | [FIRST-PRINCIPLES.md](../FIRST-PRINCIPLES.md)   |
| 시스템 구조      | [ARCHITECTURE.md](../ARCHITECTURE.md)           |
| 원리 인덱스      | [principles/README.md](../principles/README.md) |
| ADR 인덱스       | [adr/README.md](../adr/README.md)               |
| 문서 의존성 맵   | [DOCUMENTATION-MAP.md](../DOCUMENTATION-MAP.md) |

---

**Version**: 3.0 | **Updated**: 2026-03-26 | 누락 스펙 29개 추가 (66→95개), 상태 모순 6건 수정
**Author**: Claude Code
