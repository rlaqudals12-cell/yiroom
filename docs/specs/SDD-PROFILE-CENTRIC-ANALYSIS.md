# SDD: 프로필 중심 분석 (통합/개별 → "하나의 나")

> [ADR-109](../adr/ADR-109-profile-centric-analysis-architecture.md) 구현 스펙
> P7: 리서치 → 원리(body-mechanics 등) → ADR(109) → **스펙(본 문서)** → 구현
> Status: implemented (Phase 0~4, 웹+앱) | Created: 2026-06-19 | Updated: 2026-07-04 | 계획: `.claude/plans/zippy-petting-cat.md`

---

## 1. 목표 / 비목표

- **목표**: 홈을 "채워지는 5축 프로필"로. 1회 캡처 점진 채움, 변동 3그룹별 갱신, 2층 추천, 개별 깊이+통합 넓이 무손실.
- **비목표(차기)**: 모바일 패리티(웹 전용), N-1 영양 연동, 멀티앵글 체형.

## 2. 데이터 흐름 (신규 테이블 없음)

`hooks/useAnalysisStatus.ts`가 이미 **축별 최신 1건(latest-per-axis)** 집계 = 프로필. 각 축은 자기 테이블(personal_color_assessments/skin_analyses/body_analyses/hair_analyses/makeup_analyses)에 누적 저장, session_id로 통합과 연결. 프로필 = 5개 테이블의 latest 행. 독립 갱신은 읽기 레벨에서 이미 동작.

## 3. 변동 3그룹 상수 (단일 진실원천)

`@yiroom/shared` (또는 `lib/analysis/axis-cadence.ts`):

```ts
export const AXIS_CADENCE = {
  personal_color: 'identity', // 🔒 평생
  body: 'slow', // 🔄 몇 달·체중
  hair: 'slow', // 🔄
  skin: 'condition', // 📅 매일
  makeup: 'condition', // 📅 PC+S 파생
} as const;
export type CadenceGroup = 'identity' | 'slow' | 'condition';
```

프로필 아이콘(🔒/🔄/📅)·갱신 프롬프트·2층 레이어 규칙이 이 상수 공유.

## 4. 프로필 카드 (Phase 1)

- `hooks/useAnalysisStatus.ts` 확장: 축별 `freshness`(createdAt 상대시간) + `cadence`(AXIS_CADENCE) 부가. 쿼리 불변, 매핑만.
- 신규 `app/(main)/home/_components/ProfileCardGrid.tsx` + `ProfileCardItem.tsx` + `ProfileCardEmpty.tsx`:
  - 5칸: 값 + 완성도 미터 + 변동 아이콘 + (완료/빈칸/진행).
  - `ANALYSIS_META`(`HomeAnalysisSummary.tsx:11-74`) → 공용 상수 추출 후 재사용.
  - **빈칸 = CTA**(그 축 분석), **완료칸 클릭 = 개별 깊은 결과**(축 심화).
- `HomeStateRouter`/New·Growing·Active: 프로필 카드 최상위. `HomeAnalysisSummary`·`AnalysisProgressBar`·`HomeOnboardingChecklist` 기능 **흡수·통합**(중복 진행 UI 제거).
- **빈 프로필(New) = `NewUserHero`(히어로·시너지·설문 대안) 유지 + 프로필 카드 보조** (통째 대체 ❌).
- feature flag `PROFILE_HOME`(shared, sync) 게이팅 — OFF면 기존 홈.
- 내비: 통합 완료 → 프로필 복귀 + "이번 분석"(`result/[sessionId]`) 링크. 카드→개별 깊은 결과. 통합 결과는 스냅샷 유지.

## 5. 캡처·재사용·동의·선택 재분석 (Phase 2)

- 동의 모달 `components/analysis/ImageConsentModal.tsx`: 기본=즉시삭제(신뢰 카피 불변), 보관=명시 옵트인(N일, 재촬영 면제). `image_consents`/`analysis_images` + `photo-reuse.saveAnalysisImage`.
- `photo-reuse`를 통합 캡처에 연결: `checkPhotoReuseEligibility`로 재방문 시 재촬영 스킵.
- 선택 재분석: `orchestrator.ts` `mode:'full'|'update'` + `axes:[]` → 선택 축만 Gemini, 나머지 프로필 최신값 유지(cadence locking).
- **통합 축 저장 풍부화(S 최우선)**: `runSkinAxis`가 개별 수준 저장(성분경고·problem_areas·image_analysis 근거). C/H/M은 measurements·image_url 이미 저장 → 작업 없음.
- **게이미피케이션 보존**: orchestrator finalize에서 완료 축별 XP/배지(`lib/gamification`, 개별 route 동등). 통합 현재 누락 동시 수정 + 선택 재분석 중복 award 가드.

