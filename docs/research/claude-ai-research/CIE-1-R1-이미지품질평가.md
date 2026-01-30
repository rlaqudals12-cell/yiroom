# CIE-1-R1: 이미지 품질 평가 알고리즘 심층 리서치

## 1. 핵심 요약

퍼스널 컬러 분석을 위한 이미지 품질 평가에서 **Laplacian Variance**가 실시간 모바일 처리에 가장 적합한 선명도 측정 방법입니다. O(n) 복잡도로 단일 3×3 컨볼루션만 필요하며, 임계값 **100-150** 범위에서 효과적인 블러 감지가 가능합니다. 색온도는 **McCamy 공식**으로 추정하며, 피부톤 분석에 적합한 CCT 범위는 **5000K-6500K**입니다. 화이트밸런스 보정은 **Shades of Gray (p=6)** 알고리즘이 정확도와 속도의 최적 균형을 제공합니다. 브라우저에서는 **Web Workers + OffscreenCanvas**, React Native에서는 **Vision Camera Frame Processors**를 활용하여 **50-100ms** 내 실시간 처리가 가능합니다.

---

## 2. 상세 내용

### 2.1 Sharpness 측정: Laplacian vs Sobel 비교

#### Laplacian Variance 방법

Laplacian 연산자는 이미지의 2차 도함수를 측정하여 강도 변화율을 계산합니다. 선명한 이미지는 에지가 많아 Laplacian 응답의 분산이 높고, 흐린 이미지는 에지가 적어 분산이 낮습니다.

**수학적 원리:**
```
∇²f = ∂²f/∂x² + ∂²f/∂y²
```

**3×3 커널:**
```
L = [ 0   1   0 ]
    [ 1  -4   1 ]
    [ 0   1   0 ]
```

**분산 계산:**
```
σ² = (1/N) × Σ(Lᵢ - μ)²
```

- **계산 복잡도**: O(n), 단일 패스 컨볼루션
- **공간 복잡도**: O(n)
- **장점**: 구현 간단, 매우 빠름, 모바일 실시간 처리에 최적
- **단점**: 노이즈에 민감, 이미지 내용에 따라 임계값 조정 필요

#### Sobel 기반 Sharpness 측정

Sobel 연산자는 1차 도함수(그래디언트)를 계산하며, 수평/수직 방향의 두 커널을 사용합니다.

**Sobel 커널:**
```
Gx = [-1  0  1]    Gy = [-1 -2 -1]
     [-2  0  2]         [ 0  0  0]
     [-1  0  1]         [ 1  2  1]
```

**그래디언트 크기:**
```
G = √(Gx² + Gy²)  또는 근사값: G ≈ |Gx| + |Gy|
```

- **계산 복잡도**: O(n), 두 번의 컨볼루션 + 크기 계산
- **장점**: 노이즈에 강함(스무딩 포함), 에지 기반 평가에 우수
- **단점**: Laplacian보다 느림, 두 커널 필요

#### 알고리즘 비교표

| 방법 | 속도 | 정확도 | 노이즈 강건성 | 모바일 적합성 |
|------|------|--------|---------------|---------------|
| **Laplacian Variance** | ★★★★★ | ★★★☆☆ | ★★☆☆☆ | 최고 |
| **Sobel + Variance** | ★★★★☆ | ★★★★☆ | ★★★☆☆ | 매우 좋음 |
| **Tenengrad** | ★★★★☆ | ★★★★☆ | ★★★★☆ | 매우 좋음 |
| **Brenner Gradient** | ★★★★★ | ★★★☆☆ | ★★☆☆☆ | 최고 |
| **FFT 기반** | ★★☆☆☆ | ★★★★★ | ★★★★★ | 보통 |

**Tenengrad**은 Sobel 그래디언트 크기의 제곱합으로, 카메라 오토포커스 시스템에서 널리 사용됩니다. **Brenner Gradient**은 2픽셀 간격의 차이 제곱을 계산하여 매우 빠르지만 방향성 편향이 있습니다. **FFT 기반**은 주파수 도메인에서 고주파 성분을 분석하며 가장 정확하지만 O(n log n) 복잡도로 모바일 실시간에는 부적합합니다.

**권장**: 모바일 실시간 처리에는 **Laplacian Variance**를 기본으로, 노이즈가 많은 환경에서는 **Tenengrad** 사용

---

### 2.2 색온도(CCT) 추정

