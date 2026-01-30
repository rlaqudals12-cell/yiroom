# 색채학 원리

> 이 문서는 이룸 플랫폼의 퍼스널컬러 분석(PC-1, PC-2) 기반 원리를 설명한다.
>
> **소스 리서치**: CIE-3-R1, PC-2-R1

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 퍼스널컬러 분석 시스템"

- 모든 조명 조건에서 99% 이상 정확도로 12톤 분류
- 실시간 피부색 변화 추적 및 계절별 최적 팔레트 자동 업데이트
- 제품(파운데이션, 립스틱 등) 색상과 피부톤 ΔE*00 < 2 완벽 매칭
- 개인별 색각 특성까지 반영한 맞춤형 색상 추천
```

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 카메라 센서 | sRGB 색역 한계, 광대역 색상 표현 불가 |
| 조명 환경 | 비표준 조명에서 색온도 추정 오차 존재 |
| 개인 변동성 | 계절/컨디션/메이크업에 따른 피부색 변동 |
| 문화적 편향 | 한국인 최적화로 다른 인종 정확도 감소 가능 |

### 100점 기준

- 12톤 분류 정확도 95% 이상 (전문 컬러리스트 대비)
- 웜/쿨톤 판정 정확도 98% 이상
- CIEDE2000 색차 계산 오차 < 0.01
- 조명 보정 후 Lab 측정 오차 ΔE < 3
- 파운데이션 매칭 사용자 만족도 90% 이상

### 현재 목표: 85%

- Lab 색공간 기반 정밀 톤 분석 완성
- CIEDE2000 전체 공식 구현 및 검증
- 한국인 피부 특성 반영 임계값 조정
- 4계절 → 12톤 2단계 분류 알고리즘
- Bradford 조명 보정 적용

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 실시간 피부 추적 | 하드웨어 의존성 높음 | AR 기술 성숙 시 |
| 색각 이상 대응 | MVP 범위 초과 | 접근성 강화 Phase |
| 다인종 최적화 | 한국 시장 우선 | 글로벌 확장 시 |
| CIE CAM16 적용 | 복잡도 대비 효과 미미 | 정밀도 요구 증가 시 |

---

## 1. Lab 색공간 기초

### 1.1 색공간 선택 이유

**RGB 대신 Lab을 사용하는 이유**:

| RGB | Lab |
|-----|-----|
| 장치 의존적 | 장치 독립적 |
| 인간 지각과 불일치 | 인간 지각 기반 설계 |
| 비균일 색차 | ΔE로 균일한 색차 측정 |
| 피부톤 분석 어려움 | a*, b* 축으로 톤 분석 용이 |

### 1.2 Lab 색공간 정의

```
L* (Lightness): 0 ~ 100 (검정 ~ 흰색)
a* (Green-Red): -128 ~ +127 (초록 ~ 빨강)
b* (Blue-Yellow): -128 ~ +127 (파랑 ~ 노랑)

웜톤 = +a* (붉은기) + b* (노란기)
쿨톤 = -a* (초록기) - b* (파란기)
```

### 1.3 파생 지표

**Chroma (채도)**:
```
C* = √(a*² + b*²)
```

**Hue Angle (색상각)**:
```
h° = atan2(b*, a*) × (180/π)
음수면 +360°
```

**ITA (Individual Typology Angle)**:
```
ITA = arctan[(L* - 50) / b*] × (180/π)

분류:
> 55°    Very Light
41-55°   Light
28-41°   Intermediate
10-28°   Tan
-30-10°  Brown
< -30°   Dark
```

---

## 2. RGB → Lab 변환

### 2.1 변환 파이프라인

```
RGB → [감마 보정] → Linear RGB → [행렬] → XYZ → [정규화] → Lab
```

### 2.2 감마 보정 (sRGB → Linear)

```typescript
function srgbToLinear(c: number): number {
  const normalized = c / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}
```

### 2.3 RGB → XYZ 변환

**D65 기준 행렬**:
```
| X |   | 0.4124564  0.3575761  0.1804375 |   | R_linear |
| Y | = | 0.2126729  0.7151522  0.0721750 | × | G_linear |
| Z |   | 0.0193339  0.1191920  0.9503041 |   | B_linear |
```

**D65 백색점**: X=95.047, Y=100.0, Z=108.883

### 2.4 XYZ → Lab 변환

**정확한 상수**:
```
ε = 216/24389 ≈ 0.008856
κ = 24389/27  ≈ 903.3
```

**f 함수**:
```typescript
function f(t: number): number {
  return t > ε ? Math.cbrt(t) : (κ * t + 16) / 116;
}
```

**Lab 계산**:
```typescript
const fx = f(X / 95.047);
const fy = f(Y / 100.0);
const fz = f(Z / 108.883);

const L = 116 * fy - 16;
const a = 500 * (fx - fy);
const b = 200 * (fy - fz);
```

### 2.5 전체 변환 함수

```typescript
interface LabColor {
  L: number;  // 0-100
  a: number;  // -128 ~ +127
  b: number;  // -128 ~ +127
}

function rgbToLab(r: number, g: number, b: number): LabColor {
  // 0. 입력 검증 및 gamut 클램핑
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  r = clamp(r);
  g = clamp(g);
  b = clamp(b);

  // 1. sRGB → Linear RGB
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  // 2. Linear RGB → XYZ (D65)
  const X = rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375;
  const Y = rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.0721750;
  const Z = rLin * 0.0193339 + gLin * 0.1191920 + bLin * 0.9503041;

  // 3. XYZ → Lab
  const ε = 216 / 24389;
  const κ = 24389 / 27;

  const xr = X / 0.95047;
  const yr = Y / 1.0;
  const zr = Z / 1.08883;

  const fx = xr > ε ? Math.cbrt(xr) : (κ * xr + 16) / 116;
  const fy = yr > ε ? Math.cbrt(yr) : (κ * yr + 16) / 116;
  const fz = zr > ε ? Math.cbrt(zr) : (κ * zr + 16) / 116;

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}
```

---

## 3. 한국인 피부색 특성

### 3.1 Lab 평균값 (학술 데이터)

| 출처 | L* | a* | b* |
|------|----|----|-----|
| Puzovic (2012) | 64.15 | 8.96 | 18.34 |
| Son (2013) | 62.1 | 11.2 | 18.8 |
| 이룸 권장 중앙값 | 63.0 | 10.0 | 18.5 |

**특징**:
- L*: 60-70 범위 (중간 밝기)
- a*: 8-11 (약간 붉은기)
- b*: 17-19 (**높은 황색 언더톤** - 동아시아 특징)

### 3.2 Fitzpatrick 타입 분포

| 타입 | 비율 | L* 범위 | ITA 범위 |
|------|------|---------|----------|
| II | 10% | 67-73 | 41-55° |
| III | 60% | 60-67 | 28-41° |
| IV | 25% | 53-60 | 10-28° |
| V | 5% | 45-53 | -30-10° |

### 3.3 성별/연령 차이

| 그룹 | L* 보정 | a* 보정 |
|------|---------|---------|
| 여성 20대 | +2 | -0.5 |
| 여성 40대 | 0 | +0.5 |
| 남성 20대 | -1 | +0.3 |
| 남성 40대 | -2 | +0.8 |

---

## 4. 웜톤/쿨톤 판정

### 4.1 1차 판정: Hue Angle (h°)

**한국인 최적 임계값**:

```
h° < 55° → 쿨톤 (Cool)
h° > 60° → 웜톤 (Warm)
55° ≤ h° ≤ 60° → 뉴트럴 (중립)
```

### 4.2 2차 판정: b* 값

```
b* > 20 → 웜톤 경향 강화
b* < 15 → 쿨톤 경향 강화
```

### 4.3 3차 판정: a* 값

```
a* > 12 → 분홍/붉은 언더톤 (뉴트럴-쿨)
a* < 8 → 노란/올리브 언더톤 (뉴트럴-웜)
```

### 4.4 종합 판정 알고리즘

```typescript
type Undertone = 'warm' | 'cool' | 'neutral';

