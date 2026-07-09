# 보유 자산 기반 처방 솔루션 — 내부 자산 전수 종합 (Rx Internal Assets Audit)

> **작성일**: 2026-07-09
> **목적**: "보유 자산 등록 → 적합 판정 → 루틴/코디 배치 → 결손 슬롯 구매 연결 → 목표 우선순위 → 단계 계획" 처방 엔진을, 이룸이 **이미 연구·구현·문서화한 자산**만으로 얼마나 세울 수 있는지 전수 조사.
> **결론 요약**: 처방 엔진의 골격(자산 등록·적합 판정·루틴 배치·결손→구매·소진 예측·성분 궁합·효과 추적·타임라인)은 **대부분 이미 코드로 존재**한다. 없는 것은 "오케스트레이션(하나의 처방 흐름으로 묶는 상위 레이어)"과 "목표 반영 우선순위 큐" 두 가지뿐. **v1은 배선(wiring) 프로젝트**이지 신규 개발이 아니다.

---

## 0. 처방 엔진 골격 vs 보유 자산 매핑 (한눈에)

| 처방 단계        | 필요 기능               | 이미 있는 자산                                                                                                           | 상태            |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------- |
| ① 자산 등록      | 화장대/파우치/옷장 입력 | `user_product_shelf`(개봉일·유통기한 필드 포함), `inventory`(16함수, closet/beauty/supplement)                           | ✅ 있음         |
| ② 적합 판정      | 내 프로필 × 아이템      | `lib/scan/compatibility.ts`(L2 개인 적합도), `skin-ingredient-match`, `closetMatcher`                                    | ✅ 있음         |
| ③ 루틴/코디 배치 | 아이템을 순서/시간대에  | `shelf-routine-sync.ts`(레이어링 정렬), `lib/skincare/generateRoutine`, `capsule/daily.ts`(시간대 배치)                  | ✅ 있음         |
| ④ 성분 궁합      | 화장대 내 조합 충돌     | `ingredient-conflict.ts`, `ingredient-interactions.ts`, `inventory/product-synergy.ts`                                   | ✅ 있음         |
| ⑤ 결손 슬롯      | 빠진 카테고리 식별      | `shelf-routine-sync.missingCategories`, `inventory/capsule-bridge.checkGapAgainstInventory`(coverable/needPurchase 분리) | ✅ 있음         |
| ⑥ 구매 연결      | 결손 → 실제 제품        | `capsule/solution-products.attachSolutionProducts`(카테고리→제품 1쿼리 매칭+가격 접근성)                                 | ✅ 있음         |
| ⑦ 소진 예측      | 개봉일→재구매 시점      | `inventory/capsule-bridge.estimateDepletion`/`getRepurchaseNeeded`(30일 임박)                                            | ✅ 있음         |
| ⑧ 효과 추적      | N주 후 지표 변화        | `lib/product-tracking`(analyzeProductEffect, 신뢰도), `skin-diary/trend-engine`, `skincare/correlation`(피어슨)          | ✅ 있음         |
| ⑨ 단계 계획      | "장벽 4주→미백 전환"    | `ingredient-timeline`(문헌 발현 시기) + 효과추적 재검증 트리거                                                           | 🟡 재료만       |
| ⑩ 목표 우선순위  | 목표가 순서를 정함      | cross-domain-synergy 매트릭스(우선순위 계층·충돌해결)                                                                    | 🟡 원리만       |
| ⑪ 설명 깊이 조절 | 초보 풀이 / 숙련 요약   | `connection-awareness`(4단계 내재화 → ExplanationDepth)                                                                  | ✅ 있음(미배선) |

> **핵심**: ①~⑧은 배선만 하면 되고, ⑨⑩⑪이 "처방 엔진"이라는 상위 개념을 완성하는 미싱 링크다. 그중 ⑪(설명 깊이)은 코드까지 존재하나 처방 흐름에 연결만 안 됐다.

---

## 1. 자산별 상세 — (현재 상태 / 처방 엔진 공급물 / 부족분)

### 1.1 캡슐 에코시스템 (ADR-069 + `lib/capsule/`)

