# 색상 매칭 이론 원리

> 이 문서는 이룸 플랫폼의 스타일링/패션 추천 시 색상 조합 원리를 설명한다.
>
> **소스 리서치**: color-science.md 확장, fashion-matching.md, 퍼스널컬러 연동

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 개인화 색상 조합 추천 시스템"

- 사용자의 퍼스널컬러, 피부톤, 선호도 기반 최적 색상 조합
- 의류, 메이크업, 액세서리 간 조화로운 컬러 매칭
- 상황(TPO)별 맞춤 색상 팔레트 제안
- 트렌드 반영 + 클래식 조합의 균형
```

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 색상 인지 | 개인별 색상 인지 차이, 색맹/색약 |
| 디스플레이 | 기기별 색재현 차이 |
| 조명 | 환경 조명에 따른 색상 변화 |
| 소재 | 소재에 따른 색상 발현 차이 |

### 100점 기준

- 색상 조합 조화도 평가 정확도 90% 이상
- 퍼스널컬러 연동 매칭 만족도 85% 이상
- 전문가 평가 일치도 80% 이상
- 사용자 재구매/재사용률 70% 이상

### 현재 목표: 75%

- 기본 색상 조화 이론 적용 (보색, 유사색 등)
- 퍼스널컬러 4계절 연동
- 의류 색상 매칭 기본 규칙
- TPO별 색상 가이드

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 패턴/프린트 조합 | 복잡도 높음 | 향후 버전 |
| 소재별 색감 차이 | 데이터 부족 | 소재 DB 구축 후 |
| 실시간 카메라 컬러 매칭 | 환경 조명 통제 불가 | 향후 기술 개선 시 |

---

## 1. 핵심 개념

### 1.1 색상 체계 (Color System)

#### Munsell 색상 체계

```
색상 표기: HUE VALUE/CHROMA
예: 5R 4/14 (빨강 계열, 명도 4, 채도 14)

       ┌─────────────────────────┐
       │      색상환 (Hue)        │
       │                         │
       │    Y                    │
       │   /  \                  │
       │  GY   YR                │
       │  |     |                │
       │  G     R                │
       │  |     |                │
       │  BG   RP                │
       │   \  /                  │
       │    B ── P               │
       │                         │
       └─────────────────────────┘

명도 (Value): 0 (검정) ~ 10 (흰색)
채도 (Chroma): 0 (무채색) ~ 14+ (순색)
```

#### HSL/HSV 색상 모델

```typescript
interface HSL {
  h: number;  // 색상 (Hue): 0-360°
  s: number;  // 채도 (Saturation): 0-100%
  l: number;  // 명도 (Lightness): 0-100%
}

interface HSV {
  h: number;  // 색상 (Hue): 0-360°
  s: number;  // 채도 (Saturation): 0-100%
  v: number;  // 명도 (Value/Brightness): 0-100%
}
```

### 1.2 색상 조화 이론 (Color Harmony)

#### Johannes Itten의 7가지 색상 대비

| 대비 유형 | 설명 | 효과 |
|----------|------|------|
| **색상 대비** | 순색들의 대비 | 강렬, 활기 |
| **명암 대비** | 밝음/어두움 | 드라마틱, 깊이 |
| **한난 대비** | 따뜻함/차가움 | 감정적 효과 |
| **보색 대비** | 색상환 반대 | 최대 대비, 강조 |
| **동시 대비** | 인접 색에 의한 변화 | 시각적 착시 |
| **채도 대비** | 선명/탁함 | 시선 유도 |
| **면적 대비** | 색상 점유 비율 | 균형, 조화 |

### 1.3 색상 조합 유형

```
┌─────────────────────────────────────────────────────────────┐
│                    색상 조합 유형                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 단색 조화 (Monochromatic)                               │
│     └── 하나의 색상, 다양한 명도/채도                        │
│         예: 네이비 + 하늘색 + 베이비블루                     │
│                                                             │
│  2. 유사색 조화 (Analogous)                                 │
│     └── 색상환에서 인접한 2-3색                             │
│         예: 빨강 + 주황 + 노랑                               │
│                                                             │
│  3. 보색 조화 (Complementary)                               │
│     └── 색상환 정반대 (180°)                                │
│         예: 파랑 + 주황, 빨강 + 초록                         │
│                                                             │
│  4. 분할 보색 (Split-Complementary)                         │
│     └── 한 색 + 보색의 양쪽 인접색                          │
│         예: 파랑 + 주황빨강 + 주황노랑                        │
│                                                             │
│  5. 삼각 조화 (Triadic)                                     │
│     └── 색상환 120° 간격 3색                                │
│         예: 빨강 + 노랑 + 파랑 (원색)                        │
│                                                             │
│  6. 사각 조화 (Tetradic/Square)                             │
│     └── 색상환 90° 간격 4색                                 │
│         예: 빨강 + 노랑 + 초록 + 보라                        │
│                                                             │
│  7. 무채색 조화 (Achromatic)                                │
│     └── 흰색, 회색, 검정 조합                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 수학적/물리학적 기반

