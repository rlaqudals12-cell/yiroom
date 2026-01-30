# CIE-2/3/4 P3 원자 분해 (SDD-CIE-P3-DECOMPOSITION)

> **Version**: 1.0 | **Created**: 2026-01-30
> **Status**: Reference | **Priority**: P3
> **원칙**: P3 원자 분해 (Atomic Decomposition) - 독립적으로 테스트 가능한 최소 단위

---

## 1. 개요

### 1.1 목적

Core Image Engine (CIE-2, CIE-3, CIE-4) 모듈의 P3 원자 분해를 문서화합니다.
각 원자는 독립적으로 테스트 가능한 최소 단위입니다.

### 1.2 모듈 개요

| 모듈 | 책임 | 구현 상태 | 테스트 상태 |
|------|------|-----------|-------------|
| **CIE-2** | 얼굴 감지, 랜드마크 추출 | ✅ ~80% | ✅ 통과 |
| **CIE-3** | AWB 색상 보정 | ✅ ~85% | ✅ 통과 |
| **CIE-4** | 조명 분석 | ✅ ~85% | ✅ 통과 |

### 1.3 파일 구조

```
lib/image-engine/
├── cie-2/
│   ├── index.ts          # Barrel Export
│   ├── processor.ts      # 메인 프로세서
│   ├── face-detector.ts  # 얼굴 감지
│   ├── region-extractor.ts # 영역 추출
│   └── fallback.ts       # Mock Fallback
├── cie-3/
│   ├── index.ts          # Barrel Export
│   ├── processor.ts      # 메인 프로세서
│   ├── skin-detector.ts  # 피부 감지
│   ├── awb-algorithms.ts # AWB 알고리즘
│   ├── confidence.ts     # 신뢰도 계산
│   └── fallback.ts       # Mock Fallback
├── cie-4/
│   ├── index.ts          # Barrel Export
│   ├── processor.ts      # 메인 프로세서
│   ├── cct-analyzer.ts   # CCT 분석
│   ├── zone-analyzer.ts  # 6존 분석
│   ├── shadow-detector.ts # 그림자 감지
│   └── fallback.ts       # Mock Fallback
└── pipeline/
    ├── index.ts          # Pipeline Export
    ├── types.ts          # 타입 정의
    └── processor.ts      # 통합 프로세서
```

---

## 2. CIE-2 얼굴 감지 (Face Detection)

### 2.1 원자 분해

| ID | 원자명 | 입력 | 출력 | 의존성 | 시간 |
|----|--------|------|------|--------|------|
| CIE-2.1 | `convertLandmarksToPoints` | MediaPipe 랜드마크 | `Point[]` | 없음 | 30분 |
| CIE-2.2 | `calculateBoundingBoxFromLandmarks` | `Point[]` | `BoundingBox` | CIE-2.1 | 30분 |
| CIE-2.3 | `calculateFaceAngle` | `Point[]` | `FaceAngle` | CIE-2.1 | 30분 |
| CIE-2.4 | `calculateFrontalityFromLandmarks` | `Point[]`, angles | `number` (0-1) | CIE-2.3 | 30분 |
| CIE-2.5 | `selectBestFace` | `DetectedFace[]` | `DetectedFace` | 없음 | 30분 |
| CIE-2.6 | `validateFaceAngle` | `FaceAngle` | `boolean` | 없음 | 15분 |
| CIE-2.7 | `normalizeBoundingBox` | `BoundingBox`, size | `BoundingBox` | 없음 | 15분 |
| CIE-2.8 | `extractFaceRegion` | `ImageData`, box | `ImageData` | CIE-2.7 | 30분 |
| CIE-2.9 | `processMediaPipeResults` | 전체 | `CIE2Result` | 전체 | 1시간 |
| CIE-2.10 | `generateCIE2Fallback` | 기본값 | `CIE2Result` | 없음 | 15분 |

### 2.2 원자 상세

#### CIE-2.1: convertLandmarksToPoints

