# CIE Lab 색공간 기반 피부톤 분석 알고리즘 리서치

CIE Lab 색공간은 인간의 색 인지와 가장 유사하게 설계된 색 모델로, **피부톤 분석과 퍼스널컬러 진단에 최적화된 색공간**이다. sRGB에서 Lab으로의 정확한 변환은 XYZ 중간 색공간을 거쳐야 하며, 감마 보정과 D65 표준광원 기준이 필수다. 아시아인 피부는 평균 **L* 60-68, a* 8-11, b* 17-22** 범위를 보이며, b* 값이 높아 웜톤 비율이 높다. 웜/쿨 판별의 핵심은 **색상각(h°) 55-60° 임계값**과 **a*/b* 비율**이며, 계절 타입 분류는 L*(명도), C*(채도), h°(색상각) 3개 축으로 결정된다. 실제 적용 시 **조명 보정(Bradford 변환)**이 정확도를 좌우한다.

---

## RGB → Lab 변환 상세 공식

색공간 변환은 **sRGB → Linear RGB → XYZ → Lab** 순서로 진행되며, 각 단계에서 정밀한 수학적 변환이 필요하다. IEC 61966-2-1 국제 표준에 정의된 공식을 사용해야 구현 간 일관성이 보장된다.

### sRGB 감마 보정 (역 컴팬딩)

sRGB는 단순 γ=2.2가 아닌 **구간별 함수**를 사용한다. 각 채널 V ∈ {R, G, B} (0~1 범위)에 대해:

```
v = V / 12.92                         (V ≤ 0.04045일 때)
v = ((V + 0.055) / 1.055)^2.4         (V > 0.04045일 때)
```

**핵심 상수값:**
| 상수 | 값 | 용도 |
|------|-----|------|
| 임계값 | **0.04045** | sRGB→Linear 분기점 |
| 선형 기울기 | **12.92** | 저휘도 영역 |
| 오프셋 | **0.055** | 고휘도 영역 |
| 지수 | **2.4** | 감마 값 |

### Linear RGB → XYZ 변환 행렬

IEC 61966-2-1:2003 표준 행렬 (D65 기준, 8자리 정밀도):

```
| X |   | 0.4124564  0.3575761  0.1804375 |   | r |
| Y | = | 0.2126729  0.7151522  0.0721750 | × | g |
| Z |   | 0.0193339  0.1191920  0.9503041 |   | b |
```

### XYZ → Lab 변환 공식

```
L* = 116 × f(Y/Yn) - 16
a* = 500 × (f(X/Xn) - f(Y/Yn))
b* = 200 × (f(Y/Yn) - f(Z/Zn))
```

**구간 함수 f(t):**
```
f(t) = t^(1/3)                        (t > ε일 때)
f(t) = (κt + 16) / 116                (t ≤ ε일 때)
```

**CIE 표준 상수 (정확한 분수값 권장):**
| 상수 | 근사값 | 정확한 분수 |
|------|--------|-------------|
| ε (epsilon) | 0.008856 | **216/24389** |
| κ (kappa) | 903.3 | **24389/27** |
| κε | 8.0 | **216/27 = 8** |

### 백색점 기준값

| 광원 | Xn | Yn | Zn | 용도 |
|------|-----|-----|-----|------|
| **D65** | 0.95047 | 1.00000 | 1.08883 | sRGB 표준, 모니터 |
| D50 | 0.96422 | 1.00000 | 0.82521 | 인쇄, ICC 프로파일 |

### 역변환 공식 (Lab → RGB)

**Lab → XYZ:**
```
fy = (L* + 16) / 116
fx = (a* / 500) + fy
fz = fy - (b* / 200)

X = Xn × fx³           (fx³ > ε일 때, 아니면 (116×fx - 16) / κ)
Y = Yn × ((L* + 16) / 116)³   (L* > 8일 때, 아니면 L* / κ)
Z = Zn × fz³           (fz³ > ε일 때, 아니면 (116×fz - 16) / κ)
```

**XYZ → Linear RGB (D65 역행렬):**
```
|  3.2404542  -1.5371385  -0.4985314 |
| -0.9692660   1.8760108   0.0415560 |
|  0.0556434  -0.2040259   1.0572252 |
```

**Linear → sRGB (감마 적용):**
```
V = 12.92 × v                         (v ≤ 0.0031308일 때)
V = 1.055 × v^(1/2.4) - 0.055         (v > 0.0031308일 때)
```

---

