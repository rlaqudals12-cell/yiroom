# 안전성 과학 (Safety Science for Ingredient/Health Recommendations)

> 이 문서는 성분/건강 추천 시스템의 기반이 되는 안전성 과학 원리를 설명한다.
> 성분 상호작용, 위험 분류, EWG 등급 해석, 오탐/미탐 분석을 포함.
> **모듈**: 성분 경고 (Ingredient Warning), 제품 추천, 영양 모듈, 스킨케어 추천 공통

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"사용자가 어떤 제품이나 성분을 접하더라도 안전성을 즉시 판단할 수 있는 시스템"

- 모든 성분의 상호작용을 실시간으로 분석하여 위험 조합을 자동 감지한다
- 사용자의 개인 건강 상태(알레르기, 임신, 질환)에 맞는 맞춤 안전성 평가를 제공한다
- 위험 등급(Critical/Warning/Info)에 따라 적절한 수준의 개입을 한다
- False Negative(위험한데 안전하다고 판단) 발생률이 0.1% 미만이다
- 사용자 안전을 최우선으로 하되, 불필요한 공포를 유발하지 않는다
```

### 물리적 한계

| 항목                     | 한계                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| **성분 데이터 불완전성** | 모든 성분의 상호작용 데이터가 존재하지 않음 (알려진 조합 << 가능한 조합) |
| **개인 반응 변이**       | 동일 성분에 대한 개인별 반응 차이가 큼 (유전, 면역 상태)                 |
| **농도 의존성**          | 같은 성분도 농도에 따라 안전/위험이 달라짐 (용량-반응 관계)              |
| **시너지/길항 효과**     | 3개 이상 성분의 복합 상호작용 예측 어려움                                |
| **최신 연구 반영**       | 안전성 데이터는 지속 업데이트 필요, 과거 "안전" 판정이 번복될 수 있음    |
| **규제 차이**            | 한국(식약처), 미국(FDA), EU(ECHA) 기준이 상이                            |

### 100점 기준

| 지표                             | 100점 기준                                    |
| -------------------------------- | --------------------------------------------- |
| **위험 감지율 (Recall)**         | Critical 위험: 99.9%, Warning: 95%, Info: 85% |
| **오탐률 (False Positive Rate)** | Critical: < 5%, Warning: < 15%, Info: < 25%   |
| **미탐률 (False Negative Rate)** | Critical: < 0.1%, Warning: < 1%, Info: < 5%   |
| **사용자 이해도**                | 안전성 경고 메시지 이해율 90%+                |
| **응답 시간**                    | 성분 안전성 분석 < 500ms                      |
| **데이터 커버리지**              | 국내 유통 화장품 성분 95%+ 커버               |
| **업데이트 주기**                | 새 안전성 데이터 반영 7일 이내                |

### 현재 목표

**65%** - MVP 안전성 경고 시스템

- EWG 등급 기반 기본 안전성 표시
- 알레르기 Cross-Reactivity 기본 DB
- 임산부 주의 성분 목록
- pH 기반 성분 비호환성 기본 검사
- Level 1 (Critical) BLOCK 자동화

### 의도적 제외

| 제외 항목                 | 이유                                      | 재검토 시점           |
| ------------------------- | ----------------------------------------- | --------------------- |
| 약물-성분 상호작용        | 의료 영역, 전문가 검증 필요               | 의료 파트너십 체결 시 |
| 농도 기반 정밀 분석       | 대부분 제품이 정확한 농도를 공개하지 않음 | 제조사 API 연동 시    |
| 3성분 이상 복합 상호작용  | 조합 폭발 문제, 데이터 부족               | 연구 데이터 축적 후   |
| 실시간 피부 반응 모니터링 | 하드웨어(패치 센서) 의존                  | Phase N               |

---

## 1. 핵심 개념

### 1.1 성분 상호작용 메커니즘 (Ingredient Interaction Mechanisms)

화장품/건강 성분 간 상호작용은 크게 세 가지 메커니즘으로 분류된다:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     성분 상호작용 3대 메커니즘                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. Chemical Incompatibility (화학적 비호환성)                         │
│      → 성분 간 화학 반응으로 효능 저하 또는 유해물질 생성              │
│      → pH 충돌, 산화 반응, 킬레이션                                    │
│                                                                          │
│   2. Contraindication (금기사항)                                        │
│      → 특정 건강 상태에서 성분 사용이 위험한 경우                      │
│      → 임신, 특정 질환, 연령 제한                                      │
│                                                                          │
│   3. Allergen Cross-Reactivity (알레르겐 교차 반응)                    │
│      → 하나의 알레르기가 유사 구조 성분에도 반응하는 현상              │
│      → 면역학적 교차 인식                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 "Better Safe Than Sorry" 원칙

```
안전성 판단의 최우선 원칙:

"의심스러우면 경고한다"
"경고하지 않아서 생기는 해(False Negative)가
 불필요한 경고(False Positive)보다 훨씬 심각하다"

비용 비대칭:
┌──────────────────────────────────────────────┐
│ 오류 유형        │ 비용           │ 수용 범위 │
├──────────────────────────────────────────────┤
│ False Positive   │ 사용자 불편     │ 허용 가능 │
│ (안전한데 경고)  │ (과잉 경고)     │           │
│                  │                │           │
│ False Negative   │ 건강 위험      │ 최소화    │
│ (위험한데 통과)  │ (심각한 결과)   │ 필수      │
└──────────────────────────────────────────────┘