#### 핵심 개념

**상관 색온도(CCT)**는 주어진 광원의 색이 흑체 복사체(Planckian radiator)의 어떤 온도와 가장 유사한지를 나타내는 값입니다. **Planckian locus**는 흑체 온도에 따른 색도 좌표의 궤적으로, CIE 색도 다이어그램에서 곡선으로 표현됩니다.

**Δuv**는 광원이 Planckian locus로부터 얼마나 떨어져 있는지를 나타내며, CIE는 Δuv > 0.05인 경우 CCT 사용을 권장하지 않습니다.

#### McCamy 공식

McCamy(1992)가 제안한 CCT 근사 공식으로, CIE 1931 (x,y) 색도 좌표에서 직접 계산합니다:

```
n = (x - 0.3320) / (0.1858 - y)
CCT = 449n³ + 3525n² + 6823.3n + 5520.33
```

- **정확도**: 2856K-6504K 범위에서 ±2K
- **장점**: 빠른 계산, 구현 간단
- **한계**: 범위 외에서 정확도 저하, Planckian locus에서 먼 광원에 부적합

#### Robertson 방법

미리 계산된 등온선(isotherms) 룩업 테이블과 선형 보간을 사용하는 방법입니다:

```
CCT = 1 / (1/Tᵢ + (dᵢ/(dᵢ + dᵢ₊₁)) × (1/Tᵢ₊₁ - 1/Tᵢ))
```

- **정확도**: 31개 행 LUT로 ±12K
- **장점**: 넓은 온도 범위(1667K-∞)
- **단점**: McCamy보다 복잡, 느림

**권장**: 실시간 앱에서는 **McCamy 공식** 사용, 정밀 측정 필요시 Robertson

#### 색공간 변환

**sRGB → XYZ 변환** (D65 기준백색):

1. 감마 확장(선형화):
```
C_linear = C_srgb ≤ 0.04045 ? C_srgb/12.92 : ((C_srgb + 0.055)/1.055)^2.4
```

2. 행렬 곱:
```
[X]   [0.4124564  0.3575761  0.1804375]   [R_linear]
[Y] = [0.2126729  0.7151522  0.0721750] × [G_linear]
[Z]   [0.0193339  0.1191920  0.9503041]   [B_linear]
```

**XYZ → xy 색도 좌표**:
```
x = X / (X + Y + Z)
y = Y / (X + Y + Z)
```

---

### 2.3 화이트밸런스 자동 보정

#### Gray World Algorithm

**원리**: 자연 장면의 평균 반사율은 무채색(회색)이라고 가정합니다.

**공식**:
```
R_avg, G_avg, B_avg = 각 채널 평균
Gray = (R_avg + G_avg + B_avg) / 3
gain_R = Gray / R_avg
gain_G = Gray / G_avg  
gain_B = Gray / B_avg
```

- **장점**: 간단, 빠름 O(n), 학습 불필요
- **한계**: 지배적인 색상이 있는 장면에서 실패 (잔디, 하늘 등)

#### White Patch (Max-RGB) Algorithm

**원리**: 이미지에서 가장 밝은 점이 흰색이라고 가정합니다.

**공식**:
```
R_e = max(R), G_e = max(G), B_e = max(B)
gain_R = 255 / R_e (또는 목표 백색 / R_e)
```

- **장점**: 계산 간단, 반사 하이라이트가 있을 때 효과적
- **한계**: 노이즈에 극도로 민감, 과노출 픽셀에서 정보 손실

#### Shades of Gray Algorithm (권장)

Finlayson & Trezzi(2004)가 제안한 **Minkowski norm** 기반 일반화 방법입니다:

**공식**:
```
μp(X) = ((1/N) × Σ|Xᵢ|^p)^(1/p)

p = 1: Gray World (L1 norm = 평균)
p → ∞: Max-RGB (L∞ norm = 최대값)
p = 6: 최적값 (실험적으로 검증)
```

- **최적 p=6**: 밝은 픽셀에 더 가중치를 주면서도 모든 픽셀 고려
- **성능**: 표준 벤치마크에서 훨씬 복잡한 학습 기반 알고리즘과 유사한 정확도
- **장점**: 정확도와 속도의 최적 균형, 실시간 모바일 처리에 적합

**알고리즘 비교**:

| 알고리즘 | 속도 | 정확도 | 강건성 | 최적 사용 사례 |
|----------|------|--------|--------|----------------|
| Gray World | 매우 빠름 | 낮음-중간 | 낮음 | 다양한 색상의 균형 잡힌 장면 |
| White Patch | 빠름 | 중간 | 매우 낮음 | 흰색 참조가 있는 장면 |
| **Shades of Gray (p=6)** | 빠름 | 높음 | 중간 | **범용, 권장** |
| Deep Learning | 느림 | 매우 높음 | 높음 | 배치 처리, 복잡한 조명 |

#### 학습 기반 방법 (간략)

주요 딥러닝 모델:
- **Deep White-Balance Editing** (Afifi & Brown, CVPR 2020): sRGB 화이트밸런스 보정용 멀티태스크 DNN
- **FC4**: 신뢰도 가중 풀링 사용
- **CLCC**: 대조 학습 기반 색상 항상성

**모바일 배포 현황**: TensorFlow.js에 사전 학습 모델 부재, 모델 크기 5-100MB+로 모바일에서 실시간 추론 어려움. WebGPU 지원이 확대되면 실용화 가능성 높아짐.

---

### 2.4 모바일 카메라 최적 임계값

#### Sharpness 임계값 (Laplacian Variance)

| 상태 | Laplacian Variance | 조치 |
|------|-------------------|------|
| **거부** | < 80 | 재촬영 요청 |
| **경고** | 80-120 | 경고 메시지 표시 |
| **수용** | > 120 | 분석 진행 |
| **매우 선명** | > 500 | 최적 품질 |

**모바일 특성 고려사항**:
- 해상도가 높을수록 분산값 증가 → 이미지 크기로 정규화 고려
- 모션 블러와 오토포커스 지연이 주요 문제
- **권장**: 480p-720p로 다운샘플 후 처리하여 일관성 확보

#### 색온도 허용 범위

| 품질 | CCT 범위 | Δuv | 조치 |
|------|----------|-----|------|
| **최적** | 5000-6500K | < 0.02 | 분석 진행 |
| **좋음** | 4500-7000K | < 0.03 | 분석 진행 |
| **수용 가능** | 4000-8000K | < 0.05 | 보정 후 진행 |
| **부적합** | < 3000K 또는 > 8000K | - | 재촬영 요청 |

**조명 환경별 기준**:
- 자연 주광 (5000-6500K): 이상적
- 형광등 (4000-5000K): 보정 필요할 수 있음
- 텅스텐/백열등 (2700-3200K): 강한 보정 필요, 품질 저하 가능

#### 밝기(Exposure) 임계값

| 메트릭 | 저노출 | 적정 노출 | 과노출 |
|--------|--------|-----------|--------|
| **평균 밝기** | < 60 | 80-190 | > 210 |
| **클리핑 픽셀** | > 10% (0-10) | < 5% (양극단) | > 10% (245-255) |

**히스토그램 분석 방법**:
```
darkPixels = (값 < 30인 픽셀 수) / 전체 픽셀
brightPixels = (값 > 225인 픽셀 수) / 전체 픽셀
meanBrightness = 전체 픽셀값 평균

isUnderexposed = darkPixels > 0.10 || meanBrightness < 60
isOverexposed = brightPixels > 0.10 || meanBrightness > 210
```

#### 얼굴 크기 및 해상도 요구사항

| 기준 | 최소 | 권장 | 최적 |
|------|------|------|------|
| **얼굴 픽셀 크기** | 100×100 px | 150×150 px | 250×250 px |
| **얼굴/이미지 비율** | 10% | 20-30% | 30-50% |
| **눈 사이 거리** | 64 px | 100 px | 160+ px |

**근거**: 색상 분석을 위해서는 충분한 샘플 픽셀이 필요하며, 얼굴 인식(21×21 px 가능)보다 높은 해상도 필요

---

## 3. 구현 시 필수 사항

### 품질 평가 파이프라인
- [ ] 프레임 캡처 → 얼굴 감지 → 얼굴 크기 확인
- [ ] Laplacian Variance 계산 (임계값: 120)
- [ ] 히스토그램 분석 (평균 밝기: 80-190)
- [ ] 색온도 추정 (McCamy 공식, 범위: 4500-7000K)
- [ ] 종합 품질 점수 반환

### 웹 (Next.js) 구현
- [ ] Canvas API로 이미지 캡처
- [ ] Web Workers + OffscreenCanvas로 백그라운드 처리
- [ ] WebGL로 GPU 가속 필터링 (필요시)
- [ ] TensorFlow.js (WebGL 백엔드)로 얼굴 감지