## 아시아인 피부 Lab 범위 및 웜톤/쿨톤 분류

다수의 피부과학 연구에서 측정된 아시아인 피부색 데이터를 종합하면, 아시아인은 Caucasian 대비 **b* 값이 높아 황색도가 강한** 특징을 보인다. 얼굴 부위별로도 상당한 차이가 있어 측정 부위 표준화가 중요하다.

### 아시아인 피부 Lab 측정값

| 인구집단 | L* (명도) | a* (적색도) | b* (황색도) | ITA° | 출처 |
|----------|-----------|-------------|-------------|------|------|
| 한국인 (n=148) | 64.15 ± 4.86 | 8.96 ± 2.65 | 18.34 ± 2.39 | 45-60° | Yun et al. 2010 |
| 한국인 (n=600) | 61.75 | 9.56 | 17.08 | - | Korean Skin DB |
| 중국인 (n=1092) | 58-68 | 9-12 | 17-22 | 40-60° | Li et al. 2022 |
| 일본인 | 62-68 | 9-11 | 17-20 | 45-58° | Various studies |
| Caucasian (비교) | 65-70 | 10-12 | 14-18 | - | Xiao et al. 2017 |

**핵심 발견:** 민족 간 차이는 주로 **b* (황색도) 축**에서 발생하며, **a* (적색도)는 민족 간 거의 동일**하다. 아시아인 피부가 더 황색을 띄는 이유는 카로틴(carotene) 색소 함량이 높기 때문이다.

### 웜톤 vs 쿨톤 분류 기준

피부 언더톤 판별에는 **색상각(Hue Angle)** 방식이 가장 신뢰도 높다:

```
h° = arctan(b* / a*) × 180/π
```

| 분류 지표 | 웜톤 (Warm) | 쿨톤 (Cool) | 뉴트럴 (Neutral) |
|-----------|-------------|-------------|------------------|
| **색상각 h°** | > 60° | < 55° | 55-60° |
| **b* 값** | > 18-20 | < 17 | 17-19 |
| **a*/b* 비율** | < 0.5 | > 0.55 | 0.5-0.55 |
| **시각적 특징** | 황금빛, 복숭아빛 | 분홍빛, 장밋빛 | 균형잡힌 톤 |

**Sony AI 연구 기준:** h° = **55°**를 웜/쿨 경계로 제시 (2023)

### ITA (Individual Typology Angle) 계산

ITA는 **피부 밝기 분류**에 사용되며 멜라닌 함량과 선형 상관관계를 가진다:

```
ITA° = arctan[(L* - 50) / b*] × 180/π
```

| ITA° 범위 | 피부 유형 | 설명 |
|-----------|-----------|------|
| > 55° | Very Light | 매우 밝은 피부 |
| 41° ~ 55° | Light | 밝은 피부 |
| 28° ~ 41° | Intermediate | 중간 피부 |
| 10° ~ 28° | Tan | 태닝된 피부 |
| -30° ~ 10° | Brown | 어두운 피부 |
| < -30° | Dark | 매우 어두운 피부 |

**주의:** ITA는 a* 채널을 무시하므로 웜/쿨 언더톤 판별에는 부적합하다. 밝기 분류 전용으로 사용해야 한다.

---

## 계절 타입별 Lab 임계값

퍼스널컬러 4계절/12계절 시스템은 **3개의 독립 축**으로 분류된다: 명도(Value), 온도(Temperature), 채도(Chroma). 각 축은 Lab 색공간 파라미터에 직접 매핑된다.

### Lab 파라미터와 퍼스널컬러 차원 매핑

| 퍼스널컬러 차원 | Lab 파라미터 | 계산식 |
|----------------|--------------|--------|
| Light/Deep (명암) | **L*** | 직접 사용 |
| Warm/Cool (온도) | **h°** (색상각) | arctan(b*/a*) × 180/π |
| Bright/Muted (채도) | **C*** (크로마) | √(a*² + b*²) |

### 4계절 타입 분류 기준

| 계절 | 온도 (h°) | 명도 (L*) | 채도 (C*) | 특징 |
|------|-----------|-----------|-----------|------|
| **봄 Spring** | > 58° (Warm) | > 55 (Light) | > 18 (Bright) | 밝고 따뜻하고 선명한 |
| **여름 Summer** | < 55° (Cool) | > 55 (Light) | < 18 (Muted) | 밝고 시원하고 부드러운 |
| **가을 Autumn** | > 58° (Warm) | < 55 (Deep) | < 18 (Muted) | 어둡고 따뜻하고 차분한 |
| **겨울 Winter** | < 55° (Cool) | < 55 (Deep) | > 18 (Bright) | 어둡고 시원하고 선명한 |

