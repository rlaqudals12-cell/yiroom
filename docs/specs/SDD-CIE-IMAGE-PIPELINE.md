# SDD: CIE 이미지 엔진 파이프라인 (Image Pipeline)

> **Version**: 1.0 | **Date**: 2026-03-15
> **Status**: 부분 구현
> **ADR 참조**: [ADR-001 Core Image Engine](../adr/ADR-001-core-image-engine.md)
> **원리 참조**: [image-processing.md](../principles/image-processing.md), [color-science.md](../principles/color-science.md)

---

## 1. 개요

CIE(Core Image Engine)는 사용자가 업로드한 이미지에서 AI 분석에 필요한 전처리를 수행하는 4단계 파이프라인이다. 각 단계는 독립적으로 테스트 가능하며, 순차적으로 실행되어 최종 분석 모듈(PC-1, S-1, C-1 등)에 정규화된 데이터를 전달한다.

### 1.1 파이프라인 전체 흐름

```
사용자 이미지 업로드
       ↓
┌─────────────────────────────────────────────────┐
│  CIE-1: 이미지 품질 검증                          │
│  ├── 해상도 검증 (최소 640x480)                   │
│  ├── Laplacian Variance 선명도 (≥40)              │
│  ├── 히스토그램 노출 분석                          │
│  └── McCamy CCT 색온도 추정                        │
│       ↓ ImageQualityResult                        │
├─────────────────────────────────────────────────┤
│  CIE-2: 얼굴 감지 및 랜드마크 추출                │
│  ├── MediaPipe Face Mesh 468포인트                 │
│  ├── 오일러 각도 계산 (Pitch/Yaw/Roll)            │
│  ├── 정면성 점수 (≥70 분석 가능)                  │
│  └── 얼굴 영역 추출 (20% 마진)                    │
│       ↓ FaceDetectionResult + FaceRegion          │
├─────────────────────────────────────────────────┤
│  CIE-3: 화이트밸런스 보정                          │
│  ├── Gray World 알고리즘                           │
│  ├── Von Kries 색순응 보정                         │
│  ├── Skin-Aware AWB (피부 마스크 기반)             │
│  └── 보정 신뢰도 계산                              │
│       ↓ AWBCorrectedImage + CorrectionMetadata    │
├─────────────────────────────────────────────────┤
│  CIE-4: 조명 분석 및 ROI 추출                     │
│  ├── McCamy CCT 정밀 분석                          │
│  ├── 6존 조명 균일도 분석                          │
│  ├── 그림자 감지                                   │
│  └── ROI 추출 (피부존, 드레이프, 홍채)            │
│       ↓ LightingAnalysis + ROIData                │
└─────────────────────────────────────────────────┘
       ↓
분석 모듈 (PC-1, S-1, C-1, H-1, M-1, OH-1)
```

### 1.2 현재 구현 상태

| 단계      | 모듈        | 구현율 | 파일 위치                                              | 비고                                                         |
| --------- | ----------- | ------ | ------------------------------------------------------ | ------------------------------------------------------------ |
| **CIE-1** | 이미지 품질 | 70%    | `lib/analysis/canvas-utils.ts`                         | 해상도 제한, 캔버스 최적화 구현. Laplacian/히스토그램 미구현 |
| **CIE-2** | 얼굴 감지   | 80%    | `lib/analysis/face-landmark.ts`, `mediapipe-loader.ts` | MediaPipe CDN 로드, 468 랜드마크 추출, Mock Fallback 구현    |
| **CIE-3** | AWB 보정    | 30%    | 미구현 (PC-1이 Gemini VLM에 직접 위임)                 | Skin-Aware AWB 계획만 존재                                   |
| **CIE-4** | 조명 분석   | 30%    | 미구현 (PC-1이 Gemini VLM에 직접 위임)                 | CCT/6존 분석 계획만 존재                                     |

