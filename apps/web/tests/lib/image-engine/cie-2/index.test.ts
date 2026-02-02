/**
 * CIE-2 모듈 통합 테스트
 *
 * @module tests/lib/image-engine/cie-2/index
 * @description CIE-2 배럴 export 및 통합 기능 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  // 메인 프로세서
  processMock,
  isMediaPipeAvailable,
  generateMockMediaPipeResult,
  // 얼굴 감지
  convertLandmarksToPoints,
  calculateBoundingBoxFromLandmarks,
  getLandmarkPoint,
  calculateFaceAngle,
  calculateFrontalityFromLandmarks,
  selectBestFace,
  validateFaceAngle,
  // 영역 추출
  normalizeBoundingBox,
  extractRegionFromImage,
  getPaddedBoundingBox,
  // Fallback
  generateCIE2Fallback,
  generateNoFaceFallback,
  generateErrorFallback,
  generateRandomCIE2Mock,
  generateFrontalityFallback,
} from '@/lib/image-engine/cie-2';
import type { RGBImageData, Point3D, DetectedFace, BoundingBox } from '@/lib/image-engine/types';

// 테스트용 이미지 데이터 생성 헬퍼
function createTestRGBImageData(
  width: number,
  height: number,
  fillValue = 128
): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  data.fill(fillValue);
  return { data, width, height, channels: 3 };
}

// 테스트용 랜드마크 생성
function createMockLandmarks(count: number = 468): Point3D[] {
  const landmarks: Point3D[] = [];
  for (let i = 0; i < count; i++) {
    landmarks.push({
      x: 0.3 + Math.random() * 0.4,
      y: 0.2 + Math.random() * 0.6,
      z: Math.random() * 0.1,
    });
  }
  return landmarks;
}

// 테스트용 DetectedFace 생성
function createMockDetectedFace(frontalityScore = 85): DetectedFace {
  return {
    landmarks: {
      points: createMockLandmarks(468),
      confidence: 0.95,
    },
    boundingBox: { x: 100, y: 50, width: 200, height: 250 },
    angle: { pitch: 0.05, yaw: 0.03, roll: 0.02 },
    frontalityScore,
    confidence: 0.95,
  };
}

describe('CIE-2 모듈 통합 테스트', () => {
  // =========================================
  // 모듈 export 테스트
  // =========================================

  describe('모듈 export', () => {
    it('메인 프로세서 함수들이 export된다', () => {
      expect(processMock).toBeDefined();
      expect(isMediaPipeAvailable).toBeDefined();
      expect(generateMockMediaPipeResult).toBeDefined();
    });

    it('얼굴 감지 함수들이 export된다', () => {
      expect(convertLandmarksToPoints).toBeDefined();
      expect(calculateBoundingBoxFromLandmarks).toBeDefined();
      expect(getLandmarkPoint).toBeDefined();
      expect(calculateFaceAngle).toBeDefined();
      expect(calculateFrontalityFromLandmarks).toBeDefined();
      expect(selectBestFace).toBeDefined();
      expect(validateFaceAngle).toBeDefined();
    });

    it('영역 추출 함수들이 export된다', () => {
      expect(normalizeBoundingBox).toBeDefined();
      expect(extractRegionFromImage).toBeDefined();
      expect(getPaddedBoundingBox).toBeDefined();
    });

    it('Fallback 함수들이 export된다', () => {
      expect(generateCIE2Fallback).toBeDefined();
      expect(generateNoFaceFallback).toBeDefined();
      expect(generateErrorFallback).toBeDefined();
      expect(generateRandomCIE2Mock).toBeDefined();
      expect(generateFrontalityFallback).toBeDefined();
    });
  });

  // =========================================
  // processMock 통합 테스트
  // =========================================

  describe('processMock 통합', () => {
    it('유효한 이미지에서 결과를 반환한다', () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = processMock(imageData);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('faceDetected');
      expect(result).toHaveProperty('faceCount');
    });

    it('결과 구조가 CIE2Output 타입과 일치한다', () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = processMock(imageData);

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.faceDetected).toBe('boolean');
      expect(typeof result.faceCount).toBe('number');
      expect(result).toHaveProperty('validation');
      expect(result).toHaveProperty('metadata');
    });

    it('Mock 모드에서 항상 성공을 반환한다', () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = processMock(imageData);

      expect(result.success).toBe(true);
    });

    it('메타데이터가 포함된다', () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = processMock(imageData);

      expect(result.metadata).toHaveProperty('processingTime');
      expect(result.metadata).toHaveProperty('modelVersion');
      expect(result.metadata).toHaveProperty('confidence');
    });
  });

  // =========================================
  // isMediaPipeAvailable 테스트
  // =========================================

  describe('isMediaPipeAvailable', () => {
    it('boolean을 반환한다', () => {
      const available = isMediaPipeAvailable();
      expect(typeof available).toBe('boolean');
    });

    it('서버 환경에서 false를 반환할 수 있다', () => {
      const available = isMediaPipeAvailable();
      expect(available).toBe(false);
    });
  });

  // =========================================
  // selectBestFace 테스트
  // =========================================

  describe('selectBestFace', () => {
    it('빈 배열에서 null을 반환한다', () => {
      const result = selectBestFace([], 640, 480);
      expect(result).toBeNull();
    });

    it('단일 얼굴에서 해당 얼굴을 반환한다', () => {
      const face = createMockDetectedFace(90);
      const result = selectBestFace([face], 640, 480);

      expect(result).toBe(face);
    });

    it('여러 얼굴 중 최적의 얼굴을 반환한다', () => {
      const face1 = createMockDetectedFace(70);
      const face2 = createMockDetectedFace(95);
      const face3 = createMockDetectedFace(85);

      const result = selectBestFace([face1, face2, face3], 640, 480);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });
  });

  // =========================================
  // validateFaceAngle 테스트
  // =========================================

  describe('validateFaceAngle', () => {
    it('정면 얼굴에서 valid를 반환한다', () => {
      const angle = { pitch: 0, yaw: 0, roll: 0 };
      const result = validateFaceAngle(angle);

      expect(result.isValid).toBe(true);
    });

    it('심하게 돌아간 얼굴에서 invalid를 반환한다', () => {
      const angle = { pitch: 0.8, yaw: 0.8, roll: 0.8 };
      const result = validateFaceAngle(angle);

      expect(result.isValid).toBe(false);
    });

    it('피드백 메시지를 포함한다', () => {
      const angle = { pitch: 0, yaw: 0, roll: 0 };
      const result = validateFaceAngle(angle);

      expect(result.feedback).toBeDefined();
      expect(typeof result.feedback).toBe('string');
    });
  });

  // =========================================
  // normalizeBoundingBox 테스트
  // =========================================

  describe('normalizeBoundingBox', () => {
    it('바운딩 박스를 정수 좌표로 변환한다', () => {
      const bbox: BoundingBox = { x: 100.5, y: 50.7, width: 200.3, height: 300.8 };
      const imageWidth = 640;
      const imageHeight = 480;

      const result = normalizeBoundingBox(bbox, imageWidth, imageHeight);

      expect(result.x).toBe(100);
      expect(result.y).toBe(50);
      expect(Number.isInteger(result.x)).toBe(true);
      expect(Number.isInteger(result.y)).toBe(true);
    });

    it('이미지 경계 내로 클램핑된다', () => {
      const bbox: BoundingBox = { x: -50, y: -50, width: 800, height: 600 };
      const result = normalizeBoundingBox(bbox, 640, 480);

      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.x + result.width).toBeLessThanOrEqual(640);
      expect(result.y + result.height).toBeLessThanOrEqual(480);
    });
  });

  // =========================================
  // getPaddedBoundingBox 테스트
  // =========================================

  describe('getPaddedBoundingBox', () => {
    it('패딩을 적용한다', () => {
      const bbox: BoundingBox = { x: 100, y: 50, width: 200, height: 300 };
      const result = getPaddedBoundingBox(bbox, 640, 480, 0.1);

      expect(result.width).toBeGreaterThan(bbox.width);
      expect(result.height).toBeGreaterThan(bbox.height);
    });

    it('이미지 경계를 벗어나지 않는다', () => {
      const bbox: BoundingBox = { x: 0, y: 0, width: 640, height: 480 };

      const result = getPaddedBoundingBox(bbox, 640, 480, 0.5);

      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.x + result.width).toBeLessThanOrEqual(640);
      expect(result.y + result.height).toBeLessThanOrEqual(480);
    });
  });

  // =========================================
  // extractRegionFromImage 테스트
  // =========================================

  describe('extractRegionFromImage', () => {
    it('지정된 영역을 추출한다', () => {
      const imageData = createTestRGBImageData(640, 480);
      const region: BoundingBox = { x: 100, y: 50, width: 200, height: 200 };

      const result = extractRegionFromImage(imageData, region);

      expect(result.width).toBe(200);
      expect(result.height).toBe(200);
      expect(result.channels).toBe(3);
    });

    it('경계 영역을 클리핑한다', () => {
      const imageData = createTestRGBImageData(640, 480);
      const region: BoundingBox = { x: 600, y: 450, width: 100, height: 100 };

      const result = extractRegionFromImage(imageData, region);

      expect(result.width).toBe(40);
      expect(result.height).toBe(30);
    });
  });

  // =========================================
  // Fallback 함수 테스트
  // =========================================

  describe('Fallback 함수', () => {
    it('generateCIE2Fallback이 유효한 결과를 반환한다', () => {
      const fallback = generateCIE2Fallback();

      expect(fallback).toHaveProperty('success');
      expect(fallback).toHaveProperty('faceDetected');
      expect(fallback).toHaveProperty('faceCount');
      expect(fallback.success).toBe(true);
    });

    it('generateNoFaceFallback이 faceDetected: false를 반환한다', () => {
      const fallback = generateNoFaceFallback();

      expect(fallback.faceDetected).toBe(false);
      expect(fallback.faceCount).toBe(0);
    });

    it('generateErrorFallback이 success: false를 반환한다', () => {
      const errorMessage = 'Test error';
      const fallback = generateErrorFallback(errorMessage);

      expect(fallback.success).toBe(false);
    });

    it('generateRandomCIE2Mock이 무작위 결과를 생성한다', () => {
      const mock1 = generateRandomCIE2Mock();
      const mock2 = generateRandomCIE2Mock();

      expect(mock1).toHaveProperty('faceDetected');
      expect(mock2).toHaveProperty('faceDetected');
    });

    it('generateFrontalityFallback이 정면성 결과를 반환한다', () => {
      const fallback = generateFrontalityFallback();

      expect(fallback).toHaveProperty('score');
      expect(fallback).toHaveProperty('isValid');
      expect(fallback.isValid).toBe(true);
    });
  });

  // =========================================
  // convertLandmarksToPoints 테스트
  // =========================================

  describe('convertLandmarksToPoints', () => {
    it('MediaPipe 형식을 Point3D 배열로 변환한다', () => {
      const mediaPipeLandmarks = [
        { x: 0.5, y: 0.5, z: 0.1 },
        { x: 0.3, y: 0.4, z: 0.05 },
      ];

      const imageWidth = 100;
      const imageHeight = 100;
      const result = convertLandmarksToPoints(mediaPipeLandmarks, imageWidth, imageHeight);

      expect(result).toHaveLength(2);
      expect(result[0].x).toBeCloseTo(50);
      expect(result[0].y).toBeCloseTo(50);
      expect(result[0].z).toBeCloseTo(10);
    });

    it('빈 배열에서 빈 배열을 반환한다', () => {
      const result = convertLandmarksToPoints([], 100, 100);
      expect(result).toHaveLength(0);
    });
  });

  // =========================================
  // 엣지 케이스 테스트
  // =========================================

  describe('엣지 케이스', () => {
    it('작은 이미지를 처리한다', () => {
      const imageData = createTestRGBImageData(10, 10);
      const result = processMock(imageData);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('큰 이미지를 처리한다', () => {
      const imageData = createTestRGBImageData(1920, 1080);
      const result = processMock(imageData);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('0 크기 영역 추출을 처리한다', () => {
      const imageData = createTestRGBImageData(640, 480);
      const region: BoundingBox = { x: 100, y: 100, width: 0, height: 0 };

      const result = extractRegionFromImage(imageData, region);

      expect(result).toBeDefined();
    });

    it('음수 좌표 영역 추출을 처리한다', () => {
      const imageData = createTestRGBImageData(640, 480);
      const region: BoundingBox = { x: -100, y: -100, width: 200, height: 200 };

      const result = extractRegionFromImage(imageData, region);

      expect(result).toBeDefined();
    });
  });
});