### 2.1 색상 거리 계산

#### CIE Lab 색차 공식 (Delta E)

$$\Delta E_{ab}^* = \sqrt{(\Delta L^*)^2 + (\Delta a^*)^2 + (\Delta b^*)^2}$$

**해석 기준**:
| ΔE 값 | 지각 차이 |
|-------|----------|
| 0-1 | 거의 인지 불가 |
| 1-2 | 전문가만 인지 |
| 2-3.5 | 일반인 인지 시작 |
| 3.5-5 | 명확한 차이 |
| >5 | 완전히 다른 색 |

#### 색상환 각도 차이

$$\Delta H = |H_1 - H_2|$$

- $\Delta H < 30°$: 유사색
- $30° \leq \Delta H < 60°$: 인접색
- $\Delta H = 180°$: 보색
- $150° \leq \Delta H \leq 210°$: 보색 계열

### 2.2 조화도 점수 계산

```typescript
interface HarmonyScore {
  overall: number;      // 0-100
  hueHarmony: number;   // 색상 조화
  valueBalance: number; // 명도 균형
  chromaBalance: number;// 채도 균형
  harmonyType: HarmonyType;
}

function calculateHarmonyScore(
  colors: HSL[]
): HarmonyScore {
  // 1. 색상 조화 점수
  const hueHarmony = calculateHueHarmony(colors);

  // 2. 명도 균형 점수
  const valueBalance = calculateValueBalance(colors);

  // 3. 채도 균형 점수
  const chromaBalance = calculateChromaBalance(colors);

  // 4. 조화 유형 판별
  const harmonyType = identifyHarmonyType(colors);

  // 5. 종합 점수 (가중 평균)
  const overall = (
    hueHarmony * 0.5 +
    valueBalance * 0.3 +
    chromaBalance * 0.2
  );

  return {
    overall,
    hueHarmony,
    valueBalance,
    chromaBalance,
    harmonyType,
  };
}

function calculateHueHarmony(colors: HSL[]): number {
  const hues = colors.map(c => c.h);
  const n = hues.length;

  if (n < 2) return 100;

  // 각도 차이 계산
  const angleDiffs: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = Math.abs(hues[i] - hues[j]);
      angleDiffs.push(Math.min(diff, 360 - diff));
    }
  }

  // 조화 패턴에 가까울수록 높은 점수
  const avgDiff = angleDiffs.reduce((a, b) => a + b, 0) / angleDiffs.length;

  // 유사색(30°), 보색(180°), 삼각(120°) 패턴 보너스
  const harmonyBonus = getHarmonyPatternBonus(avgDiff);

  return Math.min(100, 60 + harmonyBonus);
}

function calculateValueBalance(colors: HSL[]): number {
  const lightnesses = colors.map(c => c.l);

  // 명도 범위: 너무 좁으면 단조, 너무 넓으면 부조화
  const range = Math.max(...lightnesses) - Math.min(...lightnesses);

  // 이상적 범위: 20-50%
  if (range >= 20 && range <= 50) return 100;
  if (range < 10 || range > 70) return 50;
  return 75;
}

function calculateChromaBalance(colors: HSL[]): number {
  const saturations = colors.map(c => c.s);

  // 채도 변동 계수
  const avg = saturations.reduce((a, b) => a + b, 0) / saturations.length;
  const variance = saturations.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / saturations.length;
  const cv = Math.sqrt(variance) / avg;

  // CV < 0.3: 좋은 균형
  if (cv < 0.3) return 100;
  if (cv > 0.6) return 50;
  return 75;
}
```

### 2.3 퍼스널컬러 연동 공식