```typescript
// 입력
interface MediaPipeLandmark {
  x: number;  // 0-1 정규화
  y: number;
  z?: number;
  visibility?: number;
}

// 출력
interface Point {
  x: number;  // 픽셀 좌표
  y: number;
}

// 성공 기준
- 468개 랜드마크 → 468개 Point 변환
- 정규화 좌표 → 픽셀 좌표 변환 정확도
- visibility 낮은 점 필터링 옵션
```

#### CIE-2.4: calculateFrontalityFromLandmarks

```typescript
// 입력
landmarks: Point[]
faceAngle: FaceAngle

// 출력
frontality: number  // 0.0 ~ 1.0 (1.0 = 완전 정면)

// 성공 기준
- 정면 얼굴: frontality > 0.8
- 측면 얼굴: frontality < 0.5
- 각도 기반 보정 적용
```

#### CIE-2.9: processMediaPipeResults (통합 원자)

```typescript
// 입력
imageData: ImageData
mediaPipeResults: MediaPipeFaceResult[]

// 출력
interface CIE2Result {
  detected: boolean;
  face?: DetectedFace;
  faceRegion?: ImageData;
  landmarks?: Point[];
  frontality: number;
  confidence: number;
  usedFallback: boolean;
}

// 성공 기준
- 얼굴 감지율 > 95% (정상 이미지)
- 정면도 계산 정확도
- Fallback 정상 동작
```

### 2.3 의존성 그래프

```
CIE-2.1 convertLandmarksToPoints
    │
    ├──> CIE-2.2 calculateBoundingBoxFromLandmarks
    │
    ├──> CIE-2.3 calculateFaceAngle
    │       │
    │       └──> CIE-2.4 calculateFrontalityFromLandmarks
    │
    └──> CIE-2.6 validateFaceAngle

CIE-2.7 normalizeBoundingBox
    │
    └──> CIE-2.8 extractFaceRegion

CIE-2.5 selectBestFace (독립)

CIE-2.9 processMediaPipeResults (전체 통합)
    │
    └── CIE-2.1 ~ CIE-2.8 모두 사용

CIE-2.10 generateCIE2Fallback (독립)
```

---

## 3. CIE-3 AWB 색상 보정 (White Balance)

### 3.1 원자 분해

| ID | 원자명 | 입력 | 출력 | 의존성 | 시간 |
|----|--------|------|------|--------|------|
| CIE-3.1 | `isSkinPixel` | RGB | `boolean` | 없음 | 15분 |
| CIE-3.2 | `detectSkinMask` | `ImageData` | `boolean[][]` | CIE-3.1 | 30분 |
| CIE-3.3 | `hasSufficientSkinCoverage` | mask | `boolean` | CIE-3.2 | 15분 |
| CIE-3.4 | `calculateSkinAverageRGB` | `ImageData`, mask | `RGB` | CIE-3.2 | 30분 |
| CIE-3.5 | `calculateGrayWorldGains` | `ImageData` | `RGBGains` | 없음 | 30분 |
| CIE-3.6 | `applyGrayWorld` | `ImageData`, gains | `ImageData` | CIE-3.5 | 30분 |
| CIE-3.7 | `applyVonKries` | `ImageData`, gains | `ImageData` | 없음 | 30분 |
| CIE-3.8 | `applySkinAwareAWB` | `ImageData`, mask | `ImageData` | CIE-3.2 | 1시간 |
| CIE-3.9 | `calculateConfidence` | stats | `number` | 없음 | 30분 |
| CIE-3.10 | `selectAndApplyAWB` | `ImageData` | `AWBResult` | 전체 | 1시간 |
| CIE-3.11 | `generateCIE3Fallback` | 기본값 | `CIE3Result` | 없음 | 15분 |

### 3.2 원자 상세

#### CIE-3.1: isSkinPixel