function determineUndertone(lab: LabColor): {
  undertone: Undertone;
  confidence: number;
  details: string;
} {
  const hue = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  const h = hue < 0 ? hue + 360 : hue;

  // 1차: Hue Angle 기반
  let baseScore = 0;
  if (h < 55) baseScore = -1;      // 쿨
  else if (h > 60) baseScore = 1;  // 웜
  // else 뉴트럴 (0)

  // 2차: b* 보정
  const bAdjust = (lab.b - 17.5) / 10;  // 한국인 평균 기준

  // 3차: a* 보정
  const aAdjust = (10 - lab.a) / 10;  // 높은 a*는 쿨 경향

  const finalScore = baseScore + bAdjust * 0.3 + aAdjust * 0.2;

  let undertone: Undertone;
  let confidence: number;

  if (finalScore > 0.3) {
    undertone = 'warm';
    confidence = Math.min(95, 70 + Math.abs(finalScore) * 25);
  } else if (finalScore < -0.3) {
    undertone = 'cool';
    confidence = Math.min(95, 70 + Math.abs(finalScore) * 25);
  } else {
    undertone = 'neutral';
    confidence = 60 + (1 - Math.abs(finalScore) / 0.3) * 20;
  }

  return { undertone, confidence, details: `h°=${h.toFixed(1)}, score=${finalScore.toFixed(2)}` };
}
```

---

## 5. 계절 타입 분류

### 5.1 4계절 시스템

| 계절 | 언더톤 | 명도 (L*) | 채도 (C*) | 특징 |
|------|--------|----------|----------|------|
| **봄 (Spring)** | Warm | 높음 (>65) | 높음 (>20) | 밝고 선명한 컬러 |
| **가을 (Autumn)** | Warm | 낮음 (<60) | 낮음 (<18) | 깊고 차분한 컬러 |
| **여름 (Summer)** | Cool | 높음 (>62) | 낮음 (<18) | 밝고 부드러운 컬러 |
| **겨울 (Winter)** | Cool | 낮음 (<58) | 높음 (>20) | 어둡고 선명한 컬러 |

### 5.2 4계절 분류 알고리즘

```typescript
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

function classifySeason(
  undertone: 'warm' | 'cool',
  L: number,
  C: number
): Season {
  if (undertone === 'warm') {
    // 밝고 선명 = 봄, 어둡고 뮤트 = 가을
    return (L > 62 && C > 19) ? 'spring' : 'autumn';
  } else {
    // 밝고 뮤트 = 여름, 어둡고 선명 = 겨울
    return (L > 60 && C < 19) ? 'summer' : 'winter';
  }
}
```

### 5.3 12톤 시스템

각 계절을 3가지 세부 톤으로 분류:

| 계절 | 세부 톤 | 영문명 | 특징 |
|------|---------|--------|------|
| **봄** | 봄 웜 라이트 | Light Spring | L* 높음, 밝고 화사 |
| | 봄 웜 트루 | True Spring | 전형적 봄, 밸런스 |
| | 봄 웜 브라이트 | Bright Spring | C* 높음, 선명하고 생기 |
| **여름** | 여름 쿨 라이트 | Light Summer | L* 높음, 연하고 부드러움 |
| | 여름 쿨 트루 | True Summer | 전형적 여름, 차분 |
| | 여름 쿨 뮤트 | Muted Summer | C* 낮음, 그레이시 |
| **가을** | 가을 웜 트루 | True Autumn | 전형적 가을, 깊고 풍부 |
| | 가을 웜 딥 | Deep Autumn | L* 낮음, 진하고 무게감 |
| | 가을 웜 뮤트 | Muted Autumn | C* 낮음, 흙빛, 자연스러움 |
| **겨울** | 겨울 쿨 트루 | True Winter | 전형적 겨울, 강렬 |
| | 겨울 쿨 딥 | Deep Winter | L* 낮음, 깊고 풍부 |
| | 겨울 쿨 브라이트 | Bright Winter | C* 높음, 비비드, 선명 |

### 5.4 분류 제한사항

> ⚠️ **퍼스널컬러 분류 한계**
>
> | 한계 | 설명 |
> |------|------|
> | **확률적 추정** | AI 분류는 확률 기반이며, 동일인도 조건에 따라 다른 결과 가능 |
> | **경계 사례** | 55-60% 신뢰도 구간의 결과는 "경계 톤"으로 해석해야 함 |
> | **문화적 편향** | 훈련 데이터가 특정 인구 집단에 편중될 수 있음 |
> | **뉴트럴 처리** | 뉴트럴 톤은 웜/쿨 양쪽에 적합할 수 있으나 단일 분류로 표시됨 |
>
> **권장 사용 방식**:
> - 결과를 "절대적 정답"이 아닌 "스타일링 참고 지침"으로 활용
> - 85% 미만 신뢰도 결과는 "재분석 권장" 표시
> - 전문 컬러리스트 상담 병행 권장

### 5.5 4계절 Lab 좌표 범위 (정밀 기준)

> **핵심**: 피부색 Lab 값에서 계절 타입을 결정하는 정밀 범위 테이블

#### 5.5.1 4계절 피부색 Lab 범위

**기본 4계절 분류 기준** (한국인 피부 기준 조정됨):

| 계절 | L* 범위 | a* 범위 | b* 범위 | C* (채도) | h° (색상각) |
|------|---------|---------|---------|-----------|-------------|
| **봄 (Spring)** | 62-75 | 6-14 | 18-28 | 20-32 | 58°-72° |
| **여름 (Summer)** | 58-72 | 5-12 | 12-20 | 14-22 | 55°-68° |
| **가을 (Autumn)** | 52-65 | 8-18 | 20-32 | 22-36 | 60°-78° |
| **겨울 (Winter)** | 48-62 | 4-14 | 10-20 | 14-26 | 48°-65° |

**시각화**:

```
┌─────────────────────────────────────────────────────────────────┐
│                  4계절 Lab 색공간 분포도                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              b* (Yellow)                                         │
│                ↑                                                 │
│           32  │        ┌────────┐                               │
│               │        │ 가을   │                               │
│           28  │   ┌────┤  Warm  ├────┐                          │
│               │   │ 봄 └────────┘    │                          │
│           24  │   │ Warm             │                          │
│               │   └──────────────────┘                          │
│           20  │   ┌──────────────────┐                          │
│               │   │ 여름      겨울   │                          │
│           16  │   │ Cool      Cool   │                          │
│               │   └──────────────────┘                          │
│           12  │                                                 │
│               └──────────────────────────→ a* (Red)              │
│                   4    8    12   16   20                        │
│                                                                  │
│   Warm = 높은 b* (황색 언더톤)                                    │
│   Cool = 낮은 b* (청색/분홍 언더톤)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.5.2 12톤 세부 Lab 범위

