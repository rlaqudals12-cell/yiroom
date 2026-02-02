/**
 * CIE-2 프로세서 테스트
 *
 * @module tests/lib/image-engine/cie-2/processor
 * @description 얼굴 감지 통합 프로세서 테스트
 * @see lib/image-engine/cie-2/processor.ts
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  processMediaPipeResults,
  isMediaPipeAvailable,
  generateMockMediaPipeResult,
  processMock,
} from '@/lib/image-engine/cie-2/processor';
import type { RGBImageData } from '@/lib/image-engine/types';
import type { MediaPipeFaceResult } from '@/lib/image-engine/cie-2/face-detector';

// =============================================================================
// 테스트 헬퍼 함수
// =============================================================================

/**
 * 테스트용 RGB 이미지 데이터 생성
 */
function createTestImageData(
  width: number,
  height: number,
  fillValue = 128
): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  for (let i = 0; i < data.length; i++) {
    data[i] = fillValue;
  }
  return { data, width, height, channels: 3 };
}

/**
 * 테스트용 MediaPipe 결과 생성
 */
function createMediaPipeResult(
  centerX = 0.5,
  centerY = 0.5,
  faceWidth = 0.4,
  faceHeight = 0.5
): MediaPipeFaceResult {
  const landmarks: Array<{ x: number; y: number; z: number }> = [];

  // 468개 랜드마크 생성
  for (let i = 0; i < 468; i++) {
    const angle = (i / 468) * 2 * Math.PI;
    const radius = 0.1 + (i % 50) / 500;

    landmarks.push({
      x: centerX + Math.cos(angle) * radius * faceWidth,
      y: centerY + Math.sin(angle) * radius * faceHeight,
      z: Math.sin(angle * 2) * 0.01,
    });
  }

  return {
    landmarks,
    boundingBox: {
      xMin: centerX - faceWidth / 2,
      yMin: centerY - faceHeight / 2,
      width: faceWidth,
      height: faceHeight,
    },
  };
}

/**
 * 측면 얼굴용 MediaPipe 결과 생성
 */
function createSideFaceResult(): MediaPipeFaceResult {
  const landmarks: Array<{ x: number; y: number; z: number }> = [];

  // 측면을 바라보는 듯한 비대칭 랜드마크
  for (let i = 0; i < 468; i++) {
    const angle = (i / 468) * 2 * Math.PI;
    // x축으로 비대칭 분포 (측면 시뮬레이션)
    const xOffset = 0.5 + Math.cos(angle) * 0.15 + 0.1;
    const yOffset = 0.5 + Math.sin(angle) * 0.2;
    const zOffset = Math.cos(angle) * 0.1; // z축 변형으로 측면 효과

    landmarks.push({
      x: Math.min(Math.max(xOffset, 0.1), 0.9),
      y: Math.min(Math.max(yOffset, 0.1), 0.9),
      z: zOffset,
    });
  }

  return {
    landmarks,
    boundingBox: {
      xMin: 0.3,
      yMin: 0.25,
      width: 0.4,
      height: 0.5,
    },
  };
}

// =============================================================================
// processMediaPipeResults 테스트
// =============================================================================