→ Recall(재현율)을 Precision(정밀도)보다 우선시한다
→ 의학: "First, do no harm" (Primum non nocere)
```

### 1.3 위험 분류 체계 (Risk Classification)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       3-Level 위험 분류 체계                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Level 1: CRITICAL (차단) 🔴                                          │
│   ─────────────────────                                                 │
│   조건: 알레르겐 + 확인된 알레르기                                      │
│   행동: BLOCK — 해당 제품/성분 추천에서 완전 제외                       │
│   UI: 빨간색 경고 배너, "이 제품은 추천하지 않아요"                    │
│   예시: 땅콩 알레르기 사용자 → 아르간 오일(교차 반응) 차단            │
│                                                                          │
│   Level 2: WARNING (경고) 🟡                                           │
│   ─────────────────────                                                 │
│   조건: 특정 상태 + 주의 성분                                           │
│   행동: WARN — 경고 표시 후 사용자 판단에 위임                         │
│   UI: 노란색 경고, "주의가 필요한 성분이 포함되어 있어요"              │
│   예시: 임산부 → 레티놀 함유 제품 경고                                 │
│                                                                          │
│   Level 3: INFO (정보) 🔵                                              │
│   ─────────────────────                                                 │
│   조건: 일반적 주의 필요                                                │
│   행동: INFORM — 정보 제공, 사용자에게 판단 일임                       │
│   UI: 파란색 정보 아이콘, "참고하면 좋은 정보가 있어요"                │
│   예시: EWG 6등급 성분 → 일반 주의 정보                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**※ 용어 구분**: 기술적 안전 레벨(Level 1 CRITICAL / Level 2 WARNING / Level 3 INFO)과
법률 면책 Tier([L-1: DISCLAIMER-TEMPLATES](../legal/DISCLAIMER-TEMPLATES.md)의 Tier 1/2/3)는
다른 문맥의 분류체계이다. 매핑: Level 1 CRITICAL → Tier 2 전문가 권고 면책, Level 2 WARNING → Tier 2, Level 3 INFO → Tier 3 일반 정보 면책.

---

## 2. 화학적 비호환성 (Chemical Incompatibility)

### 2.1 pH 충돌 (pH Conflicts)

**원리**: 화장품 활성 성분은 특정 pH 범위에서만 효과적이며, pH가 다른 성분을 혼합하면 효능이 저하되거나 자극을 유발한다.

```
피부의 산성 보호막 (Acid Mantle): pH 4.5-5.5

성분별 최적 pH:
┌──────────────────────────────────────────────────────┐
│ 성분                │ 최적 pH   │ 범위          │
├──────────────────────────────────────────────────────┤
│ Vitamin C (L-AA)    │ 2.5-3.5  │ 강산성        │
│ AHA (글리콜산)      │ 3.0-4.0  │ 산성          │
│ BHA (살리실산)      │ 3.0-4.0  │ 산성          │
│ Niacinamide         │ 5.0-7.0  │ 약산성~중성   │
│ Retinol             │ 5.5-6.0  │ 약산성        │
│ Peptides            │ 5.0-7.0  │ 약산성~중성   │
│ Vitamin C (MAP)     │ 6.0-7.0  │ 중성          │
│ Zinc Oxide          │ 7.0-8.0  │ 약알칼리성    │
└──────────────────────────────────────────────────────┘
```

**pH 충돌 규칙**:

```
pH 차이 ≥ 2.0 → 비호환 가능성 높음

알려진 비호환 조합:
1. Vitamin C (L-AA, pH 2.5-3.5) + Niacinamide (pH 5.0-7.0)
   → pH 충돌로 Niacinamide가 니코틴산으로 전환 (자극 유발)
   → 대안: 아침/저녁 분리 사용, 또는 MAP형 Vitamin C 사용

2. AHA/BHA (pH 3.0-4.0) + Retinol (pH 5.5-6.0)
   → 과도한 자극, 피부 장벽 손상
   → 대안: 교대 사용 (하루 AHA → 다음 날 Retinol)

3. Vitamin C (L-AA) + 강알칼리 클렌저
   → 산성 활성이 중화되어 효과 소실
```

### 2.2 산화 반응 (Oxidation)

```
산화 민감 성분:
- Vitamin C (Ascorbic Acid): 공기/빛에 산화 → 갈변, 효과 소실
- Retinol: UV에 분해 → 효과 소실 + 광민감성
- 불포화 지방산 (아르간/호호바 오일): 산패 가능

산화-환원 충돌:
- Benzoyl Peroxide (산화제) + Retinol (환원 민감)
  → Retinol 분해, 효과 소실
  → Level 2 WARNING

- Vitamin C + Benzoyl Peroxide
  → 상호 산화-환원으로 양쪽 모두 효과 감소
  → Level 3 INFO
```

### 2.3 킬레이션 (Chelation) 및 흡착

```
금속 이온 의존 성분:
- Zinc Oxide/Zinc PCA: Zn²⁺ 이온에 의존
- 구리 펩타이드 (GHK-Cu): Cu²⁺ 이온에 의존

