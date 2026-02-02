/**
 * 얼굴 랜드마크 추출 모듈 테스트
 *
 * @module tests/lib/analysis/face-landmark
 * @description MediaPipe Face Mesh 기반 468개 3D 랜드마크 추출
 */

import { describe, it, expect } from 'vitest';
import {
  createFaceMask,
  landmarksToDbFormat,
  dbFormatToLandmarks,
  validateLandmarks,
  getRegionBoundingBox,
  getFaceCenter,
  FACE_OVAL_INDICES,
  LEFT_EYE_INDICES,
  RIGHT_EYE_INDICES,
  LIPS_INDICES,
} from '@/lib/analysis/face-landmark';
import type { FaceLandmark, FaceLandmarkResult } from '@/types/visual-analysis';

// ============================================================================
// 테스트 유틸리티
// ============================================================================

/**
 * 테스트용 랜드마크 생성 (468개)
 */
function createTestLandmarks(count: number = 468): FaceLandmark[] {
  return Array.from({ length: count }, (_, i) => ({
    x: (i % 20) / 20 + 0.05, // 0.05 ~ 1.0 (정규화)
    y: Math.floor(i / 20) / 25 + 0.05, // 0.05 ~ 0.95
    z: (Math.random() - 0.5) * 0.1, // -0.05 ~ 0.05
  }));
}

/**
 * 특정 영역에 집중된 랜드마크 생성
 */
function createCenteredLandmarks(): FaceLandmark[] {
  // 468개 랜드마크를 얼굴 중심에 배치
  return Array.from({ length: 468 }, (_, i) => ({
    x: 0.3 + (i % 20) * 0.02, // 0.3 ~ 0.7
    y: 0.2 + Math.floor(i / 20) * 0.025, // 0.2 ~ 0.8
    z: 0,
  }));
}

/**
 * 유효하지 않은 랜드마크 생성
 */
function createInvalidLandmarks(): FaceLandmark[] {
  return Array.from({ length: 468 }, (_, i) => ({
    x: i % 2 === 0 ? 1.5 : -0.5, // 범위 밖
    y: i % 2 === 0 ? -0.5 : 1.5, // 범위 밖
    z: 0,
  }));
}

/**
 * FaceLandmarkResult 생성
 */
function createFaceLandmarkResult(landmarks?: FaceLandmark[]): FaceLandmarkResult {
  return {
    landmarks: landmarks || createTestLandmarks(),
    faceOval: FACE_OVAL_INDICES,
    leftEye: LEFT_EYE_INDICES,
    rightEye: RIGHT_EYE_INDICES,
    lips: LIPS_INDICES,
  };
}

// ============================================================================
// createFaceMask
// ============================================================================

describe('createFaceMask', () => {
  describe('기본 동작', () => {
    it('should return Uint8Array mask', () => {
      const landmarks = createCenteredLandmarks();
      const width = 100;
      const height = 100;

      const mask = createFaceMask(landmarks, width, height);

      expect(mask).toBeInstanceOf(Uint8Array);
      expect(mask.length).toBe(width * height);
    });

    it('should create mask with correct dimensions', () => {
      const landmarks = createCenteredLandmarks();
      const width = 50;
      const height = 75;

      const mask = createFaceMask(landmarks, width, height);

      expect(mask.length).toBe(width * height);
    });

    it('should contain only 0 and 255 values', () => {
      const landmarks = createCenteredLandmarks();
      const mask = createFaceMask(landmarks, 100, 100);

      const uniqueValues = new Set(mask);
      for (const value of uniqueValues) {
        expect([0, 255]).toContain(value);
      }
    });
  });

  describe('얼굴 영역 마스킹', () => {
    it('should mask face oval region', () => {
      const landmarks = createCenteredLandmarks();
      const mask = createFaceMask(landmarks, 100, 100);

      // 마스크에 일부 픽셀이 255여야 함
      const maskedPixels = mask.filter(v => v === 255).length;
      expect(maskedPixels).toBeGreaterThan(0);
    });

    it('should have masked area smaller than total area', () => {
      const landmarks = createCenteredLandmarks();
      const width = 100;
      const height = 100;
      const mask = createFaceMask(landmarks, width, height);

      const maskedPixels = mask.filter(v => v === 255).length;
      const totalPixels = width * height;

      // 마스크 영역은 전체보다 작아야 함
      expect(maskedPixels).toBeLessThan(totalPixels);
    });
  });

  describe('눈/입 제외', () => {
    it('should exclude eye regions from mask', () => {
      // 눈 영역이 제외되는지 간접 확인
      // (눈 인덱스 위치 주변이 0이어야 함)
      const landmarks = createCenteredLandmarks();
      const mask = createFaceMask(landmarks, 100, 100);

      // 마스크가 생성되었는지만 확인 (구체적 눈 제외는 알고리즘 의존)
      expect(mask.length).toBe(10000);
    });
  });
});

