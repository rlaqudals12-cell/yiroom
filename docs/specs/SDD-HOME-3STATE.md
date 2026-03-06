# SDD: 홈 3-State 리디자인

> **상태**: 초안 (Draft)
> **날짜**: 2026-03-07
> **ADR**: [ADR-076](../adr/ADR-076-home-3state-redesign.md)
> **원칙**: [UX Design Principles](../principles/ux-design.md)
> **궁극의 형태**: 열 때마다 나에 맞는 한마디를 건네는 동반자 (목표: 70%)

---

## 1. 배경 및 목표

### 현재 문제

현재 홈(page.tsx)은 모든 사용자에게 동일한 구조를 보여줌:

- 위젯 7개+ 동시 노출 -> Miller Law 위반 (정보 블록 5개 초과)
- 신규 사용자에게 불필요한 위젯 노출 -> 48% 첫 화면 이탈
- Active 사용자에게 온보딩 체크리스트 표시 -> 비효율

### 목표

| 지표              | 현재 | 목표 |
| ----------------- | :--: | :--: |
| 첫 분석 시작률    | 52%  | 85%+ |
| 복잡하다 반응     | 43%  | <10% |
| 화면 정보 블록 수 |  7+  | <=5  |

---

## 2. State 정의

### 분기 기준

\

> **기준**: useAnalysisStatus().analysisCount (6개 분석 테이블 카운트)

### 경계값 변경

\

> **비호환 변경**: isPartialUser -> isGrowingUser 리네이밍. 기존 사용처 일괄 교체.

---

## 3. State별 화면 스펙

### 3.1 State: New (분석 0개)

**감정 목표**: 와, 깔끔하다 (Visceral)
**정보 블록**: 3개

**NewUserHero 상세**:

| 요소         | 스펙                                                   |
| ------------ | ------------------------------------------------------ |
| 제목         | 나에게 어울리는 색, 피부, 스타일을 AI가 알려줄게요     |
| Primary CTA  | 2개 버튼 (퍼스널 컬러 / 피부 분석) - 카드형, 동일 크기 |
| Secondary    | 텍스트 링크: 체형 / 헤어 / 메이크업                    |
| Social Proof | 동적 텍스트: 오늘 N명이 분석했어요 (시드 데이터)       |
| 스타일       | bg-gradient from-violet-50 to-indigo-50, rounded-2xl   |

**NewUserSurveyAlt 상세**:

| 요소   | 스펙                                         |
| ------ | -------------------------------------------- |
| 문구   | 사진 없이 시작하고 싶다면                    |
| CTA    | 간편 설문으로 시작하기 -> /onboarding/survey |
| 스타일 | 텍스트 + 작은 화살표, 강조 없음              |

### 3.2 State: Growing (1~3개 완료)

**감정 목표**: 더 알고 싶다 (Behavioral)
**정보 블록**: 4개

**GrowingDiscovery 상세**:

| 요소       | 스펙                                               |
| ---------- | -------------------------------------------------- |
| 제목       | 나에 대해 {N}가지를 발견했어요 (N = analysisCount) |
| 분석 칩    | 완료된 분석별 아이콘+결과 (최대 3개)               |
| 프로그레스 | {N}/6 분석 완료 바 (AnalysisProgressBar 재사용)    |

**GrowingNextStep 인과 연결 매핑**:

| 완료 분석      | 다음 추천   | 연결 메시지                                            |
| -------------- | ----------- | ------------------------------------------------------ |
| personal-color | body        | {season}에 맞는 코디를 추천하려면 체형 정보가 필요해요 |
| skin           | makeup      | 피부 타입에 맞는 메이크업 스타일을 찾아볼까요?         |
| body           | hair        | 체형에 어울리는 헤어 스타일도 궁금하지 않으세요?       |
| hair           | makeup      | 헤어와 조화로운 메이크업 톤을 알아볼까요?              |
| makeup         | oral-health | 미소까지 완벽하게! 구강건강도 체크해봐요               |

우선순위: 가장 최근 완료 분석 기준. Fallback: 미완료 중 첫 번째.

### 3.3 State: Active (4+개 완료)

**감정 목표**: 없으면 불편한 앱 (Reflective)
**정보 블록**: 4~5개

**ActiveDailyInsight 상세**:

| 요소       | 스펙                                     |
| ---------- | ---------------------------------------- |
| 한 줄 제안 | 시간+날씨+분석결과 기반 개인화 (P-UX3)   |
| CCS 한 줄  | {score}점 상위 {percentile}% {weekDelta} |
| 제안 생성  | lib/capsule/daily-insight.ts 신규 모듈   |
| 스타일     | 카드 상단 하이라이트, gradient accent    |

---

## 4. page.tsx 변경 스펙

\

### HomeStateRouter (신규)

## \

## 5. 파일 변경 계획

### 신규 파일 (7개)

| 파일                                | 설명                     |
| ----------------------------------- | ------------------------ |
| \_components/HomeStateRouter.tsx    | State 분기 라우터        |
| \_components/HomeStateNew.tsx       | New State 컨테이너       |
| \_components/HomeStateGrowing.tsx   | Growing State 컨테이너   |
| \_components/HomeStateActive.tsx    | Active State 컨테이너    |
| \_components/NewUserHero.tsx        | 신규 사용자 히어로 섹션  |
| \_components/GrowingNextStep.tsx    | 인과 연결 다음 분석 추천 |
| \_components/ActiveDailyInsight.tsx | 맥락 기반 오늘의 제안    |