| 항목                 | 내용                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **원래 설계 의도**   | "캡슐"은 데일리 콘텐츠가 아니라 **아이템 조합 이론**이다. C1 큐레이션·C2 호환성·C3 개인화·C4 로테이션·C5 미니멀리즘 5원리를 `CapsuleEngine<T>` 범용 인터페이스로 구현. "미니멀 캡슐 옷장" 개념을 뷰티 전 도메인으로 일반화한 것. 즉 **처방 엔진의 직계 조상**이다.                                                                                  |
| **현재 상태**        | `daily.ts`가 이 이론의 유일한 소비자 — 6단계 파이프라인(프로필 로드→컨텍스트→도메인별 curate→CCS 검증→Safety 필터→제품 부착)으로 "오늘의 루틴"을 만든다. 도메인 엔진 9종(skin/makeup/hair/fashion/body/nutrition/workout/oral/personal-color) 존재. `BeautyProfile`이 9모듈 분석을 하나로 수렴하는 SSOT.                                            |
| **처방 엔진 공급물** | ⓐ`BeautyProfile` = 처방 입력 프로필 그 자체 (5축 통합). ⓑ`CapsuleEngine<T>.curate/personalize/minimize` = "아이템을 골라 배치"하는 배치 엔진. ⓒCCS(교차도메인 호환성 점수) = 처방 세트의 일관성 검증. ⓓ`solution-products.attachSolutionProducts` = 결손→실제 제품 배선(가격 접근성 가중까지). ⓔ시간대 배치(morning/evening/anytime)·소요시간 추정. |
| **부족분**           | 현재 캡슐은 **"오늘 뭘 할까"(콘텐츠)**로 소비되지 attach가 보유자산(`user_product_shelf`)이 아닌 **`cosmetic_products` 카탈로그**를 매칭한다 → "내가 가진 것" 우선이 아니라 "사면 좋은 것" 우선. 처방 엔진은 **보유분 먼저 배치, 결손만 카탈로그**여야 한다. `daily.ts`의 `attachSolutionProducts`를 `shelf` 우선 → 카탈로그 폴백으로 교체 필요.    |

### 1.2 ConnectionAwareness (ADR-083 + `lib/connection-awareness/`)

| 항목                 | 내용                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **원래 설계 의도**   | "A라서 B"(봄웜톤이라 코랄립) 인과 연결을 사용자가 얼마나 **내재화**했는지 4단계로 추적(exposed→recognized→internalized→independent). 학습이론(Bloom + Conscious Competence) 파생. 전이 조건 = 노출 횟수 + 확인 횟수 임계값(1/3/5/7).                                                                                     |
| **현재 상태**        | `accepted`, 구현 완료(repository 상태전이·단일 API·3종 브릿지). 단 **prod 마이그레이션 미적용 가능성**(MEMORY: `20260307` gap-apply 대기 목록). insight-bridge는 6개 모듈만 지원(makeup/workout/nutrition/fashion 미정의).                                                                                               |
| **처방 엔진 공급물** | **`ExplanationDepth` = 처방 설명 깊이 조절 그 자체.** 상태→깊이 매핑이 이미 존재: `exposed→full`(왜 이 순서인지 풀이), `recognized→brief`, `internalized→minimal`, `independent→none`. 즉 "초보자엔 풀이, 숙련자엔 요약"이 **새 개발 없이** 이 테이블 하나로 해결된다. `connectionId` 단위로 처방 근거별 개별 추적 가능. |
| **부족분**           | ⓐ처방 아이템의 근거("이 세럼을 저녁에" 등)를 `connectionId`로 정의하고 처방 UI에서 expose/confirm 호출 배선 필요. ⓑ prod DDL 적용 필요. ⓒ 4개 미지원 모듈 브릿지 확장(처방이 makeup/fashion 근거를 쓰면).                                                                                                                |

### 1.3 제품 효과 추적 (`lib/product-tracking/`)

