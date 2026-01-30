# 영양학 원리 (Nutrition Science)

> 이 문서는 N-1 (영양 분석), COMBO-SKIN-NUTRITION, COMBO-ORAL-NUTRITION 모듈의 기반이 되는 기본 원리를 설명한다.
>
> **소스 리서치**: [N-1-R1-영양학기초](../research/claude-ai-research/N-1-R1-영양학기초.md), COMBO-SKIN-NUTRITION, COMBO-ORAL-NUTRITION

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 개인화 영양 분석 시스템"

- 100% 개인화: 사용자의 나이, 성별, 건강 상태, 유전적 특성, 생활 습관을 모두 반영한 맞춤형 영양 권장
- 실시간 상태 반영: 피부/구강 분석 결과와 연동하여 현재 영양 결핍을 즉시 파악
- 시너지 최적화: 영양소 간 상호작용(시너지/길항)을 고려한 최적의 섭취 조합 제안
- 생체이용률 극대화: 흡수율을 높이는 섭취 시간, 조합, 형태 안내
- 근거 기반: 모든 권장이 한국인 영양소 섭취기준(KDRIs)과 학술 연구에 기반
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **유전자 정보 부재** | 유전체 분석 없이 개인별 영양소 대사 차이 반영 불가 |
| **혈액 검사 연동 불가** | 실제 혈중 영양소 농도 측정 불가, 추정치 사용 |
| **식이 기록 의존** | 사용자 입력 정확도에 따른 분석 품질 변동 |
| **약물 상호작용 한계** | 모든 약물-영양소 상호작용 DB 확보 어려움 |
| **실시간 변화 반영** | 스트레스, 운동, 수면 등 일시적 요인 반영 한계 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **RDA 커버리지** | 한국인 영양소 섭취기준 30개 이상 영양소 지원 |
| **연령 세분화** | 5개 이상 연령대 (10-17, 18-29, 30-49, 50-64, 65+) |
| **성별 구분** | 남성/여성 별도 RDA 적용 |
| **건강 상태 반영** | 5개 이상 건강 상태 (당뇨, 고혈압, 골다공증, 빈혈, 신장질환) |
| **시너지/길항 DB** | 50개 이상 영양소 상호작용 매트릭스 |
| **생체이용률 반영** | 주요 10개 영양소의 형태별 흡수율 적용 |
| **피부-영양 연계** | 피부 상태별 영양 권장 매핑 (건조/지성/민감/노화) |
| **구강-영양 연계** | 구강 상태별 영양 권장 매핑 (잇몸/충치/구취) |
| **학술 근거** | 모든 권장에 1개 이상 학술 출처 |

### 현재 목표

**85%** - MVP 영양 분석 시스템

