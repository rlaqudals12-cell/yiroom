# PC-2-R1: 퍼스널컬러 v2 고도화 리서치

## 1. 핵심 요약

- **Lab 색공간 기반 판정**은 ITA(Individual Typology Angle) 공식과 3차원 L\*a\*b\* 분석을 결합하여 정확도를 높일 수 있음. ITA는 L\*(명도)와 b\*(황청)만 사용하므로 a\*(적녹) 축을 추가 분석해야 쿨톤/웜톤 구분이 정밀해짐
- **12톤 시스템**은 4계절을 각각 3개 세부톤(Light/True/Deep 또는 Bright/Soft/Cool)으로 세분화. 한국 퍼스널컬러 진단 업계에서는 봄라이트/봄브라이트/봄스트롱, 여름라이트/여름뮤트/여름브라이트 등의 명칭 사용
- **한국인 MZ세대 분포** (잼페이스 139만건): 가을웜트루(22.8%) > 여름쿨트루(18.4%) > 봄웜트루(18.2%) > 겨울쿨트루(10.4%). 학술 연구에서는 가을 > 여름 > 봄 > 겨울 순
- **색상 추천 알고리즘**은 유사색(Analogous), 보색(Complementary), 톤온톤(Tone-on-Tone) 세 가지 조화 이론을 기반으로 구현 가능
- **화장품/의류 매칭**은 사용자의 언더톤(Warm/Cool/Neutral)과 스킨톤 깊이(Light/Medium/Deep)를 기준으로 제품 데이터베이스와 CIEDE2000 색차 매칭

---

## 2. 상세 내용

### 2.1 Lab 기반 판정 고도화

#### 2.1.1 ITA (Individual Typology Angle) 공식

ITA는 피부 밝기와 황색도를 기반으로 피부톤을 분류하는 표준 지표:

```
ITA = arctan[(L* - 50) / b*] × (180 / π)
```

| ITA 범위 | 분류 | 설명 |
|----------|------|------|
| > 55° | Very Light | 매우 밝은 피부 |
| 41° ~ 55° | Light | 밝은 피부 |
| 28° ~ 41° | Intermediate | 중간 피부 |
| 10° ~ 28° | Tan | 탄 피부 |
| -30° ~ 10° | Brown | 갈색 피부 |
| < -30° | Dark | 어두운 피부 |

**ITA의 한계**: L\*와 b\*만 사용하여 a\*(적녹 축)를 무시 → 쿨톤(핑크/레드 언더톤)과 웜톤(옐로우/골든 언더톤) 구분 불가

#### 2.1.2 3차원 Lab 분석 확장

퍼스널컬러 판정을 위해서는 ITA + a\* 값 분석이 필수:

| 지표 | 역할 | 퍼스널컬러 연관성 |
|------|------|-------------------|
| L\* (명도) | 0(검정)~100(흰색) | 피부 밝기 → Light/Deep 구분 |
| a\* (적녹) | -128(녹)~+127(적) | 핑크/레드 언더톤 → Cool 경향 |
| b\* (황청) | -128(청)~+127(황) | 옐로우/골든 언더톤 → Warm 경향 |

**웜/쿨 분류 기준 (연구 기반)**:
- Warm 참조값: Lab [70, 20, 40]
- Cool 참조값: Lab [60, -20, -30]
- CIEDE2000 색차(ΔE)가 더 가까운 쪽으로 분류

#### 2.1.3 한국인/아시아인 특화 Lab 범위

| 지역 | L\* 중앙값 | h° (색상각) | 주요 클러스터 |
|------|-----------|-------------|---------------|
| 중국 | 64.87 | 56.54 | Very Light, Light Cool |
| 인도네시아 | 57.07 | 63.06 | Light Warm (82.2%) |
| 인도 | 53.62 | 60.80 | Light Warm (49.2%) |
| 한국 (추정) | 60-65 | 55-60 | Light ~ Intermediate |

**색상각(Hue Angle) 해석**:
- h° < 55°: 핑크/쿨 경향
- h° 55°~65°: 중립
- h° > 65°: 옐로우/웜 경향

### 2.2 계절 타입별 세부 톤

