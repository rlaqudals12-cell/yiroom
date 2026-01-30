# 이미지 처리 원리

> 이 문서는 이룸 플랫폼의 AI 분석을 위한 이미지 처리 파이프라인의 기반 원리를 설명한다.
>
> **소스 리서치**: CIE-1-R1, CIE-2-R1, CIE-4-R1

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 이미지 품질 검증 및 보정 시스템"

- 모든 조명 환경에서 99% 자동 보정으로 D65 표준광 수준 달성
- 100ms 이내 실시간 품질 검증 및 사용자 피드백
- 얼굴 랜드마크 468점 기반 0.1mm 정밀도 영역 추출
- 플랫폼 무관하게 동일한 분석 결과 (웹/모바일/네이티브)
```

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 카메라 센서 | 스마트폰 센서 품질에 의존 (노이즈, 다이내믹 레인지) |
| 극단적 조명 | CCT < 3000K 또는 > 8000K에서 색재현 불가 |
| 연산 성능 | 모바일 기기에서 GPU 가속 제한 (iOS Safari 특히 문제) |
| 물리적 흐림 | 모션 블러, 아웃포커스는 소프트웨어로 복구 불가 |
| 혼합 조명 | 서로 다른 색온도 광원 혼합 시 보정 불가 |

### 100점 기준

- Laplacian Variance 선명도 120+ (최적: 500+)
- 색온도 추정 정확도 ±200K 이내
- 화이트밸런스 보정 후 ΔE*00 < 3
- 얼굴 정면성 점수 70점 이상
- 품질 검증 처리 시간 50-100ms
- 플랫폼 간 결과 일관성 95% 이상
- 재촬영 요청률 < 15%

### 현재 목표: 85%

- Laplacian Variance 기반 선명도 검증 완성
- McCamy 공식 + Shades of Gray 색온도 추정
- Bradford Transform 화이트밸런스 보정
- MediaPipe 468점 랜드마크 통합
- 웹 플랫폼 Web Workers 최적화
- 한국인 피부톤 ITA 보정 적용

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| AI 기반 이미지 복원 | 연산 비용 높음, 실시간 불가 | Edge AI 성능 향상 시 |
| 혼합 조명 자동 분리 | 기술적 복잡성 높음 | 리서치 완료 후 |
| 전신 포즈 추정 | C-1 체형 분석 전용 | C-1 고도화 시 |
| 네이티브 카메라 SDK | 크로스 플랫폼 우선 | 성능 병목 발생 시 |
| HDR 이미지 처리 | sRGB 색역 우선 | Wide Gamut 지원 시 |

---

## 1. 이미지 품질 평가

### 1.1 Laplacian Variance (선명도 측정)

**원리**: Laplacian 연산자는 이미지의 2차 도함수를 측정하여 강도 변화율을 계산한다. 선명한 이미지는 에지가 많아 분산이 높고, 흐린 이미지는 분산이 낮다.

**수학적 정의**:

```
∇²f = ∂²f/∂x² + ∂²f/∂y²

3×3 커널:
[ 0   1   0 ]
[ 1  -4   1 ]
[ 0   1   0 ]

분산: σ² = (1/N) × Σ(Lᵢ - μ)²
```

**성능 특성**:
- 계산 복잡도: O(n), 단일 패스 컨볼루션
- 모바일 실시간 처리에 최적
- 노이즈에 민감 (전처리 필요)

**알고리즘 비교**:

| 방법 | 속도 | 정확도 | 모바일 적합성 |
|------|------|--------|--------------|
| **Laplacian Variance** | ★★★★★ | ★★★☆☆ | **최고** |
| Sobel + Variance | ★★★★☆ | ★★★★☆ | 매우 좋음 |
| Tenengrad | ★★★★☆ | ★★★★☆ | 매우 좋음 |
| FFT 기반 | ★★☆☆☆ | ★★★★★ | 보통 |

### 1.2 임계값 기준

**선명도 (Laplacian Variance)**:

| 상태 | 값 | 조치 |
|------|-----|------|
| 거부 | < 80 | 재촬영 요청 |
| 경고 | 80-120 | 경고 메시지 |
| **수용** | **> 120** | **분석 진행** |
| 최적 | > 500 | 최적 품질 |

**노출 (밝기)**:

| 상태 | 평균 밝기 | 클리핑 픽셀 |
|------|----------|------------|
| 저노출 | < 60 | > 10% (0-10) |
| **적정** | **80-190** | **< 5%** |
| 과노출 | > 210 | > 10% (245-255) |

**얼굴 크기**:

| 기준 | 최소 | 권장 | 최적 |
|------|------|------|------|
| 얼굴 픽셀 | 100×100 | 150×150 | 250×250 |
| 얼굴/이미지 비율 | 10% | 20-30% | 30-50% |

---

## 2. 색온도 및 화이트밸런스

### 2.1 McCamy 공식 (CCT 추정)

**원리**: CIE 1931 (x,y) 색도 좌표에서 상관 색온도(CCT)를 직접 계산한다.

**공식**:

```
n = (x - 0.3320) / (0.1858 - y)
CCT = 449n³ + 3525n² + 6823.3n + 5520.33
```

**sRGB → XYZ 변환**:

```
1. 감마 확장 (선형화):
   C_linear = C ≤ 0.04045 ? C/12.92 : ((C + 0.055)/1.055)^2.4

