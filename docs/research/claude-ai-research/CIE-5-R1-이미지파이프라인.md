# 이미지 처리 파이프라인

> **ID**: CIE-PIPELINE
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/image/

---

## 1. 현재 구현 분석

### 현재 상태

```typescript
// apps/web에서 사용 중인 이미지 처리
✅ Canvas 기반 리사이징
✅ Base64 인코딩/디코딩
✅ 기본 EXIF 회전 보정
✅ next/image 최적화 (출력)

// 개선 필요 항목
❌ WebGL 기반 고성능 처리
❌ 이미지 품질 검증 (sharpness, lighting)
❌ 실시간 미리보기 최적화
❌ 병렬 처리 / 워커
❌ 점진적 향상 (Progressive Enhancement)
```

---

## 2. 파이프라인 아키텍처

### 2.1 3단계 파이프라인

```
┌─────────────────────────────────────────────────────────────┐
│                    이미지 처리 파이프라인                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [입력]                                                     │
│    └── File/Blob/Base64                                    │
│              ↓                                              │
│  [Stage 1: 전처리 - 브라우저]                               │
│    ├── EXIF 회전 보정                                       │
│    ├── 리사이징 (Canvas/WebGL)                              │
│    ├── 포맷 변환 (JPEG/WebP)                                │
│    └── 품질 검증 (sharpness, lighting)                      │
│              ↓                                              │
│  [Stage 2: 업로드 - Edge]                                   │
│    ├── 압축 최적화                                          │
│    └── CDN 캐싱                                             │
│              ↓                                              │
│  [Stage 3: AI 분석 전 - Server]                             │
│    ├── 추가 전처리 (Sharp)                                  │
│    └── AI 최적화 포맷                                       │
│              ↓                                              │
│  [출력]                                                     │
│    └── Gemini API Ready                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 브라우저 이미지 처리

### 3.1 Canvas 기본 처리

```typescript
// lib/image/canvas-processor.ts
export interface ProcessOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'webp';
}

export async function processWithCanvas(
  file: File,
  options: ProcessOptions
): Promise<{ base64: string; metadata: ImageMetadata }> {
  const { maxWidth, maxHeight, quality, format } = options;

  // 이미지 로드
  const bitmap = await createImageBitmap(file);

  // 리사이징 계산
  const scale = Math.min(
    maxWidth / bitmap.width,
    maxHeight / bitmap.height,
    1 // 원본보다 커지지 않음
  );

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  // Canvas 렌더링
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;

  // 고품질 리사이징
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Blob 변환
  const blob = await canvas.convertToBlob({
    type: `image/${format}`,
    quality,
  });

  // Base64 변환
  const base64 = await blobToBase64(blob);

  return {
    base64,
    metadata: {
      width,
      height,
      format,
      size: blob.size,
      originalSize: file.size,
      compressionRatio: (1 - blob.size / file.size) * 100,
    },
  };
}
```

### 3.2 WebGL 고성능 처리

```typescript
// lib/image/webgl-processor.ts
export class WebGLImageProcessor {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private framebuffer: WebGLFramebuffer;

  constructor() {
    const canvas = document.createElement('canvas');
    this.gl = canvas.getContext('webgl')!;
    this.initShaders();
  }

  private initShaders() {
    // Vertex Shader
    const vertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
      }
    `;

    // Fragment Shader (기본)
    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_image;
      varying vec2 v_texCoord;
      void main() {
        gl_FragColor = texture2D(u_image, v_texCoord);
      }
    `;

    // 프로그램 컴파일
    this.program = this.createProgram(vertexShader, fragmentShader);
  }

  // 색상 보정 셰이더
  applyColorCorrection(temperature: number, brightness: number): void {
    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_image;
      uniform float u_temperature;
      uniform float u_brightness;
      varying vec2 v_texCoord;

      void main() {
        vec4 color = texture2D(u_image, v_texCoord);

        // 색온도 보정
        color.r += u_temperature * 0.1;
        color.b -= u_temperature * 0.1;

        // 밝기 조정
        color.rgb *= u_brightness;

        gl_FragColor = color;
      }
    `;

    // 새 프로그램으로 렌더링
  }

  // 다단계 처리 파이프라인
  async processPipeline(
    image: ImageBitmap,
    steps: ProcessingStep[]
  ): Promise<ImageData> {
    // Framebuffer 기반 다단계 처리
    // Image → [Blur] → Tex1 → [Sharpen] → Tex2 → [Color] → Output

    let currentTexture = this.createTexture(image);

    for (const step of steps) {
      const program = this.getShaderProgram(step.type);
      this.gl.useProgram(program);

      // 입력 텍스처 바인딩
      this.gl.bindTexture(this.gl.TEXTURE_2D, currentTexture);

      // Framebuffer에 렌더링
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

      // 출력을 다음 입력으로
      currentTexture = this.getFramebufferTexture();
    }

    return this.readPixels();
  }
}

// 사용
const processor = new WebGLImageProcessor();
const result = await processor.processPipeline(image, [
  { type: 'resize', params: { width: 1024, height: 1024 } },
  { type: 'colorCorrect', params: { temperature: 0, brightness: 1 } },
  { type: 'sharpen', params: { amount: 0.5 } },
]);
```

### 3.3 Web Worker 병렬 처리

```typescript
// lib/image/worker-processor.ts
export function createImageWorker(): Worker {
  const workerCode = `
    self.onmessage = async (e) => {
      const { imageData, options } = e.data;

      // OffscreenCanvas 사용 (Worker에서 가능)
      const canvas = new OffscreenCanvas(options.width, options.height);
      const ctx = canvas.getContext('2d');

      // 이미지 처리
      const bitmap = await createImageBitmap(imageData);
      ctx.drawImage(bitmap, 0, 0, options.width, options.height);

      // 결과 전송
      const blob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: options.quality
      });

      self.postMessage({ blob });
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

