# CIE-2-R1: 얼굴 랜드마크 라이브러리 비교 분석

## 1. 핵심 요약

퍼스널 컬러 분석을 위한 얼굴 랜드마크 라이브러리 선택에서 **@mediapipe/tasks-vision (Face Landmarker)**을 권장한다. MediaPipe는 **468개 3D 랜드마크**로 눈, 볼, 입술 영역의 정밀한 색상 샘플링이 가능하며, 모바일에서 **30+ FPS** 실시간 처리가 가능하다. 반면 face-api.js는 **2020년 이후 개발이 중단**되어 장기 프로젝트에 부적합하다. 단, iOS Safari에서는 두 라이브러리 모두 심각한 제한이 있어 네이티브 앱 또는 폴백 전략이 필요하다.

---

## 2. 상세 내용

### 2.1 성능 벤치마크 비교

| 항목 | face-api.js | @mediapipe/face_mesh |
|------|-------------|---------------------|
| **번들 크기 (core)** | ~200 KB (minified) | ~4-6 MB (.task 번들) |
| **번들 크기 (with deps)** | ~1.26 MB (TFJS 포함) | ~17 MB (npm 전체) |
| **모델 크기 (최소)** | 270 KB (Tiny + 68pt) | ~2 MB (BlazeFace + Mesh) |
| **모델 크기 (표준)** | 540 KB ~ 5.75 MB | ~4-6 MB (통합 번들) |
| **초기 로딩** | ~10초 (GPU 웜업 포함) | 2-5초 (브라우저) |
| **추론 속도 (데스크톱)** | 1-3 FPS (SSD) | 30-87 FPS |
| **추론 속도 (모바일)** | 0.03-0.1 FPS | **30-100+ FPS** |
| **메모리 사용량** | 메모리 누수 보고됨 | 경량 설계, 50-150 MB |
| **랜드마크 수** | 68개 (2D) | **468개 (3D)** |

face-api.js의 번들 크기가 더 작지만, 실제 추론 속도는 MediaPipe가 **10-30배 빠르다**. face-api.js의 SSD MobileNet V1은 고정확도이나 ~1 FPS로 실시간 처리가 불가능하며, Tiny Face Detector는 빠르지만 정확도가 낮다.

### 2.2 정확도 비교

| 항목 | face-api.js | @mediapipe/face_mesh |
|------|-------------|---------------------|
| **벤치마크 정확도** | LFW 99.38% (인식) | **NME 3.12 (300W)** |
| **랜드마크 정밀도** | 픽셀 오차 미공개 | State-of-the-art |
| **저조도 환경** | 감지 실패 가능 | 비교적 안정적 |
| **피부톤 편향** | 학습 데이터 편향 가능 | 학습 데이터 편향 가능 |
| **안경 착용** | 표정 인식 저하 | 기본 처리 가능 |
| **마스크 착용** | 감지 실패 높음 | 성능 저하 |
| **얼굴 기울기 >30°** | 정확도 크게 저하 | 성능 저하 발생 |

두 라이브러리 모두 다양한 피부톤에서의 공식 벤치마크가 부재하다. 퍼스널 컬러 분석 시 **다양한 피부톤 테스트가 필수**적이며, 조명 보정 알고리즘을 별도로 구현해야 한다.

### 2.3 브라우저 호환성

| 브라우저 | face-api.js | @mediapipe/face_mesh |
|----------|-------------|---------------------|
| **Chrome 데스크톱** | ✅ 완전 지원 | ✅ 공식 지원 |
| **Chrome Android** | ⚠️ 느림 (20-30초) | ✅ 실시간 가능 |
| **Safari macOS** | ⚠️ WebGL 2.0 불완전 | ⚠️ Chrome보다 느림 |
| **Safari iOS** | ❌ 심각한 제한 | ⚠️ 제한적 |
| **Firefox** | ⚠️ v83+ 성능 이슈 | ❌ 공식 미지원 |
| **WebGL 요구** | 1.0/2.0 | 2.0 권장 |
| **WASM 백엔드** | ✅ tfjs-backend-wasm | ✅ 네이티브 지원 |

**iOS Safari 공통 이슈**: WebGL 텍스처 크기 제한(4096px), context lost 오류, createImageBitmap 미지원. 두 라이브러리 모두 iOS에서 안정적인 동작을 보장하지 못한다.

### 2.4 랜드마크 수 Trade-off 분석

퍼스널 컬러 분석에는 **눈(홍채/공막), 볼, 입술, 이마** 영역의 색상 샘플링이 필요하다. 각 라이브러리의 랜드마크 구성:

**face-api.js (68점)**
- jawOutline, nose, mouth, leftEye, rightEye, leftEyeBrow, rightEyeBrow
- 볼 영역 직접 포인트 없음 → 턱선과 눈 사이 보간 필요
- 홍채 포인트 없음 → 눈 영역 중심점 추정 필요

**MediaPipe (468점)**
- 얼굴 전체 메시 포함 (볼, 이마 영역 직접 접근 가능)
- `refineLandmarks=true` 시 478점 (홍채 10점 추가)
- 3D 좌표로 얼굴 기울기 보정 가능

| 분석 요소 | 68점 충분 여부 | 468점 이점 |
|----------|--------------|-----------|
| 눈 색상 | ⚠️ 추정 필요 | ✅ 홍채 직접 접근 |
| 볼 색상 | ⚠️ 보간 필요 | ✅ 메시 직접 접근 |
| 입술 색상 | ✅ 충분 | ✅ 더 정밀 |
| 이마 색상 | ❌ 포인트 없음 | ✅ 메시 직접 접근 |
| 조명 보정 | ❌ 불가 | ⚠️ 3D로 일부 가능 |

**결론**: 퍼스널 컬러 분석에는 **최소 볼과 이마 영역 접근**이 필요하므로 468점 랜드마크가 구현 용이성 면에서 유리하다.

### 2.5 개발 편의성 및 유지보수

| 항목 | face-api.js | @mediapipe/face_mesh |
|------|-------------|---------------------|
| **API 직관성** | ✅ 체이닝 API | ⚠️ 콜백 기반 |
| **TypeScript** | ✅ 네이티브 | ⚠️ 제한적 |
| **문서화** | ✅ 상세 (2020년) | ✅ Google 공식 |
| **GitHub Stars** | 17.6k | 32.7k (MediaPipe) |
| **npm 다운로드/주** | ~44,000 | ~18,000-33,000 |
| **마지막 업데이트** | **2020년 3월 ❌** | 2025년 활발 |
| **이슈 대응** | ❌ 없음 | ✅ Google 팀 |
| **라이선스** | MIT | Apache 2.0 |
| **특허 보호** | ❌ 없음 | ✅ 명시적 부여 |

**face-api.js는 5년간 업데이트가 없어 신규 프로젝트에 부적합**하다. 대안으로 `@vladmandic/face-api` 포크가 있으나 2025년 2월 아카이브되었다. MediaPipe의 `@mediapipe/face_mesh` npm 패키지도 Legacy 상태이며, **`@mediapipe/tasks-vision`의 Face Landmarker API로 마이그레이션**해야 한다.

---

## 3. 구현 시 필수 사항

- [ ] **라이브러리 선택**: `@mediapipe/tasks-vision` (Face Landmarker) 사용
- [ ] **iOS 폴백 전략**: iOS Safari에서 WebGL 실패 시 정적 이미지 분석 또는 네이티브 앱 유도
- [ ] **브라우저 감지**: Chrome 우선 지원, Firefox 사용자에게 Chrome 권장 안내
- [ ] **모델 CDN 호스팅**: `face_landmarker.task` 파일을 자체 CDN에 호스팅하여 로딩 시간 최적화
- [ ] **웜업 처리**: 첫 추론 전 더미 이미지로 GPU 초기화 (2-5초 대기 시간 사용자에게 표시)
- [ ] **피부톤 테스트**: 다양한 피부톤(Fitzpatrick Scale I-VI)에서 정확도 검증
- [ ] **조명 보정**: 화이트밸런스 및 노출 보정 알고리즘 구현 (3D 랜드마크 활용)
- [ ] **메모리 관리**: 연속 프레임 처리 시 텐서/리소스 명시적 해제
- [ ] **inputSize 조정**: 모바일에서 입력 크기를 256x256으로 제한하여 성능 확보
- [ ] **에러 핸들링**: WebGL context lost 이벤트 감지 및 자동 복구 로직

---

## 4. 코드 예시