킬레이팅 성분:
- EDTA, Phytic Acid: 금속 이온을 포획하여 비활성화

충돌:
EDTA + 구리 펩타이드 → Cu²⁺ 킬레이션 → 펩타이드 효과 감소
→ Level 3 INFO
```

---

## 3. 금기사항 (Contraindications)

### 3.1 임산부/수유부 주의 성분

**근거**: FDA Category X, 식품의약품안전처 화장품 안전기준

```
┌──────────────────────────────────────────────────────────────────┐
│                  임산부 주의 성분 목록                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│ Level 1 (CRITICAL — 차단):                                        │
│   - Retinoids (레티노이드 전체): 기형 유발 위험                   │
│     → Tretinoin, Isotretinoin, Adapalene                         │
│     → Retinol, Retinaldehyde도 고농도 시 주의                    │
│   - Hydroquinone (하이드로퀴논): 전신 흡수 우려                  │
│   - Formaldehyde 방부제: 발암 + 기형 유발                        │
│                                                                    │
│ Level 2 (WARNING — 경고):                                         │
│   - Salicylic Acid (살리실산) 고농도 (≥2%)                       │
│     → 아스피린과 동일 계열, 혈소판 기능 영향                     │
│   - Chemical Sunscreen (옥시벤존, 아보벤존)                      │
│     → 내분비계 교란 우려                                          │
│   - Essential Oils (에센셜 오일): 일부 자궁 수축 유발            │
│     → 클라리세이지, 로즈마리, 쑥                                 │
│   - Retinol (레티놀) 저농도                                      │
│                                                                    │
│ Level 3 (INFO — 정보):                                            │
│   - Caffeine 고농도: 일 300mg 이내 권장                          │
│   - 일부 허브 추출물: 안전성 데이터 부족                         │
│   - AHA/BHA 저농도: 광민감성 주의                                │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 질환별 주의 성분

```
피부 질환:
┌──────────────────────────────────────────────────────┐
│ 질환           │ 주의 성분             │ Level │
├──────────────────────────────────────────────────────┤
│ 아토피 피부염  │ 향료, SLS, 알코올     │ 2     │
│ 접촉 피부염    │ 개인 알레르겐 목록    │ 1-2   │
│ 여드름 (중증)  │ 코메도제닉 성분       │ 2     │
│ 로사세아       │ 알코올, 멘솔, 강산성  │ 2     │
│ 건선           │ 강한 각질 제거제      │ 2     │
└──────────────────────────────────────────────────────┘

전신 질환:
┌──────────────────────────────────────────────────────┐
│ 질환           │ 주의 성분             │ Level │
├──────────────────────────────────────────────────────┤
│ 갑상선 질환    │ 요오드 함유 해조류    │ 2     │
│ 자가면역 질환  │ 면역 자극 성분        │ 2     │
│ 신장 질환      │ 고농도 비타민 A/D     │ 2     │
│ 간 질환        │ 고농도 비타민 A       │ 2     │
└──────────────────────────────────────────────────────┘
```

### 3.3 연령별 주의사항

```
어린이 (0-12세):
- Level 1: 레티노이드, AHA/BHA 고농도, 하이드로퀴논
- Level 2: 에센셜 오일 (피부 미성숙), 화학 자외선차단제
- Level 3: 향료, 색소

청소년 (13-18세):
- Level 2: 레티놀 고농도, 고농도 산성 필링
- Level 3: 항노화 성분 (불필요한 사용)

고령자 (65세+):
- Level 2: 강한 각질 제거 (피부 장벽 약화)
- Level 3: 고농도 활성 성분 (피부 민감도 증가)
```

---

## 4. 알레르겐 교차 반응 (Allergen Cross-Reactivity)

### 4.1 교차 반응의 면역학적 원리

```
교차 반응 메커니즘:

알레르겐 A에 대한 IgE 항체가
구조적으로 유사한 알레르겐 B도 인식 → 알레르기 반응 유발

조건:
1. 에피토프(Epitope) 구조적 유사성 > 70%
2. 동일 단백질 계열 (superfamily)
3. 공통 탄수화물 에피토프 (CCD: Cross-reactive Carbohydrate Determinants)
```

