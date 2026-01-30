/**
 * C-2: MediaPipe Pose 33 랜드마크 검출
 *
 * @module lib/analysis/body-v2/pose-detector
 * @description MediaPipe Pose Landmarker를 사용한 33개 신체 랜드마크 검출
 * @see {@link docs/principles/body-mechanics.md} 체형 역학 원리
 */

import type { Landmark33, PoseDetectionResult } from './types';
import { POSE_LANDMARK_INDEX } from './types';

// =============================================================================
// MediaPipe Pose CDN 설정
// =============================================================================

const MEDIAPIPE_POSE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose';
const MEDIAPIPE_VERSION = '0.5.1675469404';

// =============================================================================
// MediaPipe Pose 타입 정의 (런타임 로드)
// =============================================================================

interface MediaPipePoseOptions {
  modelComplexity: 0 | 1 | 2;
  smoothLandmarks: boolean;
  enableSegmentation: boolean;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
}

interface MediaPipePoseResults {
  poseLandmarks?: Array<{ x: number; y: number; z: number; visibility: number }>;
  image: HTMLCanvasElement;
}

interface MediaPipePose {
  setOptions: (options: Partial<MediaPipePoseOptions>) => void;
  onResults: (callback: (results: MediaPipePoseResults) => void) => void;
  send: (input: { image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement }) => Promise<void>;
  close: () => void;
}

// =============================================================================
// 전역 상태
// =============================================================================

let poseInstance: MediaPipePose | null = null;
let loadPromise: Promise<MediaPipePose> | null = null;

// =============================================================================
// 내부 함수
// =============================================================================

/**
 * MediaPipe Pose 스크립트 로드
 */
async function loadPoseScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('[Pose] 브라우저 환경에서만 사용 가능'));
      return;
    }

    // 이미 로드된 경우
    if ((window as Window & { Pose?: unknown }).Pose) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `${MEDIAPIPE_POSE_CDN}@${MEDIAPIPE_VERSION}/pose.js`;
    script.crossOrigin = 'anonymous';

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('[Pose] CDN 로드 실패'));

    document.head.appendChild(script);
  });
}

/**
 * 이미지 엘리먼트 생성
 */
async function createImageElement(imageBase64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('[Pose] 이미지 로드 실패'));
    img.src = imageBase64;
  });
}

/**
 * 랜드마크 가시성 평균 계산
 */
function calculateOverallVisibility(landmarks: Landmark33[]): number {
  if (landmarks.length === 0) return 0;

  const totalVisibility = landmarks.reduce((sum, lm) => sum + lm.visibility, 0);
  return totalVisibility / landmarks.length;
}

/**
 * 랜드마크 변환 (MediaPipe -> 내부 타입)
 */
function transformLandmarks(
  poseLandmarks: Array<{ x: number; y: number; z: number; visibility: number }>
): Landmark33[] {
  return poseLandmarks.map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
    visibility: lm.visibility ?? 0,
  }));
}

// =============================================================================
// 공개 API
// =============================================================================

/**
 * MediaPipe Pose 초기화
 *
 * @description CDN에서 MediaPipe Pose를 동적 로드하고 초기화
 * @returns 초기화된 Pose 인스턴스
 */
export async function initPose(): Promise<MediaPipePose> {
  if (typeof window === 'undefined') {
    throw new Error('[Pose] 브라우저 환경에서만 사용 가능');
  }

  if (poseInstance) {
    return poseInstance;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      await loadPoseScript();

      const PoseClass = (
        window as unknown as {
          Pose?: new (config: { locateFile: (file: string) => string }) => MediaPipePose;
        }
      ).Pose;

      if (!PoseClass) {
        throw new Error('[Pose] Pose 클래스를 찾을 수 없음');
      }

      const pose = new PoseClass({
        locateFile: (file: string) => `${MEDIAPIPE_POSE_CDN}@${MEDIAPIPE_VERSION}/${file}`,
      });

      // 기본 옵션 설정: 중간 복잡도, 부드러운 랜드마크
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseInstance = pose;
      console.log('[Pose] MediaPipe Pose 초기화 완료');

      return pose;
    } catch (error) {
      loadPromise = null;
      console.error('[Pose] 초기화 실패:', error);
      throw error;
    }
  })();

  return loadPromise;
}

/**
 * Pose 인스턴스 해제
 */
export function closePose(): void {
  if (poseInstance) {
    try {
      poseInstance.close();
    } catch {
      // 이미 닫힌 경우 무시
    }
    poseInstance = null;
    loadPromise = null;
    console.log('[Pose] MediaPipe Pose 해제 완료');
  }
}

/**
 * Pose 로드 상태 확인
 */
export function isPoseLoaded(): boolean {
  return poseInstance !== null;
}