#### 12톤 시스템 전체 구조

| 계절 | 세부 톤 1 | 세부 톤 2 | 세부 톤 3 | 공통 특성 |
|------|-----------|-----------|-----------|-----------|
| **봄 (Spring)** | Light Spring | True/Warm Spring | Bright/Clear Spring | 따뜻하고 밝은 색상 |
| **여름 (Summer)** | Light Summer | True/Cool Summer | Soft/Muted Summer | 시원하고 부드러운 색상 |
| **가을 (Autumn)** | Soft Autumn | True/Warm Autumn | Deep/Dark Autumn | 따뜻하고 깊은 색상 |
| **겨울 (Winter)** | Deep/Dark Winter | True/Cool Winter | Bright/Clear Winter | 시원하고 선명한 색상 |

#### 세부 톤별 특징 및 Lab 기준값 (추정)

**봄 (Spring) - 웜톤**
| 세부 톤 | 한국명 | 특징 | L\* 범위 | Chroma | 대표색 |
|---------|--------|------|----------|--------|--------|
| Light Spring | 봄 라이트 | 밝고 따뜻하고 부드러움 | 70-85 | 중간 | 피치, 민트, 라이트 코랄 |
| True/Warm Spring | 봄 트루/웜 | 따뜻하고 선명함 | 60-75 | 중-고 | 코랄, 터콰이즈, 웜 옐로우 |
| Bright/Clear Spring | 봄 브라이트 | 밝고 따뜻하고 선명함 | 65-80 | 고 | 브라이트 코랄, 켈리 그린, 코발트 |

**여름 (Summer) - 쿨톤**
| 세부 톤 | 한국명 | 특징 | L\* 범위 | Chroma | 대표색 |
|---------|--------|------|----------|--------|--------|
| Light Summer | 여름 라이트 | 밝고 시원하고 부드러움 | 70-85 | 저-중 | 소프트 핑크, 파스텔 블루 |
| True/Cool Summer | 여름 트루/쿨 | 시원하고 소프트함 | 60-75 | 중간 | 라벤더, 쿨 핑크, 스카이 블루 |
| Soft/Muted Summer | 여름 뮤트 | 시원하고 뮤트됨 | 55-70 | 저 | 더스티 로즈, 세이지, 뮤트 라벤더 |

**가을 (Autumn) - 웜톤**
| 세부 톤 | 한국명 | 특징 | L\* 범위 | Chroma | 대표색 |
|---------|--------|------|----------|--------|--------|
| Soft Autumn | 가을 뮤트/소프트 | 따뜻하고 뮤트됨 | 50-65 | 저-중 | 테라코타, 올리브, 모스 그린 |
| True/Warm Autumn | 가을 트루/웜 | 따뜻하고 풍부함 | 45-60 | 중-고 | 머스타드, 번트 오렌지, 브릭 |
| Deep/Dark Autumn | 가을 딥/다크 | 따뜻하고 깊음 | 35-50 | 중-고 | 버건디, 초콜릿, 딥 티얼 |

**겨울 (Winter) - 쿨톤**
| 세부 톤 | 한국명 | 특징 | L\* 범위 | Chroma | 대표색 |
|---------|--------|------|----------|--------|--------|
| Deep/Dark Winter | 겨울 딥/다크 | 시원하고 깊음 | 30-50 | 중-고 | 다크 네이비, 플럼, 딥 퍼플 |
| True/Cool Winter | 겨울 트루/쿨 | 시원하고 선명함 | 40-60 | 고 | 퓨어 화이트, 블랙, 아이시 블루 |
| Bright/Clear Winter | 겨울 브라이트 | 시원하고 매우 선명함 | 50-70 | 매우 고 | 쇼킹 핑크, 로얄 블루, 에메랄드 |

### 2.3 색상 추천 알고리즘

#### 2.3.1 색상 조화 이론 (Color Harmony)

