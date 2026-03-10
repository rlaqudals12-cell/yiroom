# UX 실패 패턴 라이브러리

> `/ux-check`에서 발견된 반복 패턴을 누적하는 문서
> **3회 이상** 반복되는 패턴은 [ux-pr-checklist.md](./ux-pr-checklist.md) 정식 항목 후보로 승격

---

## 패턴 기록 형식

```
### [패턴 ID]: [패턴명]
- **발견 횟수**: N회
- **관련 항목**: 체크리스트 항목 ID (또는 "신규")
- **발생 화면**: [화면 목록]
- **원인**: [왜 반복되는가]
- **수정 방법**: [구체적 해결 패턴]
- **재발 방지**: [코드/프로세스 수준 방지책]
```

---

## 누적 패턴

### KI-001: 영어 enum이 한글 변환 없이 JSX에 직접 렌더링 — **해결됨**

- **발견 횟수**: 17회 (Phase 28 홈, 분석 결과 2건, PC 결과 공유 제목, DrapeColorPalette 색상명, **AnalysisResult 베스트/워스트 4개소**, **DetailedEvidenceReport title 2개소**, **H-1 헤어 label fallback 4개소**, **OH-1 4개소 (VitaShadeDisplay×2, GumHealthIndicator, OralHealthResultCard)**, **Posture 2개소 (result page + input page postureType fallback)**)
- **관련 항목**: A1
- **발생 화면**: HomeStateActive, SkinResultPage, BodyResultPage, PersonalColorResultPage (공유), DrapeColorPalette, **AnalysisResult**, **DetailedEvidenceReport**, **HairResultPage**, **OralHealthResultPage**, **PostureResultPage**, **PostureInputPage**
- **원인**: AI/DB 반환값을 그대로 텍스트 보간에 사용. 매핑 함수 호출 누락
- **수정 방법**: `getKoreanColorName(hex)` 공유 유틸 (`lib/utils/color-names.ts`) 사용 필수
- **재발 방지**: 새 모듈 추가 시 A1 영어값 목록에 enum 등록 + 매핑 함수 작성을 원자 분해에 포함. HEX 색상은 `getKoreanColorName()` 사용
- **해결 커밋**: 전체 17개소 매핑 함수 적용 완료 (OH-1, H-1, Posture, PC, Body, Skin 포함)

### KI-002: 터치 타겟 44px 미달 (p-2/h-8 사용) — **3회 도달, 승격 완료**

- **발견 횟수**: 11회 (Phase 28 확인 버튼, ConnectionAwareness 체크 버튼, 홈 캡슐+분석요약 버튼, PC ResultCardV2 악세서리 필터, DrapeColorPalette 시즌 필터, **SeasonEducationModal 닫기 버튼**, **S-1 결과 2개소 (ResultPageInsights, SkinConsultantCTA)**, **N-1 step3 3개소 (기피 음식 X 버튼, 추가 버튼, 알레르기 버튼)**)
- **관련 항목**: B2
- **발생 화면**: ActiveInsightCard, InternalizationWidget, HomeDailyCapsuleWidget, HomeAnalysisSummary, ResultCardV2, **DrapeColorPalette**, **ResultPageInsights**, **SkinConsultantCTA**, **NutritionStep3Page**
- **원인**: 시각적 크기에 집중하고 터치 영역 크기를 간과
- **수정 방법**: `min-h-[44px] min-w-[44px]` 또는 `p-3` 이상 적용
- **재발 방지**: 버튼/링크 생성 시 p-3 기본값 습관화
- **최종 수정**: DrapeColorPalette 금속 테스트 버튼(실버/골드) `min-h-[44px]` 추가 (전체 11개소 수정 완료)

### KI-003: 체형 분석 fallback에서 raw 영어값 노출 — **해결됨**