```typescript
// 입력
r: number  // 0-255
g: number
b: number

// 출력
isSkin: boolean

// 알고리즘 (YCbCr 기반)
- Y = 0.299*R + 0.587*G + 0.114*B
- Cb = 128 - 0.169*R - 0.331*G + 0.500*B
- Cr = 128 + 0.500*R - 0.419*G - 0.081*B
- 77 ≤ Cb ≤ 127 && 133 ≤ Cr ≤ 173

// 성공 기준
- 피부 픽셀 감지 정확도 > 85%
- 비피부 오탐률 < 15%
```

#### CIE-3.5: calculateGrayWorldGains

```typescript
// 입력
imageData: ImageData

// 출력
interface RGBGains {
  r: number;  // 0.5 ~ 2.0
  g: number;
  b: number;
}

// 알고리즘 (Gray World)
avgR = mean(R pixels)
avgG = mean(G pixels)
avgB = mean(B pixels)
gray = (avgR + avgG + avgB) / 3
gains = { r: gray/avgR, g: gray/avgG, b: gray/avgB }

// 성공 기준
- 게인 범위: 0.5 ~ 2.0
- 중성 회색 이미지: gains ≈ { r: 1, g: 1, b: 1 }
```

#### CIE-3.8: applySkinAwareAWB

```typescript
// 입력
imageData: ImageData
skinMask: boolean[][]

// 출력
correctedImage: ImageData

// 알고리즘
1. 피부 영역 평균 RGB 계산
2. 목표 피부톤으로 보정 (D65 기준)
3. 비피부 영역에 Gray World 적용
4. 경계 부분 블렌딩

// 성공 기준
- 피부톤 자연스러움 유지
- 색상 왜곡 최소화
- 경계 아티팩트 없음
```

#### CIE-3.10: selectAndApplyAWB (통합 원자)

```typescript
// 입력
imageData: ImageData

// 출력
interface AWBResult {
  correctionApplied: boolean;
  method: 'gray-world' | 'von-kries' | 'skin-aware' | 'none';
  result: {
    correctedImage: ImageData;
    gains: RGBGains;
    confidence: number;
  };
  skinCoverage: number;
}

// 방법 선택 로직
1. 피부 커버리지 > 20% → Skin-Aware AWB
2. 피부 커버리지 10-20% → Von Kries
3. 피부 커버리지 < 10% → Gray World
4. CCT 5500-6500K → None (보정 불필요)

// 성공 기준
- 적절한 방법 자동 선택
- 과보정 방지 (gains 범위 제한)
- 신뢰도 정확한 계산
```

### 3.3 의존성 그래프

```
CIE-3.1 isSkinPixel
    │
    └──> CIE-3.2 detectSkinMask
            │
            ├──> CIE-3.3 hasSufficientSkinCoverage
            │
            ├──> CIE-3.4 calculateSkinAverageRGB
            │
            └──> CIE-3.8 applySkinAwareAWB

CIE-3.5 calculateGrayWorldGains
    │
    └──> CIE-3.6 applyGrayWorld

CIE-3.7 applyVonKries (독립)

CIE-3.9 calculateConfidence (독립)

CIE-3.10 selectAndApplyAWB (전체 통합)
    │
    └── CIE-3.1 ~ CIE-3.9 모두 사용

CIE-3.11 generateCIE3Fallback (독립)
```

---

## 4. CIE-4 조명 분석 (Lighting Analysis)

### 4.1 원자 분해

