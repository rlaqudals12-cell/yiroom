/**
 * MediaPipe FaceLandmarker 로더
 *
 * @module lib/image-engine/cie-2/mediapipe-loader
 * @description 브라우저 전용 MediaPipe Tasks Vision FaceLandmarker 초기화
 *
 * ## 설계 원칙
 *
 * - 싱글톤: 한 번 로드되면 재사용 (모델 2-4MB, 재다운로드 방지)
 * - 브라우저 전용: SSR/Node.js에서는 null 반환 (mock으로 대체)
 * - 비동기 로드: 초기 페이지 로드에 영향 없음
 * - 에러 안전: 로드 실패 시 null 반환 (호출자가 fallback 처리)
 *
 * @see docs/research/claude-ai-research/CIE-2-R1-얼굴랜드마크.md
 */

import type { MediaPipeFaceResult } from './face-detector';

// ============================================
// 타입
// ============================================

/** FaceLandmarker 인스턴스 (MediaPipe Tasks Vision) */
interface FaceLandmarkerInstance {
  detect: (image: ImageData | HTMLImageElement | HTMLCanvasElement) => FaceLandmarkerDetection;
  close: () => void;
}

/** MediaPipe FaceLandmarker 감지 결과 */
interface FaceLandmarkerDetection {
  faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
}

// ============================================
// 상수
// ============================================

/** MediaPipe CDN 경로 (tasks-vision WASM 번들) */
const MEDIAPIPE_WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

/** FaceLandmarker 모델 경로 */
const FACE_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';

/** 모델 로드 타임아웃 (ms) */
const LOAD_TIMEOUT_MS = 15000;

// ============================================
// 싱글톤 상태
// ============================================

let faceLandmarkerInstance: FaceLandmarkerInstance | null = null;
let loadPromise: Promise<FaceLandmarkerInstance | null> | null = null;
let isLoadFailed = false;

// ============================================
// 환경 감지
// ============================================

/** 브라우저 환경인지 확인 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/** WebGL 2.0 지원 확인 (MediaPipe 필수) */
export function hasWebGL2Support(): boolean {
  if (!isBrowserEnvironment()) return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl !== null;
  } catch {
    return false;
  }
}

/** MediaPipe 사용 가능 여부 (종합 판단) */
export function canUseMediaPipe(): boolean {
  return isBrowserEnvironment() && hasWebGL2Support() && !isLoadFailed;
}

// ============================================
// FaceLandmarker 로드
// ============================================

/**
 * FaceLandmarker 싱글톤 로드
 *
 * - 첫 호출 시 CDN에서 WASM + 모델 다운로드
 * - 이후 캐시된 인스턴스 반환
 * - 브라우저 아닌 환경에서는 null 반환
 * - 로드 실패 시 null + 재시도 차단
 */
export async function loadFaceLandmarker(): Promise<FaceLandmarkerInstance | null> {
  // 이미 로드됨
  if (faceLandmarkerInstance) return faceLandmarkerInstance;

  // 로드 실패 이력 있으면 재시도 안 함
  if (isLoadFailed) return null;

  // 브라우저 아닌 환경
  if (!canUseMediaPipe()) return null;

  // 중복 로드 방지 (concurrent 호출 대응)
  if (loadPromise) return loadPromise;

  loadPromise = doLoadFaceLandmarker();
  const result = await loadPromise;
  loadPromise = null;
  return result;
}

/** 실제 로드 로직 */
async function doLoadFaceLandmarker(): Promise<FaceLandmarkerInstance | null> {
  try {
    // 타임아웃 래핑
    const result = await Promise.race([
      loadFaceLandmarkerInternal(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), LOAD_TIMEOUT_MS)),
    ]);

    if (!result) {
      console.warn('[CIE-2] FaceLandmarker load timed out');
      isLoadFailed = true;
      return null;
    }

    faceLandmarkerInstance = result;
    return result;
  } catch (error) {
    console.warn('[CIE-2] FaceLandmarker load failed:', error);
    isLoadFailed = true;
    return null;
  }
}

/** MediaPipe Tasks Vision 동적 import + 초기화 */
async function loadFaceLandmarkerInternal(): Promise<FaceLandmarkerInstance> {
  // 동적 import (번들 분리)
  const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision');

  // WASM 파일셋 초기화
  const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_CDN);

  // FaceLandmarker 생성
  const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: FACE_LANDMARKER_MODEL,
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });

  return landmarker as unknown as FaceLandmarkerInstance;
}

// ============================================
// 감지 실행
// ============================================

/**
 * 이미지에서 얼굴 랜드마크 감지
 *
 * @param imageSource - HTMLImageElement, HTMLCanvasElement, 또는 ImageData
 * @returns MediaPipeFaceResult[] — CIE-2 프로세서에 전달 가능한 형태
 * @returns null — MediaPipe 사용 불가 또는 감지 실패
 */
export async function detectFaceLandmarks(
  imageSource: HTMLImageElement | HTMLCanvasElement | ImageData
): Promise<MediaPipeFaceResult[] | null> {
  const landmarker = await loadFaceLandmarker();
  if (!landmarker) return null;

  try {
    const detection = landmarker.detect(imageSource);

    if (!detection.faceLandmarks || detection.faceLandmarks.length === 0) {
      return [];
    }

    // MediaPipe FaceLandmarker → CIE-2 형식 변환
    return detection.faceLandmarks.map((landmarks) => {
      // 바운딩 박스 계산 (정규화 좌표 0-1)
      let xMin = 1,
        yMin = 1,
        xMax = 0,
        yMax = 0;
      for (const lm of landmarks) {
        if (lm.x < xMin) xMin = lm.x;
        if (lm.y < yMin) yMin = lm.y;
        if (lm.x > xMax) xMax = lm.x;
        if (lm.y > yMax) yMax = lm.y;
      }

      const result: MediaPipeFaceResult = {
        landmarks: landmarks.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        })),
        boundingBox: {
          xMin,
          yMin,
          width: xMax - xMin,
          height: yMax - yMin,
        },
      };

      return result;
    });
  } catch (error) {
    console.warn('[CIE-2] Face detection failed:', error);
    return null;
  }
}

// ============================================
// 정리
// ============================================

/** FaceLandmarker 리소스 해제 */
export function disposeFaceLandmarker(): void {
  if (faceLandmarkerInstance) {
    try {
      faceLandmarkerInstance.close();
    } catch {
      // 이미 해제됨
    }
    faceLandmarkerInstance = null;
  }
  loadPromise = null;
  isLoadFailed = false;
}
