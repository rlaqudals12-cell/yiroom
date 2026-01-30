# 이룸 구현 현황 (Implementation Status)

> **Version**: 1.9 | **Updated**: 2026-01-30
> **목적**: 모든 SDD의 P1 달성률 및 P3 ATOM 진행 현황 추적
> **업데이트**: Plan v8.0 P1 작업 완료 - Insights 모듈, Coach RAG, Webhook 검증, 보안 헤더
> **원칙**: [FIRST-PRINCIPLES.md](./FIRST-PRINCIPLES.md) - P1(궁극의 형태), P3(원자 분해)

---

## 0. 핵심 지표 대시보드

### 전체 현황 요약

| 지표 | 값 | 목표 | 상태 |
|------|-----|------|------|
| **총 SDD 수** | 61 | - | - |
| **P1 정의 완료** | 57/61 | 61 | 93% |
| **P1 평균 달성률** | 76% | 80% | ⚠️ 개선 중 (72%→76%) |
| **P3 분해 완료** | 24/61 | 61 | 39% |
| **총 ATOM 수** | 213+ | - | - |
| **예상 총 시간** | ~195h | - | 순차 기준 |

### P1 달성률 분포

```
90%+   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░  8개 (13%) - 출시 준비 ← CIE-1 완료
80-89% ████████████████████████████░░░░░░░ 22개 (36%) - 안정 ← W-2 Stretching 추가
70-79% ██████████████░░░░░░░░░░░░░░░░░░░░░ 14개 (23%) - 진행 중
50-69% ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  7개 (11%) - 개발 중
30-49% ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  2개 (3%)  - 초기
<30%   █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  5개 (8%)  - 계획
0%     ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  3개 (5%)  - 연기

누적: 70%+ = 44개 (72%) | 50%+ = 51개 (84%)
```

---

## 1. 즉시 실행 가능 목록 (Action Items)

### 1.1 High Priority (이번 스프린트)

> 조건: P3 완료 + 의존성 없음 + P1 < 80%

| # | SDD | P1 달성률 | P3 상태 | ATOM 수 | 예상 시간 | 의존성 |
|---|-----|----------|---------|---------|----------|--------|
| 1 | [SDD-ACCESSIBILITY-GUIDELINES](./specs/SDD-ACCESSIBILITY-GUIDELINES.md) | 65% | ✅ | 6 | ~10h | 없음 |

> **참고**: specs/README.md 기준 P3 완료 13개 SDD 중 "P1 < 80% + 의존성 없음" 조건을 충족하는 SDD

### 1.2 Medium Priority (다음 스프린트) → **대부분 완료됨**

> 조건: P3 완료 + 의존성 해결됨 (CIE-1~4 ✅ 전체 완료)

| # | SDD | P1 달성률 | P3 상태 | ATOM 수 | 예상 시간 | 의존성 | 상태 |
|---|-----|----------|---------|---------|----------|--------|------|
| 2 | [SDD-CROSS-MODULE-PROTOCOL](./specs/SDD-CROSS-MODULE-PROTOCOL.md) | 70% | ✅ | 8 | ~12h | 분석 모듈 | 📋 Ready |
| 3 | [SDD-PERSONAL-COLOR-v2](./specs/SDD-PERSONAL-COLOR-v2.md) | 85% | ✅ | 12 | ~6h | ~~CIE-1~~ ✅ | ✅ Gemini 통합 |
| 4 | [SDD-SKIN-ANALYSIS-v2](./specs/SDD-SKIN-ANALYSIS-v2.md) | 85% | ✅ | 10+ | ~6h | ~~CIE-1~~ ✅ | ✅ Gemini 통합 |
| 5 | [SDD-BODY-ANALYSIS-v2](./specs/SDD-BODY-ANALYSIS-v2.md) | 90% | ✅ | 10+ | ~4h | ~~CIE-1~~ ✅, Gemini ✅ | ✅ 완료 |
| 6 | [SDD-HAIR-ANALYSIS](./specs/SDD-HAIR-ANALYSIS.md) | 90% | ✅ | 10+ | ~4h | Gemini ✅ | ✅ 완료 |

> **🎉 CIE-1~4 전체 완료 (2026-01-30)**: 579 테스트 통과, Pipeline Integration 28 tests
> **✅ v2 API 타입 정합성 확보 (2026-01-29)**: API 라우트 및 결과 컴포넌트 타입 에러 수정 완료
> **✅ Gemini Vision 연결 완료 (2026-01-30)**: body-v2, hair-v2, skin-v2, personal-color-v2 이미지 기반 AI 분석 통합
>
> **🆕 Plan v8.0 P1 완료 (2026-01-30)**:
> - **Insights 모듈**: `lib/insights/` 구조 생성 (index.ts, types.ts, generator.ts, scoring.ts, cross-module-insights.ts)
> - **Coach RAG 실 데이터**: workout-rag.ts 실제 운동 DB 연결 완료 (60+ exercises)
> - **Webhook 서명 검증**: Clerk webhook (Svix 기반), affiliate/conversion (HMAC-SHA256)
> - **보안 헤더**: proxy.ts에 CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy 추가

### 1.3 Blocked (의존성 대기)

| SDD | 차단 원인 | 해제 조건 |
|-----|----------|----------|
| ~~[SDD-PHASE-E-SKIN-ZOOM](./specs/SDD-PHASE-E-SKIN-ZOOM.md)~~ | ~~CIE-2~4 미완료~~ | ✅ **해제됨** - CIE 전체 완료 |
| [SDD-SK-1-PROCEDURE](./specs/SDD-SK-1-PROCEDURE-RECOMMENDATION.md) | 법률 검토 대기 | 의료기기 경계 확정 |
| [SDD-HUB-PATTERN](./specs/SDD-HUB-PATTERN.md) | 연기 (MAU 5K+ 후) | 사용자 피드백 |