```typescript
// 색상 조화 타입 정의
type ColorHarmonyType = 
  | 'complementary'    // 보색 - 180° 반대
  | 'analogous'        // 유사색 - 인접 30° 이내
  | 'triadic'          // 삼각배색 - 120° 간격
  | 'split-complementary' // 분리보색 - 보색 양옆
  | 'tetradic'         // 사각배색 - 90° 간격
  | 'monochromatic'    // 단색조 - 동일 색상, 명도/채도 변화
  | 'tone-on-tone'     // 톤온톤 - 동일 색상계열, 톤 변화
  | 'tone-in-tone';    // 톤인톤 - 동일 톤, 색상 변화
```

#### 2.3.2 LCH 색공간 기반 색상 조화 계산

```typescript
interface LCHColor {
  L: number;  // Lightness (0-100)
  C: number;  // Chroma (0-132)
  H: number;  // Hue angle (0-360)
}

// 보색 계산
function getComplementary(color: LCHColor): LCHColor {
  return {
    ...color,
    H: (color.H + 180) % 360
  };
}

// 유사색 계산 (30° 범위 내)
function getAnalogous(color: LCHColor, offset: number = 30): LCHColor[] {
  return [
    { ...color, H: (color.H - offset + 360) % 360 },
    color,
    { ...color, H: (color.H + offset) % 360 }
  ];
}

// 톤온톤 계산 (동일 색상, 명도/채도 변화)
function getToneOnTone(color: LCHColor): LCHColor[] {
  return [
    { L: color.L + 20, C: color.C - 10, H: color.H }, // 라이트 톤
    color,                                             // 원본
    { L: color.L - 20, C: color.C + 10, H: color.H }  // 다크 톤
  ].map(c => ({
    L: Math.max(0, Math.min(100, c.L)),
    C: Math.max(0, Math.min(132, c.C)),
    H: c.H
  }));
}
```

#### 2.3.3 퍼스널컬러 기반 추천 로직

```typescript
interface PersonalColorRecommendation {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  subTone: string;
  harmonyType: ColorHarmonyType;
  recommendedColors: LCHColor[];
}

// 계절별 베이스 색상 및 조화 유형
const seasonalHarmonyRules = {
  spring: {
    baseHueRange: [30, 90],    // 노랑~주황~연두 계열
    preferredHarmony: ['analogous', 'tone-on-tone'],
    chromaRange: [40, 80],     // 중간~높은 채도
    lightnessRange: [60, 85]   // 밝은 톤
  },
  summer: {
    baseHueRange: [180, 270],  // 청록~파랑~보라 계열
    preferredHarmony: ['analogous', 'monochromatic'],
    chromaRange: [20, 50],     // 낮은~중간 채도 (뮤트)
    lightnessRange: [55, 80]   // 중간~밝은 톤
  },
  autumn: {
    baseHueRange: [15, 60],    // 주황~노랑 계열 (어스톤)
    preferredHarmony: ['analogous', 'tone-in-tone'],
    chromaRange: [30, 60],     // 중간 채도 (뮤트)
    lightnessRange: [35, 60]   // 어두운~중간 톤
  },
  winter: {
    baseHueRange: [240, 330],  // 파랑~보라~핑크 계열
    preferredHarmony: ['complementary', 'triadic'],
    chromaRange: [60, 100],    // 높은 채도 (비비드)
    lightnessRange: [20, 70]   // 대비가 큰 톤
  }
};
```

### 2.4 한국인 분포 데이터

#### 2.4.1 잼페이스 139만건 테스트 결과 (MZ세대 중심)

| 순위 | 퍼스널컬러 유형 | 비율 | 추천 립 컬러 예시 |
|------|----------------|------|-------------------|
| 1 | 가을 웜 트루 | 22.8% | 에스쁘아 꾸뛰르 립틴트 '문릿' |
| 2 | 여름 쿨 트루 | 18.4% | 이니스프리 에리 매트 틴트 '마젠타모브' |
| 3 | 봄 웜 트루 | 18.2% | 롬앤 제로 매트 립스틱 '앤비미' |
| 4 | 겨울 쿨 트루 | 10.4% | 롬앤 블러 퍼지 틴트 '커런트잼' |
| 5-12 | 기타 세부 톤 | 30.2% | - |

#### 2.4.2 학술 연구 기반 분포 (선행연구 종합)