> **핵심 인사이트**: 현재 PC-1/S-1은 CIE 파이프라인을 거치지 않고 Gemini VLM에 이미지를 직접 전달한다. CIE-2(얼굴 랜드마크)만 드레이프 시뮬레이터/히트맵에서 활발히 사용 중이다.

---

## 2. P1 궁극의 형태

### 이상적 최종 상태

"물리적 원리에 기반한 실시간 이미지 정규화 파이프라인"

- 모든 조명 환경에서 일관된 색상 재현 (조명 불변 색상)
- 전체 파이프라인 < 200ms (모바일 포함)
- 분석 실패율 < 2% (이미지 품질 사전 필터링으로)
- 각 단계 독립 테스트/배포 가능

### 물리적 한계

| 한계            | 설명                      | 완화 전략          |
| --------------- | ------------------------- | ------------------ |
| 카메라 하드웨어 | 저가 센서의 노이즈/색수차 | 임계값 적응적 조정 |
| 극단적 조명     | 역광, 단색광 환경         | 재촬영 유도 + 경고 |
| MediaPipe 번들  | 5MB WASM + 모델           | CDN lazy loading   |
| WebGL 의존성    | iOS Safari 16.4+ 필수     | Mock Fallback      |

### 100점 기준

| 지표              | 100점 기준          | 현재               | 달성률 |
| ----------------- | ------------------- | ------------------ | ------ |
| CIE-1 품질 필터링 | False Reject < 2%   | 해상도만 제한      | 40%    |
| CIE-2 얼굴 감지   | 랜드마크 정확도 95% | MediaPipe 기본 85% | 85%    |
| CIE-3 AWB 보정    | 조명 불변 ΔE < 3    | 미구현 (VLM 위임)  | 30%    |
| CIE-4 조명 분석   | CCT ±100K 정확도    | 미구현 (VLM 위임)  | 30%    |
| 파이프라인 지연   | < 200ms             | CIE-2만 ~100ms     | 50%    |

### 현재 목표: 55%

### 의도적 제외

| 제외 항목                | 이유                            | 재검토 시점        |
| ------------------------ | ------------------------------- | ------------------ |
| 실시간 비디오 파이프라인 | 정지 이미지 분석에 집중         | AR 기능 도입 시    |
| 서버 사이드 이미지 처리  | 클라이언트 온디바이스 처리 우선 | 서버 GPU 확보 시   |
| HDR 입력 지원            | 대부분 사용자 SDR 카메라        | HDR 보급률 50%+ 시 |

---

## 3. 인터페이스 정의

### 3.1 파이프라인 통합 타입

```typescript
// lib/image-engine/pipeline/types.ts

/** 파이프라인 입력 */
export interface CIEPipelineInput {
  image: HTMLImageElement | ImageData;
  options?: CIEPipelineOptions;
}

export interface CIEPipelineOptions {
  skipQualityCheck?: boolean; // CIE-1 건너뛰기 (이미 검증된 이미지)
  skipAWB?: boolean; // CIE-3 건너뛰기 (VLM 직접 분석 시)
  skipLighting?: boolean; // CIE-4 건너뛰기
  useMock?: boolean; // Mock Fallback 강제
  timeout?: number; // 전체 파이프라인 타임아웃 (기본 5000ms)
}

/** 파이프라인 출력 */
export interface CIEPipelineOutput {
  success: boolean;

  // 각 단계 결과
  quality?: ImageQualityResult; // CIE-1
  faceDetection?: FaceDetectionResult; // CIE-2
  awbCorrection?: AWBCorrectionResult; // CIE-3
  lightingAnalysis?: LightingAnalysisResult; // CIE-4

  // 통합 메타데이터
  metadata: {
    totalProcessingTime: number; // ms
    stagesCompleted: number; // 0-4
    overallConfidence: number; // 0-1 (각 단계 곱)
    usedFallback: boolean;
  };

  // 에러 (success=false 시)
  error?: {
    stage: 'CIE-1' | 'CIE-2' | 'CIE-3' | 'CIE-4';
    code: string;
    userMessage: string;
  };
}
```