### 4.2 주요 교차 반응 그룹

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    교차 반응 그룹 (Cross-Reactivity Groups)               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Group 1: 견과류 (Tree Nuts)                                             │
│   1차 알레르겐: 땅콩 (Arachis hypogaea)                                │
│   교차 반응:                                                            │
│   - 아르간 오일 (Argania spinosa) — 같은 Fabaceae 계열               │
│   - 콩 추출물 (Glycine max)                                            │
│   - 루핀 (Lupinus)                                                     │
│   적용: 땅콩 알레르기 → 아르간 오일 포함 제품 Level 1 BLOCK           │
│                                                                          │
│ Group 2: 라텍스-과일 증후군 (Latex-Fruit Syndrome)                     │
│   1차 알레르겐: 천연 라텍스                                             │
│   교차 반응:                                                            │
│   - 파파야 추출물 (파파인 효소)                                        │
│   - 키위 추출물                                                         │
│   - 아보카도 오일                                                       │
│   - 바나나 추출물                                                       │
│   적용: 라텍스 알레르기 → 위 성분 Level 1 BLOCK                       │
│                                                                          │
│ Group 3: 국화과 알레르기 (Compositae/Asteraceae)                       │
│   1차 알레르겐: 돼지풀, 쑥, 국화 꽃가루                                │
│   교차 반응:                                                            │
│   - 카모마일 추출물 (Chamomilla recutita)                              │
│   - 아르니카 추출물 (Arnica montana)                                   │
│   - 칼렌듈라 추출물 (Calendula officinalis)                            │
│   - 에키네시아 추출물                                                   │
│   적용: 국화과 알레르기 → 위 성분 Level 2 WARNING                     │
│                                                                          │
│ Group 4: 프로폴리스-발삼 페루 (Propolis-Balsam of Peru)                │
│   1차 알레르겐: 프로폴리스, 발삼 오브 페루                             │
│   교차 반응:                                                            │
│   - 벤조산/벤질 계열 (Benzoic acid, Benzyl alcohol)                    │
│   - 신나몬/시나메이트 (Cinnamic acid)                                  │
│   - 바닐린 (Vanillin) — 향료 성분                                      │
│   - 유향 (Styrax) — 향수 성분                                          │
│   적용: 프로폴리스 알레르기 → 벤질 계열 향료 Level 2 WARNING          │
│                                                                          │
│ Group 5: 니켈 교차 반응 (Nickel Cross-Reactivity)                      │
│   1차 알레르겐: 니켈 (Ni²⁺)                                           │
│   교차 반응:                                                            │
│   - 코발트 (Co²⁺)                                                     │
│   - 크롬 (Cr³⁺)                                                       │
│   - 팔라듐 (Pd²⁺)                                                     │
│   적용: 니켈 알레르기 → 금속 산화물 함유 화장품 Level 2 WARNING       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 식품 알레르기 → 화장품 성분 교차

```
중요: 식품 알레르기가 화장품 성분으로 교차되는 경우

┌──────────────────────────────────────────────────────────────────┐
│ 식품 알레르기    │ 화장품 주의 성분                │ Level │
├──────────────────────────────────────────────────────────────────┤
│ 우유 (카제인)    │ 라크토페린, 유단백 추출물       │ 2     │
│ 계란 (난백)      │ 리소자임, 난백 추출물           │ 2     │
│ 밀 (글루텐)      │ 가수분해 밀 단백질              │ 1-2   │
│ 대두             │ 콩 추출물, 레시틴              │ 2     │
│ 갑각류           │ 키토산 (갑각류 유래)            │ 2     │
│ 꿀벌 (봉독)     │ 프로폴리스, 로열젤리, 벌꿀     │ 1     │
│ 참깨             │ 참기름 (Sesamum indicum)       │ 2     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. EWG 등급 해석 (Environmental Working Group)

### 5.1 EWG Skin Deep 등급 체계

**출처**: Environmental Working Group, Skin Deep Cosmetics Database

```
EWG 등급 (1-10):

┌──────────────────────────────────────────────────────────────────┐
│ 등급     │ 분류      │ 의미                    │ 이룸 매핑    │
├──────────────────────────────────────────────────────────────────┤
│ 1-2      │ Low       │ 안전 (Low Hazard)       │ 녹색 표시    │
│          │ Hazard    │ 대부분의 사람에게 안전  │ 제한 없음    │
│          │           │                         │              │
│ 3-6      │ Moderate  │ 주의 (Moderate Hazard)  │ 노란색 표시  │
│          │ Hazard    │ 일부 우려 성분 포함     │ Level 3 INFO │
│          │           │ 사용 빈도/농도에 따라   │              │
│          │           │                         │              │
│ 7-10     │ High      │ 위험 (High Hazard)      │ 빨간색 표시  │
│          │ Hazard    │ 건강 위험 가능성 높음   │ Level 2 WARN │
│          │           │ 발암/내분비교란/독성    │              │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 EWG 등급의 한계와 보정

```
EWG 등급의 알려진 한계:

1. 농도 미반영
   - EWG는 성분의 "존재 여부"만 평가, 농도를 고려하지 않음
   - 예: Phenoxyethanol은 1% 이하에서 안전하지만 EWG 4등급
   → 보정: 알려진 안전 농도 데이터 보완 적용

2. "자연적 = 안전" 편향
   - 천연 성분에 대해 상대적으로 관대
   - 예: 에센셜 오일은 자연적이지만 알레르기 유발 가능
   → 보정: 천연 성분도 알레르겐 DB와 교차 검증

3. 규제 기관 의견 불일치
   - EWG와 FDA/식약처 의견이 다른 성분 존재
   - 예: 화학 자외선차단제에 대한 평가 차이
   → 보정: 한국 식약처 기준 병행 표시

4. 데이터 간극 (Data Gaps)
   - "데이터 부족"을 "위험"으로 해석하는 경향
   - 새로운 성분은 데이터 부족으로 높은 등급 받을 수 있음
   → 보정: "데이터 부족" 별도 표시, 위험과 구분
```

### 5.3 이룸 안전성 종합 점수 공식

