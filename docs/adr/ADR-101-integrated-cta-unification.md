# ADR-101: 통합 분석 CTA 일원화 — 랜딩 + 홈 진입점 통일

## 상태

`accepted`

## 날짜

2026-04-24

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"분석 진입점이 1개 — /analysis/integrated"

- 랜딩 페이지의 주 CTA = 통합 분석 진입
- 홈 페이지의 신규 사용자(New) CTA = 통합 분석 진입
- 발견(Growing) 사용자에게는 "5축 중 남은 축만 보완" 경로 제공
- 활성(Active) 사용자에게는 "통합 결과 페이지"(`/analysis/integrated/result/{sessionId}`) 바로가기
- 모듈별 개별 진입(`/analysis/personal-color`, `/analysis/skin`, ...)은 2차 메뉴로 격리
  → 심화/재측정 원하는 사용자만 접근
```

### 물리적 한계

| 항목               | 한계                                                   |
| ------------------ | ------------------------------------------------------ |
| 기존 사용자 데이터 | PC-1만 했거나 S-1만 한 사용자는 통합 세션 ID가 없음    |
| 홈 위젯 수         | 22개 마운트 중 일부는 FEATURE_FLAG 제어 (Phase 2 보류) |
| A/B 테스트         | 현재 분할 테스트 인프라 미완성 — 전체 전환 불가피      |
| 모바일 동기화      | 웹 CTA 전환 후 모바일은 별도 포팅 필요                 |
| 인덱싱된 기존 URL  | `/analysis/personal-color` 등 기존 URL 유지 필수 (SEO) |

### 100점 기준

- 랜딩/홈 주 CTA 클릭 시 100% 통합 플로우로 진입
- 신규 사용자(New) 완주율: 기존 퍼스널컬러 단독 진입 대비 ≥ 80% (통합은 설문 추가 있음)
- Active 사용자 홈 재방문 시 통합 결과 페이지 진입 1-Click
- 모듈별 개별 URL은 그대로 살아있음 (하위 호환)
- 통합 결과 없는 기존 사용자는 "통합 분석 새로 시작" CTA 유도

### 현재 목표: 60%

- 랜딩 `startFree`/`ctaStart`/`bottomCtaSignUp` → `/analysis/integrated`
- 홈 NewUserHero CTA 2개 → 통합 CTA 1개
- 홈 GrowingNextStep — 통합 세션 없으면 "통합 분석 먼저 시작" 권유
- 홈 ActiveInsightCard 또는 HomeAnalysisSummary — 최신 통합 세션 링크
- 모바일 CTA 전환은 Phase C.2(별도 ADR)

### 의도적 제외

| 제외 항목                                      | 이유                         | 재검토 시점                |
| ---------------------------------------------- | ---------------------------- | -------------------------- |
| 22개 홈 위젯 전면 재구조화                     | 리스크 크고 출시 전 불필요   | MAU 1만+ 이후              |
| 모듈별 개별 페이지 제거                        | 기존 URL/북마크/SEO 손상     | 출시 후 90일 데이터 기반   |
| 온보딩 "시작 의도 선택" 1문항 추가             | 통합 플로우 자체가 의도 통합 | 이탈 데이터 분석 후        |
| 모바일 홈 성능 개선 (ScrollView → FlatList)    | 실기기 검증 필요             | 실기기 테스트 후 별도 작업 |
| A/B 테스트 분할 노출                           | 인프라 미비 + MAU 소규모     | MAU 1만+                   |
| HomeStreakWidget, HomeTodayRecommendation 정리 | 중복이지만 제거 리스크       | MAU 데이터 기반            |

## 1. 맥락 (Context)

### 1.1 현재 상태

2026-04-24 기준 이룸의 CTA 분포:

- 랜딩 페이지: PC-1 단독 CTA (`startFree`, `ctaStart`, `bottomCtaSignUp` 3곳 모두 PC로 연결)
- 홈 NewUserHero (신규 사용자): PC + S 2개 CTA
- 홈 GrowingNextStep (1-3축 완료): 모듈별 다음 분석 추천 (5곳 이상)
- 홈 HomeAnalysisSummary (4+축 완료): 모듈별 결과 카드 (5개)

→ **분석 진입이 5곳 이상으로 산재**. ADR-099/100 통합 플로우가 있어도 사용자가 접근할 경로 없음.

### 1.2 ADR-099/100과의 관계

- ADR-099 — 통합 분석 백엔드 API (완료)
- ADR-100 — 통합 분석 UI 페이지 (완료)
- **ADR-101** — 이 두 결과물을 사용자가 실제로 만나도록 **진입점 연결**

Phase A(ADR-099) + Phase B(ADR-100)가 제공하는 가치는 **사용자가 통합 플로우에 진입해야만** 실현됨. 진입 안 하면 백엔드/UI 모두 죽은 코드.

### 1.3 UX 가설

ADR-098 정체성 재정의 v2:

> "셀카 1장 + 전신 1장 + 자가입력 2분으로 5축 완전 파악"

이 약속은 **사용자가 통합 플로우를 첫 번째 만남으로 체험**해야 실현됨. 기존처럼 PC-1만 진입 → 결과 → "다음 분석도 해볼래?" 플로우는 괴리가 큼.

### 1.4 기술적 안전장치

- 기존 개별 모듈 URL은 그대로 유지 (하위 호환)
- `useAnalysisStatus()` 훅이 이미 6개 테이블 병렬 조회 + 캐싱 (Phase C에서 활용)
- 통합 세션 조회는 `integrated_analysis_sessions` 테이블 + `session_id` FK

## 2. 결정 (Decision)

### 2.1 랜딩 CTA 3곳 모두 통합 플로우로 전환

대상 파일: `apps/web/app/LandingContent.tsx`

- `startFree` (히어로) — `SignInButton` 후 `/analysis/integrated`로 이동
- `ctaStart` (하단 CTA) — 동일
- `bottomCtaSignUp` (최하단 풋 CTA) — 동일
- `goToDashboard` / `ctaViewResults` (로그인 사용자용) — `/home` 유지 (기존 동일)

i18n 키:

- `landing.startFree`, `landing.ctaStart`, `landing.bottomCtaSignUp` 문구는 이미 통합 컨셉 ("내 정체성 5축 한 번에") 지원
- 필요 시 문구만 미세 조정

### 2.2 홈 NewUserHero (신규 사용자) CTA 단일화

현재: PC + S 2개 버튼
변경: 통합 분석 1개 + 설문 대안 유지

```tsx
// Before
<Link href="/analysis/personal-color">첫 분석 시작</Link>
<Link href="/analysis/skin">피부 먼저</Link>

