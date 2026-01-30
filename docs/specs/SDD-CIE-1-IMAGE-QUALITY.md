# SDD: CIE-1 이미지 품질 검증 (Image Quality Validation)

> **Status**: 📋 Planned
> **Version**: 1.0
> **Created**: 2026-01-21
> **Updated**: 2026-01-21

> Core Image Engine의 첫 번째 단계로, 분석에 적합한 이미지인지 사전 검증하는 파이프라인

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"실시간 인간 수준 이미지 품질 판단"

- Real-time: 검증 시간 < 50ms (모바일 디바이스)
- Human-level: 전문 사진사 기준 95% 일치율
- Comprehensive: 선명도, 노출, 색온도, 해상도, 조명 균일도, 노이즈, 왜곡 등 모든 품질 요소
- Predictive: 분석 실패 확률 사전 예측 (95%+ 정확도)
- Adaptive: 디바이스/환경별 자동 임계값 조정
- Guidance: 실시간 촬영 가이드 (AR 오버레이)
- Recoverable: 경미한 품질 저하 시 자동 후보정 제안
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **계산 복잡도** | Laplacian 컨볼루션 O(n), 모바일 1280×720 기준 ~30ms |
| **노이즈 민감도** | Laplacian이 노이즈를 에지로 오인 (전처리 필요 시 +10ms) |
| **조명 다양성** | CCT 추정 오차 ±200K (극단적 조명 시 더 큼) |
| **하드웨어 한계** | 저가 카메라 하드웨어 선명도 한계 존재 |
| **주관성** | "좋은 이미지" 기준이 사용자마다 상이 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **처리 속도** | < 50ms (1280×720, 모바일) |
| **선명도 정확도** | 전문 사진사 평가와 95% 일치 |
| **노출 판정 정확도** | 히스토그램 기반 98% 정확도 |
| **CCT 추정 오차** | ±100K 이내 (자연광 기준) |
| **False Positive** | < 2% (좋은 이미지를 거부) |
| **False Negative** | < 5% (나쁜 이미지를 통과) |
| **신뢰도 예측** | 실제 분석 성공률과 R² > 0.9 |

### 현재 목표

**75%** - MVP CIE-1 이미지 품질 검증