// 사용
export async function processInWorker(
  file: File,
  options: ProcessOptions
): Promise<Blob> {
  const worker = createImageWorker();

  return new Promise((resolve) => {
    worker.onmessage = (e) => {
      resolve(e.data.blob);
      worker.terminate();
    };

    worker.postMessage({ imageData: file, options });
  });
}
```

---

## 4. 이미지 품질 검증

### 4.1 Sharpness 측정 (Laplacian Variance)

```typescript
// lib/image/quality/sharpness.ts
export function measureSharpness(imageData: ImageData): number {
  const { data, width, height } = imageData;

  // 그레이스케일 변환
  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // Laplacian 커널 적용
  // [ 0  1  0 ]
  // [ 1 -4  1 ]
  // [ 0  1  0 ]
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian =
        gray[idx - width] +     // 위
        gray[idx - 1] +         // 왼쪽
        gray[idx + 1] +         // 오른쪽
        gray[idx + width] -     // 아래
        4 * gray[idx];          // 중앙

      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  // 분산 계산 (높을수록 선명)
  const variance = (sumSq / count) - Math.pow(sum / count, 2);

  return Math.min(100, Math.max(0, variance / 10)); // 0-100 스케일
}

// 기준값
export const SHARPNESS_THRESHOLDS = {
  excellent: 60,  // 매우 선명
  good: 40,       // 양호
  acceptable: 25, // 수용 가능
  poor: 0,        // 흐림
};
```

### 4.2 조명 분석

```typescript
// lib/image/quality/lighting.ts
export interface LightingAnalysis {
  brightness: number;      // 0-100
  contrast: number;        // 0-100
  evenness: number;        // 0-100 (균일도)
  colorTemperature: number; // 2700K-6500K 추정
  recommendation: string;
}

export function analyzeLighting(imageData: ImageData): LightingAnalysis {
  const { data, width, height } = imageData;

  // 밝기 계산
  let totalBrightness = 0;
  const brightnesses: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    brightnesses.push(brightness);
    totalBrightness += brightness;
  }

  const avgBrightness = totalBrightness / brightnesses.length;

  // 대비 계산 (표준편차)
  const variance = brightnesses.reduce(
    (sum, b) => sum + Math.pow(b - avgBrightness, 2),
    0
  ) / brightnesses.length;
  const stdDev = Math.sqrt(variance);

  // 균일도 계산 (영역별 밝기 차이)
  const regions = divideIntoRegions(brightnesses, width, height, 3, 3);
  const regionBrightnesses = regions.map(r =>
    r.reduce((a, b) => a + b, 0) / r.length
  );
  const maxDiff = Math.max(...regionBrightnesses) - Math.min(...regionBrightnesses);
  const evenness = Math.max(0, 100 - maxDiff);

  // 색온도 추정 (R/B 비율)
  let rSum = 0, bSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    bSum += data[i + 2];
  }
  const rbRatio = rSum / bSum;
  const colorTemp = estimateColorTemp(rbRatio);

  // 권장 사항
  const recommendation = generateLightingRecommendation({
    brightness: avgBrightness / 255 * 100,
    contrast: stdDev / 128 * 100,
    evenness,
    colorTemp,
  });

  return {
    brightness: avgBrightness / 255 * 100,
    contrast: Math.min(100, stdDev / 128 * 100),
    evenness,
    colorTemperature: colorTemp,
    recommendation,
  };
}