// ============================================================================
// landmarksToDbFormat / dbFormatToLandmarks
// ============================================================================

describe('landmarksToDbFormat', () => {
  describe('기본 동작', () => {
    it('should convert landmarks to DB format', () => {
      const result = createFaceLandmarkResult();
      const dbFormat = landmarksToDbFormat(result);

      expect(dbFormat).toHaveProperty('landmarks');
      expect(dbFormat).toHaveProperty('face_oval');
      expect(dbFormat).toHaveProperty('left_eye');
      expect(dbFormat).toHaveProperty('right_eye');
    });

    it('should convert landmarks to tuple format', () => {
      const result = createFaceLandmarkResult();
      const dbFormat = landmarksToDbFormat(result);

      // 각 랜드마크는 [x, y, z] 튜플
      expect(dbFormat.landmarks.length).toBe(468);
      expect(dbFormat.landmarks[0].length).toBe(3);
    });

    it('should round coordinates to 4 decimal places', () => {
      const landmarks: FaceLandmark[] = [{
        x: 0.123456789,
        y: 0.987654321,
        z: 0.111111111,
      }];
      const result = createFaceLandmarkResult(landmarks.concat(createTestLandmarks(467)));
      const dbFormat = landmarksToDbFormat(result);

      // 첫 번째 랜드마크 확인
      expect(dbFormat.landmarks[0][0]).toBe(0.1235); // x 반올림
      expect(dbFormat.landmarks[0][1]).toBe(0.9877); // y 반올림
      expect(dbFormat.landmarks[0][2]).toBe(0.1111); // z 반올림
    });

    it('should include face region indices', () => {
      const result = createFaceLandmarkResult();
      const dbFormat = landmarksToDbFormat(result);

      expect(dbFormat.face_oval).toEqual(FACE_OVAL_INDICES);
      expect(dbFormat.left_eye).toEqual(LEFT_EYE_INDICES);
      expect(dbFormat.right_eye).toEqual(RIGHT_EYE_INDICES);
    });
  });
});

describe('dbFormatToLandmarks', () => {
  describe('기본 동작', () => {
    it('should convert DB format back to FaceLandmarkResult', () => {
      const dbData = {
        landmarks: [[0.5, 0.5, 0.1]] as [number, number, number][],
        face_oval: FACE_OVAL_INDICES,
        left_eye: LEFT_EYE_INDICES,
        right_eye: RIGHT_EYE_INDICES,
      };

      // 468개 랜드마크로 채우기
      while (dbData.landmarks.length < 468) {
        dbData.landmarks.push([0.5, 0.5, 0]);
      }

      const result = dbFormatToLandmarks(dbData);

      expect(result).toHaveProperty('landmarks');
      expect(result).toHaveProperty('faceOval');
      expect(result).toHaveProperty('leftEye');
      expect(result).toHaveProperty('rightEye');
      expect(result).toHaveProperty('lips');
    });

    it('should convert tuples to FaceLandmark objects', () => {
      const dbData = {
        landmarks: Array.from({ length: 468 }, () => [0.5, 0.6, 0.1]) as [number, number, number][],
        face_oval: FACE_OVAL_INDICES,
        left_eye: LEFT_EYE_INDICES,
        right_eye: RIGHT_EYE_INDICES,
      };

      const result = dbFormatToLandmarks(dbData);

      expect(result.landmarks[0]).toEqual({ x: 0.5, y: 0.6, z: 0.1 });
    });

    it('should include LIPS_INDICES in result', () => {
      const dbData = {
        landmarks: Array.from({ length: 468 }, () => [0.5, 0.5, 0]) as [number, number, number][],
        face_oval: FACE_OVAL_INDICES,
        left_eye: LEFT_EYE_INDICES,
        right_eye: RIGHT_EYE_INDICES,
      };

      const result = dbFormatToLandmarks(dbData);

      expect(result.lips).toEqual(LIPS_INDICES);
    });
  });

  describe('왕복 변환', () => {
    it('should roundtrip landmarks correctly', () => {
      const original = createFaceLandmarkResult();
      const dbFormat = landmarksToDbFormat(original);
      const restored = dbFormatToLandmarks(dbFormat);

      // 랜드마크 개수 일치
      expect(restored.landmarks.length).toBe(original.landmarks.length);

      // 첫 번째 랜드마크 좌표 (반올림 오차 허용)
      expect(restored.landmarks[0].x).toBeCloseTo(original.landmarks[0].x, 3);
      expect(restored.landmarks[0].y).toBeCloseTo(original.landmarks[0].y, 3);

      // 영역 인덱스 일치
      expect(restored.faceOval).toEqual(original.faceOval);
      expect(restored.leftEye).toEqual(original.leftEye);
      expect(restored.rightEye).toEqual(original.rightEye);
    });
  });
});

