/**
 * CIE-2: 얼굴 감지 모듈 테스트
 *
 * @see docs/specs/SDD-CIE-2-FACE-DETECTION.md
 * @see docs/principles/3d-face-shape.md
 *
 * 테스트 범위:
 * - processor.ts: processMediaPipeResults, processMock, generateMockMediaPipeResult
 * - face-detector.ts: convertLandmarksToPoints, calculateBoundingBox, selectBestFace
 * - fallback.ts: generateCIE2Fallback, generateNoFaceFallback, generateErrorFallback
 * - region-extractor.ts: extractFaceRegion, normalizeBoundingBox
 */

import { describe, it, expect } from 'vitest';

// Processor
import {
  processMediaPipeResults,
  processMock,
  isMediaPipeAvailable,
  generateMockMediaPipeResult,
} from '@/lib/image-engine/cie-2/processor';

// Face Detector
import {
  convertLandmarksToPoints,
  calculateBoundingBoxFromLandmarks,
  getLandmarkPoint,
  convertToDetectedFace,
  selectBestFace,
  validateFaceAngle,
  type MediaPipeFaceResult,
} from '@/lib/image-engine/cie-2/face-detector';

// Region Extractor
import {
  normalizeBoundingBox,
  extractFaceRegion,
  getPaddedBoundingBox,
} from '@/lib/image-engine/cie-2/region-extractor';

// Fallback
import {
  generateCIE2Fallback,
  generateNoFaceFallback,
  generateErrorFallback,
  generateRandomCIE2Mock,
  generateFrontalityFallback,
} from '@/lib/image-engine/cie-2/fallback';

import type { RGBImageData, Point3D } from '@/lib/image-engine/types';

// ============================================
// 테스트 유틸리티
// ============================================

function createTestRGBImageData(width = 640, height = 480): RGBImageData {
  return {
    width,
    height,
    channels: 3,
    data: new Uint8ClampedArray(width * height * 3).fill(128),
  };
}

function createMockLandmarks(count = 468): Array<{ x: number; y: number; z: number }> {
  const landmarks = [];
  const centerX = 0.5;
  const centerY = 0.5;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    const radius = 0.1 + (i % 50) / 500;

    landmarks.push({
      x: centerX + Math.cos(angle) * radius * 0.4,
      y: centerY + Math.sin(angle) * radius * 0.5,
      z: Math.sin(angle * 2) * 0.01,
    });
  }

  return landmarks;
}

function createMockMediaPipeResult(): MediaPipeFaceResult {
  return {
    landmarks: createMockLandmarks(468),
    boundingBox: {
      xMin: 0.3,
      yMin: 0.25,
      width: 0.4,
      height: 0.5,
    },
  };
}

// ============================================
// Processor 테스트
// ============================================