```typescript
// @mediapipe/tasks-vision Face Landmarker 사용 예시
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

interface PersonalColorRegions {
  leftCheek: { x: number; y: number }[];
  rightCheek: { x: number; y: number }[];
  forehead: { x: number; y: number }[];
  lips: { x: number; y: number }[];
  leftIris: { x: number; y: number }[];
  rightIris: { x: number; y: number }[];
}

// 퍼스널 컬러 분석용 주요 랜드마크 인덱스
const LANDMARK_INDICES = {
  LEFT_CHEEK: [50, 101, 118, 119, 120, 100],
  RIGHT_CHEEK: [280, 330, 347, 348, 349, 329],
  FOREHEAD: [10, 67, 69, 104, 108, 151, 297, 299, 333, 337],
  UPPER_LIP: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  LOWER_LIP: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
  LEFT_IRIS: [468, 469, 470, 471, 472],   // refineLandmarks=true 필요
  RIGHT_IRIS: [473, 474, 475, 476, 477],  // refineLandmarks=true 필요
};

class FaceLandmarkDetector {
  private faceLandmarker: FaceLandmarker | null = null;

  async initialize(): Promise<void> {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "IMAGE", // 또는 "VIDEO" for 실시간
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: true, // 3D 변환 행렬
    });

    // GPU 웜업 (첫 추론 지연 방지)
    const dummyCanvas = document.createElement("canvas");
    dummyCanvas.width = dummyCanvas.height = 256;
    await this.faceLandmarker.detect(dummyCanvas);
  }

  detectLandmarks(image: HTMLImageElement | HTMLVideoElement): PersonalColorRegions | null {
    if (!this.faceLandmarker) return null;

    const result = this.faceLandmarker.detect(image);
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;

    const landmarks = result.faceLandmarks[0];
    const width = image instanceof HTMLVideoElement ? image.videoWidth : image.width;
    const height = image instanceof HTMLVideoElement ? image.videoHeight : image.height;

    const extractPoints = (indices: number[]) =>
      indices.map((i) => ({
        x: landmarks[i].x * width,
        y: landmarks[i].y * height,
      }));

    return {
      leftCheek: extractPoints(LANDMARK_INDICES.LEFT_CHEEK),
      rightCheek: extractPoints(LANDMARK_INDICES.RIGHT_CHEEK),
      forehead: extractPoints(LANDMARK_INDICES.FOREHEAD),
      lips: [...extractPoints(LANDMARK_INDICES.UPPER_LIP), ...extractPoints(LANDMARK_INDICES.LOWER_LIP)],
      leftIris: extractPoints(LANDMARK_INDICES.LEFT_IRIS),
      rightIris: extractPoints(LANDMARK_INDICES.RIGHT_IRIS),
    };
  }

  // 특정 영역의 평균 색상 추출
  extractRegionColor(
    imageData: ImageData,
    points: { x: number; y: number }[]
  ): { r: number; g: number; b: number } {
    let totalR = 0, totalG = 0, totalB = 0, count = 0;

    // Convex hull 내부 픽셀 샘플링 (간소화된 버전)
    for (const point of points) {
      const x = Math.round(point.x);
      const y = Math.round(point.y);
      if (x >= 0 && x < imageData.width && y >= 0 && y < imageData.height) {
        const idx = (y * imageData.width + x) * 4;
        totalR += imageData.data[idx];
        totalG += imageData.data[idx + 1];
        totalB += imageData.data[idx + 2];
        count++;
      }
    }

    return count > 0
      ? { r: totalR / count, g: totalG / count, b: totalB / count }
      : { r: 0, g: 0, b: 0 };
  }

  dispose(): void {
    this.faceLandmarker?.close();
  }
}

// 사용 예시
async function analyzePersonalColor(imageElement: HTMLImageElement) {
  const detector = new FaceLandmarkDetector();
  await detector.initialize();

  const regions = detector.detectLandmarks(imageElement);
  if (!regions) {
    console.error("얼굴을 감지할 수 없습니다.");
    return;
  }

  // Canvas에서 ImageData 추출
  const canvas = document.createElement("canvas");
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imageElement, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 각 영역 색상 추출
  const skinTone = {
    cheek: detector.extractRegionColor(imageData, [...regions.leftCheek, ...regions.rightCheek]),
    forehead: detector.extractRegionColor(imageData, regions.forehead),
  };

  const features = {
    lips: detector.extractRegionColor(imageData, regions.lips),
    iris: detector.extractRegionColor(imageData, [...regions.leftIris, ...regions.rightIris]),
  };

  detector.dispose();

  return { skinTone, features };
}
```

---

## 5. 최종 권장사항

**Yiroom 퍼스널 컬러 분석 기능에는 `@mediapipe/tasks-vision`의 Face Landmarker를 권장**한다. 핵심 이유:

1. **정밀한 영역 접근**: 468개 3D 랜드마크로 볼, 이마, 홍채 영역 직접 샘플링 가능
2. **모바일 실시간 처리**: 30+ FPS로 사용자 경험 향상
3. **활발한 유지보수**: Google이 지속적으로 업데이트 중
4. **Apache 2.0 특허 보호**: 상업적 사용에 안전

**주의사항**: iOS Safari 지원이 불안정하므로, PWA보다는 **웹뷰 기반 하이브리드 앱** 또는 **네이티브 iOS 구현**(Vision Framework)을 병행 고려해야 한다. Chrome Android와 데스크톱 Chrome에서는 안정적인 성능을 기대할 수 있다.