```
이룸 안전성 점수 = f(EWG, 식약처, 알레르기DB, 상호작용DB)

산출 방법:

1. 기본 점수 (EWG 기반)
   EWG 1-2 → 기본 90점
   EWG 3-4 → 기본 70점
   EWG 5-6 → 기본 50점
   EWG 7-8 → 기본 30점
   EWG 9-10 → 기본 10점

2. 개인화 보정
   + 알레르기 매칭: 해당 알레르겐 감지 시 -50점 (BLOCK)
   + 금기사항 매칭: 임산부/질환 해당 시 -30점 (WARN)
   + 피부 타입 부적합: -10점 (INFO)

3. 상호작용 보정
   + pH 충돌 성분 조합: -20점 (WARN)
   + 산화 비호환 조합: -15점 (INFO)
   + 시너지 조합: +10점 (긍정적)

최종 등급:
80-100: 안전 (Safe) — 녹색
50-79: 주의 (Caution) — 노란색
20-49: 경고 (Warning) — 주황색
0-19: 위험 (Danger) — 빨간색
```

---

## 6. False Positive / False Negative 분석

### 6.1 오탐/미탐 정의와 비용

```
혼동 행렬 (Confusion Matrix):

                    실제 상태
                 위험         안전
예측  ┌──────────────────────────────┐
위험  │ True Positive    │ False Positive │
      │ (올바른 경고)    │ (과잉 경고)    │
      │                 │ 비용: 사용자   │
      │                 │ 불편, 신뢰 하락│
      ├──────────────────────────────┤
안전  │ False Negative   │ True Negative  │
      │ (놓친 위험) ❗   │ (올바른 통과)  │
      │ 비용: 건강 위험, │                │
      │ 법적 책임 ❗❗   │                │
      └──────────────────────────────┘
```

### 6.2 Level별 오탐/미탐 허용 범위

```
Level 1 (CRITICAL):
┌────────────────────────────────────────────────┐
│ 지표               │ 허용 범위    │ 근거      │
├────────────────────────────────────────────────┤
│ Recall (재현율)     │ ≥ 99.9%     │ 아나필락시│
│                    │              │ 스 위험   │
│ Precision (정밀도)  │ ≥ 90%       │ 과잉 차단 │
│                    │              │ 감수      │
│ False Negative Rate │ ≤ 0.1%      │ 절대 허용 │
│                    │              │ 불가      │
│ False Positive Rate │ ≤ 10%       │ 감수 가능 │
└────────────────────────────────────────────────┘

Level 2 (WARNING):
┌────────────────────────────────────────────────┐
│ 지표               │ 허용 범위    │ 근거      │
├────────────────────────────────────────────────┤
│ Recall             │ ≥ 95%       │ 장기 건강 │
│ Precision          │ ≥ 80%       │ 적정 수준 │
│ False Negative Rate │ ≤ 5%       │ 낮게 유지 │
│ False Positive Rate │ ≤ 20%      │ 감수 가능 │
└────────────────────────────────────────────────┘

Level 3 (INFO):
┌────────────────────────────────────────────────┐
│ 지표               │ 허용 범위    │ 근거      │
├────────────────────────────────────────────────┤
│ Recall             │ ≥ 85%       │ 정보 제공 │
│ Precision          │ ≥ 70%       │ 적정 수준 │
│ False Negative Rate │ ≤ 15%      │ 허용 가능 │
│ False Positive Rate │ ≤ 30%      │ 감수 가능 │
└────────────────────────────────────────────────┘
```

### 6.3 오탐 최소화 전략 (사용자 경험 보호)

```
과잉 경고는 "경고 피로(Warning Fatigue)"를 유발:
→ 모든 것에 경고하면 사용자가 경고를 무시하게 됨
→ 정말 중요한 경고도 놓치게 됨

오탐 최소화 전략:

1. 계층적 표시 (Hierarchical Display)
   - Level 1: 풀스크린 경고 배너 (절대 무시 불가)
   - Level 2: 인라인 경고 (접힌 상태, 탭하면 상세)
   - Level 3: 정보 아이콘 (호버/탭 시 팝오버)

2. 맥락 기반 필터링 (Context-Aware Filtering)
   - 동일 성분 경고를 이미 확인했으면 재표시 안 함
   - 사용자가 "이 경고 이해했어요" 선택 시 다음부터 축소 표시

3. 신뢰도 표시 (Confidence Display)
   - "높은 확신": 임상 데이터 기반 (Level 1 경고)
   - "중간 확신": 기존 연구 기반 (Level 2 경고)
   - "참고 수준": 일반적 주의사항 (Level 3 정보)
```

---

## 7. 구현 도출

### 7.1 원리 → 알고리즘