### 모바일 (React Native/Expo) 구현
- [ ] react-native-vision-camera + Frame Processors
- [ ] 네이티브 플러그인으로 Laplacian 계산 (C++/OpenCV)
- [ ] ML Kit으로 얼굴 감지
- [ ] YUV 픽셀 포맷 사용 (RGB보다 효율적)

### 성능 최적화
- [ ] 처리 전 480×360으로 다운샘플
- [ ] 얼굴 영역(ROI)만 분석
- [ ] 블러/노출/색온도 검사 병렬 실행
- [ ] 명백한 품질 문제는 조기 종료 (Fail Fast)
- [ ] 목표 처리 시간: **50-100ms**

---

## 4. 수학적 공식 및 코드 예시

### 4.1 Laplacian Variance (TypeScript)

```typescript
interface BlurDetectionResult {
  variance: number;
  isBlurry: boolean;
  score: number; // 1-10 척도
}

class LaplacianBlurDetector {
  private threshold: number;
  
  private readonly LAPLACIAN_KERNEL = [
    0,  1,  0,
    1, -4,  1,
    0,  1,  0
  ];

  constructor(threshold: number = 120) {
    this.threshold = threshold;
  }

  detectBlur(imageData: ImageData): BlurDetectionResult {
    const { width, height, data } = imageData;
    
    // 그레이스케일 변환
    const gray = this.toGrayscale(data, width, height);
    
    // Laplacian 컨볼루션 적용
    const laplacian = this.applyLaplacian(gray, width, height);
    
    // 분산 계산
    const variance = this.calculateVariance(laplacian);
    
    // 1-10 점수로 매핑
    const T_MIN = 9, T_MAX = 50;
    let score = 1 + 9 * Math.min(1, Math.max(0, (variance - T_MIN) / (T_MAX - T_MIN)));
    score = Math.round(score * 10) / 10;
    
    return {
      variance,
      isBlurry: variance < this.threshold,
      score
    };
  }

  private toGrayscale(data: Uint8ClampedArray, width: number, height: number): Float64Array {
    const gray = new Float64Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }
    return gray;
  }

  private applyLaplacian(gray: Float64Array, width: number, height: number): Float64Array {
    const result = new Float64Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        let kernelIdx = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIdx = (y + ky) * width + (x + kx);
            sum += gray[pixelIdx] * this.LAPLACIAN_KERNEL[kernelIdx];
            kernelIdx++;
          }
        }
        result[y * width + x] = sum;
      }
    }
    return result;
  }

  private calculateVariance(data: Float64Array): number {
    const n = data.length;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += data[i];
    const mean = sum / n;
    
    let varianceSum = 0;
    for (let i = 0; i < n; i++) {
      const diff = data[i] - mean;
      varianceSum += diff * diff;
    }
    return varianceSum / n;
  }
}
```

### 4.2 색온도 추정 (TypeScript)