| 항목                 | 내용                                                                                                                                                                                                                                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **현재 상태**        | `analyzeProductEffect(product, startSnapshot, currentSnapshot)` — 제품 사용 시작 시점 vs 최신 분석 점수를 지표별(수분/유분/모공/주름/탄력/색소/트러블) 비교, `trend`(±3점 임계)와 **신뢰도**(≥28일 high / ≥14일 medium / <14일 low) 산출. `estimateContribution`으로 다제품 동시 사용 시 기여도 순위 추정(개선지표수 × 총변화량). 테스트 존재. |
| **처방 엔진 공급물** | **폐루프(adaptive prescription)의 핵심 엔진.** "4주 썼는데 지표 안 오름 → 교체 제안"이 이미 부분 구현: `summary`가 `worsened.length>0 && improved.length===0`일 때 **"제품 변경 검토 권장"** 문구를 생성한다. 신뢰도 게이팅으로 "2주 미만은 판단 보류"도 내장.                                                                                 |
| **부족분**           | ⓐ순수 함수만 있고 **저장 레이어(tracked_products 테이블)·시작 스냅샷 캡처 트리거·재분석 리마인더**가 없다(=폐루프가 자동으로 안 돈다). ⓑ`estimateContribution`은 성분-지표 상관이 아닌 단순 휴리스틱(주석도 "단순 추정" 명시) → 교체 대상 특정에 약함. ⓒ교체 "제안"까지만, **대체 제품 추천 배선**(→`solution-products`/매칭)과 연결 안 됨.    |

### 1.4 크로스 도메인 시너지 (`docs/principles/cross-domain-synergy.md`)

| 항목                 | 내용                                                                                                                                                                                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **현재 상태**        | 원리 문서(현재 목표 65%). 7×7 시너지 매트릭스(S×P 98, S×N 95, C×W 95 최상위), 시너지 계수 계산식, **충돌 해결 우선순위 계층**(`health_safety > medical_guidance > domain_expertise > user_preference > general`), 배낭문제형 캡슐 최적화 알고리즘 스케치.                                                             |
| **처방 엔진 공급물** | ⓐ**목표 반영 우선순위(⑩)의 규칙 소스.** 충돌 시 "무엇을 먼저"를 정하는 계층이 이미 정의됨 → "장벽 vs 미백 동시 추구 시 장벽(건강/안전) 우선" 같은 판단의 근거. ⓑ`resolveConflicts`가 처방 아이템 충돌(레티놀 vs AHA 동시 배치) 해소 로직 제공. ⓒ도메인 쌍 시너지 = "피부 처방에 영양 조언을 왜 붙이나"의 정당성 점수. |
| **부족분**           | 대부분 **원리/의사코드 단계**(실코드 아님). `SYNERGY_MATRIX`·`resolveConflicts`를 실제 `lib/`로 승격 필요. 또한 매트릭스는 P(시술)·O(구강) 포함 구(舊) 7도메인 — 현 5축(PC/S/C/H/M)+Fashion로 재정렬 필요(ADR-098 정합).                                                                                              |

### 1.5 성분 안전·효과 타임라인 (`ingredient-safety-timeline.md` + `lib/scan/ingredient-timeline.ts`)

| 항목                 | 내용                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **현재 상태**        | **원리 문서 + 실코드 둘 다 완성도 높음.** 4-레이어 판정(L1 규제사실 / L2 개인적합 / L3 성분궁합 / L4 타임라인). `ingredient-timeline.ts`에 7개 활성성분(비타민C·레티놀·나이아신아마이드·BHA·AHA·세라마이드·히알루론산)의 **문헌 발현시기 + 출처 URL + 금지표현 회피 문구**가 상수화. `matchTimelines()`로 성분리스트→발현시기 매칭.                             |
| **처방 엔진 공급물** | **⑨ 단계 계획("장벽 4주 후 미백 전환")의 시간 축.** 각 활성성분의 "언제 효과 나는지"가 문헌 기반으로 있으므로, 처방을 **시간 단계로 배열**할 수 있다: 세라마이드(장벽 4주) → 완료 후 비타민C/나이아신아마이드(톤 8-12주) 순차. `TIMELINE_DISCLAIMER`가 "그 시기에 재분석으로 확인" = 효과추적(1.3)과의 자연스러운 연결점.                                       |
| **부족분**           | ⓐ타임라인은 **개별 성분**만 — "성분→아침/저녁/주기(요일)" 스텝 배치 규칙표는 없다(부분적으로 `ingredient-conflict.solution`에 "아침 C, 저녁 레티놀" 형태로 산재). ⓑ "장벽 먼저 → 미백" 같은 **단계 전환 로직**(선행 목표 완료 판정 → 다음 목표 활성화)이 없음 = ⑨의 미싱 링크. ⓒ7성분만 커버(정직성 원칙상 문헌 없으면 미등록) → 처방 성분 확장 시 리서치 필요. |

### 1.6 보유 자산 스키마 (`user_product_shelf` / `inventory` / 스캔 적합도)