**봄 (Spring) 웜톤 3종**:

| 세부 톤 | L* 범위 | a* 범위 | b* 범위 | 특징 |
|---------|---------|---------|---------|------|
| **Light Spring** | 68-75 | 6-10 | 18-24 | 가장 밝고 화사함 |
| **True Spring** | 62-68 | 8-12 | 20-26 | 전형적 봄 웜 |
| **Bright Spring** | 60-70 | 10-14 | 22-28 | 선명하고 생기 |

**봄 톤 대표 피부색 Lab 값**:

```typescript
const SPRING_SKIN_REFERENCE = {
  lightSpring: { L: 71, a: 8, b: 21 },   // 밝고 복숭아빛
  trueSpring:  { L: 65, a: 10, b: 23 },  // 따뜻한 아이보리
  brightSpring: { L: 66, a: 12, b: 25 }, // 선명한 살구빛
};
```

**여름 (Summer) 쿨톤 3종**:

| 세부 톤 | L* 범위 | a* 범위 | b* 범위 | 특징 |
|---------|---------|---------|---------|------|
| **Light Summer** | 66-72 | 5-9 | 14-18 | 연하고 부드러움 |
| **True Summer** | 60-66 | 7-11 | 14-18 | 전형적 여름 쿨 |
| **Muted Summer** | 58-65 | 6-10 | 12-16 | 회색빛, 차분 |

**여름 톤 대표 피부색 Lab 값**:

```typescript
const SUMMER_SKIN_REFERENCE = {
  lightSummer: { L: 69, a: 7, b: 16 },   // 연한 로즈
  trueSummer:  { L: 63, a: 9, b: 16 },   // 부드러운 핑크
  mutedSummer: { L: 61, a: 8, b: 14 },   // 회색빛 로즈
};
```

**가을 (Autumn) 웜톤 3종**:

| 세부 톤 | L* 범위 | a* 범위 | b* 범위 | 특징 |
|---------|---------|---------|---------|------|
| **True Autumn** | 58-65 | 10-16 | 22-28 | 전형적 가을 웜 |
| **Deep Autumn** | 52-58 | 12-18 | 24-32 | 깊고 풍부함 |
| **Muted Autumn** | 55-62 | 8-14 | 20-26 | 흙빛, 자연스러움 |

**가을 톤 대표 피부색 Lab 값**:

```typescript
const AUTUMN_SKIN_REFERENCE = {
  trueAutumn: { L: 61, a: 13, b: 25 },   // 황금빛 베이지
  deepAutumn: { L: 55, a: 15, b: 28 },   // 깊은 카라멜
  mutedAutumn: { L: 58, a: 11, b: 23 },  // 부드러운 테라코타
};
```

**겨울 (Winter) 쿨톤 3종**:

| 세부 톤 | L* 범위 | a* 범위 | b* 범위 | 특징 |
|---------|---------|---------|---------|------|
| **True Winter** | 52-60 | 8-14 | 12-18 | 전형적 겨울 쿨 |
| **Deep Winter** | 48-55 | 10-14 | 12-18 | 깊고 강렬 |
| **Bright Winter** | 55-65 | 6-12 | 10-16 | 선명하고 청명 |

**겨울 톤 대표 피부색 Lab 값**:

```typescript
const WINTER_SKIN_REFERENCE = {
  trueWinter:  { L: 56, a: 11, b: 15 },  // 차갑고 선명
  deepWinter:  { L: 51, a: 12, b: 15 },  // 깊은 올리브
  brightWinter: { L: 60, a: 9, b: 13 },  // 청명한 아이보리
};
```

#### 5.5.3 계절 판정 Decision Tree

```typescript
/**
 * Lab 값에서 12톤 계절 타입 결정
 *
 * Decision Flow:
 * 1. 언더톤 판정 (웜/쿨)
 * 2. 명도(L*) 기반 계절 판정
 * 3. 채도(C*) 기반 세부 톤 판정
 */
interface SeasonDecision {
  season: Season;
  subtype: 'light' | 'true' | 'bright' | 'muted' | 'deep';
  confidence: number;
  labDistance: number;  // 대표값과의 거리
}

function decideSeasonFromLab(lab: LabColor): SeasonDecision {
  // 1. 파생 지표 계산
  const C = Math.sqrt(lab.a ** 2 + lab.b ** 2);  // 채도
  const h = Math.atan2(lab.b, lab.a) * (180 / Math.PI);  // 색상각
  const hue = h < 0 ? h + 360 : h;

  // 2. 언더톤 판정 (한국인 기준 조정)
  const isWarm = lab.b > 19 || hue > 58;  // 높은 b* 또는 높은 h°

  // 3. 계절 판정
  let season: Season;
  let subtype: string;

  if (isWarm) {
    // 웜톤: 봄 또는 가을
    if (lab.L > 62 && C > 20) {
      season = 'spring';
      // 봄 세부 톤
      if (lab.L > 68) subtype = 'light';
      else if (C > 25) subtype = 'bright';
      else subtype = 'true';
    } else {
      season = 'autumn';
      // 가을 세부 톤
      if (lab.L < 56) subtype = 'deep';
      else if (C < 20) subtype = 'muted';
      else subtype = 'true';
    }
  } else {
    // 쿨톤: 여름 또는 겨울
    if (lab.L > 60 && C < 22) {
      season = 'summer';
      // 여름 세부 톤
      if (lab.L > 66) subtype = 'light';
      else if (C < 16) subtype = 'muted';
      else subtype = 'true';
    } else {
      season = 'winter';
      // 겨울 세부 톤
      if (lab.L < 55) subtype = 'deep';
      else if (C > 20) subtype = 'bright';
      else subtype = 'true';
    }
  }

  // 4. 신뢰도 계산 (대표값과의 거리 기반)
  const reference = getSeasonReference(season, subtype);
  const distance = calculateLabDistance(lab, reference);
  const confidence = Math.max(50, 100 - distance * 3);

  return {
    season,
    subtype: subtype as SeasonDecision['subtype'],
    confidence,
    labDistance: distance,
  };
}

function calculateLabDistance(lab1: LabColor, lab2: LabColor): number {
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 +
    (lab1.a - lab2.a) ** 2 +
    (lab1.b - lab2.b) ** 2
  );
}
```

