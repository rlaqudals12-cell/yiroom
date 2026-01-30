# SDD: CIE-3 자동 화이트밸런스 보정 (Auto White Balance Correction)

> **Status**: ✅ Complete
> **Version**: 2.3
> **Created**: 2026-01-20
> **Updated**: 2026-01-24
> **Completion**: 100%
> **P3 Score**: 92/100 (v2.2: 90 → v2.3: 92, 성능 SLA + 한국 조명 Mock 추가)

> 퍼스널컬러/피부 분석의 정확도를 높이기 위한 이미지 색상 보정 파이프라인

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 조명 중립화 - 모든 환경에서 D65 표준 백색"

- Universal Adaptation: 모든 광원 (2000K~10000K) 완벽 적응, CCT 추정 ±50K
- D65 Convergence: 99%+ 백색점 수렴율, 색편차 ΔE < 1
- Multi-Illuminant: 복합 광원 (형광등+태양광) 분리 보정
- Real-time Processing: < 20ms@1080p (모바일 디바이스)
- Skin-Aware: 피부톤 95%+ 감지, 피부 영역 우선 보정
- HDR Support: 고다이나믹레인지 입력 처리 (10-bit)
```

### 물리적 한계

| 한계 | 설명 | 이룸 영향 |
|------|------|----------|
| **메타메리즘** | 다른 스펙트럼이 같은 RGB로 보임 | 동일 색상이 다른 조명에서 다르게 보일 수 있음 |
| **단일 광원 가정** | Von Kries는 단일 백색광 가정 | 복합 광원 (실내+실외) 분리 불가 |
| **sRGB 색역 제한** | 색역 외 색상은 클리핑됨 | 극단적 보정 시 색정보 손실 |
| **피부 검출 정확도** | YCbCr 범위 기반, 조명 영향 | 극심한 청색/황색 조명 시 오탐 |
| **계산 복잡도** | RGB→XYZ→LMS→XYZ→RGB 변환 | 고해상도 이미지 50ms 소요 |

### 100점 기준

| 지표 | 100점 기준 | 현재 목표 (MVP) | 달성률 |
|------|-----------|----------------|--------|
| **CCT 추정 정확도** | ±50K (모든 조명) | ±200K (형광등/백열등) | 25% |
| **D65 수렴율** | 99%+ (ΔE < 1) | 95% (ΔE < 3) | 96% |
| **피부 영역 감지율** | 95%+ | 85% | 89% |
| **처리 속도** | < 20ms@1080p | < 50ms@1080p | 40% |
| **복합 광원 분리** | 2개 이상 광원 | 단일 광원만 | 0% |
| **HDR 입력 처리** | 10-bit 지원 | 8-bit만 | 0% |
| **실시간 비디오 AWB** | 30fps 프레임 보정 | 정지 이미지만 | 0% |

**종합 달성률**: **43%** (MVP CIE-3 기본 AWB)

### 현재 목표

**43%** - MVP CIE-3 단일 광원 화이트밸런스 보정

#### ✅ 이번 구현 포함 (MVP)
- McCamy CCT 추정 알고리즘 (±200K) (계획)
- Von Kries 색채 적응 (단일 광원) (계획)
- Gray World 폴백 알고리즘 (계획)
- YCbCr 피부톤 감지 (85%+) (계획)
- Skin-Aware 보정 (비-피부 영역 우선) (계획)
- 신뢰도 계산 (gain/CCT/ratio 기반) (계획)

#### ⏳ 부분 구현 (추후 개선)
- CCT 추정: ±200K (목표 ±50K의 25%)
- 처리 속도: < 50ms (목표 20ms의 40%)
- 피부 감지: 85% (목표 95%의 89%)

#### ❌ 의도적 제외
- 복합 광원 분리: 2개 이상 광원 동시 존재 (Phase 2, 재검토 시점: 광원 분리 알고리즘 도입 시)
- 실시간 비디오 AWB: 프레임 단위 보정 (Phase 3, 재검토 시점: 비디오 분석 모듈 추가 시)
- HDR 이미지 보정: 10-bit 고다이나믹레인지 (Phase 3, 재검토 시점: HDR 입력 지원 시)
- 색역 외 색상 처리: sRGB 외 색공간 (Phase 4, 재검토 시점: Wide Color Gamut 디스플레이 대응 시)

### 의도적 제외 상세

| 제외 항목 | 이유 | 비용 | 재검토 시점 |
|----------|------|------|------------|
| **복합 광원 분리** | 광원 세그멘테이션 알고리즘 필요, 계산 복잡도 3배 | 개발 4주 + 성능 저하 | Mixed 조명 환경 분석 필요 시 (Phase 2) |
| **실시간 비디오 AWB** | 프레임 간 일관성 유지 알고리즘, 성능 저하 | 30fps → 15fps | 실시간 AR 메이크업/피팅 기능 도입 시 |
| **HDR 이미지 보정** | 10-bit 파이프라인, Tone mapping 필요 | 복잡도 2배 | HDR 센서 기기 대응 시 (iPhone 14+) |
| **색역 외 색상** | Display P3, Rec.2020 지원 | 호환성 테스트 4주 | Wide Color Gamut 디스플레이 대응 |
| **학습 기반 AWB** | 딥러닝 모델 (번들 +10MB), GPU 필수 | 번들 크기 200%, 추론 시간 +30ms | 정확도 한계 도달 시 (Phase 5) |

### 구현 현황

| 기능 | 상태 | 위치 |
|------|------|------|
| McCamy CCT 추정 알고리즘 | 📋 계획 | `lib/image-engine/cct-estimator.ts` |
| Von Kries 색채 적응 | 📋 계획 | `lib/image-engine/von-kries-adapter.ts` |
| Gray World 폴백 알고리즘 | 📋 계획 | `lib/image-engine/gray-world-fallback.ts` |
| YCbCr 피부톤 감지 | 📋 계획 | `lib/image-engine/skin-detector.ts` |
| Skin-Aware 보정 | 📋 계획 | `lib/image-engine/skin-aware-corrector.ts` |
| 신뢰도 계산 | 📋 계획 | `lib/image-engine/awb-confidence.ts` |
| D65 백색점 보정 | 📋 계획 | `lib/image-engine/d65-normalizer.ts` |

---

## 1. 개요

### 1.1 목적

- **조명 편향 제거**: 형광등(청색), 백열등(황색) 등 조명 색온도 영향 최소화
- **일관된 색상 분석**: 다양한 촬영 환경에서도 동일한 피부/옷 색상 추출
- **퍼스널컬러 정확도 향상**: 피부톤 기반 웜/쿨 판정의 신뢰도 증가

### 1.2 범위

| 항목 | 우선순위 | 복잡도 | 구현 상태 |
|------|----------|--------|----------|
| 색온도 추정 알고리즘 | 필수 | 중간 | 📋 계획 |
| Von Kries 변환 | 필수 | 중간 | 📋 계획 |
| Gray World 알고리즘 | 높음 | 낮음 | 📋 계획 |
| 피부톤 보정 후처리 | 높음 | 중간 | 📋 계획 |
| 실시간 프리뷰 보정 | 낮음 | 높음 | ⏳ 향후 |
| 수동 색온도 조절 UI | 낮음 | 낮음 | ⏳ 향후 |

### 1.3 관련 문서

- [ADR-001: Core Image Engine](../adr/ADR-001-core-image-engine.md)
- [ADR-026: HSL 색공간 결정](../adr/ADR-026-color-space-hsl-decision.md)
- [원리: 이미지 처리](../principles/image-processing.md)
- [원리: 색채학](../principles/color-science.md)

### 1.4 궁극의 형태 (P1)

| 항목 | 이상적 최종 상태 | 물리적 한계 | 현재 목표 |
|------|-----------------|------------|----------|
| **CCT 추정 정확도** | ±50K (모든 조명) | 극단적 색온도 (< 2500K, > 10000K) | **±200K** |
| **D65 수렴율** | 99%+ (완벽 보정) | 단일 광원 가정, 메타메리즘 | **95%** |
| **피부 영역 감지율** | 95%+ | 다양한 피부톤, 조명 영향 | **85%** |
| **처리 시간** | < 20ms | 고해상도 이미지 | **< 50ms** |
| **Von Kries 적응** | 모든 조명 완벽 적응 | 복합 광원 분리 불가 | **단일 광원** |

**현재 구현 목표**: 전체 궁극의 **80%**

**의도적 제외 (이번 버전)**:
- **복합 광원 분리**: 2개 이상 광원 동시 존재 시 분리 보정 (복잡도 높음)
- **실시간 비디오 AWB**: 프레임 단위 보정 (성능 제약)
- **HDR 이미지 보정**: 고다이나믹레인지 입력 처리 (입력 제한)
- **색역 외 색상 보정**: sRGB 색역 외 색상 처리 (표준 외)

---

## 2. 색온도 이론

### 2.1 색온도(CCT)와 조명

```
┌─────────────────────────────────────────────────────────────┐
│                    색온도 스펙트럼 (Kelvin)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1800K        3200K        5500K        6500K       10000K  │
│    │            │            │            │            │    │
│    ▼            ▼            ▼            ▼            ▼    │
│  촛불        백열등        태양광       형광등       청색광  │
│  (붉은)      (따뜻한)      (중립)      (차가운)     (파란)  │
│                                                              │
│  ◀───────── 웜톤 편향 ───────│─────── 쿨톤 편향 ─────────▶  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 색온도별 RGB 비율

| 색온도 (K) | R | G | B | 조명 예시 |
|-----------|---|---|---|----------|
| 1800 | 255 | 147 | 41 | 촛불 |
| 2700 | 255 | 180 | 107 | 따뜻한 백색 LED |
| 3000 | 255 | 191 | 125 | 할로겐 |
| 4000 | 255 | 211 | 168 | 자연광 형광등 |
| 5000 | 255 | 228 | 206 | 수평 일광 |
| 5500 | 255 | 236 | 224 | 정오 태양광 (기준) |
| 6500 | 255 | 249 | 253 | 흐린 날 |
| 7500 | 245 | 243 | 255 | 북향 하늘 |
| 10000 | 207 | 218 | 255 | 청색 하늘 |

### 2.3 색온도 추정 공식

```
색온도 추정 = f(R_avg, G_avg, B_avg)

McCamy's Formula (근사):
n = (x - 0.3320) / (0.1858 - y)
CCT = 449 * n³ + 3525 * n² + 6823.3 * n + 5520.33

where x, y = CIE xy chromaticity coordinates from RGB
```

### 2.4 sRGB → XYZ → xy 변환 파이프라인

#### 2.4.1 sRGB 감마 해제 (선형화)

```
┌─────────────────────────────────────────────────────────────┐
│              sRGB → Linear RGB 변환                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  각 채널 C ∈ {R, G, B}, 값 범위 [0, 1]:                     │
│                                                              │
│  C_linear = │ C / 12.92           if C ≤ 0.04045           │
│             │ ((C + 0.055) / 1.055)^2.4  otherwise          │
│                                                              │
│  예시: sRGB(200, 150, 100) / 255 = (0.784, 0.588, 0.392)   │
│        → Linear(0.573, 0.302, 0.127)                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4.2 Linear RGB → XYZ 변환 (D65 기준)

```
┌─────────────────────────────────────────────────────────────┐
│              Linear RGB → XYZ 변환 행렬                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [X]   [0.4124564  0.3575761  0.1804375]   [R_linear]       │
│  [Y] = [0.2126729  0.7151522  0.0721750] × [G_linear]       │
│  [Z]   [0.0193339  0.1191920  0.9503041]   [B_linear]       │
│                                                              │
│  D65 백색점: X=95.047, Y=100.0, Z=108.883                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4.3 XYZ → xy 색도 좌표

```
┌─────────────────────────────────────────────────────────────┐
│              XYZ → xy 색도 좌표 변환                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  x = X / (X + Y + Z)                                        │
│  y = Y / (X + Y + Z)                                        │
│                                                              │
│  D65 백색점: x = 0.31271, y = 0.32902                       │
│                                                              │
│  주의: X + Y + Z = 0인 경우 기본값 사용 (완전 검정색)        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 알고리즘 상세

### 3.1 Gray World 알고리즘

> 가정: 이미지 전체의 평균 색상은 회색(중립)에 가까워야 함

```typescript
/**
 * Gray World 화이트밸런스 보정
 *
 * 원리: 세상의 평균 색상은 회색(R=G=B)이어야 한다
 * 방법: 각 채널의 평균을 전체 평균으로 스케일링
 */