### 3.2 단계별 결과 타입

```typescript
/** CIE-1: 이미지 품질 */
export interface ImageQualityResult {
  isAcceptable: boolean;
  resolution: { width: number; height: number };
  sharpness: number; // Laplacian variance (0-100)
  exposure: {
    // 히스토그램 분석
    mean: number; // 0-255
    isOverexposed: boolean;
    isUnderexposed: boolean;
  };
  colorTemperature?: number; // Kelvin (CCT 추정)
  confidence: number; // 0-1
}

/** CIE-2: 얼굴 감지 (기존 구현됨) */
export interface FaceDetectionResult {
  faceDetected: boolean;
  faceCount: number;
  landmarks?: FaceLandmark[]; // 468개 3D 포인트
  angle?: { pitch: number; yaw: number; roll: number };
  frontalityScore?: number; // 0-100
  faceRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

/** CIE-3: AWB 보정 */
export interface AWBCorrectionResult {
  correctedImageData: ImageData;
  algorithm: 'gray-world' | 'von-kries' | 'skin-aware';
  gainFactors: { r: number; g: number; b: number };
  correctionMagnitude: number; // 보정 강도 (0-1)
  confidence: number;
}

/** CIE-4: 조명 분석 */
export interface LightingAnalysisResult {
  cct: number; // 색온도 (Kelvin)
  cctCategory: 'warm' | 'neutral' | 'cool';
  uniformity: number; // 6존 균일도 (0-1)
  shadowDetected: boolean;
  zones: Array<{
    name: string;
    brightness: number; // 0-255
    cct: number;
  }>;
  roi: {
    // 관심 영역
    skinZones: Array<{ x: number; y: number; w: number; h: number }>;
    drapeRegion?: { x: number; y: number; w: number; h: number };
    irisRegion?: { x: number; y: number; w: number; h: number };
  };
  confidence: number;
}
```

### 3.3 파이프라인 함수 시그니처

```typescript
/** 전체 파이프라인 실행 */
export async function runCIEPipeline(input: CIEPipelineInput): Promise<CIEPipelineOutput>;

/** 개별 단계 실행 (독립 테스트용) */
export async function runCIE1(image: ImageData): Promise<ImageQualityResult>;
export async function runCIE2(
  image: HTMLImageElement,
  options?: { useMock?: boolean }
): Promise<FaceDetectionResult>;
export async function runCIE3(
  image: ImageData,
  faceRegion?: FaceRegion
): Promise<AWBCorrectionResult>;
export async function runCIE4(
  image: ImageData,
  landmarks?: FaceLandmark[]
): Promise<LightingAnalysisResult>;
```

---

## 4. 원자 분해 (P3)

### 4.1 CIE-1 원자 (이미지 품질)

| ID     | 원자             | 소요 | 입력                  | 출력                       | 의존성 | 성공 기준                 |
| ------ | ---------------- | ---- | --------------------- | -------------------------- | ------ | ------------------------- |
| CIE1-1 | 해상도 검증      | 0.5h | ImageData             | { width, height, isValid } | -      | 640x480 이상 통과         |
| CIE1-2 | Laplacian 선명도 | 1.5h | ImageData (grayscale) | sharpness: number          | CIE1-1 | 전문 사진사 판단 90% 일치 |
| CIE1-3 | 히스토그램 노출  | 1h   | ImageData             | exposure 객체              | CIE1-1 | 과노출/저노출 95% 정확    |
| CIE1-4 | CCT 추정         | 1h   | ImageData             | colorTemperature: number   | CIE1-1 | 자연광 ±300K              |
| CIE1-5 | 품질 통합 판정   | 1h   | CIE1-1~4 결과         | ImageQualityResult         | 전부   | 모든 기준 종합 판정       |