| 순위 | 계절 | 추정 비율 | 근거 |
|------|------|----------|------|
| 1 | 가을 (Autumn) | ~35% | 한국인 피부의 황색 언더톤 우세 |
| 2 | 여름 (Summer) | ~30% | 낮은 대비, 뮤트 경향 다수 |
| 3 | 봄 (Spring) | ~25% | 밝은 피부 + 웜톤 조합 |
| 4 | 겨울 (Winter) | ~10% | 높은 대비, 선명한 특성 희귀 |

#### 2.4.3 코코리색채연구소 데이터 (20-30대 여성 37,000명)

- 피부색 평균: 먼셀 `8.8YR 6.6/3` (웜톤) ~ `7.7YR 6.5/2.7` (쿨톤)
- Lab 평균: L\*=62.21, a\*=9.49, b\*=19.81 (60대 이상 기준)
- 젊은 층은 L\* 값이 더 높고 (밝음), b\* 값이 상대적으로 낮음 (덜 노란)

### 2.5 의류/화장품 매칭

#### 2.5.1 파운데이션 매칭 알고리즘

```typescript
interface FoundationProduct {
  id: string;
  name: string;
  brand: string;
  shadeCode: string;
  labColor: LabColor;
  undertone: 'warm' | 'cool' | 'neutral';
  depth: 'fair' | 'light' | 'medium' | 'tan' | 'deep';
}

interface UserSkinProfile {
  labColor: LabColor;
  undertone: 'warm' | 'cool' | 'neutral';
  depth: string;
  personalColor: string; // e.g., 'autumn_warm_true'
}

// CIEDE2000 색차 기반 파운데이션 매칭
function matchFoundation(
  user: UserSkinProfile,
  products: FoundationProduct[]
): FoundationProduct[] {
  return products
    .filter(p => p.undertone === user.undertone) // 언더톤 필터
    .map(p => ({
      product: p,
      deltaE: calculateCIEDE2000(user.labColor, p.labColor)
    }))
    .sort((a, b) => a.deltaE - b.deltaE) // 색차 오름차순
    .slice(0, 3) // 상위 3개 추천
    .map(r => r.product);
}

// CIEDE2000 색차 계산 (간소화 버전)
function calculateCIEDE2000(lab1: LabColor, lab2: LabColor): number {
  const deltaL = lab2.L - lab1.L;
  const deltaA = lab2.a - lab1.a;
  const deltaB = lab2.b - lab1.b;
  
  // 간소화된 유클리드 거리 (실제 구현시 CIEDE2000 전체 공식 사용)
  return Math.sqrt(deltaL ** 2 + deltaA ** 2 + deltaB ** 2);
}
```

#### 2.5.2 립스틱 추천 로직

```typescript
interface LipstickRecommendation {
  personalColor: string;
  bestColors: string[];
  avoidColors: string[];
  sampleProducts: string[];
}

const lipstickRecommendations: Record<string, LipstickRecommendation> = {
  'spring_light': {
    bestColors: ['피치 코랄', '살몬 핑크', '웜 누드'],
    avoidColors: ['딥 버건디', '쿨 푸시아', '브라운 계열'],
    sampleProducts: ['MLBB 계열 웜톤']
  },
  'spring_bright': {
    bestColors: ['브라이트 코랄', '오렌지 레드', '선명한 피치'],
    avoidColors: ['뮤트 계열', '그레이시 핑크'],
    sampleProducts: ['롬앤 쥬시 래스팅 틴트']
  },
  'summer_light': {
    bestColors: ['소프트 핑크', '라이트 로즈', '베이비 핑크'],
    avoidColors: ['오렌지', '브릭', '골드 계열'],
    sampleProducts: ['페리페라 잉크 틴트']
  },
  'summer_mute': {
    bestColors: ['더스티 로즈', '뮤트 핑크', '모브'],
    avoidColors: ['브라이트 컬러', '선명한 레드'],
    sampleProducts: ['헤라 센슈얼 파우더 매트']
  },
  'autumn_true': {
    bestColors: ['테라코타', '브릭 레드', '카멜 브라운'],
    avoidColors: ['쿨 핑크', '네온', '블루 베이스'],
    sampleProducts: ['에스쁘아 꾸뛰르 립틴트']
  },
  'autumn_deep': {
    bestColors: ['버건디', '다크 브라운', '딥 오렌지'],
    avoidColors: ['파스텔', '밝은 핑크'],
    sampleProducts: ['3CE 벨벳 립틴트']
  },
  'winter_bright': {
    bestColors: ['퓨어 레드', '쇼킹 핑크', '와인'],
    avoidColors: ['오렌지', '브라운', '뮤트 계열'],
    sampleProducts: ['롬앤 제로 벨벳 틴트']
  },
  'winter_true': {
    bestColors: ['체리 레드', '푸시아', '딥 플럼'],
    avoidColors: ['코랄', '피치', '웜 브라운'],
    sampleProducts: ['이니스프리 에리 매트 틴트']
  }
};
```

