# ADR-109: 프로필 중심 분석 아키텍처 (통합/개별 → "하나의 나")

- **Status**: accepted (구현 단계별 — Phase 0~4)
- **Date**: 2026-06-19
- **관련**: [ADR-098](./ADR-098-identity-redefinition-5axis-model.md)(5축 정체성), [ADR-100](./ADR-100-integrated-analysis-ui.md)(통합 분석), [ADR-101](./ADR-101-integrated-primary-cta.md)(통합 Primary CTA), [ADR-104](./ADR-104-integrated-result-vision.md)(통합 결과), [ADR-107](./ADR-107-recommendation-model-single-vs-cross-axis.md)(추천 모델), [ADR-108](./ADR-108-axis-accuracy-upgrade-roadmap.md)(축별 정확도) · 메모 `analysis-profile-centric-direction.md`

---

## Context

이룸은 "분석 도구 5개(개별) + 통합 분석"이 **중복**된 구조다. 개별 모듈이 먼저(Phase 1), 통합이 나중에(ADR-100/101) 얹혀 **역사적 누적**이지 의도된 설계가 아니다. 문제:

- 같은 셀카인데 통합·개별에서 **재업로드** 마찰 (`lib/analysis/photo-reuse.ts`가 표준 skin에만 연결, 통합 미연결).
- 통합은 재촬영 시 **5축 강제 재실행** → 변동성 큰 피부 결과가 **안 변해야 할 색·체형까지 흔들 위험**(신뢰 붕괴).
- 홈이 "메뉴 모음"이라 **차별화 약함** (현 형태로 Google 프로그램 탈락 이력).

핵심 통찰: 이룸의 궁극(P1)은 _"나를 가장 잘 아는 존재"_ → 중심은 **분석 도구**가 아니라 **하나의 나(프로필)**여야 한다. 분석 = 프로필을 채우는 행위.

## Decision

**홈/대시보드를 "채워지는 5축 정체성 프로필"로 전환.** 한 번 찍으면 얼굴 공유 4축이 채워지고, 축마다 다른 주기로 갱신. 통합·개별을 대립시키지 않고 **"프로필 = 넓이 입구 + 각 칸 = 개별 깊이로 진입"**으로 잇는다.

### 1. 변동 3그룹 (솔루션 안정성의 핵심)

매번 5축 재분석 ❌ → **변하는 것만 갱신**:

| 그룹             | 축                        | 주기            | 처리                               |
| ---------------- | ------------------------- | --------------- | ---------------------------------- |
| **identity** 🔒  | 퍼스널컬러(언더톤)        | 평생            | 1회 확정, 직접 재분석 전 불변      |
| **slow** 🔄      | 체형·헤어(얼굴형)         | 몇 달·체중·나이 | 뼈대 고정+살 변동. 재확인 프롬프트 |
| **condition** 📅 | 피부, 메이크업(PC+S 파생) | 매일            | 자주 갱신, 추이로 표시             |

단일 진실원천 상수: `{personal_color:'identity', body:'slow', hair:'slow', skin:'condition', makeup:'condition'}` (`@yiroom/shared`).

### 2. 2층 추천 (cascade 방지)

추천을 **identity-base(고정) + condition-adjust(가변)** 2층으로. **레이어 = 입력 축의 최대 변동성**(입력이 정체성 축뿐→고정 / 피부 포함→가변). 피부 갱신 시 condition 층만 재계산 → "웜톤→코랄" 큰 틀 유지, "오늘 건조→촉촉 베이스"만 변동.

### 3. 1회 캡처 + 선택 재분석

셀카 1장 = 얼굴 4축. 체형만 전신/자가입력(나중). `photo-reuse`(동의 기반)를 통합에 연결해 재업로드 제거. 오케스트레이터에 `mode/axes` 추가 → "피부만 다시" 가능(색/체형 불변).

### 4. 솔루션 무손실 (개별 깊이 + 통합 넓이 = 둘 다)

- 개별 "깊이"(루틴·draping·히트맵·성분·팔레트)는 **대부분 타입 파생(Hybrid)** → 경로 무관 보존. 카드 칸 클릭 → 개별 깊은 결과로 라우팅.
- 통합 "넓이"(페르소나·교차·액션·큐레이션) = 순수함수 → **골든 스냅샷 회귀 게이트**로 무손실 보장.
- 분석-데이터 의존 깊이(12존·성분 등)는 통합 저장을 개별 수준으로 **풍부화**(피부 우선).

## Alternatives (기각)

- **통합-only(개별 제거)**: 개별 "깊이"(제품명·루틴·draping) 손실 + 단일-의도 편의성 상실. 기각.
- **개별-only(통합 제거)**: "엮어주는" 핵심 가치(정체성 v2 thesis) 상실. 기각.
- **user_analysis_profiles 스냅샷 테이블 신설**: `useAnalysisStatus`가 이미 latest-per-axis 집계 = 프로필 → 과한 설계(P4). 기각.

## Consequences

- ✅ 개별 깊이 + 통합 넓이 둘 다 확보(무손실), 피부 흔들림 차단, 1회 캡처, 차별화 데모.
- ⚠️ Type-1(되돌리기 어려움)·개인정보 얽힘 → P7(ADR→SDD→구현) + feature flag(`PROFILE_HOME`, shared) 점진.
- ⚠️ 보존 보강 필요: **게이미피케이션**(통합 경로 현재 누락 → 부여), 신규 온보딩/설문 경로 유지, 진행 컴포넌트 통합.
- ✅ 모바일 패리티 완료(2026-07): 웹과 동일한 5축 프로필 홈.

## 구현

스펙 → [SDD-PROFILE-CENTRIC-ANALYSIS](../specs/SDD-PROFILE-CENTRIC-ANALYSIS.md). 계획 → `.claude/plans/zippy-petting-cat.md`.

## 구현 현황 (2026-07-04)

| Phase  | 내용                                                                                                                                           | 커밋       |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1·3    | 프로필 홈(ProfileCardGrid)·2층 추천·피부 추이 칩(웹)                                                                                           | (선행)     |
| **2A** | 1회 캡처 + 선택 재분석 — `mode:'full'\|'update'` + `axes[]`, 제외 축은 latest 유지(흔들림 차단)                                                | `c734e48b` |
| **2C** | 솔루션 무손실 — 통합 skin 저장을 단독과 동일 깊이로(`skin-enrichment.ts`: 성분경고·루틴·추천성분). skinType+지표 결정론 파생, V1 라우트 미변경 | `2ac27183` |
| **4A** | `computeSkinTrend` → `@yiroom/shared` 승격(웹·앱 공유)                                                                                         | `034c5d6c` |
| **4B** | 모바일 `useUserAnalyses` 5축 정합 — hair/makeup 오라벨 버그 정정 + 피부 추이 필드                                                              | `034c5d6c` |
| **4C** | 웹 ProfileCardGrid → RN 포팅(`apps/mobile/components/home/ProfileCardGrid.tsx`·`profile-meta.ts`·`useProfilePersona`)                          | `e37494d1` |
| **4D** | 모바일 홈 통합 — `PROFILE_HOME` 게이팅 마운트 + 3-State 히어로 중복 억제(/6→/5)                                                                | `e37494d1` |

> 보류: 게이미피케이션 통합 경로 부여(Consequences ⚠️), 모바일 개별결과 딥링크 풀라우팅(현재 우회). 통합 이미지 라이프사이클(동의+retention+삭제)은 별도 SDD 예정.
