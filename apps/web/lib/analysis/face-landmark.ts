/**
 * 얼굴 랜드마크 추출 모듈
 * @description MediaPipe Face Mesh 기반 468개 3D 랜드마크 추출
 */

import type { FaceLandmark, FaceLandmarkResult } from '@/types/visual-analysis';
import { initFaceMesh, closeFaceMesh, checkMediaPipeCDN } from './mediapipe-loader';
import type { MediaPipeFaceMesh, MediaPipeFaceMeshResults } from './mediapipe-loader';
import {
  generateMockLandmarks,
  FACE_OVAL_INDICES,
  LEFT_EYE_INDICES,
  RIGHT_EYE_INDICES,
  LIPS_INDICES,
} from '@/lib/mock/visual-analysis';

// ============================================
// 상수 정의
// ============================================

/** 분석 타임아웃 (10초) */
const ANALYSIS_TIMEOUT_MS = 10000;

// ============================================
// 주요 함수
// ============================================

/**
 * 이미지에서 얼굴 랜드마크 추출
 * @param image - 분석할 이미지 (HTMLImageElement)
 * @param options - 옵션 (useMock: Mock 강제 사용)
 * @returns 랜드마크 결과 또는 null (얼굴 미감지)
 */
export async function extractFaceLandmarks(
  image: HTMLImageElement,
  options?: {
    useMock?: boolean;
    timeout?: number;
  }
): Promise<FaceLandmarkResult | null> {
  const { useMock = false, timeout = ANALYSIS_TIMEOUT_MS } = options ?? {};

  // Mock 강제 사용 또는 환경변수
  if (useMock || process.env.NEXT_PUBLIC_FORCE_MOCK_AI === 'true') {
    console.log('[FaceLandmark] Mock 모드 사용');
    return generateMockLandmarks();
  }

  try {
    // CDN 상태 확인
    const cdnAvailable = await checkMediaPipeCDN();
    if (!cdnAvailable) {
      console.warn('[FaceLandmark] CDN 불가, Mock Fallback');
      return generateMockLandmarks();
    }

    // MediaPipe 초기화
    const faceMesh = await initFaceMesh();

    // 타임아웃 설정
    const result = await Promise.race([
      analyzeFaceWithMediaPipe(faceMesh, image),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('분석 타임아웃')), timeout)
      ),
    ]);

    return result;
  } catch (error) {
    console.error('[FaceLandmark] 분석 실패, Mock Fallback:', error);
    return generateMockLandmarks();
  }
}

/**
 * MediaPipe로 얼굴 분석 실행
 */
async function analyzeFaceWithMediaPipe(
  faceMesh: MediaPipeFaceMesh,
  image: HTMLImageElement
): Promise<FaceLandmarkResult | null> {
  return new Promise((resolve) => {
    let resolved = false;

    // 결과 콜백 설정
    faceMesh.onResults((results: MediaPipeFaceMeshResults) => {
      if (resolved) return;
      resolved = true;

      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        console.warn('[FaceLandmark] 얼굴 미감지');
        resolve(null);
        return;
      }

      // 첫 번째 얼굴의 랜드마크 변환
      const rawLandmarks = results.multiFaceLandmarks[0];
      const landmarks: FaceLandmark[] = rawLandmarks.map((point) => ({
        x: point.x,
        y: point.y,
        z: point.z,
      }));

      resolve({
        landmarks,
        faceOval: FACE_OVAL_INDICES,
        leftEye: LEFT_EYE_INDICES,
        rightEye: RIGHT_EYE_INDICES,
        lips: LIPS_INDICES,
      });
    });

    // 이미지 전송
    faceMesh.send({ image }).catch((error) => {
      if (!resolved) {
        console.error('[FaceLandmark] 이미지 전송 실패:', error);
        resolved = true;
        resolve(null);
      }
    });
  });
}

// ============================================
// 얼굴 마스크 생성
// ============================================

/**
 * 랜드마크에서 얼굴 마스크 생성
 * - 피부 영역만 추출하기 위한 마스크
 * @param landmarks - 468개 랜드마크
 * @param width - 이미지 너비
 * @param height - 이미지 높이
 * @returns Uint8Array 마스크 (0 또는 255)
 */
export function createFaceMask(
  landmarks: FaceLandmark[],
  width: number,
  height: number
): Uint8Array {
  const mask = new Uint8Array(width * height);

  // 얼굴 윤곽 폴리곤 생성
  const faceOvalPoints = FACE_OVAL_INDICES.map((idx) => {
    const landmark = landmarks[idx];
    return {
      x: Math.round(landmark.x * width),
      y: Math.round(landmark.y * height),
    };
  });

  // 폴리곤 내부 채우기 (Scanline Fill)
  fillPolygon(mask, width, height, faceOvalPoints);

  // 눈, 입 영역 제외 (피부만 남기기)
  const excludeRegions = [
    LEFT_EYE_INDICES.map((idx) => ({
      x: Math.round(landmarks[idx].x * width),
      y: Math.round(landmarks[idx].y * height),
    })),
    RIGHT_EYE_INDICES.map((idx) => ({
      x: Math.round(landmarks[idx].x * width),
      y: Math.round(landmarks[idx].y * height),
    })),
    LIPS_INDICES.map((idx) => ({
      x: Math.round(landmarks[idx].x * width),
      y: Math.round(landmarks[idx].y * height),
    })),
  ];

  excludeRegions.forEach((region) => {
    clearPolygon(mask, width, height, region);
  });

  return mask;
}