/**
 * 이미지에서 33개 Pose 랜드마크 검출
 *
 * @description
 * MediaPipe Pose를 사용하여 전신 이미지에서 33개 랜드마크를 검출합니다.
 * - 얼굴 (0-10): 코, 눈, 귀, 입
 * - 상체 (11-22): 어깨, 팔꿈치, 손목, 손가락
 * - 하체 (23-32): 힙, 무릎, 발목, 발
 *
 * @param imageBase64 - Base64 인코딩된 이미지 (data:image/... 형식)
 * @returns 33개 랜드마크와 검출 신뢰도
 *
 * @example
 * const result = await detectPose(imageBase64);
 * if (result.confidence > 0.7) {
 *   const leftShoulder = result.landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER];
 *   console.log('왼쪽 어깨:', leftShoulder);
 * }
 */
export async function detectPose(imageBase64: string): Promise<PoseDetectionResult> {
  const pose = await initPose();
  const img = await createImageElement(imageBase64);

  return new Promise((resolve, reject) => {
    // 타임아웃 설정 (5초)
    const timeoutId = setTimeout(() => {
      reject(new Error('[Pose] 검출 타임아웃'));
    }, 5000);

    pose.onResults((results: MediaPipePoseResults) => {
      clearTimeout(timeoutId);

      if (!results.poseLandmarks || results.poseLandmarks.length !== 33) {
        resolve({
          landmarks: [],
          overallVisibility: 0,
          confidence: 0,
        });
        return;
      }

      const landmarks = transformLandmarks(results.poseLandmarks);
      const overallVisibility = calculateOverallVisibility(landmarks);

      // 신뢰도 계산: 전체 가시성 * 핵심 랜드마크 가시성
      // 핵심 랜드마크: 어깨, 힙 (체형 분석에 필수)
      const keyLandmarks = [
        landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER],
        landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARK_INDEX.LEFT_HIP],
        landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP],
      ];
      const keyVisibility =
        keyLandmarks.reduce((sum, lm) => sum + lm.visibility, 0) / keyLandmarks.length;

      const confidence = (overallVisibility + keyVisibility) / 2;

      resolve({
        landmarks,
        overallVisibility,
        confidence,
      });
    });

    pose.send({ image: img }).catch((error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

/**
 * 랜드마크 유효성 검증
 *
 * @description 체형 분석에 필요한 핵심 랜드마크가 감지되었는지 확인
 * @param landmarks - 검출된 랜드마크 배열
 * @param minVisibility - 최소 가시성 임계값 (기본 0.5)
 * @returns 유효 여부
 */
export function validatePoseLandmarks(
  landmarks: Landmark33[],
  minVisibility = 0.5
): boolean {
  if (landmarks.length !== 33) {
    return false;
  }

  // 체형 분석 필수 랜드마크: 어깨, 힙
  const requiredIndices = [
    POSE_LANDMARK_INDEX.LEFT_SHOULDER,
    POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
    POSE_LANDMARK_INDEX.LEFT_HIP,
    POSE_LANDMARK_INDEX.RIGHT_HIP,
  ];

  return requiredIndices.every(
    (idx) => landmarks[idx] && landmarks[idx].visibility >= minVisibility
  );
}

/**
 * 랜드마크 좌표를 픽셀 좌표로 변환
 *
 * @description MediaPipe 정규화 좌표(0-1)를 실제 픽셀 좌표로 변환
 * @param landmark - 정규화된 랜드마크
 * @param imageWidth - 이미지 너비 (px)
 * @param imageHeight - 이미지 높이 (px)
 * @returns 픽셀 좌표
 */
export function landmarkToPixel(
  landmark: Landmark33,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; z: number } {
  return {
    x: landmark.x * imageWidth,
    y: landmark.y * imageHeight,
    z: landmark.z * imageWidth, // z는 x와 같은 스케일
  };
}

/**
 * 두 랜드마크 간 거리 계산
 *
 * @description 2D 유클리드 거리 (정규화 좌표 기준)
 * @param lm1 - 첫 번째 랜드마크
 * @param lm2 - 두 번째 랜드마크
 * @returns 정규화된 거리 (0-1 범위)
 */
export function calculateLandmarkDistance(lm1: Landmark33, lm2: Landmark33): number {
  const dx = lm2.x - lm1.x;
  const dy = lm2.y - lm1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 두 랜드마크 간 3D 거리 계산
 *
 * @description 3D 유클리드 거리 (깊이 포함)
 * @param lm1 - 첫 번째 랜드마크
 * @param lm2 - 두 번째 랜드마크
 * @returns 정규화된 3D 거리
 */
export function calculateLandmarkDistance3D(lm1: Landmark33, lm2: Landmark33): number {
  const dx = lm2.x - lm1.x;
  const dy = lm2.y - lm1.y;
  const dz = lm2.z - lm1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 랜드마크 중점 계산
 *
 * @description 두 랜드마크의 중간 지점 계산
 * @param lm1 - 첫 번째 랜드마크
 * @param lm2 - 두 번째 랜드마크
 * @returns 중점 좌표
 */
export function calculateMidpoint(lm1: Landmark33, lm2: Landmark33): Landmark33 {
  return {
    x: (lm1.x + lm2.x) / 2,
    y: (lm1.y + lm2.y) / 2,
    z: (lm1.z + lm2.z) / 2,
    visibility: (lm1.visibility + lm2.visibility) / 2,
  };
}