### 12계절 세부 분류표

각 12시즌은 **주요 특성(Primary)**과 **보조 특성(Secondary)**으로 구분된다:

| 12시즌 | Primary | Secondary | L* 기준 | h° 기준 | C* 기준 |
|--------|---------|-----------|---------|---------|---------|
| Light Spring | Light | Warm | > 60 | > 58° | 15-22 |
| True Spring | Warm | Bright | 50-60 | > 65° | > 22 |
| Bright Spring | Bright | Warm | 50-60 | > 58° | > 25 |
| Light Summer | Light | Cool | > 58 | < 55° | 12-18 |
| True Summer | Cool | Muted | 50-58 | < 52° | < 15 |
| Soft Summer | Muted | Cool | 50-58 | 52-58° | < 12 |
| Soft Autumn | Muted | Warm | 50-58 | 55-62° | < 15 |
| True Autumn | Warm | Muted | 45-55 | > 60° | 12-18 |
| Deep Autumn | Deep | Warm | < 50 | > 58° | 12-18 |
| Deep Winter | Deep | Cool | < 48 | < 55° | 18-25 |
| True Winter | Cool | Bright | 45-55 | < 50° | > 22 |
| Bright Winter | Bright | Cool | 50-58 | < 55° | > 28 |

### 계절 판별 의사결정 트리

```
[Step 1: 온도 판별]
IF h° > 60° OR b* > 15  →  WARM (봄 or 가을)
IF h° < 55° OR b* < 12  →  COOL (여름 or 겨울)
IF 55° ≤ h° ≤ 60°       →  NEUTRAL (보조 지표 확인)

[Step 2: 명도 판별]
IF L* > 55  →  LIGHT (봄 or 여름)
IF L* < 50  →  DEEP (가을 or 겨울)
IF 50 ≤ L* ≤ 55  →  MEDIUM (채도로 결정)

[Step 3: 채도 판별]
C* = √(a*² + b*²)
IF C* > 20  →  BRIGHT (봄 or 겨울)
IF C* < 15  →  MUTED (여름 or 가을)
IF 15 ≤ C* ≤ 20  →  MEDIUM (주요 특성으로 결정)
```

---

## 조명 영향 보정 알고리즘

실제 환경에서 촬영된 이미지는 조명 색온도의 영향을 받아 피부색이 왜곡된다. **D65 표준광원으로의 변환**이 필수이며, Bradford 변환이 가장 정확한 결과를 제공한다.

### Bradford 색순응 변환 (권장)

**Bradford 행렬 M_A:**
```
|  0.8951000   0.2664000  -0.1614000 |
| -0.7502000   1.7135000   0.0367000 |
|  0.0389000  -0.0685000   1.0296000 |
```

**역행렬 M_A⁻¹:**
```
|  0.9869929  -0.1470543   0.1599627 |
|  0.4323053   0.5183603   0.0492912 |
| -0.0085287   0.0400428   0.9684867 |
```

**변환 공식:**
```
1. 원본 백색점(source) → cone response: [ρs, γs, βs] = M_A × [Xs, Ys, Zs]
2. 목표 백색점(D65) → cone response: [ρd, γd, βd] = M_A × [Xd, Yd, Zd]
3. 스케일 행렬: diag(ρd/ρs, γd/γs, βd/βs)
4. 최종 변환 행렬: M = M_A⁻¹ × scale × M_A
5. 변환 적용: [X', Y', Z'] = M × [X, Y, Z]
```

### 백색점 추정 알고리즘

**Gray World (회색 세계 가정):**
```
illuminant_R = mean(R_channel)
illuminant_G = mean(G_channel)  
illuminant_B = mean(B_channel)
```
장면 전체 평균이 무채색이라고 가정. 다양한 색이 포함된 일반 장면에 적합.

**White Patch (흰색 패치 가정):**
```
illuminant_R = percentile(R_channel, 99)
illuminant_G = percentile(G_channel, 99)
illuminant_B = percentile(B_channel, 99)
```
가장 밝은 영역이 흰색이라고 가정. 상위 1% 제외로 과노출 방지.

**ColorChecker 기준 (가장 정확):**
X-Rite ColorChecker의 흰색 패치(Patch 19)에서 직접 측정.