> **2026-01-30**: SDD-PHASE-E-SKIN-ZOOM 블로커 해제 - CIE-1~4 전체 구현 완료

---

## 2. P1 달성률 상세 (궁극의 형태)

### 2.1 Tier 1: 출시 준비 (90%+) - 8개

| SDD | P1 달성률 | 상태 | 핵심 미달성 항목 |
|-----|----------|------|------------------|
| [SDD-MARKETING-TOGGLE-UI](./specs/SDD-MARKETING-TOGGLE-UI.md) | 95% | ✅ | 채널별 분리 (Phase 2) |
| [SDD-AUDIT-LOGGING](./specs/SDD-AUDIT-LOGGING.md) | 95% | ✅ | 분석 대시보드 |
| [SDD-PHASE-J-P2-ACCESSORY-MAKEUP](./specs/SDD-PHASE-J-P2-ACCESSORY-MAKEUP.md) | 95% | ✅ | AR 가상 피팅 |
| [SDD-CIE-1-IMAGE-QUALITY](./specs/SDD-CIE-1-IMAGE-QUALITY.md) | 90% | ✅ | 얼굴 감지 연동 (CIE-2) |
| [SDD-PHASE-J-AI-STYLING](./specs/SDD-PHASE-J-AI-STYLING.md) | 90% | ✅ | 계절 기반 추천 |
| [SDD-PHASE-J-P3-FULL-OUTFIT](./specs/SDD-PHASE-J-P3-FULL-OUTFIT.md) | 90% | ✅ | 시즌 기반 추천 |
| [SDD-HYBRID-DATA-EXTENSION](./specs/SDD-HYBRID-DATA-EXTENSION.md) | 90% | ✅ | 고급 캐싱 전략 |
| [SDD-LOGO-IDENTITY](./specs/SDD-LOGO-IDENTITY.md) | 90% | ✅ | 애니메이션 로고 |

### 2.2 Tier 2: 안정 (80-89%) - 22개

| SDD | P1 달성률 | 상태 | 핵심 미달성 항목 |
|-----|----------|------|------------------|
| [SDD-CIE-2-FACE-DETECTION](./specs/SDD-CIE-2-FACE-DETECTION.md) | 80% | ✅ | 고급 랜드마크 (NEW) |
| [SDD-CIE-3-AWB-CORRECTION](./specs/SDD-CIE-3-AWB-CORRECTION.md) | 85% | ✅ | 고급 색온도 보정 |
| [SDD-CIE-4-LIGHTING-ANALYSIS](./specs/SDD-CIE-4-LIGHTING-ANALYSIS.md) | 85% | ✅ | 동적 조명 추적 |
| [SDD-N-1-AGE-VERIFICATION](./specs/SDD-N-1-AGE-VERIFICATION.md) | 85% | ✅ | 본인인증 연동 |
| [SDD-LEGAL-SUPPORT](./specs/SDD-LEGAL-SUPPORT.md) | 85% | ✅ | 다국어 법적 문서 |
| [SDD-COACH-AI-CHAT](./specs/SDD-COACH-AI-CHAT.md) | 85% | ✅ | 음성 입력, 멀티모달 |
| [SDD-W1-WORKOUT](./specs/SDD-W1-WORKOUT.md) | 85% | ✅ | 고급 운동 분석 |
| [SDD-RATE-LIMITING](./specs/SDD-RATE-LIMITING.md) | 85% | ✅ | 동적 임계값 |
| [SDD-S1-PROFESSIONAL-ANALYSIS](./specs/SDD-S1-PROFESSIONAL-ANALYSIS.md) | 85% | ✅ | 피부과 연동 |
| [SDD-S1-C1-UX-IMPROVEMENT](./specs/SDD-S1-C1-UX-IMPROVEMENT.md) | 85% | ✅ | 마이크로인터랙션 |
| [SDD-MY-INFO-SECTION](./specs/SDD-MY-INFO-SECTION.md) | 85% | ✅ | 데이터 내보내기 |
| [SDD-HAIR-ANALYSIS](./specs/SDD-HAIR-ANALYSIS.md) | 85% | ✅ | 3D 헤어 시뮬레이션 (Gemini ✅) |
| [SDD-GDPR-DELETION-CRON](./specs/SDD-GDPR-DELETION-CRON.md) | 80% | ✅ | 자동 리마인더 |
| [SDD-N1-NUTRITION](./specs/SDD-N1-NUTRITION.md) | 80% | ✅ | 식품 DB 확장 |
| [SDD-PHASE-D-SKIN-CONSULTATION](./specs/SDD-PHASE-D-SKIN-CONSULTATION.md) | 80% | ✅ | 화상 상담 연동 |
| [SDD-DB-MIGRATION-MANAGEMENT](./specs/SDD-DB-MIGRATION-MANAGEMENT.md) | 80% | ✅ | 자동 롤백 |
| [SDD-AI-TRANSPARENCY](./specs/SDD-AI-TRANSPARENCY.md) | 85% | ✅ | 모델 카드 UI |
| [SDD-BODY-ANALYSIS-v2](./specs/SDD-BODY-ANALYSIS-v2.md) | 90% | ✅ | 고급 시뮬레이션 (Gemini ✅) |
| [SDD-HAIR-ANALYSIS](./specs/SDD-HAIR-ANALYSIS.md) | 90% | ✅ | 3D 헤어 시뮬레이션 (Gemini ✅) |
| [SDD-PERSONAL-COLOR-v2](./specs/SDD-PERSONAL-COLOR-v2.md) | 85% | ✅ | 드레이프 시뮬레이션 (Gemini ✅ NEW) |
| [SDD-SKIN-ANALYSIS-v2](./specs/SDD-SKIN-ANALYSIS-v2.md) | 85% | ✅ | 존별 상세 분석 (Gemini ✅ NEW) |
| [SDD-W-2-ADVANCED-STRETCHING](./specs/SDD-W-2-ADVANCED-STRETCHING.md) | 85% | ✅ | Janda 프로토콜, 스포츠 워밍업 완료 (NEW) |