```
안전성 검사 파이프라인:

입력: [사용자 프로필] + [제품 성분 목록]

Step 1: 알레르겐 교차 검사 (Critical)
├── 사용자 알레르기 목록 로드
├── 교차 반응 그룹 DB 조회
├── 제품 성분과 매칭
└── 매칭 시 → Level 1 BLOCK

Step 2: 금기사항 검사 (Warning)
├── 사용자 건강 상태 (임신, 질환 등) 로드
├── 금기 성분 DB 조회
├── 제품 성분과 매칭
└── 매칭 시 → Level 2 WARN

Step 3: 성분 상호작용 검사 (Warning/Info)
├── 제품 내 성분 간 pH 충돌 검사
├── 산화-환원 비호환 검사
├── 킬레이션 충돌 검사
└── 충돌 발견 시 → Level 2-3

Step 4: EWG 등급 기반 일반 안전성 (Info)
├── 각 성분 EWG 등급 조회
├── 제품 평균 안전성 점수 계산
├── 개인화 보정 적용
└── 최종 안전성 등급 산출

출력: SafetyReport {
  overallGrade: 'safe' | 'caution' | 'warning' | 'danger',
  score: number,          // 0-100
  alerts: SafetyAlert[],  // Level별 경고 목록
  blockedIngredients: string[],  // Level 1 차단 성분
  details: IngredientDetail[]    // 각 성분 상세
}
```

### 7.2 알고리즘 → 코드 설계

```typescript
// lib/safety/types.ts

export type RiskLevel = 'critical' | 'warning' | 'info';

export interface SafetyAlert {
  level: RiskLevel;
  ingredientName: string;
  ingredientNameKo: string;
  reason: string; // 기술적 사유
  userMessage: string; // 사용자 메시지 (한국어)
  evidence: 'clinical' | 'research' | 'general'; // 근거 수준
  crossReactivityGroup?: string; // 교차 반응 그룹
}

export interface SafetyReport {
  overallGrade: 'safe' | 'caution' | 'warning' | 'danger';
  score: number;
  alerts: SafetyAlert[];
  blockedIngredients: string[];
  safeIngredients: string[];
  details: IngredientSafetyDetail[];
}

export interface UserHealthProfile {
  allergies: string[]; // 알려진 알레르기
  conditions: string[]; // 건강 상태 (pregnancy, etc.)
  skinConditions: string[]; // 피부 질환
  age: number;
  medications: string[]; // 복용 약물 (향후)
}
```

```typescript
// lib/safety/analyzer.ts

// 안전성 분석 메인 함수
export function analyzeProductSafety(
  ingredients: string[],
  userProfile: UserHealthProfile
): SafetyReport {
  const alerts: SafetyAlert[] = [];
  const blockedIngredients: string[] = [];

  // Step 1: 알레르겐 교차 반응 검사 (Critical)
  for (const ingredient of ingredients) {
    const crossReaction = checkCrossReactivity(ingredient, userProfile.allergies);
    if (crossReaction) {
      alerts.push({
        level: 'critical',
        ingredientName: ingredient,
        ingredientNameKo: getKoreanName(ingredient),
        reason: `Cross-reactivity with ${crossReaction.allergen}`,
        userMessage: `${getKoreanName(ingredient)}은(는) ${crossReaction.allergenKo} 알레르기와 교차 반응할 수 있어요. 이 제품은 추천하지 않아요.`,
        evidence: 'clinical',
        crossReactivityGroup: crossReaction.group,
      });
      blockedIngredients.push(ingredient);
    }
  }

  // Step 2: 금기사항 검사 (Warning)
  for (const ingredient of ingredients) {
    const contraindication = checkContraindication(
      ingredient,
      userProfile.conditions,
      userProfile.age
    );
    if (contraindication) {
      alerts.push({
        level: 'warning',
        ingredientName: ingredient,
        ingredientNameKo: getKoreanName(ingredient),
        reason: contraindication.reason,
        userMessage: contraindication.userMessageKo,
        evidence: contraindication.evidence,
      });
    }
  }

  // Step 3: 성분 간 상호작용 검사 (Warning/Info)
  const interactions = checkIngredientInteractions(ingredients);
  for (const interaction of interactions) {
    alerts.push({
      level: interaction.severity === 'high' ? 'warning' : 'info',
      ingredientName: `${interaction.ingredientA} + ${interaction.ingredientB}`,
      ingredientNameKo: `${getKoreanName(interaction.ingredientA)} + ${getKoreanName(interaction.ingredientB)}`,
      reason: interaction.mechanism,
      userMessage: interaction.userMessageKo,
      evidence: interaction.evidence,
    });
  }

  // Step 4: EWG 등급 기반 일반 안전성
  const ewgAlerts = checkEWGGrades(ingredients);
  alerts.push(...ewgAlerts);

  // 종합 점수 계산
  const score = calculateSafetyScore(alerts, ingredients.length);
  const overallGrade = scoreToGrade(score);

  return {
    overallGrade,
    score,
    alerts: alerts.sort((a, b) => levelPriority(a.level) - levelPriority(b.level)),
    blockedIngredients,
    safeIngredients: ingredients.filter((i) => !blockedIngredients.includes(i)),
    details: ingredients.map((i) => getIngredientDetail(i, alerts)),
  };
}
```