#### 2.5.3 의류 색상 매칭

```typescript
interface ClothingColorMatch {
  category: 'top' | 'bottom' | 'outer' | 'accessory';
  personalColor: string;
  recommendedPalette: string[];
  neutralOptions: string[];
  accentOptions: string[];
}

// 60-30-10 규칙 기반 의류 코디네이션
function generateOutfitPalette(personalColor: string): ClothingColorMatch[] {
  const palette = seasonalPalettes[personalColor];
  
  return [
    {
      category: 'top',
      personalColor,
      recommendedPalette: palette.bestColors,
      neutralOptions: palette.neutrals,
      accentOptions: palette.accents
    },
    // ... 다른 카테고리
  ];
}

// 톤온톤 의류 매칭
function toneOnToneOutfit(baseColor: LCHColor): {
  main: LCHColor;    // 60% - 메인 아이템
  secondary: LCHColor; // 30% - 보조 아이템
  accent: LCHColor;    // 10% - 포인트 아이템
} {
  return {
    main: { ...baseColor, L: baseColor.L },
    secondary: { ...baseColor, L: baseColor.L + 15, C: baseColor.C - 10 },
    accent: { ...baseColor, L: baseColor.L - 20, C: baseColor.C + 20 }
  };
}
```

---

## 3. 구현 시 필수 사항

### 3.1 피부색 측정 및 분석

- [ ] RGB → Lab 변환 함수 구현 (D65 광원 기준)
- [ ] ITA (Individual Typology Angle) 계산 함수 구현
- [ ] a\* 값 기반 웜/쿨 추가 분류 로직 구현
- [ ] CIEDE2000 색차 계산 함수 구현 (정밀 매칭용)
- [ ] 피부 영역 평균 색상 추출 (볼, 이마, 턱 3포인트)

### 3.2 12톤 분류 알고리즘

- [ ] 1차 분류: 웜/쿨 (a\*, b\*, h° 기반)
- [ ] 2차 분류: 계절 (Spring/Summer/Autumn/Winter)
- [ ] 3차 분류: 세부 톤 (Light/True/Bright/Soft/Deep)
- [ ] 신뢰도 점수 산출 (각 분류별 확률)
- [ ] 경계선 케이스 처리 (복수 결과 제시)

### 3.3 색상 추천 시스템

- [ ] LCH 색공간 기반 색상 조화 계산
- [ ] 유사색/보색/톤온톤 팔레트 생성
- [ ] 계절별 금지색 필터링
- [ ] 사용자 선호도 학습 (피드백 반영)

### 3.4 제품 매칭 데이터베이스

- [ ] 화장품 제품 DB 스키마 설계 (Lab 값 필수)
- [ ] 파운데이션/립스틱/섀도우 제품 데이터 수집
- [ ] 브랜드별 색상 코드 표준화
- [ ] 의류 컬러칩 데이터베이스 구축

### 3.5 한국인 특화 최적화

- [ ] 한국인 피부 Lab 분포 참조 테이블 구축
- [ ] 계절별/세부톤별 한국 시장 인기 제품 연동
- [ ] K-뷰티 브랜드 우선 추천 로직

---

## 4. 코드 예시

### 4.1 전체 퍼스널컬러 분석 파이프라인