### 2.3 Tier 3: 진행 중 (70-79%) - 14개

| SDD | P1 달성률 | P3 상태 | 핵심 미달성 항목 |
|-----|----------|---------|------------------|
| [SDD-CI-CD-PIPELINE](./specs/SDD-CI-CD-PIPELINE.md) | 75% | ❌ | 카나리 배포 |
| [SDD-S1-UX-IMPROVEMENT](./specs/SDD-S1-UX-IMPROVEMENT.md) | 75% | ❌ | 고급 시각화 |
| [SDD-AUTO-COLOR-CLASSIFICATION](./specs/SDD-AUTO-COLOR-CLASSIFICATION.md) | 75% | ❌ | ML 기반 분류 |
| [SDD-VISUAL-SKIN-REPORT](./specs/SDD-VISUAL-SKIN-REPORT.md) | 75% | ❌ | PDF 내보내기 |
| [SDD-ACCESSIBILITY](./specs/SDD-ACCESSIBILITY.md) | 70% | ❌ | 고대비 모드 |
| [SDD-AFFILIATE-INTEGRATION](./specs/SDD-AFFILIATE-INTEGRATION.md) | 70% | ❌ | 글로벌 파트너 확장 |
| [SDD-COACH-AI-COMPREHENSIVE](./specs/SDD-COACH-AI-COMPREHENSIVE.md) | 70% | ❌ | 전문가 상담 연동 |
| [SDD-CROSS-MODULE-PROTOCOL](./specs/SDD-CROSS-MODULE-PROTOCOL.md) | 70% | ✅ | 시너지 점수 |
| [SDD-MONITORING](./specs/SDD-MONITORING.md) | 70% | ❌ | 커스텀 대시보드 |
| [SDD-MAKEUP-ANALYSIS](./specs/SDD-MAKEUP-ANALYSIS.md) | 70% | ❌ | AR 메이크업 |
| [SDD-MOBILE-SHARED-LIBRARY](./specs/SDD-MOBILE-SHARED-LIBRARY.md) | 70% | ❌ | 오프라인 완전 지원 |
| [SDD-OH-1-ORAL-HEALTH](./specs/SDD-OH-1-ORAL-HEALTH.md) | 70% | ❌ | 치과 연동 |
| [SDD-S1-SKINCARE-SOLUTION-TAB](./specs/SDD-S1-SKINCARE-SOLUTION-TAB.md) | 70% | ❌ | 개인화 루틴 |
| [SDD-SMART-COMBINATION-ENGINE](./specs/SDD-SMART-COMBINATION-ENGINE.md) | 70% | ✅ 15 | 시너지 분석 |
| [SDD-PC1-ONBOARDING](./specs/SDD-PC1-ONBOARDING.md) | 70% | ❌ | 게임화 요소 |

### 2.4 Tier 4: 개발 중 (50-69%) - 7개

| SDD | P1 달성률 | P3 상태 | 블로커 |
|-----|----------|---------|--------|
| [SDD-ACCESSIBILITY-GUIDELINES](./specs/SDD-ACCESSIBILITY-GUIDELINES.md) | 65% | ✅ | 없음 |
| [SDD-FASHION-CLOSET-INTEGRATION](./specs/SDD-FASHION-CLOSET-INTEGRATION.md) | 65% | ✅ 20 | 크로스모듈 |
| [SDD-SOCIAL-FEED](./specs/SDD-SOCIAL-FEED.md) | 60% | ❌ | 없음 |
| [SDD-PHASE-K-COMPREHENSIVE-UPGRADE](./specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md) | 60% | ✅ 26 | 없음 |
| [SDD-GAP-FIXES](./specs/SDD-GAP-FIXES.md) | 50% | ❌ | 없음 |
| [SDD-CAPSULE-WARDROBE](./specs/SDD-CAPSULE-WARDROBE.md) | 50% | ❌ | 옷장 연동 |

> **Tier 2로 이동 (2026-01-30)**: SKIN-ANALYSIS-v2, PERSONAL-COLOR-v2, BODY-ANALYSIS-v2, HAIR-ANALYSIS - 모두 API 타입 정합성 및 Gemini 연동 완료
> **W-2 Tier 2 승격 (2026-01-30)**: janda-protocol.ts (8개 Janda 프로토콜), sport-warmup.ts (6개 스포츠) 추가 완료 → 85% 달성

### 2.5 Tier 5: 계획/연기 (0-49%) - 7개

| SDD | P1 달성률 | 상태 | 재검토 시점 |
|-----|----------|------|-------------|
| [SDD-2026-UX-TRENDS](./specs/SDD-2026-UX-TRENDS.md) | 36% | 📋 Planned | Q2 2026 |
| [SDD-GLOBAL-DESIGN-SPECIFICATION](./specs/SDD-GLOBAL-DESIGN-SPECIFICATION.md) | 30% | 📋 Planned | 즉시 가능 |
| [SDD-SK-1-PROCEDURE-RECOMMENDATION](./specs/SDD-SK-1-PROCEDURE-RECOMMENDATION.md) | 33% | ⏸️ Deferred | 법률 검토 후 |
| [SDD-PROFESSIONAL-ENHANCEMENT](./specs/SDD-PROFESSIONAL-ENHANCEMENT.md) | 35% | 📋 Planned | Q2 2026 |
| [SDD-PROFESSIONAL-ENHANCEMENT-SUPPLEMENT](./specs/SDD-PROFESSIONAL-ENHANCEMENT-SUPPLEMENT.md) | 10% | 📋 Planned | 본체 완료 후 |
| [SDD-HUB-PATTERN](./specs/SDD-HUB-PATTERN.md) | 0% | ⏸️ Deferred | MAU 5K+ |
| [SDD-BODY-ANALYSIS](./specs/SDD-BODY-ANALYSIS.md) | 0% | ⏸️ Deferred | v2로 대체 |