```typescript
// lib/safety/cross-reactivity-db.ts

// 교차 반응 그룹 데이터베이스
interface CrossReactivityGroup {
  id: string;
  nameKo: string;
  primaryAllergens: string[];
  crossReactiveIngredients: string[];
  confidence: number; // 0-1
  source: string;
}

export const CROSS_REACTIVITY_GROUPS: CrossReactivityGroup[] = [
  {
    id: 'tree-nuts',
    nameKo: '견과류 그룹',
    primaryAllergens: ['peanut', 'tree_nut'],
    crossReactiveIngredients: [
      'argania spinosa kernel oil', // 아르간 오일
      'glycine max', // 콩 추출물
      'prunus amygdalus dulcis oil', // 아몬드 오일
      'corylus avellana seed oil', // 헤이즐넛 오일
      'macadamia integrifolia seed oil', // 마카다미아 오일
    ],
    confidence: 0.85,
    source: 'ACAAI Cross-Reactivity Database',
  },
  {
    id: 'latex-fruit',
    nameKo: '라텍스-과일 증후군',
    primaryAllergens: ['latex'],
    crossReactiveIngredients: [
      'carica papaya fruit extract', // 파파야
      'actinidia chinensis fruit extract', // 키위
      'persea gratissima oil', // 아보카도 오일
      'musa sapientum fruit extract', // 바나나
      'castanea sativa seed extract', // 밤 추출물
    ],
    confidence: 0.8,
    source: 'Journal of Allergy and Clinical Immunology',
  },
  {
    id: 'compositae',
    nameKo: '국화과 그룹',
    primaryAllergens: ['ragweed', 'mugwort', 'chrysanthemum'],
    crossReactiveIngredients: [
      'chamomilla recutita extract', // 카모마일
      'arnica montana flower extract', // 아르니카
      'calendula officinalis extract', // 칼렌듈라
      'echinacea purpurea extract', // 에키네시아
      'helianthus annuus seed oil', // 해바라기씨 오일
    ],
    confidence: 0.75,
    source: 'Contact Dermatitis Journal',
  },
  // ... 추가 그룹
];
```

### 7.3 pH 충돌 검사 알고리즘

```typescript
// lib/safety/ph-compatibility.ts

interface IngredientPH {
  name: string;
  optimalPHMin: number;
  optimalPHMax: number;
  category: 'acid' | 'neutral' | 'alkaline';
}

const PH_DATABASE: IngredientPH[] = [
  { name: 'ascorbic acid', optimalPHMin: 2.5, optimalPHMax: 3.5, category: 'acid' },
  { name: 'glycolic acid', optimalPHMin: 3.0, optimalPHMax: 4.0, category: 'acid' },
  { name: 'salicylic acid', optimalPHMin: 3.0, optimalPHMax: 4.0, category: 'acid' },
  { name: 'niacinamide', optimalPHMin: 5.0, optimalPHMax: 7.0, category: 'neutral' },
  { name: 'retinol', optimalPHMin: 5.5, optimalPHMax: 6.0, category: 'neutral' },
  { name: 'peptides', optimalPHMin: 5.0, optimalPHMax: 7.0, category: 'neutral' },
  // ... 확장 가능
];

// pH 비호환성 검사
function checkPHCompatibility(
  ingredientA: string,
  ingredientB: string
): { incompatible: boolean; severity: 'high' | 'medium' | 'low'; reason: string } | null {
  const phA = PH_DATABASE.find((i) => ingredientA.toLowerCase().includes(i.name));
  const phB = PH_DATABASE.find((i) => ingredientB.toLowerCase().includes(i.name));

  if (!phA || !phB) return null;

  const phGap = Math.abs(
    (phA.optimalPHMin + phA.optimalPHMax) / 2 - (phB.optimalPHMin + phB.optimalPHMax) / 2
  );

  if (phGap >= 3.0) {
    return {
      incompatible: true,
      severity: 'high',
      reason: `pH 차이 ${phGap.toFixed(1)} — 동시 사용 시 효과 감소 및 자극 가능`,
    };
  }

  if (phGap >= 2.0) {
    return {
      incompatible: true,
      severity: 'medium',
      reason: `pH 차이 ${phGap.toFixed(1)} — 순서 또는 시간 간격 두고 사용 권장`,
    };
  }

  return null;
}
```

---

## 8. 검증 방법

### 8.1 안전성 검사 정확도 테스트

```typescript
// tests/lib/safety/analyzer.test.ts

describe('Safety Analyzer', () => {
  // Level 1 (Critical) — 절대 놓쳐선 안 되는 케이스
  describe('Level 1: Allergen Cross-Reactivity', () => {
    it('땅콩 알레르기 사용자 → 아르간 오일 차단', () => {
      const report = analyzeProductSafety(['argania spinosa kernel oil', 'water', 'glycerin'], {
        allergies: ['peanut'],
        conditions: [],
        skinConditions: [],
        age: 25,
        medications: [],
      });

      expect(report.blockedIngredients).toContain('argania spinosa kernel oil');
      expect(report.alerts.some((a) => a.level === 'critical')).toBe(true);
    });

    it('라텍스 알레르기 사용자 → 파파인 효소 차단', () => {
      const report = analyzeProductSafety(['carica papaya fruit extract', 'water'], {
        allergies: ['latex'],
        conditions: [],
        skinConditions: [],
        age: 30,
        medications: [],
      });

      expect(report.blockedIngredients).toContain('carica papaya fruit extract');
    });

    it('알레르기 없는 사용자 → 차단 없음', () => {
      const report = analyzeProductSafety(['argania spinosa kernel oil', 'niacinamide'], {
        allergies: [],
        conditions: [],
        skinConditions: [],
        age: 25,
        medications: [],
      });

      expect(report.blockedIngredients).toHaveLength(0);
    });
  });

  // Level 2 (Warning) — 임산부 금기
  describe('Level 2: Pregnancy Contraindications', () => {
    it('임산부 → 레티놀 경고', () => {
      const report = analyzeProductSafety(['retinol', 'hyaluronic acid'], {
        allergies: [],
        conditions: ['pregnancy'],
        skinConditions: [],
        age: 30,
        medications: [],
      });

      expect(
        report.alerts.some((a) => a.level === 'warning' && a.ingredientName === 'retinol')
      ).toBe(true);
    });

    it('비임산부 → 레티놀 경고 없음', () => {
      const report = analyzeProductSafety(['retinol', 'hyaluronic acid'], {
        allergies: [],
        conditions: [],
        skinConditions: [],
        age: 30,
        medications: [],
      });

      expect(
        report.alerts.some((a) => a.level === 'warning' && a.ingredientName === 'retinol')
      ).toBe(false);
    });
  });

  // pH 충돌 검사
  describe('pH Compatibility', () => {
    it('Vitamin C + Niacinamide → 충돌 감지', () => {
      const report = analyzeProductSafety(['ascorbic acid', 'niacinamide'], {
        allergies: [],
        conditions: [],
        skinConditions: [],
        age: 25,
        medications: [],
      });

      expect(
        report.alerts.some(
          (a) =>
            a.ingredientName.includes('ascorbic acid') && a.ingredientName.includes('niacinamide')
        )
      ).toBe(true);
    });
  });
});
```