```typescript
type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type SeasonSubtype = 'light' | 'true' | 'dark' | 'bright' | 'muted';

interface PersonalColorProfile {
  season: Season;
  subtype: SeasonSubtype;
  undertone: 'warm' | 'cool' | 'neutral';
  bestColors: string[];       // HEX 코드 배열
  avoidColors: string[];      // 피해야 할 색상
  neutralColors: string[];    // 기본 중립색
}

// 계절별 색상 특성
const SEASON_CHARACTERISTICS: Record<Season, {
  hueRange: [number, number];      // 색상환 범위
  saturationRange: [number, number]; // 채도 범위
  lightnessRange: [number, number];  // 명도 범위
  undertone: 'warm' | 'cool';
}> = {
  spring: {
    hueRange: [30, 90],    // 노랑~연두 계열
    saturationRange: [50, 80],
    lightnessRange: [60, 85],
    undertone: 'warm',
  },
  summer: {
    hueRange: [180, 270],  // 청록~보라 계열
    saturationRange: [30, 60],
    lightnessRange: [50, 75],
    undertone: 'cool',
  },
  autumn: {
    hueRange: [0, 60],     // 빨강~주황 계열
    saturationRange: [40, 70],
    lightnessRange: [30, 55],
    undertone: 'warm',
  },
  winter: {
    hueRange: [240, 330],  // 파랑~자주 계열
    saturationRange: [70, 100],
    lightnessRange: [20, 45],
    undertone: 'cool',
  },
};

function isColorSuitableForSeason(
  color: HSL,
  season: Season
): { suitable: boolean; score: number } {
  const chars = SEASON_CHARACTERISTICS[season];

  // 색상 범위 체크
  const hueInRange = isInCyclicRange(color.h, chars.hueRange[0], chars.hueRange[1]);
  const satInRange = color.s >= chars.saturationRange[0] && color.s <= chars.saturationRange[1];
  const lightInRange = color.l >= chars.lightnessRange[0] && color.l <= chars.lightnessRange[1];

  // 점수 계산
  let score = 0;
  if (hueInRange) score += 40;
  if (satInRange) score += 30;
  if (lightInRange) score += 30;

  return {
    suitable: score >= 70,
    score,
  };
}
```

---

## 3. 구현 도출

### 3.1 색상 매칭 추천 알고리즘

```typescript
interface ColorMatchingRequest {
  baseColor: string;             // 기준 색상 (HEX)
  personalColor?: PersonalColorProfile;
  occasion?: Occasion;           // TPO
  preferredStyle?: StylePreference;
  colorCount?: number;           // 원하는 조합 수
}

interface ColorMatchingResult {
  suggestedPalette: string[];    // 추천 색상 배열
  harmonyType: HarmonyType;
  harmonyScore: number;
  reasoning: string;
  alternatives: ColorPalette[];
}

type Occasion =
  | 'casual'
  | 'business'
  | 'formal'
  | 'date'
  | 'outdoor'
  | 'party';

function generateColorMatching(
  request: ColorMatchingRequest
): ColorMatchingResult {
  const { baseColor, personalColor, occasion, colorCount = 3 } = request;
  const baseHSL = hexToHSL(baseColor);

  // 1. 조화 유형 결정
  const harmonyType = determineHarmonyType(occasion, colorCount);

  // 2. 기본 조합 생성
  let palette = generateBasePalette(baseHSL, harmonyType, colorCount);

  // 3. 퍼스널컬러 필터링
  if (personalColor) {
    palette = filterByPersonalColor(palette, personalColor);
  }

  // 4. TPO 조정
  if (occasion) {
    palette = adjustForOccasion(palette, occasion);
  }

  // 5. 조화도 평가
  const harmonyScore = calculateHarmonyScore(palette);

  // 6. 대안 조합 생성
  const alternatives = generateAlternatives(baseHSL, personalColor, 3);

  return {
    suggestedPalette: palette.map(hslToHex),
    harmonyType,
    harmonyScore: harmonyScore.overall,
    reasoning: generateReasoning(harmonyType, harmonyScore),
    alternatives,
  };
}

function generateBasePalette(
  base: HSL,
  harmonyType: HarmonyType,
  count: number
): HSL[] {
  switch (harmonyType) {
    case 'monochromatic':
      return generateMonochromatic(base, count);
    case 'analogous':
      return generateAnalogous(base, count);
    case 'complementary':
      return generateComplementary(base);
    case 'split_complementary':
      return generateSplitComplementary(base);
    case 'triadic':
      return generateTriadic(base);
    case 'tetradic':
      return generateTetradic(base);
    default:
      return [base];
  }
}

function generateAnalogous(base: HSL, count: number): HSL[] {
  const result: HSL[] = [base];
  const step = 30;  // 30° 간격

  for (let i = 1; i < count; i++) {
    const direction = i % 2 === 1 ? 1 : -1;
    const offset = Math.ceil(i / 2) * step * direction;
    result.push({
      h: (base.h + offset + 360) % 360,
      s: base.s + (Math.random() * 10 - 5),  // 약간의 변주
      l: base.l + (Math.random() * 10 - 5),
    });
  }

  return result;
}

function generateComplementary(base: HSL): HSL[] {
  return [
    base,
    {
      h: (base.h + 180) % 360,
      s: base.s,
      l: base.l,
    },
  ];
}

function generateTriadic(base: HSL): HSL[] {
  return [
    base,
    { ...base, h: (base.h + 120) % 360 },
    { ...base, h: (base.h + 240) % 360 },
  ];
}
```