> **CIE-2 → Tier 2 이동 (2026-01-30)**: 80% 달성, 구현 완료
> **Phase-E-Skin-Zoom → Ready (2026-01-30)**: CIE 전체 완료로 블로커 해제

---

## 3. P3 ATOM 진행 현황 (원자 분해)

### 3.1 ATOM 통계

> **정보 출처**: [specs/README.md](./specs/README.md) - P3 완료 핵심 SDD (17개)

| 카테고리 | SDD 수 | ATOM 수 | 예상 시간 (순차) |
|----------|--------|---------|-----------------|
| 이미지 엔진 | 4 | 107 | ~60h | ← CIE-1,2,3,4 ✅ **전체 완료** |
| 분석 모듈 v2 | 4 | 42+ | ~40h | ← HAIR-ANALYSIS 추가 |
| 법률/규정 | 4 | 21 | ~25h |
| 인프라 | 2 | 13 | ~15h |
| 기타 (영양, 운동 등) | 3 | 30 | ~35h |
| 크로스 모듈 (추가) | 3 | 61 | ~60h |
| **총계** | **20** | **230+** | **~235h** |

**카테고리 상세**:
- **이미지 엔진**: CIE-1(13) ✅, CIE-2(12) ✅, CIE-3(48 tests) ✅, CIE-4(34 tests) ✅ **전체 완료**
- 분석 모듈 v2: PERSONAL-COLOR-v2(12), SKIN-ANALYSIS-v2(10+), BODY-ANALYSIS-v2(10+)
- 법률/규정: AUDIT-LOGGING(7), GDPR-DELETION-CRON(4), AI-TRANSPARENCY(5), RATE-LIMITING(5)
- 인프라: HYBRID-DATA-EXTENSION(6), CROSS-MODULE-PROTOCOL(8) (※ HUB-PATTERN은 연기됨)
- 기타: N1-NUTRITION(11), W1-WORKOUT(13), ACCESSIBILITY-GUIDELINES(6), HUB-PATTERN(8)
- **크로스 모듈 (신규)**: SMART-COMBINATION-ENGINE(15), FASHION-CLOSET-INTEGRATION(20), PHASE-K-COMPREHENSIVE-UPGRADE(26)

### 3.2 P3 완료 SDD 목록 (16개)

> 출처: [specs/README.md](./specs/README.md) - P3 완료 핵심 SDD

<details>
<summary><b>SDD-N1-NUTRITION (11 ATOM)</b> - 영양 모듈</summary>

| ATOM ID | 작업 | 소요 | 상태 | 의존성 |
|---------|------|------|------|--------|
| N1-A1 | BMR/TDEE 계산기 | 2h | ⬜ | 없음 |
| N1-A2 | 영양소 평가 로직 | 1.5h | ⬜ | N1-A1 |
| N1-A3 | 개인화 프로필 | 1.5h | ⬜ | N1-A1 |
| N1-A4 | RDA 데이터베이스 | 1h | ⬜ | 없음 |
| N1-A5 | 영양소 시너지 분석 | 1.5h | ⬜ | N1-A2 |
| N1-A6 | 물 섭취 추적 | 1h | ⬜ | 없음 |
| N1-A7 | 식단 기록 UI | 1.5h | ⬜ | N1-A2 |
| N1-A8 | 영양소 대시보드 | 1.5h | ⬜ | N1-A7 |
| N1-A9 | 보충제 추천 | 1h | ⬜ | N1-A5 |
| N1-A10 | 테스트 | 1h | ⬜ | 전체 |
| N1-A11 | 문서화 | 0.5h | ⬜ | 전체 |

</details>

<details>
<summary><b>SDD-W1-WORKOUT (13 ATOM)</b> - 운동 모듈</summary>

| ATOM ID | 작업 | 소요 | 상태 | 의존성 |
|---------|------|------|------|--------|
| W1-A1 | MET 기반 칼로리 계산 | 1.5h | ⬜ | 없음 |
| W1-A2 | 5-Type 운동 분류 | 1h | ⬜ | 없음 |
| W1-A3 | 주간 플랜 생성 | 2h | ⬜ | W1-A1,A2 |
| W1-A4 | 운동 세션 기록 | 1.5h | ⬜ | W1-A1 |
| W1-A5 | 생리학 기반 추천 | 1.5h | ⬜ | W1-A1,A2 |
| W1-A6 | 운동 히스토리 | 1h | ⬜ | W1-A4 |
| W1-A7 | 진행률 대시보드 | 1.5h | ⬜ | W1-A6 |
| W1-A8 | Best 5 생성기 | 1h | ⬜ | W1-A3 |
| W1-A9 | 스트레칭 가이드 | 1.5h | ⬜ | 없음 |
| W1-A10 | 운동 영상 연동 | 1h | ⬜ | W1-A4 |
| W1-A11 | 목표 설정 | 1h | ⬜ | 없음 |
| W1-A12 | 테스트 | 1h | ⬜ | 전체 |
| W1-A13 | 문서화 | 0.5h | ⬜ | 전체 |

</details>

<details>
<summary><b>SDD-PERSONAL-COLOR-v2 (12 ATOM)</b> - 퍼스널컬러 v2</summary>

