/**
 * CIE-2 얼굴 감지 테스트
 *
 * @module tests/lib/image-engine/cie-2/face-detector
 * @see lib/image-engine/cie-2/face-detector.ts
 */
import { describe, it, expect } from 'vitest';
import {
  calculateBoundingBoxFromLandmarks,
  convertLandmarksToPoints,
  getLandmarkPoint,
  validateFaceAngle,
  selectBestFace,
} from '@/lib/image-engine/cie-2/face-detector';
import type { Point3D, DetectedFace, EulerAngles } from '@/lib/image-engine/types';

describe('convertLandmarksToPoints', () => {
  it('MediaPipe 정규화 좌표를 픽셀 좌표로 변환', () => {
    const landmarks = [
      { x: 0.5, y: 0.5, z: 0 },
      { x: 0.25, y: 0.75, z: 0.1 },
    ];
    const imageWidth = 640;
    const imageHeight = 480;

    const points = convertLandmarksToPoints(landmarks, imageWidth, imageHeight);

    expect(points[0].x).toBe(320); // 0.5 * 640
    expect(points[0].y).toBe(240); // 0.5 * 480
    expect(points[1].x).toBe(160); // 0.25 * 640
    expect(points[1].y).toBe(360); // 0.75 * 480
  });

  it('빈 랜드마크 배열 처리', () => {
    const points = convertLandmarksToPoints([], 640, 480);

    expect(points).toHaveLength(0);
  });

  it('z 좌표는 width 기준으로 스케일', () => {
    const landmarks = [{ x: 0.5, y: 0.5, z: 0.1 }];
    const imageWidth = 640;
    const imageHeight = 480;

    const points = convertLandmarksToPoints(landmarks, imageWidth, imageHeight);

    expect(points[0].z).toBe(64); // 0.1 * 640
  });
});

describe('calculateBoundingBoxFromLandmarks', () => {
  it('랜드마크에서 바운딩 박스 계산 (20% 패딩)', () => {
    const points: Point3D[] = [
      { x: 100, y: 100, z: 0 },
      { x: 200, y: 100, z: 0 },
      { x: 100, y: 200, z: 0 },
      { x: 200, y: 200, z: 0 },
    ];

    const bbox = calculateBoundingBoxFromLandmarks(points);

    // 원본: x=100-200, y=100-200, w=100, h=100
    // 패딩: max(100, 100) * 0.2 = 20
    expect(bbox.x).toBe(80); // 100 - 20
    expect(bbox.y).toBe(80); // 100 - 20
    expect(bbox.width).toBe(140); // 100 + 40
    expect(bbox.height).toBe(140); // 100 + 40
  });

  it('음수 좌표 방지 (Math.max(0, ...))', () => {
    const points: Point3D[] = [
      { x: 10, y: 10, z: 0 },
      { x: 60, y: 60, z: 0 },
    ];

    const bbox = calculateBoundingBoxFromLandmarks(points);

    expect(bbox.x).toBeGreaterThanOrEqual(0);
    expect(bbox.y).toBeGreaterThanOrEqual(0);
  });

  it('단일 포인트 처리', () => {
    const points: Point3D[] = [{ x: 100, y: 100, z: 0 }];

    const bbox = calculateBoundingBoxFromLandmarks(points);

    expect(bbox.x).toBeDefined();
    expect(bbox.y).toBeDefined();
    // width와 height는 0이지만 패딩이 추가됨
  });
});

describe('getLandmarkPoint', () => {
  const testPoints: Point3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 20, z: 30 },
    { x: 100, y: 200, z: 300 },
  ];

  it('유효한 인덱스로 포인트 반환', () => {
    const point = getLandmarkPoint(testPoints, 1);

    expect(point.x).toBe(10);
    expect(point.y).toBe(20);
    expect(point.z).toBe(30);
  });

  it('음수 인덱스는 에러 발생', () => {
    expect(() => getLandmarkPoint(testPoints, -1)).toThrow('Invalid landmark index');
  });

  it('범위 초과 인덱스는 에러 발생', () => {
    expect(() => getLandmarkPoint(testPoints, 10)).toThrow('Invalid landmark index');
  });
});

describe('validateFaceAngle', () => {
  it('정면(0도)은 유효', () => {
    const angles: EulerAngles = { pitch: 0, yaw: 0, roll: 0 };
    const result = validateFaceAngle(angles);

    expect(result.isValid).toBe(true);
    expect(result.feedback).toContain('적절');
  });

  it('고개를 너무 숙이면 무효 (pitch > threshold)', () => {
    const angles: EulerAngles = { pitch: 0.6, yaw: 0, roll: 0 }; // ~34도
    const result = validateFaceAngle(angles);

    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('내려주세요');
  });

  it('고개를 너무 들면 무효 (pitch < -threshold)', () => {
    const angles: EulerAngles = { pitch: -0.6, yaw: 0, roll: 0 };
    const result = validateFaceAngle(angles);

    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('들어주세요');
  });

  it('옆을 보면 무효 (yaw > threshold)', () => {
    const angles: EulerAngles = { pitch: 0, yaw: 0.6, roll: 0 };
    const result = validateFaceAngle(angles);

    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('바라보고');
  });

  it('고개가 기울면 무효 (roll > threshold)', () => {
    const angles: EulerAngles = { pitch: 0, yaw: 0, roll: 0.4 };
    const result = validateFaceAngle(angles);

    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('기울어져');
  });

  it('여러 문제가 있으면 모두 포함', () => {
    const angles: EulerAngles = { pitch: 0.6, yaw: 0.6, roll: 0.4 };
    const result = validateFaceAngle(angles);

    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('정면');
  });
});

describe('selectBestFace', () => {
  const createMockFace = (
    frontalityScore: number,
    x: number,
    y: number,
    size: number
  ): DetectedFace => ({
    landmarks: {
      points: [],
      confidence: 0.9,
    },
    boundingBox: {
      x,
      y,
      width: size,
      height: size,
    },
    angle: { pitch: 0, yaw: 0, roll: 0 },
    frontalityScore,
    confidence: 0.9,
  });

  it('빈 배열이면 null 반환', () => {
    const result = selectBestFace([], 640, 480);

    expect(result).toBeNull();
  });

  it('얼굴이 하나면 그 얼굴 반환', () => {
    const face = createMockFace(80, 100, 100, 100);
    const result = selectBestFace([face], 640, 480);

    expect(result).toBe(face);
  });

  it('정면성이 높은 얼굴 선호', () => {
    const face1 = createMockFace(50, 320, 240, 100); // 낮은 정면성
    const face2 = createMockFace(90, 320, 240, 100); // 높은 정면성

    const result = selectBestFace([face1, face2], 640, 480);

    expect(result?.frontalityScore).toBe(90);
  });

  it('중앙에 가까운 얼굴 선호', () => {
    const face1 = createMockFace(70, 50, 50, 100); // 코너
    const face2 = createMockFace(70, 270, 190, 100); // 중앙 근처

    const result = selectBestFace([face1, face2], 640, 480);

    expect(result).toBe(face2);
  });

  it('큰 얼굴 선호', () => {
    const face1 = createMockFace(70, 200, 150, 50); // 작은 얼굴
    const face2 = createMockFace(70, 200, 150, 150); // 큰 얼굴

    const result = selectBestFace([face1, face2], 640, 480);

    expect(result?.boundingBox.width).toBe(150);
  });
});