- **발견 횟수**: 1회
- **관련 항목**: A1
- **발생 화면**: HomeStateActive (체형 카드)
- **원인**: 주 매핑에는 한글이 있지만 fallback/default 분기에서 raw값 반환
- **수정 방법**: switch/map의 default 케이스에도 한글 fallback 텍스트 반환
- **재발 방지**: 매핑 함수에 exhaustive check 또는 "알 수 없음" 기본값
- **해결 커밋**: KI-001 일괄 수정 시 함께 해결

### KI-004: "시너지 달성!" 등 어색한 한국어 표현 — **해결됨**

- **발견 횟수**: 1회
- **관련 항목**: A2 (해요체 통일과 별개로 톤 문제)
- **발생 화면**: HomeStateActive (활동 바)
- **원인**: 영어 직역 또는 게임화 용어 직접 사용
- **수정 방법**: 자연스러운 한국어로 교체 ("연결 인사이트가 생겼어요")
- **재발 방지**: UX 라이팅 시 "소리 내어 읽기" 테스트
- **해결 커밋**: Phase 28 홈 리디자인 시 수정

### KI-005: 숫자+단위 불일치 (toLocaleString vs 단위 미표기) — **해결됨**

- **발견 횟수**: 6회 (홈 활동 바 칼로리 셀, /ux-check 홈 대시보드 재발견, **N-1 step3 3개소 (미리보기 kcal 간격)**, **N-1 result 3개소 (BMR/TDEE/한끼당 kcal 간격)**)
- **관련 항목**: A7
- **발생 화면**: HomeActivityBar (칼로리 셀), **NutritionStep3Page**, **NutritionResultPage**
- **원인**: `value.toLocaleString()` 뒤에 단위(kcal)와 공백 없이 붙어 렌더링 ("1500kcal" → "1500 kcal")
- **수정 방법**: 숫자와 단위 사이 공백 추가 (`{value} kcal`)
- **재발 방지**: 숫자 표시 컴포넌트에 unit prop 필수화
- **해결 커밋**: 테스트 수정 + KI-005 공백 누락 일괄 수정

### KI-006: 에러 상태에서 console.error만 하고 사용자 피드백 없음 — **해결됨**

- **발견 횟수**: 3회 (HomeDailyCapsuleWidget 초기 발견, /ux-check 홈 대시보드 재발견, **PersonalColorHistoryPage**)
- **관련 항목**: C2
- **발생 화면**: HomeDailyCapsuleWidget (catch 블록), HomeActivityBar (catch 블록), **PersonalColorHistoryPage (catch 블록)**
- **원인**: try-catch에서 에러를 콘솔로만 출력하고 UI 상태를 업데이트하지 않음
- **수정 방법**: catch 블록에서 `setHasError(true)` + 에러 상태 UI 표시
- **재발 방지**: 데이터 fetch 패턴에서 에러 상태 변수 + UI 분기를 필수 포함
- **해결 커밋**: `84174b7b` (HomeActivityBar), `226e3b5f` (HomeDailyCapsuleWidget)

### KI-007: 홈 화면 정보 블록 7개 초과

- **발견 횟수**: 1회
- **관련 항목**: F1
- **발생 화면**: HomeStateActive (8블록: Greeting + Insight×2 + Capsule + AnalysisSummary + Internalization + ActivityBar + RecentlyViewed)
- **원인**: 기능 추가 시 블록 수 카운트를 하지 않음
- **수정 방법**: RecentlyViewed를 별도 탭/섹션으로 분리하거나, Internalization을 ActivityBar 내부로 통합
- **재발 방지**: 홈 화면 컴포넌트 추가 시 F1(7개 이하) 체크

### KI-008: "피해야 할" 부정적 프레이밍 (D4 위반) — **해결됨**