```typescript
interface CCTResult {
  cct: number;
  duv: number;
  isValid: boolean;
  quality: 'excellent' | 'good' | 'acceptable' | 'poor';
}

// sRGB 감마 확장
function srgbToLinear(value: number): number {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

// sRGB → XYZ 변환 행렬 (D65)
const RGB_TO_XYZ = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041]
];

function rgbToXyz(r: number, g: number, b: number): { X: number; Y: number; Z: number } {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);
  
  return {
    X: RGB_TO_XYZ[0][0] * rLin + RGB_TO_XYZ[0][1] * gLin + RGB_TO_XYZ[0][2] * bLin,
    Y: RGB_TO_XYZ[1][0] * rLin + RGB_TO_XYZ[1][1] * gLin + RGB_TO_XYZ[1][2] * bLin,
    Z: RGB_TO_XYZ[2][0] * rLin + RGB_TO_XYZ[2][1] * gLin + RGB_TO_XYZ[2][2] * bLin
  };
}

// McCamy 공식으로 CCT 계산
function calculateCCT(r: number, g: number, b: number): CCTResult {
  const xyz = rgbToXyz(r, g, b);
  const sum = xyz.X + xyz.Y + xyz.Z;
  
  if (sum === 0) return { cct: 6500, duv: 0, isValid: false, quality: 'poor' };
  
  const x = xyz.X / sum;
  const y = xyz.Y / sum;
  
  // McCamy 공식
  const n = (x - 0.3320) / (0.1858 - y);
  const cct = 449 * n ** 3 + 3525 * n ** 2 + 6823.3 * n + 5520.33;
  
  // Δuv 계산 (간략화)
  const u = (4 * x) / (-2 * x + 12 * y + 3);
  const v = (6 * y) / (-2 * x + 12 * y + 3);
  const duv = Math.sqrt((u - 0.292) ** 2 + (v - 0.24) ** 2); // 근사
  
  // 품질 평가
  let quality: CCTResult['quality'];
  if (cct >= 5000 && cct <= 6500 && duv < 0.02) quality = 'excellent';
  else if (cct >= 4500 && cct <= 7000 && duv < 0.03) quality = 'good';
  else if (cct >= 4000 && cct <= 8000 && duv < 0.05) quality = 'acceptable';
  else quality = 'poor';
  
  return {
    cct: Math.round(cct),
    duv: Number(duv.toFixed(4)),
    isValid: duv < 0.05 && cct >= 2000 && cct <= 15000,
    quality
  };
}

// 이미지에서 CCT 추정
function estimateCCTFromImage(imageData: ImageData): CCTResult {
  const { data, width, height } = imageData;
  let totalR = 0, totalG = 0, totalB = 0, count = 0;
  
  // 중앙 20% 영역 샘플링
  const startX = Math.floor(width * 0.4), endX = Math.floor(width * 0.6);
  const startY = Math.floor(height * 0.4), endY = Math.floor(height * 0.6);
  
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (y * width + x) * 4;
      totalR += data[idx];
      totalG += data[idx + 1];
      totalB += data[idx + 2];
      count++;
    }
  }
  
  return calculateCCT(totalR / count, totalG / count, totalB / count);
}
```

### 4.3 Shades of Gray 화이트밸런스 (TypeScript)

```typescript
function shadesOfGrayWhiteBalance(imageData: ImageData, p: number = 6): ImageData {
  const { data, width, height } = imageData;
  const numPixels = width * height;
  
  // Minkowski norm 계산
  let sumRp = 0, sumGp = 0, sumBp = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    
    sumRp += Math.pow(r, p);
    sumGp += Math.pow(g, p);
    sumBp += Math.pow(b, p);
  }
  
  // Minkowski mean: (sum/N)^(1/p)
  const muR = Math.pow(sumRp / numPixels, 1 / p);
  const muG = Math.pow(sumGp / numPixels, 1 / p);
  const muB = Math.pow(sumBp / numPixels, 1 / p);
  
  // 목표 조명 (정규화된 회색)
  const target = (muR + muG + muB) / 3;
  
  // 게인 계산
  const gainR = muR > 0 ? target / muR : 1;
  const gainG = muG > 0 ? target / muG : 1;
  const gainB = muB > 0 ? target / muB : 1;
  
  // 보정 적용
  const outputData = new Uint8ClampedArray(data.length);
  
  for (let i = 0; i < data.length; i += 4) {
    outputData[i] = Math.min(255, Math.max(0, data[i] * gainR));
    outputData[i + 1] = Math.min(255, Math.max(0, data[i + 1] * gainG));
    outputData[i + 2] = Math.min(255, Math.max(0, data[i + 2] * gainB));
    outputData[i + 3] = data[i + 3]; // 알파 유지
  }
  
  return new ImageData(outputData, width, height);
}

// 화이트밸런스 통합 클래스
class WhiteBalanceCorrector {
  static grayWorld(imageData: ImageData): ImageData {
    return shadesOfGrayWhiteBalance(imageData, 1);
  }
  
  static whitePatch(imageData: ImageData): ImageData {
    return shadesOfGrayWhiteBalance(imageData, 100); // p → ∞ 근사
  }
  
  static shadesOfGray(imageData: ImageData, p: number = 6): ImageData {
    return shadesOfGrayWhiteBalance(imageData, p);
  }
  
  static auto(imageData: ImageData): ImageData {
    return shadesOfGrayWhiteBalance(imageData, 6); // 최적 p=6
  }
}
```

### 4.4 통합 품질 평가 클래스 (TypeScript)