- ✅ Laplacian Variance 선명도 측정 (계획)
- ✅ 히스토그램 노출 분석 (계획)
- ✅ McCamy CCT 추정 (계획)
- ✅ 해상도/얼굴 크기 검증 (계획)
- ✅ P3 원자 분해 완료 (13개 ATOM, 13시간)
- ⏳ 실시간 프리뷰 피드백 (미구현, 40%)
- ⏳ 노이즈 분석 (미구현, 0%)
- ⏳ 조명 균일도 분석 (미구현, 0%)
- ⏳ 렌즈 왜곡 감지 (미구현, 0%)
- ⏳ Adaptive 임계값 (미구현, 0%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 실시간 프리뷰 AR 가이드 | 복잡도 높음, WebXR 필요 | Phase 4 (고급 UX) |
| 딥러닝 품질 평가 | 모델 크기, 모바일 성능 | Phase 5 (AI 고도화) |
| 노이즈 레벨 분석 | CPU 부담, 현재 우선순위 낮음 | 사용자 불만 증가 시 |
| 조명 균일도 분석 | 복잡도, CIE-4에서 부분 처리 | Phase 3 (완성도) |
| 렌즈 왜곡 감지 | 발생 빈도 낮음, 우선순위 낮음 | 광각 렌즈 사용 증가 시 |
| 동적 임계값 조정 | 데이터 수집 필요, 초기엔 고정값 | 1만+ 이미지 수집 후 |
| 가우시안 블러 전처리 | +10ms 지연, 필요성 검증 필요 | 노이즈 오탐 빈번 시 |

### 구현 현황

| 기능 | 상태 | 위치 |
|------|------|------|
| Laplacian Variance 선명도 측정 | 📋 계획 | `lib/image-engine/quality-validator.ts` |
| 해상도/얼굴 크기 검증 | 📋 계획 | `lib/image-engine/quality-validator.ts` |
| 노출(밝기) 평가 | 📋 계획 | `lib/image-engine/exposure-analyzer.ts` |
| 색온도(CCT) 추정 | 📋 계획 | `lib/image-engine/cct-estimator.ts` |
| 얼굴 감지 통합 | 📋 계획 | `lib/image-engine/face-integration.ts` |
| 종합 품질 점수 계산 | 📋 계획 | `lib/image-engine/quality-score.ts` |
| 실시간 프리뷰 피드백 | ⏳ 향후 | `components/camera/PreviewFeedback.tsx` |

---

## 1. 개요

### 1.1 목적

- **분석 품질 보장**: 저품질 이미지가 AI 분석에 투입되는 것을 방지
- **사용자 피드백 제공**: 이미지 문제점을 구체적으로 안내하여 재촬영 유도
- **신뢰도 기반 구축**: 후속 분석 단계(CIE-2~4)의 신뢰도 산정 기초 제공
- **리소스 최적화**: 부적합한 이미지의 AI API 호출을 사전 차단

### 1.2 범위

| 항목 | 우선순위 | 복잡도 | 구현 상태 |
|------|----------|--------|----------|
| Laplacian Variance 선명도 측정 | 필수 | 중간 | 📋 계획 |
| 해상도/얼굴 크기 검증 | 필수 | 낮음 | 📋 계획 |
| 노출(밝기) 평가 | 필수 | 낮음 | 📋 계획 |
| 색온도(CCT) 추정 | 높음 | 중간 | 📋 계획 |
| 얼굴 감지 통합 | 높음 | 중간 | 📋 계획 |
| 실시간 프리뷰 피드백 | 낮음 | 높음 | ⏳ 향후 |

### 1.3 관련 문서

- [ADR-001: Core Image Engine](../adr/ADR-001-core-image-engine.md)
- [원리: 이미지 처리](../principles/image-processing.md)
- [원리: 색채학](../principles/color-science.md)
- [SDD-CIE-3: AWB 보정](./SDD-CIE-3-AWB-CORRECTION.md)

---

## 2. 품질 검증 이론

### 2.1 Laplacian Variance (선명도 측정)

```
┌─────────────────────────────────────────────────────────────┐
│                   Laplacian Variance 원리                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Laplacian 연산자: 이미지의 2차 도함수를 측정                 │
│                                                              │
│  수학적 정의:                                                │
│  ∇²f = ∂²f/∂x² + ∂²f/∂y²                                   │
│                                                              │
│  3×3 커널:                                                   │
│  [ 0   1   0 ]                                              │
│  [ 1  -4   1 ]                                              │
│  [ 0   1   0 ]                                              │
│                                                              │
│  분산 공식:                                                  │
│  σ² = (1/N) × Σ(Lᵢ - μ)²                                   │
│                                                              │
│  해석:                                                       │
│  - 선명한 이미지 = 에지 多 = 높은 분산                      │
│  - 흐린 이미지 = 에지 少 = 낮은 분산                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**성능 특성**:

| 특성 | 값 |
|------|-----|
| 계산 복잡도 | O(n), 단일 패스 컨볼루션 |
| 모바일 적합성 | 최고 |
| 노이즈 민감도 | 중간 (전처리 권장) |

**알고리즘 비교**:

| 방법 | 속도 | 정확도 | 선택 이유 |
|------|------|--------|----------|
| **Laplacian Variance** | ★★★★★ | ★★★☆☆ | **속도 우선, 모바일 최적** |
| Sobel + Variance | ★★★★☆ | ★★★★☆ | 더 정확하나 2배 느림 |
| Tenengrad | ★★★★☆ | ★★★★☆ | Sobel과 유사 |
| FFT 기반 | ★★☆☆☆ | ★★★★★ | 가장 정확하나 5배 느림 |

### 2.2 선명도 임계값

```
┌─────────────────────────────────────────────────────────────┐
│                  Laplacian Variance 임계값                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   0        80       120                500                   │
│   │─────────│─────────│─────────────────│──────────────▶    │
│   │  거부   │  경고   │      수용       │    최적      │    │
│   │         │         │                 │              │    │
│   │ 재촬영  │ 경고    │   분석 진행    │  최고 품질   │    │
│   │ 요청    │ 표시    │                │              │    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| 상태 | 값 | 조치 | 사용자 메시지 |
|------|-----|------|--------------|
| 거부 | < 80 | 재촬영 요청 | "이미지가 흐립니다. 초점을 맞춰 다시 촬영해주세요." |
| 경고 | 80-120 | 경고 후 진행 | "이미지 선명도가 낮습니다. 결과가 정확하지 않을 수 있습니다." |
| **수용** | **> 120** | **분석 진행** | - |
| 최적 | > 500 | 최고 품질 | "최적의 이미지 품질입니다." |

### 2.3 해상도 및 얼굴 크기 기준

```
┌─────────────────────────────────────────────────────────────┐
│                    해상도 및 얼굴 크기 기준                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  이미지 해상도:                                              │
│  ┌────────────┬────────────┬────────────┐                  │
│  │   최소     │    권장    │    최적    │                  │
│  │ 640×480    │  1280×720  │ 1920×1080  │                  │
│  │  (VGA)     │   (HD)     │  (Full HD) │                  │
│  └────────────┴────────────┴────────────┘                  │
│                                                              │
│  얼굴 크기 (픽셀):                                          │
│  ┌────────────┬────────────┬────────────┐                  │
│  │   최소     │    권장    │    최적    │                  │
│  │ 100×100    │  150×150   │  250×250   │                  │
│  └────────────┴────────────┴────────────┘                  │
│                                                              │
│  얼굴/이미지 비율:                                          │
│  - 최소: 10%                                                │
│  - 권장: 20-30%                                             │
│  - 최적: 30-50%                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 노출(밝기) 평가

**히스토그램 분석 기반**:

```
평균 밝기 = (1/N) × Σ(픽셀 값)

클리핑 비율:
- 저노출 클리핑 = (0-10 범위 픽셀 수) / 전체 픽셀 수
- 과노출 클리핑 = (245-255 범위 픽셀 수) / 전체 픽셀 수
```

| 상태 | 평균 밝기 | 클리핑 | 조치 |
|------|----------|--------|------|
| 저노출 | < 60 | > 10% (어두운 영역) | "조명이 어둡습니다. 밝은 곳에서 촬영해주세요." |
| **적정** | **80-190** | **< 5%** | **분석 진행** |
| 과노출 | > 210 | > 10% (밝은 영역) | "조명이 너무 밝습니다. 직사광선을 피해주세요." |

### 2.5 색온도(CCT) 추정

**McCamy 공식**:

```
1. RGB → XYZ 변환 (D65 기준):
   C_linear = C ≤ 0.04045 ? C/12.92 : ((C + 0.055)/1.055)^2.4

   [X]   [0.4124564  0.3575761  0.1804375]   [R]
   [Y] = [0.2126729  0.7151522  0.0721750] × [G]
   [Z]   [0.0193339  0.1191920  0.9503041]   [B]

2. 색도 좌표 계산:
   x = X / (X + Y + Z)
   y = Y / (X + Y + Z)

3. CCT 계산:
   n = (x - 0.3320) / (0.1858 - y)
   CCT = 449n³ + 3525n² + 6823.3n + 5520.33
```

| 품질 | CCT 범위 | 조치 |
|------|----------|------|
| **최적** | **5000-6500K** | 분석 진행 |
| 좋음 | 4500-7000K | 분석 진행 |
| 수용 가능 | 4000-8000K | CIE-3 보정 후 진행 |
| 부적합 | < 3000K 또는 > 8000K | "자연광에서 다시 촬영해주세요." |

---

## 3. 알고리즘 상세

### 3.1 Laplacian Variance 구현

```typescript
/**
 * Laplacian Variance 기반 선명도 측정
 *
 * 원리: Laplacian 연산자로 에지를 강조한 후 분산 계산
 * 선명한 이미지 = 많은 에지 = 높은 분산
 */
interface SharpnessResult {
  score: number;           // Laplacian variance 값
  isAcceptable: boolean;   // score > 120
  level: 'reject' | 'warning' | 'accept' | 'optimal';
  message: string;         // 사용자 메시지
}

function measureSharpness(imageData: ImageData): SharpnessResult {
  const { data, width, height } = imageData;

  // 1. 그레이스케일 변환
  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    // ITU-R BT.601 가중치
    gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // 2. Laplacian 컨볼루션 (3x3 커널)
  // [ 0  1  0 ]
  // [ 1 -4  1 ]
  // [ 0  1  0 ]
  const laplacian = new Float32Array(width * height);
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      const lap =
        gray[idx - width] +                    // 위
        gray[idx - 1] +                        // 왼쪽
        -4 * gray[idx] +                       // 중앙
        gray[idx + 1] +                        // 오른쪽
        gray[idx + width];                     // 아래

      laplacian[idx] = lap;
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  // 3. 분산 계산
  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  const score = Math.abs(variance);

  // 4. 레벨 판정
  const level = score < 80 ? 'reject' :
                score < 120 ? 'warning' :
                score < 500 ? 'accept' : 'optimal';

  const messages: Record<typeof level, string> = {
    reject: '이미지가 흐립니다. 초점을 맞춰 다시 촬영해주세요.',
    warning: '이미지 선명도가 낮습니다. 결과가 정확하지 않을 수 있습니다.',
    accept: '',
    optimal: '최적의 이미지 품질입니다.',
  };

  return {
    score,
    isAcceptable: level !== 'reject',
    level,
    message: messages[level],
  };
}
```

### 3.2 해상도 및 얼굴 크기 검증

```typescript
/**
 * 해상도 및 얼굴 크기 검증
 */
interface ResolutionResult {
  imageWidth: number;
  imageHeight: number;
  faceWidth: number;
  faceHeight: number;
  faceRatio: number;       // 얼굴/이미지 비율
  isAcceptable: boolean;
  level: 'reject' | 'warning' | 'accept' | 'optimal';
  message: string;
}

interface FaceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const RESOLUTION_THRESHOLDS = {
  minImage: { width: 640, height: 480 },
  recommendedImage: { width: 1280, height: 720 },
  minFace: { width: 100, height: 100 },
  recommendedFace: { width: 150, height: 150 },
  minFaceRatio: 0.10,      // 10%
  recommendedFaceRatio: 0.20,  // 20%
  optimalFaceRatio: 0.30,  // 30%
};

function validateResolution(
  imageData: ImageData,
  faceRect: FaceRect
): ResolutionResult {
  const { width: imgW, height: imgH } = imageData;
  const { width: faceW, height: faceH } = faceRect;

  const imageArea = imgW * imgH;
  const faceArea = faceW * faceH;
  const faceRatio = faceArea / imageArea;

  // 이미지 해상도 체크
  const isImageSizeOk = imgW >= RESOLUTION_THRESHOLDS.minImage.width &&
                        imgH >= RESOLUTION_THRESHOLDS.minImage.height;

  // 얼굴 크기 체크
  const isFaceSizeOk = faceW >= RESOLUTION_THRESHOLDS.minFace.width &&
                       faceH >= RESOLUTION_THRESHOLDS.minFace.height;

  // 얼굴 비율 체크
  const isFaceRatioOk = faceRatio >= RESOLUTION_THRESHOLDS.minFaceRatio;

  // 레벨 판정
  let level: 'reject' | 'warning' | 'accept' | 'optimal';
  let message = '';

  if (!isImageSizeOk) {
    level = 'reject';
    message = '이미지 해상도가 너무 낮습니다. 더 높은 해상도로 촬영해주세요.';
  } else if (!isFaceSizeOk) {
    level = 'reject';
    message = '얼굴이 너무 작습니다. 카메라에 더 가까이 다가가주세요.';
  } else if (!isFaceRatioOk) {
    level = 'warning';
    message = '얼굴이 화면에서 작게 보입니다. 더 가까이에서 촬영해주세요.';
  } else if (faceRatio >= RESOLUTION_THRESHOLDS.optimalFaceRatio &&
             faceW >= RESOLUTION_THRESHOLDS.recommendedFace.width) {
    level = 'optimal';
    message = '';
  } else {
    level = 'accept';
    message = '';
  }

  return {
    imageWidth: imgW,
    imageHeight: imgH,
    faceWidth: faceW,
    faceHeight: faceH,
    faceRatio,
    isAcceptable: level !== 'reject',
    level,
    message,
  };
}
```

### 3.3 노출 평가

```typescript
/**
 * 히스토그램 기반 노출 평가
 */
interface ExposureResult {
  meanBrightness: number;      // 평균 밝기 (0-255)
  underExposureRatio: number;  // 저노출 클리핑 비율
  overExposureRatio: number;   // 과노출 클리핑 비율
  isAcceptable: boolean;
  level: 'under' | 'optimal' | 'over';
  message: string;
}

const EXPOSURE_THRESHOLDS = {
  underMean: 60,
  overMean: 210,
  optimalMin: 80,
  optimalMax: 190,
  maxClipping: 0.05,  // 5%
};

function evaluateExposure(imageData: ImageData): ExposureResult {
  const { data } = imageData;
  const pixelCount = data.length / 4;

  let sum = 0;
  let underCount = 0;  // 0-10 범위
  let overCount = 0;   // 245-255 범위

  for (let i = 0; i < data.length; i += 4) {
    // Luminance (ITU-R BT.601)
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += lum;

    if (lum <= 10) underCount++;
    if (lum >= 245) overCount++;
  }

  const meanBrightness = sum / pixelCount;
  const underExposureRatio = underCount / pixelCount;
  const overExposureRatio = overCount / pixelCount;

  // 레벨 판정
  let level: 'under' | 'optimal' | 'over';
  let message = '';
  let isAcceptable = true;

  if (meanBrightness < EXPOSURE_THRESHOLDS.underMean ||
      underExposureRatio > 0.10) {
    level = 'under';
    message = '조명이 어둡습니다. 밝은 곳에서 촬영해주세요.';
    isAcceptable = false;
  } else if (meanBrightness > EXPOSURE_THRESHOLDS.overMean ||
             overExposureRatio > 0.10) {
    level = 'over';
    message = '조명이 너무 밝습니다. 직사광선을 피해주세요.';
    isAcceptable = false;
  } else {
    level = 'optimal';

    // 경고 수준 체크
    if (underExposureRatio > EXPOSURE_THRESHOLDS.maxClipping ||
        overExposureRatio > EXPOSURE_THRESHOLDS.maxClipping) {
      message = '일부 영역의 밝기가 적절하지 않습니다.';
    }
  }

  return {
    meanBrightness,
    underExposureRatio,
    overExposureRatio,
    isAcceptable,
    level,
    message,
  };
}
```

### 3.4 색온도(CCT) 추정

```typescript
/**
 * McCamy 공식 기반 색온도 추정
 */
interface CCTResult {
  cct: number;             // 색온도 (Kelvin)
  isAcceptable: boolean;
  needsCorrection: boolean;
  level: 'reject' | 'correctable' | 'good' | 'optimal';
  message: string;
}

const CCT_THRESHOLDS = {
  reject: { min: 3000, max: 8000 },
  correctable: { min: 4000, max: 7000 },
  good: { min: 4500, max: 6500 },
  optimal: { min: 5000, max: 6500 },
};

function estimateCCT(imageData: ImageData): CCTResult {
  const { data } = imageData;
  const pixelCount = data.length / 4;

  // 1. 평균 RGB 계산
  let sumR = 0, sumG = 0, sumB = 0;
  for (let i = 0; i < data.length; i += 4) {
    sumR += data[i];
    sumG += data[i + 1];
    sumB += data[i + 2];
  }

  const avgR = sumR / pixelCount / 255;
  const avgG = sumG / pixelCount / 255;
  const avgB = sumB / pixelCount / 255;

  // 2. sRGB → Linear RGB (감마 보정 해제)
  const linearR = srgbToLinear(avgR);
  const linearG = srgbToLinear(avgG);
  const linearB = srgbToLinear(avgB);

  // 3. Linear RGB → XYZ (D65)
  const X = 0.4124564 * linearR + 0.3575761 * linearG + 0.1804375 * linearB;
  const Y = 0.2126729 * linearR + 0.7151522 * linearG + 0.0721750 * linearB;
  const Z = 0.0193339 * linearR + 0.1191920 * linearG + 0.9503041 * linearB;

  // 4. XYZ → 색도 좌표 (x, y)
  const total = X + Y + Z;
  const x = total > 0 ? X / total : 0;
  const y = total > 0 ? Y / total : 0;

  // 5. McCamy 공식
  const n = (x - 0.3320) / (0.1858 - y);
  const cct = 449 * Math.pow(n, 3) + 3525 * Math.pow(n, 2) + 6823.3 * n + 5520.33;

  // 6. 레벨 판정
  let level: 'reject' | 'correctable' | 'good' | 'optimal';
  let message = '';
  let isAcceptable = true;
  let needsCorrection = false;

  if (cct < CCT_THRESHOLDS.reject.min || cct > CCT_THRESHOLDS.reject.max) {
    level = 'reject';
    message = '조명 조건이 적합하지 않습니다. 자연광에서 다시 촬영해주세요.';
    isAcceptable = false;
  } else if (cct < CCT_THRESHOLDS.correctable.min ||
             cct > CCT_THRESHOLDS.correctable.max) {
    level = 'correctable';
    message = '조명 색온도가 편향되어 있어 보정이 필요합니다.';
    needsCorrection = true;
  } else if (cct >= CCT_THRESHOLDS.optimal.min &&
             cct <= CCT_THRESHOLDS.optimal.max) {
    level = 'optimal';
    message = '';
  } else {
    level = 'good';
    message = '';
  }

  return {
    cct,
    isAcceptable,
    needsCorrection,
    level,
    message,
  };
}

/**
 * sRGB to Linear RGB 변환
 */
function srgbToLinear(c: number): number {
  return c <= 0.04045
    ? c / 12.92
    : Math.pow((c + 0.055) / 1.055, 2.4);
}
```

### 3.5 통합 품질 평가

```typescript
/**
 * CIE-1 통합 품질 평가
 */
interface CIE1Input {
  imageData: ImageData;
  faceRect?: FaceRect;     // 외부 얼굴 감지 결과 (선택)
}

interface CIE1Output {
  isAcceptable: boolean;   // 분석 진행 가능 여부
  overallScore: number;    // 종합 점수 (0-100)
  confidence: number;      // 신뢰도 (0-1)

  sharpness: SharpnessResult;
  resolution: ResolutionResult | null;  // 얼굴 감지 실패 시 null
  exposure: ExposureResult;
  colorTemperature: CCTResult;

  primaryIssue: string | null;   // 가장 심각한 문제
  allIssues: string[];           // 모든 문제 목록

  processingTime: number;  // ms
}

async function validateImageQuality(input: CIE1Input): Promise<CIE1Output> {
  const startTime = performance.now();
  const { imageData, faceRect } = input;

  const allIssues: string[] = [];

  // 1. 선명도 평가 (가중치: 30%)
  const sharpness = measureSharpness(imageData);
  if (sharpness.message) allIssues.push(sharpness.message);

  // 2. 해상도/얼굴 크기 평가 (가중치: 20%)
  let resolution: ResolutionResult | null = null;
  if (faceRect) {
    resolution = validateResolution(imageData, faceRect);
    if (resolution.message) allIssues.push(resolution.message);
  }

  // 3. 노출 평가 (가중치: 25%)
  const exposure = evaluateExposure(imageData);
  if (exposure.message) allIssues.push(exposure.message);

  // 4. 색온도 평가 (가중치: 25%)
  const colorTemperature = estimateCCT(imageData);
  if (colorTemperature.message) allIssues.push(colorTemperature.message);

  // 5. 종합 점수 계산
  const scoreWeights = {
    sharpness: 0.30,
    resolution: 0.20,
    exposure: 0.25,
    colorTemperature: 0.25,
  };

  const scores = {
    sharpness: levelToScore(sharpness.level),
    resolution: resolution ? levelToScore(resolution.level) : 70,
    exposure: exposure.level === 'optimal' ? 100 : 30,
    colorTemperature: levelToScore(colorTemperature.level),
  };

  const overallScore =
    scores.sharpness * scoreWeights.sharpness +
    scores.resolution * scoreWeights.resolution +
    scores.exposure * scoreWeights.exposure +
    scores.colorTemperature * scoreWeights.colorTemperature;

  // 6. 신뢰도 계산 (0-1)
  const confidence = overallScore / 100;

  // 7. 분석 가능 여부 판정
  const isAcceptable =
    sharpness.isAcceptable &&
    (resolution?.isAcceptable ?? true) &&
    exposure.isAcceptable &&
    colorTemperature.isAcceptable;

  // 8. 주요 이슈 선택
  const primaryIssue = allIssues.length > 0 ? allIssues[0] : null;

  const processingTime = performance.now() - startTime;

  return {
    isAcceptable,
    overallScore,
    confidence,
    sharpness,
    resolution,
    exposure,
    colorTemperature,
    primaryIssue,
    allIssues,
    processingTime,
  };
}

function levelToScore(level: string): number {
  const scoreMap: Record<string, number> = {
    reject: 20,
    under: 30,
    over: 30,
    warning: 60,
    correctable: 70,
    accept: 85,
    good: 90,
    optimal: 100,
  };
  return scoreMap[level] ?? 50;
}
```

---

## 4. 입력/출력 스펙

### 4.1 입력 인터페이스

```typescript
// types.ts
export interface CIE1Input {
  /**
   * 분석할 이미지 데이터
   * Canvas API의 getImageData() 결과
   */
  imageData: ImageData;

  /**
   * 얼굴 영역 (선택)
   * MediaPipe 또는 외부 얼굴 감지 결과
   * 제공하지 않으면 해상도/얼굴 크기 검증 생략
   */
  faceRect?: FaceRect;

  /**
   * 설정 오버라이드 (선택)
   */
  config?: Partial<CIE1Config>;
}

export interface FaceRect {
  x: number;       // 좌상단 X
  y: number;       // 좌상단 Y
  width: number;   // 너비
  height: number;  // 높이
}

export interface CIE1Config {
  sharpnessThreshold: {
    reject: number;      // 기본값: 80
    warning: number;     // 기본값: 120
    optimal: number;     // 기본값: 500
  };
  exposureThreshold: {
    underMean: number;   // 기본값: 60
    overMean: number;    // 기본값: 210
    maxClipping: number; // 기본값: 0.05
  };
  cctThreshold: {
    rejectMin: number;   // 기본값: 3000
    rejectMax: number;   // 기본값: 8000
    optimalMin: number;  // 기본값: 5000
    optimalMax: number;  // 기본값: 6500
  };
  resolutionThreshold: {
    minImageWidth: number;   // 기본값: 640
    minImageHeight: number;  // 기본값: 480
    minFaceWidth: number;    // 기본값: 100
    minFaceHeight: number;   // 기본값: 100
  };
}
```

### 4.2 출력 인터페이스

```typescript
export interface CIE1Output {
  /**
   * 분석 진행 가능 여부
   * false면 사용자에게 재촬영 안내
   */
  isAcceptable: boolean;

  /**
   * 종합 품질 점수 (0-100)
   * 70점 이상: 분석 진행
   * 50-69점: 경고 후 진행
   * 50점 미만: 재촬영 요청
   */
  overallScore: number;

  /**
   * 신뢰도 (0-1)
   * 후속 분석(CIE-2~4) 신뢰도 계산에 사용
   */
  confidence: number;

  /**
   * 개별 검사 결과
   */
  sharpness: SharpnessResult;
  resolution: ResolutionResult | null;
  exposure: ExposureResult;
  colorTemperature: CCTResult;

  /**
   * 사용자 피드백
   */
  primaryIssue: string | null;
  allIssues: string[];

  /**
   * 성능 메트릭
   */
  processingTime: number;
}
```

---

## 5. 에러 케이스 및 대응

### 5.1 에러 분류

| 에러 코드 | 설명 | 조치 |
|-----------|------|------|
| `CIE1_BLUR_SEVERE` | 선명도 < 80 | 재촬영 요청 |
| `CIE1_BLUR_WARNING` | 선명도 80-120 | 경고 후 진행 |
| `CIE1_UNDEREXPOSED` | 평균 밝기 < 60 | 재촬영 요청 |
| `CIE1_OVEREXPOSED` | 평균 밝기 > 210 | 재촬영 요청 |
| `CIE1_CCT_EXTREME` | CCT < 3000K 또는 > 8000K | 재촬영 요청 |
| `CIE1_CCT_BIASED` | CCT 편향 (보정 가능) | CIE-3로 전달 |
| `CIE1_RESOLUTION_LOW` | 이미지 해상도 부족 | 재촬영 요청 |
| `CIE1_FACE_SMALL` | 얼굴 크기 부족 | "가까이" 안내 |
| `CIE1_FACE_NOT_FOUND` | 얼굴 감지 실패 | 재촬영 요청 |

### 5.2 사용자 메시지 템플릿

```typescript
const USER_MESSAGES: Record<string, string> = {
  CIE1_BLUR_SEVERE: '이미지가 흐립니다. 초점을 맞춰 다시 촬영해주세요.',
  CIE1_BLUR_WARNING: '이미지 선명도가 낮습니다. 결과가 정확하지 않을 수 있습니다.',
  CIE1_UNDEREXPOSED: '조명이 어둡습니다. 밝은 곳에서 촬영해주세요.',
  CIE1_OVEREXPOSED: '조명이 너무 밝습니다. 직사광선을 피해주세요.',
  CIE1_CCT_EXTREME: '조명 조건이 적합하지 않습니다. 자연광에서 다시 촬영해주세요.',
  CIE1_CCT_BIASED: '조명 색온도가 편향되어 자동 보정됩니다.',
  CIE1_RESOLUTION_LOW: '이미지 해상도가 너무 낮습니다. 더 높은 해상도로 촬영해주세요.',
  CIE1_FACE_SMALL: '얼굴이 너무 작습니다. 카메라에 더 가까이 다가가주세요.',
  CIE1_FACE_NOT_FOUND: '얼굴을 찾을 수 없습니다. 정면을 바라보고 다시 촬영해주세요.',
};
```

### 5.3 Fallback 전략

```typescript
/**
 * CIE-1 실패 시 Fallback 전략
 */
async function validateWithFallback(input: CIE1Input): Promise<CIE1Output> {
  try {
    // 1차: 정상 검증
    return await validateImageQuality(input);
  } catch (error) {
    console.error('[CIE-1] Validation failed:', error);

    // 2차: 간소화된 검증 (선명도 + 노출만)
    try {
      const sharpness = measureSharpness(input.imageData);
      const exposure = evaluateExposure(input.imageData);

      return {
        isAcceptable: sharpness.isAcceptable && exposure.isAcceptable,
        overallScore: 50,  // 불확실
        confidence: 0.5,
        sharpness,
        resolution: null,
        exposure,
        colorTemperature: {
          cct: 5500,
          isAcceptable: true,
          needsCorrection: false,
          level: 'good',
          message: '',
        },
        primaryIssue: sharpness.message || exposure.message || null,
        allIssues: [sharpness.message, exposure.message].filter(Boolean),
        processingTime: 0,
      };
    } catch (fallbackError) {
      // 3차: 기본값 반환 (경고와 함께 진행)
      console.error('[CIE-1] Fallback also failed:', fallbackError);

      return {
        isAcceptable: true,  // 경고와 함께 진행
        overallScore: 40,
        confidence: 0.3,
        sharpness: { score: 100, isAcceptable: true, level: 'accept', message: '' },
        resolution: null,
        exposure: { meanBrightness: 128, underExposureRatio: 0, overExposureRatio: 0, isAcceptable: true, level: 'optimal', message: '' },
        colorTemperature: { cct: 5500, isAcceptable: true, needsCorrection: false, level: 'good', message: '' },
        primaryIssue: '이미지 품질 검증에 문제가 발생했습니다. 결과가 정확하지 않을 수 있습니다.',
        allIssues: ['이미지 품질 검증에 문제가 발생했습니다.'],
        processingTime: 0,
      };
    }
  }
}
```

---

## 6. P3 원자 분해

> **P3 원칙 준수**: 모든 ATOM ≤ 1시간 (2시간 경계값 분해 완료)

### 6.1 원자 목록

| ID | 원자 | 소요시간 | 입력 | 출력 | 의존성 |
|----|------|----------|------|------|--------|
| CIE1-1 | 그레이스케일 변환 유틸리티 | 1h | ImageData | Float32Array | - |
| CIE1-2-1 | Laplacian 컨볼루션 계산 | 1h | Float32Array | Float32Array | CIE1-1 |
| CIE1-2-2 | 선명도 분산 및 레벨 판정 | 1h | Float32Array | SharpnessResult | CIE1-2-1 |
| CIE1-3-1 | 히스토그램 밝기 계산 | 1h | ImageData | BrightnessMetrics | - |
| CIE1-3-2 | 노출 레벨 판정 | 1h | BrightnessMetrics | ExposureResult | CIE1-3-1 |
| CIE1-4 | sRGB-XYZ 색공간 변환 | 1h | RGB | XYZ | - |
| CIE1-5-1 | 평균 RGB 및 색도 좌표 계산 | 1h | ImageData | ChromaticityCoords | CIE1-4 |
| CIE1-5-2 | McCamy 공식 적용 및 레벨 판정 | 1h | ChromaticityCoords | CCTResult | CIE1-5-1 |
| CIE1-6 | 해상도/얼굴 크기 검증 | 1h | ImageData, FaceRect | ResolutionResult | - |
| CIE1-7-1 | 개별 검사 결과 수집 | 1h | CIE1Input | PartialResults | CIE1-2-2~6 |
| CIE1-7-2 | 가중 점수 계산 및 종합 판정 | 1h | PartialResults | CIE1Output | CIE1-7-1 |
| CIE1-8-1 | 1차 Fallback (간소화 검증) | 1h | Error | PartialCIE1Output | CIE1-7-2 |
| CIE1-8-2 | 2차 Fallback (기본값 반환) | 1h | Error | CIE1Output | CIE1-8-1 |

**총 ATOM**: 13개 (기존 8개 → 분해 후 13개)
**총 예상 시간**: 13시간 (변동 없음, 더 정밀한 추적 가능)

### 6.2 원자별 상세

#### CIE1-1: 그레이스케일 변환 유틸리티

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | 없음 |
| **병렬 가능** | Yes |

**입력**:
- `ImageData`: RGBA 이미지 데이터

**출력**:
- `lib/image-engine/utils/grayscale.ts`
  - `convertToGrayscale(imageData): Float32Array`

**성공 기준**:
- [ ] ITU-R BT.601 가중치 적용 (0.299R + 0.587G + 0.114B)
- [ ] Float32Array로 정밀도 유지
- [ ] 처리 시간 < 10ms (1280x720)
- [ ] 테스트 커버리지 90%+

---

#### CIE1-2-1: Laplacian 컨볼루션 계산

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | CIE1-1 |
| **병렬 가능** | No (CIE1-1 완료 후) |

**입력**:
- `Float32Array`: 그레이스케일 이미지

**출력**:
- `lib/image-engine/cie-1/sharpness.ts`
  - `computeLaplacian(gray, width, height): Float32Array`

**성공 기준**:
- [ ] 3×3 Laplacian 커널 정확히 구현: `[0,1,0], [1,-4,1], [0,1,0]`
- [ ] 경계 처리 (1px 패딩)
- [ ] 처리 시간 < 15ms (1280x720)
- [ ] 테스트 커버리지 90%+

---

#### CIE1-2-2: 선명도 분산 및 레벨 판정

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | CIE1-2-1 |
| **병렬 가능** | No (CIE1-2-1 완료 후) |

**입력**:
- `Float32Array`: Laplacian 결과

**출력**:
- `lib/image-engine/cie-1/sharpness.ts`
  - `calculateSharpnessScore(laplacian): SharpnessResult`

**성공 기준**:
- [ ] 분산 공식: σ² = (1/N) × Σ(Lᵢ - μ)²
- [ ] 임계값 판정: reject(<80), warning(80-120), accept(>120), optimal(>500)
- [ ] 사용자 메시지 매핑
- [ ] 테스트 케이스 3개 이상 (흐림/경고/선명)
- [ ] 테스트 커버리지 90%+

---

#### CIE1-3-1: 히스토그램 밝기 계산

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | 없음 |
| **병렬 가능** | Yes |

**입력**:
- `ImageData`: RGBA 이미지 데이터

**출력**:
- `lib/image-engine/cie-1/exposure.ts`
  - `calculateBrightness(imageData): BrightnessMetrics`

```typescript
interface BrightnessMetrics {
  meanBrightness: number;      // 0-255
  underClippingRatio: number;  // 0-10 범위 픽셀 비율
  overClippingRatio: number;   // 245-255 범위 픽셀 비율
}
```

**성공 기준**:
- [ ] ITU-R BT.601 Luminance 계산
- [ ] 클리핑 비율 정확도 검증
- [ ] 처리 시간 < 5ms (1280x720)
- [ ] 테스트 커버리지 90%+

---

#### CIE1-3-2: 노출 레벨 판정

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | CIE1-3-1 |
| **병렬 가능** | No (CIE1-3-1 완료 후) |

**입력**:
- `BrightnessMetrics`: 밝기 메트릭

**출력**:
- `lib/image-engine/cie-1/exposure.ts`
  - `determineExposureLevel(metrics): ExposureResult`

**성공 기준**:
- [ ] 저노출 판정: meanBrightness < 60 또는 underClipping > 10%
- [ ] 과노출 판정: meanBrightness > 210 또는 overClipping > 10%
- [ ] 적정 판정: 80 ≤ meanBrightness ≤ 190, clipping < 5%
- [ ] 사용자 메시지 매핑
- [ ] 테스트 케이스 3개 (저노출/적정/과노출)
- [ ] 테스트 커버리지 90%+

---

#### CIE1-4: sRGB-XYZ 색공간 변환

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | 없음 |
| **병렬 가능** | Yes |

**입력**:
- `RGB`: 0-255 정수 또는 0-1 정규화

**출력**:
- `lib/image-engine/utils/color-space.ts`
  - `srgbToLinear(c: number): number`
  - `rgbToXyz(r, g, b): { X: number; Y: number; Z: number }`
  - `xyzToChromaticity(xyz): { x: number; y: number }`

**성공 기준**:
- [ ] sRGB 감마 해제: c ≤ 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4
- [ ] D65 기준 변환 행렬 정확성
- [ ] 색도 좌표 정규화: x = X/(X+Y+Z), y = Y/(X+Y+Z)
- [ ] 참고: docs/principles/image-processing.md
- [ ] 테스트 커버리지 90%+

---

#### CIE1-5-1: 평균 RGB 및 색도 좌표 계산

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | CIE1-4 |
| **병렬 가능** | No (CIE1-4 완료 후) |

**입력**:
- `ImageData`: RGBA 이미지 데이터

**출력**:
- `lib/image-engine/cie-1/color-temperature.ts`
  - `computeChromaticityCoords(imageData): ChromaticityCoords`

```typescript
interface ChromaticityCoords {
  avgR: number;  // 평균 R (0-1)
  avgG: number;  // 평균 G (0-1)
  avgB: number;  // 평균 B (0-1)
  x: number;     // 색도 x
  y: number;     // 색도 y
}
```

**성공 기준**:
- [ ] 전체 픽셀 평균 RGB 계산
- [ ] RGB → XYZ → 색도 좌표 변환
- [ ] 처리 시간 < 10ms (1280x720)
- [ ] 테스트 커버리지 90%+

---

#### CIE1-5-2: McCamy 공식 적용 및 레벨 판정

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | CIE1-5-1 |
| **병렬 가능** | No (CIE1-5-1 완료 후) |

**입력**:
- `ChromaticityCoords`: 색도 좌표

**출력**:
- `lib/image-engine/cie-1/color-temperature.ts`
  - `estimateCCT(coords): CCTResult`

**성공 기준**:
- [ ] McCamy 공식: n = (x - 0.3320) / (0.1858 - y)
- [ ] CCT = 449n³ + 3525n² + 6823.3n + 5520.33
- [ ] 레벨 판정: reject(<3000K, >8000K), correctable(4000-7000K), optimal(5000-6500K)
- [ ] needsCorrection 플래그 설정 (CIE-3 연동)
- [ ] 테스트 케이스 3개 (자연광/백열등/형광등)
- [ ] 테스트 커버리지 90%+

---

#### CIE1-6: 해상도/얼굴 크기 검증

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | 없음 |
| **병렬 가능** | Yes |

**입력**:
- `ImageData`: 이미지 데이터
- `FaceRect`: 얼굴 영역 { x, y, width, height }

**출력**:
- `lib/image-engine/cie-1/resolution.ts`
  - `validateResolution(imageData, faceRect): ResolutionResult`

**성공 기준**:
- [ ] 이미지 해상도 체크 (최소 640×480)
- [ ] 얼굴 크기 체크 (최소 100×100px)
- [ ] 얼굴/이미지 비율 체크 (최소 10%)
- [ ] 레벨 판정 (reject/warning/accept/optimal)
- [ ] 테스트 케이스 3개 (저해상도/얼굴작음/적정)
- [ ] 테스트 커버리지 90%+

---

#### CIE1-7-1: 개별 검사 결과 수집

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | CIE1-2-2, CIE1-3-2, CIE1-5-2, CIE1-6 |
| **병렬 가능** | No (모든 검사 완료 후) |

**입력**:
- `CIE1Input`: { imageData, faceRect?, config? }

**출력**:
- `lib/image-engine/cie-1/quality-validator.ts`
  - `collectPartialResults(input): PartialResults`

```typescript
interface PartialResults {
  sharpness: SharpnessResult;
  exposure: ExposureResult;
  colorTemperature: CCTResult;
  resolution: ResolutionResult | null;
  allIssues: string[];
}
```

**성공 기준**:
- [ ] 모든 개별 검사 호출
- [ ] faceRect 없을 때 resolution = null 처리
- [ ] allIssues 배열 수집
- [ ] 처리 시간 < 40ms (1280x720)
- [ ] 테스트 커버리지 90%+

---

#### CIE1-7-2: 가중 점수 계산 및 종합 판정

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | CIE1-7-1 |
| **병렬 가능** | No (CIE1-7-1 완료 후) |

**입력**:
- `PartialResults`: 개별 검사 결과

**출력**:
- `lib/image-engine/cie-1/quality-validator.ts`
  - `computeFinalResult(partial, startTime): CIE1Output`

**성공 기준**:
- [ ] 가중치 적용: sharpness(30%), resolution(20%), exposure(25%), cct(25%)
- [ ] 종합 점수 0-100 계산
- [ ] 신뢰도 = overallScore / 100
- [ ] isAcceptable = 모든 검사 통과
- [ ] primaryIssue = allIssues[0] || null
- [ ] 테스트 케이스 3개 (통과/경고/거부)
- [ ] 테스트 커버리지 90%+

---

#### CIE1-8-1: 1차 Fallback (간소화 검증)

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | CIE1-7-2 (에러 시) |
| **병렬 가능** | N/A (에러 핸들링) |

**입력**:
- `Error`: CIE1-7 실패 에러
- `ImageData`: 원본 이미지

**출력**:
- `lib/image-engine/cie-1/fallback.ts`
  - `simplifiedValidation(imageData): PartialCIE1Output`

**성공 기준**:
- [ ] 선명도 + 노출 검사만 실행
- [ ] CCT = 5500K 기본값
- [ ] resolution = null
- [ ] overallScore = 50, confidence = 0.5
- [ ] 에러 로깅 (console.error)
- [ ] 테스트 커버리지 90%+

---

#### CIE1-8-2: 2차 Fallback (기본값 반환)

| 항목 | 값 |
|------|-----|
| **소요시간** | 1시간 |
| **의존성** | CIE1-8-1 (에러 시) |
| **병렬 가능** | N/A (에러 핸들링) |

**입력**:
- `Error`: CIE1-8-1 실패 에러

**출력**:
- `lib/image-engine/cie-1/fallback.ts`
  - `defaultFallback(): CIE1Output`

**성공 기준**:
- [ ] isAcceptable = true (경고와 함께 진행)
- [ ] overallScore = 40, confidence = 0.3
- [ ] 모든 검사 결과 기본값
- [ ] primaryIssue = "이미지 품질 검증에 문제가 발생했습니다."
- [ ] 에러 로깅 (console.error)
- [ ] 항상 유효한 CIE1Output 반환
- [ ] 테스트 커버리지 90%+

---

### 6.4 병렬 실행 그룹

| 그룹 | ATOM | 병렬 가능 | 예상 시간 |
|------|------|----------|----------|
| **G1** | CIE1-1, CIE1-3-1, CIE1-4, CIE1-6 | Yes | 1h (병렬) |
| **G2** | CIE1-2-1, CIE1-3-2, CIE1-5-1 | Yes | 1h (병렬) |
| **G3** | CIE1-2-2, CIE1-5-2 | Yes | 1h (병렬) |
| **G4** | CIE1-7-1 | No | 1h |
| **G5** | CIE1-7-2 | No | 1h |
| **G6** | CIE1-8-1, CIE1-8-2 | Yes | 1h (병렬) |

**병렬 실행 시 총 예상 시간**: 6시간 (순차 13시간 대비 54% 절약)

### 6.3 의존성 그래프

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CIE1 원자 의존성 그래프 (분해 후)                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     G1: 병렬 실행 가능                           │ │
│  │  CIE1-1        CIE1-3-1       CIE1-4        CIE1-6              │ │
│  │  (그레이스케일)  (밝기 계산)   (색공간 변환)   (해상도 검증)       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│      │               │              │              │                 │
│      ▼               ▼              ▼              │                 │
│  ┌─────────────────────────────────────────────┐   │                 │
│  │              G2: 병렬 실행 가능              │   │                 │
│  │  CIE1-2-1    CIE1-3-2      CIE1-5-1        │   │                 │
│  │  (Laplacian)  (노출 판정)   (색도 좌표)      │   │                 │
│  └─────────────────────────────────────────────┘   │                 │
│      │                              │              │                 │
│      ▼                              ▼              │                 │
│  ┌─────────────────────────────────────────────┐   │                 │
│  │              G3: 병렬 실행 가능              │   │                 │
│  │  CIE1-2-2              CIE1-5-2            │   │                 │
│  │  (선명도 점수)           (CCT 판정)         │   │                 │
│  └─────────────────────────────────────────────┘   │                 │
│      │                              │              │                 │
│      └──────────────┬───────────────┴──────────────┘                 │
│                     ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      G4: CIE1-7-1                               │ │
│  │                 (개별 검사 결과 수집)                            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                     │                                                │
│                     ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      G5: CIE1-7-2                               │ │
│  │                (가중 점수 및 종합 판정)                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                     │                                                │
│                     ▼ (에러 발생 시)                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                 G6: Fallback (순차)                              │ │
│  │  CIE1-8-1 (간소화 검증) ──▶ CIE1-8-2 (기본값 반환)              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

실행 흐름:
G1 (1h) → G2 (1h) → G3 (1h) → G4 (1h) → G5 (1h) → [G6 (1h, 에러 시만)]

총 예상 시간: 정상 5시간 / 에러 시 6시간
```

---

## 7. 파이프라인 통합

### 7.1 CIE-1 위치

```
┌─────────────────────────────────────────────────────────────┐
│                    Core Image Engine                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ CIE-1: 이미지 품질 검증 ◀━━━━ [이 문서]               │ │
│  │   ├── Laplacian Variance 선명도                        │ │
│  │   ├── 히스토그램 노출 분석                             │ │
│  │   ├── McCamy CCT 추정                                  │ │
│  │   └── 해상도/얼굴 크기 검증                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                      ↓                                       │
│  CIE-2: 얼굴 랜드마크 추출                                   │
│    └── 468점 랜드마크, 포즈 추정                            │
│                      ↓                                       │
│  CIE-3: 조명 보정 알고리즘                                   │
│    └── 화이트밸런스, 색온도 보정 (CCT 정보 활용)            │
│                      ↓                                       │
│  CIE-4: ROI(관심 영역) 추출                                  │
│    └── 피부존, 드레이프 영역                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 신뢰도 전파

```
최종 분석 신뢰도 = CIE-1 × CIE-2 × CIE-3 × CIE-4 × 분석모듈

예시:
CIE-1 (품질): 0.85 (overallScore 85점)
CIE-2 (랜드마크): 0.90
CIE-3 (AWB): 0.92
CIE-4 (ROI): 0.88
PC-1 (퍼스널컬러): 0.85

최종 = 0.85 × 0.90 × 0.92 × 0.88 × 0.85 = 0.53 (53%)
```

---

## 8. 파일 구조

```
lib/image-engine/
├── index.ts                    # 통합 export
├── types.ts                    # 공통 타입
├── constants.ts                # 임계값 상수
├── cie-1/
│   ├── index.ts                # CIE-1 모듈 export
│   ├── types.ts                # CIE-1 전용 타입
│   ├── quality-validator.ts    # 통합 품질 평가 (CIE1-7)
│   ├── sharpness.ts            # Laplacian 선명도 (CIE1-2)
│   ├── exposure.ts             # 노출 평가 (CIE1-3)
│   ├── color-temperature.ts    # CCT 추정 (CIE1-5)
│   ├── resolution.ts           # 해상도 검증 (CIE1-6)
│   └── fallback.ts             # 에러 핸들링 (CIE1-8)
└── utils/
    ├── grayscale.ts            # 그레이스케일 변환 (CIE1-1)
    └── color-space.ts          # 색공간 변환 (CIE1-4)
```

---

## 9. 테스트 케이스

### 9.1 단위 테스트

```typescript
describe('CIE-1 Image Quality Validation', () => {
  describe('Sharpness (Laplacian Variance)', () => {
    it('should reject blurry images with score < 80', () => {
      const blurryImage = loadTestImage('blur-severe.jpg');
      const result = measureSharpness(blurryImage);

      expect(result.score).toBeLessThan(80);
      expect(result.level).toBe('reject');
      expect(result.isAcceptable).toBe(false);
    });

    it('should accept sharp images with score > 120', () => {
      const sharpImage = loadTestImage('sharp-portrait.jpg');
      const result = measureSharpness(sharpImage);

      expect(result.score).toBeGreaterThan(120);
      expect(result.level).toBe('accept');
      expect(result.isAcceptable).toBe(true);
    });

    it('should mark optimal images with score > 500', () => {
      const optimalImage = loadTestImage('high-quality.jpg');
      const result = measureSharpness(optimalImage);

      expect(result.score).toBeGreaterThan(500);
      expect(result.level).toBe('optimal');
    });
  });

  describe('Exposure', () => {
    it('should detect underexposed images', () => {
      const darkImage = loadTestImage('underexposed.jpg');
      const result = evaluateExposure(darkImage);

      expect(result.meanBrightness).toBeLessThan(60);
      expect(result.level).toBe('under');
      expect(result.isAcceptable).toBe(false);
    });

    it('should detect overexposed images', () => {
      const brightImage = loadTestImage('overexposed.jpg');
      const result = evaluateExposure(brightImage);

      expect(result.meanBrightness).toBeGreaterThan(210);
      expect(result.level).toBe('over');
      expect(result.isAcceptable).toBe(false);
    });

    it('should accept properly exposed images', () => {
      const normalImage = loadTestImage('normal-exposure.jpg');
      const result = evaluateExposure(normalImage);

      expect(result.meanBrightness).toBeGreaterThanOrEqual(80);
      expect(result.meanBrightness).toBeLessThanOrEqual(190);
      expect(result.level).toBe('optimal');
      expect(result.isAcceptable).toBe(true);
    });
  });

  describe('Color Temperature (CCT)', () => {
    it('should estimate daylight around 5500-6500K', () => {
      const daylightImage = loadTestImage('daylight.jpg');
      const result = estimateCCT(daylightImage);

      expect(result.cct).toBeGreaterThanOrEqual(5000);
      expect(result.cct).toBeLessThanOrEqual(6500);
      expect(result.level).toBe('optimal');
    });

    it('should detect warm lighting under 4000K', () => {
      const warmImage = loadTestImage('incandescent.jpg');
      const result = estimateCCT(warmImage);

      expect(result.cct).toBeLessThan(4000);
      expect(result.needsCorrection).toBe(true);
    });

    it('should reject extreme CCT values', () => {
      const extremeImage = loadTestImage('colored-light.jpg');
      const result = estimateCCT(extremeImage);

      const isExtreme = result.cct < 3000 || result.cct > 8000;
      if (isExtreme) {
        expect(result.level).toBe('reject');
        expect(result.isAcceptable).toBe(false);
      }
    });
  });

  describe('Resolution Validation', () => {
    it('should reject small face sizes', () => {
      const smallFaceImage = loadTestImage('face-far.jpg');
      const faceRect = { x: 200, y: 150, width: 80, height: 80 };
      const result = validateResolution(smallFaceImage, faceRect);

      expect(result.faceWidth).toBeLessThan(100);
      expect(result.level).toBe('reject');
      expect(result.isAcceptable).toBe(false);
    });

    it('should accept adequate face sizes', () => {
      const normalImage = loadTestImage('face-close.jpg');
      const faceRect = { x: 100, y: 80, width: 200, height: 250 };
      const result = validateResolution(normalImage, faceRect);

      expect(result.faceWidth).toBeGreaterThanOrEqual(150);
      expect(result.isAcceptable).toBe(true);
    });
  });
});
```

### 9.2 통합 테스트

```typescript
describe('CIE-1 Integration', () => {
  it('should pass quality images through pipeline', async () => {
    const goodImage = loadTestImage('high-quality-portrait.jpg');
    const faceRect = detectFace(goodImage);

    const result = await validateImageQuality({
      imageData: goodImage,
      faceRect,
    });

    expect(result.isAcceptable).toBe(true);
    expect(result.overallScore).toBeGreaterThan(70);
    expect(result.primaryIssue).toBeNull();
  });

  it('should reject poor quality images with specific feedback', async () => {
    const poorImage = loadTestImage('blur-dark-portrait.jpg');
    const faceRect = detectFace(poorImage);

    const result = await validateImageQuality({
      imageData: poorImage,
      faceRect,
    });

    expect(result.isAcceptable).toBe(false);
    expect(result.allIssues.length).toBeGreaterThan(0);
    expect(result.primaryIssue).toBeTruthy();
  });

  it('should handle missing face gracefully', async () => {
    const noFaceImage = loadTestImage('landscape.jpg');

    const result = await validateImageQuality({
      imageData: noFaceImage,
      // faceRect 미제공
    });

    // resolution은 null이어야 함
    expect(result.resolution).toBeNull();
    // 나머지 검사는 정상 수행
    expect(result.sharpness).toBeDefined();
    expect(result.exposure).toBeDefined();
    expect(result.colorTemperature).toBeDefined();
  });

  it('should recover from errors with fallback', async () => {
    const corruptImage = createCorruptImageData();

    const result = await validateWithFallback({
      imageData: corruptImage,
    });

    // 항상 유효한 결과 반환
    expect(result).toBeDefined();
    expect(result.isAcceptable).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});
```

---

## 10. 구현 우선순위

> **P3 원칙 준수**: 모든 ATOM ≤ 1시간, 병렬 실행 그룹별 구현

### Phase 1 (Day 1): 기반 유틸리티

| ATOM | 작업 | 시간 | 병렬 |
|------|------|------|------|
| CIE1-1 | 그레이스케일 변환 유틸리티 | 1h | G1 |
| CIE1-4 | sRGB-XYZ 색공간 변환 | 1h | G1 |

**산출물**: `lib/image-engine/utils/grayscale.ts`, `color-space.ts`

### Phase 2 (Day 2): 선명도 검사

| ATOM | 작업 | 시간 | 병렬 |
|------|------|------|------|
| CIE1-2-1 | Laplacian 컨볼루션 계산 | 1h | G2 |
| CIE1-2-2 | 선명도 분산 및 레벨 판정 | 1h | G3 |

**산출물**: `lib/image-engine/cie-1/sharpness.ts`

### Phase 3 (Day 3): 노출 검사

| ATOM | 작업 | 시간 | 병렬 |
|------|------|------|------|
| CIE1-3-1 | 히스토그램 밝기 계산 | 1h | G1 |
| CIE1-3-2 | 노출 레벨 판정 | 1h | G2 |

**산출물**: `lib/image-engine/cie-1/exposure.ts`

### Phase 4 (Day 4): 색온도 검사

| ATOM | 작업 | 시간 | 병렬 |
|------|------|------|------|
| CIE1-5-1 | 평균 RGB 및 색도 좌표 계산 | 1h | G2 |
| CIE1-5-2 | McCamy 공식 적용 및 레벨 판정 | 1h | G3 |

**산출물**: `lib/image-engine/cie-1/color-temperature.ts`

### Phase 5 (Day 5): 해상도 검사

| ATOM | 작업 | 시간 | 병렬 |
|------|------|------|------|
| CIE1-6 | 해상도/얼굴 크기 검증 | 1h | G1 |

**산출물**: `lib/image-engine/cie-1/resolution.ts`

### Phase 6 (Day 6): 통합 프로세서

| ATOM | 작업 | 시간 | 병렬 |
|------|------|------|------|
| CIE1-7-1 | 개별 검사 결과 수집 | 1h | G4 |
| CIE1-7-2 | 가중 점수 계산 및 종합 판정 | 1h | G5 |

**산출물**: `lib/image-engine/cie-1/quality-validator.ts`

### Phase 7 (Day 7): 에러 핸들링

| ATOM | 작업 | 시간 | 병렬 |
|------|------|------|------|
| CIE1-8-1 | 1차 Fallback (간소화 검증) | 1h | G6 |
| CIE1-8-2 | 2차 Fallback (기본값 반환) | 1h | G6 |

**산출물**: `lib/image-engine/cie-1/fallback.ts`

---

### 총 구현 일정

| Phase | Day | ATOM 수 | 예상 시간 |
|-------|-----|---------|----------|
| 1 | Day 1 | 2 | 2h |
| 2 | Day 2 | 2 | 2h |
| 3 | Day 3 | 2 | 2h |
| 4 | Day 4 | 2 | 2h |
| 5 | Day 5 | 1 | 1h |
| 6 | Day 6 | 2 | 2h |
| 7 | Day 7 | 2 | 2h |
| **합계** | **7일** | **13개** | **13h** |

**병렬 실행 시**: 그룹별 1시간씩, 총 6시간 (54% 절약)

---

## 11. 리스크 및 완화

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|----------|
| Laplacian 노이즈 민감성 | 중간 | 중간 | 가우시안 블러 전처리 옵션 |
| CCT 추정 오차 | 낮음 | 낮음 | ±200K 허용 오차, CIE-3에서 보정 |
| 처리 성능 저하 | 낮음 | 중간 | Web Worker 분리, 다운샘플링 |
| 얼굴 감지 실패 | 중간 | 중간 | faceRect 없이도 동작, 부분 결과 반환 |
| 극단적 조명 조건 | 중간 | 높음 | 명확한 사용자 피드백, 재촬영 유도 |

---

## 12. 관련 문서

| 문서 | 설명 |
|------|------|
| [ADR-001: Core Image Engine](../adr/ADR-001-core-image-engine.md) | CIE 아키텍처 결정 |
| [원리: 이미지 처리](../principles/image-processing.md) | Laplacian, CCT 원리 |
| [원리: 색채학](../principles/color-science.md) | Lab 색공간, 피부톤 |
| [SDD-CIE-3: AWB 보정](./SDD-CIE-3-AWB-CORRECTION.md) | 화이트밸런스 보정 |

---

**Author**: Claude Code
**Reviewed by**: -