function generateLightingRecommendation(analysis: Partial<LightingAnalysis>): string {
  const issues: string[] = [];

  if (analysis.brightness! < 30) issues.push('조명이 어둡습니다');
  if (analysis.brightness! > 80) issues.push('조명이 너무 밝습니다');
  if (analysis.contrast! < 20) issues.push('대비가 낮습니다');
  if (analysis.evenness! < 50) issues.push('조명이 균일하지 않습니다');
  if (analysis.colorTemperature! < 4000) issues.push('따뜻한 조명입니다 (자연광 권장)');
  if (analysis.colorTemperature! > 6000) issues.push('차가운 조명입니다');

  if (issues.length === 0) return '조명 상태가 양호합니다';
  return issues.join('. ');
}
```

### 4.3 얼굴 감지

```typescript
// lib/image/quality/face-detection.ts
export interface FaceDetectionResult {
  detected: boolean;
  count: number;
  mainFace?: {
    box: { x: number; y: number; width: number; height: number };
    confidence: number;
    landmarks?: FaceLandmarks;
  };
  recommendation?: string;
}

// Web API Face Detection (Chrome 86+)
export async function detectFaces(
  imageElement: HTMLImageElement
): Promise<FaceDetectionResult> {
  // FaceDetector API 지원 확인
  if (!('FaceDetector' in window)) {
    return { detected: false, count: 0, recommendation: 'Face detection not supported' };
  }

  const faceDetector = new (window as any).FaceDetector({
    maxDetectedFaces: 5,
    fastMode: false,
  });

  const faces = await faceDetector.detect(imageElement);

  if (faces.length === 0) {
    return {
      detected: false,
      count: 0,
      recommendation: '얼굴이 감지되지 않았습니다. 정면을 바라봐주세요.',
    };
  }

  // 가장 큰 얼굴 선택
  const mainFace = faces.reduce((a, b) =>
    a.boundingBox.width * a.boundingBox.height >
    b.boundingBox.width * b.boundingBox.height ? a : b
  );

  // 얼굴 위치 검증
  const recommendation = validateFacePosition(mainFace, imageElement);

  return {
    detected: true,
    count: faces.length,
    mainFace: {
      box: {
        x: mainFace.boundingBox.x,
        y: mainFace.boundingBox.y,
        width: mainFace.boundingBox.width,
        height: mainFace.boundingBox.height,
      },
      confidence: mainFace.boundingBox.width > 100 ? 0.9 : 0.7,
      landmarks: mainFace.landmarks,
    },
    recommendation,
  };
}

function validateFacePosition(face: any, image: HTMLImageElement): string | undefined {
  const box = face.boundingBox;
  const imgWidth = image.width;
  const imgHeight = image.height;

  // 중앙 위치 검증
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  if (centerX < imgWidth * 0.3 || centerX > imgWidth * 0.7) {
    return '얼굴을 화면 중앙에 위치시켜주세요.';
  }

  // 크기 검증 (너무 작거나 큼)
  const faceRatio = (box.width * box.height) / (imgWidth * imgHeight);
  if (faceRatio < 0.1) {
    return '얼굴이 너무 작습니다. 카메라에 가까이 다가가주세요.';
  }
  if (faceRatio > 0.6) {
    return '얼굴이 너무 큽니다. 카메라에서 조금 떨어져주세요.';
  }

  return undefined;
}
```

---

## 5. 서버 사이드 처리 (Sharp)

### 5.1 Sharp 최적화

```typescript
// lib/image/server/sharp-processor.ts
import sharp from 'sharp';

export interface ServerProcessOptions {
  width?: number;
  height?: number;
  format?: 'jpeg' | 'webp' | 'avif';
  quality?: number;
  sharpen?: boolean;
}

export async function processWithSharp(
  buffer: Buffer,
  options: ServerProcessOptions
): Promise<{ buffer: Buffer; metadata: sharp.Metadata }> {
  const {
    width = 1024,
    height = 1024,
    format = 'jpeg',
    quality = 85,
    sharpen = true,
  } = options;

  let pipeline = sharp(buffer)
    .rotate() // EXIF 기반 자동 회전
    .resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    });

  // 포맷별 최적화
  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({
      quality,
      mozjpeg: true, // mozjpeg 최적화
    });
  } else if (format === 'webp') {
    pipeline = pipeline.webp({
      quality,
      effort: 6,
    });
  } else if (format === 'avif') {
    pipeline = pipeline.avif({
      quality,
      effort: 6,
    });
  }

  // 선명도 향상 (AI 분석용)
  if (sharpen) {
    pipeline = pipeline.sharpen({
      sigma: 1,
      m1: 0.5,
      m2: 0.5,
    });
  }

  const outputBuffer = await pipeline.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();

  return { buffer: outputBuffer, metadata };
}
```

### 5.2 분석 타입별 전처리

```typescript
// lib/image/server/analysis-preprocess.ts
import sharp from 'sharp';