```typescript
interface QualityAssessmentResult {
  isAcceptable: boolean;
  sharpness: { variance: number; score: number; status: 'pass' | 'warn' | 'fail' };
  exposure: { mean: number; status: 'pass' | 'warn' | 'fail'; issue?: string };
  colorTemp: { cct: number; quality: string; status: 'pass' | 'warn' | 'fail' };
  faceSize: { pixels: number; ratio: number; status: 'pass' | 'warn' | 'fail' };
  overallScore: number;
  recommendations: string[];
}

class ImageQualityAssessor {
  private blurDetector: LaplacianBlurDetector;
  
  // 임계값 설정
  private readonly THRESHOLDS = {
    sharpness: { reject: 80, warn: 120, excellent: 500 },
    brightness: { min: 60, warnMin: 80, warnMax: 190, max: 220 },
    clipping: { warn: 5, reject: 10 }, // 퍼센트
    cct: { min: 3000, warnMin: 4000, warnMax: 7000, max: 8000 },
    faceSize: { min: 100, warn: 150, optimal: 250 }
  };
  
  constructor() {
    this.blurDetector = new LaplacianBlurDetector(this.THRESHOLDS.sharpness.warn);
  }
  
  assess(imageData: ImageData, faceRect?: { width: number; height: number }): QualityAssessmentResult {
    const recommendations: string[] = [];
    
    // 1. 선명도 평가
    const blurResult = this.blurDetector.detectBlur(imageData);
    const sharpnessStatus = blurResult.variance < this.THRESHOLDS.sharpness.reject ? 'fail'
      : blurResult.variance < this.THRESHOLDS.sharpness.warn ? 'warn' : 'pass';
    if (sharpnessStatus !== 'pass') {
      recommendations.push('이미지가 흐립니다. 카메라를 안정시키고 초점을 맞춰주세요.');
    }
    
    // 2. 노출 평가
    const exposureResult = this.analyzeExposure(imageData);
    
    // 3. 색온도 평가
    const cctResult = estimateCCTFromImage(imageData);
    const cctStatus = cctResult.cct < this.THRESHOLDS.cct.min || cctResult.cct > this.THRESHOLDS.cct.max ? 'fail'
      : cctResult.cct < this.THRESHOLDS.cct.warnMin || cctResult.cct > this.THRESHOLDS.cct.warnMax ? 'warn' : 'pass';
    if (cctStatus === 'fail') {
      recommendations.push(cctResult.cct < 4000 
        ? '조명이 너무 따뜻합니다. 자연광 아래로 이동하세요.'
        : '조명이 너무 차갑습니다. 직접 햇빛 아래로 이동하세요.');
    }
    
    // 4. 얼굴 크기 평가
    let faceSizeStatus: 'pass' | 'warn' | 'fail' = 'pass';
    let facePixels = 0, faceRatio = 0;
    if (faceRect) {
      facePixels = Math.min(faceRect.width, faceRect.height);
      faceRatio = (faceRect.width * faceRect.height) / (imageData.width * imageData.height);
      faceSizeStatus = facePixels < this.THRESHOLDS.faceSize.min ? 'fail'
        : facePixels < this.THRESHOLDS.faceSize.warn ? 'warn' : 'pass';
      if (faceSizeStatus !== 'pass') {
        recommendations.push('얼굴이 너무 작습니다. 카메라에 더 가까이 다가가세요.');
      }
    }
    
    // 종합 점수 계산 (가중 평균)
    const weights = { sharpness: 0.3, exposure: 0.25, cct: 0.25, faceSize: 0.2 };
    const scores = {
      sharpness: sharpnessStatus === 'pass' ? 10 : sharpnessStatus === 'warn' ? 6 : 2,
      exposure: exposureResult.status === 'pass' ? 10 : exposureResult.status === 'warn' ? 6 : 2,
      cct: cctStatus === 'pass' ? 10 : cctStatus === 'warn' ? 6 : 2,
      faceSize: faceSizeStatus === 'pass' ? 10 : faceSizeStatus === 'warn' ? 6 : 2
    };
    const overallScore = Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + scores[key as keyof typeof scores] * weight, 0
    );
    
    const isAcceptable = sharpnessStatus !== 'fail' && exposureResult.status !== 'fail' 
      && cctStatus !== 'fail' && faceSizeStatus !== 'fail';
    
    return {
      isAcceptable,
      sharpness: { variance: blurResult.variance, score: blurResult.score, status: sharpnessStatus },
      exposure: exposureResult,
      colorTemp: { cct: cctResult.cct, quality: cctResult.quality, status: cctStatus },
      faceSize: { pixels: facePixels, ratio: faceRatio, status: faceSizeStatus },
      overallScore: Math.round(overallScore * 10) / 10,
      recommendations
    };
  }
  
  private analyzeExposure(imageData: ImageData): { mean: number; status: 'pass' | 'warn' | 'fail'; issue?: string } {
    const { data } = imageData;
    let sum = 0, darkCount = 0, brightCount = 0;
    const total = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += luminance;
      if (luminance < 30) darkCount++;
      if (luminance > 225) brightCount++;
    }
    
    const mean = sum / total;
    const darkPercent = (darkCount / total) * 100;
    const brightPercent = (brightCount / total) * 100;
    
    if (mean < this.THRESHOLDS.brightness.min || darkPercent > this.THRESHOLDS.clipping.reject) {
      return { mean, status: 'fail', issue: '저노출' };
    }
    if (mean > this.THRESHOLDS.brightness.max || brightPercent > this.THRESHOLDS.clipping.reject) {
      return { mean, status: 'fail', issue: '과노출' };
    }
    if (mean < this.THRESHOLDS.brightness.warnMin || mean > this.THRESHOLDS.brightness.warnMax) {
      return { mean, status: 'warn', issue: mean < 80 ? '약간 어두움' : '약간 밝음' };
    }
    return { mean, status: 'pass' };
  }
}
```