### 자주 사용하는 광원 변환 행렬

**Illuminant A → D65 (Bradford):**
```
|  0.8446965  -0.1179225   0.3948108 |
| -0.1366303   1.1041226   0.1291718 |
|  0.0798489  -0.1348999   3.1924009 |
```

**D50 → D65 (Bradford):**
```
|  0.9555766  -0.0230393   0.0631636 |
| -0.0282895   1.0099416   0.0210077 |
|  0.0122982  -0.0204830   1.3299098 |
```

---

## 구현 시 필수 체크리스트

**색공간 변환 관련:**
- [ ] sRGB 입력값을 0-1 범위로 정규화
- [ ] 감마 보정 시 구간별 함수 사용 (단순 2.2 지수 아님)
- [ ] 분수 상수 사용 (216/24389, 24389/27) - 라운드트립 정확도 향상
- [ ] D65 백색점 값 정확히 적용 (0.95047, 1.0, 1.08883)
- [ ] Lab→RGB 역변환 후 gamut clipping 처리 (0-1 범위 제한)

**피부톤 분석 관련:**
- [ ] 측정 영역 표준화 (볼, 턱선 권장 / 이마 피함)
- [ ] 색상각 h° 계산 시 arctan2 사용 (사분면 처리)
- [ ] ITA는 밝기 분류 전용, 웜/쿨 분류에는 h° 사용
- [ ] 여러 포인트 측정 후 평균값 사용

**조명 보정 관련:**
- [ ] 입력 이미지 반드시 선형화 (감마 제거) 후 처리
- [ ] Bradford 변환 행렬 정확히 적용
- [ ] ColorChecker 사용 시 선형화된 기준값 사용
- [ ] 처리 완료 후 sRGB 감마 재적용

---

## TypeScript 코드 예시

### RGB ↔ Lab 변환

```typescript
// sRGB 감마 보정 함수
function srgbToLinear(c: number): number {
  const normalized = c / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const clamped = Math.max(0, Math.min(1, c));
  return clamped <= 0.0031308
    ? Math.round(clamped * 12.92 * 255)
    : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
}

// D65 백색점 상수
const D65 = { X: 0.95047, Y: 1.00000, Z: 1.08883 };

// CIE 상수 (정확한 분수값)
const EPSILON = 216 / 24389;  // 0.008856
const KAPPA = 24389 / 27;      // 903.3

// RGB to Lab 변환
function rgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  // Step 1: sRGB → Linear RGB
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  // Step 2: Linear RGB → XYZ (D65)
  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750;
  const z = lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041;

  // Step 3: XYZ → Lab
  const xr = x / D65.X;
  const yr = y / D65.Y;
  const zr = z / D65.Z;

  const f = (t: number) => t > EPSILON ? Math.cbrt(t) : (KAPPA * t + 16) / 116;

  const fx = f(xr);
  const fy = f(yr);
  const fz = f(zr);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

// Lab to RGB 변환
function labToRgb(L: number, a: number, b: number): { r: number; g: number; b: number } {
  // Step 1: Lab → XYZ
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const fInv = (t: number) => {
    const t3 = t * t * t;
    return t3 > EPSILON ? t3 : (116 * t - 16) / KAPPA;
  };

  const x = D65.X * fInv(fx);
  const y = D65.Y * (L > 8 ? Math.pow((L + 16) / 116, 3) : L / KAPPA);
  const z = D65.Z * fInv(fz);

  // Step 2: XYZ → Linear RGB
  const lr = x *  3.2404542 + y * -1.5371385 + z * -0.4985314;
  const lg = x * -0.9692660 + y *  1.8760108 + z *  0.0415560;
  const lb = x *  0.0556434 + y * -0.2040259 + z *  1.0572252;

  // Step 3: Linear → sRGB
  return {
    r: linearToSrgb(lr),
    g: linearToSrgb(lg),
    b: linearToSrgb(lb)
  };
}
```

### 피부톤 분류 함수