export const ANALYSIS_PRESETS = {
  'personal-color': {
    width: 512,
    height: 512,
    format: 'jpeg' as const,
    quality: 90,
    // 색상 정확도가 중요
    normalize: false,
  },
  skin: {
    width: 1024,
    height: 1024,
    format: 'jpeg' as const,
    quality: 90,
    // 디테일이 중요
    sharpen: true,
  },
  body: {
    width: 768,
    height: 1024,
    format: 'jpeg' as const,
    quality: 85,
    // 전신 비율이 중요
  },
  posture: {
    width: 768,
    height: 1024,
    format: 'jpeg' as const,
    quality: 85,
    // 자세/라인이 중요
    sharpen: true,
  },
};

export async function preprocessForAnalysis(
  buffer: Buffer,
  analysisType: keyof typeof ANALYSIS_PRESETS
): Promise<Buffer> {
  const preset = ANALYSIS_PRESETS[analysisType];

  let pipeline = sharp(buffer)
    .rotate()
    .resize(preset.width, preset.height, {
      fit: 'inside',
      withoutEnlargement: true,
    });

  if (preset.format === 'jpeg') {
    pipeline = pipeline.jpeg({
      quality: preset.quality,
      mozjpeg: true,
    });
  }

  if (preset.sharpen) {
    pipeline = pipeline.sharpen();
  }

  return pipeline.toBuffer();
}
```

---

## 6. 통합 파이프라인

### 6.1 클라이언트-서버 통합

```typescript
// lib/image/pipeline.ts
import { processWithCanvas } from './canvas-processor';
import { measureSharpness, SHARPNESS_THRESHOLDS } from './quality/sharpness';
import { analyzeLighting } from './quality/lighting';
import { detectFaces } from './quality/face-detection';

export interface PipelineResult {
  processedImage: string; // base64
  quality: {
    sharpness: number;
    lighting: LightingAnalysis;
    face: FaceDetectionResult;
    overallScore: number;
    passed: boolean;
    issues: string[];
  };
  metadata: ImageMetadata;
}

export async function runImagePipeline(
  file: File,
  analysisType: string
): Promise<PipelineResult> {
  // 1. 기본 전처리
  const preset = ANALYSIS_PRESETS[analysisType] || ANALYSIS_PRESETS.skin;
  const { base64, metadata } = await processWithCanvas(file, {
    maxWidth: preset.width,
    maxHeight: preset.height,
    quality: preset.quality / 100,
    format: 'jpeg',
  });

  // 2. 품질 검사
  const imageElement = await loadImageElement(base64);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  ctx.drawImage(imageElement, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const sharpness = measureSharpness(imageData);
  const lighting = analyzeLighting(imageData);
  const face = await detectFaces(imageElement);

  // 3. 종합 점수
  const issues: string[] = [];
  let score = 100;

  if (sharpness < SHARPNESS_THRESHOLDS.acceptable) {
    issues.push('이미지가 흐립니다');
    score -= 30;
  }
  if (lighting.brightness < 30 || lighting.brightness > 80) {
    issues.push(lighting.recommendation);
    score -= 20;
  }
  if (!face.detected) {
    issues.push(face.recommendation || '얼굴이 감지되지 않았습니다');
    score -= 40;
  }

  return {
    processedImage: base64,
    quality: {
      sharpness,
      lighting,
      face,
      overallScore: Math.max(0, score),
      passed: score >= 60,
      issues,
    },
    metadata,
  };
}
```

---

## 7. 성능 비교

| 방식 | 처리 시간 | 메모리 | GPU 활용 | 추천 용도 |
|------|----------|--------|---------|----------|
| **Canvas** | ~50ms | 중간 | 일부 | 기본 처리 |
| **WebGL** | ~20ms | 낮음 | 전체 | 실시간 필터 |
| **Web Worker** | ~60ms | 별도 | 없음 | 블로킹 방지 |
| **Sharp (서버)** | ~30ms | 최적화 | - | 최종 처리 |

---

## 8. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] Canvas 기반 리사이징 최적화
- [ ] Sharpness 측정 구현
- [ ] 조명 분석 구현
- [ ] 얼굴 감지 통합

### 단기 적용 (P1)

- [ ] WebGL 프로세서 구현
- [ ] Web Worker 병렬 처리
- [ ] Sharp 서버 전처리

### 장기 적용 (P2)

- [ ] 실시간 미리보기 (WebGL)
- [ ] 자동 보정 제안
- [ ] AVIF/WebP 지원

---

## 9. 참고 자료

- [WebGL Image Processing](https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Canvas vs WebGL Performance](https://digitaladblog.com/2025/05/21/comparing-canvas-vs-webgl-for-javascript-chart-performance/)

---

**Version**: 1.0 | **Priority**: P0 Critical
