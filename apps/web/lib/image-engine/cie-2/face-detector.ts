/**
 * CIE-2: 얼굴 감지 모듈
 *
 * @module lib/image-engine/cie-2/face-detector
 * @description MediaPipe Face Mesh 기반 얼굴 감지
 * @see docs/specs/SDD-CIE-2-FACE-DETECTION.md
 */

import type {
  Point3D,
  BoundingBox,
  FaceLandmarks,
  DetectedFace,
} from '../types';
import { FACE_LANDMARK_INDICES, FACE_ANGLE_THRESHOLDS, FRONTALITY_WEIGHTS } from '../constants';
import { calculateFaceEulerAngles, calculateFrontalityScore, eulerToDegrees } from '../utils';

/**
 * MediaPipe Face Mesh 결과 타입 (간소화)
 */
export interface MediaPipeFaceResult {
  landmarks: Array<{ x: number; y: number; z: number }>;
  boundingBox?: {
    xMin: number;
    yMin: number;
    width: number;
    height: number;
  };
}

/**
 * MediaPipe 랜드마크를 Point3D 배열로 변환
 *
 * @param landmarks - MediaPipe 랜드마크 배열
 * @param imageWidth - 이미지 너비
 * @param imageHeight - 이미지 높이
 * @returns Point3D 배열
 */
export function convertLandmarksToPoints(
  landmarks: Array<{ x: number; y: number; z: number }>,
  imageWidth: number,
  imageHeight: number
): Point3D[] {
  return landmarks.map((lm) => ({
    x: lm.x * imageWidth,
    y: lm.y * imageHeight,
    z: lm.z * imageWidth, // z는 x 스케일 기준
  }));
}

/**
 * 랜드마크에서 바운딩 박스 계산
 *
 * @param points - Point3D 배열
 * @returns 바운딩 박스
 */
export function calculateBoundingBoxFromLandmarks(points: Point3D[]): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  // 20% 패딩 추가 (SDD-CIE-2 스펙 기준)
  const width = maxX - minX;
  const height = maxY - minY;
  const padding = Math.max(width, height) * 0.2;

  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: width + padding * 2,
    height: height + padding * 2,
  };
}

/**
 * 특정 인덱스의 랜드마크 추출
 *
 * @param points - 전체 랜드마크 배열
 * @param index - 랜드마크 인덱스
 * @returns Point3D
 */
export function getLandmarkPoint(points: Point3D[], index: number): Point3D {
  if (index < 0 || index >= points.length) {
    throw new Error(`Invalid landmark index: ${index}`);
  }
  return points[index];
}

/**
 * 얼굴 각도 계산
 *
 * @param points - 468-point 랜드마크 배열
 * @returns 오일러 각도
 */
export function calculateFaceAngle(points: Point3D[]) {
  const indices = FACE_LANDMARK_INDICES;

  // 3점 기준 각도 계산
  const forehead = getLandmarkPoint(points, indices.forehead);
  const leftCheek = getLandmarkPoint(points, indices.leftCheek);
  const rightCheek = getLandmarkPoint(points, indices.rightCheek);

  // 눈 위치 (Roll 계산용)
  const leftEye = getLandmarkPoint(points, indices.leftEyeOuter);
  const rightEye = getLandmarkPoint(points, indices.rightEyeOuter);

  return calculateFaceEulerAngles(
    forehead,
    leftCheek,
    rightCheek,
    { x: leftEye.x, y: leftEye.y },
    { x: rightEye.x, y: rightEye.y }
  );
}

/**
 * 정면성 점수 계산
 *
 * @param points - 468-point 랜드마크 배열
 * @returns 정면성 점수 (0-100)
 */
export function calculateFrontalityFromLandmarks(points: Point3D[]): number {
  const angles = calculateFaceAngle(points);

  return calculateFrontalityScore(
    angles,
    FACE_ANGLE_THRESHOLDS,
    FRONTALITY_WEIGHTS
  );
}

/**
 * MediaPipe 결과를 DetectedFace로 변환
 *
 * @param mpResult - MediaPipe Face Mesh 결과
 * @param imageWidth - 이미지 너비
 * @param imageHeight - 이미지 높이
 * @param confidence - 감지 신뢰도 (0-1)
 * @returns DetectedFace
 */