```typescript
// types/personal-color.ts
export interface LabColor {
  L: number; // 0-100
  a: number; // -128 to 127
  b: number; // -128 to 127
}

export interface LCHColor {
  L: number; // 0-100
  C: number; // 0-132 (Chroma)
  H: number; // 0-360 (Hue angle)
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Undertone = 'warm' | 'cool' | 'neutral';
export type SubTone = 'light' | 'true' | 'bright' | 'soft' | 'deep';

export interface PersonalColorResult {
  season: Season;
  subTone: SubTone;
  undertone: Undertone;
  confidence: number;
  labValues: LabColor;
  ita: number;
  hueAngle: number;
  recommendedPalette: string[];
}

// lib/color-analysis.ts
export function rgbToLab(r: number, g: number, b: number): LabColor {
  // sRGB to XYZ
  let rLinear = r / 255;
  let gLinear = g / 255;
  let bLinear = b / 255;

  // Gamma correction
  rLinear = rLinear > 0.04045 
    ? Math.pow((rLinear + 0.055) / 1.055, 2.4) 
    : rLinear / 12.92;
  gLinear = gLinear > 0.04045 
    ? Math.pow((gLinear + 0.055) / 1.055, 2.4) 
    : gLinear / 12.92;
  bLinear = bLinear > 0.04045 
    ? Math.pow((bLinear + 0.055) / 1.055, 2.4) 
    : bLinear / 12.92;

  // sRGB to XYZ (D65)
  const x = rLinear * 0.4124 + gLinear * 0.3576 + bLinear * 0.1805;
  const y = rLinear * 0.2126 + gLinear * 0.7152 + bLinear * 0.0722;
  const z = rLinear * 0.0193 + gLinear * 0.1192 + bLinear * 0.9505;

  // XYZ to Lab (D65 reference)
  const xRef = 0.95047;
  const yRef = 1.0;
  const zRef = 1.08883;

  const xRatio = x / xRef;
  const yRatio = y / yRef;
  const zRatio = z / zRef;

  const f = (t: number) => 
    t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + (16 / 116);

  const L = 116 * f(yRatio) - 16;
  const a = 500 * (f(xRatio) - f(yRatio));
  const labB = 200 * (f(yRatio) - f(zRatio));

  return { L, a, b: labB };
}

export function labToLCH(lab: LabColor): LCHColor {
  const C = Math.sqrt(lab.a ** 2 + lab.b ** 2);
  let H = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  if (H < 0) H += 360;
  
  return { L: lab.L, C, H };
}

export function calculateITA(lab: LabColor): number {
  // ITA = arctan[(L* - 50) / b*] × (180 / π)
  return Math.atan((lab.L - 50) / lab.b) * (180 / Math.PI);
}

export function classifyUndertone(lab: LabColor): Undertone {
  const lch = labToLCH(lab);
  
  // 참조값 기반 분류
  const warmRef: LabColor = { L: 70, a: 20, b: 40 };
  const coolRef: LabColor = { L: 60, a: -20, b: -30 };
  
  const deltaEWarm = calculateDeltaE(lab, warmRef);
  const deltaECool = calculateDeltaE(lab, coolRef);
  
  // 색상각 기반 보조 판정
  // h° < 55: 쿨 경향, h° > 65: 웜 경향
  const hueIndicator = lch.H < 55 ? 'cool' : lch.H > 65 ? 'warm' : 'neutral';
  
  // a* 값 기반 보조 판정
  // a* > 15: 핑크/레드 강함 (쿨)
  // a* < 5: 핑크/레드 약함 (웜)
  const aIndicator = lab.a > 15 ? 'cool' : lab.a < 5 ? 'warm' : 'neutral';
  
  // 종합 판정
  if (deltaEWarm < deltaECool - 10) return 'warm';
  if (deltaECool < deltaEWarm - 10) return 'cool';
  return 'neutral';
}

export function classifySeason(
  lab: LabColor, 
  undertone: Undertone
): Season {
  const ita = calculateITA(lab);
  const lch = labToLCH(lab);
  
  if (undertone === 'warm') {
    // 웜톤: 봄 또는 가을
    // 밝고 선명 → 봄, 어둡고 뮤트 → 가을
    if (lab.L > 60 && lch.C > 40) return 'spring';
    return 'autumn';
  } else if (undertone === 'cool') {
    // 쿨톤: 여름 또는 겨울
    // 소프트하고 뮤트 → 여름, 선명하고 대비 → 겨울
    if (lch.C < 50 && lab.L > 50) return 'summer';
    return 'winter';
  } else {
    // 뉴트럴: 주변 특성으로 판단
    if (lab.L > 65) return lch.C > 40 ? 'spring' : 'summer';
    return lch.C > 40 ? 'winter' : 'autumn';
  }
}

export function classifySubTone(
  lab: LabColor,
  season: Season
): SubTone {
  const lch = labToLCH(lab);
  
  // 명도(L*)와 채도(C)로 세부 톤 결정
  const isLight = lab.L > 65;
  const isBright = lch.C > 60;
  const isSoft = lch.C < 40;
  const isDeep = lab.L < 50;
  
  switch (season) {
    case 'spring':
      if (isLight) return 'light';
      if (isBright) return 'bright';
      return 'true';
      
    case 'summer':
      if (isLight) return 'light';
      if (isSoft) return 'soft';
      return 'true';
      
    case 'autumn':
      if (isSoft) return 'soft';
      if (isDeep) return 'deep';
      return 'true';
      
    case 'winter':
      if (isDeep) return 'deep';
      if (isBright) return 'bright';
      return 'true';
  }
}

// 유클리드 색차 (간소화 버전)
function calculateDeltaE(lab1: LabColor, lab2: LabColor): number {
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 +
    (lab1.a - lab2.a) ** 2 +
    (lab1.b - lab2.b) ** 2
  );
}

// 전체 분석 함수
export function analyzePersonalColor(
  skinRGB: { r: number; g: number; b: number }
): PersonalColorResult {
  const lab = rgbToLab(skinRGB.r, skinRGB.g, skinRGB.b);
  const lch = labToLCH(lab);
  const ita = calculateITA(lab);
  const undertone = classifyUndertone(lab);
  const season = classifySeason(lab, undertone);
  const subTone = classifySubTone(lab, season);
  
  // 신뢰도 계산 (간소화)
  const confidence = calculateConfidence(lab, season, subTone);
  
  // 추천 팔레트 생성
  const recommendedPalette = generatePalette(season, subTone);
  
  return {
    season,
    subTone,
    undertone,
    confidence,
    labValues: lab,
    ita,
    hueAngle: lch.H,
    recommendedPalette
  };
}

function calculateConfidence(
  lab: LabColor,
  season: Season,
  subTone: SubTone
): number {
  // 각 분류 기준과의 거리 기반 신뢰도
  // 실제 구현시 더 정교한 로직 필요
  return 0.85; // 예시 값
}

function generatePalette(season: Season, subTone: SubTone): string[] {
  const palettes: Record<string, string[]> = {
    'spring_light': ['#FFE4C9', '#FFDAB9', '#98FB98', '#87CEEB'],
    'spring_bright': ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'],
    'spring_true': ['#FF7F50', '#FFD700', '#40E0D0', '#FA8072'],
    'summer_light': ['#E6E6FA', '#FFB6C1', '#B0E0E6', '#DDA0DD'],
    'summer_soft': ['#D8BFD8', '#C0C0C0', '#A9A9A9', '#BC8F8F'],
    'summer_true': ['#6A5ACD', '#DB7093', '#5F9EA0', '#9370DB'],
    'autumn_soft': ['#D2B48C', '#8FBC8F', '#DEB887', '#BDB76B'],
    'autumn_true': ['#D2691E', '#B8860B', '#8B4513', '#CD853F'],
    'autumn_deep': ['#800000', '#8B0000', '#A0522D', '#6B4423'],
    'winter_deep': ['#191970', '#4B0082', '#2F4F4F', '#483D8B'],
    'winter_bright': ['#FF1493', '#00CED1', '#7FFF00', '#FF00FF'],
    'winter_true': ['#000000', '#FFFFFF', '#FF0000', '#0000FF']
  };
  
  return palettes[`${season}_${subTone}`] || palettes[`${season}_true`];
}
```