| ATOM ID | 작업 | 소요 | 상태 | 의존성 |
|---------|------|------|------|--------|
| PC2-A1 | Lab 색공간 변환 | 1.5h | ⬜ | 없음 |
| PC2-A2 | 색조 분석 알고리즘 | 2h | ⬜ | PC2-A1 |
| PC2-A3 | 시즌 판정 로직 | 1.5h | ⬜ | PC2-A2 |
| PC2-A4 | 서브타입 분류 | 1.5h | ⬜ | PC2-A3 |
| PC2-A5 | 드레이프 시뮬레이션 | 2h | ⬜ | PC2-A3 |
| PC2-A6 | 팔레트 생성 | 1h | ⬜ | PC2-A4 |
| PC2-A7 | 결과 시각화 | 1.5h | ⬜ | PC2-A5,A6 |
| PC2-A8 | 제품 매칭 | 1h | ⬜ | PC2-A6 |
| PC2-A9 | 히스토리 비교 | 1h | ⬜ | PC2-A7 |
| PC2-A10 | 공유 기능 | 0.5h | ⬜ | PC2-A7 |
| PC2-A11 | 테스트 | 1h | ⬜ | 전체 |
| PC2-A12 | 문서화 | 0.5h | ⬜ | 전체 |

</details>

<details>
<summary><b>SDD-SKIN-ANALYSIS-v2 (10+ ATOM)</b> - 피부 분석 v2</summary>

> 상세 ATOM 목록은 [SDD-SKIN-ANALYSIS-v2.md](./specs/SDD-SKIN-ANALYSIS-v2.md) 참조

주요 작업: 존별 분석, 피부결 측정, 시계열 비교, AI 추천 강화

</details>

<details>
<summary><b>SDD-BODY-ANALYSIS-v2 (10+ ATOM)</b> - 체형 분석 v2</summary>

> 상세 ATOM 목록은 [SDD-BODY-ANALYSIS-v2.md](./specs/SDD-BODY-ANALYSIS-v2.md) 참조

주요 작업: 체형 분류 고도화, 자세 분석, 스타일링 연동, 히스토리 비교

</details>

<details>
<summary><b>SDD-HYBRID-DATA-EXTENSION (6 ATOM)</b> - Hybrid 데이터</summary>

| ATOM ID | 작업 | 소요 | 상태 | 의존성 |
|---------|------|------|------|--------|
| HYB-A1 | 캐싱 전략 설계 | 1h | ⬜ | 없음 |
| HYB-A2 | 오프라인 저장소 | 1.5h | ⬜ | HYB-A1 |
| HYB-A3 | 동기화 로직 | 1.5h | ⬜ | HYB-A2 |
| HYB-A4 | 충돌 해결 | 1h | ⬜ | HYB-A3 |
| HYB-A5 | 상태 표시 UI | 1h | ⬜ | HYB-A3 |
| HYB-A6 | 테스트 | 1h | ⬜ | 전체 |

</details>

<details>
<summary><b>SDD-AI-TRANSPARENCY (5 ATOM)</b> - AI 투명성</summary>

| ATOM ID | 작업 | 소요 | 상태 | 의존성 |
|---------|------|------|------|--------|
| AIT-A1 | 신뢰도 표시 UI | 1h | ⬜ | 없음 |
| AIT-A2 | 분석 근거 설명 | 1.5h | ⬜ | AIT-A1 |
| AIT-A3 | 모델 정보 표시 | 1h | ⬜ | 없음 |
| AIT-A4 | 피드백 수집 | 1h | ⬜ | AIT-A1 |
| AIT-A5 | 테스트/문서화 | 0.5h | ⬜ | 전체 |

</details>

<details>
<summary><b>SDD-AUDIT-LOGGING (7 ATOM)</b> - 감사 로깅</summary>

| ATOM ID | 작업 | 소요 | 상태 | 의존성 |
|---------|------|------|------|--------|
| AUD-A1 | 로그 스키마 정의 | 1h | ⬜ | 없음 |
| AUD-A2 | 로깅 미들웨어 | 1.5h | ⬜ | AUD-A1 |
| AUD-A3 | PII 마스킹 | 1h | ⬜ | AUD-A2 |
| AUD-A4 | 로그 저장소 연동 | 1.5h | ⬜ | AUD-A2 |
| AUD-A5 | 보존 정책 | 1h | ⬜ | AUD-A4 |
| AUD-A6 | 관리자 조회 UI | 1.5h | ⬜ | AUD-A4 |
| AUD-A7 | 테스트/문서화 | 0.5h | ⬜ | 전체 |

</details>

<details>
<summary><b>SDD-GDPR-DELETION-CRON (4 ATOM)</b> - GDPR 삭제</summary>

| ATOM ID | 작업 | 소요 | 상태 | 의존성 |
|---------|------|------|------|--------|
| GDPR-A1 | 삭제 요청 API | 1h | ⬜ | 없음 |
| GDPR-A2 | Soft Delete 로직 | 1.5h | ⬜ | GDPR-A1 |
| GDPR-A3 | Hard Delete Cron | 1.5h | ⬜ | GDPR-A2 |
| GDPR-A4 | 리마인더 발송 | 1h | ⬜ | GDPR-A2 |

</details>

<details>
<summary><b>SDD-RATE-LIMITING (5 ATOM)</b> - Rate Limiting</summary>

| ATOM ID | 작업 | 소요 | 상태 | 의존성 |
|---------|------|------|------|--------|
| RL-A1 | Upstash 연동 | 1h | ⬜ | 없음 |
| RL-A2 | 엔드포인트별 설정 | 1h | ⬜ | RL-A1 |
| RL-A3 | 사용자별 쿼터 | 1h | ⬜ | RL-A2 |
| RL-A4 | 429 응답 핸들링 | 1h | ⬜ | RL-A2 |
| RL-A5 | 테스트/문서화 | 1h | ⬜ | 전체 |

</details>

<details>
<summary><b>SDD-CROSS-MODULE-PROTOCOL (8 ATOM)</b> - 크로스모듈</summary>