interface GrayWorldResult {
  correctedImageData: ImageData;
  gainR: number;
  gainG: number;
  gainB: number;
  estimatedCCT: number;
}

function applyGrayWorld(imageData: ImageData): GrayWorldResult {
  const pixels = imageData.data;
  let sumR = 0, sumG = 0, sumB = 0;
  const pixelCount = pixels.length / 4;

  // 1. 각 채널 평균 계산
  for (let i = 0; i < pixels.length; i += 4) {
    sumR += pixels[i];
    sumG += pixels[i + 1];
    sumB += pixels[i + 2];
  }

  const avgR = sumR / pixelCount;
  const avgG = sumG / pixelCount;
  const avgB = sumB / pixelCount;

  // 2. 전체 평균 (목표 회색)
  const avgGray = (avgR + avgG + avgB) / 3;

  // 3. 채널별 게인 계산
  const gainR = avgGray / avgR;
  const gainG = avgGray / avgG;
  const gainB = avgGray / avgB;

  // 4. 보정 적용
  const correctedData = new Uint8ClampedArray(pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    correctedData[i] = Math.min(255, pixels[i] * gainR);
    correctedData[i + 1] = Math.min(255, pixels[i + 1] * gainG);
    correctedData[i + 2] = Math.min(255, pixels[i + 2] * gainB);
    correctedData[i + 3] = pixels[i + 3]; // Alpha 유지
  }

  // 5. 색온도 추정
  const estimatedCCT = estimateCCT(avgR, avgG, avgB);

  return {
    correctedImageData: new ImageData(
      correctedData,
      imageData.width,
      imageData.height
    ),
    gainR,
    gainG,
    gainB,
    estimatedCCT,
  };
}
```

### 3.2 Von Kries 크로마틱 적응 변환

> D65 (6500K, 표준 일광)를 기준으로 색상 변환

#### 3.2.1 Bradford Transform 수학적 기반

```
┌─────────────────────────────────────────────────────────────┐
│           Bradford Chromatic Adaptation Transform            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. XYZ → LMS 변환 (Bradford 행렬 M_A):                     │
│                                                              │
│      [L]   [ 0.8951   0.2664  -0.1614]   [X]                │
│      [M] = [-0.7502   1.7135   0.0367] × [Y]                │
│      [S]   [ 0.0389  -0.0685   1.0296]   [Z]                │
│                                                              │
│  2. LMS → XYZ 역변환 (M_A^-1):                              │
│                                                              │
│      [X]   [ 0.9870  -0.1471   0.1600]   [L]                │
│      [Y] = [ 0.4323   0.5184   0.0493] × [M]                │
│      [Z]   [-0.0085   0.0400   0.9685]   [S]                │
│                                                              │
│  3. 적응 비율 계산:                                          │
│                                                              │
│      ρ_L = L_d / L_s                                        │
│      ρ_M = M_d / M_s    (d = destination, s = source)       │
│      ρ_S = S_d / S_s                                        │
│                                                              │
│  4. 대각 행렬 D:                                             │
│                                                              │
│      [ρ_L  0    0  ]                                        │
│  D = [0    ρ_M  0  ]                                        │
│      [0    0    ρ_S]                                        │
│                                                              │
│  5. 전체 변환 행렬 M:                                        │
│                                                              │
│      M = M_A^-1 × D × M_A                                   │
│                                                              │
│  6. 색상 적응:                                               │
│                                                              │
│      [X']       [X]                                         │
│      [Y'] = M × [Y]                                         │
│      [Z']       [Z]                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2.2 주요 조명의 백색점 좌표

| 조명 | CCT (K) | X | Y | Z | x | y |
|------|---------|-----|------|--------|-------|-------|
| A (백열등) | 2856 | 109.85 | 100.0 | 35.58 | 0.4476 | 0.4074 |
| D50 (인쇄) | 5003 | 96.42 | 100.0 | 82.49 | 0.3457 | 0.3585 |
| D55 | 5503 | 95.68 | 100.0 | 92.15 | 0.3324 | 0.3474 |
| **D65 (목표)** | **6504** | **95.047** | **100.0** | **108.883** | **0.3127** | **0.3290** |
| D75 | 7504 | 94.97 | 100.0 | 122.62 | 0.2990 | 0.3149 |
| F2 (형광등) | 4230 | 99.19 | 100.0 | 67.39 | 0.3721 | 0.3751 |
| F11 (TL84) | 4000 | 100.97 | 100.0 | 64.35 | 0.3805 | 0.3769 |

#### 3.2.3 TypeScript 구현

```typescript
/**
 * Von Kries Chromatic Adaptation Transform
 *
 * 원리: 인간의 시각 시스템이 조명에 적응하는 방식을 모델링
 * 기준: D65 (6500K 표준 일광)
 */
interface VonKriesResult {
  correctedImageData: ImageData;
  sourceWhitePoint: [number, number, number];
  destinationWhitePoint: [number, number, number];
  adaptationMatrix: number[][];
  scalingFactors: { L: number; M: number; S: number };
}

// Bradford XYZ → LMS 변환 행렬
const BRADFORD_XYZ_TO_LMS: Matrix3x3 = [
  [0.8951, 0.2664, -0.1614],
  [-0.7502, 1.7135, 0.0367],
  [0.0389, -0.0685, 1.0296],
];

// Bradford LMS → XYZ 역변환 행렬
const BRADFORD_LMS_TO_XYZ: Matrix3x3 = [
  [0.9870, -0.1471, 0.1600],
  [0.4323, 0.5184, 0.0493],
  [-0.0085, 0.0400, 0.9685],
];

// D65 기준 백색점 (XYZ)
const D65_WHITE_XYZ: Vec3 = [95.047, 100.0, 108.883];

// D65의 LMS 값 (미리 계산)
const D65_LMS: Vec3 = multiplyMatrixVector(BRADFORD_XYZ_TO_LMS, D65_WHITE_XYZ);
// ≈ [94.814, 103.362, 108.734]

/**
 * Von Kries 색순응 변환 적용
 */
function applyVonKries(
  imageData: ImageData,
  sourceWhiteRGB: [number, number, number]
): VonKriesResult {
  // 1. Source White Point: sRGB → Linear → XYZ
  const sourceLinear = sourceWhiteRGB.map(c => srgbToLinear(c / 255));
  const sourceWhiteXYZ = multiplyMatrixVector(
    SRGB_TO_XYZ_MATRIX,
    sourceLinear as Vec3
  );

  // 2. Source XYZ → LMS
  const sourceWhiteLMS = multiplyMatrixVector(BRADFORD_XYZ_TO_LMS, sourceWhiteXYZ);

  // 3. 적응 스케일링 계수 계산
  const scalingFactors = {
    L: D65_LMS[0] / sourceWhiteLMS[0],
    M: D65_LMS[1] / sourceWhiteLMS[1],
    S: D65_LMS[2] / sourceWhiteLMS[2],
  };

  // 4. 대각 행렬 D 생성
  const diagonalMatrix: Matrix3x3 = [
    [scalingFactors.L, 0, 0],
    [0, scalingFactors.M, 0],
    [0, 0, scalingFactors.S],
  ];

  // 5. 전체 적응 행렬: M_A^-1 × D × M_A
  const temp = multiplyMatrices(diagonalMatrix, BRADFORD_XYZ_TO_LMS);
  const adaptationMatrix = multiplyMatrices(BRADFORD_LMS_TO_XYZ, temp);

  // 6. 모든 픽셀에 적용 (sRGB → Linear → XYZ → adapt → XYZ' → Linear' → sRGB')
  const correctedData = applyAdaptationToImage(imageData, adaptationMatrix);

  return {
    correctedImageData: correctedData,
    sourceWhitePoint: sourceWhiteRGB,
    destinationWhitePoint: [255, 255, 255], // D65 in sRGB
    adaptationMatrix,
    scalingFactors,
  };
}

/**
 * 3x3 행렬 곱셈
 */
function multiplyMatrices(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
  const result: Matrix3x3 = [[0,0,0], [0,0,0], [0,0,0]];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      result[i][j] = a[i][0]*b[0][j] + a[i][1]*b[1][j] + a[i][2]*b[2][j];
    }
  }
  return result;
}

/**
 * 행렬-벡터 곱셈
 */
function multiplyMatrixVector(m: Matrix3x3, v: Vec3): Vec3 {
  return [
    m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2],
    m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2],
    m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2],
  ];
}
```

### 3.3 피부 영역 기반 보정 (Skin-Aware AWB)

> 일반 Gray World의 한계: 피부톤이 많은 이미지에서 과보정

```typescript
/**
 * 피부 영역을 고려한 화이트밸런스
 *
 * 문제: 얼굴 클로즈업 사진은 피부톤이 지배적 → Gray World 부정확
 * 해결: 피부 영역 제외 후 Gray World, 또는 피부톤 기준 보정
 */
interface SkinAwareAWBResult {
  correctedImageData: ImageData;
  skinMask: boolean[];
  nonSkinAverageRGB: [number, number, number];
}

function applySkinAwareAWB(
  imageData: ImageData,
  skinMask?: boolean[]
): SkinAwareAWBResult {
  const pixels = imageData.data;

  // 1. 피부 영역 감지 (제공되지 않은 경우)
  const mask = skinMask ?? detectSkinPixels(imageData);

  // 2. 비-피부 영역의 평균 색상 계산
  let sumR = 0, sumG = 0, sumB = 0, count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const pixelIndex = i / 4;
    if (!mask[pixelIndex]) {  // 피부가 아닌 영역
      sumR += pixels[i];
      sumG += pixels[i + 1];
      sumB += pixels[i + 2];
      count++;
    }
  }

  // 비-피부 영역이 너무 적으면 전체 Gray World로 폴백
  if (count < (pixels.length / 4) * 0.1) {
    console.warn('[AWB] Insufficient non-skin area, falling back to Gray World');
    return {
      ...applyGrayWorld(imageData),
      skinMask: mask,
      nonSkinAverageRGB: [0, 0, 0],
    };
  }

  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;

  // 3. Gray World 보정 적용 (비-피부 기준)
  const avgGray = (avgR + avgG + avgB) / 3;
  const gainR = avgGray / avgR;
  const gainG = avgGray / avgG;
  const gainB = avgGray / avgB;

  // 4. 전체 이미지에 보정 적용
  const correctedData = new Uint8ClampedArray(pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    correctedData[i] = Math.min(255, pixels[i] * gainR);
    correctedData[i + 1] = Math.min(255, pixels[i + 1] * gainG);
    correctedData[i + 2] = Math.min(255, pixels[i + 2] * gainB);
    correctedData[i + 3] = pixels[i + 3];
  }

  return {
    correctedImageData: new ImageData(
      correctedData,
      imageData.width,
      imageData.height
    ),
    skinMask: mask,
    nonSkinAverageRGB: [avgR, avgG, avgB],
  };
}

/**
 * 피부 색상 감지 (YCbCr 색공간 기반)
 *
 * 피부 범위: Cb ∈ [77, 127], Cr ∈ [133, 173]
 */
function detectSkinPixels(imageData: ImageData): boolean[] {
  const pixels = imageData.data;
  const mask: boolean[] = [];

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // RGB to YCbCr
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    // 피부 범위 체크
    const isSkin = cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
    mask.push(isSkin);
  }

  return mask;
}
```

---

## 4. 파이프라인 통합

### 4.1 CIE-3 위치

```
┌─────────────────────────────────────────────────────────────┐
│                    Core Image Engine                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CIE-1: 이미지 품질 검증                                     │
│    └── 해상도, 조명, 선명도, 얼굴 감지                       │
│                      ↓                                       │
│  CIE-2: 얼굴 랜드마크 추출                                   │
│    └── 68점 랜드마크, 포즈 추정                              │
│                      ↓                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ CIE-3: 조명 보정 알고리즘 ◀━━━━ [이 문서]              │ │
│  │   ├── 색온도 추정                                       │ │
│  │   ├── Gray World / Von Kries 선택                       │ │
│  │   ├── 피부 영역 마스킹                                  │ │
│  │   └── D65 기준 보정                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                      ↓                                       │
│  CIE-4: ROI(관심 영역) 추출                                  │
│    └── 피부존, 드레이프 영역                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 입출력 인터페이스

```typescript
// types.ts
export interface CIE3Input {
  imageData: ImageData;
  skinMask?: boolean[];            // CIE-2에서 제공 (선택)
  faceLandmarks?: FaceLandmarks;   // CIE-2에서 제공 (선택)
  forceAlgorithm?: 'gray-world' | 'von-kries' | 'skin-aware';
}

export interface CIE3Output {
  correctedImageData: ImageData;

  // 메타데이터
  originalCCT: number;             // 추정된 원본 색온도
  targetCCT: number;               // 목표 색온도 (6500K)
  algorithmUsed: 'gray-world' | 'von-kries' | 'skin-aware';

  // 신뢰도
  confidence: number;              // 0-1, 보정 신뢰도

  // 디버그 정보
  gains: {
    r: number;
    g: number;
    b: number;
  };
  processingTime: number;
}

export interface CIE3Config {
  targetCCT: number;               // 기본값: 6500 (D65)
  maxGain: number;                 // 게인 상한 (기본: 2.0)
  minGain: number;                 // 게인 하한 (기본: 0.5)
  skinDetectionEnabled: boolean;  // 피부 감지 사용 여부
}
```

### 4.3 알고리즘 선택 로직

```typescript
/**
 * 상황에 따른 알고리즘 자동 선택
 */
function selectAlgorithm(
  imageData: ImageData,
  skinMask?: boolean[],
  config?: Partial<CIE3Config>
): 'gray-world' | 'von-kries' | 'skin-aware' {
  const skinRatio = skinMask
    ? skinMask.filter(Boolean).length / skinMask.length
    : estimateSkinRatio(imageData);

  // 피부 비율이 30% 이상이면 skin-aware 사용
  if (skinRatio > 0.3 && config?.skinDetectionEnabled !== false) {
    return 'skin-aware';
  }

  // 색온도 편차가 큰 경우 Von Kries
  const estimatedCCT = estimateCCT(imageData);
  if (Math.abs(estimatedCCT - 6500) > 2000) {
    return 'von-kries';
  }

  // 기본: Gray World
  return 'gray-world';
}
```

---

## 5. 신뢰도 산정

### 5.1 보정 신뢰도 계산

```typescript
/**
 * CIE-3 보정 신뢰도 계산
 *
 * 고려 요소:
 * 1. 게인 값의 적정 범위 (0.7 ~ 1.5가 이상적)
 * 2. 원본 색온도와 목표의 차이
 * 3. 비-피부 영역의 충분성
 */
function calculateConfidence(
  gains: { r: number; g: number; b: number },
  originalCCT: number,
  targetCCT: number,
  nonSkinRatio: number
): number {
  // 1. 게인 범위 점수 (0-1)
  const gainScore = [gains.r, gains.g, gains.b].map(g => {
    if (g >= 0.7 && g <= 1.5) return 1;
    if (g >= 0.5 && g <= 2.0) return 0.7;
    return 0.3;
  });
  const avgGainScore = gainScore.reduce((a, b) => a + b, 0) / 3;

  // 2. 색온도 차이 점수 (0-1)
  const cctDiff = Math.abs(originalCCT - targetCCT);
  const cctScore = cctDiff < 500 ? 1 :
                   cctDiff < 1500 ? 0.8 :
                   cctDiff < 3000 ? 0.6 : 0.4;

  // 3. 비-피부 영역 점수 (0-1)
  const nonSkinScore = nonSkinRatio >= 0.3 ? 1 :
                       nonSkinRatio >= 0.1 ? 0.7 : 0.4;

  // 가중 평균
  return avgGainScore * 0.4 + cctScore * 0.3 + nonSkinScore * 0.3;
}
```

### 5.2 신뢰도 전파

```
최종 분석 신뢰도 = CIE-1 × CIE-2 × CIE-3 × CIE-4 × 분석모듈

예시:
CIE-1 (품질): 0.95
CIE-2 (랜드마크): 0.90
CIE-3 (AWB): 0.85
CIE-4 (ROI): 0.92
PC-1 (퍼스널컬러): 0.88

최종 = 0.95 × 0.90 × 0.85 × 0.92 × 0.88 = 0.59 (59%)
```

### 5.3 API 응답 형식

표준 응답 유틸리티 사용: `lib/api/error-response.ts`

#### 성공 응답

```typescript
import { createSuccessResponse } from '@/lib/api/error-response';

return createSuccessResponse({
  correctedImageData: result.correctedImageData,
  originalCCT: result.originalCCT,
  algorithmUsed: result.algorithmUsed,
  confidence: result.confidence,
});
```

#### 에러 응답

```typescript
import {
  validationError,
  analysisFailedError,
  rateLimitError,
  dailyLimitError
} from '@/lib/api/error-response';

// 입력 검증 실패
return validationError('이미지 형식이 올바르지 않습니다.');

// 분석 실패
return analysisFailedError('화이트밸런스 보정에 실패했습니다.');

// Rate Limit
return rateLimitError(60);  // 60초 후 재시도

// 일일 한도 초과
return dailyLimitError(86400);  // 24시간 후 재시도
```

#### 응답 타입

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { error: string; code: ApiErrorCode; retryAfter?: number };
```

---

## 6. 파일 구조

```
lib/image-engine/
├── index.ts                    # 통합 export
├── types.ts                    # 공통 타입
├── cie-3/
│   ├── index.ts                # CIE-3 모듈 export
│   ├── types.ts                # CIE-3 전용 타입
│   ├── awb-processor.ts        # 메인 프로세서
│   ├── gray-world.ts           # Gray World 알고리즘
│   ├── von-kries.ts            # Von Kries 변환
│   ├── skin-aware.ts           # 피부 인식 AWB
│   ├── skin-detector.ts        # 피부 영역 감지
│   ├── cct-estimator.ts        # 색온도 추정
│   └── confidence.ts           # 신뢰도 계산
└── utils/
    ├── color-space.ts          # RGB/XYZ/LMS 변환
    └── matrix.ts               # 행렬 연산
```

---

## 7. 상세 테스트 케이스 및 에러 핸들링

> P3 원칙 준수: ≤2시간 독립 테스트 가능한 원자 단위

### 7.0 Happy Path 테스트 (Expected Values)

#### 7.0.1 색온도 보정 계수 검증 (CCT별 기준값)

| TC-ID | 테스트명 | 입력 CCT | 목표 CCT | Expected Gain (R, G, B) | 허용 오차 | 검증 공식 |
|-------|----------|----------|----------|------------------------|----------|----------|
| **CIE3-HP01** | 백열등 보정 (2700K) | 2700K | 6500K | `R: 0.75, G: 0.95, B: 1.40` | ±0.05 | Von Kries 변환 |
| **CIE3-HP02** | 주광 유지 (5500K) | 5500K | 6500K | `R: 0.95, G: 1.00, B: 1.05` | ±0.03 | 최소 보정 |
| **CIE3-HP03** | D65 표준광 (6500K) | 6500K | 6500K | `R: 1.00, G: 1.00, B: 1.00` | ±0.01 | 무보정 |
| **CIE3-HP04** | 흐린 날 (7500K) | 7500K | 6500K | `R: 1.08, G: 1.00, B: 0.92` | ±0.03 | 역보정 |
| **CIE3-HP05** | 그늘/북쪽광 (9000K) | 9000K | 6500K | `R: 1.15, G: 1.00, B: 0.85` | ±0.05 | 역보정 |

#### 7.0.2 Gray World 알고리즘 검증

| TC-ID | 테스트명 | 입력 RGB 평균 | Expected 출력 RGB 평균 | 허용 오차 | 검증 기준 |
|-------|----------|--------------|----------------------|----------|----------|
| **CIE3-HP06** | 따뜻한 조명 | `R: 200, G: 150, B: 100` | `R: 150, G: 150, B: 150` | ±5 | 채널 평균 균등화 |
| **CIE3-HP07** | 차가운 조명 | `R: 100, G: 150, B: 200` | `R: 150, G: 150, B: 150` | ±5 | 채널 평균 균등화 |
| **CIE3-HP08** | 녹색 편향 | `R: 120, G: 180, B: 120` | `R: 140, G: 140, B: 140` | ±5 | 채널 평균 균등화 |
| **CIE3-HP09** | 균형 조명 | `R: 128, G: 128, B: 128` | `R: 128, G: 128, B: 128` | ±1 | 무보정 (이미 균형) |

#### 7.0.3 Skin-Aware AWB 검증

| TC-ID | 테스트명 | 피부 영역 비율 | Expected 동작 | 신뢰도 기대값 |
|-------|----------|--------------|--------------|--------------|
| **CIE3-HP10** | 표준 인물 사진 | 30-50% | Skin-Aware AWB 적용 | ≥0.85 |
| **CIE3-HP11** | 근접 촬영 | 70-90% | Gray World 폴백 | 0.60-0.75 |
| **CIE3-HP12** | 전신 샷 | 10-20% | Skin-Aware AWB (낮은 가중치) | 0.75-0.85 |
| **CIE3-HP13** | 풍경 (피부 없음) | <5% | Pure Gray World | 0.70-0.80 |

#### 7.0.4 Von Kries 색순응 검증

| TC-ID | 테스트명 | Source 백색점 | Target 백색점 | Expected 결과 | 검증 방법 |
|-------|----------|--------------|--------------|--------------|----------|
| **CIE3-HP14** | A→D65 변환 | Illuminant A (2856K) | D65 (6504K) | 피부톤 중립화 | ΔE00 < 3.0 |
| **CIE3-HP15** | D50→D65 변환 | D50 (5003K) | D65 (6504K) | 미세 조정 | ΔE00 < 1.5 |
| **CIE3-HP16** | F2→D65 변환 | F2 형광등 (4230K) | D65 (6504K) | 녹색 제거 | ΔE00 < 4.0 |

### 7.1 Edge Case 테스트

#### 7.1.1 극단 색온도 처리

| TC-ID | 테스트명 | 입력 조건 | Expected 동작 | 우선순위 |
|-------|----------|----------|--------------|----------|
| **CIE3-E01** | 촛불 조명 (<2500K) | `estimatedCCT: 1850K` | 최대 보정 + 낮은 신뢰도 (0.4-0.5) | P0 |
| **CIE3-E02** | 극저온 경계 (2500K) | `estimatedCCT: 2500K` | 정상 보정, 경고 플래그 | P1 |
| **CIE3-E03** | 고온 광원 (>10000K) | `estimatedCCT: 12000K` | 최대 역보정 + 낮은 신뢰도 | P0 |
| **CIE3-E04** | 극고온 경계 (10000K) | `estimatedCCT: 10000K` | 정상 역보정, 경고 플래그 | P1 |
| **CIE3-E05** | CCT 추정 실패 | `estimatedCCT: null` | Gray World 폴백, 6500K 가정 | P0 |

#### 7.1.2 피부 영역 관련 Edge Cases

| TC-ID | 테스트명 | 입력 조건 | Expected 동작 | 우선순위 |
|-------|----------|----------|--------------|----------|
| **CIE3-E06** | 피부 영역 없음 | `skinRatio: 0%` | Pure Gray World | P1 |
| **CIE3-E07** | 피부만 존재 | `skinRatio: 100%` | Gray World 폴백 + 경고 | P0 |
| **CIE3-E08** | 비피부 영역 < 10% | `nonSkinRatio: 8%` | Gray World 폴백 | P0 |
| **CIE3-E09** | 피부 오탐 (빨간 옷) | 빨간색 영역 감지 | YCbCr 범위 외 필터링 | P1 |
| **CIE3-E10** | 피부 마스크 불완전 | 마스크 경계 노이즈 | Morphological cleanup 적용 | P2 |

#### 7.1.3 입력 이미지 관련 Edge Cases

| TC-ID | 테스트명 | 입력 조건 | Expected 동작 | 우선순위 |
|-------|----------|----------|--------------|----------|
| **CIE3-E11** | 매우 어두운 이미지 | `avgBrightness < 20` | 제한된 보정 + 낮은 신뢰도 | P1 |
| **CIE3-E12** | 과노출 이미지 | `avgBrightness > 240` | 클리핑 방지, 보수적 보정 | P1 |
| **CIE3-E13** | 흑백 이미지 | `saturation ≈ 0` | 보정 건너뛰기, 원본 반환 | P1 |
| **CIE3-E14** | 단색 조명 (나트륨등) | 매우 좁은 스펙트럼 | 제한된 보정, 경고 | P2 |
| **CIE3-E15** | null ImageData | `imageData: null` | `VALIDATION_ERROR` | P0 |

### 7.2 에러 핸들링 시나리오

#### 7.2.1 실패 시 처리 전략 (원본 보존 vs Skip)

| 시나리오 | 실패 지점 | 처리 전략 | 근거 | 신뢰도 영향 |
|----------|----------|----------|------|------------|
| CCT 추정 실패 | `estimateCCT()` | **Skip to Gray World** | CCT 없이도 채널 균등화 가능 | confidence -= 0.15 |
| 피부 마스크 생성 실패 | `generateSkinMask()` | **Skip to Gray World** | 피부 없이도 기본 AWB 가능 | confidence -= 0.10 |
| Bradford 행렬 오류 | `computeBradfordMatrix()` | **원본 보존** | 잘못된 색변환보다 원본이 나음 | confidence = 0 |
| Von Kries 적용 실패 | `applyVonKries()` | **Gray World 결과 사용** | 부분 보정이라도 적용 | confidence -= 0.20 |
| 클리핑 과다 발생 | `>5% pixels clipped` | **보정 강도 50% 감소** | 정보 손실 최소화 | confidence -= 0.10 |
| 전체 파이프라인 실패 | 예외 발생 | **원본 보존 + preservedOriginal: true** | 분석 가능성 유지 | confidence = 0 |

#### 7.2.2 Graceful Fallback 전략

```typescript
// CIE-3 Fallback 체계
interface CIE3FallbackConfig {
  // Level 1: Skin-Aware → Gray World
  skinAwareFailure: {
    condition: 'nonSkinRatio < 0.1 || skinMaskError';
    action: 'fallback_to_gray_world';
    confidenceAdjustment: -0.10;
    logLevel: 'warn';
  };

  // Level 2: Von Kries → Gray World
  vonKriesFailure: {
    condition: 'matrixError || extremeGains';
    action: 'use_gray_world_result';
    confidenceAdjustment: -0.20;
    logLevel: 'warn';
  };

  // Level 3: 모든 AWB 실패 → 원본 보존
  totalFailure: {
    condition: 'grayWorldFailure || criticalError';
    action: 'preserve_original';
    output: {
      correctedImageData: 'originalImageData',
      preservedOriginal: true,
      confidence: 0,
      failureReason: string
    };
    logLevel: 'error';
  };
}
```

#### 7.2.3 사용자 선택 플로우 (원본 보존 옵션)

```typescript
// 사용자 결정이 필요한 상황
interface CIE3UserDecision {
  // 극단적 보정 경고
  extremeCorrectionWarning: {
    trigger: 'totalGain > 2.0 || totalGain < 0.5';
    options: [
      { id: 'apply_full', label: '전체 보정 적용' },
      { id: 'apply_half', label: '50% 보정 적용' },
      { id: 'keep_original', label: '원본 유지' }
    ];
    default: 'apply_half';
    showPreview: true;
  };

  // 낮은 신뢰도 경고
  lowConfidenceWarning: {
    trigger: 'confidence < 0.5';
    options: [
      { id: 'proceed', label: '보정 결과 사용' },
      { id: 'keep_original', label: '원본 사용' },
      { id: 'retry_different', label: '다른 사진으로 다시 시도' }
    ];
    showComparison: true;
  };

  // 색상 변화 확인
  colorShiftConfirmation: {
    trigger: 'ΔE00 > 10';
    options: [
      { id: 'accept', label: '보정 결과 수락' },
      { id: 'reduce', label: '보정 강도 줄이기' },
      { id: 'reject', label: '원본 유지' }
    ];
    showBeforeAfter: true;
  };
}
```

### 7.3 테스트 데이터 Fixtures

```typescript
// tests/fixtures/cie3-awb.ts

// 색온도별 테스트 이미지
export const cctTestImages = {
  // 2700K 백열등
  incandescent: {
    path: 'fixtures/lighting/incandescent-2700k.jpg',
    expectedCCT: 2700,
    expectedGains: { r: 0.75, g: 0.95, b: 1.40 }
  },

  // 5500K 주광
  daylight: {
    path: 'fixtures/lighting/daylight-5500k.jpg',
    expectedCCT: 5500,
    expectedGains: { r: 0.95, g: 1.00, b: 1.05 }
  },

  // 6500K D65 표준광
  d65: {
    path: 'fixtures/lighting/studio-d65.jpg',
    expectedCCT: 6500,
    expectedGains: { r: 1.00, g: 1.00, b: 1.00 }
  }
};

// 피부 영역 비율별 테스트 이미지
export const skinRatioTestImages = {
  // 표준 인물 (30-50%)
  standard: {
    path: 'fixtures/portraits/standard-portrait.jpg',
    skinRatio: 0.40,
    expectedMethod: 'skin_aware'
  },

  // 근접 촬영 (70-90%)
  closeUp: {
    path: 'fixtures/portraits/close-up.jpg',
    skinRatio: 0.85,
    expectedMethod: 'gray_world_fallback'
  },

  // 전신 (10-20%)
  fullBody: {
    path: 'fixtures/portraits/full-body.jpg',
    skinRatio: 0.15,
    expectedMethod: 'skin_aware_weighted'
  }
};

// 극단 조건 테스트
export const edgeCaseImages = {
  // 촛불 조명 (<2500K)
  candleLight: {
    path: 'fixtures/extreme/candle-light.jpg',
    estimatedCCT: 1850,
    expectedConfidence: 0.45
  },

  // 과노출
  overexposed: {
    path: 'fixtures/extreme/overexposed.jpg',
    avgBrightness: 245,
    expectedHandling: 'conservative_correction'
  },

  // 단색 나트륨등
  sodiumLight: {
    path: 'fixtures/extreme/sodium-light.jpg',
    spectrum: 'narrow',
    expectedWarning: 'limited_correction'
  }
};
```

---

## 8. 기존 테스트 케이스

### 8.1 단위 테스트

```typescript
describe('CIE-3 AWB Correction', () => {
  describe('Gray World', () => {
    it('should normalize RGB channels to equal averages', () => {
      const warmImage = createTestImage({ r: 200, g: 150, b: 100 });
      const result = applyGrayWorld(warmImage);

      const avgR = calculateChannelAverage(result.correctedImageData, 'r');
      const avgG = calculateChannelAverage(result.correctedImageData, 'g');
      const avgB = calculateChannelAverage(result.correctedImageData, 'b');

      expect(Math.abs(avgR - avgG)).toBeLessThan(5);
      expect(Math.abs(avgG - avgB)).toBeLessThan(5);
    });

    it('should estimate correct CCT for warm light', () => {
      const warmImage = createTestImage({ r: 255, g: 180, b: 100 }); // ~2700K
      const result = applyGrayWorld(warmImage);

      expect(result.estimatedCCT).toBeGreaterThan(2500);
      expect(result.estimatedCCT).toBeLessThan(3500);
    });
  });

  describe('Skin-Aware AWB', () => {
    it('should exclude skin regions from averaging', () => {
      const faceImage = loadTestImage('face-close-up.jpg');
      const result = applySkinAwareAWB(faceImage);

      // 피부 영역이 30% 이상이어야 함
      const skinRatio = result.skinMask.filter(Boolean).length /
                        result.skinMask.length;
      expect(skinRatio).toBeGreaterThan(0.3);
    });

    it('should fall back to Gray World when non-skin area is small', () => {
      const fullFaceImage = loadTestImage('extreme-close-up.jpg');
      const result = applySkinAwareAWB(fullFaceImage);

      // 경고 로그 확인
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('falling back to Gray World')
      );
    });
  });

  describe('Confidence Calculation', () => {
    it('should return high confidence for moderate gains', () => {
      const confidence = calculateConfidence(
        { r: 1.1, g: 1.0, b: 0.9 },
        5500, // original CCT
        6500, // target CCT
        0.5   // non-skin ratio
      );

      expect(confidence).toBeGreaterThan(0.8);
    });

    it('should return low confidence for extreme gains', () => {
      const confidence = calculateConfidence(
        { r: 2.5, g: 0.4, b: 1.0 },
        2000,
        6500,
        0.1
      );

      expect(confidence).toBeLessThan(0.5);
    });
  });
});
```

### 7.2 통합 테스트

```typescript
describe('CIE Pipeline Integration', () => {
  it('should pass corrected image to CIE-4', async () => {
    const rawImage = loadTestImage('portrait-warm-light.jpg');

    const cie1Result = await validateImageQuality(rawImage);
    const cie2Result = await extractLandmarks(cie1Result.imageData);
    const cie3Result = await correctWhiteBalance(
      cie2Result.imageData,
      cie2Result.skinMask
    );
    const cie4Result = await extractROI(
      cie3Result.correctedImageData,
      cie2Result.landmarks
    );

    // CIE-3 보정 후 피부톤이 중립에 가까워야 함
    const skinColorBefore = extractAverageSkinColor(rawImage);
    const skinColorAfter = extractAverageSkinColor(cie3Result.correctedImageData);

    const d65Distance_before = colorDistanceFromD65(skinColorBefore);
    const d65Distance_after = colorDistanceFromD65(skinColorAfter);

    expect(d65Distance_after).toBeLessThan(d65Distance_before);
  });
});
```

---

## 8. 원자 분해 (P3)

> **P3 원칙**: 모든 원자는 ≤2시간, 독립 테스트 가능, 단일 책임

| ID | 원자 | 소요시간 | 입력 | 출력 | 의존성 | 성공 기준 |
|----|------|----------|------|------|--------|----------|
| **CIE3-1** | 색공간 변환 유틸리티 | 2h | RGB | XYZ, LMS | - | RGB→XYZ→LMS 정확도 99%+, 왕복 오차 <1 |
| **CIE3-2** | CCT 추정 알고리즘 | 2h | ImageData | CCT (K) | CIE3-1 | McCamy 기준 ±200K |
| **CIE3-3** | Gray World 구현 | 2h | ImageData | CorrectedData | - | R/G/B 평균 차이 <5 |
| **CIE3-4** | YCbCr 변환 | 1h | RGB | YCbCr | - | 공식 정확도 100% |
| **CIE3-5** | 피부 영역 마스크 | 2h | ImageData, YCbCr범위 | SkinMask | CIE3-4 | 감지율 85%+, 오탐률 <15% |
| **CIE3-6** | 비-피부 평균 계산 | 1.5h | ImageData, SkinMask | RGB평균 | CIE3-5 | 10% 미만 시 폴백 플래그 |
| **CIE3-7** | Skin-Aware 보정 | 1.5h | RGB평균, Gains | CorrectedData | CIE3-3, CIE3-6 | Gray World 폴백 정상 |
| **CIE3-8** | Bradford 행렬 연산 | 1.5h | XYZ | LMS | CIE3-1 | 역행렬 정확도 99.9%+ |
| **CIE3-9** | 적응 행렬 생성 | 1.5h | SrcLMS, DstLMS | Matrix3x3 | CIE3-8 | D65 수렴 확인 |
| **CIE3-10** | Von Kries 보정 | 1.5h | ImageData, Matrix | CorrectedData | CIE3-9 | 백색점 수렴 |
| **CIE3-11** | 신뢰도 계산 | 2h | Gains, CCT, Ratios | Confidence | CIE3-2 | 0-1 범위, 극단 게인 <0.5 |
| **CIE3-12** | 통합 프로세서 | 2h | CIE3Input | CIE3Output | All | 분기 테스트, <50ms |

**총 예상 시간**: 20.5시간 | **원자 수**: 12개 | **평균 크기**: 1.7시간 | **최대 크기**: 2시간 ✅

### 8.1 의존성 그래프 (업데이트됨)

```
┌─────────────────────────────────────────────────────────────────┐
│               CIE-3 의존성 그래프 (12개 원자)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              독립 시작 가능 원자 (병렬)                    │    │
│  │  CIE3-1 (색공간)  CIE3-3 (Gray World)  CIE3-4 (YCbCr)   │    │
│  └──────┬─────────────────┬───────────────────┬─────────────┘    │
│         │                 │                   │                  │
│         ▼                 │                   ▼                  │
│  ┌──────┴──────┐          │            CIE3-5 (피부 마스크)      │
│  │ CIE3-2(CCT) │          │                   │                  │
│  │ CIE3-8(Brad)│          │                   ▼                  │
│  └──────┬──────┘          │            CIE3-6 (비피부 평균)      │
│         │                 │                   │                  │
│         ▼                 │                   ▼                  │
│  CIE3-9 (적응 행렬)       │            CIE3-7 (Skin-Aware)       │
│         │                 │                   │                  │
│         ▼                 │                   │                  │
│  CIE3-10 (Von Kries)      │                   │                  │
│         │                 │                   │                  │
│  ┌──────┴─────────────────┴───────────────────┘                  │
│  │                                                               │
│  ▼                                                               │
│  CIE3-11 (신뢰도) ←───── CIE3-2 (CCT)                           │
│         │                                                        │
│         ▼                                                        │
│  CIE3-12 (통합 프로세서)                                         │
│         │                                                        │
│         ▼                                                        │
│    CIE3Output                                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**병렬 실행 가능 원자**:
- Phase 0: CIE3-1, CIE3-3, CIE3-4 (독립적, 동시 시작)
- Phase 1: CIE3-2, CIE3-5, CIE3-8 (CIE3-1/4 완료 후)
- Phase 2: CIE3-6, CIE3-9 (Phase 1 완료 후)
- Phase 3: CIE3-7, CIE3-10, CIE3-11 (Phase 2 완료 후)
- Phase 4: CIE3-12 (모든 원자 완료 후)

**크리티컬 패스**: CIE3-1 → CIE3-8 → CIE3-9 → CIE3-10 → CIE3-12 (9h)

### 8.2 각 원자 상세 (12개)

#### CIE3-1: 색공간 변환 유틸리티 (2h)

```typescript
// 입출력
interface ColorSpaceInput { rgb: [number, number, number]; }
interface ColorSpaceOutput { xyz: [number, number, number]; lms: [number, number, number]; }

// 성공 기준: D65 백색 변환 오차 < 0.1%
it('RGB→XYZ 정확도', () => {
  const { xyz } = rgbToXyz([255, 255, 255]);
  expect(xyz[0]).toBeCloseTo(95.047, 1);  // X
  expect(xyz[1]).toBeCloseTo(100.0, 1);   // Y
  expect(xyz[2]).toBeCloseTo(108.883, 1); // Z
});
```

#### CIE3-3: Gray World 구현 (2h)

```typescript
// 성공 기준: R/G/B 평균 차이 < 5
it('채널 균형', () => {
  const warmImage = createTestImage({ r: 200, g: 150, b: 100 });
  const [avgR, avgG, avgB] = calculateChannelAverages(applyGrayWorld(warmImage));
  expect(Math.abs(avgR - avgG)).toBeLessThan(5);
  expect(Math.abs(avgG - avgB)).toBeLessThan(5);
});
```

#### CIE3-4: YCbCr 변환 (1h) 🆕

```typescript
// 입출력
interface YCbCrInput { r: number; g: number; b: number; }
interface YCbCrOutput { y: number; cb: number; cr: number; }

// 성공 기준: 공식 정확도 100%
it('RGB→YCbCr 변환', () => {
  const { y, cb, cr } = rgbToYCbCr(235, 195, 175);
  expect(y).toBeCloseTo(205, 0);
  expect(cb).toBeCloseTo(110, 1);
  expect(cr).toBeCloseTo(145, 1);
});
```

#### CIE3-5: 피부 영역 마스크 (2h) 🆕

```typescript
// 성공 기준: 감지율 85%+, 오탐률 <15%
it('한국인 피부 감지', () => {
  const skinPixels = [[235, 195, 175], [210, 165, 140], [180, 130, 100]];
  skinPixels.forEach(rgb => expect(isSkin(rgb)).toBe(true));
});

it('비-피부 거부', () => {
  const nonSkin = [[200, 50, 50], [50, 80, 180], [250, 250, 250]];
  nonSkin.forEach(rgb => expect(isSkin(rgb)).toBe(false));
});
```

#### CIE3-6: 비-피부 평균 계산 (1.5h) 🆕

```typescript
// 성공 기준: 10% 미만 시 폴백 플래그
it('폴백 조건', () => {
  const closeupImage = loadTestImage('extreme-close-up.jpg'); // 95% 피부
  const { needsFallback, nonSkinRatio } = calculateNonSkinAverage(closeupImage);
  expect(needsFallback).toBe(true);
  expect(nonSkinRatio).toBeLessThan(0.1);
});
```

#### CIE3-7: Skin-Aware 보정 (1.5h) 🆕

```typescript
// 성공 기준: Gray World 폴백 정상 동작
it('폴백 시 경고 로그', () => {
  const warnSpy = vi.spyOn(console, 'warn');
  applySkinAwareAWB({ imageData, needsFallback: true });
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('falling back'));
});
```

#### CIE3-8: Bradford 행렬 연산 (1.5h) 🆕

```typescript
// 성공 기준: 역행렬 정확도 99.9%+
it('행렬 가역성', () => {
  const testVec: Vec3 = [50, 60, 70];
  const lms = multiplyMatrixVector(BRADFORD_XYZ_TO_LMS, testVec);
  const recovered = multiplyMatrixVector(BRADFORD_LMS_TO_XYZ, lms);
  expect(recovered[0]).toBeCloseTo(testVec[0], 3);
});
```

#### CIE3-9: 적응 행렬 생성 (1.5h) 🆕

```typescript
// 성공 기준: D65 수렴 확인
it('D65 수렴', () => {
  const sourceWhite: Vec3 = [109.85, 100.0, 35.58]; // Illuminant A
  const matrix = createAdaptationMatrix(sourceWhite, D65_WHITE_XYZ);
  const adapted = multiplyMatrixVector(matrix, sourceWhite);
  expect(adapted[0]).toBeCloseTo(D65_WHITE_XYZ[0], 1);
});
```

#### CIE3-10: Von Kries 보정 (1.5h) 🆕

```typescript
// 성공 기준: 백색점 수렴
it('백색점 보정', () => {
  const whiteImage = createSolidColorImage([255, 180, 100], 100, 100);
  const result = applyVonKries(whiteImage, [255, 180, 100]);
  const [avgR, avgG, avgB] = calculateChannelAverages(result);
  expect(Math.abs(avgR - avgB)).toBeLessThan(10);
});
```

#### CIE3-11: 신뢰도 계산 (2h)

```typescript
// 성공 기준: 0-1 범위, 극단 게인 시 <0.5
it('극단 게인 저신뢰도', () => {
  const conf = calculateConfidence({ r: 2.5, g: 0.4, b: 1.0 }, 2000, 6500, 0.1);
  expect(conf).toBeLessThan(0.5);
});
```

#### CIE3-12: 통합 프로세서 (2h)

```typescript
// 성공 기준: 분기 테스트, <50ms
it('알고리즘 자동 선택', () => {
  const result = processAWB({ imageData, skinMask: generateSkinMask(0.4) });
  expect(result.algorithmUsed).toBe('skin-aware');
});

it('성능', () => {
  const start = performance.now();
  processAWB({ imageData });
  expect(performance.now() - start).toBeLessThan(50);
});
```

---

## 9. 구현 우선순위 (업데이트됨)

### Phase 1 (MVP): 기본 AWB (8.5h)

```
1. CIE3-1: 색공간 변환 유틸리티 (2h)
2. CIE3-3: Gray World 구현 (2h)
3. CIE3-4: YCbCr 변환 (1h)
4. CIE3-5: 피부 영역 마스크 (2h)
5. CIE3-11: 신뢰도 계산 (2h) - 부분 구현

→ 결과: 기본 화이트밸런스 + 피부 감지 가능
```

### Phase 2: Skin-Aware AWB (3h)

```
6. CIE3-6: 비-피부 평균 계산 (1.5h)
7. CIE3-7: Skin-Aware 보정 (1.5h)

→ 결과: 얼굴 클로즈업 대응
```

### Phase 3: Von Kries 고급 보정 (7h)

```
8. CIE3-2: CCT 추정 알고리즘 (2h)
9. CIE3-8: Bradford 행렬 연산 (1.5h)
10. CIE3-9: 적응 행렬 생성 (1.5h)
11. CIE3-10: Von Kries 보정 (1.5h)

→ 결과: 극단 조명 환경 대응
```

### Phase 4: 통합 (2h)

```
12. CIE3-12: 통합 프로세서 (2h)

→ 결과: CIE 파이프라인 통합 완료
```

**총 시간**: 20.5시간 | **MVP**: 8.5시간 (41%)

---

## 10. 리스크 및 완화

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|----------|
| 과보정으로 인한 색상 왜곡 | 중간 | 높음 | 게인 상/하한 설정, 사용자 피드백 수집 |
| 피부 감지 오탐 | 낮음 | 중간 | YCbCr 임계값 조정, CIE-2 랜드마크 기반 보완 |
| 성능 (대용량 이미지) | 중간 | 중간 | 다운샘플링 후 처리, 게인만 계산 후 원본에 적용 |
| 브라우저 호환성 | 낮음 | 낮음 | Canvas API 표준 사용 |

---

## 10A. 성능 SLA (Performance SLA)

> **신규 섹션**: 성능 목표 및 최적화 전략 상세화

### 10A.1 전체 파이프라인 SLA

> **지표 정의**
> - **목표 (p95)**: 95%의 요청이 이 시간 내에 완료되어야 함
> - **경고**: 이 시간 초과 시 알림 발생
> - **심각**: 이 시간 초과 시 보정 생략 또는 에러

| 지표 | 목표 (p95) | 경고 | 심각 | 측정 방법 |
|------|-----------|------|------|----------|
| AWB 전체 보정 시간 | < 100ms | > 150ms | > 250ms | 입력→보정 이미지 출력 |
| CCT 추정 | < 50ms | > 80ms | > 120ms | McCamy 공식 적용 |
| Gray World 평균 계산 | < 20ms | > 40ms | > 60ms | 640×480 이미지 기준 |
| 피부 영역 마스킹 | < 30ms | > 50ms | > 80ms | YCbCr 기반 |
| Von Kries 변환 | < 15ms | > 25ms | > 40ms | 매트릭스 연산 |
| 게인 적용 (전체 픽셀) | < 30ms | > 50ms | > 80ms | RGB 채널별 |
| 신뢰도 산정 | < 10ms | > 15ms | > 25ms | 델타 E 계산 |

### 10A.2 원자(ATOM)별 Micro SLA

| ATOM ID | 작업 | 목표 시간 | 병목 가능성 | 비고 |
|---------|------|----------|-------------|------|
| CIE3-1 | RGB → XYZ 변환 | < 5ms | 낮음 | 매트릭스 곱셈 |
| CIE3-2 | XYZ → xy 크로마 | < 3ms | 낮음 | 단순 나눗셈 |
| CIE3-3 | McCamy CCT 추정 | < 50ms | 중간 | 전체 픽셀 순회 (다운샘플링 권장) |
| CIE3-4 | CCT → Daylight xy | < 2ms | 낮음 | 공식 계산 |
| CIE3-5 | Gray World 평균 | < 20ms | 중간 | 전체 픽셀 순회 |
| CIE3-6 | 게인 계산 | < 5ms | 낮음 | 3개 값 나눗셈 |
| CIE3-7 | YCbCr 피부 검출 | < 30ms | 중간 | 전체 픽셀 순회 |
| CIE3-8 | Von Kries 매트릭스 생성 | < 3ms | 낮음 | 3×3 역행렬 |
| CIE3-9 | 색순응 적용 | < 15ms | 낮음 | 매트릭스 곱셈 |
| CIE3-10 | 게인 적용 (RGB) | < 30ms | 중간 | 전체 픽셀 |
| CIE3-11 | 클램핑 | < 10ms | 낮음 | 값 범위 제한 |
| CIE3-12 | 파이프라인 통합 | < 100ms | - | 전체 합계 |

### 10A.3 캐싱 전략

| 캐시 대상 | TTL | 무효화 조건 | 기대 효과 |
|----------|-----|------------|----------|
| Von Kries 적응 매트릭스 | 세션 유지 | 색온도 변경 | -3ms |
| D65 참조 화이트포인트 | 상수 | 없음 (고정값) | 초기화 비용 0 |
| 다운샘플링된 이미지 | 동일 요청 내 | 새 이미지 입력 | -20ms (CCT 계산) |
| 피부 마스크 | 동일 요청 내 | 새 이미지 입력 | -30ms |
| 색온도-게인 룩업 테이블 | 24시간 | 알고리즘 변경 | -5ms |

### 10A.4 병렬화 전략

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CIE-3 병렬 처리 파이프라인                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [이미지 입력]                                                      │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────┐                           │
│  │   다운샘플링 (선택적) - 5ms          │                           │
│  │   • 고해상도 → 640×480 축소          │                           │
│  └─────────────────────────────────────┘                           │
│       │                                                             │
│       ▼                                                             │
│  ┌───────────────┬───────────────┐                                  │
│  │ CCT 추정 경로 │ Gray World 경로│  ◄── 병렬 실행 (Promise.all)    │
│  │     ~50ms     │     ~20ms     │                                  │
│  ├───────────────┴───────────────┤                                  │
│  │                                │                                  │
│  │  CCT 경로:                     │                                  │
│  │  • RGB → XYZ                   │                                  │
│  │  • XYZ → xy                    │                                  │
│  │  • McCamy CCT                  │                                  │
│  │                                │                                  │
│  │  Gray World 경로:              │                                  │
│  │  • 평균 RGB 계산               │                                  │
│  │  • 게인 계산                   │                                  │
│  │                                │                                  │
│  └────────────────────────────────┘                                  │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────┐                           │
│  │   알고리즘 선택 (신뢰도 기반) - 5ms  │                           │
│  │   • 피부 비율 > 15%: 피부 기반      │                           │
│  │   • 피부 비율 < 15%: Gray World     │                           │
│  └─────────────────────────────────────┘                           │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────┐                           │
│  │   보정 적용 (직렬) - 45ms           │                           │
│  │   • Von Kries 변환 또는 게인 적용   │                           │
│  │   • 클램핑                          │                           │
│  └─────────────────────────────────────┘                           │
│       │                                                             │
│       ▼                                                             │
│  [보정된 이미지 출력]                                                │
│                                                                     │
│  총 예상 시간: 5 + max(50, 20) + 5 + 45 ≈ 105ms                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

| 병렬 그룹 | 포함 작업 | 예상 시간 | 기대 효과 |
|----------|----------|----------|----------|
| **CCT 경로** | RGB→XYZ, XYZ→xy, McCamy | ~50ms | Gray World와 병렬 |
| **Gray World 경로** | 평균 RGB, 게인 계산 | ~20ms | CCT와 병렬 |
| **최종 선택** | 알고리즘 선택, 보정 적용 | ~50ms | 직렬 처리 |

### 10A.5 해상도별 성능 예상

| 해상도 | CCT 추정 | Gray World | 게인 적용 | 총 시간 |
|--------|----------|------------|----------|---------|
| 320×240 | ~15ms | ~8ms | ~10ms | ~40ms |
| 640×480 | ~50ms | ~20ms | ~30ms | ~100ms |
| 1280×720 | ~120ms | ~50ms | ~70ms | ~240ms |
| 1920×1080 | ~250ms | ~100ms | ~140ms | ~500ms |

> **권장**: 1280×720 이상 이미지는 다운샘플링 후 게인 계산, 원본에 게인만 적용

### 10A.6 타임아웃 및 Fallback 정책

```typescript
// apps/web/lib/image-engine/cie-3/config.ts

export const CIE3_TIMEOUT_CONFIG = {
  // 전체 AWB 타임아웃
  totalTimeout: 250,            // 250ms (심각 임계값)

  // 개별 단계 타임아웃
  cctEstimation: 80,            // CCT 추정
  grayWorld: 40,                // Gray World
  vonKries: 25,                 // Von Kries 변환
  gainApplication: 80,          // 게인 적용

  // Fallback 전략
  fallbackBehavior: {
    onTimeout: 'skip',          // 타임아웃 시 보정 생략
    onError: 'passthrough',     // 에러 시 원본 이미지 반환
    logLevel: 'warn',
  },

  // 다운샘플링 임계값
  downsampling: {
    maxWidth: 640,
    maxHeight: 480,
    enableForCctOnly: true,     // CCT 계산에만 다운샘플링
  },
};

// 보정 생략 시 다운스트림 모듈에 알림
export interface CIE3SkipNotification {
  skipped: true;
  reason: 'timeout' | 'error' | 'low_confidence';
  originalImage: ImageData;
  metadata: {
    attemptedDuration: number;
    threshold: number;
  };
}
```

---

## 11. Mock 데이터 예시

### 11.1 Gray World 보정 Mock

```typescript
// tests/mocks/cie-3-mock-data.ts

/**
 * 따뜻한 조명(백열등) 환경 Mock
 */
export const WARM_LIGHT_MOCK: CIE3MockData = {
  input: {
    imageData: createMockImageData({
      width: 640,
      height: 480,
      avgR: 200,
      avgG: 150,
      avgB: 100,
    }),
    skinMask: generateSkinMask(640, 480, 0.35), // 35% 피부
    forceAlgorithm: undefined, // 자동 선택
  },
  expected: {
    algorithmUsed: 'skin-aware', // 피부 비율 > 30%
    originalCCT: 2800,           // 따뜻한 조명
    targetCCT: 6500,
    gains: {
      r: 0.83,                    // R 채널 감소
      g: 1.11,                    // G 채널 증가
      b: 1.67,                    // B 채널 크게 증가
    },
    confidence: 0.72,
    processingTime: 45,          // ms
  },
};

/**
 * 차가운 조명(형광등) 환경 Mock
 */
export const COOL_LIGHT_MOCK: CIE3MockData = {
  input: {
    imageData: createMockImageData({
      width: 640,
      height: 480,
      avgR: 180,
      avgG: 200,
      avgB: 220,
    }),
    skinMask: generateSkinMask(640, 480, 0.25),
    forceAlgorithm: undefined,
  },
  expected: {
    algorithmUsed: 'von-kries',  // CCT 편차 > 2000K
    originalCCT: 7500,
    targetCCT: 6500,
    gains: {
      r: 1.22,
      g: 1.0,
      b: 0.91,
    },
    confidence: 0.78,
    processingTime: 52,
  },
};

/**
 * 최적 자연광 환경 Mock
 */
export const NATURAL_LIGHT_MOCK: CIE3MockData = {
  input: {
    imageData: createMockImageData({
      width: 640,
      height: 480,
      avgR: 190,
      avgG: 185,
      avgB: 180,
    }),
    skinMask: generateSkinMask(640, 480, 0.30),
    forceAlgorithm: undefined,
  },
  expected: {
    algorithmUsed: 'gray-world',  // 일반 케이스
    originalCCT: 5800,
    targetCCT: 6500,
    gains: {
      r: 0.97,
      g: 1.0,
      b: 1.03,
    },
    confidence: 0.92,             // 높은 신뢰도
    processingTime: 35,
  },
};

/**
 * 극단적 따뜻한 조명 (촛불) Mock
 */
export const EXTREME_WARM_MOCK: CIE3MockData = {
  input: {
    imageData: createMockImageData({
      width: 640,
      height: 480,
      avgR: 255,
      avgG: 147,
      avgB: 41,
    }),
    skinMask: generateSkinMask(640, 480, 0.40),
    forceAlgorithm: 'von-kries', // 강제 지정
  },
  expected: {
    algorithmUsed: 'von-kries',
    originalCCT: 1800,
    targetCCT: 6500,
    gains: {
      r: 0.65,                    // 극단적 R 감소
      g: 1.13,
      b: 4.05,                    // 극단적 B 증가
    },
    confidence: 0.38,             // 낮은 신뢰도 (극단 게인)
    processingTime: 58,
  },
};

/**
 * 클로즈업 얼굴 (비-피부 영역 부족) Mock
 */
export const EXTREME_CLOSEUP_MOCK: CIE3MockData = {
  input: {
    imageData: createMockImageData({
      width: 640,
      height: 480,
      avgR: 195,
      avgG: 145,
      avgB: 130,
    }),
    skinMask: generateSkinMask(640, 480, 0.95), // 95% 피부
    forceAlgorithm: 'skin-aware',
  },
  expected: {
    algorithmUsed: 'gray-world', // Skin-aware에서 폴백
    originalCCT: 4200,
    targetCCT: 6500,
    gains: {
      r: 0.85,
      g: 1.15,
      b: 1.28,
    },
    confidence: 0.55,             // 폴백으로 인한 낮은 신뢰도
    processingTime: 48,
    warnings: ['Insufficient non-skin area, falling back to Gray World'],
  },
};
```

### 11.2 Von Kries 변환 Mock

```typescript
/**
 * Bradford 적응 행렬 계산 예시
 */
export const BRADFORD_ADAPTATION_MOCK = {
  // 백열등(A) → D65 변환
  illuminantA_to_D65: {
    sourceWhiteXYZ: [109.85, 100.0, 35.58],
    destinationWhiteXYZ: [95.047, 100.0, 108.883],
    scalingFactors: {
      L: 0.8652,   // L 채널 감소 (붉은빛 억제)
      M: 0.9686,   // M 채널 약간 감소
      S: 3.0602,   // S 채널 크게 증가 (파란빛 보강)
    },
    adaptationMatrix: [
      [0.8447, -0.1179, 0.3948],
      [-0.1366, 1.1041, 0.1291],
      [0.0798, -0.1348, 3.1924],
    ],
  },

  // 형광등(F2) → D65 변환
  illuminantF2_to_D65: {
    sourceWhiteXYZ: [99.19, 100.0, 67.39],
    destinationWhiteXYZ: [95.047, 100.0, 108.883],
    scalingFactors: {
      L: 0.9581,
      M: 1.0000,
      S: 1.6157,
    },
    adaptationMatrix: [
      [0.9553, -0.0231, 0.1062],
      [-0.0185, 1.0089, 0.0382],
      [0.0063, -0.0106, 1.6184],
    ],
  },
};
```

### 11.3 피부 영역 감지 Mock

```typescript
/**
 * YCbCr 기반 피부 감지 테스트 데이터
 */
export const SKIN_DETECTION_MOCK = {
  // 한국인 피부톤 (밝은)
  koreanSkinLight: {
    rgb: [235, 195, 175],
    ycbcr: { y: 205, cb: 110, cr: 145 },
    isSkin: true,
  },

  // 한국인 피부톤 (중간)
  koreanSkinMedium: {
    rgb: [210, 165, 140],
    ycbcr: { y: 177, cb: 108, cr: 150 },
    isSkin: true,
  },

  // 한국인 피부톤 (어두운)
  koreanSkinDark: {
    rgb: [180, 130, 100],
    ycbcr: { y: 145, cb: 104, cr: 155 },
    isSkin: true,
  },

  // 빨간 옷 (피부 아님)
  redCloth: {
    rgb: [200, 50, 50],
    ycbcr: { y: 89, cb: 89, cr: 199 },
    isSkin: false, // Cr > 173
  },

  // 흰 배경 (피부 아님)
  whiteBackground: {
    rgb: [250, 250, 250],
    ycbcr: { y: 250, cb: 128, cr: 128 },
    isSkin: false, // Cb, Cr 범위 밖
  },

  // 파란 옷 (피부 아님)
  blueCloth: {
    rgb: [50, 80, 180],
    ycbcr: { y: 81, cb: 176, cr: 102 },
    isSkin: false, // Cb > 127
  },
};

/**
 * 피부 감지 범위 (YCbCr)
 */
export const SKIN_DETECTION_RANGE = {
  cb: { min: 77, max: 127 },
  cr: { min: 133, max: 173 },
};
```

### 11.4 한국 실내 조명 환경 Mock

> 한국 가정/사무실에서 흔히 사용되는 조명 환경 Mock 데이터

```typescript
// tests/mocks/cie-3-korean-lighting.ts

/**
 * 한국 실내 조명 환경 특성
 *
 * - 형광등(주광색/주백색): 5000K-6500K, 가장 흔함
 * - LED(백색): 4000K-5000K, 최근 증가
 * - 거실 간접조명(전구색): 2700K-3000K
 * - 화장대 조명(주백색): 4000K-4500K
 */

// 한국 가정 조명 시나리오
export const KOREAN_HOME_LIGHTING = {
  // 거실 형광등 (주광색 6500K) - 가장 흔함
  livingRoom_fluorescent_daylight: {
    scenario: 'korean_home_living_daylight',
    description: '거실 형광등 (주광색 6500K)',
    cct: 6500,
    avgColor: { r: 170, g: 180, b: 200 },  // 약간 푸른빛
    skinAppearance: 'cooler',              // 피부가 창백해 보임
    correctionNeeded: 'warm_up',           // 따뜻하게 보정 필요
    expectedGain: { r: 1.1, g: 1.0, b: 0.85 },
    prevalence: '45%',  // 한국 가정 사용 비율
  },

  // 거실 형광등 (주백색 4000K)
  livingRoom_fluorescent_neutral: {
    scenario: 'korean_home_living_neutral',
    description: '거실 형광등 (주백색 4000K)',
    cct: 4000,
    avgColor: { r: 185, g: 180, b: 170 },
    skinAppearance: 'neutral',
    correctionNeeded: 'slight_cool',
    expectedGain: { r: 0.95, g: 1.0, b: 1.05 },
    prevalence: '30%',
  },

  // 화장대/욕실 조명 (주백색)
  vanity_bathroom: {
    scenario: 'korean_home_vanity',
    description: '화장대/욕실 조명 (주백색 4500K)',
    cct: 4500,
    avgColor: { r: 180, g: 178, b: 175 },
    skinAppearance: 'slightly_warm',
    correctionNeeded: 'minimal',
    expectedGain: { r: 0.98, g: 1.0, b: 1.02 },
    note: '화장 시 가장 적합한 조명',
  },

  // 거실 간접조명 (전구색 LED)
  livingRoom_indirect_warm: {
    scenario: 'korean_home_indirect',
    description: '거실 간접조명 (전구색 LED 3000K)',
    cct: 3000,
    avgColor: { r: 210, g: 175, b: 140 },  // 따뜻한 노란빛
    skinAppearance: 'warm_yellow',         // 피부가 누렇게 보임
    correctionNeeded: 'cool_down',         // 차갑게 보정 필요
    expectedGain: { r: 0.8, g: 1.0, b: 1.2 },
    prevalence: '15%',
  },

  // 원룸 LED (백색)
  studio_led_white: {
    scenario: 'korean_studio_led',
    description: '원룸/오피스텔 LED (백색 5000K)',
    cct: 5000,
    avgColor: { r: 175, g: 180, b: 185 },
    skinAppearance: 'neutral_cool',
    correctionNeeded: 'slight_warm',
    expectedGain: { r: 1.03, g: 1.0, b: 0.97 },
    prevalence: '25%',
  },
};

// 한국 사무실/공공장소 조명 시나리오
export const KOREAN_OFFICE_LIGHTING = {
  // 사무실 천장 형광등 (주광색)
  office_ceiling_daylight: {
    scenario: 'korean_office_daylight',
    description: '사무실 천장 형광등 (6500K)',
    cct: 6500,
    avgColor: { r: 165, g: 180, b: 210 },  // 강한 푸른빛
    skinAppearance: 'pale_cool',
    correctionNeeded: 'warm_up_significant',
    expectedGain: { r: 1.15, g: 1.0, b: 0.8 },
    note: '화상 회의 시 피부가 창백해 보임',
  },

  // 카페 간접조명 (전구색)
  cafe_ambient: {
    scenario: 'korean_cafe_ambient',
    description: '카페 간접조명 (2800K)',
    cct: 2800,
    avgColor: { r: 220, g: 170, b: 120 },  // 강한 노란빛
    skinAppearance: 'warm_orange',
    correctionNeeded: 'cool_down_significant',
    expectedGain: { r: 0.7, g: 1.0, b: 1.3 },
    note: '셀카 시 피부가 노랗게 나옴',
  },

  // 백화점/쇼핑몰 (혼합 조명)
  department_store: {
    scenario: 'korean_department',
    description: '백화점/쇼핑몰 (혼합 4500K)',
    cct: 4500,
    avgColor: { r: 185, g: 180, b: 175 },
    skinAppearance: 'natural_enhanced',
    correctionNeeded: 'minimal',
    expectedGain: { r: 1.0, g: 1.0, b: 1.0 },
    note: '제품 색상 정확도를 위해 최적화된 조명',
  },
};

// 시간대별 자연광 혼합 시나리오
export const KOREAN_NATURAL_LIGHT_MIX = {
  // 아침 - 동향 창문 + 형광등
  morning_east_window: {
    scenario: 'morning_natural_mix',
    description: '아침 동향 창문 + 형광등 혼합',
    time: '07:00-09:00',
    naturalCct: 5500,          // 아침 햇빛
    artificialCct: 6500,       // 형광등
    ratio: { natural: 0.4, artificial: 0.6 },
    effectiveCct: 6100,
    avgColor: { r: 172, g: 180, b: 195 },
    note: '복합 광원으로 보정 정확도 제한',
  },

  // 오후 - 서향 창문 + 실내 조명
  afternoon_west_window: {
    scenario: 'afternoon_natural_mix',
    description: '오후 서향 창문 + 실내 조명 혼합',
    time: '15:00-17:00',
    naturalCct: 5000,          // 오후 햇빛 (약간 따뜻함)
    artificialCct: 4000,
    ratio: { natural: 0.3, artificial: 0.7 },
    effectiveCct: 4300,
    avgColor: { r: 188, g: 180, b: 168 },
    note: '비교적 자연스러운 피부톤',
  },

  // 저녁 - 노을 + 전구색 조명
  evening_sunset: {
    scenario: 'evening_sunset_mix',
    description: '저녁 노을 + 전구색 조명',
    time: '17:30-18:30',
    naturalCct: 3500,          // 노을빛
    artificialCct: 3000,
    ratio: { natural: 0.2, artificial: 0.8 },
    effectiveCct: 3100,
    avgColor: { r: 215, g: 175, b: 135 },
    note: '매우 따뜻한 톤, 강한 보정 필요',
  },
};

// 한국인 피부톤 YCbCr 범위 (확장)
export const KOREAN_SKIN_YCBCR_RANGES = {
  // 일반적인 한국인 피부톤 (Fitzpatrick III-IV)
  standard: {
    cb: { min: 80, max: 120 },
    cr: { min: 135, max: 165 },
    note: '대부분의 한국인 피부톤 범위',
  },

  // 밝은 피부톤 (Fitzpatrick II-III)
  light: {
    cb: { min: 85, max: 125 },
    cr: { min: 130, max: 155 },
    note: '밝은 피부, 여름 전',
  },

  // 태닝된 피부톤 (Fitzpatrick IV)
  tanned: {
    cb: { min: 75, max: 115 },
    cr: { min: 140, max: 170 },
    note: '야외 활동 후 또는 여름',
  },
};
```

### 11.5 한국 조명 Mock 활용 함수

```typescript
// tests/mocks/cie-3-korean-lighting.ts (계속)

import {
  KOREAN_HOME_LIGHTING,
  KOREAN_OFFICE_LIGHTING,
  KOREAN_NATURAL_LIGHT_MIX,
} from './cie-3-korean-lighting';

/**
 * 한국 조명 시나리오 기반 AWB 테스트 데이터 생성
 */
export function generateKoreanLightingMock(
  scenario: keyof typeof KOREAN_HOME_LIGHTING | keyof typeof KOREAN_OFFICE_LIGHTING,
  options?: {
    skinRatio?: number;  // 0-1 사이 피부 영역 비율
    imageSize?: { width: number; height: number };
  }
): CIE3MockData {
  const lightingData = KOREAN_HOME_LIGHTING[scenario as keyof typeof KOREAN_HOME_LIGHTING]
    || KOREAN_OFFICE_LIGHTING[scenario as keyof typeof KOREAN_OFFICE_LIGHTING];

  if (!lightingData) {
    throw new Error(`Unknown scenario: ${scenario}`);
  }

  const { avgColor, cct, expectedGain } = lightingData;
  const skinRatio = options?.skinRatio ?? 0.35;
  const { width, height } = options?.imageSize ?? { width: 640, height: 480 };

  return {
    input: {
      imageData: createMockImageData({
        width,
        height,
        avgR: avgColor.r,
        avgG: avgColor.g,
        avgB: avgColor.b,
      }),
      skinMask: generateSkinMask(width, height, skinRatio),
    },
    expected: {
      estimatedCct: cct,
      correctionGain: expectedGain,
      d65Convergence: 0.95,
      confidence: 0.85,
    },
    metadata: {
      scenario,
      description: lightingData.description,
      skinAppearance: lightingData.skinAppearance,
    },
  };
}

/**
 * 사용 예시:
 *
 * // 거실 형광등 (주광색) 테스트
 * const mock = generateKoreanLightingMock('livingRoom_fluorescent_daylight');
 *
 * // 카페 간접조명 테스트 (피부 비율 40%)
 * const mock = generateKoreanLightingMock('cafe_ambient', { skinRatio: 0.4 });
 */
```

---

## 12. 상세 테스트 케이스

### 12.1 단위 테스트 확장

```typescript
describe('CIE-3 AWB Correction - Extended Tests', () => {
  describe('색공간 변환 (CIE3-1)', () => {
    it('should convert sRGB to linear RGB correctly', () => {
      // 검정
      expect(srgbToLinear(0)).toBe(0);
      // 중간 회색 (sRGB 0.5)
      expect(srgbToLinear(0.5)).toBeCloseTo(0.214, 3);
      // 흰색
      expect(srgbToLinear(1)).toBe(1);
      // 감마 곡선 전환점
      expect(srgbToLinear(0.04045)).toBeCloseTo(0.00313, 4);
    });

    it('should convert linear RGB to XYZ correctly', () => {
      // D65 백색
      const whiteXYZ = linearRgbToXyz([1, 1, 1]);
      expect(whiteXYZ[0]).toBeCloseTo(95.047, 1);
      expect(whiteXYZ[1]).toBeCloseTo(100.0, 1);
      expect(whiteXYZ[2]).toBeCloseTo(108.883, 1);

      // 순수 빨강
      const redXYZ = linearRgbToXyz([1, 0, 0]);
      expect(redXYZ[0]).toBeCloseTo(41.246, 1);
      expect(redXYZ[1]).toBeCloseTo(21.267, 1);
      expect(redXYZ[2]).toBeCloseTo(1.933, 2);
    });

    it('should convert XYZ to LMS (Bradford) correctly', () => {
      const d65XYZ: Vec3 = [95.047, 100.0, 108.883];
      const lms = xyzToLms(d65XYZ);

      expect(lms[0]).toBeCloseTo(94.814, 1);  // L
      expect(lms[1]).toBeCloseTo(103.362, 1); // M
      expect(lms[2]).toBeCloseTo(108.734, 1); // S
    });

    it('should have invertible Bradford matrices', () => {
      const testVec: Vec3 = [50, 60, 70];
      const lms = multiplyMatrixVector(BRADFORD_XYZ_TO_LMS, testVec);
      const recovered = multiplyMatrixVector(BRADFORD_LMS_TO_XYZ, lms);

      expect(recovered[0]).toBeCloseTo(testVec[0], 3);
      expect(recovered[1]).toBeCloseTo(testVec[1], 3);
      expect(recovered[2]).toBeCloseTo(testVec[2], 3);
    });
  });

  describe('CCT 추정 (CIE3-2)', () => {
    it('should estimate D65 as ~6500K', () => {
      const xy = { x: 0.31271, y: 0.32902 };
      const cct = calculateMcCamyCCT(xy.x, xy.y);
      expect(cct).toBeCloseTo(6500, -2); // ±100K
    });

    it('should estimate Illuminant A as ~2856K', () => {
      const xy = { x: 0.4476, y: 0.4074 };
      const cct = calculateMcCamyCCT(xy.x, xy.y);
      expect(cct).toBeCloseTo(2856, -2); // ±100K
    });

    it('should handle edge cases gracefully', () => {
      // y = 0.1858 (분모 0)
      const cct = calculateMcCamyCCT(0.3320, 0.1858);
      expect(isFinite(cct)).toBe(false); // Infinity 또는 NaN
    });
  });

  describe('Gray World 보정 (CIE3-3)', () => {
    it('should normalize warm image channels', () => {
      const warmImage = createTestImage({ r: 200, g: 150, b: 100 });
      const result = applyGrayWorld(warmImage);

      // 보정 후 채널 평균이 같아야 함
      const [avgR, avgG, avgB] = calculateChannelAverages(result.correctedImageData);
      expect(Math.abs(avgR - avgG)).toBeLessThan(3);
      expect(Math.abs(avgG - avgB)).toBeLessThan(3);
    });

    it('should clamp values to 0-255', () => {
      const extremeImage = createTestImage({ r: 250, g: 100, b: 50 });
      const result = applyGrayWorld(extremeImage);

      // 모든 픽셀이 0-255 범위 내
      const pixels = result.correctedImageData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        expect(pixels[i]).toBeGreaterThanOrEqual(0);
        expect(pixels[i]).toBeLessThanOrEqual(255);
        expect(pixels[i + 1]).toBeGreaterThanOrEqual(0);
        expect(pixels[i + 1]).toBeLessThanOrEqual(255);
        expect(pixels[i + 2]).toBeGreaterThanOrEqual(0);
        expect(pixels[i + 2]).toBeLessThanOrEqual(255);
      }
    });

    it('should preserve neutral gray image', () => {
      const grayImage = createTestImage({ r: 128, g: 128, b: 128 });
      const result = applyGrayWorld(grayImage);

      expect(result.gainR).toBeCloseTo(1.0, 2);
      expect(result.gainG).toBeCloseTo(1.0, 2);
      expect(result.gainB).toBeCloseTo(1.0, 2);
    });
  });

  describe('피부 영역 감지 (CIE3-4)', () => {
    it('should detect Korean skin tones', () => {
      const skinPixels = [
        { r: 235, g: 195, b: 175 }, // 밝은 피부
        { r: 210, g: 165, b: 140 }, // 중간 피부
        { r: 180, g: 130, b: 100 }, // 어두운 피부
      ];

      skinPixels.forEach(pixel => {
        const ycbcr = rgbToYCbCr(pixel.r, pixel.g, pixel.b);
        expect(isSkinYCbCr(ycbcr.cb, ycbcr.cr)).toBe(true);
      });
    });

    it('should reject non-skin colors', () => {
      const nonSkinPixels = [
        { r: 200, g: 50, b: 50 },   // 빨강
        { r: 50, g: 80, b: 180 },   // 파랑
        { r: 250, g: 250, b: 250 }, // 흰색
        { r: 20, g: 20, b: 20 },    // 검정
      ];

      nonSkinPixels.forEach(pixel => {
        const ycbcr = rgbToYCbCr(pixel.r, pixel.g, pixel.b);
        expect(isSkinYCbCr(ycbcr.cb, ycbcr.cr)).toBe(false);
      });
    });
  });

  describe('Von Kries 변환 (CIE3-6)', () => {
    it('should compute correct adaptation matrix for A → D65', () => {
      const sourceWhite: Vec3 = [255, 197, 143]; // 대략 Illuminant A
      const result = applyVonKries(createTestImage({ r: 200, g: 150, b: 100 }), sourceWhite);

      // S (Blue) 스케일링이 가장 커야 함 (따뜻한→중립)
      expect(result.scalingFactors.S).toBeGreaterThan(result.scalingFactors.L);
      expect(result.scalingFactors.S).toBeGreaterThan(result.scalingFactors.M);
    });

    it('should preserve white point after adaptation', () => {
      const sourceWhite: Vec3 = [255, 180, 100];
      const whiteImage = createSolidColorImage(sourceWhite, 100, 100);
      const result = applyVonKries(whiteImage, sourceWhite);

      // 결과 이미지의 평균이 회색에 가까워야 함
      const [avgR, avgG, avgB] = calculateChannelAverages(result.correctedImageData);
      const maxDiff = Math.max(
        Math.abs(avgR - avgG),
        Math.abs(avgG - avgB),
        Math.abs(avgR - avgB)
      );
      expect(maxDiff).toBeLessThan(10);
    });
  });

  describe('신뢰도 계산 (CIE3-7)', () => {
    it('should return high confidence for moderate gains', () => {
      const confidence = calculateConfidence(
        { r: 1.1, g: 1.0, b: 0.9 },
        5500,
        6500,
        0.5
      );
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('should return low confidence for extreme gains', () => {
      const confidence = calculateConfidence(
        { r: 2.5, g: 0.4, b: 1.0 },
        2000,
        6500,
        0.1
      );
      expect(confidence).toBeLessThan(0.5);
    });

    it('should penalize low non-skin ratio', () => {
      const highNonSkin = calculateConfidence(
        { r: 1.1, g: 1.0, b: 0.9 },
        5500, 6500, 0.5
      );
      const lowNonSkin = calculateConfidence(
        { r: 1.1, g: 1.0, b: 0.9 },
        5500, 6500, 0.05
      );
      expect(highNonSkin).toBeGreaterThan(lowNonSkin);
    });
  });

  describe('통합 프로세서 (CIE3-8)', () => {
    it('should select skin-aware for high skin ratio', () => {
      const result = processAWB({
        imageData: createTestImage({ r: 200, g: 150, b: 100 }),
        skinMask: generateSkinMask(100, 100, 0.4), // 40% 피부
      });
      expect(result.algorithmUsed).toBe('skin-aware');
    });

    it('should select von-kries for large CCT deviation', () => {
      const result = processAWB({
        imageData: createTestImage({ r: 255, g: 180, b: 100 }), // ~2700K
        skinMask: generateSkinMask(100, 100, 0.1),
      });
      expect(result.algorithmUsed).toBe('von-kries');
    });

    it('should complete within 50ms', async () => {
      const start = performance.now();
      const result = processAWB({
        imageData: createTestImage({ r: 200, g: 150, b: 100 }),
      });
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      expect(result.processingTime).toBeLessThan(50);
    });
  });
});
```

### 12.2 통합 테스트

```typescript
describe('CIE-3 Pipeline Integration', () => {
  it('should integrate with CIE-2 skin mask', async () => {
    const testImage = loadTestImage('portrait-warm-light.jpg');

    // CIE-2에서 피부 마스크 획득
    const cie2Result = await extractLandmarks(testImage);

    // CIE-3에 피부 마스크 전달
    const cie3Result = await processAWB({
      imageData: testImage,
      skinMask: cie2Result.skinMask,
      faceLandmarks: cie2Result.landmarks,
    });

    expect(cie3Result.confidence).toBeGreaterThan(0);
    expect(cie3Result.algorithmUsed).toBeDefined();
  });

  it('should improve color neutrality', async () => {
    const warmImage = loadTestImage('face-warm-light.jpg');

    // 보정 전 색상 편차
    const beforeAvg = calculateChannelAverages(warmImage);
    const beforeDeviation = Math.max(
      Math.abs(beforeAvg[0] - beforeAvg[1]),
      Math.abs(beforeAvg[1] - beforeAvg[2])
    );

    // CIE-3 보정
    const result = await processAWB({ imageData: warmImage });

    // 보정 후 색상 편차
    const afterAvg = calculateChannelAverages(result.correctedImageData);
    const afterDeviation = Math.max(
      Math.abs(afterAvg[0] - afterAvg[1]),
      Math.abs(afterAvg[1] - afterAvg[2])
    );

    // 보정 후 편차가 감소해야 함
    expect(afterDeviation).toBeLessThan(beforeDeviation);
  });

  it('should propagate confidence to PC-1', async () => {
    const testImage = loadTestImage('portrait-mixed-light.jpg');

    const cie3Result = await processAWB({ imageData: testImage });

    // 신뢰도가 0-1 범위 내
    expect(cie3Result.confidence).toBeGreaterThanOrEqual(0);
    expect(cie3Result.confidence).toBeLessThanOrEqual(1);

    // PC-1 분석 시 신뢰도 전파 확인
    const pc1Result = await analyzePersonalColor({
      imageData: cie3Result.correctedImageData,
      awbConfidence: cie3Result.confidence,
    });

    // 최종 신뢰도가 AWB 신뢰도를 반영
    expect(pc1Result.finalConfidence).toBeLessThanOrEqual(cie3Result.confidence);
  });
});
```

---

## 13. P3 원자별 상세 성공 기준 (12개)

> **P3 원칙**: 모든 원자 ≤2시간, 독립 테스트 가능

| ID | 원자 | 시간 | 핵심 성공 기준 | 테스트 방법 |
|----|------|------|---------------|-------------|
| CIE3-1 | 색공간 변환 | 2h | D65 오차 <0.1%, 왕복 오차 <1 | 단위 테스트 |
| CIE3-2 | CCT 추정 | 2h | McCamy ±200K, D65=6500±100K | 단위 테스트 |
| CIE3-3 | Gray World | 2h | R/G/B 평균 차이 <5, 게인 0.5-2.0 | 단위 테스트 |
| CIE3-4 | YCbCr 변환 | 1h | 공식 정확도 100% | 단위 테스트 |
| CIE3-5 | 피부 마스크 | 2h | 감지율 85%+, 오탐률 <15% | 테스트 이미지 |
| CIE3-6 | 비-피부 평균 | 1.5h | <10% 시 폴백 플래그 | 단위 테스트 |
| CIE3-7 | Skin-Aware | 1.5h | 폴백 시 경고 로그 | 스파이 테스트 |
| CIE3-8 | Bradford 행렬 | 1.5h | 역행렬 정확도 99.9%+ | 단위 테스트 |
| CIE3-9 | 적응 행렬 | 1.5h | D65 수렴 | 단위 테스트 |
| CIE3-10 | Von Kries | 1.5h | 백색점 차이 <10 | 단위 테스트 |
| CIE3-11 | 신뢰도 | 2h | 0-1 범위, 극단 <0.5 | 단위 테스트 |
| CIE3-12 | 통합 프로세서 | 2h | <50ms, 분기 정확 | 통합 테스트 |

### 상세 성공 기준

#### 핵심 원자 (CIE3-1, CIE3-3)

```typescript
// CIE3-1: D65 변환 정확도
expect(Math.abs(xyz[0] - 95.047) / 95.047).toBeLessThan(0.001); // <0.1%

// CIE3-3: 채널 균형
const [avgR, avgG, avgB] = calculateChannelAverages(result);
expect(Math.abs(avgR - avgG)).toBeLessThan(5);
```

#### 피부 감지 (CIE3-4, CIE3-5)

```typescript
// CIE3-4: YCbCr 범위
const SKIN_RANGE = { cb: [77, 127], cr: [133, 173] };

// CIE3-5: 감지율 테스트
const koreanSkinSamples = [[235, 195, 175], [210, 165, 140], [180, 130, 100]];
koreanSkinSamples.forEach(rgb => expect(isSkin(rgb)).toBe(true));
```

#### Von Kries 파이프라인 (CIE3-8, CIE3-9, CIE3-10)

```typescript
// CIE3-8: 행렬 가역성
const recovered = multiplyMatrixVector(BRADFORD_LMS_TO_XYZ,
  multiplyMatrixVector(BRADFORD_XYZ_TO_LMS, testVec));
expect(recovered[0]).toBeCloseTo(testVec[0], 3);

// CIE3-9: D65 수렴
const adapted = multiplyMatrixVector(matrix, sourceWhite);
expect(adapted).toBeCloseTo(D65_WHITE_XYZ, 1);
```

#### 성능 기준 (전체)

| 원자 | 대상 | 성능 기준 |
|------|------|----------|
| CIE3-1 | 단일 픽셀 | <1μs |
| CIE3-3 | 640×480 | <20ms |
| CIE3-5 | 640×480 | <15ms |
| CIE3-12 | 640×480 전체 | <50ms |

---

## 11. 구현 일정 (Implementation Schedule)

### 11.1 일정 개요

| 항목 | 내용 |
|------|------|
| **예상 분기** | 2026 Q2 |
| **우선순위** | P0 (CIE 파이프라인 핵심) |
| **예상 기간** | 2-3주 |

### 11.2 선행 조건 (Prerequisites)

| 선행 모듈 | 상태 | 의존성 설명 |
|----------|------|------------|
| **CIE-1** (이미지 품질) | Complete | 입력 이미지 검증 |
| **CIE-2** (얼굴 감지) | Complete | 피부 영역 마스크 제공 |
| **색채학 원리** | Complete | Lab 색공간, Von Kries 이론 |

### 11.3 마일스톤

| Phase | 기간 | 주요 작업 | 산출물 |
|-------|------|----------|--------|
| **Phase 1** | 0.5주 | RGB→XYZ→Lab 변환, D65 기준 | `lib/image/color-converter.ts` |
| **Phase 2** | 1주 | Gray World 알고리즘, 피부톤 감지 | `lib/image/awb-estimator.ts` |
| **Phase 3** | 0.5주 | Von Kries 적응 변환 | `lib/image/von-kries.ts` |
| **Phase 4** | 0.5주 | 통합 AWB 파이프라인 | `lib/image/awb-pipeline.ts` |
| **Buffer** | 0.5주 | 성능 최적화, 테스트 | - |

### 11.4 후행 모듈 (Downstream)

| 모듈 | 사용 필드 | 영향 |
|------|----------|------|
| **PC-2** (퍼스널컬러 v2) | 보정된 이미지 | Lab 피부색 추출 정확도 |
| **S-2** (피부분석 v2) | 보정된 이미지 | 붉은기/색소 정량화 정확도 |
| **H-1** (헤어분석) | 보정된 이미지 | 헤어컬러 Lab 추출 |
| **M-1** (메이크업) | 보정된 이미지 | 립/아이 색상 정확도 |

### 11.5 위험 요소

| 위험 | 영향도 | 대응 |
|------|--------|------|
| 복합 광원 환경 | 중간 | 단일 광원 가정, 복합은 향후 버전 |
| 피부 감지 오류 | 낮음 | YCbCr + CIE-2 마스크 조합 |
| 성능 (50ms 목표) | 낮음 | 해상도 제한, 샘플링 최적화 |

---

**Version**: 2.4 | **Updated**: 2026-01-24 | 구현 일정 섹션 추가 (11절) - 2026 Q2, P0 우선순위

**Author**: Claude Code
**Reviewed by**: -