| ID | 원자명 | 입력 | 출력 | 의존성 | 시간 |
|----|--------|------|------|--------|------|
| CIE-4.1 | `calculateRegionAverageRGB` | `ImageData`, region | `RGB` | 없음 | 15분 |
| CIE-4.2 | `estimateCCTFromForehead` | `ImageData`, region | `number` (K) | CIE-4.1 | 30분 |
| CIE-4.3 | `classifyLightingType` | CCT | `LightingType` | CIE-4.2 | 15분 |
| CIE-4.4 | `evaluateCCTSuitability` | CCT | `boolean` | 없음 | 15분 |
| CIE-4.5 | `calculateZoneBrightness` | `ImageData`, zone | `number` | CIE-4.1 | 30분 |
| CIE-4.6 | `analyzeZoneBrightness` | brightnesses | `ZoneAnalysis` | CIE-4.5 | 30분 |
| CIE-4.7 | `calculateUniformity` | brightnesses | `number` | CIE-4.6 | 15분 |
| CIE-4.8 | `calculateLeftRightAsymmetry` | zones | `number` | CIE-4.6 | 15분 |
| CIE-4.9 | `detectShadowDirection` | `ImageData` | `Direction` | 없음 | 30분 |
| CIE-4.10 | `calculateShadowIntensity` | `ImageData` | `number` | 없음 | 30분 |
| CIE-4.11 | `performShadowAnalysis` | `ImageData` | `ShadowAnalysis` | CIE-4.9, CIE-4.10 | 30분 |
| CIE-4.12 | `processLightingAnalysis` | 전체 | `CIE4Result` | 전체 | 1시간 |
| CIE-4.13 | `generateCIE4Fallback` | 기본값 | `CIE4Result` | 없음 | 15분 |

### 4.2 원자 상세

#### CIE-4.2: estimateCCTFromForehead

```typescript
// 입력
imageData: ImageData
foreheadRegion: BoundingBox

// 출력
cct: number  // 색온도 (Kelvin), 2700K ~ 10000K

// 알고리즘 (McCamy 공식)
1. 이마 영역 평균 RGB 계산
2. XYZ 색공간 변환
3. chromaticity 좌표 (x, y) 계산
4. n = (x - 0.3320) / (0.1858 - y)
5. CCT = 449*n³ + 3525*n² + 6823.3*n + 5520.33

// 성공 기준
- CCT 오차 ±300K (실제 조명 대비)
- 일반 실내광 (2700-6500K) 정확도 우선
```

#### CIE-4.3: classifyLightingType

```typescript
// 입력
cct: number

// 출력
type LightingType =
  | 'tungsten'       // < 3200K
  | 'warm-white'     // 3200-4000K
  | 'neutral'        // 4000-5500K
  | 'daylight'       // 5500-6500K
  | 'cool-daylight'  // 6500-8000K
  | 'blue-sky';      // > 8000K

// 성공 기준
- 분류 정확도 > 90%
- 경계값 처리 일관성
```

#### CIE-4.6: analyzeZoneBrightness

```typescript
// 입력
imageData: ImageData

// 출력
interface ZoneAnalysis {
  zones: {
    forehead: number;    // 0-255
    leftCheek: number;
    rightCheek: number;
    nose: number;
    chin: number;
    overall: number;
  };
  uniformity: number;    // 0-100
  asymmetry: number;     // 0-1 (좌우 차이)
  gradient: number;      // 상하 그라디언트
}

// 6존 정의
FACE_ZONES = {
  forehead: { y: 0.1-0.3, x: 0.25-0.75 },
  leftCheek: { y: 0.35-0.65, x: 0.05-0.35 },
  rightCheek: { y: 0.35-0.65, x: 0.65-0.95 },
  nose: { y: 0.35-0.65, x: 0.4-0.6 },
  chin: { y: 0.7-0.9, x: 0.35-0.65 },
}

// 성공 기준
- 균일도 계산 정확도
- 비대칭 감지 민감도
```

#### CIE-4.11: performShadowAnalysis

```typescript
// 입력
imageData: ImageData

// 출력
interface ShadowAnalysis {
  hasShadow: boolean;
  direction: 'left' | 'right' | 'top' | 'bottom' | 'none';
  intensity: number;     // 0-100
  darkAreaRatio: number; // 어두운 영역 비율
  overexposedRatio: number; // 과노출 영역 비율
}

// 알고리즘
1. 밝기 히스토그램 분석
2. 영역별 밝기 차이 계산
3. 그림자 방향 추정 (최어두운 쪽)
4. 강도 = (밝은영역평균 - 어두운영역평균) / 밝은영역평균

// 성공 기준
- 그림자 감지 정확도 > 85%
- 방향 판별 정확도 > 80%
```