- ✅ 한국인 RDA 기반 30개 영양소
- ✅ 5개 연령대, 남녀 구분
- ✅ 5개 건강 상태 조정 계수
- ✅ 주요 영양소 시너지/길항 매트릭스
- ✅ 피부-영양, 구강-영양 연계
- ⏳ 생체이용률 세부 반영 (60%)
- ⏳ 약물 상호작용 DB (30%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 유전자 맞춤 영양 | 유전체 분석 서비스 연동 필요, 개인정보 이슈 | Phase 4 |
| 혈액 검사 연동 | 의료기기 인증 필요, 규제 이슈 | Phase 5 |
| 실시간 CGM 연동 | 하드웨어 의존성, 비용 | 미정 |
| 식이 자동 인식 | 이미지 기반 식품 인식 AI 개발 필요 | Phase 3 |

---

## 1. 핵심 개념

### 1.1 영양소와 피부 건강

피부는 신체에서 가장 큰 기관으로, 영양 상태를 직접적으로 반영한다.

| 영양소 | 피부 기능 | 결핍 증상 | 권장 섭취 |
|--------|----------|----------|----------|
| **비타민 A** | 세포 회전율, 피지 조절 | 건조, 각질화 | 700-900 μg RAE |
| **비타민 C** | 콜라겐 합성, 항산화 | 멍, 느린 치유 | 75-90 mg |
| **비타민 E** | 지질 보호, 항산화 | 건조, 주름 | 15 mg α-TE |
| **비타민 B2** | 에너지 대사, 세포 분열 | 구각염, 피부염 | 1.1-1.3 mg |
| **비타민 B3** | 장벽 기능, 피지 조절 | 펠라그라, 피부염 | 14-16 mg |
| **비타민 B6** | 단백질 대사, 피지 조절 | 지루성 피부염 | 1.3-1.7 mg |
| **비오틴** | 지방산 합성, 케라틴 생성 | 탈모, 피부발진 | 30 μg |
| **아연** | 상처 치유, 면역 | 여드름, 탈모 | 8-11 mg |
| **셀레늄** | 항산화 효소 보조 | 산화 손상 | 55-70 μg |
| **오메가-3** | 염증 조절, 장벽 기능 | 건조, 염증 | 250-500 mg EPA+DHA |
| **콜라겐** | 구조 단백질 | 탄력 저하 | 2.5-10 g |

### 1.2 영양소와 구강 건강

| 영양소 | 구강 기능 | 결핍 증상 | 권장 섭취 |
|--------|----------|----------|----------|
| **칼슘** | 치아/뼈 구조 | 치아 약화, 치조골 손실 | 800-1000 mg |
| **비타민 D** | 칼슘 흡수, 면역 | 치주질환, 충치 | 600-800 IU |
| **비타민 C** | 잇몸 콜라겐 | 잇몸 출혈, 치주염 | 75-90 mg |
| **비타민 K** | 뼈 대사, 상처 치유 | 출혈, 치주 문제 | 90-120 μg |
| **마그네슘** | 에나멜 형성 | 충치 감수성 | 310-420 mg |
| **인** | 치아 광화 | 치아 약화 | 700 mg |
| **불소** | 에나멜 강화 | 충치 | 3-4 mg |
| **CoQ10** | 잇몸 조직 에너지 | 치주염 악화 | 30-200 mg |

### 1.3 영양소 생체이용률

생체이용률(Bioavailability)은 섭취한 영양소 중 실제 흡수되는 비율이다.

```
생체이용률 = (흡수량 / 섭취량) × 100%
```

**영양소별 생체이용률**:

| 영양소 | 식품 형태 | 보충제 형태 | 증가 요인 | 감소 요인 |
|--------|----------|-----------|----------|----------|
| **철분** | 비헴철 2-20% | 헴철 15-35% | 비타민 C, 유기산 | 피틴산, 탄닌, 칼슘 |
| **아연** | 15-40% | 20-30% | 단백질 | 피틴산, 철분, 칼슘 |
| **칼슘** | 25-35% | 30-40% | 비타민 D, 유당 | 옥살산, 피틴산 |
| **비타민 C** | 70-90% | 70-90% | 공복 시 | 고용량 (포화) |
| **비타민 E** | 20-60% | 20-80% | 지방과 함께 | 고용량 철분 |
| **CoQ10** | 10-15% | 유비퀴놀 2-3배↑ | 지방과 함께 | 공복 |
| **콜라겐** | 가수분해 80%+ | 미가수분해 낮음 | 비타민 C | - |
| **루테인** | 5-30% | 30-40% | 지방과 함께 | 베타카로틴 |

### 1.4 권장 섭취량 (RDA)

한국인 영양소 섭취기준 (2025년 개정):

```typescript
// 권장 섭취량 상수
const KOREAN_RDA = {
  // 성인 남성 (19-64세)
  male: {
    vitaminA: { rda: 800, unit: 'μg RAE', ul: 3000 },
    vitaminC: { rda: 100, unit: 'mg', ul: 2000 },
    vitaminD: { rda: 400, unit: 'IU', ul: 4000 },
    vitaminE: { rda: 12, unit: 'mg α-TE', ul: 540 },
    vitaminK: { rda: 75, unit: 'μg', ul: null },
    vitaminB1: { rda: 1.2, unit: 'mg', ul: null },
    vitaminB2: { rda: 1.5, unit: 'mg', ul: null },
    vitaminB3: { rda: 16, unit: 'mg NE', ul: 35 },
    vitaminB6: { rda: 1.5, unit: 'mg', ul: 100 },
    vitaminB12: { rda: 2.4, unit: 'μg', ul: null },
    folate: { rda: 400, unit: 'μg DFE', ul: 1000 },
    biotin: { rda: 30, unit: 'μg', ul: null },
    calcium: { rda: 800, unit: 'mg', ul: 2500 },
    magnesium: { rda: 350, unit: 'mg', ul: 350 },
    zinc: { rda: 10, unit: 'mg', ul: 35 },
    selenium: { rda: 60, unit: 'μg', ul: 400 },
    iron: { rda: 10, unit: 'mg', ul: 45 },
    omega3: { rda: 500, unit: 'mg EPA+DHA', ul: 3000 },
  },
  // 성인 여성 (19-64세)
  female: {
    vitaminA: { rda: 650, unit: 'μg RAE', ul: 3000 },
    vitaminC: { rda: 100, unit: 'mg', ul: 2000 },
    vitaminD: { rda: 400, unit: 'IU', ul: 4000 },
    vitaminE: { rda: 12, unit: 'mg α-TE', ul: 540 },
    vitaminK: { rda: 65, unit: 'μg', ul: null },
    vitaminB1: { rda: 1.1, unit: 'mg', ul: null },
    vitaminB2: { rda: 1.2, unit: 'mg', ul: null },
    vitaminB3: { rda: 14, unit: 'mg NE', ul: 35 },
    vitaminB6: { rda: 1.4, unit: 'mg', ul: 100 },
    vitaminB12: { rda: 2.4, unit: 'μg', ul: null },
    folate: { rda: 400, unit: 'μg DFE', ul: 1000 },
    biotin: { rda: 30, unit: 'μg', ul: null },
    calcium: { rda: 800, unit: 'mg', ul: 2500 },
    magnesium: { rda: 280, unit: 'mg', ul: 350 },
    zinc: { rda: 8, unit: 'mg', ul: 35 },
    selenium: { rda: 55, unit: 'μg', ul: 400 },
    iron: { rda: 14, unit: 'mg', ul: 45 },
    omega3: { rda: 500, unit: 'mg EPA+DHA', ul: 3000 },
  },
} as const;

// 상한 섭취량 추출
const UPPER_LIMITS: Record<string, number | null> = Object.fromEntries(
  Object.entries(KOREAN_RDA.male).map(([k, v]) => [k, v.ul])
);
```

---

## 2. 수학적/물리학적 기반

### 2.1 영양소 균형 지수

```
Balance Score = 1 - (Σ|actual_i - optimal_i| / optimal_i) / n

단, 상한 초과 시 추가 페널티:
if (actual_i > UL_i) {
  penalty += (actual_i - UL_i) / UL_i * 2
}
```

- `actual_i`: 실제 섭취량
- `optimal_i`: 권장 섭취량 (RDA)
- `UL_i`: 상한 섭취량
- `n`: 평가 영양소 개수
- 결과: 0 (완전 불균형) ~ 1 (완벽 균형)

### 2.2 시너지/길항 매트릭스

영양소 간 상호작용 매트릭스 (학술 근거 기반):

```typescript
// 시너지/길항 계수
// > 1.0: 시너지 (흡수 증가)
// = 1.0: 독립 (영향 없음)
// < 1.0: 길항 (흡수 감소)
const NUTRIENT_INTERACTION_MATRIX: Record<string, Record<string, number>> = {
  vitaminA: {
    vitaminC: 1.0,   // 독립
    vitaminE: 1.15,  // 지용성 비타민 시너지
    zinc: 1.2,       // 비타민 A 수송 단백질 합성
    iron: 0.9,       // 경미한 경쟁
  },
  vitaminC: {
    vitaminE: 1.3,   // 비타민 E 재생 (Packer et al., 1979)
    iron: 1.5,       // 비헴철 흡수 2-3배 증가 (Hallberg et al., 1989)
    calcium: 0.95,   // 경미한 경쟁
    collagen: 1.4,   // 콜라겐 합성 필수 (Peterkofsky, 1991)
  },
  vitaminD: {
    calcium: 1.5,    // 칼슘 흡수 30-40% 증가 (Heaney et al., 2003)
    magnesium: 1.2,  // 마그네슘 활성화 필요
    vitaminK: 1.3,   // 칼슘 대사 시너지
  },
  vitaminE: {
    vitaminC: 1.3,   // 항산화 재활용
    selenium: 1.25,  // 글루타치온 퍼옥시다제 시너지
    omega3: 1.2,     // 지질 과산화 방지
  },
  calcium: {
    vitaminD: 1.5,   // 흡수 증가
    iron: 0.6,       // 강한 경쟁 (Hallberg et al., 1991)
    zinc: 0.7,       // 경쟁적 억제
    magnesium: 0.85, // 고용량 시 경쟁
  },
  zinc: {
    vitaminA: 1.2,   // 수송 단백질 시너지
    iron: 0.6,       // 강한 경쟁 (Sandström, 1997)
    copper: 0.5,     // 구리 흡수 억제
    calcium: 0.7,    // 경쟁
  },
  iron: {
    vitaminC: 1.5,   // 흡수 증가
    calcium: 0.6,    // 경쟁
    zinc: 0.6,       // 경쟁
    tea: 0.4,        // 탄닌 억제 (Disler et al., 1975)
  },
  omega3: {
    vitaminE: 1.2,   // 산화 방지
    vitaminD: 1.1,   // 지용성 흡수
  },
  collagen: {
    vitaminC: 1.4,   // 히드록시화 필수
    hyaluronicAcid: 1.2, // 피부 수분 시너지
  },
};

// 시너지/길항 적용 함수
function applyInteractionFactor(
  nutrient1: string,
  nutrient2: string,
  baseAbsorption: number
): number {
  const factor = NUTRIENT_INTERACTION_MATRIX[nutrient1]?.[nutrient2] ?? 1.0;
  return baseAbsorption * factor;
}
```

### 2.3 영양소 점수 계산

```typescript
interface NutrientIntake {
  [nutrient: string]: number;
}

interface NutrientScoreResult {
  overallScore: number;        // 0-100
  nutrientScores: Record<string, number>;
  deficiencies: string[];
  excesses: string[];
  recommendations: string[];
}

function calculateNutrientScore(
  intake: NutrientIntake,
  gender: 'male' | 'female'
): NutrientScoreResult {
  const rda = KOREAN_RDA[gender];
  const nutrients = Object.keys(intake);
  const deficiencies: string[] = [];
  const excesses: string[] = [];
  const nutrientScores: Record<string, number> = {};

  let totalScore = 0;
  let validCount = 0;

  for (const nutrient of nutrients) {
    const rdaInfo = rda[nutrient as keyof typeof rda];
    if (!rdaInfo) continue;

    const { rda: recommended, ul } = rdaInfo;
    const actual = intake[nutrient];
    const ratio = actual / recommended;

    let score: number;

    if (ratio < 0.7) {
      // 결핍 (70% 미만)
      deficiencies.push(nutrient);
      score = ratio * 100 / 0.7 * 0.5; // 최대 50점
    } else if (ratio >= 0.7 && ratio <= 1.3) {
      // 적정 범위 (70-130%)
      score = 100 - Math.abs(1 - ratio) * 30;
    } else if (ratio > 1.3 && (!ul || actual <= ul)) {
      // 과잉이지만 상한 이내
      score = 100 - (ratio - 1.3) * 20;
    } else if (ul && actual > ul) {
      // 상한 초과 (위험)
      excesses.push(nutrient);
      const excessRatio = actual / ul;
      score = Math.max(0, 50 - (excessRatio - 1) * 50);
    } else {
      score = 70;
    }

    nutrientScores[nutrient] = Math.round(Math.max(0, Math.min(100, score)));
    totalScore += nutrientScores[nutrient];
    validCount++;
  }

  const overallScore = validCount > 0 ? Math.round(totalScore / validCount) : 0;

  return {
    overallScore,
    nutrientScores,
    deficiencies,
    excesses,
    recommendations: generateRecommendations(deficiencies, excesses),
  };
}

function generateRecommendations(
  deficiencies: string[],
  excesses: string[]
): string[] {
  const recs: string[] = [];

  for (const d of deficiencies) {
    const sources = NUTRIENT_FOOD_SOURCES[d];
    if (sources) {
      recs.push(`${d} 부족: ${sources.slice(0, 3).join(', ')} 섭취 권장`);
    }
  }

  for (const e of excesses) {
    recs.push(`${e} 과잉: 보충제 복용량 조절 필요`);
  }

  return recs;
}
```

---

## 3. 식품 데이터베이스 구조

### 3.1 식품 스키마

```typescript
interface FoodItem {
  id: string;
  nameKo: string;
  nameEn: string;
  category: FoodCategory;
  servingSize: number;        // g
  nutrients: NutrientContent;
  bioavailability: BioavailabilityFactors;
  tags: string[];             // ['high-protein', 'low-sugar', 'vegan']
}

type FoodCategory =
  | 'vegetables'    // 채소
  | 'fruits'        // 과일
  | 'grains'        // 곡류
  | 'protein'       // 단백질 (육류, 생선, 콩류)
  | 'dairy'         // 유제품
  | 'nuts'          // 견과류
  | 'seafood'       // 해산물
  | 'fermented';    // 발효식품

interface NutrientContent {
  // 100g 당 함량
  vitaminA?: number;          // μg RAE
  vitaminC?: number;          // mg
  vitaminD?: number;          // IU
  vitaminE?: number;          // mg α-TE
  vitaminK?: number;          // μg
  vitaminB1?: number;         // mg
  vitaminB2?: number;         // mg
  vitaminB3?: number;         // mg NE
  vitaminB6?: number;         // mg
  vitaminB12?: number;        // μg
  folate?: number;            // μg DFE
  biotin?: number;            // μg
  calcium?: number;           // mg
  magnesium?: number;         // mg
  zinc?: number;              // mg
  selenium?: number;          // μg
  iron?: number;              // mg
  omega3?: number;            // mg EPA+DHA
  protein?: number;           // g
  fiber?: number;             // g
}

interface BioavailabilityFactors {
  ironType?: 'heme' | 'non-heme';
  calciumInhibitors?: boolean;  // 옥살산, 피틴산 함유
  fatRequired?: boolean;        // 지용성 영양소
}
```

### 3.2 영양소별 고함량 식품

```typescript
const NUTRIENT_FOOD_SOURCES: Record<string, string[]> = {
  // 피부 건강
  vitaminA: ['당근', '고구마', '시금치', '케일', '달걀노른자', '간'],
  vitaminC: ['파프리카', '브로콜리', '키위', '딸기', '오렌지', '감귤'],
  vitaminE: ['아몬드', '해바라기씨', '아보카도', '시금치', '올리브오일'],
  zinc: ['굴', '소고기', '호박씨', '병아리콩', '캐슈넛'],
  selenium: ['브라질너트', '참치', '정어리', '달걀', '해바라기씨'],
  omega3: ['연어', '고등어', '청어', '치아씨', '호두', '아마씨'],
  collagen: ['닭발', '돼지껍데기', '사골', '생선껍질', '젤라틴'],
  biotin: ['달걀노른자', '아몬드', '고구마', '시금치', '브로콜리'],

  // 구강 건강
  calcium: ['우유', '치즈', '요거트', '두부', '케일', '멸치'],
  vitaminD: ['연어', '고등어', '달걀노른자', '버섯(UV조사)', '강화우유'],
  vitaminK: ['케일', '시금치', '브로콜리', '배추', '청경채'],
  magnesium: ['아몬드', '시금치', '캐슈넛', '땅콩', '검은콩'],
  coq10: ['소고기심장', '돼지고기', '닭고기', '참치', '브로콜리'],

  // 복합
  vitaminB2: ['달걀', '우유', '아몬드', '버섯', '시금치'],
  vitaminB3: ['닭가슴살', '참치', '연어', '땅콩', '버섯'],
  vitaminB6: ['닭가슴살', '연어', '참치', '감자', '바나나'],
  iron: ['소고기', '간', '시금치', '렌틸콩', '두부'],
};

// 영양소별 식품 추천 함수
function getFoodRecommendations(
  nutrient: string,
  count: number = 5,
  excludeTags?: string[]
): string[] {
  const sources = NUTRIENT_FOOD_SOURCES[nutrient] ?? [];

  // 태그 필터링 (예: 'vegan' 제외)
  if (excludeTags && excludeTags.length > 0) {
    // 실제 구현에서는 식품 DB 조회
  }

  return sources.slice(0, count);
}
```

---

## 4. 구현 도출

### 4.1 원리 → 알고리즘

1. **피부/구강 상태 → 영양소 추천**
   - 피부/구강 문제 입력 (건조, 염증, 노화, 잇몸출혈 등)
   - 관련 영양소 매핑 (CONCERN_NUTRIENT_MAP)
   - 우선순위 결정 (결핍 가능성, 시너지 기반)

2. **영양소 → 식품/보충제 추천**
   - 영양소별 고함량 식품 DB 조회
   - 생체이용률 고려 (지방 함께 섭취 등)
   - 시너지 조합 제안

3. **보충제 선택 로직**
   - 식이 섭취 불충분 시 보충제 권장
   - 상한 섭취량 체크
   - 약물 상호작용 경고

### 4.2 피부/구강 문제별 영양소 매핑

```typescript
interface HealthConcern {
  type: 'skin' | 'oral';
  problem: string;
  severity: 1 | 2 | 3;
}

interface NutrientRecommendation {
  nutrient: string;
  dailyAmount: number;
  unit: string;
  sources: string[];
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

// 피부 문제별 영양소 매핑
const SKIN_CONCERN_MAP: Record<string, {
  nutrients: string[];
  rationale: string;
}> = {
  dryness: {
    nutrients: ['omega3', 'vitaminE', 'vitaminA', 'hyaluronicAcid'],
    rationale: '지질 장벽 강화 및 수분 유지',
  },
  inflammation: {
    nutrients: ['omega3', 'vitaminC', 'zinc', 'vitaminD'],
    rationale: '항염증 및 면역 조절',
  },
  aging: {
    nutrients: ['vitaminC', 'vitaminE', 'selenium', 'collagen', 'coq10'],
    rationale: '항산화 및 콜라겐 합성 촉진',
  },
  acne: {
    nutrients: ['zinc', 'vitaminA', 'vitaminB6', 'omega3'],
    rationale: '피지 조절 및 항균 효과',
  },
  hyperpigmentation: {
    nutrients: ['vitaminC', 'vitaminE', 'niacinamide'],
    rationale: '멜라닌 합성 억제 및 항산화',
  },
  sensitivity: {
    nutrients: ['omega3', 'vitaminD', 'vitaminE', 'zinc'],
    rationale: '장벽 기능 강화 및 염증 완화',
  },
};

// 구강 문제별 영양소 매핑
const ORAL_CONCERN_MAP: Record<string, {
  nutrients: string[];
  rationale: string;
}> = {
  bleeding_gums: {
    nutrients: ['vitaminC', 'vitaminK', 'coq10'],
    rationale: '콜라겐 합성 및 혈액 응고',
  },
  periodontitis: {
    nutrients: ['vitaminD', 'calcium', 'omega3', 'coq10'],
    rationale: '뼈 건강 및 항염증',
  },
  cavity_prone: {
    nutrients: ['calcium', 'vitaminD', 'fluoride', 'phosphorus'],
    rationale: '치아 재광화 및 에나멜 강화',
  },
  dry_mouth: {
    nutrients: ['omega3', 'vitaminA', 'vitaminB2'],
    rationale: '점막 건강 및 타액 분비',
  },
  sensitivity: {
    nutrients: ['calcium', 'vitaminD', 'potassium'],
    rationale: '상아질 보호 및 신경 안정',
  },
};

// 영양소 추천 함수
function recommendNutrients(
  concerns: HealthConcern[],
  gender: 'male' | 'female'
): NutrientRecommendation[] {
  const rda = KOREAN_RDA[gender];
  const nutrientPriority: Record<string, number> = {};
  const nutrientRationales: Record<string, string[]> = {};

  // 문제별 영양소 수집 및 우선순위 계산
  for (const concern of concerns) {
    const map = concern.type === 'skin' ? SKIN_CONCERN_MAP : ORAL_CONCERN_MAP;
    const mapping = map[concern.problem];

    if (mapping) {
      for (let i = 0; i < mapping.nutrients.length; i++) {
        const nutrient = mapping.nutrients[i];
        // 순서 기반 가중치 (첫 번째 = 더 중요)
        const weight = (mapping.nutrients.length - i) * concern.severity;
        nutrientPriority[nutrient] = (nutrientPriority[nutrient] || 0) + weight;

        if (!nutrientRationales[nutrient]) {
          nutrientRationales[nutrient] = [];
        }
        nutrientRationales[nutrient].push(mapping.rationale);
      }
    }
  }

  // 우선순위 정렬
  const sortedNutrients = Object.entries(nutrientPriority)
    .sort((a, b) => b[1] - a[1])
    .map(([nutrient]) => nutrient);

  // 추천 생성
  const recommendations: NutrientRecommendation[] = [];

  for (const nutrient of sortedNutrients.slice(0, 8)) {
    const rdaInfo = rda[nutrient as keyof typeof rda];
    const priority = nutrientPriority[nutrient];

    recommendations.push({
      nutrient,
      dailyAmount: rdaInfo?.rda ?? 0,
      unit: rdaInfo?.unit ?? '',
      sources: NUTRIENT_FOOD_SOURCES[nutrient]?.slice(0, 5) ?? [],
      priority: priority >= 6 ? 'high' : priority >= 3 ? 'medium' : 'low',
      rationale: [...new Set(nutrientRationales[nutrient])].join('; '),
    });
  }

  return recommendations;
}
```

### 4.3 보충제 추천 로직

```typescript
interface SupplementRecommendation {
  name: string;
  dosage: string;
  timing: string;
  warnings: string[];
  interactions: string[];
}

// 보충제 형태별 생체이용률
const SUPPLEMENT_FORMS: Record<string, { form: string; bioavailability: string }[]> = {
  zinc: [
    { form: 'zinc picolinate', bioavailability: '높음' },
    { form: 'zinc citrate', bioavailability: '중간' },
    { form: 'zinc oxide', bioavailability: '낮음' },
  ],
  iron: [
    { form: 'ferrous bisglycinate', bioavailability: '높음, 위장장애 적음' },
    { form: 'ferrous sulfate', bioavailability: '높음, 위장장애 있음' },
    { form: 'ferric forms', bioavailability: '낮음' },
  ],
  magnesium: [
    { form: 'magnesium glycinate', bioavailability: '높음, 진정 효과' },
    { form: 'magnesium citrate', bioavailability: '높음' },
    { form: 'magnesium oxide', bioavailability: '낮음' },
  ],
  calcium: [
    { form: 'calcium citrate', bioavailability: '높음, 공복 가능' },
    { form: 'calcium carbonate', bioavailability: '중간, 식사와 함께' },
  ],
  coq10: [
    { form: 'ubiquinol', bioavailability: '높음 (활성형)' },
    { form: 'ubiquinone', bioavailability: '중간 (비활성형)' },
  ],
  collagen: [
    { form: 'hydrolyzed peptides', bioavailability: '높음 (가수분해)' },
    { form: 'undenatured type II', bioavailability: '관절 특화' },
  ],
};

// 약물-영양소 상호작용
const DRUG_NUTRIENT_INTERACTIONS: Record<string, string[]> = {
  warfarin: ['vitaminK', 'vitaminE', 'omega3'],    // 항응고제
  metformin: ['vitaminB12', 'folate'],             // 당뇨약
  ppi: ['vitaminB12', 'calcium', 'magnesium'],     // 위산억제제
  statin: ['coq10'],                               // 고지혈증약
  thyroid: ['calcium', 'iron'],                    // 갑상선약
  antibiotics: ['calcium', 'magnesium', 'iron'],   // 항생제
};

function recommendSupplement(
  nutrient: string,
  currentMedications: string[]
): SupplementRecommendation {
  const forms = SUPPLEMENT_FORMS[nutrient];
  const rdaInfo = KOREAN_RDA.male[nutrient as keyof typeof KOREAN_RDA.male];

  const warnings: string[] = [];
  const interactions: string[] = [];

  // 약물 상호작용 체크
  for (const med of currentMedications) {
    const interacting = DRUG_NUTRIENT_INTERACTIONS[med];
    if (interacting?.includes(nutrient)) {
      interactions.push(`${med}와 상호작용 가능 - 의사 상담 필요`);
    }
  }

  // 상한 섭취량 경고
  if (rdaInfo?.ul) {
    warnings.push(`1일 상한: ${rdaInfo.ul}${rdaInfo.unit}`);
  }

  return {
    name: `${nutrient} (${forms?.[0]?.form ?? '일반형'})`,
    dosage: `${rdaInfo?.rda ?? '권장량 확인 필요'} ${rdaInfo?.unit ?? ''}`,
    timing: getSupplementTiming(nutrient),
    warnings,
    interactions,
  };
}

function getSupplementTiming(nutrient: string): string {
  const timingGuide: Record<string, string> = {
    iron: '공복에 복용 (비타민 C와 함께)',
    calcium: '식사 중 복용, 1회 500mg 이하로 나눠 섭취',
    magnesium: '저녁 식사 후 또는 취침 전',
    vitaminD: '지방이 포함된 식사와 함께',
    vitaminE: '지방이 포함된 식사와 함께',
    coq10: '지방이 포함된 식사와 함께',
    omega3: '식사 중 복용',
    zinc: '식사 중 복용 (공복 시 메스꺼움)',
    vitaminC: '아무 때나 (고용량은 나눠 섭취)',
    collagen: '공복 또는 취침 전',
  };

  return timingGuide[nutrient] ?? '식사와 함께 복용';
}
```

---

## 5. 검증 방법

### 5.1 원리 준수 검증

| 검증 항목 | 기준 | 방법 |
|----------|------|------|
| 권장량 정확성 | 한국인 영양소 섭취기준 2025 | 공식 문서 대조 |
| 시너지/길항 계수 | 학술 논문 근거 | 참고문헌 DOI 확인 |
| 결핍 증상 | 의학 교과서 | 전문가 검토 |
| 식품 영양 함량 | 국가표준식품성분표 | DB 대조 |
| 생체이용률 | Peer-reviewed 논문 | 출처 확인 |

### 5.2 알고리즘 테스트

```typescript
describe('NutrientRecommendation', () => {
  it('should recommend zinc for acne concerns', () => {
    const result = recommendNutrients([
      { type: 'skin', problem: 'acne', severity: 2 }
    ], 'female');

    expect(result.some(r => r.nutrient === 'zinc')).toBe(true);
  });

  it('should recommend calcium and vitamin D for cavity-prone oral health', () => {
    const result = recommendNutrients([
      { type: 'oral', problem: 'cavity_prone', severity: 2 }
    ], 'male');

    const nutrients = result.map(r => r.nutrient);
    expect(nutrients).toContain('calcium');
    expect(nutrients).toContain('vitaminD');
  });

  it('should not exceed upper intake levels', () => {
    const result = recommendNutrients([
      { type: 'skin', problem: 'dryness', severity: 3 },
      { type: 'skin', problem: 'aging', severity: 3 }
    ], 'female');

    for (const rec of result) {
      const ul = UPPER_LIMITS[rec.nutrient];
      if (ul !== null) {
        expect(rec.dailyAmount).toBeLessThanOrEqual(ul);
      }
    }
  });

  it('should prioritize nutrients by concern severity and frequency', () => {
    const result = recommendNutrients([
      { type: 'skin', problem: 'dryness', severity: 3 },  // omega3, vitE
      { type: 'skin', problem: 'aging', severity: 2 },    // vitC, vitE
    ], 'female');

    // vitE appears in both, should be high priority
    const vitEIndex = result.findIndex(r => r.nutrient === 'vitaminE');
    expect(vitEIndex).toBeLessThan(3);  // Top 3
  });

  it('should calculate nutrient score correctly', () => {
    const intake = {
      vitaminC: 100,  // 100% RDA
      zinc: 4,        // 50% RDA for female
      calcium: 1200,  // 150% RDA
    };

    const result = calculateNutrientScore(intake, 'female');

    expect(result.nutrientScores.vitaminC).toBeGreaterThan(90);
    expect(result.deficiencies).toContain('zinc');
    expect(result.nutrientScores.calcium).toBeLessThan(100); // Slight excess
  });

  it('should flag nutrients exceeding upper limit', () => {
    const intake = {
      vitaminA: 4000,  // UL is 3000 μg RAE
    };

    const result = calculateNutrientScore(intake, 'female');

    expect(result.excesses).toContain('vitaminA');
    expect(result.nutrientScores.vitaminA).toBeLessThan(50);
  });

  it('should apply synergy factors correctly', () => {
    const baseAbsorption = 10; // 10%
    const withVitC = applyInteractionFactor('iron', 'vitaminC', baseAbsorption);

    expect(withVitC).toBe(15); // 1.5x
  });
});
```

### 5.3 원리 준수 체크리스트

```markdown
영양 분석 기능 구현 시 확인:

□ RDA 값이 한국인 영양소 섭취기준과 일치하는가?
□ 상한 섭취량(UL)이 모든 관련 영양소에 정의되었는가?
□ 시너지/길항 계수의 학술적 근거가 있는가?
□ 식품 영양 함량이 국가표준식품성분표와 일치하는가?
□ 생체이용률이 권장 형태에 적용되었는가?
□ 약물-영양소 상호작용 경고가 포함되었는가?
□ 의료 면책 조항이 표시되는가?
```

---

## 6. 주의사항 및 면책

### 6.1 의료 행위 경계

> ⚠️ **필수 고지: 일반 정보 제공 목적**
>
> 이 시스템에서 제공하는 모든 영양 정보는 **일반적인 교육 및 참고 목적**으로만 제공됩니다.
> **의료 조언, 진단, 치료 권고가 아닙니다.**

#### 명시적 제한사항

| 제한 | 설명 |
|------|------|
| **개인차** | 동일 영양소도 개인의 유전, 장내 미생물, 건강 상태에 따라 흡수율과 효과가 크게 다름 |
| **자가 진단 금지** | 피로, 탈모, 피부 문제를 영양 결핍으로 단정하지 말 것 |
| **권장량 한계** | 본 시스템의 권장량은 일반인 기준이며, 질환자/임산부/노인에게 적용 불가 |
| **상호작용** | 약물-영양소, 영양소-영양소 상호작용은 전문가 상담 필수 |
| **알레르기** | 특정 성분 알레르기/과민 반응 확인은 사용자 책임 |

#### 의료 상담 필수 대상

다음에 해당하는 경우 **보충제 복용 전 반드시 의사/약사 상담**이 필요합니다:

| 대상 | 이유 |
|------|------|
| **임산부/수유부** | 태아/영아에 대한 영향, 권장량 상이 |
| **만성 질환자** | 당뇨, 신장병, 간질환 등은 특정 영양소 제한 필요 |
| **약물 복용자** | 항응고제, 갑상선약 등과 상호작용 위험 |
| **수술 예정자** | 일부 보충제는 출혈 위험 증가 (수술 2주 전 중단 필요) |
| **65세 이상** | 흡수율 변화, 복합 약물 사용, 신장 기능 고려 |
| **18세 미만** | 성장기 특수 요구량, 성인 권장량 부적합 |
| **알레르기/민감 체질** | 첨가물, 원료 알레르기 확인 필요 |

#### 이 시스템이 하는 것 / 하지 않는 것

| 하는 것 (Information) | 하지 않는 것 (NOT Medical Advice) |
|----------------------|----------------------------------|
| 일반적인 영양 정보 제공 | 개인 맞춤 의료 처방 |
| 영양소별 기능 설명 | 질병 진단 또는 치료 권고 |
| 식품/보충제 일반 정보 | 복용량/복용 기간 처방 |
| 상호작용 일반 경고 | 약물 복용 지침 변경 |
| 과학적 근거 참고 제공 | 의료 전문가 대체 |

```
📋 이상 증상 발생 시 즉시 복용 중단하고 의료 전문가와 상담하세요.
   - 발진, 가려움, 부종 (알레르기 반응)
   - 소화 장애, 구토, 설사
   - 두통, 현기증, 심계항진
   - 출혈 경향 증가
```

### 6.2 표시 규정

식품의약품안전처 건강기능식품 표시 규정 준수:
- 질병 치료 효능 표시 금지
- "도움을 줄 수 있음" 형태 표현
- 과학적 근거 명시
- "균형 잡힌 식사를 대체할 수 없음" 문구

---

## 7. 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서 | 관계 |
|------|------|
| [SDD-N1-NUTRITION.md](../specs/SDD-N1-NUTRITION.md) | 영양 모듈 구현 스펙, P3 원자 분해 |
| [ADR-030-nutrition-module.md](../adr/ADR-030-nutrition-module.md) | 영양 모듈 아키텍처 결정 |

### 관련 원리 문서

| 문서 | 관계 |
|------|------|
| [skin-physiology.md](./skin-physiology.md) | 피부 구조, 영양소 작용점 |
| [oral-health.md](./oral-health.md) | 구강 건강, VITA 셰이드 |
| [cross-domain-synergy.md](./cross-domain-synergy.md) | 영양-피부-구강 시너지 |
| [legal-compliance.md](./legal-compliance.md) | 건강기능식품 광고 규제 |

---

## 8. 참고 자료

### 학술 논문

1. Schagen, S.K. et al. (2012). "Discovering the link between nutrition and skin aging". Dermato-Endocrinology 4(3):298-307.
2. Pullar, J.M. et al. (2017). "The Roles of Vitamin C in Skin Health". Nutrients 9(8):866.
3. Hallberg, L. et al. (1989). "The role of vitamin C in iron absorption". Int J Vitam Nutr Res Suppl 30:103-8.
4. Sandström, B. (1997). "Bioavailability of zinc". Eur J Clin Nutr 51 Suppl 1:S17-9.
5. Heaney, R.P. et al. (2003). "Calcium absorption varies within the reference range for serum 25-hydroxyvitamin D". J Am Coll Nutr 22(2):142-6.

### 공식 문서

- 한국영양학회. (2025). 한국인 영양소 섭취기준
- 식품의약품안전처. (2024). 건강기능식품 기능성 원료 및 기준·규격 인정에 관한 규정
- 보건복지부. (2020). 국민건강영양조사 영양 데이터

### 데이터베이스

- USDA FoodData Central: https://fdc.nal.usda.gov/
- 농촌진흥청 국가표준식품성분표: https://koreanfood.rda.go.kr/

---

---

## 9. 개인화된 RDA 조정 (Personalized RDA Adjustments)

> **소스 리서치**: 2020 한국인 영양소 섭취기준 (KDRIs), NIH Office of Dietary Supplements, 대한골대사학회, 대한당뇨병학회

### 9.1 연령대별 조정 계수

생애주기에 따라 영양소 필요량이 달라지며, 기준 성인(19-29세) 대비 조정 계수를 적용한다.

```typescript
/**
 * 연령대별 RDA 조정 계수
 *
 * 계수 의미:
 * - 1.0 = 기준 (성인 19-29세와 동일)
 * - 0.8 = 80% (감소)
 * - 1.2 = 120% (증가)
 *
 * 과학적 근거:
 * - 청소년: 골격 성장의 45%가 이 시기에 집중 (칼슘 1,300mg/일 권장)
 * - 장년: 폐경 후 에스트로겐 감소로 칼슘 흡수 30% 저하
 * - 노년: 위산 분비 감소로 B12 흡수 10-30% 저하
 */
interface AgeAdjustment {
  ageGroup: '10-17' | '18-29' | '30-49' | '50-64' | '65+';
  description: string;
  adjustments: Record<string, number>;
  rationale: string[];
}

const AGE_ADJUSTMENT_FACTORS: AgeAdjustment[] = [
  {
    ageGroup: '10-17',
    description: '청소년 (성장기)',
    adjustments: {
      // 에너지 및 단백질
      energy: 1.1,           // 성장으로 인한 에너지 요구량 증가
      protein: 1.15,         // 근육/조직 성장

      // 골격 성장 필수
      calcium: 1.44,         // 800 → 1,150mg (남), 1,100mg (여) - KDRIs 2020
      vitaminD: 1.0,         // 400 IU 유지
      phosphorus: 1.43,      // 700 → 1,000mg

      // 성장기 특화
      iron: 1.2,             // 남: 혈액량 증가, 여: 월경 시작
      zinc: 1.1,             // 성장 및 면역
      vitaminA: 1.0,         // 유지
      vitaminC: 1.0,         // 유지

      // 에너지 대사
      vitaminB1: 1.1,        // 탄수화물 대사 증가
      vitaminB2: 1.1,        // 에너지 대사
      vitaminB3: 1.1,        // 에너지 대사
    },
    rationale: [
      '생애주기 중 총 골격 성장의 45%가 청소년기에 이루어짐',
      '2차 성징 발현으로 호르몬 변화 및 체성분 변화',
      '인지 발달을 위한 철분, 아연 필수',
      '여자 청소년: 월경 시작으로 철분 손실 증가',
    ],
  },
  {
    ageGroup: '18-29',
    description: '청년 (기준)',
    adjustments: {
      // 모든 영양소 1.0 (기준)
      energy: 1.0,
      protein: 1.0,
      calcium: 1.0,
      vitaminD: 1.0,
      iron: 1.0,
      zinc: 1.0,
      vitaminA: 1.0,
      vitaminC: 1.0,
      vitaminB12: 1.0,
      magnesium: 1.0,
      omega3: 1.0,
    },
    rationale: [
      '성장 완료, 기초대사량 최고점',
      '골밀도 최대치 달성 시기 (peak bone mass)',
      'KOREAN_RDA 기준 연령대',
    ],
  },
  {
    ageGroup: '30-49',
    description: '중년',
    adjustments: {
      energy: 0.95,          // 기초대사량 점진적 감소
      protein: 1.0,          // 유지
      calcium: 1.0,          // 유지
      vitaminD: 1.0,         // 유지 (400 IU)
      iron: 1.0,             // 여성: 폐경 전까지 유지
      zinc: 1.0,             // 유지
      vitaminA: 1.0,         // 유지
      vitaminC: 1.0,         // 유지
      vitaminB12: 1.0,       // 유지
      magnesium: 1.0,        // 유지
      omega3: 1.1,           // 심혈관 보호 강화
    },
    rationale: [
      '30세 이후 매년 기초대사량 1-2% 감소',
      '35세부터 골량이 서서히 감소 시작',
      '심혈관 질환 위험 증가로 오메가-3 강조',
    ],
  },
  {
    ageGroup: '50-64',
    description: '장년',
    adjustments: {
      energy: 0.9,           // 대사량 감소
      protein: 1.1,          // 근감소증 예방
      calcium: 1.25,         // 800 → 1,000mg (남), 폐경 여성 1,200mg
      vitaminD: 1.5,         // 400 → 600 IU
      iron: 0.7,             // 여성: 폐경 후 필요량 감소 (14 → 10mg)
      zinc: 1.0,             // 유지
      vitaminA: 1.0,         // 유지
      vitaminC: 1.0,         // 유지
      vitaminB12: 1.2,       // 흡수율 저하 대비
      vitaminB6: 1.15,       // 1.5 → 1.7mg
      magnesium: 1.05,       // 당뇨 예방, 골건강
      omega3: 1.2,           // 심혈관 보호
    },
    rationale: [
      '폐경 후 에스트로겐 감소로 칼슘 흡수 30% 저하',
      '위산 분비 감소로 B12 흡수 저하 시작',
      '근감소증 예방을 위한 단백질 강화',
      '폐경 여성: 철분 필요량 남성 수준으로 감소',
    ],
  },
  {
    ageGroup: '65+',
    description: '노년',
    adjustments: {
      energy: 0.85,          // 대사량 현저히 감소
      protein: 1.2,          // 1.0-1.2 g/kg 권장 (근감소증 예방)
      calcium: 1.5,          // 800 → 1,200mg (대한골대사학회)
      vitaminD: 2.0,         // 400 → 800 IU (대한골대사학회)
      iron: 0.7,             // 필요량 감소 (여성 10mg, 남성 9mg)
      zinc: 1.0,             // 유지 (면역 기능)
      vitaminA: 1.0,         // 유지
      vitaminC: 1.0,         // 유지
      vitaminB12: 1.5,       // 흡수율 저하 보정 (강화식품 또는 보충제 권장)
      vitaminB6: 1.3,        // 1.5 → 2.0mg
      folate: 1.0,           // 유지
      magnesium: 1.1,        // 심혈관, 골건강
      omega3: 1.2,           // 인지 기능, 심혈관
      potassium: 1.0,        // 혈압 조절 (신장 기능 고려)
    },
    rationale: [
      '65세 이상 30%에서 비타민 D 결핍 (NIH)',
      '10-30%에서 식품 결합 B12 흡수 장애',
      '위장관 흡수 효율 전반적 저하',
      '근감소증 및 골다공증 위험 증가',
      '신장 기능 저하로 칼륨/인 대사 변화 가능',
    ],
  },
];

// 연령대별 조정 계수 적용 함수
function getAgeAdjustedRDA(
  gender: 'male' | 'female',
  age: number,
  nutrient: string
): { rda: number; unit: string; adjustment: number; rationale: string } {
  const baseRDA = KOREAN_RDA[gender][nutrient as keyof typeof KOREAN_RDA['male']];
  if (!baseRDA) {
    throw new Error(`Unknown nutrient: ${nutrient}`);
  }

  const ageGroup = getAgeGroup(age);
  const adjustmentData = AGE_ADJUSTMENT_FACTORS.find(a => a.ageGroup === ageGroup);
  const adjustment = adjustmentData?.adjustments[nutrient] ?? 1.0;

  const adjustedRDA = Math.round(baseRDA.rda * adjustment);

  return {
    rda: adjustedRDA,
    unit: baseRDA.unit,
    adjustment,
    rationale: adjustmentData?.rationale.join('; ') ?? '',
  };
}

function getAgeGroup(age: number): AgeAdjustment['ageGroup'] {
  if (age >= 10 && age <= 17) return '10-17';
  if (age >= 18 && age <= 29) return '18-29';
  if (age >= 30 && age <= 49) return '30-49';
  if (age >= 50 && age <= 64) return '50-64';
  return '65+';
}
```

### 9.2 건강 상태별 조정 가이드라인

> ⚠️ **필수 고지**: 아래 조정 가이드라인은 **일반적인 참고 정보**입니다.
> 질환이 있는 경우 **반드시 담당 의료진과 상담** 후 적용해야 합니다.

```typescript
/**
 * 건강 상태별 영양소 조정
 *
 * 구조:
 * - increase: 증가 권장 영양소
 * - decrease: 감소/제한 권장 영양소
 * - caution: 주의 사항
 * - sources: 참고 문헌/가이드라인
 */
interface HealthConditionAdjustment {
  condition: string;
  conditionKo: string;
  increase: {
    nutrient: string;
    factor: number;       // 1.5 = 150%
    targetAmount?: string; // 명시적 목표량
    rationale: string;
  }[];
  decrease: {
    nutrient: string;
    factor: number;       // 0.5 = 50%
    maxAmount?: string;   // 명시적 상한
    rationale: string;
  }[];
  caution: string[];
  sources: string[];
  medicalConsultRequired: boolean;
}

const HEALTH_CONDITION_ADJUSTMENTS: HealthConditionAdjustment[] = [
  // ===== 제2형 당뇨병 =====
  {
    condition: 'type2_diabetes',
    conditionKo: '제2형 당뇨병',
    increase: [
      {
        nutrient: 'magnesium',
        factor: 1.3,
        targetAmount: '400-450mg/일',
        rationale: '인슐린 감수성 개선, 당뇨 환자 소변 배출 증가 보정',
      },
      {
        nutrient: 'chromium',
        factor: 1.5,
        targetAmount: '200-400μg/일',
        rationale: '포도당 내성 인자(GTF) 구성 성분, 혈당 조절 보조',
      },
      {
        nutrient: 'fiber',
        factor: 1.2,
        targetAmount: '25-30g/일',
        rationale: '혈당 상승 완화, 장내 미생물 개선',
      },
      {
        nutrient: 'vitaminD',
        factor: 1.25,
        rationale: '인슐린 분비 및 감수성과 연관',
      },
      {
        nutrient: 'omega3',
        factor: 1.2,
        rationale: '심혈관 합병증 예방, 염증 감소',
      },
    ],
    decrease: [
      {
        nutrient: 'carbohydrate',
        factor: 0.85,
        maxAmount: '총 에너지의 50-55%',
        rationale: '혈당 조절, 한국인 평균 65-70%에서 감소',
      },
      {
        nutrient: 'sugar',
        factor: 0.5,
        maxAmount: '총 에너지의 10% 미만',
        rationale: '단순당 제한, WHO 권고',
      },
    ],
    caution: [
      '약물-영양소 상호작용: 메트포르민은 비타민 B12 흡수 저하',
      '저혈당 예방을 위한 규칙적인 식사 시간',
      '신장 합병증 동반 시 단백질/칼륨 별도 조정 필요',
    ],
    sources: [
      '대한당뇨병학회 (2024). 당뇨병 진료지침',
      'ADA Standards of Care in Diabetes (2024)',
    ],
    medicalConsultRequired: true,
  },

  // ===== 고혈압 =====
  {
    condition: 'hypertension',
    conditionKo: '고혈압',
    increase: [
      {
        nutrient: 'potassium',
        factor: 1.3,
        targetAmount: '3,500-4,700mg/일',
        rationale: '나트륨 배설 촉진, 레닌 활성 억제, 혈압 1-3mmHg 감소',
      },
      {
        nutrient: 'magnesium',
        factor: 1.15,
        targetAmount: '400-420mg/일',
        rationale: '혈관 이완, 혈압 조절',
      },
      {
        nutrient: 'calcium',
        factor: 1.1,
        rationale: 'DASH 식단 구성 요소',
      },
      {
        nutrient: 'fiber',
        factor: 1.2,
        targetAmount: '25-30g/일',
        rationale: 'DASH 식단의 핵심 요소',
      },
    ],
    decrease: [
      {
        nutrient: 'sodium',
        factor: 0.5,
        maxAmount: '2,300mg/일 (이상적: 1,500mg)',
        rationale: '소금 6g 이하 섭취 시 수축기 혈압 2-8mmHg 감소',
      },
      {
        nutrient: 'saturatedFat',
        factor: 0.7,
        rationale: '심혈관 건강, DASH 식단 원칙',
      },
      {
        nutrient: 'alcohol',
        factor: 0.3,
        maxAmount: '남성 2잔/일, 여성 1잔/일 이하',
        rationale: '과음은 혈압 상승 유발',
      },
    ],
    caution: [
      'ACE 억제제 복용 시 칼륨 수치 모니터링 필요',
      '신장 기능 저하 시 칼륨 제한 필요할 수 있음',
      '김치, 장류 등 한국 전통 발효식품 섭취 조절',
    ],
    sources: [
      'DASH Eating Plan (NIH, NHLBI)',
      '대한고혈압학회 진료지침 (2022)',
      '삼성서울병원 DASH 식이요법 가이드',
    ],
    medicalConsultRequired: true,
  },

  // ===== 골다공증 =====
  {
    condition: 'osteoporosis',
    conditionKo: '골다공증',
    increase: [
      {
        nutrient: 'calcium',
        factor: 1.5,
        targetAmount: '1,000-1,200mg/일',
        rationale: '뼈 무기질 유지, 대한골대사학회 권장',
      },
      {
        nutrient: 'vitaminD',
        factor: 2.0,
        targetAmount: '800-2,000 IU/일',
        rationale: '칼슘 흡수 30-40% 증가, 비타민 D 없이 칼슘 흡수 10-15%만 가능',
      },
      {
        nutrient: 'vitaminK',
        factor: 1.3,
        targetAmount: '90-120μg/일',
        rationale: '오스테오칼신 활성화, 뼈 광화 촉진',
      },
      {
        nutrient: 'protein',
        factor: 1.15,
        rationale: '뼈 기질 형성, 근력 유지 (낙상 예방)',
      },
      {
        nutrient: 'magnesium',
        factor: 1.1,
        rationale: '비타민 D 활성화 필수, 뼈 대사',
      },
    ],
    decrease: [
      {
        nutrient: 'sodium',
        factor: 0.7,
        rationale: '과다 섭취 시 소변으로 칼슘 배출 증가',
      },
      {
        nutrient: 'caffeine',
        factor: 0.7,
        maxAmount: '300mg/일 이하',
        rationale: '과다 섭취 시 칼슘 흡수 방해',
      },
    ],
    caution: [
      '칼슘 보충제: 1회 500mg 이하로 나눠 섭취 (흡수율 최적화)',
      '칼슘 총 섭취량 2,000mg 초과 금지',
      '비스포스포네이트 복용 시 칼슘/비타민 D 함께 권장',
      '폐경 후 3-5년 골밀도 소실 가장 빠름',
    ],
    sources: [
      '대한골대사학회 골다공증 진료지침 (2024)',
      'National Osteoporosis Foundation 가이드라인',
      '연세대학교 세브란스병원 식사요법',
    ],
    medicalConsultRequired: true,
  },

  // ===== 빈혈 (철결핍성) =====
  {
    condition: 'iron_deficiency_anemia',
    conditionKo: '철결핍성 빈혈',
    increase: [
      {
        nutrient: 'iron',
        factor: 2.0,
        targetAmount: '치료: 100-200mg/일 (원소 철 기준)',
        rationale: '헤모글로빈 합성, 철 저장량 회복',
      },
      {
        nutrient: 'vitaminC',
        factor: 1.5,
        targetAmount: '150-200mg/일 (철분과 함께)',
        rationale: '비헴철 흡수 2-3배 증가',
      },
      {
        nutrient: 'vitaminB12',
        factor: 1.2,
        rationale: '적혈구 성숙, 복합 빈혈 예방',
      },
      {
        nutrient: 'folate',
        factor: 1.2,
        rationale: '적혈구 형성, DNA 합성',
      },
      {
        nutrient: 'protein',
        factor: 1.1,
        rationale: '헤모글로빈 단백질 구성',
      },
    ],
    decrease: [
      {
        nutrient: 'tea_coffee',
        factor: 0.5,
        rationale: '탄닌이 철분 흡수 60% 이상 저해 (식사 1시간 전후 피함)',
      },
      {
        nutrient: 'calcium',
        factor: 0.8,
        rationale: '철분과 경쟁적 흡수 (시간 분리 필요)',
      },
    ],
    caution: [
      '철분 보충제: 공복 복용 시 흡수 최적, 위장장애 시 식사와 함께',
      '헴철(육류) vs 비헴철(식물): 헴철 흡수율 15-35%, 비헴철 2-20%',
      '빈혈 원인 진단 필수 (출혈, 흡수장애, 만성질환 등)',
      '과잉 철분은 산화 스트레스 유발 - 의사 지시 따름',
    ],
    sources: [
      'WHO Guidelines on Iron Deficiency Anemia',
      '연세대학교 세브란스병원 빈혈 식사요법',
      'Hallberg et al. (1989). Int J Vitam Nutr Res',
    ],
    medicalConsultRequired: true,
  },

  // ===== 만성 신장질환 (CKD) =====
  {
    condition: 'chronic_kidney_disease',
    conditionKo: '만성 신장질환 (CKD)',
    increase: [
      // CKD에서는 대부분 제한이 필요하며, 증가 권장 항목은 제한적
      {
        nutrient: 'energy',
        factor: 1.0,
        targetAmount: '30-35 kcal/kg/일',
        rationale: '영양불량 예방 (단백질 제한 시 에너지 충분히)',
      },
    ],
    decrease: [
      {
        nutrient: 'protein',
        factor: 0.6,
        maxAmount: '0.6-0.8 g/kg/일 (비투석)',
        rationale: '질소 노폐물 축적 감소, 신기능 보호',
      },
      {
        nutrient: 'sodium',
        factor: 0.4,
        maxAmount: '2,000mg/일 (소금 5g)',
        rationale: '부종, 고혈압 조절',
      },
      {
        nutrient: 'potassium',
        factor: 0.5,
        maxAmount: '2,000-3,000mg/일 (3-4단계)',
        rationale: '고칼륨혈증 예방 (심장 부정맥 위험)',
      },
      {
        nutrient: 'phosphorus',
        factor: 0.5,
        maxAmount: '600-800mg/일',
        rationale: '이차성 부갑상선항진증, 뼈 손실 예방',
      },
    ],
    caution: [
      '**개인별 맞춤 필수**: CKD 단계, 투석 여부에 따라 권장량 상이',
      '투석 환자는 단백질 요구량 증가 (1.0-1.2 g/kg/일)',
      '칼륨 낮추기: 채소 2시간 물에 담그거나 삶아서 섭취',
      '백미가 현미보다 인/칼륨 낮아 CKD에 적합',
      '가공식품 무기인산 흡수율 높음 (100%) - 피함',
    ],
    sources: [
      'KDIGO 만성콩팥병-미네랄뼈질환 가이드라인 (2017)',
      '대한신장학회 영양 가이드',
      '삼성서울병원 만성신부전 영양관리',
    ],
    medicalConsultRequired: true,
  },
];

// 건강 상태별 조정 계수 적용 함수
function getHealthConditionAdjustedRDA(
  baseRDA: number,
  nutrient: string,
  conditions: string[]
): {
  adjustedRDA: number;
  adjustments: { condition: string; factor: number; rationale: string }[];
  warnings: string[];
} {
  let adjustedRDA = baseRDA;
  const appliedAdjustments: { condition: string; factor: number; rationale: string }[] = [];
  const warnings: string[] = [];

  for (const conditionId of conditions) {
    const conditionData = HEALTH_CONDITION_ADJUSTMENTS.find(
      c => c.condition === conditionId
    );

    if (!conditionData) continue;

    // 증가 조정 확인
    const increaseAdj = conditionData.increase.find(i => i.nutrient === nutrient);
    if (increaseAdj) {
      adjustedRDA = adjustedRDA * increaseAdj.factor;
      appliedAdjustments.push({
        condition: conditionData.conditionKo,
        factor: increaseAdj.factor,
        rationale: increaseAdj.rationale,
      });
    }

    // 감소 조정 확인
    const decreaseAdj = conditionData.decrease.find(d => d.nutrient === nutrient);
    if (decreaseAdj) {
      adjustedRDA = adjustedRDA * decreaseAdj.factor;
      appliedAdjustments.push({
        condition: conditionData.conditionKo,
        factor: decreaseAdj.factor,
        rationale: decreaseAdj.rationale,
      });
      if (decreaseAdj.maxAmount) {
        warnings.push(`${conditionData.conditionKo}: ${nutrient} 상한 ${decreaseAdj.maxAmount}`);
      }
    }

    // 주의사항 추가
    warnings.push(...conditionData.caution.slice(0, 2)); // 상위 2개만
  }

  return {
    adjustedRDA: Math.round(adjustedRDA),
    adjustments: appliedAdjustments,
    warnings: [...new Set(warnings)], // 중복 제거
  };
}
```

### 9.3 연령-건강상태 복합 조정

```typescript
/**
 * 연령 + 건강 상태를 복합적으로 고려한 RDA 계산
 *
 * 적용 순서:
 * 1. 기본 RDA (성별 기준)
 * 2. 연령대별 조정 계수 적용
 * 3. 건강 상태별 조정 계수 적용 (다중 상태 시 누적)
 * 4. 상한 섭취량(UL) 초과 여부 검증
 */
interface PersonalizedRDAResult {
  nutrient: string;
  baseRDA: number;
  adjustedRDA: number;
  unit: string;
  upperLimit: number | null;
  exceededUL: boolean;
  adjustmentDetails: {
    ageAdjustment: number;
    healthAdjustments: { condition: string; factor: number }[];
    totalFactor: number;
  };
  warnings: string[];
  recommendations: string[];
}

function calculatePersonalizedRDA(
  gender: 'male' | 'female',
  age: number,
  nutrient: string,
  healthConditions: string[] = []
): PersonalizedRDAResult {
  // 1. 기본 RDA
  const baseRDAInfo = KOREAN_RDA[gender][nutrient as keyof typeof KOREAN_RDA['male']];
  if (!baseRDAInfo) {
    throw new Error(`Unknown nutrient: ${nutrient}`);
  }
  const baseRDA = baseRDAInfo.rda;
  const unit = baseRDAInfo.unit;
  const upperLimit = baseRDAInfo.ul;

  // 2. 연령 조정
  const ageGroup = getAgeGroup(age);
  const ageData = AGE_ADJUSTMENT_FACTORS.find(a => a.ageGroup === ageGroup);
  const ageAdjustment = ageData?.adjustments[nutrient] ?? 1.0;
  let adjustedRDA = baseRDA * ageAdjustment;

  // 3. 건강 상태 조정
  const healthAdjustments: { condition: string; factor: number }[] = [];

  for (const conditionId of healthConditions) {
    const conditionData = HEALTH_CONDITION_ADJUSTMENTS.find(
      c => c.condition === conditionId
    );
    if (!conditionData) continue;

    const increaseAdj = conditionData.increase.find(i => i.nutrient === nutrient);
    const decreaseAdj = conditionData.decrease.find(d => d.nutrient === nutrient);

    if (increaseAdj) {
      adjustedRDA *= increaseAdj.factor;
      healthAdjustments.push({
        condition: conditionData.conditionKo,
        factor: increaseAdj.factor,
      });
    }
    if (decreaseAdj) {
      adjustedRDA *= decreaseAdj.factor;
      healthAdjustments.push({
        condition: conditionData.conditionKo,
        factor: decreaseAdj.factor,
      });
    }
  }

  adjustedRDA = Math.round(adjustedRDA);

  // 4. UL 검증
  const exceededUL = upperLimit !== null && adjustedRDA > upperLimit;
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (exceededUL) {
    warnings.push(
      `⚠️ 조정된 권장량(${adjustedRDA}${unit})이 상한 섭취량(${upperLimit}${unit})을 초과합니다.`
    );
    adjustedRDA = upperLimit; // 상한으로 제한
    recommendations.push('의료 전문가와 상담 후 보충제 복용을 결정하세요.');
  }

  // 특수 경고 추가
  if (healthConditions.includes('chronic_kidney_disease')) {
    warnings.push('⚠️ CKD 환자: 모든 영양소 섭취량은 담당 신장내과 의사와 상담 필수');
  }

  const totalFactor = (adjustedRDA / baseRDA);

  return {
    nutrient,
    baseRDA,
    adjustedRDA,
    unit,
    upperLimit,
    exceededUL,
    adjustmentDetails: {
      ageAdjustment,
      healthAdjustments,
      totalFactor: Math.round(totalFactor * 100) / 100,
    },
    warnings,
    recommendations,
  };
}
```

### 9.4 연령대별 RDA 요약 테이블

| 영양소 | 단위 | 10-17세 | 18-29세 | 30-49세 | 50-64세 | 65+세 | 근거 |
|--------|------|---------|---------|---------|---------|-------|------|
| **칼슘** | mg | 1,000-1,150 | 800 | 800 | 1,000 | 1,200 | 골격 성장, 골다공증 예방 |
| **비타민 D** | IU | 400 | 400 | 400 | 600 | 800 | 칼슘 흡수, 골건강 |
| **철분** (여) | mg | 14-16 | 14 | 14 | 10 | 8-9 | 월경, 폐경 후 감소 |
| **비타민 B12** | μg | 2.4 | 2.4 | 2.4 | 2.9 | 3.6 | 흡수율 저하 보정 |
| **단백질** | g/kg | 1.0-1.1 | 0.9 | 0.9 | 1.0 | 1.0-1.2 | 근감소증 예방 |
| **마그네슘** | mg | 340-400 | 350-400 | 350-400 | 370-420 | 400-450 | 대사, 골건강 |
| **아연** | mg | 10-11 | 10 | 10 | 10 | 10 | 면역, 상처치유 |

### 9.5 건강 상태별 영양소 조정 요약

| 건강 상태 | 증가 권장 | 감소/제한 | 핵심 주의사항 |
|-----------|-----------|-----------|---------------|
| **제2형 당뇨** | 마그네슘, 크롬, 식이섬유 | 탄수화물(55% 이하), 단순당 | 메트포르민→B12 흡수 저하 |
| **고혈압** | 칼륨(3.5-4.7g), 마그네슘 | 나트륨(2.3g 이하), 알코올 | ACE 억제제→칼륨 모니터링 |
| **골다공증** | 칼슘(1.2g), 비타민 D(800IU), K | 나트륨, 카페인 | 칼슘 1회 500mg 이하 분복 |
| **철결핍빈혈** | 철분, 비타민 C, B12, 엽산 | 차/커피(식사 전후 피함) | 헴철 우선, 비타민 C 동시 섭취 |
| **만성신장질환** | 에너지(충분히) | 단백질, 나트륨, 칼륨, 인 | **CKD 단계별 개별화 필수** |

### 9.6 개인화 적용 주의사항

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       ⚠️ 의료 면책 조항 (Medical Disclaimer)              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  이 섹션의 모든 조정 계수와 가이드라인은 **일반적인 참고 정보**입니다.     │
│                                                                          │
│  ❌ 이것이 아닙니다:                                                     │
│     - 개인 맞춤 의료 처방                                                │
│     - 질병 진단 또는 치료 권고                                           │
│     - 의료 전문가 대체                                                   │
│                                                                          │
│  ✅ 반드시 해야 할 것:                                                   │
│     - 질환이 있는 경우 담당 의료진과 상담                                 │
│     - 보충제 복용 전 약물 상호작용 확인                                   │
│     - 정기적인 건강검진 및 혈액검사                                       │
│                                                                          │
│  특히 다음 대상은 반드시 전문가 상담 필요:                                │
│     • 만성 질환자 (당뇨, 신장질환, 심혈관질환)                            │
│     • 임산부 및 수유부                                                   │
│     • 약물 복용자                                                        │
│     • 65세 이상 노인                                                     │
│     • 18세 미만 청소년                                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.7 참고 문헌

#### 한국 공식 자료
- [보건복지부 (2020). 2020 한국인 영양소 섭취기준](https://www.mohw.go.kr/board.es?mid=a10411010100&bid=0019&tag=&act=view&list_no=362385)
- [한국영양학회 (2020). KDRIs](https://www.kns.or.kr/FileRoom/FileRoom_view.asp?idx=108&BoardID=Kdr)
- [대한당뇨병학회. 당뇨병 진료지침](https://www.diabetes.or.kr/general/dietary/dietary_06.php)
- [대한고혈압학회. DASH 식이요법](http://www.samsunghospital.com/home/healthInfo/content/contenView.do?CONT_SRC_ID=31885)
- [대한골대사학회. 골다공증 진료지침](https://www.rheum.or.kr/board/list.html?num=3025&code=info&cate=71)
- [대한신장학회. CKD 영양관리](https://ksn.or.kr/)

#### 국제 자료
- [NIH Office of Dietary Supplements](https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx)
- [NIH - Vitamins and Minerals for Older Adults](https://www.nia.nih.gov/health/vitamins-and-supplements/vitamins-and-minerals-older-adults)
- [NCBI Dietary Reference Intakes](https://www.ncbi.nlm.nih.gov/books/NBK109829/)
- [KDIGO CKD-MBD Guideline Update (2017)](https://kdigo.org/wp-content/uploads/2017/02/2017-KDIGO-CKD-MBD-Update_Summary_Korean.pdf)
- [American Heart Association - Nutrition for Older Adults](https://www.heart.org/en/news/2024/12/18/the-changing-nutritional-needs-of-older-adults-and-how-to-meet-them)

---

## 10. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-030](../adr/ADR-030-nutrition-module.md) | 영양 모듈 아키텍처 | BMR/TDEE 계산, 바코드 스캔, 크로스 모듈 통합 |
| [ADR-011](../adr/ADR-011-cross-module-data-flow.md) | 크로스 모듈 데이터 플로우 | N-1 ↔ S-1, W-1 연동 |
| [ADR-032](../adr/ADR-032-smart-matching.md) | 스마트 매칭 아키텍처 | 영양 목표 기반 보충제/건강식품 매칭 |

---

**Version**: 3.0 | **Created**: 2026-01-18 | **Updated**: 2026-01-24
**소스 리서치**: N-1-R1, COMBO-SKIN-NUTRITION, COMBO-ORAL-NUTRITION, 2020 KDRIs, NIH ODS
**관련 모듈**: N-1, COMBO-SKIN-NUTRITION, COMBO-ORAL-NUTRITION
**변경 이력**: v3.0 - 섹션 9 (개인화된 RDA 조정) 추가 - 연령대별/건강상태별 조정 계수