### 수정 파일 (3개)

| 파일                       | 변경 내용                                       |
| -------------------------- | ----------------------------------------------- |
| page.tsx                   | 기존 위젯 나열 -> HomeStateRouter 단일 Suspense |
| hooks/useAnalysisStatus.ts | isPartialUser -> isGrowingUser, 경계값 3->4     |
| HomeDashboardWidgets.tsx   | Active State에서 경량 모드 prop 추가            |

### 재사용 컴포넌트

| 기존 컴포넌트           | 사용 State       | 비고                     |
| ----------------------- | ---------------- | ------------------------ |
| HomeAnalysisPrompt      | -                | NewUserHero로 대체       |
| HomeOnboardingChecklist | -                | New State 히어로로 대체  |
| HomeAnalysisSummary     | Growing + Active | 축소 모드                |
| HomeDailyCapsuleWidget  | Active           | 그대로                   |
| HomeTodayRecommendation | -                | GrowingNextStep으로 대체 |
| HomeRecentlyViewed      | Growing + Active | 그대로                   |
| HomeDashboardWidgets    | Active           | 경량 모드                |
| AnalysisProgressBar     | Growing          | 그대로                   |
| CrossModuleCard         | Growing + Active | 그대로                   |

---

## 6. 데이터 의존성

| 데이터              | 소스                   | State   |
| ------------------- | ---------------------- | ------- |
| 분석 완료 수/요약   | useAnalysisStatus()    | All     |
| Social Proof 카운트 | 시드 값 or API         | New     |
| 인과 연결 매핑      | 로컬 상수              | Growing |
| 날씨 데이터         | lib/weather/ API       | Active  |
| CCS 점수            | lib/capsule/scoring.ts | Active  |
| Daily Capsule       | /api/capsule/daily     | Active  |

---

## 7. 테스트 계획

### 단위 테스트

| 테스트                     | 파일                     |
| -------------------------- | ------------------------ |
| getHomeState(0) -> new     | HomeStateRouter.test.tsx |
| getHomeState(2) -> growing | HomeStateRouter.test.tsx |
| getHomeState(4) -> active  | HomeStateRouter.test.tsx |
| getNextStep() 인과 매핑    | GrowingNextStep.test.tsx |

### 컴포넌트 테스트

| 테스트               | 검증                                         |
| -------------------- | -------------------------------------------- |
| New State 렌더링     | 2개 CTA 버튼, Social Proof 텍스트, 설문 대안 |
| Growing State 렌더링 | 발견 수, 프로그레스 바, 인과 연결 메시지     |
| Active State 렌더링  | 오늘의 제안, Daily Capsule, 분석 요약        |
| State 전환           | analysisCount 변경 시 올바른 State 렌더링    |

### data-testid 규칙

- home-state-new
- home-state-growing
- home-state-active
- home-new-hero
- home-new-survey-alt
- home-growing-discovery
- home-growing-next-step
- home-active-daily-insight

---

## 8. P3 원자 분해

| ID  | 원자                          | 소요    | 의존성     |
| --- | ----------------------------- | ------- | ---------- |
| H1  | useAnalysisStatus 경계값 변경 | 30분    | -          |
| H2  | HomeStateRouter 분기 로직     | 1시간   | H1         |
| H3  | HomeStateNew + NewUserHero    | 1.5시간 | H2         |
| H4  | GrowingNextStep 인과 매핑     | 1시간   | -          |
| H5  | HomeStateGrowing 조립         | 1시간   | H2, H4     |
| H6  | ActiveDailyInsight 제안 로직  | 1.5시간 | -          |
| H7  | HomeStateActive 조립          | 1시간   | H2, H6     |
| H8  | page.tsx 교체 + 통합          | 1시간   | H3, H5, H7 |
| H9  | 테스트 작성                   | 1.5시간 | H8         |

의존성: H1->H2->H3/H5/H7->H8->H9, H4->H5, H6->H7 (병렬: H4, H6)

---

## 9. 의도적 제외

| 항목                       | 이유                                |
| -------------------------- | ----------------------------------- |
| A/B 테스트 프레임워크      | MAU 부족, 출시 후 도입              |
| 날씨 API 실시간 연동       | MVP는 시간대 기반만, 날씨는 Phase 2 |
| Social Proof 실시간 카운트 | 시드 데이터로 시작                  |
| 복잡한 전환 애니메이션     | fade만 사용                         |
| onboarding survey 페이지   | CTA만 준비, 구현은 별도 SDD         |

---

## 10. 성공 기준

| 기준           | 측정 방법                  |
| -------------- | -------------------------- |
| typecheck 통과 | npm run typecheck 0 errors |
| lint 통과      | npm run lint 0 errors      |
| 테스트 통과    | 신규 15+ 테스트 pass       |
| 빌드 성공      | npm run build 144+ pages   |
| 정보 블록 <=5  | 각 State별 카드 수 카운트  |
| CTA <=2        | 각 State별 Primary 버튼 수 |

---

**Version**: 1.0 | **Created**: 2026-03-07
**P7 Status**: 리서치 Done -> 원칙 Done -> ADR Done -> **스펙 Done** -> 구현 Next