### 8.2 False Negative 방지 검증

```typescript
// tests/lib/safety/false-negative-prevention.test.ts
describe('False Negative Prevention', () => {
  // FNR(False Negative Rate) = 미탐지 / (정상 탐지 + 미탐지)
  // 목표: FNR 0% (Level 1 CRITICAL), FNR < 5% (Level 2 WARNING)

  it('알레르겐 DB 전수 테스트 — EU 26종 FNR 0%', () => {
    const EU_26_ALLERGENS = [
      'amyl cinnamal',
      'benzyl alcohol',
      'cinnamyl alcohol',
      'citral',
      'eugenol',
      'hydroxycitronellal',
      'isoeugenol',
      'amylcinnamyl alcohol',
      'benzyl salicylate',
      'cinnamal',
      'coumarin',
      'geraniol',
      'hydroxyisohexyl 3-cyclohexene carboxaldehyde',
      'anise alcohol',
      'benzyl cinnamate',
      'farnesol',
      'butylphenyl methylpropional',
      'linalool',
      'benzyl benzoate',
      'citronellol',
      'hexyl cinnamal',
      'limonene',
      'methyl 2-octynoate',
      'alpha-isomethyl ionone',
      'evernia prunastri extract',
      'evernia furfuracea extract',
    ];

    const allergicUser = {
      allergies: ['fragrance'],
      conditions: [],
      skinConditions: [],
      age: 25,
      medications: [],
    };

    EU_26_ALLERGENS.forEach((allergen) => {
      const report = analyzeProductSafety([allergen, 'water'], allergicUser);
      // 모든 알레르겐이 탐지되어야 함 (FNR = 0%)
      expect(report.alerts.length).toBeGreaterThan(0);
    });
  });

  it('교차반응 그룹 — 견과류↔아르간 오일 FNR 0%', () => {
    const CROSS_REACTIVE_PAIRS = [
      { allergy: 'tree_nuts', ingredient: 'argania spinosa kernel oil' },
      { allergy: 'latex', ingredient: 'carica papaya fruit extract' },
      { allergy: 'latex', ingredient: 'ficus carica fruit extract' },
    ];

    CROSS_REACTIVE_PAIRS.forEach(({ allergy, ingredient }) => {
      const report = analyzeProductSafety([ingredient, 'water'], {
        allergies: [allergy],
        conditions: [],
        skinConditions: [],
        age: 30,
        medications: [],
      });
      expect(report.blockedIngredients.length).toBeGreaterThan(0);
    });
  });

  it('금기사항 — 임산부 5대 금기 성분 FNR 0%', () => {
    const PREGNANCY_CONTRAINDICATED = [
      'retinol',
      'retinyl palmitate',
      'salicylic acid',
      'hydroquinone',
      'formaldehyde',
    ];

    PREGNANCY_CONTRAINDICATED.forEach((ingredient) => {
      const report = analyzeProductSafety([ingredient, 'water'], {
        allergies: [],
        conditions: ['pregnancy'],
        skinConditions: [],
        age: 30,
        medications: [],
      });
      expect(report.alerts.some((a) => a.level === 'warning' || a.level === 'critical')).toBe(true);
    });
  });
});
```

---

## 관련 문서

- [R-2: SAFETY-LEGAL-R2](../research/claude-ai-research/SAFETY-LEGAL-R2-안전법률리서치.md) — 법률 리서치
- [L-1: DISCLAIMER-TEMPLATES](../legal/DISCLAIMER-TEMPLATES.md) — 면책 조항 템플릿
- [SDD-SAFETY-PROFILE](../specs/SDD-SAFETY-PROFILE.md) — 기술 스펙
- [ADR-070: Safety Profile](../adr/ADR-070-safety-profile-architecture.md) — 아키텍처 결정

---

**Version**: 1.0 | **Created**: 2026-03-03