### 3.2 TPO별 색상 가이드

```typescript
interface OccasionColorGuide {
  occasion: Occasion;
  recommendedHarmonyTypes: HarmonyType[];
  colorRestrictions: {
    maxSaturation?: number;
    minLightness?: number;
    maxLightness?: number;
    avoidHues?: number[];    // 피해야 할 색상 각도
  };
  neutralBase: boolean;       // 중립색 기반 권장 여부
  accentAllowed: boolean;     // 포인트 컬러 허용 여부
  tips: string[];
}

const OCCASION_GUIDES: OccasionColorGuide[] = [
  {
    occasion: 'business',
    recommendedHarmonyTypes: ['monochromatic', 'analogous'],
    colorRestrictions: {
      maxSaturation: 60,
      minLightness: 20,
      maxLightness: 70,
    },
    neutralBase: true,
    accentAllowed: true,
    tips: [
      '네이비, 그레이, 블랙 등 중립색 기반',
      '포인트 컬러는 넥타이/스카프에만',
      '과한 패턴이나 밝은 색은 피하기',
    ],
  },
  {
    occasion: 'casual',
    recommendedHarmonyTypes: ['analogous', 'complementary', 'triadic'],
    colorRestrictions: {},
    neutralBase: false,
    accentAllowed: true,
    tips: [
      '자유로운 색상 조합 가능',
      '퍼스널컬러에 맞는 색상 선택',
      '3가지 이내 색상으로 정돈된 느낌',
    ],
  },
  {
    occasion: 'formal',
    recommendedHarmonyTypes: ['monochromatic'],
    colorRestrictions: {
      maxSaturation: 40,
      maxLightness: 50,
    },
    neutralBase: true,
    accentAllowed: false,
    tips: [
      '블랙, 네이비, 다크 그레이 중심',
      '화이트 셔츠로 명도 대비',
      '악세서리로만 포인트',
    ],
  },
  {
    occasion: 'date',
    recommendedHarmonyTypes: ['analogous', 'split_complementary'],
    colorRestrictions: {
      minLightness: 30,
      maxLightness: 80,
    },
    neutralBase: false,
    accentAllowed: true,
    tips: [
      '퍼스널컬러 중 Best 색상 활용',
      '부드러운 색조 조합',
      '한 가지 포인트 컬러로 시선 집중',
    ],
  },
];

function adjustForOccasion(
  palette: HSL[],
  occasion: Occasion
): HSL[] {
  const guide = OCCASION_GUIDES.find(g => g.occasion === occasion);
  if (!guide) return palette;

  return palette.map(color => {
    let adjusted = { ...color };

    // 채도 제한
    if (guide.colorRestrictions.maxSaturation) {
      adjusted.s = Math.min(adjusted.s, guide.colorRestrictions.maxSaturation);
    }

    // 명도 제한
    if (guide.colorRestrictions.minLightness) {
      adjusted.l = Math.max(adjusted.l, guide.colorRestrictions.minLightness);
    }
    if (guide.colorRestrictions.maxLightness) {
      adjusted.l = Math.min(adjusted.l, guide.colorRestrictions.maxLightness);
    }

    return adjusted;
  });
}
```

### 3.3 의류 조합 색상 규칙