// After
<Link href="/analysis/integrated">내 정체성 5축 알아보기</Link>
<Link href="/onboarding/survey">설문으로 시작</Link>
```

### 2.3 홈 GrowingNextStep (1-3축 완료) 권유

통합 세션이 없는 기존 사용자 감지:

- `useAnalysisStatus()`로 축별 완료 확인
- `integrated_analysis_sessions` 최신 레코드 조회 (있으면 최근 세션 링크)
- 둘 다 없으면: "5축 한 번에 알아보기" 권유 카드 상단 노출

### 2.4 홈 HomeAnalysisSummary (4+축 완료) 통합 링크

현재: 모듈별 5개 카드
변경: 상단에 "최신 통합 결과" 링크 추가 (있으면)

```tsx
{
  latestIntegratedSession && (
    <Link href={`/analysis/integrated/result/${latestIntegratedSession.id}`}>
      최신 통합 결과 보기
    </Link>
  );
}
```

기존 5개 카드는 유지 (개별 재측정 수요 대응).

### 2.5 모듈별 개별 페이지 유지

`/analysis/personal-color`, `/analysis/skin` 등 기존 페이지 **제거 없음**:

- SEO/북마크/인덱싱 보호
- 심화 분석 원하는 고급 사용자 경로
- 기존 사용자 데이터 호환

## 3. 대안 (Alternatives Considered)

| 대안                            | 장점           | 단점                                         | 제외 사유                      |
| ------------------------------- | -------------- | -------------------------------------------- | ------------------------------ |
| 모듈별 페이지 완전 제거         | 플로우 단일화  | 기존 URL 전부 깨짐, SEO 손상, 심화 수요 무시 | Type 1 (되돌릴 수 없음) 리스크 |
| A/B 테스트로 점진적 전환        | 안전           | 인프라 부재, MAU 소규모로 통계적 유의 X      | 현실 불가                      |
| 홈 22개 위젯 전면 재설계        | 정보 구조 개선 | 리스크 크고 출시 전 위험                     | Phase D로 연기                 |
| 온보딩에 "의도 선택" 1문항 추가 | 세밀한 맞춤    | 통합 플로우 자체가 "5축 다" 의도라 중복      | 불필요                         |
| 통합 플로우를 옵션으로만 노출   | 변화 작음      | 통합의 가치 전달 실패                        | ADR-098/099/100의 의의 무산    |
| 랜딩만 전환, 홈은 그대로        | 리스크 최소    | 로그인 사용자가 가장 많은 진입점인데 개선 X  | 효과 반감                      |

## 4. 결과 (Consequences)

### 긍정적 결과

- **진입점 단일화** — 신규 사용자 첫 분석 = 통합 플로우 = ADR-098 비전 체험
- **ADR-099/100 가치 실현** — 만들어진 백엔드/UI가 실제 사용됨
- **데이터 일관성** — 5축이 한 세션으로 묶임 (개별 분석 시점 편차 제거)
- **향후 기능의 기반** — "나 프로필", VTO 통합, 크로스 모듈 추천 모두 통합 세션 기반
- **기존 URL 살아있음** — SEO/북마크/기존 사용자 데이터 호환

### 부정적 결과

- **통합 플로우 이탈률 미검증** — 이전 PC 단독 플로우 대비 완주율 낮을 수 있음 (설문 추가됨)
- **기존 사용자 혼란** — "전에는 PC만 했는데 왜 지금은 5축 다 요구하나?"
- **모바일 미동기화** — 웹만 전환되면 플랫폼 UX 차이
- **서버 부하** — 신규 진입이 5축 병렬이므로 Gemini 호출 수 증가

### 리스크

- **완주율 저하** — 설문 2분 추가 → 이탈 증가 가능
  - 완화: 자가입력 최소화 (피부 1문항 필수 외 선택), LoadingUI로 체감 속도 개선 (ADR-100)
- **기존 사용자 DB 불일치** — 통합 세션 없는 4+축 사용자 UX 애매함
  - 완화: HomeAnalysisSummary 유지, 통합 링크는 "있으면 추가 표시"
- **서버 비용 상승** — 통합 = 5배 Gemini 호출
  - 완화: Mock-First 전략 유지(ADR-007), 실측 후 Rate Limit 조정
- **되돌리기 비용** — CTA 링크만 수정이라 롤백 쉬움 (Type 2)

## 5. 구현 가이드

### 5.1 수정 대상 파일

```
apps/web/
├── app/
│   ├── LandingContent.tsx              # 3곳 CTA 링크 교체
│   └── (main)/home/
│       └── _components/
│           ├── NewUserHero.tsx          # CTA 2개 → 1개 통합
│           ├── GrowingNextStep.tsx      # 통합 세션 없으면 권유 카드
│           └── HomeAnalysisSummary.tsx  # 통합 링크 추가
└── hooks/
    └── useLatestIntegratedSession.ts    # 신규 (최신 통합 세션 조회)