### 4.2 색상 조화 추천 시스템

```typescript
// lib/color-harmony.ts
export type HarmonyType = 
  | 'complementary' 
  | 'analogous' 
  | 'triadic' 
  | 'split-complementary'
  | 'tone-on-tone';

export function getHarmonyColors(
  baseColor: LCHColor,
  harmonyType: HarmonyType
): LCHColor[] {
  switch (harmonyType) {
    case 'complementary':
      return [
        baseColor,
        { ...baseColor, H: (baseColor.H + 180) % 360 }
      ];
      
    case 'analogous':
      return [
        { ...baseColor, H: (baseColor.H - 30 + 360) % 360 },
        baseColor,
        { ...baseColor, H: (baseColor.H + 30) % 360 }
      ];
      
    case 'triadic':
      return [
        baseColor,
        { ...baseColor, H: (baseColor.H + 120) % 360 },
        { ...baseColor, H: (baseColor.H + 240) % 360 }
      ];
      
    case 'split-complementary':
      const complement = (baseColor.H + 180) % 360;
      return [
        baseColor,
        { ...baseColor, H: (complement - 30 + 360) % 360 },
        { ...baseColor, H: (complement + 30) % 360 }
      ];
      
    case 'tone-on-tone':
      return [
        { L: Math.min(100, baseColor.L + 20), C: baseColor.C * 0.7, H: baseColor.H },
        baseColor,
        { L: Math.max(0, baseColor.L - 20), C: baseColor.C * 1.2, H: baseColor.H }
      ];
      
    default:
      return [baseColor];
  }
}

// 퍼스널컬러에 따른 추천 조화 타입
export function getRecommendedHarmony(season: Season): HarmonyType[] {
  const recommendations: Record<Season, HarmonyType[]> = {
    spring: ['analogous', 'tone-on-tone'],
    summer: ['analogous', 'tone-on-tone'],
    autumn: ['analogous', 'tone-on-tone', 'complementary'],
    winter: ['complementary', 'triadic', 'split-complementary']
  };
  
  return recommendations[season];
}
```