| ATOM ID | 작업 | 소요 | 상태 | 의존성 |
|---------|------|------|------|--------|
| CMP-A1 | 프로토콜 인터페이스 정의 | 1.5h | ⬜ | 없음 |
| CMP-A2 | 이벤트 버스 구현 | 2h | ⬜ | CMP-A1 |
| CMP-A3 | 데이터 변환 레이어 | 1.5h | ⬜ | CMP-A1 |
| CMP-A4 | PC-S 연동 | 1.5h | ⬜ | CMP-A2 |
| CMP-A5 | S-N 연동 | 1.5h | ⬜ | CMP-A2 |
| CMP-A6 | C-Fashion 연동 | 1.5h | ⬜ | CMP-A2 |
| CMP-A7 | 시너지 점수 계산 | 1.5h | ⬜ | CMP-A4,5,6 |
| CMP-A8 | 테스트/문서화 | 1.5h | ⬜ | 전체 |

</details>

<details>
<summary><b>SDD-ACCESSIBILITY-GUIDELINES (6 ATOM)</b> - 접근성</summary>

| ATOM ID | 작업 | 소요 | 상태 | 의존성 |
|---------|------|------|------|--------|
| A11Y-A1 | 키보드 네비게이션 | 2h | ⬜ | 없음 |
| A11Y-A2 | 스크린 리더 지원 | 2h | ⬜ | A11Y-A1 |
| A11Y-A3 | 색상 대비 검증 | 1.5h | ⬜ | 없음 |
| A11Y-A4 | 포커스 관리 | 1.5h | ⬜ | A11Y-A1 |
| A11Y-A5 | ARIA 라벨링 | 1.5h | ⬜ | A11Y-A2 |
| A11Y-A6 | 자동 테스트 설정 | 1.5h | ⬜ | 전체 |

</details>

<details>
<summary><b>SDD-HUB-PATTERN (8 ATOM)</b> - Hub 패턴 (⏸️ 연기)</summary>

> **상태**: 연기됨 (MAU 5K+ 후 재검토)

| ATOM ID | 작업 | 소요 | 상태 | 의존성 |
|---------|------|------|------|--------|
| HUB-A1 | Hub 컨테이너 | 2h | ⏸️ | 없음 |
| HUB-A2 | FeaturedCard | 1.5h | ⏸️ | HUB-A1 |
| HUB-A3 | GridCard | 1h | ⏸️ | HUB-A1 |
| HUB-A4 | 라우팅 수정 | 1h | ⏸️ | HUB-A1~A3 |
| HUB-A5 | 네비게이션 IA | 2h | ⏸️ | HUB-A4 |
| HUB-A6 | 애니메이션 | 1.5h | ⏸️ | HUB-A2,A3 |
| HUB-A7 | 테스트 | 1.5h | ⏸️ | HUB-A1~A6 |
| HUB-A8 | A/B 테스트 | 1.5h | ⏸️ | HUB-A7 |

</details>

### 3.3 P3 미완료 SDD (41개)

> P3 분해가 필요한 SDD 목록 (61개 - 20개 완료 = 41개)

| SDD | P1 달성률 | P3 필요성 | 예상 ATOM 수 | 우선순위 |
|-----|----------|----------|--------------|----------|
| SDD-CI-CD-PIPELINE | 75% | 중간 | 6-8 | 🟠 Medium |
| SDD-ACCESSIBILITY | 70% | 중간 | 8-10 | 🟠 Medium |
| SDD-MONITORING | 70% | 중간 | 8 | 🟠 Medium |
| SDD-SOCIAL-FEED | 60% | 중간 | 10-12 | 🟡 Low |
| SDD-MAKEUP-ANALYSIS | 70% | 중간 | 10-12 | 🟡 Low |
| SDD-OH-1-ORAL-HEALTH | 70% | 중간 | 15-18 | 🟡 Low |
| *(나머지 35개)* | - | 낮음~중간 | 5-10 | 🟡 Low |

> **P3 완료 SDD** (24개): **CIE-1-IMAGE-QUALITY(13)**, **CIE-2-FACE-DETECTION(10)**, **CIE-3-AWB-CORRECTION(11)**, **CIE-4-LIGHTING-ANALYSIS(13)**, N1-NUTRITION, W1-WORKOUT, **W2-ADVANCED-STRETCHING(54 tests + janda-protocol + sport-warmup)**, PERSONAL-COLOR-v2, SKIN-ANALYSIS-v2, BODY-ANALYSIS-v2, HAIR-ANALYSIS, HYBRID-DATA-EXTENSION, AI-TRANSPARENCY, AUDIT-LOGGING, GDPR-DELETION-CRON, RATE-LIMITING, CROSS-MODULE-PROTOCOL, ACCESSIBILITY-GUIDELINES, HUB-PATTERN, **SMART-COMBINATION-ENGINE(15)**, **FASHION-CLOSET-INTEGRATION(20)**, **PHASE-K-COMPREHENSIVE-UPGRADE(26)**, **API-VERSION-STRATEGY(NEW)**, **ANALYSIS-DB-SCHEMA(NEW)**
>
> **신규 문서화 (2026-01-30)**:
> - [SDD-API-VERSION-STRATEGY.md](./specs/SDD-API-VERSION-STRATEGY.md) - API v1/v2 버전 전략
> - [SDD-ANALYSIS-DB-SCHEMA.md](./specs/SDD-ANALYSIS-DB-SCHEMA.md) - 분석 테이블 스키마 문서
> - [SDD-CIE-P3-DECOMPOSITION.md](./specs/SDD-CIE-P3-DECOMPOSITION.md) - CIE-2/3/4 원자 분해 (34 ATOMs)

---

## 4. 모듈별 요약

### 4.1 분석 모듈 (PC-1, S-1, C-1, W-1, N-1)