export function convertToDetectedFace(
  mpResult: MediaPipeFaceResult,
  imageWidth: number,
  imageHeight: number,
  confidence = 0.9
): DetectedFace {
  // 1. 랜드마크 변환
  const points = convertLandmarksToPoints(mpResult.landmarks, imageWidth, imageHeight);

  // 2. 바운딩 박스
  const boundingBox = mpResult.boundingBox
    ? {
        x: mpResult.boundingBox.xMin * imageWidth,
        y: mpResult.boundingBox.yMin * imageHeight,
        width: mpResult.boundingBox.width * imageWidth,
        height: mpResult.boundingBox.height * imageHeight,
      }
    : calculateBoundingBoxFromLandmarks(points);

  // 3. 각도 계산
  const angle = calculateFaceAngle(points);

  // 4. 정면성 점수
  const frontalityScore = calculateFrontalityFromLandmarks(points);

  // 5. 랜드마크 객체
  const faceLandmarks: FaceLandmarks = {
    points,
    confidence,
  };

  return {
    landmarks: faceLandmarks,
    boundingBox,
    angle,
    frontalityScore,
    confidence,
  };
}

/**
 * 여러 얼굴 중 최적의 얼굴 선택
 *
 * 기준:
 * 1. 정면성 점수
 * 2. 바운딩 박스 크기
 * 3. 중앙 위치
 *
 * @param faces - 감지된 얼굴 배열
 * @param imageWidth - 이미지 너비
 * @param imageHeight - 이미지 높이
 * @returns 선택된 얼굴 또는 null
 */
export function selectBestFace(
  faces: DetectedFace[],
  imageWidth: number,
  imageHeight: number
): DetectedFace | null {
  if (faces.length === 0) return null;
  if (faces.length === 1) return faces[0];

  // 점수 계산
  const scores = faces.map((face) => {
    // 정면성 점수 (40%)
    const frontalityWeight = face.frontalityScore * 0.4;

    // 크기 점수 (30%) - 큰 얼굴 선호
    const faceArea = face.boundingBox.width * face.boundingBox.height;
    const maxArea = imageWidth * imageHeight * 0.5; // 최대 50%
    const sizeWeight = Math.min(1, faceArea / maxArea) * 100 * 0.3;

    // 중앙 점수 (30%) - 중앙에 가까울수록 높음
    const centerX = face.boundingBox.x + face.boundingBox.width / 2;
    const centerY = face.boundingBox.y + face.boundingBox.height / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow((centerX - imageWidth / 2) / imageWidth, 2) +
      Math.pow((centerY - imageHeight / 2) / imageHeight, 2)
    );
    const centerWeight = (1 - Math.min(1, distanceFromCenter)) * 100 * 0.3;

    return frontalityWeight + sizeWeight + centerWeight;
  });

  // 최고 점수 얼굴 반환
  let bestIndex = 0;
  let bestScore = scores[0];
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestIndex = i;
    }
  }

  return faces[bestIndex];
}

/**
 * 각도 유효성 검증
 *
 * @param angles - 오일러 각도 (라디안)
 * @returns 유효성 및 피드백
 */
export function validateFaceAngle(angles: ReturnType<typeof calculateFaceAngle>): {
  isValid: boolean;
  feedback: string;
} {
  const anglesDeg = eulerToDegrees(angles);
  const { pitch, yaw, roll } = FACE_ANGLE_THRESHOLDS;

  const issues: string[] = [];

  if (Math.abs(anglesDeg.pitch) > pitch) {
    issues.push(anglesDeg.pitch > 0 ? '고개를 내려주세요' : '고개를 들어주세요');
  }

  if (Math.abs(anglesDeg.yaw) > yaw) {
    issues.push(anglesDeg.yaw > 0 ? '오른쪽을 바라보고 있습니다' : '왼쪽을 바라보고 있습니다');
  }

  if (Math.abs(anglesDeg.roll) > roll) {
    issues.push('고개가 기울어져 있습니다');
  }

  return {
    isValid: issues.length === 0,
    feedback: issues.length > 0
      ? issues.join('. ') + '. 정면을 바라봐주세요.'
      : '얼굴 각도가 적절합니다.',
  };
}