### 4.2 CIE-2 원자 (얼굴 감지) - 기존 구현됨

| ID     | 원자            | 소요 | 구현 상태  | 파일                          |
| ------ | --------------- | ---- | ---------- | ----------------------------- |
| CIE2-1 | MediaPipe 로드  | 2h   | **구현됨** | `mediapipe-loader.ts`         |
| CIE2-2 | 얼굴 감지       | 2h   | **구현됨** | `face-landmark.ts`            |
| CIE2-3 | 랜드마크 추출   | 3h   | **구현됨** | `face-landmark.ts`            |
| CIE2-4 | Mock Fallback   | 1h   | **구현됨** | `lib/mock/visual-analysis.ts` |
| CIE2-5 | CDN 가용성 체크 | 0.5h | **구현됨** | `mediapipe-loader.ts`         |

### 4.3 CIE-3 원자 (AWB 보정) - 미구현

| ID     | 원자                | 소요 | 입력                    | 출력            | 의존성   | 성공 기준              |
| ------ | ------------------- | ---- | ----------------------- | --------------- | -------- | ---------------------- |
| CIE3-1 | Gray World 알고리즘 | 2h   | ImageData               | gain factors    | -        | R/G/B 채널 평균 균등화 |
| CIE3-2 | Von Kries 색순응    | 2h   | ImageData + CCT         | 보정 행렬       | CIE1-4   | D65 기준 색순응        |
| CIE3-3 | 피부 마스크 생성    | 1.5h | ImageData + 랜드마크    | 바이너리 마스크 | CIE2-3   | 피부 영역 IoU > 0.8    |
| CIE3-4 | Skin-Aware AWB      | 2h   | ImageData + 피부 마스크 | 보정 이미지     | CIE3-1~3 | 피부색 ΔE < 5          |
| CIE3-5 | 보정 신뢰도         | 1h   | 보정 전후 비교          | confidence      | CIE3-4   | 신뢰도 0-1 산출        |

### 4.4 CIE-4 원자 (조명 분석) - 미구현

| ID     | 원자            | 소요 | 입력                 | 출력                   | 의존성             | 성공 기준            |
| ------ | --------------- | ---- | -------------------- | ---------------------- | ------------------ | -------------------- |
| CIE4-1 | McCamy CCT 정밀 | 1.5h | 크롭 이미지          | cct: number            | CIE2-5 (얼굴 영역) | 자연광 ±200K         |
| CIE4-2 | 6존 분석        | 2h   | ImageData + 랜드마크 | 6존 밝기/CCT           | CIE2-3             | 각 존 정확 분할      |
| CIE4-3 | 그림자 감지     | 1.5h | 6존 데이터           | shadowDetected         | CIE4-2             | 좌우 밝기 차이 > 20% |
| CIE4-4 | ROI 추출        | 2h   | 랜드마크 + 얼굴 영역 | skin/drape/iris ROI    | CIE2-3             | 각 ROI 정확 추출     |
| CIE4-5 | 조명 통합       | 1h   | CIE4-1~4             | LightingAnalysisResult | 전부               | 종합 결과 산출       |

### 4.5 파이프라인 통합

| ID     | 원자                     | 소요 | 입력               | 출력              | 의존성 | 성공 기준                          |
| ------ | ------------------------ | ---- | ------------------ | ----------------- | ------ | ---------------------------------- |
| PIPE-1 | 순차 실행 오케스트레이터 | 2h   | CIEPipelineInput   | CIEPipelineOutput | 전단계 | 단계별 타임아웃 + 에러 전파        |
| PIPE-2 | 신뢰도 전파 계산         | 1h   | 각 단계 confidence | 종합 confidence   | PIPE-1 | 곱셈 방식 전파                     |
| PIPE-3 | Mock Fallback 통합       | 1h   | 각 단계 실패       | Mock 결과         | PIPE-1 | 어떤 단계 실패해도 파이프라인 완주 |