```

### 5.2 최신 통합 세션 조회 훅

```typescript
// hooks/useLatestIntegratedSession.ts (신규)
export function useLatestIntegratedSession(): {
  session: IntegratedSessionRow | null;
  isLoading: boolean;
} {
  // 현재 사용자의 integrated_analysis_sessions 최신 1개
  // status in ('completed', 'partial')
  // order by created_at desc
}
```

### 5.3 분리된 모바일 작업

모바일 CTA 전환은 **Phase C.2 (별도 ADR-102)** 에서:

- `apps/mobile/app/(auth)/` 및 홈 CTA 조정
- 통합 플로우는 웹 우선 검증 → 모바일 포팅

### 5.4 롤백 계획

CTA 링크만 수정이므로:

- 링크 복구: 모든 CTA `href`를 원래 값으로 되돌림
- 컴포넌트 수정: Git revert 1 commit
- 데이터 영향 없음 (DB 변경 없음)

## 6. 관련 문서

- [ADR-099](./ADR-099-integrated-analysis-flow.md) — 통합 플로우 백엔드 (Phase A)
- [ADR-100](./ADR-100-integrated-analysis-ui.md) — 통합 플로우 UI (Phase B)
- [ADR-098](./ADR-098-identity-redefinition-5axis-model.md) — 정체성 재정의 (상위 근거)
- [SDD-PHASE-C-CTA-UNIFICATION](../specs/SDD-PHASE-C-CTA-UNIFICATION.md) — 본 ADR의 구현 스펙

---

**Author**: Claude Code
**Reviewed by**: -