#### CIE-4.12: processLightingAnalysis (통합 원자)

```typescript
// 입력
imageData: ImageData
faceRegion?: BoundingBox

// 출력
interface CIE4Result {
  isSuitable: boolean;
  estimatedCCT: number;
  lightingType: LightingType;
  zoneAnalysis: ZoneAnalysis;
  shadowAnalysis: ShadowAnalysis;
  overallScore: number;   // 0-100
  recommendations: string[];
  confidence: number;
  usedFallback: boolean;
}

// 적합성 판단 기준
isSuitable = (
  cct >= 4000 && cct <= 7000 &&
  uniformity > 70 &&
  asymmetry < 0.3 &&
  !hasSeveShadow
)

// 성공 기준
- 조명 품질 정확한 평가
- 적절한 추천 메시지 생성
- Fallback 정상 동작
```

### 4.3 의존성 그래프

```
CIE-4.1 calculateRegionAverageRGB
    │
    ├──> CIE-4.2 estimateCCTFromForehead
    │       │
    │       └──> CIE-4.3 classifyLightingType
    │
    └──> CIE-4.5 calculateZoneBrightness
            │
            └──> CIE-4.6 analyzeZoneBrightness
                    │
                    ├──> CIE-4.7 calculateUniformity
                    │
                    └──> CIE-4.8 calculateLeftRightAsymmetry

CIE-4.4 evaluateCCTSuitability (독립)

CIE-4.9 detectShadowDirection ──┐
                                ├──> CIE-4.11 performShadowAnalysis
CIE-4.10 calculateShadowIntensity ┘

CIE-4.12 processLightingAnalysis (전체 통합)
    │
    └── CIE-4.1 ~ CIE-4.11 모두 사용

CIE-4.13 generateCIE4Fallback (독립)
```

---

## 5. Pipeline 통합

### 5.1 통합 원자 분해

| ID | 원자명 | 입력 | 출력 | 의존성 |
|----|--------|------|------|--------|
| PIPE.1 | `runCIE1` | `ImageData` | `CIE1Result` | 없음 |
| PIPE.2 | `runCIE2` | `ImageData` | `CIE2Result` | PIPE.1 통과 시 |
| PIPE.3 | `runCIE3` | `ImageData`, face | `CIE3Result` | PIPE.2 통과 시 |
| PIPE.4 | `runCIE4` | `ImageData`, face | `CIE4Result` | PIPE.2 통과 시 |
| PIPE.5 | `runFullPipeline` | `ImageData` | `PipelineResult` | 전체 |

### 5.2 Pipeline 실행 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CIE Pipeline 실행 흐름                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Input: ImageData                                                       │
│      │                                                                  │
│      ▼                                                                  │
│  ┌────────────┐                                                         │
│  │   CIE-1    │ 이미지 품질 검증 (해상도, sharpness, 노출)              │
│  │ (required) │                                                         │
│  └─────┬──────┘                                                         │
│        │ pass                                                           │
│        ▼                                                                │
│  ┌────────────┐                                                         │
│  │   CIE-2    │ 얼굴 감지 + 랜드마크 추출                               │
│  │ (required) │                                                         │
│  └─────┬──────┘                                                         │
│        │ detected                                                       │
│        ├───────────────────────┐                                        │
│        │                       │                                        │
│        ▼                       ▼                                        │
│  ┌────────────┐          ┌────────────┐                                 │
│  │   CIE-3    │          │   CIE-4    │                                 │
│  │ (optional) │          │ (optional) │                                 │
│  │ AWB 보정   │          │ 조명 분석  │                                 │
│  └─────┬──────┘          └─────┬──────┘                                 │
│        │                       │                                        │
│        └───────────┬───────────┘                                        │
│                    │                                                    │
│                    ▼                                                    │
│  ┌─────────────────────────────┐                                        │
│  │      PipelineResult         │                                        │
│  │  - quality (CIE-1)          │                                        │
│  │  - faceDetection (CIE-2)    │                                        │
│  │  - awbCorrection (CIE-3)    │                                        │
│  │  - lightingAnalysis (CIE-4) │                                        │
│  │  - overallConfidence        │                                        │
│  │  - isReadyForAnalysis       │                                        │
│  └─────────────────────────────┘                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 테스트 커버리지

