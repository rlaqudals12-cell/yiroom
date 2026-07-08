# ADR-111: One Canon IA — 정보 유형별 정본 1곳 원칙

**Status**: Accepted
**Date**: 2026-07-09
**Deciders**: 사용자(창업자) + Claude Code
**관련**: ADR-109(프로필 중심 홈), ADR-104(출시 기준), `memory/product-direction-ai-consultant.md`

---

## 배경 (Context)

깐깐한 사용자 시뮬레이션 4종(무지 초보·오프라인 컨설팅 경험자·호기심·투자 심사역)과 창업자 실사용 피드백이 동일한 결함을 지적했다:

> "통합 모듈이라면서 종합 컨설팅이 아니라 여기따로 저기따로. 같은 앱 맞나? 중구난방."

실측 조사 결과, 같은 정보 유형이 서로 다른 데이터 소스·표현으로 다중 존재:

| 정보 유형      | 중복 실태                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 분석 진입      | `/analysis` 정적 메뉴판(13+ 표면에서 유입) vs 홈 ProfileCardGrid 빈칸 CTA                                     |
| 축별 결과 요약 | 프로필 "내 분석 결과"(3축, 인라인 쿼리, 자체 라벨맵) vs 홈 ProfileCardGrid(5축, useAnalysisStatus, 공용 라벨) |
| 통합 결과      | 세션 고유물 + 개별 결과의 축약 재현(AxesSummaryCard/AxisDetailAccordion) 혼재                                 |
| 제품 추천      | 개별 결과 4페이지 × 2블록(RecommendedProducts + AnalysisMatchedProducts) + 통합 CurationCard = 3중            |
| 스킨케어 루틴  | `generateRoutine` 정본 3표면 vs 스킨 결과 페이지만 Mock(EASY_SKIN_TIPS)+DB 문자열로 이탈                      |

이는 제품 방향("전문가 컨설팅의 AI 대체 — 결론 먼저, 복잡성은 이룸이 삼킨다")과 정면 충돌한다. 컨설턴트는 같은 질문에 다른 답을 두 번 하지 않는다.

## 결정 (Decision)

**모든 정보 유형에 정본(canon) 표면을 정확히 1곳 지정하고, 나머지 표면은 흡수(재사용)하거나 링크로 위임한다.**

| 정보 유형             | 정본                                                                                                           | 나머지 표면의 처리                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 분석 진입 + 축별 요약 | **홈 ProfileCardGrid** (5축 채워지는 프로필, ADR-109)                                                          | `/analysis` 허브 → `/home` redirect. 프로필 페이지 섹션 → ProfileCardGrid 재사용(컴포넌트 `components/profile/` 승격) |
| 축 상세(심화)         | **개별 결과 페이지** (`/analysis/{axis}/result/[id]`)                                                          | 통합 결과의 AxesSummaryCard·AxisDetailAccordion 제거, 축별 심화 링크로 위임                                           |
| 통합 결과             | **세션 고유물만** — Persona → ActionPlan → CrossInsights → Curation → 심화 링크 → Share (컨설팅 리포트 스토리) | 개별 결과 재현물 제거                                                                                                 |
| 제품 추천(개별)       | **AnalysisMatchedProducts** (실DB + 개인화 + matchReasons)                                                     | RecommendedProducts 블록 제거                                                                                         |
| 스킨케어 루틴         | **`lib/skincare/routine.ts` generateRoutine**                                                                  | 스킨 결과 페이지의 Mock/DB문자열 루틴 → 정본 요약 + 루틴 페이지 링크                                                  |

링크 재배선은 인텐트 기준: "내 결과 보기" → `/home`, "새 분석 시작" → `/analysis/integrated`(또는 해당 축 직행), 에러 폴백 → `/home`.

## 대안과 트레이드오프 (Alternatives)

1. **`/analysis` 허브를 리치화(결과 상태 표시 추가)** — 기각: ProfileCardGrid와 완전 중복인 두 번째 정본을 만드는 것. 유지보수 2배.
2. **통합 결과에 축 상세 유지(원스톱)** — 기각: 개별 페이지와 이중 유지보수, 시뮬에서 "정보 과다" 지적의 주범. 심화는 링크 1탭이면 충분.
3. **점진적 방치(새 표면만 규칙 적용)** — 기각: 중복은 늘어나기만 함. 시뮬·GFSA 피드백이 이미 비용을 증명.

**수용한 트레이드오프**: `/analysis` 북마크 사용자에게 화면 변화(redirect로 연속성 유지) / 통합 결과에서 축 수치를 보려면 1탭 추가(대신 결론 중심 리포트 획득) / 모바일 앱과 일시적 IA 격차(후속 패리티로 해소).

## 결과 (Consequences)

- 사용자 여정: 홈(프로필) = 시작이자 현황판, 통합 결과 = 컨설팅 리포트, 개별 결과 = 심화 — 3계층 명확화.
- 죽은 코드 삭제: AxesSummaryCard, AxisDetailAccordion, RecommendedProducts(사용처 소멸 시), 프로필 인라인 쿼리+라벨맵.
- 신규 표면(가상 착장·제품 스캔·성분 타임라인)은 이 정본 위에만 추가한다 — 정본이 없는 정보 유형을 새로 만들 때는 본 ADR 표에 행을 추가할 것.

## 검증 기준

- `/analysis` 정확 경로 참조 grep 0건(redirect 자신 제외)
- 전체 테스트 그린, tsc/lint 0
- 스킨 결과 페이지 루틴 == 캡슐 데일리 루틴 (동일 엔진 확인)