#### 5.5.4 경계 영역 처리

**경계 케이스 정의**:

| 경계 | 조건 | 처리 방법 |
|------|------|----------|
| 웜/쿨 경계 | 56° < h° < 62° | "뉴트럴" 표시, 양쪽 추천 |
| 봄/가을 경계 | 60 < L* < 64 | "웜 뉴트럴" 표시 |
| 여름/겨울 경계 | 58 < L* < 62 | "쿨 뉴트럴" 표시 |
| Light/True 경계 | 66 < L* < 69 | 신뢰도 감소 (-10%) |

```typescript
function handleBoundaryCase(lab: LabColor): string[] {
  const warnings: string[] = [];
  const h = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  const hue = h < 0 ? h + 360 : h;

  // 웜/쿨 경계
  if (hue >= 56 && hue <= 62) {
    warnings.push('웜톤과 쿨톤의 경계에 있습니다. 양쪽 컬러 모두 어울릴 수 있습니다.');
  }

  // 명도 경계
  if (lab.L >= 60 && lab.L <= 64) {
    warnings.push('명도가 경계에 있어 계절 분류가 불확실할 수 있습니다.');
  }

  // 채도 경계
  const C = Math.sqrt(lab.a ** 2 + lab.b ** 2);
  if (C >= 18 && C <= 22) {
    warnings.push('채도가 중간 범위로 Muted/True/Bright 구분이 어려울 수 있습니다.');
  }

  return warnings;
}
```

#### 5.5.5 한국인 특화 조정

**한국인 피부 특성 반영**:

| 조정 항목 | 표준 값 | 한국인 조정 값 | 이유 |
|----------|---------|---------------|------|
| 웜/쿨 기준 b* | 17 | 19 | 황색 언더톤 높음 |
| 웜/쿨 기준 h° | 58° | 60° | 동일 이유 |
| 가을 웜 L* 상한 | 65 | 67 | 대부분 가을 웜 분포 |
| 여름 쿨 C* 하한 | 16 | 14 | 뮤트 톤 많음 |

```typescript
const KOREAN_SEASON_ADJUSTMENTS = {
  // 언더톤 판정 조정
  warmCoolThreshold: {
    standard: { b: 17, hue: 58 },
    korean:   { b: 19, hue: 60 },  // +2, +2°
  },

  // 계절 경계 조정
  seasonBoundaries: {
    standard: {
      springAutumn: 62,    // L* 경계
      summerWinter: 58,    // L* 경계
    },
    korean: {
      springAutumn: 64,    // L* 경계 +2
      summerWinter: 60,    // L* 경계 +2
    },
  },

  // 채도 경계 조정
  chromaBoundaries: {
    standard: { mutedTrue: 16, trueBright: 22 },
    korean:   { mutedTrue: 14, trueBright: 20 },  // -2 씩
  },
};
```

### 5.6 12톤 분류 알고리즘

```typescript
interface TwelveToneResult {
  season: Season;
  subtype: 'light' | 'true' | 'bright' | 'muted' | 'deep';
  fullName: string;
  koreanName: string;
}

function classifyTwelveTone(
  undertone: 'warm' | 'cool',
  L: number,
  C: number
): TwelveToneResult {
  const season = classifySeason(undertone, L, C);

  let subtype: string;
  let koreanName: string;

  switch (season) {
    case 'spring':
      if (L > 68) {
        subtype = 'light';
        koreanName = '봄 웜 라이트';
      } else if (C > 22) {
        subtype = 'bright';
        koreanName = '봄 웜 브라이트';
      } else {
        subtype = 'true';
        koreanName = '봄 웜 트루';
      }
      break;

    case 'summer':
      if (L > 67) {
        subtype = 'light';
        koreanName = '여름 쿨 라이트';
      } else if (C < 15) {
        subtype = 'muted';
        koreanName = '여름 쿨 뮤트';
      } else {
        subtype = 'true';
        koreanName = '여름 쿨 트루';
      }
      break;

    case 'autumn':
      if (L < 55) {
        subtype = 'deep';
        koreanName = '가을 웜 딥';
      } else if (C < 16) {
        subtype = 'muted';
        koreanName = '가을 웜 뮤트';
      } else {
        subtype = 'true';
        koreanName = '가을 웜 트루';
      }
      break;

    case 'winter':
      if (L < 52) {
        subtype = 'deep';
        koreanName = '겨울 쿨 딥';
      } else if (C > 23) {
        subtype = 'bright';
        koreanName = '겨울 쿨 브라이트';
      } else {
        subtype = 'true';
        koreanName = '겨울 쿨 트루';
      }
      break;
  }

  return {
    season,
    subtype: subtype as TwelveToneResult['subtype'],
    fullName: `${subtype.charAt(0).toUpperCase() + subtype.slice(1)} ${season.charAt(0).toUpperCase() + season.slice(1)}`,
    koreanName,
  };
}
```

---

## 6. 한국 시장 분포

### 6.1 12톤 분포 (잼페이스 139만건)

| 순위 | 유형 | 비율 |
|------|------|------|
| 1 | 가을 웜 트루 | 22.8% |
| 2 | 여름 쿨 트루 | 18.4% |
| 3 | 봄 웜 트루 | 18.2% |
| 4 | 가을 웜 뮤트 | 11.7% |
| 5 | 여름 쿨 뮤트 | 10.5% |
| 6 | 겨울 쿨 트루 | 10.4% |
| 7-12 | 기타 | 8.0% |

### 6.2 시사점

- **웜톤 우세**: 봄+가을 = 52.7% (쿨톤 47.3%)
- **가을 웜이 최다**: 한국인 높은 황색 언더톤(b*) 반영
- **극단 톤 희소**: Light/Bright/Deep < 5%

---

## 7. 조명 보정 (Chromatic Adaptation)

### 7.1 필요성

```
실내 조명 (2700K~3500K) → 실제보다 웜톤으로 측정
형광등 (4000K~5000K) → 실제보다 쿨톤으로 측정
자연광 D65 (6500K) → 기준 조명
```

### 7.2 Bradford 변환

**목표**: 측정 조명(소스)에서 D65(목표)로 변환

**Bradford 행렬**:
```
M_Bradford = | 0.8951  0.2664 -0.1614 |
             |-0.7502  1.7135  0.0367 |
             | 0.0389 -0.0685  1.0296 |
```