## 6. 2층 추천 + 추이 (Phase 3)

- 신규 `lib/analysis/recommendation-engine.ts`: `buildRecommendations(profile) → { identity: Rec[]; condition: Rec[] }`.
  - 레이어 규칙 = 입력 축 최대 변동성. 태깅: `pcXmakeup`·`bodyXhair`·`pcXbody`·PC베스트컬러·체형원칙·헤어스타일=identity / `pcXskin`·`skinXmakeup`·피부루틴·action this_week 피부=condition.
  - `cross-insights`/`action-plan`/`curation`/개별 추천이 엔진 태깅 경유(내용 불변).
  - **회귀 게이트**: `composeCrossInsights`/`composeActionPlan`/`composeCuration` 순수함수(검증됨) → 골든 스냅샷 테스트로 출력 불변/superset 단언.
- 스킨 추이: `skin_analyses` 이력 → 기존 차트 재사용(`AnalysisTimelineChart`·`TrendChart`·`HistoryCompare`). 신규 차트 X.

## 7. 갱신주기 잠금 + 정리 (Phase 4)

- identity 자동 재실행 ❌. slow = 재확인 프롬프트. condition = 자주.
- `app/api/cron/cleanup-images/route.ts`: `retention_until` 초과 익명화·삭제. vercel.json cron.

## 8. 축별 깊이 무손실 표 (A=타입파생·보존 / B=분석데이터·풍부화)

| 축       | A (자동 보존)                                      | B (풍부화/게이트)                                  |
| -------- | -------------------------------------------------- | -------------------------------------------------- |
| PC       | 베스트/워스트·립스틱·파운데이션·의류·배색·시즌교육 | draping·전문가근거(이미지/동의 보관 게이트)        |
| **S 🔴** | 루틴·주간케어·T/U존                                | 성분경고·12존·문제영역·근거 → **통합 저장 풍부화** |
| C        | 원칙·아웃핏·옷장CTA                                | 실루엣·치수(measurements 이미 저장)                |
| H        | 성분효과·케어·스타일                               | 이미지(저장됨)                                     |
| M        | 전부                                               | 없음                                               |

## 9. 검증

- `cd apps/web && npx tsc --noEmit`(0) · eslint(0) · vitest(신규: ProfileCardGrid·recommendation-engine 골든 스냅샷·axis-cadence).
- feature flag로 점진/롤백. 로그인 워크스루(가이드 확장). prod 마이그(analysis_images/image_consents 존재 확인) gap-apply.

## 10. 단계

Phase 0(본 문서·ADR·상수) → 1(프로필 홈, 데모 핵심) → 2(캡처/재사용/동의/게이미피케이션) → 3(2층/추이) → 4(주기/정리). Phase 0~1 먼저 후 중간 점검.

### 구현 완료 (2026-07-04)

- **Phase 1·3(웹)**: ProfileCardGrid·2층 추천·피부 추이 칩.
- **Phase 2A**: 선택 재분석 — `mode:'full'|'update'` + `axes[]`, 제외 축 latest 유지 (`c734e48b`).
- **Phase 2C**: 통합 skin 저장 무손실 — `lib/analysis/integrated/internal/skin-enrichment.ts`(성분경고·루틴·추천성분을 skinType+지표 결정론 파생, V1 라우트 미변경, 실패 시 base 저장 불변) (`2ac27183`). §8 표의 B(풍부화) 항목 충족.
- **Phase 4(앱 패리티)**: `computeSkinTrend` shared 승격(`034c5d6c`) + 모바일 훅 5축 오라벨 정정 + ProfileCardGrid RN 포팅·홈 통합(`e37494d1`).
- **보류**: Phase 2 게이미피케이션 통합 경로 부여, 통합 이미지 라이프사이클(동의+retention) 별도 SDD.