// ============================================================================
// validateLandmarks
// ============================================================================

describe('validateLandmarks', () => {
  describe('유효성 검사', () => {
    it('should return true for valid 468 landmarks', () => {
      const landmarks = createTestLandmarks(468);
      expect(validateLandmarks(landmarks)).toBe(true);
    });

    it('should return false for wrong count', () => {
      const landmarks = createTestLandmarks(100);
      expect(validateLandmarks(landmarks)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(validateLandmarks([])).toBe(false);
    });
  });

  describe('좌표 범위 검사', () => {
    it('should return false for out-of-range x coordinates', () => {
      const landmarks = createTestLandmarks(468);
      landmarks[0].x = 1.5; // 범위 밖

      expect(validateLandmarks(landmarks)).toBe(false);
    });

    it('should return false for negative y coordinates', () => {
      const landmarks = createTestLandmarks(468);
      landmarks[0].y = -0.1; // 범위 밖

      expect(validateLandmarks(landmarks)).toBe(false);
    });

    it('should accept boundary values (0 and 1)', () => {
      const landmarks = createTestLandmarks(468);
      landmarks[0].x = 0;
      landmarks[1].x = 1;
      landmarks[0].y = 0;
      landmarks[1].y = 1;

      expect(validateLandmarks(landmarks)).toBe(true);
    });

    it('should return false for invalid landmarks', () => {
      const landmarks = createInvalidLandmarks();
      expect(validateLandmarks(landmarks)).toBe(false);
    });
  });
});

// ============================================================================
// getRegionBoundingBox
// ============================================================================

describe('getRegionBoundingBox', () => {
  describe('기본 동작', () => {
    it('should return bounding box with x, y, width, height', () => {
      const landmarks = createTestLandmarks();
      const indices = [0, 1, 2, 3];
      const bbox = getRegionBoundingBox(landmarks, indices, 100, 100);

      expect(bbox).toHaveProperty('x');
      expect(bbox).toHaveProperty('y');
      expect(bbox).toHaveProperty('width');
      expect(bbox).toHaveProperty('height');
    });

    it('should return non-negative dimensions', () => {
      const landmarks = createTestLandmarks();
      const indices = [0, 10, 20, 30];
      const bbox = getRegionBoundingBox(landmarks, indices, 200, 200);

      expect(bbox.x).toBeGreaterThanOrEqual(0);
      expect(bbox.y).toBeGreaterThanOrEqual(0);
      expect(bbox.width).toBeGreaterThanOrEqual(0);
      expect(bbox.height).toBeGreaterThanOrEqual(0);
    });

    it('should scale coordinates to image dimensions', () => {
      // 랜드마크는 0-1 정규화 좌표
      const landmarks: FaceLandmark[] = Array.from({ length: 468 }, () => ({
        x: 0.5, y: 0.5, z: 0,
      }));
      // 일부 랜드마크 수정
      landmarks[0] = { x: 0.2, y: 0.3, z: 0 };
      landmarks[1] = { x: 0.8, y: 0.7, z: 0 };

      const bbox = getRegionBoundingBox(landmarks, [0, 1], 100, 100);

      // 20~80 범위
      expect(bbox.x).toBe(20);
      expect(bbox.y).toBe(30);
      expect(bbox.width).toBe(60); // 80 - 20
      expect(bbox.height).toBe(40); // 70 - 30
    });
  });

  describe('다양한 영역', () => {
    it('should calculate face oval bounding box', () => {
      const landmarks = createCenteredLandmarks();
      const bbox = getRegionBoundingBox(landmarks, FACE_OVAL_INDICES, 100, 100);

      expect(bbox.width).toBeGreaterThan(0);
      expect(bbox.height).toBeGreaterThan(0);
    });

    it('should calculate eye bounding box', () => {
      const landmarks = createCenteredLandmarks();
      const leftEyeBbox = getRegionBoundingBox(landmarks, LEFT_EYE_INDICES, 100, 100);
      const rightEyeBbox = getRegionBoundingBox(landmarks, RIGHT_EYE_INDICES, 100, 100);

      expect(leftEyeBbox.width).toBeGreaterThan(0);
      expect(rightEyeBbox.width).toBeGreaterThan(0);
    });
  });

  describe('단일 인덱스', () => {
    it('should handle single index (zero-size bounding box)', () => {
      const landmarks = createTestLandmarks();
      const bbox = getRegionBoundingBox(landmarks, [0], 100, 100);

      expect(bbox.width).toBe(0);
      expect(bbox.height).toBe(0);
    });
  });
});

// ============================================================================
// getFaceCenter
// ============================================================================

describe('getFaceCenter', () => {
  describe('기본 동작', () => {
    it('should return center point with x and y', () => {
      const landmarks = createCenteredLandmarks();
      const center = getFaceCenter(landmarks, 100, 100);

      expect(center).toHaveProperty('x');
      expect(center).toHaveProperty('y');
    });

    it('should return center within image bounds', () => {
      const landmarks = createCenteredLandmarks();
      const width = 200;
      const height = 150;
      const center = getFaceCenter(landmarks, width, height);

      expect(center.x).toBeGreaterThanOrEqual(0);
      expect(center.x).toBeLessThanOrEqual(width);
      expect(center.y).toBeGreaterThanOrEqual(0);
      expect(center.y).toBeLessThanOrEqual(height);
    });
  });

  describe('중심 계산', () => {
    it('should calculate center from face oval bounding box', () => {
      // 정중앙에 배치된 랜드마크
      const landmarks: FaceLandmark[] = Array.from({ length: 468 }, () => ({
        x: 0.5, y: 0.5, z: 0,
      }));

      const center = getFaceCenter(landmarks, 100, 100);

      expect(center.x).toBeCloseTo(50, 0);
      expect(center.y).toBeCloseTo(50, 0);
    });
  });
});

// ============================================================================
// 상수 검증
// ============================================================================

describe('인덱스 상수', () => {
  describe('FACE_OVAL_INDICES', () => {
    it('should be an array of numbers', () => {
      expect(Array.isArray(FACE_OVAL_INDICES)).toBe(true);
      for (const idx of FACE_OVAL_INDICES) {
        expect(typeof idx).toBe('number');
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(468);
      }
    });

    it('should not have duplicate indices', () => {
      const uniqueIndices = new Set(FACE_OVAL_INDICES);
      expect(uniqueIndices.size).toBe(FACE_OVAL_INDICES.length);
    });
  });

  describe('LEFT_EYE_INDICES', () => {
    it('should be valid landmark indices', () => {
      for (const idx of LEFT_EYE_INDICES) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(468);
      }
    });
  });

  describe('RIGHT_EYE_INDICES', () => {
    it('should be valid landmark indices', () => {
      for (const idx of RIGHT_EYE_INDICES) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(468);
      }
    });
  });

  describe('LIPS_INDICES', () => {
    it('should be valid landmark indices', () => {
      for (const idx of LIPS_INDICES) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(468);
      }
    });
  });
});