describe('CIE-2 Processor', () => {
  describe('processMediaPipeResults', () => {
    it('should return faceDetected: false when no faces', () => {
      const imageData = createTestRGBImageData();
      const result = processMediaPipeResults(imageData, []);

      expect(result.success).toBe(true);
      expect(result.faceDetected).toBe(false);
      expect(result.faceCount).toBe(0);
    });

    it('should detect face from valid MediaPipe result', () => {
      const imageData = createTestRGBImageData();
      const mpResult = createMockMediaPipeResult();

      const result = processMediaPipeResults(imageData, [mpResult]);

      expect(result.success).toBe(true);
      expect(result.faceDetected).toBe(true);
      expect(result.faceCount).toBe(1);
      expect(result.selectedFace).toBeDefined();
    });

    it('should include validation information', () => {
      const imageData = createTestRGBImageData();
      const mpResult = createMockMediaPipeResult();

      const result = processMediaPipeResults(imageData, [mpResult]);

      expect(result.validation).toBeDefined();
      expect(typeof result.validation.isAngleValid).toBe('boolean');
      expect(typeof result.validation.angleFeedback).toBe('string');
      expect(result.validation.frontalityResult).toBeDefined();
    });

    it('should include metadata', () => {
      const imageData = createTestRGBImageData();
      const mpResult = createMockMediaPipeResult();

      const result = processMediaPipeResults(imageData, [mpResult]);

      expect(result.metadata).toBeDefined();
      expect(typeof result.metadata.processingTime).toBe('number');
      expect(result.metadata.modelVersion).toBe('mediapipe-face-mesh-468');
    });

    it('should handle multiple faces and select best one', () => {
      const imageData = createTestRGBImageData();
      const mpResult1 = createMockMediaPipeResult();
      const mpResult2 = createMockMediaPipeResult();

      const result = processMediaPipeResults(imageData, [mpResult1, mpResult2]);

      expect(result.faceCount).toBe(2);
      expect(result.selectedFace).toBeDefined();
      // Multiple faces should have feedback mentioning it
      expect(result.validation.angleFeedback).toContain('여러');
    });
  });

  describe('processMock', () => {
    it('should always return detected face', () => {
      const imageData = createTestRGBImageData();
      const result = processMock(imageData);

      expect(result.success).toBe(true);
      expect(result.faceDetected).toBe(true);
      expect(result.faceCount).toBe(1);
    });

    it('should work with different image sizes', () => {
      const smallImage = createTestRGBImageData(320, 240);
      const largeImage = createTestRGBImageData(1920, 1080);

      const smallResult = processMock(smallImage);
      const largeResult = processMock(largeImage);

      expect(smallResult.success).toBe(true);
      expect(largeResult.success).toBe(true);
    });
  });

  describe('generateMockMediaPipeResult', () => {
    it('should generate 468 landmarks', () => {
      const result = generateMockMediaPipeResult(640, 480);

      expect(result.landmarks).toBeDefined();
      expect(result.landmarks.length).toBe(468);
    });

    it('should generate landmarks within normalized range', () => {
      const result = generateMockMediaPipeResult(640, 480);

      result.landmarks.forEach((lm) => {
        expect(lm.x).toBeGreaterThanOrEqual(0);
        expect(lm.x).toBeLessThanOrEqual(1);
        expect(lm.y).toBeGreaterThanOrEqual(0);
        expect(lm.y).toBeLessThanOrEqual(1);
      });
    });

    it('should include bounding box', () => {
      const result = generateMockMediaPipeResult(640, 480);

      expect(result.boundingBox).toBeDefined();
      expect(result.boundingBox!.xMin).toBeDefined();
      expect(result.boundingBox!.yMin).toBeDefined();
      expect(result.boundingBox!.width).toBeGreaterThan(0);
      expect(result.boundingBox!.height).toBeGreaterThan(0);
    });
  });

  describe('isMediaPipeAvailable', () => {
    it('should return false in Node.js environment', () => {
      // Node.js에서 실행 중이므로 window가 없음
      const result = isMediaPipeAvailable();
      expect(result).toBe(false);
    });
  });
});

// ============================================
// Face Detector 테스트
// ============================================