| 모듈 | 현재 버전 | P1 달성률 | V2 계획 | V2 P1 | V2 P3 | V2 상태 |
|------|----------|----------|---------|-------|-------|---------|
| **PC-1** (퍼스널컬러) | v1 구현됨 | 85% | SDD-PERSONAL-COLOR-v2 | 85% | ✅ 12 | ✅ Gemini 통합 완료 |
| **S-1** (피부) | v1 구현됨 | 80% | SDD-SKIN-ANALYSIS-v2 | 85% | ✅ 10+ | ✅ Gemini 통합 완료 |
| **C-1** (체형) | v1 구현됨 | 78% | SDD-BODY-ANALYSIS-v2 | 90% | ✅ 10+ | ✅ Gemini 통합 완료 |
| **H-1** (헤어) | v1 구현됨 | 85% | SDD-HAIR-ANALYSIS | 90% | ✅ 10+ | ✅ Gemini 통합 완료 |
| **W-1** (운동) | v1 구현됨 | 85% | SDD-W1-WORKOUT | - | ✅ 13 | ✅ 완료 |
| **N-1** (영양) | v1 구현됨 | 80% | SDD-N1-NUTRITION | - | ✅ 11 | ✅ 완료 |

### 4.2 이미지 엔진 (CIE)

| 모듈 | P1 달성률 | P3 상태 | ATOM 수 | 의존성 | 상태 |
|------|----------|---------|---------|--------|------|
| **CIE-1** (품질 검증) | 90% | ✅ | 13 | 없음 | ✅ Implemented |
| **CIE-2** (얼굴 감지) | 80% | ✅ | 12 | CIE-1 ✅ | ✅ Implemented |
| **CIE-3** (AWB 보정) | 85% | ✅ | 48 tests | CIE-2 ✅ | ✅ Implemented |
| **CIE-4** (조명 분석) | 85% | ✅ | 34 tests | CIE-3 ✅ | ✅ Implemented |

**의존성 체인**: ~~CIE-1~~ → ~~CIE-2~~ → ~~CIE-3~~ → ~~CIE-4~~ → V2 분석 모듈들 ✅ **전체 완료**

> **CIE-1 완료 (2026-01-29)**: 143 테스트 통과, resolution/sharpness/exposure/color-temperature/quality-validator 구현
> **CIE-2/3/4 완료 (2026-01-30)**: 579 테스트 전체 통과, Pipeline Integration 28 tests 추가
> **v2 API 타입 정합성 완료 (2026-01-29)**: body-v2, personal-color-v2, hair-v2, skin-v2 라우트 및 ResultCardV2, BodyVisualization, ZoneVisualization 컴포넌트

### 4.3 법률/규정

| 모듈 | P1 달성률 | 상태 | 법률 검토 |
|------|----------|------|----------|
| SDD-LEGAL-SUPPORT | 85% | ✅ | 완료 |
| SDD-GDPR-DELETION-CRON | 80% | ✅ | 완료 |
| SDD-N-1-AGE-VERIFICATION | 85% | ✅ | 완료 |
| SDD-AI-TRANSPARENCY | 85% | ✅ | 완료 |
| SDD-AUDIT-LOGGING | 95% | ✅ | 완료 |

### 4.4 인프라/DevOps

| 모듈 | P1 달성률 | 상태 | 비고 |
|------|----------|------|------|
| SDD-CI-CD-PIPELINE | 75% | ✅ | GitHub Actions |
| SDD-MONITORING | 70% | 📋 | Vercel Analytics |
| SDD-RATE-LIMITING | 85% | ✅ | Upstash |
| SDD-DB-MIGRATION-MANAGEMENT | 80% | ✅ | 롤백 전략 |

### 4.5 크로스 모듈 (신규 2026-01-30)

| 모듈 | P1 달성률 | 상태 | 비고 |
|------|----------|------|------|
| **Insights 모듈** | 80% | ✅ | lib/insights/ 구조 완성, scoring.ts, cross-module-insights.ts |
| **Coach RAG** | 75% | ✅ | workout-rag.ts 실 데이터 연결, nutrition-rag.ts Mock (recipes 테이블 미존재) |

### 4.6 보안 (신규 2026-01-30)

| 항목 | 상태 | 비고 |
|------|------|------|
| **보안 헤더** | ✅ 완료 | proxy.ts - CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| **Webhook 서명** | ✅ 완료 | Clerk (Svix), affiliate/conversion (HMAC-SHA256) |
| **Rate Limiting** | ✅ 완료 | Upstash Redis + in-memory fallback |
| **RLS Policies** | ✅ 완료 | 모든 사용자 테이블 적용 |
| **PII Redaction** | ✅ 완료 | lib/utils/redact-pii.ts - 26+ 필드 마스킹 |
| **Audit Logging** | ✅ 완료 | v2.0, 14+ event types, 90일 보존 |

---

## 5. 의존성 그래프

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      의존성 그래프 (2026-01-30 업데이트)                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐                                                         │
│  │  CIE-1 품질검증  │ ✅ 완료 (143 테스트)                                    │
│  └────────┬────────┘                                                         │
│           │ ✅ 의존성 해제됨                                                  │
│           ├──────────────┬──────────────┬──────────────┐                     │
│           ▼              ▼              ▼              ▼                     │
│  ┌─────────────┐  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ CIE-2 얼굴  │  │ S-2 피부v2  │ │ PC-2 컬러v2 │ │ C-2 체형v2  │            │
│  │  ✅ 완료    │  │  ✅ 완료    │ │  ✅ 완료    │ │  ✅ 완료    │            │
│  └──────┬──────┘  └─────────────┘ └─────────────┘ └─────────────┘            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────┐                                                             │
│  │ CIE-3 AWB   │ ✅ 완료 (48 테스트)                                         │
│  └──────┬──────┘                                                             │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────┐                                                             │
│  │ CIE-4 조명  │ ✅ 완료 (34 테스트)                                         │
│  └─────────────┘                                                             │
│                                                                              │
│  ══════════════════════════════════════════════════════════════════════════  │
│  🎉 이미지 엔진 전체 완료 - Pipeline Integration 28 tests 통과                │
│  ══════════════════════════════════════════════════════════════════════════  │
│                                                                              │
│  [독립 모듈 - 즉시 실행 가능]                                                  │
│  ├── SDD-MONITORING                                                          │
│  ├── SDD-GAP-FIXES                                                           │
│  ├── SDD-ACCESSIBILITY-GUIDELINES                                            │
│  ├── SDD-S1-C1-UX-IMPROVEMENT                                                │
│  ├── SDD-GLOBAL-DESIGN-SPECIFICATION                                         │
│  └── SDD-PHASE-E-SKIN-ZOOM ← 블로커 해제됨 (CIE 완료)                         │
│                                                                              │
│  [크로스 모듈 의존]                                                           │
│  ├── SDD-CROSS-MODULE-PROTOCOL → 분석 모듈 (PC/S/C) ✅ 모두 완료              │
│  ├── SDD-PHASE-D-SKIN-CONSULTATION → S-1 ✅                                   │
│  └── SDD-FASHION-CLOSET-INTEGRATION → C-1 ✅, 크로스모듈                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 업데이트 가이드라인