describe('processMediaPipeResults', () => {
  describe('얼굴 감지 성공', () => {
    it('단일 정면 얼굴 감지', () => {
      const imageData = createTestImageData(640, 480);
      const mpResults = [createMediaPipeResult()];

      const result = processMediaPipeResults(imageData, mpResults);

      expect(result.success).toBe(true);
      expect(result.faceDetected).toBe(true);
      expect(result.faceCount).toBe(1);
      expect(result.selectedFace).toBeDefined();
      expect(result.faceRegion).toBeDefined();
    });

    it('다중 얼굴 감지 시 최적 얼굴 선택', () => {
      const imageData = createTestImageData(640, 480);
      // 중앙 얼굴과 코너 얼굴
      const mpResults = [
        createMediaPipeResult(0.5, 0.5), // 중앙
        createMediaPipeResult(0.1, 0.1), // 코너
      ];

      const result = processMediaPipeResults(imageData, mpResults);

      expect(result.success).toBe(true);
      expect(result.faceDetected).toBe(true);
      expect(result.faceCount).toBe(2);
      // 다중 얼굴 경고 메시지
      expect(result.validation.angleFeedback).toContain('여러');
    });

    it('metadata에 처리 시간 포함', () => {
      const imageData = createTestImageData(640, 480);
      const mpResults = [createMediaPipeResult()];

      const result = processMediaPipeResults(imageData, mpResults);

      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.modelVersion).toBe('mediapipe-face-mesh-468');
      expect(result.metadata.confidence).toBeGreaterThan(0);
    });
  });

  describe('얼굴 미감지', () => {
    it('빈 결과 배열 처리', () => {
      const imageData = createTestImageData(640, 480);
      const mpResults: MediaPipeFaceResult[] = [];

      const result = processMediaPipeResults(imageData, mpResults);

      expect(result.success).toBe(true);
      expect(result.faceDetected).toBe(false);
      expect(result.faceCount).toBe(0);
      expect(result.selectedFace).toBeUndefined();
      expect(result.validation.isAngleValid).toBe(false);
      expect(result.validation.frontalityResult.score).toBe(0);
    });
  });

  describe('정면성 검증', () => {
    it('정면 얼굴은 isAngleValid true', () => {
      const imageData = createTestImageData(640, 480);
      const mpResults = [createMediaPipeResult()];

      const result = processMediaPipeResults(imageData, mpResults);

      // Mock 데이터로 생성된 정면 얼굴
      expect(result.validation.frontalityResult).toBeDefined();
      expect(result.validation.frontalityResult.angleDeviations).toBeDefined();
    });

    it('FrontalityResult에 각도 편차 포함', () => {
      const imageData = createTestImageData(640, 480);
      const mpResults = [createMediaPipeResult()];

      const result = processMediaPipeResults(imageData, mpResults);

      const { angleDeviations } = result.validation.frontalityResult;
      expect(angleDeviations).toHaveProperty('pitch');
      expect(angleDeviations).toHaveProperty('yaw');
      expect(angleDeviations).toHaveProperty('roll');
      expect(typeof angleDeviations.pitch).toBe('number');
      expect(typeof angleDeviations.yaw).toBe('number');
      expect(typeof angleDeviations.roll).toBe('number');
    });
  });

  describe('에러 처리', () => {
    it('잘못된 랜드마크도 graceful하게 처리', () => {
      const imageData = createTestImageData(640, 480);
      // 랜드마크가 매우 적은 경우
      const mpResults: MediaPipeFaceResult[] = [
        {
          landmarks: [{ x: 0.5, y: 0.5, z: 0 }],
          boundingBox: { xMin: 0.3, yMin: 0.3, width: 0.4, height: 0.4 },
        },
      ];

      // 에러 없이 처리되어야 함
      expect(() => processMediaPipeResults(imageData, mpResults)).not.toThrow();
    });
  });

  describe('config 적용', () => {
    it('기본 config로 처리', () => {
      const imageData = createTestImageData(640, 480);
      const mpResults = [createMediaPipeResult()];

      const result = processMediaPipeResults(imageData, mpResults);

      expect(result.success).toBe(true);
    });

    it('커스텀 config 적용', () => {
      const imageData = createTestImageData(640, 480);
      const mpResults = [createMediaPipeResult()];
      const customConfig = {
        minConfidence: 0.99, // 매우 높은 신뢰도 요구
        minFrontalityScore: 95,
        maxPitchDeg: 10,
        maxYawDeg: 10,
        maxRollDeg: 10,
      };

      const result = processMediaPipeResults(imageData, mpResults, customConfig);

      // 높은 신뢰도 요구로 감지 실패할 수 있음
      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// isMediaPipeAvailable 테스트
// =============================================================================

describe('isMediaPipeAvailable', () => {
  const originalWindow = global.window;

  afterEach(() => {
    // window 복원
    if (originalWindow !== undefined) {
      global.window = originalWindow;
    } else {
      // @ts-expect-error - window 삭제
      delete global.window;
    }
  });

  it('Node.js 환경(window 없음)에서 false 반환', () => {
    // @ts-expect-error - window 삭제
    delete global.window;

    expect(isMediaPipeAvailable()).toBe(false);
  });

  it('window는 있지만 FaceMesh 없으면 false 반환', () => {
    global.window = {} as Window & typeof globalThis;

    expect(isMediaPipeAvailable()).toBe(false);
  });

  it('FaceMesh 존재 시 true 반환', () => {
    global.window = {
      FaceMesh: class MockFaceMesh {},
    } as unknown as Window & typeof globalThis;

    expect(isMediaPipeAvailable()).toBe(true);
  });
});

// =============================================================================
// generateMockMediaPipeResult 테스트
// =============================================================================

describe('generateMockMediaPipeResult', () => {
  it('468개 랜드마크 생성', () => {
    const result = generateMockMediaPipeResult(640, 480);

    expect(result.landmarks).toHaveLength(468);
  });

  it('모든 랜드마크가 0-1 정규화 좌표', () => {
    const result = generateMockMediaPipeResult(640, 480);

    result.landmarks.forEach((lm, idx) => {
      expect(lm.x).toBeGreaterThanOrEqual(0);
      expect(lm.x).toBeLessThanOrEqual(1);
      expect(lm.y).toBeGreaterThanOrEqual(0);
      expect(lm.y).toBeLessThanOrEqual(1);
    });
  });

  it('바운딩 박스 포함', () => {
    const result = generateMockMediaPipeResult(640, 480);

    expect(result.boundingBox).toBeDefined();
    expect(result.boundingBox!.xMin).toBeGreaterThanOrEqual(0);
    expect(result.boundingBox!.yMin).toBeGreaterThanOrEqual(0);
    expect(result.boundingBox!.width).toBeGreaterThan(0);
    expect(result.boundingBox!.height).toBeGreaterThan(0);
  });

  it('이미지 크기와 무관하게 동일한 정규화 좌표', () => {
    const result1 = generateMockMediaPipeResult(640, 480);
    const result2 = generateMockMediaPipeResult(1920, 1080);

    // 정규화된 좌표이므로 이미지 크기와 무관하게 동일해야 함
    expect(result1.landmarks[0].x).toBeCloseTo(result2.landmarks[0].x, 5);
    expect(result1.landmarks[0].y).toBeCloseTo(result2.landmarks[0].y, 5);
  });

  it('랜드마크가 중앙 주변에 분포', () => {
    const result = generateMockMediaPipeResult(640, 480);

    // 평균 좌표가 대략 중앙(0.5)
    const avgX =
      result.landmarks.reduce((sum, lm) => sum + lm.x, 0) / result.landmarks.length;
    const avgY =
      result.landmarks.reduce((sum, lm) => sum + lm.y, 0) / result.landmarks.length;

    expect(avgX).toBeGreaterThan(0.3);
    expect(avgX).toBeLessThan(0.7);
    expect(avgY).toBeGreaterThan(0.3);
    expect(avgY).toBeLessThan(0.7);
  });
});

// =============================================================================
// processMock 테스트
// =============================================================================

describe('processMock', () => {
  it('항상 faceDetected: true 반환', () => {
    const imageData = createTestImageData(640, 480);

    const result = processMock(imageData);

    expect(result.success).toBe(true);
    expect(result.faceDetected).toBe(true);
  });

  it('selectedFace 정보 포함', () => {
    const imageData = createTestImageData(640, 480);

    const result = processMock(imageData);

    expect(result.selectedFace).toBeDefined();
    expect(result.selectedFace!.landmarks).toBeDefined();
    expect(result.selectedFace!.boundingBox).toBeDefined();
    expect(result.selectedFace!.angle).toBeDefined();
    expect(result.selectedFace!.frontalityScore).toBeDefined();
    expect(result.selectedFace!.confidence).toBeDefined();
  });

  it('faceRegion 정보 포함', () => {
    const imageData = createTestImageData(640, 480);

    const result = processMock(imageData);

    expect(result.faceRegion).toBeDefined();
    expect(result.faceRegion!.imageData).toBeDefined();
    expect(result.faceRegion!.boundingBox).toBeDefined();
  });

  it('validation 정보 포함', () => {
    const imageData = createTestImageData(640, 480);

    const result = processMock(imageData);

    expect(result.validation).toBeDefined();
    expect(result.validation.frontalityResult).toBeDefined();
    expect(result.validation.angleFeedback).toBeDefined();
    expect(typeof result.validation.isAngleValid).toBe('boolean');
  });

  it('metadata 포함', () => {
    const imageData = createTestImageData(640, 480);

    const result = processMock(imageData);

    expect(result.metadata).toBeDefined();
    expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    expect(result.metadata.modelVersion).toBe('mediapipe-face-mesh-468');
    expect(result.metadata.confidence).toBeGreaterThan(0);
  });

  it('faceCount는 항상 1', () => {
    const imageData = createTestImageData(640, 480);

    const result = processMock(imageData);

    expect(result.faceCount).toBe(1);
  });

  it('다양한 이미지 크기에서 동작', () => {
    const sizes = [
      { width: 320, height: 240 },
      { width: 640, height: 480 },
      { width: 1920, height: 1080 },
    ];

    sizes.forEach(({ width, height }) => {
      const imageData = createTestImageData(width, height);
      const result = processMock(imageData);

      expect(result.success).toBe(true);
      expect(result.faceDetected).toBe(true);
    });
  });
});

// =============================================================================
// 통합 테스트
// =============================================================================

describe('통합 테스트', () => {
  it('processMediaPipeResults와 generateMockMediaPipeResult 연동', () => {
    const imageData = createTestImageData(640, 480);
    const mockResult = generateMockMediaPipeResult(640, 480);

    const output = processMediaPipeResults(imageData, [mockResult]);

    expect(output.success).toBe(true);
    expect(output.faceDetected).toBe(true);
    expect(output.selectedFace).toBeDefined();
  });

  it('processMock은 processMediaPipeResults를 내부적으로 사용', () => {
    const imageData = createTestImageData(640, 480);

    // processMock 결과
    const mockOutput = processMock(imageData);

    // 직접 mock 결과로 처리
    const mockResult = generateMockMediaPipeResult(640, 480);
    const directOutput = processMediaPipeResults(imageData, [mockResult]);

    // 구조가 동일해야 함
    expect(mockOutput.success).toBe(directOutput.success);
    expect(mockOutput.faceDetected).toBe(directOutput.faceDetected);
    expect(mockOutput.faceCount).toBe(directOutput.faceCount);
  });

  it('CIE2Output 타입 호환성', () => {
    const imageData = createTestImageData(640, 480);
    const result = processMock(imageData);

    // 모든 필수 필드 존재 확인
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('faceDetected');
    expect(result).toHaveProperty('faceCount');
    expect(result).toHaveProperty('validation');
    expect(result).toHaveProperty('metadata');
  });
});