### 6.1 현재 테스트 현황

| 모듈 | 테스트 파일 | 테스트 수 | 상태 |
|------|-------------|-----------|------|
| CIE-2 | `cie-2/*.test.ts` | 89 | ✅ Pass |
| CIE-3 | `cie-3/*.test.ts` | 156 | ✅ Pass |
| CIE-4 | `cie-4/*.test.ts` | 131 | ✅ Pass |
| Pipeline | `pipeline/*.test.ts` | 28 | ✅ Pass |
| **Total** | - | **404+** | ✅ |

### 6.2 원자별 테스트 매핑

```typescript
// tests/lib/image-engine/cie-2/face-detector.test.ts
describe('CIE-2.1: convertLandmarksToPoints', () => { ... });
describe('CIE-2.3: calculateFaceAngle', () => { ... });
describe('CIE-2.4: calculateFrontalityFromLandmarks', () => { ... });

// tests/lib/image-engine/cie-3/awb-algorithms.test.ts
describe('CIE-3.5: calculateGrayWorldGains', () => { ... });
describe('CIE-3.6: applyGrayWorld', () => { ... });
describe('CIE-3.8: applySkinAwareAWB', () => { ... });

// tests/lib/image-engine/cie-4/zone-analyzer.test.ts
describe('CIE-4.6: analyzeZoneBrightness', () => { ... });
describe('CIE-4.7: calculateUniformity', () => { ... });
```

---

## 7. 성능 목표

### 7.1 원자별 실행 시간 목표

| 원자 | 목표 시간 | 현재 성능 |
|------|-----------|-----------|
| CIE-2.1~2.8 (개별) | < 50ms | ✅ ~30ms |
| CIE-2.9 (통합) | < 200ms | ✅ ~150ms |
| CIE-3.1~3.9 (개별) | < 100ms | ✅ ~80ms |
| CIE-3.10 (통합) | < 500ms | ✅ ~350ms |
| CIE-4.1~4.11 (개별) | < 100ms | ✅ ~70ms |
| CIE-4.12 (통합) | < 300ms | ✅ ~200ms |
| Full Pipeline | < 1500ms | ✅ ~1000ms |

### 7.2 메모리 사용량

| 단계 | 목표 | 비고 |
|------|------|------|
| 이미지 로드 | < 10MB | 1024px 기준 |
| CIE-2 처리 | < 5MB 추가 | 랜드마크 데이터 |
| CIE-3 처리 | < 10MB 추가 | 보정 이미지 |
| CIE-4 처리 | < 3MB 추가 | 분석 결과 |

---

## 8. 관련 문서

- [SDD-CIE-1-IMAGE-QUALITY.md](./SDD-CIE-1-IMAGE-QUALITY.md) - CIE-1 상세
- [SDD-CIE-2-FACE-DETECTION.md](./SDD-CIE-2-FACE-DETECTION.md) - CIE-2 상세
- [SDD-CIE-3-AWB-CORRECTION.md](./SDD-CIE-3-AWB-CORRECTION.md) - CIE-3 상세
- [SDD-CIE-4-LIGHTING-ANALYSIS.md](./SDD-CIE-4-LIGHTING-ANALYSIS.md) - CIE-4 상세
- [ADR-001-core-image-engine.md](../adr/ADR-001-core-image-engine.md) - 아키텍처 결정
- [00-first-principles.md](../../.claude/rules/00-first-principles.md) - P3 원자 분해 원칙

---

**Version**: 1.0 | **Author**: Claude Code