### 의존성 그래프

```
CIE1-1 (해상도)
  ├→ CIE1-2 (선명도)
  ├→ CIE1-3 (노출)
  └→ CIE1-4 (CCT)
       └→ CIE1-5 (통합) ─→ Gate: 품질 충분?
                                   ↓ Yes
                              CIE2-1 (MediaPipe 로드) ✅
                                   ↓
                              CIE2-2~5 (얼굴 감지) ✅
                                   ↓
                              CIE3-1~5 (AWB) ⏳
                                   ↓
                              CIE4-1~5 (조명) ⏳
                                   ↓
                              PIPE-1~3 (통합) ⏳
```

**총 예상 소요**: 32시간 (CIE-2 이미 구현, CIE-1 부분 구현)

- CIE-1 잔여: 5시간
- CIE-3 신규: 8.5시간
- CIE-4 신규: 8시간
- 파이프라인 통합: 4시간

---

## 5. 구현 가이드

### 5.1 파일 구조

```
lib/analysis/
├── canvas-utils.ts              # ✅ 캔버스 크기 제한 (CIE-1 일부)
├── face-landmark.ts             # ✅ 얼굴 랜드마크 (CIE-2)
├── mediapipe-loader.ts          # ✅ MediaPipe CDN 로더 (CIE-2)
├── device-capability.ts         # ✅ 디바이스 성능 감지
├── memory-manager.ts            # ✅ 메모리 관리
├── uniformity-measure.ts        # ✅ 균일도 측정 (CIE-4 기반)
└── image-engine/                # ⏳ 향후 파이프라인 통합 시
    ├── index.ts                 # Barrel Export
    ├── pipeline.ts              # 파이프라인 오케스트레이터
    ├── cie-1/                   # 이미지 품질
    │   ├── sharpness.ts         # Laplacian variance
    │   ├── exposure.ts          # 히스토그램 분석
    │   └── quality-gate.ts      # 통합 판정
    ├── cie-3/                   # AWB 보정
    │   ├── gray-world.ts
    │   ├── von-kries.ts
    │   ├── skin-mask.ts
    │   └── skin-aware-awb.ts
    └── cie-4/                   # 조명 분석
        ├── cct-analyzer.ts
        ├── zone-analyzer.ts
        ├── shadow-detector.ts
        └── roi-extractor.ts
```

### 5.2 Laplacian Variance 선명도 (CIE1-2)

```typescript
/**
 * Laplacian Variance로 이미지 선명도 측정
 *
 * 원리: 2차 미분 (Laplacian)의 분산이 높을수록 에지가 많음 = 선명
 * 커널: [0, 1, 0; 1, -4, 1; 0, 1, 0]
 *
 * @see docs/principles/image-processing.md#laplacian-variance
 */
function calculateSharpness(imageData: ImageData): number {
  const { width, height, data } = imageData;

  // 그레이스케일 변환
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
  }

  // Laplacian 커널 적용
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian =
        -4 * gray[idx] + gray[idx - 1] + gray[idx + 1] + gray[idx - width] + gray[idx + width];
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  return count > 0 ? sumSq / count : 0;
}
```

### 5.3 신뢰도 전파

```typescript
/**
 * 파이프라인 전체 신뢰도 = 각 단계 신뢰도의 곱
 *
 * 예: CIE-1(0.95) × CIE-2(0.88) × CIE-3(0.85) × CIE-4(0.92) = 0.65
 * 건너뛴 단계는 1.0으로 처리
 */
function calculatePipelineConfidence(stages: { confidence: number; skipped: boolean }[]): number {
  return stages.reduce((acc, stage) => acc * (stage.skipped ? 1.0 : stage.confidence), 1.0);
}
```

---

## 6. 테스트 계획

### 6.1 단위 테스트