**변환 과정**:
```typescript
function bradfordAdapt(
  xyz: [number, number, number],
  sourceWhite: [number, number, number],
  targetWhite: [number, number, number] = [0.95047, 1.0, 1.08883]  // D65
): [number, number, number] {
  const M = [
    [0.8951, 0.2664, -0.1614],
    [-0.7502, 1.7135, 0.0367],
    [0.0389, -0.0685, 1.0296],
  ];

  // 소스/타겟 백색점을 LMS로 변환
  const srcLMS = multiplyMatrix(M, sourceWhite);
  const tgtLMS = multiplyMatrix(M, targetWhite);

  // 스케일 행렬
  const scale = [
    tgtLMS[0] / srcLMS[0],
    tgtLMS[1] / srcLMS[1],
    tgtLMS[2] / srcLMS[2],
  ];

  // 적용
  const lms = multiplyMatrix(M, xyz);
  const adaptedLMS = [
    lms[0] * scale[0],
    lms[1] * scale[1],
    lms[2] * scale[2],
  ];

  // 역변환
  return multiplyMatrix(invertMatrix(M), adaptedLMS);
}
```

### 7.3 일반 조명 백색점

| 조명 | CCT | X | Y | Z |
|------|-----|---|---|---|
| D50 | 5003K | 0.9642 | 1.0 | 0.8251 |
| D55 | 5503K | 0.9568 | 1.0 | 0.9214 |
| **D65** | 6504K | 0.9505 | 1.0 | 1.0890 |
| A (텅스텐) | 2856K | 1.0985 | 1.0 | 0.3558 |
| F2 (형광) | 4230K | 0.9914 | 1.0 | 0.6739 |

---

## 8. 색상 조화 이론

### 8.1 조화 유형

| 유형 | 설명 | 공식 |
|------|------|------|
| **유사색** | 인접 색상 | Δh° < 30° |
| **보색** | 반대 색상 | Δh° ≈ 180° |
| **분할보색** | 보색 양옆 | Δh° ≈ 150° 또는 210° |
| **3색** | 120° 간격 | Δh° = 120° |
| **4색** | 90° 간격 | Δh° = 90° |
| **톤온톤** | 동일 h°, 다른 L*/C* | Δh° = 0° |

### 8.2 계절별 추천 조화

| 계절 | 1순위 조화 | 2순위 조화 | 피해야 할 조화 |
|------|-----------|-----------|---------------|
| **봄** | 유사색 (따뜻한 톤끼리) | 톤온톤 | 보색 (차가운 색) |
| **여름** | 톤온톤 (파스텔) | 유사색 | 채도 높은 보색 |
| **가을** | 유사색 (어스톤) | 분할보색 | 원색 |
| **겨울** | 보색 (강한 대비) | 3색 | 뮤트/파스텔 |

### 8.3 색상 추천 알고리즘

```typescript
interface ColorRecommendation {
  hex: string;
  name: string;
  harmony: string;
  matchScore: number;
}

function recommendColors(
  season: Season,
  subtype: string,
  baseLab: LabColor
): ColorRecommendation[] {
  const recommendations: ColorRecommendation[] = [];

  // 계절별 팔레트에서 유사색 추출
  const palette = SEASON_PALETTES[season][subtype];

  for (const color of palette) {
    const colorLab = hexToLab(color.hex);
    const deltaE = calculateCIEDE2000(baseLab, colorLab);

    // ΔE < 10: 매우 유사, 10-20: 조화로움, > 20: 대비
    let matchScore: number;
    let harmony: string;

    if (deltaE < 10) {
      matchScore = 95;
      harmony = 'tone-on-tone';
    } else if (deltaE < 20) {
      matchScore = 85;
      harmony = 'analogous';
    } else if (deltaE < 40) {
      matchScore = 70;
      harmony = 'complementary';
    } else {
      matchScore = 50;
      harmony = 'contrast';
    }

    recommendations.push({
      hex: color.hex,
      name: color.name,
      harmony,
      matchScore,
    });
  }

  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
}
```

---

## 9. 제품 매칭

### 9.1 CIEDE2000 색차

#### 9.1.1 개요

CIEDE2000 (ΔE*00)은 CIE 142-2001 표준에서 정의된 색차 공식으로, 기존 CIE76 (ΔE*ab)과 CIE94 (ΔE*94)의 한계를 개선하여 **인간의 색상 지각과 가장 일치**하는 색차를 계산합니다.

**주요 개선점**:
| 항목 | CIE76 | CIEDE2000 |
|------|-------|-----------|
| 명도 불균일성 | 미처리 | SL 스케일링으로 보정 |
| 채도 불균일성 | 미처리 | SC 스케일링으로 보정 |
| 색상 불균일성 | 미처리 | SH 스케일링으로 보정 |
| 청색 영역 문제 | 미처리 | RT 회전 항으로 보정 |
| 회색 근처 a* 보정 | 미처리 | a' 보정으로 처리 |

**참고 문헌**:
- CIE 142-2001. "Improvement to industrial colour-difference evaluation"
- Sharma, G., Wu, W., & Dalal, E. N. (2005). "The CIEDE2000 color-difference formula: Implementation notes, supplementary test data, and mathematical observations"

#### 9.1.2 전체 CIEDE2000 공식

**수학적 정의**:

$$
\Delta E_{00} = \sqrt{
  \left(\frac{\Delta L'}{k_L S_L}\right)^2 +
  \left(\frac{\Delta C'}{k_C S_C}\right)^2 +
  \left(\frac{\Delta H'}{k_H S_H}\right)^2 +
  R_T \frac{\Delta C'}{k_C S_C} \frac{\Delta H'}{k_H S_H}
}
$$

#### 9.1.3 가중치 파라미터 (kL, kC, kH)

**기본값**: kL = kC = kH = 1

| 산업 | kL | kC | kH | 설명 |
|------|----|----|----|----|
| **참조 조건** | 1 | 1 | 1 | CIE 표준 기본값 |
| **텍스타일** | 2 | 1 | 1 | 명도 차이에 덜 민감 |
| **그래픽/인쇄** | 1 | 1 | 1 | 기본값 사용 |
| **화장품/피부톤** | 1 | 1 | 1 | 기본값 사용 (권장) |
| **자동차 도장** | 1.5 | 1 | 1 | 명도 차이 완화 |

> **이룸 권장**: 피부톤 매칭에서는 **kL=1, kC=1, kH=1** 기본값 사용.
> 파운데이션 매칭 시 명도 차이가 더 중요하므로 기본값 유지.

#### 9.1.4 스케일링 함수 (SL, SC, SH)

##### 명도 스케일링 (SL)

$$
S_L = 1 + \frac{0.015 (\bar{L}' - 50)^2}{\sqrt{20 + (\bar{L}' - 50)^2}}
$$

- **역할**: 중간 명도(L*≈50) 근처에서 색차 인지가 더 민감함을 보정
- **특징**: L*=50에서 SL=1, 밝거나 어두운 영역에서 SL > 1

##### 채도 스케일링 (SC)

$$
S_C = 1 + 0.045 \bar{C}'
$$

- **역할**: 채도가 높을수록 색차 인지가 덜 민감함을 보정
- **특징**: 무채색(C'=0)에서 SC=1, 채도 증가에 따라 선형 증가

##### 색상 스케일링 (SH)

$$
S_H = 1 + 0.015 \bar{C}' T
$$

여기서 T는:

$$
T = 1 - 0.17 \cos(\bar{h}' - 30°) + 0.24 \cos(2\bar{h}') + 0.32 \cos(3\bar{h}' + 6°) - 0.20 \cos(4\bar{h}' - 63°)
$$

- **역할**: 색상각에 따른 색차 민감도 차이 보정
- **특징**: 노란색/주황색 영역(h'≈60-120°)에서 민감도 높음

#### 9.1.5 채도 보정 (C')

Lab 색공간의 **a* 축 비대칭성**을 보정하기 위해 a'를 계산합니다:

$$
a' = a^* \left(1 + G\right)
$$

여기서 G는:

$$
G = 0.5 \left(1 - \sqrt{\frac{\bar{C}^{*7}}{\bar{C}^{*7} + 25^7}}\right)
$$

**보정된 채도 계산**:

$$
C' = \sqrt{a'^2 + b^{*2}}
$$

**해석**:
- **G ≈ 0.5** (무채색, C̄*=0): a'가 약 50% 증가
- **G → 0** (고채도, C̄*>>25): 보정 없음

> **목적**: 무채색 근처에서 a* 축이 인간 지각과 불일치하는 문제 해결.
> 회색 피부톤 분석 시 정확도 향상.

#### 9.1.6 색상각 보정 (h')

**보정된 색상각 계산**:

$$
h' = \text{atan2}(b^*, a') \times \frac{180}{\pi}
$$

음수일 경우 +360° 추가.

**색상각 차이 계산 (ΔH')**:

$$
\Delta H' = 2 \sqrt{C'_1 C'_2} \sin\left(\frac{\Delta h'}{2}\right)
$$

**Δh' 계산 (180° 경계 처리)**:

```typescript
function calculateDeltaHPrime(h1: number, h2: number, C1: number, C2: number): number {
  // 무채색 처리
  if (C1 * C2 === 0) return 0;

  let dh = h2 - h1;

  // 180° 경계 처리
  if (Math.abs(dh) > 180) {
    if (dh > 0) {
      dh -= 360;
    } else {
      dh += 360;
    }
  }

  return dh;
}
```

#### 9.1.7 회전 항 (Rotation Term, RT)

**청색 영역 보정**을 위한 회전 항:

$$
R_T = -\sin(2 \Delta\theta) \times R_C
$$

여기서:

$$
\Delta\theta = 30 \exp\left(-\left(\frac{\bar{h}' - 275}{25}\right)^2\right)
$$

$$
R_C = 2 \sqrt{\frac{\bar{C}'^7}{\bar{C}'^7 + 25^7}}
$$

**해석**:
- **Δθ**: 청색 영역(h'≈275°)에서 최대값
- **RC**: 고채도에서만 활성화 (저채도에서 RC→0)
- **목적**: 청색-보라색 영역에서 색상과 채도가 상호작용하는 현상 보정

#### 9.1.8 평균값 계산 (L̄', C̄', h̄')

**산술 평균**:

$$
\bar{L}' = \frac{L'_1 + L'_2}{2}, \quad \bar{C}' = \frac{C'_1 + C'_2}{2}
$$

**색상각 평균 (180° 경계 고려)**:

```typescript
function calculateMeanHuePrime(h1: number, h2: number, C1: number, C2: number): number {
  // 무채색 처리
  if (C1 === 0 && C2 === 0) return 0;
  if (C1 === 0) return h2;
  if (C2 === 0) return h1;

  const diff = Math.abs(h1 - h2);

  if (diff <= 180) {
    return (h1 + h2) / 2;
  }

  if (h1 + h2 < 360) {
    return (h1 + h2 + 360) / 2;
  }

  return (h1 + h2 - 360) / 2;
}
```

#### 9.1.9 TypeScript 전체 구현

```typescript
/**
 * CIEDE2000 전체 공식 구현
 *
 * @param lab1 - 첫 번째 Lab 색상
 * @param lab2 - 두 번째 Lab 색상
 * @param kL - 명도 가중치 (기본값: 1)
 * @param kC - 채도 가중치 (기본값: 1)
 * @param kH - 색상 가중치 (기본값: 1)
 * @returns ΔE*00 색차 값
 *
 * @see CIE 142-2001
 * @see Sharma, G., Wu, W., & Dalal, E. N. (2005)
 */
function calculateCIEDE2000(
  lab1: LabColor,
  lab2: LabColor,
  kL: number = 1,
  kC: number = 1,
  kH: number = 1
): number {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  // 도 → 라디안 변환 상수
  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;

  // ==========================================
  // Step 1: C*, h° 계산 (원본 Lab)
  // ==========================================
  const C1 = Math.sqrt(a1 ** 2 + b1 ** 2);
  const C2 = Math.sqrt(a2 ** 2 + b2 ** 2);
  const Cbar = (C1 + C2) / 2;

  // ==========================================
  // Step 2: a' 계산 (a* 보정)
  // ==========================================
  const Cbar7 = Cbar ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 25 ** 7)));

  const a1Prime = a1 * (1 + G);
  const a2Prime = a2 * (1 + G);

  // ==========================================
  // Step 3: C', h' 계산 (보정된 값)
  // ==========================================
  const C1Prime = Math.sqrt(a1Prime ** 2 + b1 ** 2);
  const C2Prime = Math.sqrt(a2Prime ** 2 + b2 ** 2);

  // h' 계산 (무채색 처리 포함)
  const h1Prime = C1Prime === 0 ? 0 : (Math.atan2(b1, a1Prime) * DEG + 360) % 360;
  const h2Prime = C2Prime === 0 ? 0 : (Math.atan2(b2, a2Prime) * DEG + 360) % 360;

  // ==========================================
  // Step 4: ΔL', ΔC', ΔH' 계산
  // ==========================================
  const dLPrime = L2 - L1;
  const dCPrime = C2Prime - C1Prime;

  // Δh' 계산 (180° 경계 처리)
  let dhPrime: number;
  if (C1Prime * C2Prime === 0) {
    dhPrime = 0;
  } else {
    dhPrime = h2Prime - h1Prime;
    if (dhPrime > 180) dhPrime -= 360;
    else if (dhPrime < -180) dhPrime += 360;
  }

  // ΔH' 계산
  const dHPrime = 2 * Math.sqrt(C1Prime * C2Prime) * Math.sin((dhPrime * RAD) / 2);

  // ==========================================
  // Step 5: 평균값 계산 (L̄', C̄', h̄')
  // ==========================================
  const LbarPrime = (L1 + L2) / 2;
  const CbarPrime = (C1Prime + C2Prime) / 2;

  // h̄' 계산 (180° 경계 고려)
  let hbarPrime: number;
  if (C1Prime * C2Prime === 0) {
    hbarPrime = h1Prime + h2Prime;
  } else {
    const hSum = h1Prime + h2Prime;
    const hDiff = Math.abs(h1Prime - h2Prime);

    if (hDiff <= 180) {
      hbarPrime = hSum / 2;
    } else if (hSum < 360) {
      hbarPrime = (hSum + 360) / 2;
    } else {
      hbarPrime = (hSum - 360) / 2;
    }
  }

  // ==========================================
  // Step 6: T 계산 (색상 가중 함수)
  // ==========================================
  const T =
    1 -
    0.17 * Math.cos((hbarPrime - 30) * RAD) +
    0.24 * Math.cos(2 * hbarPrime * RAD) +
    0.32 * Math.cos((3 * hbarPrime + 6) * RAD) -
    0.20 * Math.cos((4 * hbarPrime - 63) * RAD);

  // ==========================================
  // Step 7: SL, SC, SH 스케일링 함수
  // ==========================================
  const LbarPrime50 = LbarPrime - 50;
  const SL = 1 + (0.015 * LbarPrime50 ** 2) / Math.sqrt(20 + LbarPrime50 ** 2);
  const SC = 1 + 0.045 * CbarPrime;
  const SH = 1 + 0.015 * CbarPrime * T;

  // ==========================================
  // Step 8: RT 회전 항 (청색 영역 보정)
  // ==========================================
  const dTheta = 30 * Math.exp(-(((hbarPrime - 275) / 25) ** 2));
  const CbarPrime7 = CbarPrime ** 7;
  const RC = 2 * Math.sqrt(CbarPrime7 / (CbarPrime7 + 25 ** 7));
  const RT = -Math.sin(2 * dTheta * RAD) * RC;

  // ==========================================
  // Step 9: 최종 ΔE*00 계산
  // ==========================================
  const dLPrimeKLSL = dLPrime / (kL * SL);
  const dCPrimeKCSC = dCPrime / (kC * SC);
  const dHPrimeKHSH = dHPrime / (kH * SH);

  const deltaE00 = Math.sqrt(
    dLPrimeKLSL ** 2 +
    dCPrimeKCSC ** 2 +
    dHPrimeKHSH ** 2 +
    RT * dCPrimeKCSC * dHPrimeKHSH
  );

  return deltaE00;
}
```

#### 9.1.10 검증 테스트 데이터

Sharma et al. (2005) 논문의 참조 테스트 데이터:

| Sample | L*1 | a*1 | b*1 | L*2 | a*2 | b*2 | ΔE*00 (예상) |
|--------|-----|-----|-----|-----|-----|-----|--------------|
| 1 | 50.0000 | 2.6772 | -79.7751 | 50.0000 | 0.0000 | -82.7485 | 2.0425 |
| 2 | 50.0000 | 3.1571 | -77.2803 | 50.0000 | 0.0000 | -82.7485 | 2.8615 |
| 3 | 50.0000 | 2.8361 | -74.0200 | 50.0000 | 0.0000 | -82.7485 | 3.4412 |
| 4 | 50.0000 | -1.3802 | -84.2814 | 50.0000 | 0.0000 | -82.7485 | 1.0000 |
| 5 | 50.0000 | -1.1848 | -84.8006 | 50.0000 | 0.0000 | -82.7485 | 1.0000 |
| 6 | 50.0000 | -0.9009 | -85.5211 | 50.0000 | 0.0000 | -82.7485 | 1.0000 |
| ... | ... | ... | ... | ... | ... | ... | ... |

**테스트 코드**:

```typescript
// 검증 테스트
describe('CIEDE2000', () => {
  it('should match Sharma et al. test data', () => {
    const testCases = [
      { lab1: { L: 50, a: 2.6772, b: -79.7751 }, lab2: { L: 50, a: 0, b: -82.7485 }, expected: 2.0425 },
      { lab1: { L: 50, a: 3.1571, b: -77.2803 }, lab2: { L: 50, a: 0, b: -82.7485 }, expected: 2.8615 },
      // ... 추가 테스트 케이스
    ];

    testCases.forEach(({ lab1, lab2, expected }) => {
      const result = calculateCIEDE2000(lab1, lab2);
      expect(result).toBeCloseTo(expected, 4);  // 소수점 4자리 정확도
    });
  });
});
```

#### 9.1.11 피부톤 매칭 응용

**파운데이션 매칭 적용 예시**:

```typescript
function matchFoundationWithCIEDE2000(
  skinLab: LabColor,
  foundations: FoundationProduct[]
): FoundationMatch[] {
  return foundations
    .map(product => {
      const productLab = hexToLab(product.hex);

      // 전체 CIEDE2000 공식 사용 (기본 가중치)
      const deltaE = calculateCIEDE2000(skinLab, productLab);

      // 파운데이션은 정확한 매칭이 중요
      // ΔE*00 < 2: 거의 완벽 매칭
      // ΔE*00 2-4: 좋은 매칭
      // ΔE*00 4-6: 허용 가능
      // ΔE*00 > 6: 눈에 띄는 차이
      let matchScore: number;
      let matchLevel: string;

      if (deltaE < 2) {
        matchScore = 98;
        matchLevel = 'perfect';
      } else if (deltaE < 4) {
        matchScore = 85;
        matchLevel = 'good';
      } else if (deltaE < 6) {
        matchScore = 65;
        matchLevel = 'acceptable';
      } else {
        matchScore = Math.max(20, 50 - (deltaE - 6) * 5);
        matchLevel = 'poor';
      }

      return {
        productId: product.id,
        shade: product.shade,
        deltaE: Math.round(deltaE * 100) / 100,
        matchScore,
        matchLevel,
      };
    })
    .sort((a, b) => a.deltaE - b.deltaE);
}
```

#### 9.1.12 ΔE*00 해석 기준

| ΔE*00 | 인지 수준 | 파운데이션 매칭 | 립/아이 매칭 |
|-------|----------|----------------|-------------|
| < 1 | 구별 불가 | Perfect | - |
| 1-2 | 미세한 차이 (전문가만) | Excellent | Tone-on-tone |
| 2-3.5 | 인지 가능 | Good | Analogous |
| 3.5-5 | 명확한 차이 | Acceptable | Complementary |
| > 5 | 다른 색상 | Not recommended | Contrast |

> **Note**: CIEDE2000은 CIE76보다 **인간 지각에 더 가까운** 색차를 제공합니다.
> 동일한 숫자라도 CIEDE2000의 ΔE*00이 더 정확한 "지각적 차이"를 나타냅니다.

### 9.2 립스틱 매칭

```typescript
interface LipstickMatch {
  productId: string;
  name: string;
  brand: string;
  hex: string;
  matchScore: number;
  reason: string;
}

function matchLipstick(
  skinLab: LabColor,
  season: Season,
  products: LipstickProduct[]
): LipstickMatch[] {
  return products
    .map(product => {
      const productLab = hexToLab(product.hex);
      const deltaE = calculateCIEDE2000(skinLab, productLab);

      // 계절별 최적 립 색상 범위
      const seasonRange = LIPSTICK_RANGES[season];
      const inRange = isInLabRange(productLab, seasonRange);

      // 점수 계산
      let score = 100 - deltaE * 2;
      if (inRange) score += 15;
      if (product.season === season) score += 10;

      return {
        productId: product.id,
        name: product.name,
        brand: product.brand,
        hex: product.hex,
        matchScore: Math.min(100, Math.max(0, score)),
        reason: getMatchReason(deltaE, inRange),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
```

### 9.3 파운데이션 매칭

```typescript
// 파운데이션은 피부톤과 직접 매칭
function matchFoundation(
  skinLab: LabColor,
  products: FoundationProduct[]
): FoundationMatch[] {
  return products
    .map(product => {
      const productLab = hexToLab(product.hex);
      const deltaE = calculateCIEDE2000(skinLab, productLab);

      // 파운데이션은 ΔE < 3이 이상적
      let matchScore: number;
      if (deltaE < 2) matchScore = 98;
      else if (deltaE < 3) matchScore = 90;
      else if (deltaE < 5) matchScore = 75;
      else if (deltaE < 8) matchScore = 55;
      else matchScore = 30;

      return {
        productId: product.id,
        shade: product.shade,
        deltaE,
        matchScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
```

---

## 10. 구현 체크리스트

### 10.1 색공간 변환

- [ ] RGB → Lab 변환 정확도 검증 (colormine.org 비교)
- [ ] D65 백색점 사용 확인
- [ ] 감마 보정 적용 확인
- [ ] 정확한 상수 사용 (ε=216/24389, κ=24389/27)

### 10.2 톤 판정

- [ ] Hue Angle 한국인 임계값 적용 (55°/60°)
- [ ] b* 보정 로직 포함
- [ ] 신뢰도 점수 반환

### 10.3 계절 분류

- [ ] 4계절 → 12톤 2단계 분류
- [ ] 한국인 분포 반영 (가을웜 우세)
- [ ] 뉴트럴 케이스 처리

### 10.4 조명 보정

- [ ] CCT 감지 (image-processing.md 참조)
- [ ] Bradford 변환 적용
- [ ] 보정 전/후 값 로깅

### 10.5 제품 매칭

- [ ] CIEDE2000 색차 계산
- [ ] 계절별 팔레트 정의
- [ ] 매칭 이유 텍스트 제공

---

## 11. 제한 사항 및 면책

### 11.1 분석 한계

| 한계 | 설명 | 대응 |
|------|------|------|
| **조명 의존성** | 분석 결과는 촬영 조명에 크게 영향받음 | CIE-2 색온도 보정 적용 |
| **개인 변동성** | 동일인도 계절/컨디션에 따라 결과 변동 | 복수 분석 평균 권장 |
| **문화적 차이** | 색상 선호는 문화권에 따라 다름 | 참고용으로만 사용 |
| **색각 이상** | 색맹/색약 사용자는 결과 해석 제한 | 접근성 대안 필요 |

### 11.2 사용자 고지 문구

```typescript
const PERSONAL_COLOR_DISCLAIMER = `
이 분석 결과는 AI 기반 추정치이며, 전문 컬러 컨설턴트의
진단을 대체하지 않습니다. 조명 조건, 카메라 특성, 메이크업
유무에 따라 결과가 달라질 수 있습니다.

분석 결과는 참고용이며, 최종 색상 선택은 개인의 판단에
따릅니다.
`;
```

### 11.3 CIEDE2000 구현 노트

> ✅ **전체 공식 구현 완료**: 섹션 9.1에 CIE 2000 표준의 전체 CIEDE2000 공식이
> 문서화되어 있습니다. 구현 시 다음을 참조하세요:
>
> | 항목 | 섹션 |
> |------|------|
> | 가중치 파라미터 (kL, kC, kH) | [9.1.3](#913-가중치-파라미터-kl-kc-kh) |
> | 스케일링 함수 (SL, SC, SH) | [9.1.4](#914-스케일링-함수-sl-sc-sh) |
> | 채도 보정 (a', C') | [9.1.5](#915-채도-보정-c) |
> | 색상각 보정 (h', Δh') | [9.1.6](#916-색상각-보정-h) |
> | 회전 항 (RT) | [9.1.7](#917-회전-항-rotation-term-rt) |
> | TypeScript 전체 구현 | [9.1.9](#919-typescript-전체-구현) |
> | 검증 테스트 데이터 | [9.1.10](#9110-검증-테스트-데이터) |
>
> **관련 ADR**: [ADR-026](../adr/ADR-026-color-space-hsl-decision.md) - Lab vs HSL 색공간 선택 근거

---

## 12. 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서 | 설명 |
|------|------|
| [SDD-PERSONAL-COLOR-v2](../specs/SDD-PERSONAL-COLOR-v2.md) | 퍼스널컬러 v2 모듈 스펙, P3 원자 분해 |
| [SDD-S1-UX-IMPROVEMENT](../specs/SDD-S1-UX-IMPROVEMENT.md) | 분석 UX 스펙 (PC-1 포함) |
| [SDD-VISUAL-SKIN-REPORT](../specs/SDD-VISUAL-SKIN-REPORT.md) | 시각적 리포트 스펙 |
| [ADR-026](../adr/ADR-026-color-space-hsl-decision.md) | Lab vs HSL 색공간 선택 근거 |

### 관련 원리 문서

| 문서 | 설명 |
|------|------|
| [image-processing.md](./image-processing.md) | 이미지 품질/색온도 분석 |

---

## 13. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-001](../adr/ADR-001-core-image-engine.md) | Core Image Engine | RGB→Lab 변환, 퍼스널컬러 |
| [ADR-026](../adr/ADR-026-color-space-hsl-decision.md) | 색공간 HSL 결정 | Lab vs HSL 비교 |

---

**Version**: 1.3 | **Created**: 2026-01-16 | **Updated**: 2026-01-24
**소스 리서치**: CIE-3-R1, PC-2-R1, CIE 142-2001, Sharma et al. (2005)
**추가 내용**: CIEDE2000 전체 공식 (Section 9.1), 가중치/스케일링/회전 항 상세, TypeScript 구현, 검증 테스트 데이터