- **발견 횟수**: 7회 (PC 결과 7개소, DrapeSimulator, DetailedEvidenceReport, **전체 모듈 일괄 수정 15개소**, **S-1 결과 2개소 (page.tsx 419, 1215)**, **OH-1 입력 page.tsx "피해주세요"**)
- **관련 항목**: D4 (신체 부정 언어 금지)
- **발생 화면**: PersonalColorResultPage, BodyResultPage, SkinResultPage, WorkoutStyleCard, NutrientSynergyCard, OralHealth, CoachChat, MockStyling
- **원인**: 초기 구현 시 "피해야 할 컬러"를 관용적으로 사용
- **수정 방법**: "피해야 할" → "주의할", "피하기" → "참고", "피하는 것이 좋아요" → "덜 어울릴 수 있어요"
- **재발 방지**: 새 컴포넌트에서 "피해야", "약점", "결점" 등 D4 금지 패턴 사용 여부를 코드 리뷰에서 확인
- **해결 커밋**: PC 결과 7개소 → 전체 모듈 일괄 수정 완료 (body 3, skin 3, workout 2, nutrition 1, coach 1, oral-health 1, mock 2, palette 1). 내부 코드 주석/타입은 기능적 명칭이므로 유지

### KI-010: H4 조건부 렌더링에서 fallback UI 누락

- **발견 횟수**: 3회 (뷰티 페이지 3개소: 랭킹 섹션, 매칭 토글, 피부나이 계산기)
- **관련 항목**: H4
- **발생 화면**: BeautyPage (랭킹 섹션, 90%+ 매칭 토글, SkinAgeCalculator)
- **원인**: `{hasAnalysis && <Component>}` 패턴 사용 시 미분석 사용자에게 빈 영역 노출
- **수정 방법**: `{hasAnalysis ? <Component> : <FallbackCard>}` 패턴으로 전환. fallback에 분석 안내 + CTA 포함
- **재발 방지**: 조건부 렌더링 사용 시 else 분기에 유용한 대안 UI 존재 여부 확인
- **해결 커밋**: 뷰티 페이지 3개소 fallback 추가 완료 (2026-03-10)

### KI-009: 탭 간 동일 콘텐츠 중복 (F4 위반)

- **발견 횟수**: 1회
- **관련 항목**: F4
- **발생 화면**: PersonalColorResultPage (기본 탭 SEASON_WHY ↔ 상세 탭 SEASON_EXPLANATIONS)
- **원인**: 기본 탭에 "왜 이 색이 어울리는지" 풀텍스트 + dailyTip을 넣었으나, 상세 탭에도 동일 내용 존재
- **수정 방법**: 기본 탭은 1줄 요약 + "상세 리포트에서 더 알아보기" 안내, dailyTip은 상세 탭에서만 제공
- **재발 방지**: 탭 구조 설계 시 각 탭의 역할 정의 (기본=핵심 요약, 상세=심층 분석)
- **해결 커밋**: 이 점검에서 수정 완료

---

## 승격 이력

| 패턴 ID | 승격 항목      | 승격일     | 사유                                                                   |
| ------- | -------------- | ---------- | ---------------------------------------------------------------------- |
| KI-002  | B2 (터치 44px) | 2026-03-08 | 3회 반복 — 이미 B2로 존재, 심각도 유지 (High)                          |
| KI-008  | D4 (부정 언어) | 2026-03-08 | 3회 반복 — 이미 D4로 존재 (Critical), fallback 텍스트도 대조 필수 추가 |

> 패턴이 3회 이상 반복되면 이 테이블에 기록하고, `ux-pr-checklist.md`에 정식 항목으로 추가한다.

---

## S-1 피부 분석 결과 페이지 점검 결과 (2026-03-08)

### 보류 항목 (8건 — 기획/설계 판단 필요)