| 테스트                           | 대상   | 기대 결과                     |
| -------------------------------- | ------ | ----------------------------- |
| 선명한 이미지 → sharpness > 40   | CIE1-2 | 통과                          |
| 흐린 이미지 → sharpness < 20     | CIE1-2 | 거부 + 재촬영 메시지          |
| 과노출 이미지 → isOverexposed    | CIE1-3 | 경고                          |
| 정면 얼굴 → frontalityScore ≥ 70 | CIE2   | 분석 가능                     |
| 측면 얼굴 → 각도 피드백          | CIE2   | "얼굴을 정면으로 향해 주세요" |
| 얼굴 없음 → Mock Fallback        | CIE2   | 모의 랜드마크 반환            |
| Gray World → R/G/B 균등화        | CIE3-1 | 채널 평균 차이 < 5%           |
| 6존 분석 → 균일도 계산           | CIE4-2 | 존별 밝기 편차 < 20%          |

### 6.2 통합 테스트

```typescript
describe('CIE Pipeline Integration', () => {
  it('전체 파이프라인이 5초 이내 완료', async () => {
    const result = await runCIEPipeline({ image: testImage });
    expect(result.metadata.totalProcessingTime).toBeLessThan(5000);
  });

  it('CIE-3 실패 시 Mock으로 파이프라인 완주', async () => {
    const result = await runCIEPipeline({
      image: testImage,
      options: { useMock: false }, // AWB 실패 시뮬레이션
    });
    expect(result.success).toBe(true);
    expect(result.metadata.usedFallback).toBe(true);
  });

  it('skipAWB 옵션으로 CIE-3 건너뛰기', async () => {
    const result = await runCIEPipeline({
      image: testImage,
      options: { skipAWB: true, skipLighting: true },
    });
    expect(result.metadata.stagesCompleted).toBe(2);
    expect(result.awbCorrection).toBeUndefined();
  });
});
```

### 6.3 성능 테스트

| 시나리오                  | 목표    | 측정 방법           |
| ------------------------- | ------- | ------------------- |
| CIE-1 단독                | < 50ms  | `performance.now()` |
| CIE-2 단독 (모델 로드 후) | < 100ms | 첫 실행 제외        |
| CIE-3 단독                | < 100ms | 1024x1024 기준      |
| CIE-4 단독                | < 80ms  | 1024x1024 기준      |
| 전체 파이프라인           | < 500ms | 모델 캐시된 상태    |

---

## 7. 관련 문서

### 개별 단계 SDD (상세 스펙)

- [SDD-CIE-1-IMAGE-QUALITY](SDD-CIE-1-IMAGE-QUALITY.md) - 이미지 품질 검증 상세
- [SDD-CIE-2-FACE-DETECTION](SDD-CIE-2-FACE-DETECTION.md) - 얼굴 감지 상세
- [SDD-CIE-3-AWB-CORRECTION](SDD-CIE-3-AWB-CORRECTION.md) - 화이트밸런스 보정 상세
- [SDD-CIE-4-LIGHTING-ANALYSIS](SDD-CIE-4-LIGHTING-ANALYSIS.md) - 조명 분석 상세
- [SDD-CIE-P3-DECOMPOSITION](SDD-CIE-P3-DECOMPOSITION.md) - CIE-2/3/4 원자 분해

### ADR

- [ADR-001: Core Image Engine](../adr/ADR-001-core-image-engine.md)
- [ADR-033: 얼굴 감지 라이브러리 선택](../adr/ADR-033-face-detection-library.md)
- [ADR-040: CIE-3 조명 보정](../adr/ADR-040-cie3-lighting-correction.md)
- [ADR-041: CIE-4 조명 분석](../adr/ADR-041-cie4-lighting-analysis.md)

### 원리 문서

- [image-processing.md](../principles/image-processing.md) - Laplacian, CCT, AWB 수학적 기반
- [color-science.md](../principles/color-science.md) - Lab 색공간, 색온도 이론

---

**Author**: Claude Code