```typescript
interface SkinToneAnalysis {
  L: number;
  a: number;
  b: number;
  chroma: number;
  hueAngle: number;
  ita: number;
  undertone: 'warm' | 'cool' | 'neutral';
  brightness: 'very-light' | 'light' | 'intermediate' | 'tan' | 'brown' | 'dark';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  season12: string;
}

function analyzeSkinTone(r: number, g: number, b: number): SkinToneAnalysis {
  const lab = rgbToLab(r, g, b);
  
  // 채도(Chroma) 계산
  const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  
  // 색상각(Hue Angle) 계산 (0-360도)
  let hueAngle = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  if (hueAngle < 0) hueAngle += 360;
  
  // ITA 계산
  const ita = Math.atan((lab.L - 50) / lab.b) * (180 / Math.PI);
  
  // 언더톤 판별 (색상각 기준)
  let undertone: 'warm' | 'cool' | 'neutral';
  if (hueAngle > 60) undertone = 'warm';
  else if (hueAngle < 55) undertone = 'cool';
  else undertone = 'neutral';
  
  // 밝기 분류 (ITA 기준)
  let brightness: SkinToneAnalysis['brightness'];
  if (ita > 55) brightness = 'very-light';
  else if (ita > 41) brightness = 'light';
  else if (ita > 28) brightness = 'intermediate';
  else if (ita > 10) brightness = 'tan';
  else if (ita > -30) brightness = 'brown';
  else brightness = 'dark';
  
  // 4계절 분류
  const isWarm = hueAngle > 58;
  const isLight = lab.L > 55;
  const isBright = chroma > 18;
  
  let season: SkinToneAnalysis['season'];
  if (isWarm && isLight) season = 'spring';
  else if (!isWarm && isLight) season = 'summer';
  else if (isWarm && !isLight) season = 'autumn';
  else season = 'winter';
  
  // 12계절 세부 분류
  const season12 = determine12Season(lab.L, hueAngle, chroma, season);
  
  return {
    L: lab.L,
    a: lab.a,
    b: lab.b,
    chroma,
    hueAngle,
    ita,
    undertone,
    brightness,
    season,
    season12
  };
}

function determine12Season(L: number, h: number, C: number, baseSeason: string): string {
  // 주요 특성 판별
  const isVeryLight = L > 60;
  const isDeep = L < 48;
  const isVeryBright = C > 22;
  const isVeryMuted = C < 12;
  
  switch (baseSeason) {
    case 'spring':
      if (isVeryLight) return 'Light Spring';
      if (isVeryBright) return 'Bright Spring';
      return 'True Spring';
    case 'summer':
      if (isVeryLight) return 'Light Summer';
      if (isVeryMuted) return 'Soft Summer';
      return 'True Summer';
    case 'autumn':
      if (isVeryMuted && L > 50) return 'Soft Autumn';
      if (isDeep) return 'Deep Autumn';
      return 'True Autumn';
    case 'winter':
      if (isDeep) return 'Deep Winter';
      if (isVeryBright) return 'Bright Winter';
      return 'True Winter';
    default:
      return baseSeason;
  }
}
```

### 조명 보정 (Bradford 변환)