### 4.5 Web Worker 통합 (브라우저용)

```typescript
// quality-worker.ts
self.onmessage = async (e: MessageEvent) => {
  const { imageData, faceRect } = e.data;
  
  const assessor = new ImageQualityAssessor();
  const result = assessor.assess(imageData, faceRect);
  
  self.postMessage(result);
};

// main.ts (메인 스레드)
class QualityAssessmentService {
  private worker: Worker;
  
  constructor() {
    this.worker = new Worker(new URL('./quality-worker.ts', import.meta.url));
  }
  
  async assess(canvas: HTMLCanvasElement, faceRect?: DOMRect): Promise<QualityAssessmentResult> {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve) => {
      this.worker.onmessage = (e) => resolve(e.data);
      this.worker.postMessage({ imageData, faceRect });
    });
  }
}
```

---

## 5. 참고 자료

### 학술 논문
- Pertuz et al. (2013). "Analysis of focus measure operators for shape-from-focus" - Pattern Recognition
- Pech-Pacheco et al. (2000). "Diatom autofocusing in brightfield microscopy" - ICPR
- McCamy, C.S. (1992). "Correlated color temperature as an explicit function of chromaticity coordinates" - Color Research & Application
- Finlayson & Trezzi (2004). "Shades of Gray and Colour Constancy" - IS&T/SID Color Imaging Conference
- Hernández-Andrés et al. (1999). "Calculating correlated color temperatures across the entire gamut"
- Afifi & Brown (2020). "Deep White-Balance Editing" - CVPR

### 기술 문서
- OpenCV Documentation - Image Filtering, Color Conversions
- Bruce Lindbloom (brucelindbloom.com) - RGB/XYZ Matrices, Color Science
- CIE Technical Reports - Color Temperature, Chromaticity
- sRGB Specification - IEC 61966-2-1

### 구현 참고
- PyImageSearch - Blur Detection Tutorials
- React Native Vision Camera - Frame Processors Documentation
- MDN Web Docs - Canvas API, Web Workers, OffscreenCanvas
- TensorFlow.js - Face Detection Models

---

## 결론

이룸 플랫폼의 퍼스널 컬러 분석을 위한 이미지 품질 평가 시스템은 **Laplacian Variance** (선명도), **McCamy 공식** (색온도), **Shades of Gray p=6** (화이트밸런스)의 조합이 최적입니다. 이 알고리즘들은 모두 O(n) 복잡도로 모바일 실시간 처리에 적합하며, 50-100ms 내 품질 판정이 가능합니다.

핵심 임계값은 Laplacian Variance **120**, 평균 밝기 **80-190**, CCT **4500-7000K**, 얼굴 크기 **150×150 px** 이상입니다. 웹에서는 Web Workers + OffscreenCanvas, React Native에서는 Vision Camera Frame Processors를 활용하여 메인 스레드 블로킹 없이 실시간 피드백을 제공할 수 있습니다.

딥러닝 기반 화이트밸런스는 현재 모바일 배포에 실용적이지 않으나, WebGPU 보급과 함께 향후 고려할 수 있습니다.