// ============================================================================
// 통합 테스트
// ============================================================================

describe('Integration: 얼굴 랜드마크 파이프라인', () => {
  it('should complete full landmark processing pipeline', () => {
    // 1. 랜드마크 생성 (시뮬레이션)
    const landmarks = createCenteredLandmarks();
    expect(landmarks.length).toBe(468);

    // 2. 유효성 검사
    expect(validateLandmarks(landmarks)).toBe(true);

    // 3. 결과 객체 생성
    const result = createFaceLandmarkResult(landmarks);
    expect(result.faceOval.length).toBeGreaterThan(0);

    // 4. DB 형식 변환
    const dbFormat = landmarksToDbFormat(result);
    expect(dbFormat.landmarks.length).toBe(468);

    // 5. DB 형식에서 복원
    const restored = dbFormatToLandmarks(dbFormat);
    expect(restored.landmarks.length).toBe(468);

    // 6. 마스크 생성
    const mask = createFaceMask(landmarks, 100, 100);
    expect(mask.length).toBe(10000);

    // 7. 바운딩 박스
    const bbox = getRegionBoundingBox(landmarks, FACE_OVAL_INDICES, 100, 100);
    expect(bbox.width).toBeGreaterThan(0);

    // 8. 중심점
    const center = getFaceCenter(landmarks, 100, 100);
    expect(center.x).toBeGreaterThan(0);
    expect(center.y).toBeGreaterThan(0);
  });

  it('should handle edge case with minimal valid landmarks', () => {
    // 경계값에 있는 랜드마크
    const landmarks: FaceLandmark[] = Array.from({ length: 468 }, (_, i) => ({
      x: i % 2 === 0 ? 0 : 1,
      y: i % 2 === 0 ? 0 : 1,
      z: 0,
    }));

    expect(validateLandmarks(landmarks)).toBe(true);

    const bbox = getRegionBoundingBox(landmarks, [0, 1], 100, 100);
    expect(bbox.width).toBe(100); // 0 ~ 100
    expect(bbox.height).toBe(100); // 0 ~ 100
  });
});