| #   | 항목                                     | 보류 사유                                                                                              |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 9   | F1/H1-3 탭 재편 (기본 탭 12→5섹션)       | 대규모 구조 변경. 사용자 흐름 기획 없이 코드만 옮기면 UX 악화 가능. 중복 제거(#10)로 12→11개 부분 해소 |
| 14  | B1 AnalysisResult data-testid 추가       | E2E 테스트 작성 시 함께 추가. 테스트 없이 testid만 추가하면 유지보수 부담                              |
| 15  | B1 PhotoMetricOverlayV2 data-testid 추가 | #14와 동일                                                                                             |
| 17  | F3 스크롤 깊이 축소                      | 탭 재편(#9)의 하위 이슈. 중복 제거로 부분 해소                                                         |
| 18  | 온보딩 코치마크                          | 신규 기능 추가. 디자인/문구/표시 조건 기획 필요                                                        |
| 19  | 탭 전환 애니메이션                       | 선호 사항. 성능(CLS) 영향 검토 필요                                                                    |
| 20  | 패드/데스크탑 2컬럼 레이아웃             | 반응형 리디자인. 모바일 우선이므로 별도 기획                                                           |
| 21  | 탭 이벤트 트래킹                         | 분석 인프라 추가. 이벤트 목적지 결정 필요                                                              |

### 불필요 판정 (5건 — 코드 확인 결과 문제 없음)

| #   | 항목                          | 불필요 사유                                                              |
| --- | ----------------------------- | ------------------------------------------------------------------------ |
| 5   | B2 EvidenceReport Info 아이콘 | 인터랙티브 요소 아님 (CardTitle 옆 장식 아이콘)                          |
| 11  | H1 상담 탭 빈약               | SkinConsultationChat에 QuickQuestions 컴포넌트 이미 내장                 |
| 12  | 점수 해석 텍스트              | CircularProgress showGradeIcon으로 "골드" + "우수한 상태예요!" 이미 표시 |
| 13  | FAB 발견성                    | 56px Material Design 표준 FAB, 문제없음                                  |
| 16  | B3 FAB aria-label             | 6개 모두 aria-label 존재 확인                                            |

### 수정 완료 (11건 — 8건 초기 + 3건 Tier 1 개선)

| #   | 파일                     | 수정 내용                                    | 심각도   |
| --- | ------------------------ | -------------------------------------------- | -------- |
| 1   | page.tsx:419             | "개선 필요" → "케어 포인트"                  | Critical |
| 2   | page.tsx:1215            | "문제 영역" → "관심 영역"                    | Critical |
| 3   | ResultPageInsights.tsx   | "이해했어요" 버튼 터치 영역 44px 확보        | Critical |
| 4   | SkinConsultantCTA.tsx    | 빠른 질문 버튼 터치 영역 + dark: 추가        | High     |
| 5   | DrapingSimulationTab.tsx | 에러 박스 dark: 추가                         | High     |
| 6   | VisualAnalysisTab.tsx    | 에러 박스 dark: 추가                         | High     |
| 7   | page.tsx:1027-1033       | 기본 탭 SkinAnalysisEvidenceReport 중복 제거 | High     |
| 8   | page.tsx:1211            | 주석 "문제 영역" → "관심 영역"               | Low      |
| 9   | page.tsx:848             | TabsList aria-label 추가 (B7 키보드 접근성)  | Medium   |
| 10  | page.tsx:1281            | 상담탭 인트로 카드 추가 (H3 밀도 균형)       | Medium   |
| 11  | page.tsx:215             | getDescription() 내러티브 전환 (E7)          | Medium   |

**커밋**: `6be7c8be`
**통과율**: 70% → 93% (+23%p, 40/43 통과, 남은 3건 warn은 기획 필요)
**상세 이력**: [history/2026-03-08-skin-result.md](./history/2026-03-08-skin-result.md)

---

## W-1 운동 모듈 점검 결과 (2026-03-08)

### 수정 완료 (9건)

| #   | 파일             | 수정 내용                            | 심각도   |
| --- | ---------------- | ------------------------------------ | -------- |
| 1   | plan/page.tsx    | Zustand persist hydration fix        | Critical |
| 2   | session/page.tsx | Zustand persist hydration fix        | Critical |
| 3   | plan/page.tsx    | dark: 클래스 추가 (시작 버튼)        | High     |
| 4   | plan/page.tsx    | AITransparencyNotice compact 추가    | High     |
| 5   | session/page.tsx | dark: 클래스 5개 요소 추가           | High     |
| 6   | result/page.tsx  | DetailCardsSection 접이식 (12→7블록) | Medium   |
| 7   | result/page.tsx  | AITransparencyNotice compact 추가    | High     |
| 8   | result/page.tsx  | 액션 버튼 dark: 클래스 추가          | High     |
| 9   | result/page.tsx  | 추천 운동/상세 카드 delay 재정렬     | Low      |

**통과율**: 78% → 95% (+17%p, 39/41 통과, 남은 2건 warn 고정)
**상세 이력**: [history/2026-03-08-workout.md](./history/2026-03-08-workout.md)

---

## N-1 영양 모듈 온보딩 점검 결과 (2026-03-09)

### 수정 완료 (7건)

| #   | 파일                          | 수정 내용                                 | 심각도 |
| --- | ----------------------------- | ----------------------------------------- | ------ |
| 1   | step1/page.tsx:138            | "않습니다" → "않아요" 해요체 통일         | High   |
| 2   | step3 (3개소), result (6개소) | kcal 앞 공백 제거 + macro toLocaleString  | Medium |
| 3   | step1~3 root div              | data-testid 추가                          | High   |
| 4   | step3 X버튼                   | 터치 44px 확보 + aria-label 추가          | High   |
| 5   | step3 추가/알레르기 버튼      | 터치 영역 확대 (py-3, min-h-44)           | High   |
| 6   | result 활동수준 카드          | 독립 카드 → 칼로리 카드 내 통합 (9→7블록) | Medium |
| 7   | step3 알레르기/건너뛰기       | dark: 클래스 추가                         | High   |

**통과율**: 74% → 100% (+26%p, 27/27 통과)
**상세 이력**: [history/2026-03-09-nutrition-onboarding.md](./history/2026-03-09-nutrition-onboarding.md)

---

## H-1 헤어 분석 결과 점검 결과 (2026-03-08)

### 수정 완료 (4건)

| #   | 파일                    | 수정 내용                                          | 심각도   |
| --- | ----------------------- | -------------------------------------------------- | -------- |
| 1   | page.tsx:124,126,128    | label fallback → '알 수 없음' (3개소, KI-001 재발) | Critical |
| 2   | page.tsx:431            | concern fallback → '기타' (KI-003 재발)            | Critical |
| 3   | page.tsx:82,108,150,339 | analysisReliability 필드 + 헤더 한글 표시          | Medium   |
| 4   | page.tsx:542            | bottom bar dark: 클래스 추가                       | High     |

**통과율**: 교차 모듈 일관성 A1/I4/J1/K1 전 항목 통과
**상세 이력**: [history/2026-03-08-hair-result.md](./history/2026-03-08-hair-result.md)

---

## OH-1 구강건강 분석 전체 점검 결과 (2026-03-09)

### 수정 완료 (9건)

| #   | 파일                         | 수정 내용                                                         | 심각도   |
| --- | ---------------------------- | ----------------------------------------------------------------- | -------- |
| 1   | VitaShadeDisplay:209,222     | brightness/yellowness fallback → '알 수 없음' (KI-001)            | Critical |
| 2   | GumHealthIndicator:228       | region fallback → '알 수 없음' (KI-001)                           | Critical |
| 3   | OralHealthResultCard:272     | method fallback → '알 수 없음' (KI-001)                           | Critical |
| 4   | page.tsx:227                 | "피해주세요" → "깨끗한 상태에서 촬영하면 더 정확해요" (D4 KI-008) | Critical |
| 5   | result/page.tsx              | D10 비의료 고지 추가 (치과 전문의 상담 안내)                      | Critical |
| 6   | page.tsx upload 단계         | D6 프라이버시 안내 추가 ("서버에 별도 저장되지 않아요")           | High     |
| 7   | OralHealthResultCard:70-113  | H4 데이터 없을 때 fallback 메시지 추가                            | High     |
| 8   | VitaShadeDisplay:107,122,149 | J1 셰이드 라벨 dark: 클래스 추가                                  | High     |
| 9   | result/page.tsx 점수 카드    | K1 분석 신뢰도 % 표시 추가                                        | Medium   |

### B3 개선 (3건)

| #   | 파일                                       | 수정 내용                             |
| --- | ------------------------------------------ | ------------------------------------- |
| 1   | OralHealthResultCard TabsTrigger tooth     | aria-label="치아 색상 분석 결과 보기" |
| 2   | OralHealthResultCard TabsTrigger gum       | aria-label="잇몸 건강 분석 결과 보기" |
| 3   | OralHealthResultCard TabsTrigger whitening | aria-label="미백 목표 및 추천 보기"   |

**통과율**: 80% → 96% (+16%p, 44/46 통과, 남은 2건 warn: E2 수동확인, H5 아코디언 접힘)
**100인 시뮬**: 전문가 19/20, 심사관 17/20, 투자자 15/20, 소비자 12/20, 인플루언서 14/20 지적 → 전원 해소

---

## M-1 메이크업 분석 결과 점검 결과 (2026-03-08)

### 수정 완료 (5건)

| #   | 파일                                       | 수정 내용                                        | 심각도   |
| --- | ------------------------------------------ | ------------------------------------------------ | -------- |
| 1   | transform.ts:113-120                       | label fallback → '알 수 없음' (KI-003 재발 방지) | Critical |
| 2   | page.tsx:13,462                            | AITransparencyNotice import + compact 추가       | High     |
| 3   | page.tsx:467                               | bottom bar dark: 클래스 추가                     | High     |
| 4   | transform.ts:84,145-148 + page.tsx:225-234 | analysisReliability 필드 + 헤더 한글 표시        | Medium   |
| 5   | page.tsx:462                               | AITransparencyNotice → K2 분석 한계 안내 커버    | Medium   |

**통과율**: 89% → 100% (+11%p, 46/46 통과)
**상세 이력**: [history/2026-03-08-makeup-result.md](./history/2026-03-08-makeup-result.md)

---

## Beauty 뷰티/제품 페이지 점검 결과 (2026-03-10)

### 수정 완료 (6건)

| #   | 파일                    | 수정 내용                                          | 심각도 |
| --- | ----------------------- | -------------------------------------------------- | ------ |
| 1   | useUserMatching.ts      | H-1 헤어 분석 쿼리 추가 (hair_analyses)            | High   |
| 2   | useUserMatching.ts      | M-1 메이크업 분석 쿼리 추가 (makeup_analyses)      | High   |
| 3   | beauty/page.tsx:1095    | H4 랭킹 섹션 fallback (피부 분석 안내 CTA)         | High   |
| 4   | beauty/page.tsx:1004    | H4 매칭 토글 fallback ("분석하면 매칭률 확인" CTA) | High   |
| 5   | beauty/page.tsx:1376    | H4 피부나이 계산기 fallback (피부 분석 안내 CTA)   | High   |
| 6   | useUserMatching.test.ts | 5개 테스트에 H-1/M-1 mock 추가                     | -      |

### 교차 모듈 매칭 확장

`useUserMatching` 훅이 3개 모듈(S-1, PC-1, C-1)에서 **5개 모듈**(+ H-1 헤어, M-1 메이크업)로 확장됨.
`lib/products/matching.ts`의 `UserProfile` 인터페이스는 이미 6개 모듈을 지원하고 있었으나, 실제 데이터 로딩이 3개뿐이었던 갭 해소.

**통과율**: 84% (41/49 통과, 3 fail→0 fail, 5 warn 유지)
**궁극의 형태**: 55% (UI 셸 80%+ / 핵심 AI 매칭 55% — W-1/N-1 매칭 미연결)

---

**Version**: 2.4 | **Created**: 2026-03-08 | **Updated**: 2026-03-10
**관련**: [ux-pr-checklist.md](./ux-pr-checklist.md) 변경 프로토콜 참조