| 항목                 | 내용                                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **현재 상태**        | `user_product_shelf`(2026-01-11): `opened_at`·`purchased_at`·`expires_at`·`status`(owned/wishlist/used_up/archived)·`rating`·`compatibility_score`·`product_ingredients`(JSONB) **이미 존재**. `lib/inventory`(16함수)는 beauty/closet/supplement/pantry 통합 인벤토리 + `useCount`·`metadata.openedAt/remainingServings/expiresInMonths`.                          |
| **처방 엔진 공급물** | ⓐ**①자산 등록의 완성된 스키마** — 개봉일·사용중(status=owned)·평점 마킹 필드가 이미 다 있다. ⓑ`shelf-routine-sync.generateRoutineFromShelf` = **보유 제품→레이어링 정렬 루틴 + missingCategories + 충돌/시너지 + 개인화노트**를 한 번에 반환(=처방 엔진 ③④⑤의 통합 프로토타입, 스킨케어 한정). ⓒ`closetMatcher`(PC/체형/날씨 기반 옷장 추천)·`getOutfitCandidates`. |
| **부족분**           | ⓐ`user_product_shelf`(스캔 계열)와 `inventory`(옷장/영양 계열)가 **두 개의 분리된 저장소** — 처방 엔진은 단일 "내 자산" 뷰가 필요(통합 또는 어댑터). ⓑ prod에 `user_product_shelf` 부재 가능성(MEMORY 유령배선 감사서 "prod 부재" 언급) → 확인/적용 필요. ⓒ`opened_at` 있으나 UI에서 입력받는 흐름이 약함(소진예측이 죽어있을 수 있음).                             |

### 1.7 상태 신호 (바이오리듬 / 피부일기 / 스트레스)

| 항목                 | 내용                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **현재 상태**        | ⓐ`lib/wellness/biorhythm.ts`(ADR-089) — 수면 시간/질/일관성 점수 → 웰니스 보정계수. ⓑ`lib/skin-diary/trend-engine.ts` — S-1/S-2 시계열 트렌드·이동평균·알림·streak. ⓒ`lib/skincare/correlation.ts` — 수면·수분·**스트레스(inverse)**·루틴완료 ↔ 피부컨디션 **피어슨 상관**. ⓓ`daily.ts`가 이미 최근 분석 점수→`deriveSkinCondition`(very_oily/dry/sensitivity)로 **"오늘 상태" 추정 → 루틴 조정**(applyConditionalModifications) 수행 중. |
| **처방 엔진 공급물** | **"오늘의 처방 조정"에 쓸 신호가 이미 흐르고 있다.** `daily.ts`의 `deriveSkinCondition` → `applyConditionalModifications`가 "유분 높으면 토너 2회" 같은 **조건부 처방 변형**을 이미 함. biorhythm(수면 나쁨)·skin-diary(하락 추세)·correlation(스트레스↔트러블)은 "오늘은 진정 위주로" 같은 **당일 우선순위 조정 신호**의 후보.                                                                                                           |
| **부족분**           | ⓐ신호들이 **각자 따로** 산다 — 하나의 "today context"로 합쳐 처방 조정에 주입하는 배선 없음. ⓑ`deriveSkinCondition`은 **실시간이 아니라 "최근 분석 기준"**(코드 주석이 정직하게 명시) → 매일 바뀌는 신호가 아님. ⓒbiorhythm/correlation은 처방(`daily.ts`)과 **미연결**.                                                                                                                                                                  |

---

## 2. v1 (이미 있는 것만으로) vs v2 (추가 개발 필요) 경계

### v1 — "배선 프로젝트": 신규 알고리즘 0, 상위 오케스트레이터 1개

이미 존재하는 함수들을 **하나의 처방 흐름으로 묶는 얇은 상위 레이어** `lib/prescription/`(가칭)만 만들면 성립:

1. **자산 우선 루틴** — `daily.ts`의 제품 부착을 `shelf`(보유) 우선 → `solution-products`(카탈로그) 폴백으로 교체. (`shelf-routine-sync`가 스킨케어는 이미 이 형태)
2. **결손→구매** — `shelf-routine-sync.missingCategories` + `inventory.checkGapAgainstInventory`(coverable/needPurchase) → `solution-products` 매칭. **세 함수 조립만.**
3. **소진→재구매** — `getRepurchaseNeeded(30일)` 그대로 홈/처방 카드에 노출.
4. **성분 궁합 경고** — `ingredient-conflict` + `product-synergy`를 보유자산 전체에 1회 실행(이미 `generateRoutineFromShelf`가 함).
5. **효과 추적 표면화** — `analyzeProductEffect`의 "교체 검토 권장" summary를 처방 카드에 노출(저장 레이어는 v2, 우선 최근 2개 분석 스냅샷으로 온디맨드 계산).
6. **설명 깊이** — 처방 근거에 `connectionId` 부여 + `ExplanationDepth`로 풀이/요약 분기. (DDL 적용 전제)