### 6.1 업데이트 트리거

| 이벤트 | 업데이트 항목 | 담당 |
|--------|--------------|------|
| SDD 구현 완료 | 상태 → ✅, P1 달성률 갱신, 대시보드 | 개발자 |
| ATOM 완료 | 해당 ATOM 상태 → ✅ | 개발자 |
| 새 SDD 추가 | P1 섹션 행 추가, P3 필요성 판단 | PM |
| 스프린트 시작 | Action Items 섹션 갱신 | PM |
| 주간 리뷰 | 전체 통계 검증, 블로커 업데이트 | PM |

### 6.2 상태 레이블

| 레이블 | 의미 |
|--------|------|
| ✅ Implemented | 구현 완료, P1 80%+ 달성 |
| 🔄 In Progress | 구현 중 |
| 📋 Planned | P3 완료, 구현 대기 |
| ⏸️ Deferred | 연기 (이유 명시) |
| ❌ Blocked | 의존성/외부 요인 차단 |
| ⬜ | ATOM 미시작 |

### 6.3 P1 달성률 산정 기준

```
P1 달성률 = Σ(항목별 가중치 × 완성도) / Σ(항목별 가중치)

가중치:
- 핵심 기능: ×3
- 부가 기능: ×2
- 최적화/고도화: ×1

예시 (SDD-COACH-AI-CHAT):
- 채팅 UI (핵심, 100%) = 3 × 1.0 = 3.0
- Gemini 연동 (핵심, 100%) = 3 × 1.0 = 3.0
- 음성 입력 (부가, 0%) = 2 × 0.0 = 0.0
- 멀티모달 (최적화, 0%) = 1 × 0.0 = 0.0

달성률 = (3.0 + 3.0) / (3 + 3 + 2 + 1) = 6.0 / 9.0 = 66.7%
→ 실제 85%는 다른 항목들 포함
```

### 6.4 주간 리뷰 체크리스트

```
□ 대시보드 통계 정확성 확인
□ Action Items 우선순위 재검토
□ Blocked 항목 해제 여부 확인
□ 신규 블로커 식별 및 기록
□ P3 미완료 SDD 중 분해 필요 식별
□ ROADMAP-LAUNCH.md와 일관성 확인
```

---

## 7. 관련 문서 연계

| 문서 | 역할 | 상태 |
|------|------|------|
| [ROADMAP-LAUNCH.md](./ROADMAP-LAUNCH.md) | 런칭 로드맵, 주간 목표 | ✅ 유지 |
| [SDD-ULTIMATE-CHECKLIST.md](./specs/SDD-ULTIMATE-CHECKLIST.md) | AI 품질 체크리스트 | ✅ 유지 |
| [ops/LAUNCH-CHECKLIST.md](./ops/LAUNCH-CHECKLIST.md) | 배포 전 체크리스트 | ✅ 유지 |
| [FIRST-PRINCIPLES.md](./FIRST-PRINCIPLES.md) | P0~P8 원칙 정의 | ✅ 참조 |
| [specs/README.md](./specs/README.md) | 전체 스펙 목록 | ✅ 참조 |

---

## 8. P1 정보 누락 SDD (3개)

> 이 문서들은 P1 달성률 섹션 추가가 필요합니다.

| SDD | 현재 상태 | 조치 필요 |
|-----|----------|----------|
| SDD-GLOBAL-PARTNERS-EXPANSION | P1 섹션 없음 | P1 섹션 작성 |
| SDD-MASTER-REFACTORING-PLAN | 메타 문서 | P1 불필요 (허브 문서) |
| SDD-ULTIMATE-CHECKLIST | 메타 문서 | P1 불필요 (체크리스트) |

---

**Version**: 1.9 | **Created**: 2026-01-29 | **Updated**: 2026-01-30
**Owner**: 개발팀 / PM
**Review Cycle**: 주간
**Next Review**: 2026-02-05

---

## 9. Changelog

### v1.9 (2026-01-30) - Plan v8.0 P1 완료
- **Insights 모듈**: `lib/insights/` 구조 생성
  - index.ts (Barrel Export)
  - types.ts (InsightType, InsightPriority, AnalysisDataBundle)
  - generator.ts (6개 인사이트 생성 함수)
  - scoring.ts (우선순위 점수 계산)
  - cross-module-insights.ts (DB 연동, 진행률, 추천 분석 순서)
- **Coach RAG 실 데이터**: workout-rag.ts 실제 운동 DB 연결 (60+ exercises, MET 기반 칼로리)
- **Webhook 서명 검증**: Clerk webhook (Svix), affiliate/conversion (HMAC-SHA256)
- **보안 헤더**: proxy.ts에 4개 헤더 추가 (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- 섹션 4.5 (크로스 모듈), 4.6 (보안) 신규 추가

### v1.8 (2026-01-30) - W-2 Stretching 100%
- W-2 Advanced Stretching 완료 (janda-protocol.ts, sport-warmup.ts)
- CIE-1~4 전체 완료 (579 tests)
- v2 API Gemini 통합 완료