/**
 * 폴리곤 내부 채우기 (Scanline Fill Algorithm)
 */
function fillPolygon(
  mask: Uint8Array,
  width: number,
  height: number,
  points: Array<{ x: number; y: number }>
): void {
  if (points.length < 3) return;

  // Y 범위 계산
  let minY = height;
  let maxY = 0;
  points.forEach((p) => {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  minY = Math.max(0, minY);
  maxY = Math.min(height - 1, maxY);

  // 각 스캔라인 처리
  for (let y = minY; y <= maxY; y++) {
    const intersections: number[] = [];

    // 모든 에지와의 교점 계산
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
        const x = p1.x + ((y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x);
        intersections.push(x);
      }
    }

    // 교점 정렬
    intersections.sort((a, b) => a - b);

    // 쌍으로 채우기
    for (let i = 0; i < intersections.length - 1; i += 2) {
      const x1 = Math.max(0, Math.round(intersections[i]));
      const x2 = Math.min(width - 1, Math.round(intersections[i + 1]));

      for (let x = x1; x <= x2; x++) {
        mask[y * width + x] = 255;
      }
    }
  }
}

/**
 * 폴리곤 영역 지우기
 */
function clearPolygon(
  mask: Uint8Array,
  width: number,
  height: number,
  points: Array<{ x: number; y: number }>
): void {
  if (points.length < 3) return;

  // Y 범위 계산
  let minY = height;
  let maxY = 0;
  points.forEach((p) => {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  minY = Math.max(0, minY);
  maxY = Math.min(height - 1, maxY);

  // 각 스캔라인 처리
  for (let y = minY; y <= maxY; y++) {
    const intersections: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
        const x = p1.x + ((y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x);
        intersections.push(x);
      }
    }

    intersections.sort((a, b) => a - b);

    for (let i = 0; i < intersections.length - 1; i += 2) {
      const x1 = Math.max(0, Math.round(intersections[i]));
      const x2 = Math.min(width - 1, Math.round(intersections[i + 1]));

      for (let x = x1; x <= x2; x++) {
        mask[y * width + x] = 0;
      }
    }
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 랜드마크를 DB 저장용 형식으로 변환
 */
export function landmarksToDbFormat(result: FaceLandmarkResult): {
  landmarks: [number, number, number][];
  face_oval: number[];
  left_eye: number[];
  right_eye: number[];
} {
  return {
    landmarks: result.landmarks.map((lm) => [
      Math.round(lm.x * 10000) / 10000,
      Math.round(lm.y * 10000) / 10000,
      Math.round(lm.z * 10000) / 10000,
    ]),
    face_oval: result.faceOval,
    left_eye: result.leftEye,
    right_eye: result.rightEye,
  };
}

/**
 * DB 형식에서 랜드마크 복원
 */
export function dbFormatToLandmarks(dbData: {
  landmarks: [number, number, number][];
  face_oval: number[];
  left_eye: number[];
  right_eye: number[];
}): FaceLandmarkResult {
  return {
    landmarks: dbData.landmarks.map(([x, y, z]) => ({ x, y, z })),
    faceOval: dbData.face_oval,
    leftEye: dbData.left_eye,
    rightEye: dbData.right_eye,
    lips: LIPS_INDICES,
  };
}

/**
 * 랜드마크 유효성 검증
 */
export function validateLandmarks(landmarks: FaceLandmark[]): boolean {
  // 468개 여부
  if (landmarks.length !== 468) return false;

  // 좌표 범위 검증 (정규화된 값: 0.0 ~ 1.0)
  for (const lm of landmarks) {
    if (lm.x < 0 || lm.x > 1 || lm.y < 0 || lm.y > 1) {
      return false;
    }
  }

  return true;
}

/**
 * MediaPipe 리소스 해제
 */
export function releaseFaceLandmark(): void {
  closeFaceMesh();
}

// ============================================
// 영역 좌표 추출
// ============================================

/**
 * 특정 영역의 바운딩 박스 계산
 */
export function getRegionBoundingBox(
  landmarks: FaceLandmark[],
  indices: number[],
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  indices.forEach((idx) => {
    const lm = landmarks[idx];
    const x = lm.x * imageWidth;
    const y = lm.y * imageHeight;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  return {
    x: Math.round(minX),
    y: Math.round(minY),
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  };
}

/**
 * 얼굴 중심점 계산
 */
export function getFaceCenter(
  landmarks: FaceLandmark[],
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  const bbox = getRegionBoundingBox(landmarks, FACE_OVAL_INDICES, imageWidth, imageHeight);
  return {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
  };
}

// Re-export 인덱스 상수
export { FACE_OVAL_INDICES, LEFT_EYE_INDICES, RIGHT_EYE_INDICES, LIPS_INDICES };