> v1은 **처방을 "느끼게"** 하는 데 충분: "당신 화장대의 A·B로 저녁 루틴을 짰고, 토너가 없으니 이 토너(3만원대)를, 세럼은 20일 후 소진 예상이라 재구매 알림을, 레티놀+AHA는 요일 분리하세요." — 전부 기존 함수 출력.

### v2 — 추가 개발/리서치 필요 (신규 로직·저장·문헌)

| 항목                                 | 왜 v2인가                                                | 필요 작업                                                                |
| ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| **⑨ 단계 계획 전환**                 | "장벽 4주 완료 판정 → 미백 활성화"의 **상태머신이 없음** | `ingredient-timeline` + 목표 스키마 + 완료 판정(효과추적 연동) 신규 설계 |
| **⑩ 목표 우선순위 큐**               | cross-synergy가 **원리/의사코드 단계**                   | `SYNERGY_MATRIX`·`resolveConflicts`를 5축 정합으로 `lib/`화              |
| **효과추적 폐루프 자동화**           | 저장 테이블·시작 스냅샷 트리거·재분석 리마인더 부재      | `tracked_products` DDL + 캡처 훅 + Cron 리마인더                         |
| **성분→시점(아침/저녁/요일) 규칙표** | 개별 성분 발현시기만 있고 **스텝 배치 규칙표 없음**      | `ingredient-conflict.solution`의 산재 규칙을 구조화 상수로               |
| **자산 저장소 통합**                 | shelf/inventory 이원화                                   | 통합 스키마 또는 어댑터, prod 스키마 gap-apply                           |
| **상태신호 통합 주입**               | biorhythm/diary/correlation이 처방과 미연결              | "today context" 어그리게이터 + 당일 조정 규칙                            |
| **기여도 인과성**                    | `estimateContribution`이 단순 휴리스틱                   | 성분-지표 상관 모델(데이터 필요 → MAU 대기)                              |

---

## 3. 재사용 가능 자산 TOP 5 (처방 엔진에 즉시 투입)

1. **`shelf-routine-sync.generateRoutineFromShelf`** — 처방 엔진 ③④⑤(배치+궁합+결손)의 **완성된 프로토타입**. 보유 제품→레이어링 루틴 + missingCategories + 충돌/시너지 + 개인화노트를 단일 함수로. 스킨케어를 넘어 도메인 일반화만 하면 됨.
2. **`inventory/capsule-bridge` (estimateDepletion / getRepurchaseNeeded / checkGapAgainstInventory)** — ⑤⑦(결손 분리 + 소진 예측)의 **완성 코드**. `coverable`/`needPurchase` 분리가 정확히 처방 엔진이 원하는 출력.
3. **`connection-awareness` ExplanationDepth** — ⑪(설명 깊이 조절)이 **새 개발 없이** 4단계 매핑 테이블로 해결. 처방의 "초보 풀이/숙련 요약"을 코드 한 줄 분기로.
4. **`product-tracking.analyzeProductEffect`** — ⑧ 폐루프 엔진. 신뢰도 게이팅 + "교체 검토 권장" 문구까지 내장. 저장 레이어만 얹으면 adaptive prescription 성립.
5. **`ingredient-timeline.ts` + `ingredient-safety-timeline.md`** — ⑨ 단계 계획의 **문헌 기반 시간 축**. 출처·금지표현 회피까지 갖춘 7성분 발현시기 = "언제 다음 목표로" 판단의 근거.

---

## 4. 의외의 발견 (Non-obvious)

1. **처방 엔진은 이미 `daily.ts` 안에 "숨어" 돌고 있다.** 6단계 파이프라인(프로필→컨텍스트→큐레이션→CCS검증→Safety→제품부착)은 사실상 처방 엔진의 실행 루프다. 다만 **입력이 보유자산이 아니라 카탈로그**이고, **출력이 "처방"이 아니라 "오늘 할 일 체크리스트"**로 프레이밍됐을 뿐. 관점 전환 + attach 소스 교체가 절반이다.