2. 행렬 곱 (D65):
   [X]   [0.4124564  0.3575761  0.1804375]   [R]
   [Y] = [0.2126729  0.7151522  0.0721750] × [G]
   [Z]   [0.0193339  0.1191920  0.9503041]   [B]

3. 색도 좌표:
   x = X / (X + Y + Z)
   y = Y / (X + Y + Z)
```

**색온도 품질 기준**:

| 품질 | CCT 범위 | Δuv | 조치 |
|------|----------|-----|------|
| **최적** | **5000-6500K** | < 0.02 | 분석 진행 |
| 좋음 | 4500-7000K | < 0.03 | 분석 진행 |
| 수용 가능 | 4000-8000K | < 0.05 | 보정 후 진행 |
| 부적합 | < 3000K 또는 > 8000K | - | 재촬영 요청 |

### 2.2 Shades of Gray 화이트밸런스

**원리**: Minkowski norm 기반 일반화 방법으로, Gray World와 White Patch의 장점을 결합한다.

**공식**:

```
μp(X) = ((1/N) × Σ|Xᵢ|^p)^(1/p)

p = 1: Gray World (L1 norm = 평균)
p → ∞: Max-RGB (L∞ norm = 최대값)
p = 6: 최적값 (실험적 검증)
```

**알고리즘 비교**:

| 알고리즘 | 속도 | 정확도 | 권장 상황 |
|----------|------|--------|----------|
| Gray World | 매우 빠름 | 낮음-중간 | 균형 잡힌 장면 |
| White Patch | 빠름 | 중간 | 흰색 참조 있는 장면 |
| **Shades of Gray (p=6)** | **빠름** | **높음** | **범용, 권장** |

### 2.3 Von Kries Chromatic Adaptation

**원리**: Von Kries 변환은 인간 시각 시스템의 색순응(Chromatic Adaptation)을 모델링한다. 각 원추세포 채널(L, M, S)이 독립적으로 적응한다는 가설에 기반한다.

**수학적 정의**:

```
1. 소스 조명(src)에서 타겟 조명(dst)으로 변환:

   [L']   [D₁  0   0 ]   [L]
   [M'] = [0   D₂  0 ] × [M]
   [S']   [0   0   D₃]   [S]

   여기서:
   D₁ = L_dst / L_src
   D₂ = M_dst / M_src
   D₃ = S_dst / S_src

2. 실제 구현 (XYZ 공간):

   [X']   [M_dst] × [M_src]⁻¹ × [X]
   [Y'] =                       [Y]
   [Z']                         [Z]
```

**특징**:
- 가장 단순한 색순응 모델
- 채널별 독립 스케일링
- 극단적 조명에서 부정확
- 계산 비용: 매우 낮음

### 2.4 Bradford Transform

**원리**: Von Kries를 개선하여 인간 시각과 더 일치하는 색순응 모델. CAT02/CAT16(CIECAM02/CAM16)의 기반이 된다.

**Bradford 행렬**:

```
XYZ → LMS 변환:
[L]   [ 0.8951   0.2664  -0.1614]   [X]
[M] = [-0.7502   1.7135   0.0367] × [Y]
[S]   [ 0.0389  -0.0685   1.0296]   [Z]

LMS → XYZ 역변환:
[X]   [ 0.9870  -0.1471   0.1600]   [L]
[Y] = [ 0.4323   0.5184   0.0493] × [M]
[Z]   [-0.0085   0.0400   0.9685]   [S]
```

**전체 변환 과정**:

```
1. XYZ_src → LMS_src (Bradford 행렬)
2. LMS_src에서 광원 백색점 계산
3. 스케일링: LMS_adapted = LMS × (LMS_D65 / LMS_src_white)
4. LMS_adapted → XYZ_dst (역행렬)
5. XYZ_dst → sRGB (감마 보정 포함)
```

**비교표**:

| 변환 | 정확도 | 속도 | 권장 용도 |
|------|--------|------|----------|
| Von Kries (XYZ) | ★★☆☆☆ | ★★★★★ | 빠른 프리뷰 |
| Von Kries (Sharp) | ★★★☆☆ | ★★★★☆ | 일반용 |
| **Bradford** | **★★★★☆** | **★★★☆☆** | **피부톤 분석 권장** |
| CAT16 (CIECAM16) | ★★★★★ | ★★☆☆☆ | 고정밀 색재현 |

### 2.5 AWB 구현 파이프라인

**CIE-3 (화이트밸런스 보정) 전체 파이프라인**:

```typescript
// lib/image/awb-correction.ts

interface AWBResult {
  correctedImage: ImageData;
  estimatedCCT: number;       // 추정 색온도 (K)
  scalingFactors: [number, number, number]; // R, G, B 보정 계수
  confidenceScore: number;    // 0-100
}

/**
 * AWB 보정 파이프라인
 *
 * 1. 광원 추정 (Shades of Gray)
 * 2. 색온도 계산 (McCamy)
 * 3. 색순응 변환 (Bradford)
 * 4. 감마 보정 (sRGB)
 */
async function correctWhiteBalance(
  imageData: ImageData,
  options: {
    method: 'bradford' | 'vonKries';
    targetCCT?: number;  // 기본값: 6500K (D65)
  } = { method: 'bradford' }
): Promise<AWBResult> {

  // 1. Shades of Gray로 광원 추정
  const illuminant = estimateIlluminant(imageData, 6); // p=6

  // 2. 색온도 추정
  const estimatedCCT = calculateCCT(illuminant);

  // 3. 보정 필요 여부 판단
  const targetCCT = options.targetCCT ?? 6500;
  if (Math.abs(estimatedCCT - targetCCT) < 200) {
    // 색온도 차이가 200K 미만이면 보정 생략
    return {
      correctedImage: imageData,
      estimatedCCT,
      scalingFactors: [1, 1, 1],
      confidenceScore: 95
    };
  }

  // 4. Bradford 변환으로 색순응
  const corrected = options.method === 'bradford'
    ? applyBradfordTransform(imageData, estimatedCCT, targetCCT)
    : applyVonKriesTransform(imageData, estimatedCCT, targetCCT);

  return corrected;
}

/**
 * Shades of Gray 광원 추정
 * Minkowski norm (p=6) 기반
 */
function estimateIlluminant(
  imageData: ImageData,
  p: number = 6
): [number, number, number] {
  const { data, width, height } = imageData;
  let sumR = 0, sumG = 0, sumB = 0;
  const n = width * height;

  for (let i = 0; i < data.length; i += 4) {
    // 감마 보정 해제 (선형화)
    const r = srgbToLinear(data[i] / 255);
    const g = srgbToLinear(data[i + 1] / 255);
    const b = srgbToLinear(data[i + 2] / 255);

    sumR += Math.pow(r, p);
    sumG += Math.pow(g, p);
    sumB += Math.pow(b, p);
  }

  const normR = Math.pow(sumR / n, 1 / p);
  const normG = Math.pow(sumG / n, 1 / p);
  const normB = Math.pow(sumB / n, 1 / p);

  // 정규화
  const max = Math.max(normR, normG, normB);
  return [normR / max, normG / max, normB / max];
}

/**
 * sRGB → 선형 RGB 변환
 */
function srgbToLinear(c: number): number {
  return c <= 0.04045
    ? c / 12.92
    : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * 선형 RGB → sRGB 변환
 */
function linearToSrgb(c: number): number {
  return c <= 0.0031308
    ? c * 12.92
    : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}
```

**조명 조건별 권장 전략**:

| 조명 조건 | 추정 CCT | 보정 전략 | 신뢰도 |
|-----------|----------|----------|--------|
| 맑은 자연광 | 5500-6500K | 보정 생략 | 95% |
| 흐린 날씨 | 6500-8000K | Bradford (D65) | 85% |
| 백열등/따뜻한 조명 | 2700-3500K | Bradford (D65) + 경고 | 70% |
| 형광등 | 4000-5000K | Bradford (D65) | 80% |
| 혼합 조명 | 측정 불가 | 재촬영 권장 | 50% |

### 2.6 AWB 품질 검증

**보정 전후 비교 메트릭**:

```typescript
interface AWBValidation {
  deltaE: number;          // 색차 (CIE ΔE2000)
  preservedSkinTone: boolean;  // 피부톤 보존 여부
  naturalness: number;     // 자연스러움 점수 (0-100)
}

/**
 * 피부톤 보존 검증
 * 보정 후에도 피부 영역의 Lab 값이 허용 범위 내인지 확인
 */
function validateSkinTonePreserved(
  originalSkinLab: LabColor,
  correctedSkinLab: LabColor
): boolean {
  // 한국인 피부톤 허용 범위 (연세대 연구 기반)
  const SKIN_TONE_BOUNDS = {
    L: { min: 55, max: 75 },
    a: { min: 5, max: 15 },
    b: { min: 12, max: 25 }
  };

  const { L, a, b } = correctedSkinLab;

  return (
    L >= SKIN_TONE_BOUNDS.L.min && L <= SKIN_TONE_BOUNDS.L.max &&
    a >= SKIN_TONE_BOUNDS.a.min && a <= SKIN_TONE_BOUNDS.a.max &&
    b >= SKIN_TONE_BOUNDS.b.min && b <= SKIN_TONE_BOUNDS.b.max
  );
}
```

---

## 3. 얼굴 랜드마크 감지

### 3.1 라이브러리 선택

**권장**: `@mediapipe/tasks-vision` (Face Landmarker)

**비교표**:

| 항목 | face-api.js | MediaPipe Face Landmarker |
|------|-------------|---------------------------|
| **랜드마크 수** | 68개 (2D) | **468개 (3D)** |
| **추론 속도** | 1-3 FPS | **30-100+ FPS** |
| **번들 크기** | ~1.26 MB | ~4-6 MB |
| **유지보수** | ❌ 2020년 중단 | ✅ Google 활발 |
| **iOS Safari** | ❌ 심각한 제한 | ⚠️ 제한적 |
| **라이선스** | MIT | Apache 2.0 (특허 보호) |

**선택 이유**:
1. 468개 3D 랜드마크로 볼, 이마, 홍채 영역 직접 접근
2. 30+ FPS 실시간 처리 가능
3. Google의 지속적인 업데이트
4. Apache 2.0 특허 보호로 상업적 사용 안전

### 3.2 퍼스널 컬러 분석용 랜드마크 인덱스

```typescript
const LANDMARK_INDICES = {
  LEFT_CHEEK: [50, 101, 118, 119, 120, 100],
  RIGHT_CHEEK: [280, 330, 347, 348, 349, 329],
  FOREHEAD: [10, 67, 69, 104, 108, 151, 297, 299, 333, 337],
  UPPER_LIP: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  LOWER_LIP: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
  LEFT_IRIS: [468, 469, 470, 471, 472],   // refineLandmarks=true
  RIGHT_IRIS: [473, 474, 475, 476, 477],  // refineLandmarks=true
};
```

### 3.3 영역별 분석 가능 여부

| 분석 요소 | 68점 | 468점 |
|----------|------|-------|
| 눈 색상 | ⚠️ 추정 필요 | ✅ 홍채 직접 접근 |
| 볼 색상 | ⚠️ 보간 필요 | ✅ 메시 직접 접근 |
| 입술 색상 | ✅ 충분 | ✅ 더 정밀 |
| 이마 색상 | ❌ 포인트 없음 | ✅ 메시 직접 접근 |
| 조명 보정 | ❌ 불가 | ⚠️ 3D로 일부 가능 |

---

## 4. 얼굴 각도 및 정면성 검증

### 4.1 3D 포즈 추정 원리

**원리**: 얼굴 랜드마크의 3D 좌표를 이용하여 회전 행렬(Rotation Matrix)을 추출하고, 이를 오일러 각(Euler Angles)으로 변환한다.

**좌표계 정의**:

```
┌─────────────────────────────────────────────────────────────┐
│                    얼굴 좌표계 (Face Coordinate)             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                        +Y (위)                               │
│                          ↑                                   │
│                          │                                   │
│             +X (왼쪽) ←──┼──→ -X (오른쪽)                    │
│                          │                                   │
│                          ↓                                   │
│                        -Y (아래)                             │
│                                                              │
│              +Z (카메라 방향, 얼굴 앞쪽)                      │
│              -Z (얼굴 뒤쪽)                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**오일러 각 정의**:

| 각도 | 축 | 양수 방향 | 설명 |
|------|-----|----------|------|
| **Pitch** | X축 회전 | 고개 들기 (위) | 상하 움직임 |
| **Yaw** | Y축 회전 | 오른쪽 보기 | 좌우 움직임 |
| **Roll** | Z축 회전 | 오른쪽 기울임 | 머리 기울임 |

### 4.2 얼굴 각도 계산 알고리즘

**기준점 선택** (MediaPipe 468점 기준):

```typescript
const POSE_LANDMARKS = {
  NOSE_TIP: 1,          // 코 끝
  CHIN: 152,            // 턱 끝
  LEFT_EYE: 33,         // 왼쪽 눈 안쪽
  RIGHT_EYE: 263,       // 오른쪽 눈 안쪽
  LEFT_MOUTH: 61,       // 왼쪽 입꼬리
  RIGHT_MOUTH: 291,     // 오른쪽 입꼬리
  FOREHEAD: 10,         // 이마 중앙
};
```

**회전 행렬에서 오일러 각 추출**:

```typescript
/**
 * 3D 랜드마크에서 얼굴 회전 각도 계산
 *
 * 수학적 기초: solvePnP (Perspective-n-Point) 알고리즘
 *
 * 입력: 2D 이미지 좌표 + 표준 3D 모델 좌표
 * 출력: 회전 벡터 (Rodrigues) → 회전 행렬 → 오일러 각
 */
interface FaceAngle {
  pitch: number;  // X축 회전 (degrees)
  yaw: number;    // Y축 회전 (degrees)
  roll: number;   // Z축 회전 (degrees)
}

function calculateFaceAngle(landmarks: FaceLandmarks): FaceAngle {
  // 1. 핵심 랜드마크 추출
  const noseTip = landmarks.points[POSE_LANDMARKS.NOSE_TIP];
  const chin = landmarks.points[POSE_LANDMARKS.CHIN];
  const leftEye = landmarks.points[POSE_LANDMARKS.LEFT_EYE];
  const rightEye = landmarks.points[POSE_LANDMARKS.RIGHT_EYE];

  // 2. 얼굴 중심 및 방향 벡터 계산
  const faceCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
    z: (leftEye.z + rightEye.z) / 2,
  };

  // 3. 정면 방향 벡터 (코 → 얼굴 중심)
  const forwardVector = normalize({
    x: noseTip.x - faceCenter.x,
    y: noseTip.y - faceCenter.y,
    z: noseTip.z - faceCenter.z,
  });

  // 4. 수평 방향 벡터 (왼쪽 눈 → 오른쪽 눈)
  const rightVector = normalize({
    x: rightEye.x - leftEye.x,
    y: rightEye.y - leftEye.y,
    z: rightEye.z - leftEye.z,
  });

  // 5. 수직 방향 벡터 (외적)
  const upVector = crossProduct(rightVector, forwardVector);

  // 6. 회전 행렬에서 오일러 각 추출
  // R = [rightVector, upVector, forwardVector]^T
  const pitch = Math.atan2(-forwardVector.y, forwardVector.z) * (180 / Math.PI);
  const yaw = Math.atan2(forwardVector.x, forwardVector.z) * (180 / Math.PI);
  const roll = Math.atan2(rightVector.y, rightVector.x) * (180 / Math.PI);

  return { pitch, yaw, roll };
}
```

### 4.3 정면성 임계값 (Face Frontality Thresholds)

> 상세 임계값 및 사용자 피드백은 [ADR-033](../adr/ADR-033-face-detection-library.md) 참조

| 축 | 허용 범위 | 거부 조건 | 근거 |
|----|----------|----------|------|
| **Pitch** (상하) | ±10° | \|pitch\| > 10° | 눈, 코, 입 비율 왜곡 |
| **Yaw** (좌우) | ±15° | \|yaw\| > 15° | 한쪽 볼/귀 가려짐 |
| **Roll** (기울임) | ±20° | \|roll\| > 20° | 대칭 분석 어려움 |

**정면성 점수 공식**:

```
FrontalityScore = 0.3 × PitchScore + 0.5 × YawScore + 0.2 × RollScore

where:
  PitchScore = max(0, 100 - |pitch| × 10)
  YawScore = max(0, 100 - |yaw| × 6.67)
  RollScore = max(0, 100 - |roll| × 5)

판정:
  ≥ 70: 분석 가능
  50-70: 경고 표시
  < 50: 분석 거부
```

### 4.4 한국인 피부톤 ITA 보정

> **ITA (Individual Typology Angle)**: 피부 밝기(L*)와 황색도(b*)를 이용한 피부톤 분류 지표

**표준 ITA 공식**:

```
ITA° = arctan[(L* - 50) / b*] × (180/π)
```

**한국인 피부 특성 (연구 기반)**:

| 출처 | 샘플 | L* 평균 | b* 평균 | 비고 |
|------|------|---------|---------|------|
| 연세대 (2018) | n=148 | 64.15 | 18.34 | 20-40대 여성 |
| 아모레 (2019) | n=500+ | 62.8 | 17.9 | 국내 화장품 DB |
| Fitzpatrick (참고) | - | 60-75 | 10-20 | Type III-IV |

**한국인 ITA 보정 (황색 언더톤 조정)**:

```typescript
/**
 * 한국인 피부톤에 맞춘 ITA 보정
 *
 * 문제: 표준 ITA 공식은 서양인 기준으로 설계됨
 * 한국인은 b* 값이 높아(황색 언더톤) 웜톤으로 과대평가됨
 *
 * 보정 방법: b* 값에 가중치 적용
 */
interface ITAResult {
  rawITA: number;         // 원본 ITA
  adjustedITA: number;    // 보정된 ITA
  skinCategory: string;   // 피부 분류
  melaninLevel: 'low' | 'medium' | 'high';
}

function calculateKoreanAdjustedITA(labColor: LabColor): ITAResult {
  const { L, a, b } = labColor;

  // 1. 원본 ITA 계산
  const rawITA = Math.atan2(L - 50, b) * (180 / Math.PI);

  // 2. 한국인 b* 보정 계수 (연구 기반)
  const KOREAN_B_ADJUSTMENT = 0.85;  // b* 영향 15% 감소
  const adjustedB = b * KOREAN_B_ADJUSTMENT;

  // 3. 보정된 ITA 계산
  const adjustedITA = Math.atan2(L - 50, adjustedB) * (180 / Math.PI);

  // 4. 피부 분류 (한국인 기준 조정)
  const skinCategory = getKoreanSkinCategory(adjustedITA);

  // 5. 멜라닌 수준 추정
  const melaninLevel = adjustedITA > 40 ? 'low' :
                       adjustedITA > 20 ? 'medium' : 'high';

  return { rawITA, adjustedITA, skinCategory, melaninLevel };
}

function getKoreanSkinCategory(ita: number): string {
  // 한국인 기준 (서양 기준 대비 +5° 조정)
  if (ita > 60) return 'Very Light';      // 매우 밝음
  if (ita > 46) return 'Light';           // 밝음 (대부분 한국인)
  if (ita > 33) return 'Intermediate';    // 중간
  if (ita > 15) return 'Tan';             // 어두움
  return 'Brown';                         // 매우 어두움
}
```

**ITA와 퍼스널컬러 상관관계**:

| ITA 범위 | 피부 분류 | 웜/쿨 경향 | 주의사항 |
|---------|----------|----------|---------|
| > 50° | Very Light | 중립-쿨 | 청색 정맥 가시적 |
| 35-50° | Light | 중립 | 한국인 대다수 |
| 20-35° | Intermediate | 중립-웜 | 황색 언더톤 주의 |
| < 20° | Tan/Brown | 웜 | 정맥 테스트 부적합 |

---

## 5. 손목 혈관 분석 (보조적 방법)

### 5.1 과학적 한계

> **핵심 경고**: 정맥 테스트는 **과학적 검증이 없는 보조적 방법**이다.
> 전체 퍼스널 컬러 분석에서 **10% 이하 가중치**로만 활용해야 한다.

**신뢰도가 낮은 이유**:
- 정맥 자체는 무색이며 색상은 광학적 현상
- 멜라닌 함량에 따른 가시성 변화
- 피하지방 두께의 개인차
- 혈중 산소 농도 변화
- 조명 조건의 영향

### 5.2 Lab 색공간 기반 분석

**정맥 색상 해석**:

| 정맥 외관 | a* 범위 | b* 범위 | 의미 |
|-----------|---------|---------|------|
| 녹색 계열 | **-25 ~ -5** | -5 ~ +10 | 음수 a* 우세 |
| 청색 계열 | -10 ~ +5 | **-30 ~ -5** | 음수 b* 우세 |
| 보라색 계열 | +5 ~ +15 | -20 ~ -5 | 양수 a*, 음수 b* |

**상대적 측정 (Delta 값)**:

| 언더톤 | Δa* (정맥-피부) | Δb* (정맥-피부) |
|--------|-----------------|-----------------|
| 웜톤 (녹색 정맥) | < -5 | > -3 |
| 쿨톤 (청색 정맥) | > -3 | < -5 |
| 뉴트럴 | -3 ~ +3 | -3 ~ +3 |

### 5.3 한국인 피부 특성

**한국인 피부 Lab 평균값** (연세대 연구, n=148):

| 파라미터 | 평균값 | 표준편차 |
|----------|--------|---------|
| L* | 64.15 | ±4.86 |
| a* | 8.96 | ±2.65 |
| **b*** | **18.34** | ±2.39 |

**높은 b* 값(황색 언더톤)**으로 인해:
- 쿨톤 한국인도 정맥이 녹색으로 보일 수 있음
- 표준 임계값 조정 필요

### 5.4 ITA (Individual Typology Angle)

**공식**:

```
ITA° = arctan[(L* - 50) / b*] × (180/π)
```

| ITA 범위 | 피부 분류 | 정맥 가시성 |
|---------|----------|------------|
| > 55° | Very Light | 높음 |
| 41-55° | Light | 높음 |
| 28-41° | Intermediate | 중간 |
| 10-28° | Tan | 낮음 |
| < 10° | Brown/Dark | 매우 낮음 |

---

## 6. 플랫폼별 구현 전략

### 6.1 웹 (Next.js)

**구조**:

```
Canvas API → Web Workers + OffscreenCanvas → WebGL (필요시)
```

**핵심 패턴**:
- 이미지 캡처: Canvas API
- 백그라운드 처리: Web Workers
- GPU 가속: WebGL (필요시)
- 얼굴 감지: MediaPipe Face Landmarker

**Web Worker 사용**:

```typescript
// quality-worker.ts (Worker 스레드)
self.onmessage = async (e: MessageEvent) => {
  const { imageData, faceRect } = e.data;
  const result = assessQuality(imageData, faceRect);
  self.postMessage(result);
};
```

**메인 스레드에서 Worker 호출**:

```typescript
// lib/image/quality-checker.ts (메인 스레드)
interface QualityResult {
  sharpness: number;
  brightness: number;
  colorTemp: number;
  overallScore: number;
  isAcceptable: boolean;
}

class ImageQualityChecker {
  private worker: Worker | null = null;
  private pendingResolve: ((result: QualityResult) => void) | null = null;

  async initialize(): Promise<void> {
    if (typeof Worker === 'undefined') {
      console.warn('[ImageQuality] Web Workers not supported');
      return;
    }

    this.worker = new Worker(
      new URL('./quality-worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (e: MessageEvent<QualityResult>) => {
      if (this.pendingResolve) {
        this.pendingResolve(e.data);
        this.pendingResolve = null;
      }
    };

    this.worker.onerror = (error) => {
      console.error('[ImageQuality] Worker error:', error);
    };
  }

  async assessQuality(
    imageData: ImageData,
    faceRect: DOMRect
  ): Promise<QualityResult> {
    if (!this.worker) {
      // Fallback: 메인 스레드에서 직접 실행
      return assessQualitySync(imageData, faceRect);
    }

    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      this.worker!.postMessage({ imageData, faceRect });
    });
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}

// 사용 예시
const checker = new ImageQualityChecker();
await checker.initialize();

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;
ctx.drawImage(videoElement, 0, 0);
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

const quality = await checker.assessQuality(imageData, faceRect);
if (!quality.isAcceptable) {
  showGuidance(quality); // 사용자 안내 표시
}
```

### 6.2 모바일 (React Native/Expo)

**구조**:

```
Vision Camera → Frame Processors → Native Plugin (C++/OpenCV)
```

**핵심 패턴**:
- 카메라: react-native-vision-camera
- 실시간 처리: Frame Processors
- 얼굴 감지: ML Kit
- 픽셀 포맷: YUV (RGB보다 효율적)

### 6.3 성능 최적화

| 전략 | 효과 |
|------|------|
| 480×360으로 다운샘플 | 처리 속도 4배 향상 |
| 얼굴 영역(ROI)만 분석 | 처리량 80% 감소 |
| 검사 병렬 실행 | 총 시간 50% 단축 |
| Fail Fast (조기 종료) | 불필요한 처리 방지 |

**목표 처리 시간**: **50-100ms**

---

## 7. 품질 평가 파이프라인

### 7.1 전체 플로우

```
프레임 캡처
    ↓
얼굴 감지 → 실패 → "얼굴을 찾을 수 없습니다"
    ↓ 성공
얼굴 크기 확인 → 부족 → "카메라에 더 가까이"
    ↓ 충분
선명도 평가 (Laplacian) → 흐림 → "초점을 맞춰주세요"
    ↓ 선명
노출 평가 → 문제 → "조명 조절 필요"
    ↓ 적정
색온도 평가 (McCamy) → 부적합 → "자연광으로 이동"
    ↓ 적합
✅ 분석 진행
```

### 7.2 종합 품질 점수

**가중치**:

| 요소 | 가중치 |
|------|--------|
| 선명도 | 30% |
| 노출 | 25% |
| 색온도 | 25% |
| 얼굴 크기 | 20% |

**판정 기준**:
- 70점 이상: 분석 진행
- 50-69점: 경고 표시 후 진행
- 50점 미만: 재촬영 요청

---

## 8. 구현 체크리스트

### 8.1 이미지 품질 평가

- [ ] Laplacian Variance 구현 (임계값: 120)
- [ ] 히스토그램 분석 (평균 밝기: 80-190)
- [ ] McCamy 공식 CCT 추정 (범위: 4500-7000K)
- [ ] 얼굴 크기 검증 (최소: 150×150px)

### 8.2 화이트밸런스

- [ ] sRGB → XYZ 변환 (D65 기준)
- [ ] Shades of Gray (p=6) 구현
- [ ] 보정 전/후 비교 로깅

### 8.3 얼굴 랜드마크

- [ ] MediaPipe Face Landmarker 초기화
- [ ] GPU 웜업 처리 (첫 추론 전)
- [ ] 퍼스널 컬러 영역 인덱스 매핑
- [ ] iOS Safari 폴백 전략

### 8.4 손목 혈관 (선택적)

- [ ] ROI 추출 (MediaPipe Hand Landmarker)
- [ ] Lab 색공간 변환
- [ ] ITA 계산 및 멜라닌 보정
- [ ] 신뢰도 제한 (최대 60%)

### 8.5 플랫폼 최적화

- [ ] Web Workers 통합 (웹)
- [ ] Frame Processors 통합 (모바일)
- [ ] 다운샘플링 적용 (480×360)
- [ ] 처리 시간 모니터링 (목표: 50-100ms)

---

## 9. 개인정보 및 데이터 보안

### 9.1 생체정보 처리 원칙

| 원칙 | 구현 | 참조 |
|------|------|------|
| **최소 수집** | 분석에 필요한 영역만 추출 | 전체 얼굴 저장 안 함 |
| **즉시 삭제** | 분석 완료 후 원본 이미지 삭제 | 30일 이내 자동 익명화 |
| **암호화 저장** | 임시 저장 시 암호화 필수 | AES-256 |
| **동의 기반** | 명시적 동의 후에만 분석 | 개인정보처리방침 |

### 9.2 얼굴 랜드마크 데이터

```typescript
// 얼굴 랜드마크는 좌표 데이터만 저장 (이미지 미저장)
interface StoredFacialData {
  landmarkHash: string;      // 익명화된 해시
  skinToneMetrics: LabColor; // 색상 메트릭만
  qualityScore: number;
  analysisDate: string;
  // ❌ rawImage 저장하지 않음
}
```

### 9.3 사용자 동의 문구

```typescript
const BIOMETRIC_CONSENT = `
얼굴 이미지 분석 동의

이룸은 퍼스널컬러 및 피부 분석을 위해 카메라로 촬영한
얼굴 이미지를 처리합니다.

• 이미지는 분석 완료 후 즉시 삭제됩니다
• 분석 결과(색상 수치)만 저장되며 얼굴 사진은 저장되지 않습니다
• 데이터는 암호화되어 처리됩니다
• 언제든지 데이터 삭제를 요청할 수 있습니다

동의하시면 '분석 시작'을 눌러주세요.
`;
```

### 9.4 의존성 버전 요구사항

```
⚠️ MediaPipe 버전 요구사항

- @mediapipe/tasks-vision: ^0.10.8 (2024년 이후 버전)
- WebGL 2.0 지원 브라우저 필수
- iOS Safari 16.4+ (WebGL 제한 우회)
- Android Chrome 80+ (권장)

버전 불일치 시 얼굴 감지 정확도가 저하될 수 있습니다.
```

---

## 10. 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서 | 설명 |
|------|------|
| [SDD-CIE-1-IMAGE-QUALITY](../specs/SDD-CIE-1-IMAGE-QUALITY.md) | 이미지 품질 검증 스펙 |
| [SDD-CIE-2-FACE-DETECTION](../specs/SDD-CIE-2-FACE-DETECTION.md) | 얼굴 감지 스펙 |
| [SDD-CIE-3-AWB-CORRECTION](../specs/SDD-CIE-3-AWB-CORRECTION.md) | 화이트밸런스 보정 스펙 |
| [SDD-CIE-4-LIGHTING-ANALYSIS](../specs/SDD-CIE-4-LIGHTING-ANALYSIS.md) | 조명 분석 스펙 |

### 관련 원리 문서

| 문서 | 설명 |
|------|------|
| [color-science.md](./color-science.md) | Lab 색공간, 퍼스널 컬러 원리 |
| [skin-physiology.md](./skin-physiology.md) | 피부 생리학 원리 |

### 관련 규칙

| 문서 | 설명 |
|------|------|
| [react-patterns.md](../../.claude/rules/react-patterns.md) | React 컴포넌트 패턴 |

---

## 11. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-001](../adr/ADR-001-core-image-engine.md) | Core Image Engine | Laplacian sharpness, 색온도 |
| [ADR-026](../adr/ADR-026-color-space-hsl-decision.md) | 색공간 HSL 결정 | 화이트밸런스 보정 |
| [ADR-033](../adr/ADR-033-face-detection-library.md) | 얼굴 감지 라이브러리 선택 | 얼굴 각도 검증, MediaPipe |

---

**Version**: 1.2 | **Created**: 2026-01-16 | **Updated**: 2026-01-20
**소스 리서치**: CIE-1-R1, CIE-2-R1, CIE-4-R1
**추가 내용**: 얼굴 각도/정면성 검증 (Section 4), 한국인 ITA 보정 (Section 4.4)