---

## 5. 참고 자료

### 5.1 학술 논문
- Van Song (2026). "A New Method for Skin Color Classification Based on Global CIELAB Data and k-Mean Clustering". Color Research & Application. [Wiley](https://onlinelibrary.wiley.com/doi/full/10.1002/col.70012)
- Jung et al. (2024). "Skin Tone Analysis Through Skin Tone Map Generation With Optical Approach and Deep Learning". Skin Research and Technology. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11452249/)
- Sony AI (2024). "Beyond Skin Tone: A Multidimensional Measure of Apparent Skin Color". [Sony AI Blog](https://ai.sony/blog/Beyond-Skin-Tone-A-Multidimensional-Measure-of-Apparent-Skin-Color/)

### 5.2 한국 연구 자료
- 한국미용학회지. "퍼스널컬러 시스템에 따른 유형의 분포도". [e-JKC](https://www.e-jkc.org/m/journal/view.php?number=2728)
- 코코리색채연구소. "톤의 공식" (특허 제10-2090370호) - 20-30대 여성 37,000명 데이터
- 잼페이스 퍼스널컬러 매칭 서비스 (139만 테스트 결과)

### 5.3 색상 이론 도구
- Paletton - Color Scheme Designer: https://paletton.com/
- Canva Color Wheel: https://www.canva.com/colors/color-wheel/
- Sessions College Color Calculator: https://www.sessions.edu/color-calculator/

### 5.4 퍼스널컬러 가이드
- The Concept Wardrobe - 12 Season System: https://theconceptwardrobe.com/
- Indigo Tones - 12 Seasonal Tones: https://indigotones.com/pages/12-seasonal-tones
- Style with DC - 16 Season System: https://stylewithdc.com/

### 5.5 화장품 매칭 도구
- L'Oréal Foundation Shade Finder: https://www.lorealparisusa.com/
- MAC Foundation Shade Finder: https://www.maccosmetics.com/foundation-shade-finder
- Findation.com: https://findation.com/