```typescript
// XYZ 백색점 타입
interface WhitePoint {
  X: number;
  Y: number;
  Z: number;
}

// 표준 백색점
const ILLUMINANTS: Record<string, WhitePoint> = {
  D65: { X: 0.95047, Y: 1.00000, Z: 1.08883 },
  D50: { X: 0.96422, Y: 1.00000, Z: 0.82521 },
  A:   { X: 1.09850, Y: 1.00000, Z: 0.35585 }
};

// Bradford 행렬
const BRADFORD_M = [
  [ 0.8951000,  0.2664000, -0.1614000],
  [-0.7502000,  1.7135000,  0.0367000],
  [ 0.0389000, -0.0685000,  1.0296000]
];

const BRADFORD_M_INV = [
  [ 0.9869929, -0.1470543,  0.1599627],
  [ 0.4323053,  0.5183603,  0.0492912],
  [-0.0085287,  0.0400428,  0.9684867]
];

// 행렬 연산 유틸리티
function matMul(m: number[][], v: number[]): number[] {
  return m.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
}

function matMulMat(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => 
    b[0].map((_, j) => row.reduce((sum, _, k) => sum + a[i][k] * b[k][j], 0))
  );
}

// Bradford 변환 행렬 계산
function computeBradfordMatrix(source: WhitePoint, dest: WhitePoint): number[][] {
  // 원본/목표 백색점의 cone response
  const srcCone = matMul(BRADFORD_M, [source.X, source.Y, source.Z]);
  const dstCone = matMul(BRADFORD_M, [dest.X, dest.Y, dest.Z]);
  
  // 스케일 행렬
  const scale = [
    [dstCone[0] / srcCone[0], 0, 0],
    [0, dstCone[1] / srcCone[1], 0],
    [0, 0, dstCone[2] / srcCone[2]]
  ];
  
  // 최종 변환 행렬: M_inv × scale × M
  const temp = matMulMat(scale, BRADFORD_M);
  return matMulMat(BRADFORD_M_INV, temp);
}

// 이미지 조명 보정
function correctIllumination(
  imageRgb: Uint8ClampedArray,
  width: number,
  height: number,
  sourceIlluminant: WhitePoint,
  destIlluminant: WhitePoint = ILLUMINANTS.D65
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(imageRgb.length);
  const bradfordMatrix = computeBradfordMatrix(sourceIlluminant, destIlluminant);
  
  // sRGB→XYZ 행렬
  const RGB_TO_XYZ = [
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.0721750],
    [0.0193339, 0.1191920, 0.9503041]
  ];
  
  const XYZ_TO_RGB = [
    [ 3.2404542, -1.5371385, -0.4985314],
    [-0.9692660,  1.8760108,  0.0415560],
    [ 0.0556434, -0.2040259,  1.0572252]
  ];
  
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    
    // 1. sRGB → Linear
    const lr = srgbToLinear(imageRgb[idx]);
    const lg = srgbToLinear(imageRgb[idx + 1]);
    const lb = srgbToLinear(imageRgb[idx + 2]);
    
    // 2. Linear RGB → XYZ
    const xyz = matMul(RGB_TO_XYZ, [lr, lg, lb]);
    
    // 3. Bradford 변환 적용
    const xyzAdapted = matMul(bradfordMatrix, xyz);
    
    // 4. XYZ → Linear RGB
    const rgbLinear = matMul(XYZ_TO_RGB, xyzAdapted);
    
    // 5. Linear → sRGB (with clamping)
    result[idx] = linearToSrgb(rgbLinear[0]);
    result[idx + 1] = linearToSrgb(rgbLinear[1]);
    result[idx + 2] = linearToSrgb(rgbLinear[2]);
    result[idx + 3] = imageRgb[idx + 3]; // Alpha 유지
  }
  
  return result;
}

// Gray World 백색점 추정
function estimateIlluminantGrayWorld(
  imageRgb: Uint8ClampedArray,
  width: number,
  height: number
): WhitePoint {
  let sumR = 0, sumG = 0, sumB = 0;
  const pixelCount = width * height;
  
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    sumR += srgbToLinear(imageRgb[idx]);
    sumG += srgbToLinear(imageRgb[idx + 1]);
    sumB += srgbToLinear(imageRgb[idx + 2]);
  }
  
  const avgR = sumR / pixelCount;
  const avgG = sumG / pixelCount;
  const avgB = sumB / pixelCount;
  
  // Linear RGB → XYZ
  const RGB_TO_XYZ = [
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.0721750],
    [0.0193339, 0.1191920, 0.9503041]
  ];
  
  const xyz = matMul(RGB_TO_XYZ, [avgR, avgG, avgB]);
  
  // Y=1로 정규화
  return {
    X: xyz[0] / xyz[1],
    Y: 1.0,
    Z: xyz[2] / xyz[1]
  };
}
```

---

## 참고 자료

**색공간 변환 표준:**
- IEC 61966-2-1:1999/2003 (sRGB 국제 표준)
- CIE Publication 15:2004 (Colorimetry)
- Bruce Lindbloom Color Calculator (brucelindbloom.com)

**아시아인 피부색 연구:**
- Yun et al. (2010), "Skin color distribution of Korean measured by spectrophotometer", Skin Research and Technology
- Li et al. (2022), "Skin color distribution in Chinese women", Journal of Cosmetic Dermatology (n=1092)
- Xiao et al. (2017), "Skin colour variation across ethnic groups", Skin Research and Technology (n=960)
- Del Bino et al. (2013), "Variations in skin colour and ITA angle", British Journal of Dermatology
- Chardon et al. (1991), "Skin colour typology and suntanning pathways", International Journal of Cosmetic Science

**퍼스널컬러 시스템:**
- Korean Patent KR101944198B1 (퍼스널컬러 진단 방법)
- PCCS (Practical Color Coordinate System) - 일본 색채연구소
- Color Me Beautiful (Carole Jackson) - 4계절 시스템 원전

**조명 보정:**
- CIE Technical Report 160:2004 (Chromatic Adaptation)
- Fairchild, M. D. "Color Appearance Models" (3rd ed.)
- Bianco et al. (2015), "Color constancy using CNNs", CVPR