2. **"오늘의 조건부 처방"이 이미 작동 중이다.** `deriveSkinCondition → applyConditionalModifications`가 최근 지표로 "유분 높으면 토너 2회" 같은 변형을 이미 수행. 상태신호(1.7)를 여기에 주입하는 배선만 하면 "오늘의 처방 조정"이 즉시 산다. **단, 실시간이 아니라 "최근 분석 기준"**임을 코드가 정직하게 명시 — 매일 바뀌는 처방을 원하면 일일 상태 입력 UI가 v2 과제.

3. **효과추적이 이미 "제품 바꾸세요"를 말한다.** `analyzeProductEffect`의 summary가 하락 시 "제품 변경 검토 권장"을 생성 — adaptive prescription의 트리거 문구가 **이미 코드에 있다**. 없는 건 이 문구를 대체 제품 추천으로 잇는 배선과, 자동으로 4주 후 재검하는 리마인더.

4. **`ingredient-conflict.solution` 필드가 시간 배치 규칙을 이미 담고 있다.** "아침 비타민C, 저녁 레티놀 분리 사용" 같은 값이 충돌 데이터에 산재 — "성분→아침/저녁/요일" 규칙표를 처음부터 만들 게 아니라 **이 필드들을 구조화해 추출**하면 v1.5 수준으로 당길 수 있다.

5. **정직성 원칙이 처방 엔진의 신뢰도 게이팅으로 그대로 전이된다.** 코드 전반이 "데이터 없으면 지어내지 않고 생략"(solution-products, buildItemSolution), "문헌 없으면 미등록"(ingredient-timeline), "신뢰도 low는 판단 보류"(product-tracking) — 처방 엔진의 "확실한 것만 처방, 나머지는 명시적 공백"이 **이미 코드 문화로 정착**돼 있어 별도 가드레일 설계가 불필요.

6. **ConnectionAwareness가 처방의 "왜"를 재사용 가능한 자산으로 만들었다.** 처방 근거를 `connectionId`로 정의하면, 같은 근거가 여러 처방에 재등장할 때 사용자별 내재화가 누적 추적된다 → 숙련 사용자에게 "봄웜톤이라 코랄" 설명을 반복하지 않는 게 **자동**. 이건 경쟁 처방 앱이 갖기 어려운 차별점.

---

## 5. 참조 (코드·문서 경로)

- 캡슐: `apps/web/lib/capsule/{daily,solution-products,scoring,engine}.ts`, `docs/adr/ADR-069-capsule-ecosystem-architecture.md`
- 내재화: `apps/web/lib/connection-awareness/types.ts`, `docs/adr/ADR-083-connection-awareness-architecture.md`
- 효과추적: `apps/web/lib/product-tracking/index.ts`, `tests/lib/product-tracking/product-effect.test.ts`
- 시너지: `docs/principles/cross-domain-synergy.md`
- 성분 타임라인: `apps/web/lib/scan/ingredient-timeline.ts`, `docs/principles/ingredient-safety-timeline.md`
- 자산·적합·배치: `apps/web/lib/scan/compatibility.ts`, `apps/web/lib/skincare/shelf-routine-sync.ts`, `apps/web/lib/inventory/{capsule-bridge,closetMatcher,product-synergy}.ts`, `supabase/migrations/20260111_product_shelf.sql`
- 성분 궁합: `apps/web/lib/scan/{ingredient-conflict,ingredient-interactions}.ts`
- 상태신호: `apps/web/lib/wellness/biorhythm.ts`, `apps/web/lib/skin-diary/trend-engine.ts`, `apps/web/lib/skincare/correlation.ts`

---

**결론**: 처방 엔진 v1은 **신규 개발이 아니라 통합 배선**이다. ①~⑧이 이미 코드로 존재하고, ⑪(설명 깊이)까지 구현돼 있다. 진짜 신규 작업은 ⑨(단계 계획 상태머신)·⑩(목표 우선순위 큐 코드화)·효과추적 폐루프 자동화(저장·리마인더) 세 가지 v2 뿐. `lib/prescription/` 얇은 오케스트레이터 하나로 "보유 자산 기반 처방"의 골격이 즉시 선다.