describe('CIE-2 Face Detector', () => {
  describe('convertLandmarksToPoints', () => {
    it('should convert normalized landmarks to pixel coordinates', () => {
      const landmarks = [
        { x: 0.5, y: 0.5, z: 0.01 },
        { x: 0.25, y: 0.25, z: 0 },
      ];
      const width = 640;
      const height = 480;

      const points = convertLandmarksToPoints(landmarks, width, height);

      expect(points[0].x).toBe(320); // 0.5 * 640
      expect(points[0].y).toBe(240); // 0.5 * 480
      expect(points[1].x).toBe(160); // 0.25 * 640
      expect(points[1].y).toBe(120); // 0.25 * 480
    });

    it('should scale z coordinate by image width', () => {
      const landmarks = [{ x: 0.5, y: 0.5, z: 0.1 }];
      const width = 640;
      const height = 480;

      const points = convertLandmarksToPoints(landmarks, width, height);

      expect(points[0].z).toBe(64); // 0.1 * 640
    });
  });

  describe('calculateBoundingBoxFromLandmarks', () => {
    it('should calculate bounding box with padding', () => {
      const points: Point3D[] = [
        { x: 100, y: 100, z: 0 },
        { x: 200, y: 100, z: 0 },
        { x: 200, y: 200, z: 0 },
        { x: 100, y: 200, z: 0 },
      ];

      const bbox = calculateBoundingBoxFromLandmarks(points);

      // 원래 크기 100x100에 20% 패딩
      expect(bbox.width).toBeGreaterThan(100);
      expect(bbox.height).toBeGreaterThan(100);
    });

    it('should not go below zero', () => {
      const points: Point3D[] = [
        { x: 10, y: 10, z: 0 },
        { x: 50, y: 50, z: 0 },
      ];

      const bbox = calculateBoundingBoxFromLandmarks(points);

      expect(bbox.x).toBeGreaterThanOrEqual(0);
      expect(bbox.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLandmarkPoint', () => {
    it('should return correct landmark', () => {
      const points: Point3D[] = [
        { x: 10, y: 20, z: 30 },
        { x: 40, y: 50, z: 60 },
        { x: 70, y: 80, z: 90 },
      ];

      const point = getLandmarkPoint(points, 1);

      expect(point.x).toBe(40);
      expect(point.y).toBe(50);
      expect(point.z).toBe(60);
    });

    it('should throw error for invalid index', () => {
      const points: Point3D[] = [{ x: 10, y: 20, z: 30 }];

      expect(() => getLandmarkPoint(points, -1)).toThrow('Invalid landmark index');
      expect(() => getLandmarkPoint(points, 10)).toThrow('Invalid landmark index');
    });
  });

  describe('convertToDetectedFace', () => {
    it('should convert MediaPipe result to DetectedFace', () => {
      const mpResult = createMockMediaPipeResult();
      const width = 640;
      const height = 480;

      const face = convertToDetectedFace(mpResult, width, height, 0.95);

      expect(face).toBeDefined();
      expect(face.landmarks).toBeDefined();
      expect(face.landmarks.points.length).toBe(468);
      expect(face.confidence).toBe(0.95);
    });

    it('should include bounding box', () => {
      const mpResult = createMockMediaPipeResult();
      const face = convertToDetectedFace(mpResult, 640, 480, 0.9);

      expect(face.boundingBox).toBeDefined();
      expect(face.boundingBox.width).toBeGreaterThan(0);
      expect(face.boundingBox.height).toBeGreaterThan(0);
    });

    it('should calculate frontality score', () => {
      const mpResult = createMockMediaPipeResult();
      const face = convertToDetectedFace(mpResult, 640, 480, 0.9);

      expect(typeof face.frontalityScore).toBe('number');
      expect(face.frontalityScore).toBeGreaterThanOrEqual(0);
      expect(face.frontalityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('selectBestFace', () => {
    it('should return null for empty array', () => {
      const result = selectBestFace([], 640, 480);
      expect(result).toBeNull();
    });

    it('should return single face when only one provided', () => {
      const mpResult = createMockMediaPipeResult();
      const face = convertToDetectedFace(mpResult, 640, 480, 0.9);
      const faces = [face];

      const best = selectBestFace(faces, 640, 480);

      expect(best).toBe(face);
    });

    it('should select face based on criteria', () => {
      const mpResult1 = createMockMediaPipeResult();
      const mpResult2 = createMockMediaPipeResult();

      const face1 = convertToDetectedFace(mpResult1, 640, 480, 0.7);
      const face2 = convertToDetectedFace(mpResult2, 640, 480, 0.9);

      const best = selectBestFace([face1, face2], 640, 480);

      // Higher confidence face should be preferred
      expect(best).toBeDefined();
    });
  });

  describe('validateFaceAngle', () => {
    it('should validate frontal face', () => {
      const frontalAngle = { pitch: 0, yaw: 0, roll: 0 };
      const result = validateFaceAngle(frontalAngle);

      expect(result.isValid).toBe(true);
      expect(typeof result.feedback).toBe('string');
    });

    it('should reject extreme angles', () => {
      const sideAngle = { pitch: 0, yaw: 45, roll: 0 };
      const result = validateFaceAngle(sideAngle);

      expect(result.isValid).toBe(false);
    });
  });
});

// ============================================
// Fallback 테스트
// ============================================

describe('CIE-2 Fallback', () => {
  describe('generateCIE2Fallback', () => {
    it('should return valid CIE2Output with faceDetected: true', () => {
      const result = generateCIE2Fallback(100);

      expect(result.success).toBe(true);
      expect(result.faceDetected).toBe(true);
      expect(result.faceCount).toBe(1);
      expect(result.metadata.modelVersion).toBe('fallback');
    });

    it('should include processing time', () => {
      const processingTime = 250;
      const result = generateCIE2Fallback(processingTime);

      expect(result.metadata.processingTime).toBe(processingTime);
    });
  });

  describe('generateNoFaceFallback', () => {
    it('should return faceDetected: false', () => {
      const result = generateNoFaceFallback();

      expect(result.success).toBe(true);
      expect(result.faceDetected).toBe(false);
      expect(result.faceCount).toBe(0);
    });

    it('should have invalid angle validation', () => {
      const result = generateNoFaceFallback();

      expect(result.validation.isAngleValid).toBe(false);
      expect(result.validation.frontalityResult.score).toBe(0);
    });
  });

  describe('generateErrorFallback', () => {
    it('should return success: false', () => {
      const result = generateErrorFallback('Test error message');

      expect(result.success).toBe(false);
      expect(result.faceDetected).toBe(false);
    });

    it('should include error message in feedback', () => {
      const errorMsg = 'Face detection failed';
      const result = generateErrorFallback(errorMsg);

      expect(result.validation.angleFeedback).toBe(errorMsg);
      expect(result.validation.frontalityResult.feedback).toBe(errorMsg);
    });

    it('should have error model version', () => {
      const result = generateErrorFallback('Error');

      expect(result.metadata.modelVersion).toBe('error');
    });
  });

  describe('generateRandomCIE2Mock', () => {
    it('should generate valid CIE2Output', () => {
      const result = generateRandomCIE2Mock();

      expect(result.success).toBe(true);
      expect(typeof result.faceDetected).toBe('boolean');
      expect(typeof result.faceCount).toBe('number');
    });

    it('should have different results on multiple calls', () => {
      const results = Array.from({ length: 10 }, () => generateRandomCIE2Mock());

      // 10번 호출 시 최소 하나는 다른 frontality score를 가져야 함
      const scores = results.map((r) => r.validation.frontalityResult.score);
      const uniqueScores = new Set(scores);
      expect(uniqueScores.size).toBeGreaterThan(1);
    });

    it('should have mock model version', () => {
      const result = generateRandomCIE2Mock();

      expect(result.metadata.modelVersion).toBe('mock');
    });
  });

  describe('generateFrontalityFallback', () => {
    it('should return valid frontality result', () => {
      const result = generateFrontalityFallback();

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.angleDeviations).toBeDefined();
    });
  });
});

// ============================================
// Region Extractor 테스트
// ============================================

describe('CIE-2 Region Extractor', () => {
  describe('normalizeBoundingBox', () => {
    it('should normalize bounding box to image bounds', () => {
      const bbox = { x: -10, y: -5, width: 200, height: 150 };
      const imageWidth = 100;
      const imageHeight = 100;

      const normalized = normalizeBoundingBox(bbox, imageWidth, imageHeight);

      expect(normalized.x).toBeGreaterThanOrEqual(0);
      expect(normalized.y).toBeGreaterThanOrEqual(0);
      expect(normalized.x + normalized.width).toBeLessThanOrEqual(imageWidth);
      expect(normalized.y + normalized.height).toBeLessThanOrEqual(imageHeight);
    });

    it('should handle bbox fully within image', () => {
      const bbox = { x: 10, y: 10, width: 50, height: 50 };
      const normalized = normalizeBoundingBox(bbox, 100, 100);

      expect(normalized.x).toBe(10);
      expect(normalized.y).toBe(10);
      expect(normalized.width).toBe(50);
      expect(normalized.height).toBe(50);
    });
  });

  describe('getPaddedBoundingBox', () => {
    it('should add padding to bounding box', () => {
      const bbox = { x: 100, y: 100, width: 100, height: 100 };
      const paddingRatio = 0.2;
      const imageWidth = 640;
      const imageHeight = 480;

      // 함수 시그니처: (box, imageWidth, imageHeight, paddingRatio)
      const padded = getPaddedBoundingBox(bbox, imageWidth, imageHeight, paddingRatio);

      // 20% 패딩이 적용되면 너비/높이가 증가해야 함
      // 원래 100 + 100 * 0.2 * 2 = 140 (양쪽 패딩)
      expect(padded.width).toBeGreaterThan(bbox.width);
      expect(padded.height).toBeGreaterThan(bbox.height);
    });

    it('should respect image boundaries', () => {
      const bbox = { x: 10, y: 10, width: 100, height: 100 };
      const imageWidth = 120;
      const imageHeight = 120;

      const padded = getPaddedBoundingBox(bbox, imageWidth, imageHeight, 0.5);

      // 패딩이 이미지 경계를 넘지 않아야 함
      expect(padded.x).toBeGreaterThanOrEqual(0);
      expect(padded.y).toBeGreaterThanOrEqual(0);
      expect(padded.x + padded.width).toBeLessThanOrEqual(imageWidth);
      expect(padded.y + padded.height).toBeLessThanOrEqual(imageHeight);
    });
  });

  describe('extractFaceRegion', () => {
    it('should extract face region data', () => {
      const imageData = createTestRGBImageData(640, 480);
      const mpResult = createMockMediaPipeResult();
      const face = convertToDetectedFace(mpResult, 640, 480, 0.9);

      const region = extractFaceRegion(imageData, face);

      // FaceRegion 구조: { imageData, boundingBox, landmarks }
      expect(region).toBeDefined();
      expect(region.imageData).toBeDefined();
      expect(region.imageData.width).toBeGreaterThan(0);
      expect(region.imageData.height).toBeGreaterThan(0);
      expect(region.imageData.data).toBeDefined();
      expect(region.boundingBox).toBeDefined();
      expect(region.landmarks).toBeDefined();
    });

    it('should adjust landmark coordinates to region coordinate system', () => {
      const imageData = createTestRGBImageData(640, 480);
      const mpResult = createMockMediaPipeResult();
      const face = convertToDetectedFace(mpResult, 640, 480, 0.9);

      const region = extractFaceRegion(imageData, face);

      // 랜드마크가 영역 좌표계로 조정되어야 함
      expect(region.landmarks.points.length).toBe(face.landmarks.points.length);
      expect(region.landmarks.confidence).toBe(face.landmarks.confidence);
    });
  });
});

// ============================================
// 통합 테스트
// ============================================

describe('CIE-2 Integration', () => {
  it('should process full pipeline with mock data', () => {
    const imageData = createTestRGBImageData(640, 480);

    // 1. Generate mock MediaPipe result
    const mpResult = generateMockMediaPipeResult(640, 480);

    // 2. Process through main processor
    const output = processMediaPipeResults(imageData, [mpResult]);

    // 3. Validate output structure
    expect(output.success).toBe(true);
    expect(output.faceDetected).toBe(true);
    expect(output.selectedFace).toBeDefined();
    expect(output.validation.frontalityResult).toBeDefined();
    expect(output.metadata.processingTime).toBeGreaterThanOrEqual(0);
  });

  it('should use processMock as simplified entry point', () => {
    const imageData = createTestRGBImageData(1024, 768);
    const output = processMock(imageData);

    expect(output.success).toBe(true);
    expect(output.faceDetected).toBe(true);
  });

  it('should handle fallback scenario gracefully', () => {
    const fallback = generateCIE2Fallback(500);

    // Fallback should be usable by downstream modules
    expect(fallback.validation.frontalityResult.score).toBeGreaterThan(0);
    expect(fallback.metadata.confidence).toBeGreaterThan(0);
  });
});