```typescript
interface OutfitColorRule {
  description: string;
  pattern: ColorPattern;
  examples: string[];
  suitability: Occasion[];
}

type ColorPattern =
  | 'base_neutral_accent'    // 중립색 기반 + 포인트
  | 'gradient_single'        // 단일 색 그라데이션
  | 'contrast_duo'           // 대비 2색
  | 'harmony_trio';          // 조화 3색

const OUTFIT_COLOR_RULES: OutfitColorRule[] = [
  {
    description: '3색 규칙: 기본 60% + 보조 30% + 포인트 10%',
    pattern: 'base_neutral_accent',
    examples: [
      '네이비 자켓(60%) + 베이지 팬츠(30%) + 버건디 타이(10%)',
      '블랙 드레스(60%) + 화이트 카디건(30%) + 골드 악세서리(10%)',
    ],
    suitability: ['business', 'formal', 'casual'],
  },
  {
    description: '톤온톤: 같은 색 계열의 다른 명도/채도',
    pattern: 'gradient_single',
    examples: [
      '네이비 + 스카이블루 + 화이트',
      '카키 + 올리브 + 베이지',
    ],
    suitability: ['casual', 'business'],
  },
  {
    description: '보색 대비: 색상환 반대 색 활용',
    pattern: 'contrast_duo',
    examples: [
      '네이비 + 오렌지 (악센트)',
      '그린 + 레드 (크리스마스 느낌 주의)',
    ],
    suitability: ['casual', 'party'],
  },
];

function suggestOutfitColors(
  personalColor: PersonalColorProfile,
  occasion: Occasion
): OutfitColorSuggestion[] {
  const relevantRules = OUTFIT_COLOR_RULES.filter(
    rule => rule.suitability.includes(occasion)
  );

  const suggestions: OutfitColorSuggestion[] = [];

  for (const rule of relevantRules) {
    const colors = generateOutfitPalette(personalColor, rule.pattern);
    suggestions.push({
      rule: rule.description,
      baseColor: colors[0],
      secondaryColor: colors[1],
      accentColor: colors[2],
      distribution: [60, 30, 10],
    });
  }

  return suggestions;
}
```

---

## 4. 검증 방법

### 4.1 조화도 검증

- 전문가 평가 (패션 스타일리스트, 컬러 컨설턴트)
- A/B 테스트 (사용자 선호도)
- 재구매율/착용 빈도 추적

### 4.2 퍼스널컬러 연동 검증

```typescript
interface ValidationResult {
  colorAccuracy: number;      // 퍼스널컬러 적합성
  userSatisfaction: number;   // 사용자 만족도
  repeatUsage: number;        // 재사용률
  expertAgreement: number;    // 전문가 일치도
}

const VALIDATION_TARGETS: ValidationResult = {
  colorAccuracy: 85,
  userSatisfaction: 80,
  repeatUsage: 70,
  expertAgreement: 75,
};
```

### 4.3 실제 착용 피드백

- 착용샷 수집 및 분석
- 조명/환경별 색상 차이 모니터링
- 시즌별 트렌드 반영 효과

---

## 5. 제한 사항

### 5.1 색상 인지 차이

```
주의: 색상 인지는 개인마다 다릅니다

- 디스플레이 색상과 실제 제품 색상은 차이가 있을 수 있습니다
- 조명 환경에 따라 색상이 다르게 보일 수 있습니다
- 색맹/색약이 있는 분은 별도 지원이 필요할 수 있습니다
```

### 5.2 문화적 차이

| 색상 | 서양 의미 | 동양 의미 | 매칭 시 고려 |
|------|----------|----------|-------------|
| 흰색 | 순수, 결혼 | 상복, 죽음 | 상황 확인 필요 |
| 빨강 | 열정, 위험 | 행운, 축하 | 긍정적 해석 가능 |
| 노랑 | 행복, 경고 | 황제, 권력 | 문화권 고려 |

---

## 6. 참고 자료

- Itten, J. (1961). The Art of Color
- Munsell Color System (Munsell Book of Color)
- Pantone Color Institute
- CIE (Commission Internationale de l'Éclairage) Standards
- fashion-matching.md 원리 문서
- color-science.md (퍼스널컬러 기반)

---

## 7. 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서 | 설명 |
|------|------|
| [SDD-PHASE-J-AI-STYLING](../specs/SDD-PHASE-J-AI-STYLING.md) | AI 스타일링 스펙 |
| [SDD-PHASE-J-P3-FULL-OUTFIT](../specs/SDD-PHASE-J-P3-FULL-OUTFIT.md) | 풀 아웃핏 추천 |

### 관련 원리 문서

| 문서 | 설명 |
|------|------|
| [color-science.md](./color-science.md) | 색채학 기반 |
| [fashion-matching.md](./fashion-matching.md) | 패션 매칭 |
| [personalization-engine.md](./personalization-engine.md) | 개인화 추천 |

---

**Version**: 1.0 | **Created**: 2026-01-29
**소스 리서치**: color-science.md, fashion-matching.md 확장
**관련 모듈**: PC-1/PC-2, J-1 스타일링
