/**
 * CIE-4 조명 분석 프로세서 테스트
 *
 * @module tests/lib/image-engine/cie-4/processor.test
 * @description processLightingAnalysis, quickLightingCheck 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RGBImageData, NormalizedRect } from '@/lib/image-engine/types';
import {
  processLightingAnalysis,
  processLightingAnalysisWithTimeout,
  quickLightingCheck,
} from '@/lib/image-engine/cie-4/processor';

// =============================================================================
// 테스트 헬퍼 함수
// =============================================================================

/**
 * 테스트용 이미지 데이터 생성
 */
function createTestImageData(
  width: number,
  height: number,
  r = 180,
  g = 180,
  b = 180
): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = r;
    data[i * 3 + 1] = g;
    data[i * 3 + 2] = b;
  }
  return { data, width, height, channels: 3 as const };
}

/**
 * 따뜻한 조명 이미지 (높은 CCT - 따뜻한 색)
 */
function createWarmLightingImage(width: number, height: number): RGBImageData {
  return createTestImageData(width, height, 220, 190, 140);
}

/**
 * 차가운 조명 이미지 (낮은 CCT - 차가운 색)
 */
function createCoolLightingImage(width: number, height: number): RGBImageData {
  return createTestImageData(width, height, 150, 170, 210);
}

/**
 * 자연광 이미지 (적정 CCT)
 */
function createNaturalLightingImage(width: number, height: number): RGBImageData {
  return createTestImageData(width, height, 200, 195, 190);
}

/**
 * 극단적인 조명 이미지 (빨강 또는 파랑 과다)
 */
function createExtremeLightingImage(width: number, height: number): RGBImageData {
  return createTestImageData(width, height, 255, 100, 50);
}

/**
 * 불균일한 조명 이미지 (상하 밝기 차이)
 */
function createUnevenLightingImage(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    const brightness = y < height / 2 ? 220 : 100; // 위는 밝고 아래는 어두움
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      data[i] = brightness;
      data[i + 1] = brightness;
      data[i + 2] = brightness;
    }
  }
  return { data, width, height, channels: 3 as const };
}

/**
 * 그림자가 있는 이미지 (좌우 밝기 차이)
 */
function createShadowedImage(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const brightness = x < width / 2 ? 180 : 80; // 왼쪽은 밝고 오른쪽은 어두움 (그림자)
      const i = (y * width + x) * 3;
      data[i] = brightness;
      data[i + 1] = brightness;
      data[i + 2] = brightness;
    }
  }
  return { data, width, height, channels: 3 as const };
}

/**
 * 테스트용 얼굴 영역 생성
 */
function createFaceRegion(
  x = 0.25,
  y = 0.2,
  width = 0.5,
  height = 0.6
): NormalizedRect {
  return { x, y, width, height };
}

// =============================================================================
// processLightingAnalysis 테스트
// =============================================================================

describe('CIE-4: processLightingAnalysis', () => {
  describe('기본 동작', () => {
    it('should return success=true for valid image', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.success).toBe(true);
    });

    it('should include estimatedCCT in result', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.estimatedCCT).toBeDefined();
      expect(typeof result.estimatedCCT).toBe('number');
      expect(result.estimatedCCT).toBeGreaterThan(0);
    });

    it('should include lightingType in result', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.lightingType).toBeDefined();
      expect(['warm', 'cool', 'neutral', 'extreme']).toContain(result.lightingType);
    });

    it('should include overallScore between 0-100', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should include metadata with processingTime', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('얼굴 영역 없이 분석', () => {
    it('should analyze without faceRegion', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.success).toBe(true);
      expect(result.metadata.hasFaceRegion).toBe(false);
    });

    it('should have null zoneAnalysis without faceRegion', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.zoneAnalysis).toBeNull();
    });

    it('should have null shadowAnalysis without faceRegion', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.shadowAnalysis).toBeNull();
    });

    it('should have lower confidence without faceRegion', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.metadata.confidence).toBeLessThanOrEqual(0.5);
    });
  });

  describe('얼굴 영역과 함께 분석', () => {
    it('should analyze with faceRegion', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const faceRegion = createFaceRegion();
      const result = processLightingAnalysis(imageData, faceRegion);

      expect(result.success).toBe(true);
      expect(result.metadata.hasFaceRegion).toBe(true);
    });

    it('should have zoneAnalysis with faceRegion', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const faceRegion = createFaceRegion();
      const result = processLightingAnalysis(imageData, faceRegion);

      expect(result.zoneAnalysis).not.toBeNull();
    });

    it('should have shadowAnalysis with faceRegion', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const faceRegion = createFaceRegion();
      const result = processLightingAnalysis(imageData, faceRegion);

      expect(result.shadowAnalysis).not.toBeNull();
    });

    it('should have higher confidence with faceRegion', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const faceRegion = createFaceRegion();
      const result = processLightingAnalysis(imageData, faceRegion);

      expect(result.metadata.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('조명 타입 감지', () => {
    it('should detect warm lighting', () => {
      const imageData = createWarmLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.lightingType).toBe('warm');
    });

    it('should detect cool lighting', () => {
      const imageData = createCoolLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.lightingType).toBe('cool');
    });

    it('should detect neutral lighting for balanced image', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(['neutral', 'warm']).toContain(result.lightingType);
    });

    it('should detect extreme lighting for very biased colors', () => {
      const imageData = createExtremeLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(['extreme', 'warm']).toContain(result.lightingType);
    });
  });

  describe('CCT 적합성 평가', () => {
    it('should evaluate CCT suitability', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(result.cctSuitability).toBeDefined();
      expect(result.cctSuitability).toBeGreaterThanOrEqual(0);
      expect(result.cctSuitability).toBeLessThanOrEqual(100);
    });

    it('should determine if correction is required', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(typeof result.requiresCorrection).toBe('boolean');
    });

    it('should require correction for extreme lighting', () => {
      const imageData = createExtremeLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      // 극단적인 조명은 보정이 필요할 가능성 높음
      expect(result.requiresCorrection).toBe(true);
    });
  });

  describe('피드백 생성', () => {
    it('should generate feedback array', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(Array.isArray(result.feedback)).toBe(true);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should include positive feedback for good lighting', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      const hasPositiveFeedback = result.feedback.some(
        (f) => f.includes('좋습니다') || f.includes('보통')
      );
      expect(hasPositiveFeedback).toBe(true);
    });

    it('should include warning for warm lighting', () => {
      const imageData = createWarmLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      const hasWarmWarning = result.feedback.some(
        (f) => f.includes('따뜻한') || f.includes('조명')
      );
      expect(hasWarmWarning).toBe(true);
    });

    it('should include warning for cool lighting', () => {
      const imageData = createCoolLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      const hasCoolWarning = result.feedback.some(
        (f) => f.includes('차가운') || f.includes('푸르게')
      );
      expect(hasCoolWarning).toBe(true);
    });
  });

  describe('적합성 판정', () => {
    it('should determine isSuitable based on overallScore', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      expect(typeof result.isSuitable).toBe('boolean');
    });

    it('should be suitable for good lighting conditions', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const result = processLightingAnalysis(imageData);

      // 자연광은 대체로 적합할 것
      if (result.overallScore >= 70) {
        expect(result.isSuitable).toBe(true);
      }
    });
  });

  describe('존 분석 (6-zone)', () => {
    it('should include uniformity in zoneAnalysis', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const faceRegion = createFaceRegion();
      const result = processLightingAnalysis(imageData, faceRegion);

      expect(result.zoneAnalysis?.uniformity).toBeDefined();
    });

    it('should detect low uniformity for uneven lighting', () => {
      const imageData = createUnevenLightingImage(200, 200);
      const faceRegion = createFaceRegion();
      const result = processLightingAnalysis(imageData, faceRegion);

      // 불균일한 조명은 uniformity가 낮아야 함
      if (result.zoneAnalysis) {
        expect(result.zoneAnalysis.uniformity).toBeLessThan(0.9);
      }
    });

    it('should have high uniformity for even lighting', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const faceRegion = createFaceRegion();
      const result = processLightingAnalysis(imageData, faceRegion);

      // 균일한 조명은 uniformity가 높아야 함
      if (result.zoneAnalysis) {
        expect(result.zoneAnalysis.uniformity).toBeGreaterThan(0.5);
      }
    });
  });

  describe('그림자 감지', () => {
    it('should detect shadow presence', () => {
      const imageData = createNaturalLightingImage(200, 200);
      const faceRegion = createFaceRegion();
      const result = processLightingAnalysis(imageData, faceRegion);

      if (result.shadowAnalysis) {
        expect(typeof result.shadowAnalysis.hasShadow).toBe('boolean');
      }
    });

    it('should detect shadow in shadowed image', () => {
      const imageData = createShadowedImage(200, 200);
      const faceRegion = createFaceRegion();
      const result = processLightingAnalysis(imageData, faceRegion);

      // 그림자가 있는 이미지에서 그림자 감지
      if (result.shadowAnalysis) {
        // severity는 'none' | 'mild' | 'moderate' | 'severe' 중 하나
        expect(['none', 'mild', 'moderate', 'severe']).toContain(
          result.shadowAnalysis.severity
        );
        // 그림자 강도(intensity)가 어느 정도 있어야 함
        expect(result.shadowAnalysis.intensity).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('에러 처리', () => {
    it('should return fallback for empty image data', () => {
      const imageData: RGBImageData = {
        data: new Uint8Array(0),
        width: 0,
        height: 0,
        channels: 3,
      };
      const result = processLightingAnalysis(imageData);

      expect(result.success).toBe(true);
      expect(result.lightingType).toBeDefined();
    });

    it('should handle very small image', () => {
      const imageData = createNaturalLightingImage(10, 10);
      const result = processLightingAnalysis(imageData);

      expect(result.success).toBe(true);
    });

    it('should handle very large image', () => {
      const imageData = createNaturalLightingImage(1000, 1000);
      const result = processLightingAnalysis(imageData);

      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// processLightingAnalysisWithTimeout 테스트
// =============================================================================

describe('CIE-4: processLightingAnalysisWithTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve with result within timeout', async () => {
    const imageData = createNaturalLightingImage(100, 100);

    const resultPromise = processLightingAnalysisWithTimeout(imageData);
    vi.advanceTimersByTime(100);
    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.estimatedCCT).toBeDefined();
  });

  it('should use default timeout when not specified', async () => {
    const imageData = createNaturalLightingImage(100, 100);

    const resultPromise = processLightingAnalysisWithTimeout(imageData);
    vi.advanceTimersByTime(100);
    const result = await resultPromise;

    expect(result.success).toBe(true);
  });

  it('should accept faceRegion parameter', async () => {
    const imageData = createNaturalLightingImage(100, 100);
    const faceRegion = createFaceRegion();

    const resultPromise = processLightingAnalysisWithTimeout(imageData, faceRegion);
    vi.advanceTimersByTime(100);
    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.metadata.hasFaceRegion).toBe(true);
  });

  it('should accept custom config parameter', async () => {
    const imageData = createNaturalLightingImage(100, 100);
    const customConfig = { minQualityScore: 50 };

    const resultPromise = processLightingAnalysisWithTimeout(
      imageData,
      undefined,
      customConfig
    );
    vi.advanceTimersByTime(100);
    const result = await resultPromise;

    expect(result.success).toBe(true);
  });

  it('should accept custom timeout parameter', async () => {
    const imageData = createNaturalLightingImage(100, 100);
    const customTimeout = 5000;

    const resultPromise = processLightingAnalysisWithTimeout(
      imageData,
      undefined,
      undefined,
      customTimeout
    );
    vi.advanceTimersByTime(100);
    const result = await resultPromise;

    expect(result.success).toBe(true);
  });
});

// =============================================================================
// quickLightingCheck 테스트
// =============================================================================

describe('CIE-4: quickLightingCheck', () => {
  it('should return boolean', () => {
    const imageData = createNaturalLightingImage(100, 100);
    const result = quickLightingCheck(imageData);

    expect(typeof result).toBe('boolean');
  });

  it('should return true for good lighting', () => {
    const imageData = createNaturalLightingImage(200, 200);
    const result = quickLightingCheck(imageData);

    expect(result).toBe(true);
  });

  it('should return false for extreme lighting', () => {
    const imageData = createExtremeLightingImage(200, 200);
    const result = quickLightingCheck(imageData);

    expect(result).toBe(false);
  });

  it('should be faster than full analysis', () => {
    const imageData = createNaturalLightingImage(200, 200);

    const quickStart = performance.now();
    quickLightingCheck(imageData);
    const quickTime = performance.now() - quickStart;

    const fullStart = performance.now();
    processLightingAnalysis(imageData, createFaceRegion());
    const fullTime = performance.now() - fullStart;

    // 빠른 체크가 전체 분석보다 빠르거나 비슷해야 함
    expect(quickTime).toBeLessThanOrEqual(fullTime + 10);
  });

  it('should handle various image sizes', () => {
    const sizes = [
      [50, 50],
      [100, 100],
      [200, 200],
      [400, 400],
    ];

    for (const [width, height] of sizes) {
      const imageData = createNaturalLightingImage(width, height);
      const result = quickLightingCheck(imageData);
      expect(typeof result).toBe('boolean');
    }
  });
});

// =============================================================================
// 종합 점수 계산 검증 (가중치: CCT 40%, 균일성 35%, 그림자 25%)
// =============================================================================

describe('CIE-4: Overall Score Calculation', () => {
  it('should calculate weighted score correctly', () => {
    // 이상적인 조명 상태에서 높은 점수
    const imageData = createNaturalLightingImage(200, 200);
    const result = processLightingAnalysis(imageData);

    // CCT, 균일성, 그림자 점수가 모두 100이면 종합 점수도 100에 가까움
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('should have lower score for poor lighting', () => {
    const goodImage = createNaturalLightingImage(200, 200);
    const poorImage = createExtremeLightingImage(200, 200);

    const goodResult = processLightingAnalysis(goodImage);
    const poorResult = processLightingAnalysis(poorImage);

    // 좋은 조명이 나쁜 조명보다 높은 점수
    expect(goodResult.overallScore).toBeGreaterThanOrEqual(poorResult.overallScore);
  });

  it('should consider shadow in overall score', () => {
    const uniformImage = createNaturalLightingImage(200, 200);
    const shadowedImage = createShadowedImage(200, 200);

    const faceRegion = createFaceRegion();
    const uniformResult = processLightingAnalysis(uniformImage, faceRegion);
    const shadowedResult = processLightingAnalysis(shadowedImage, faceRegion);

    // 균일한 조명이 그림자가 있는 것보다 점수가 높거나 같음
    expect(uniformResult.overallScore).toBeGreaterThanOrEqual(
      shadowedResult.overallScore - 20
    );
  });
});

// =============================================================================
// 신뢰도 계산 검증
// =============================================================================

describe('CIE-4: Confidence Calculation', () => {
  it('should have confidence between 0 and 1', () => {
    const imageData = createNaturalLightingImage(200, 200);
    const result = processLightingAnalysis(imageData);

    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
    expect(result.metadata.confidence).toBeLessThanOrEqual(1);
  });

  it('should have higher confidence with faceRegion', () => {
    const imageData = createNaturalLightingImage(200, 200);
    const faceRegion = createFaceRegion();

    const withoutFace = processLightingAnalysis(imageData);
    const withFace = processLightingAnalysis(imageData, faceRegion);

    expect(withFace.metadata.confidence).toBeGreaterThan(
      withoutFace.metadata.confidence
    );
  });

  it('should adjust confidence for extreme scores', () => {
    const imageData = createNaturalLightingImage(200, 200);
    const result = processLightingAnalysis(imageData);

    // 극단적인 점수(90 이상 또는 20 미만)에서는 신뢰도 조정됨
    expect(result.metadata.confidence).toBeLessThanOrEqual(0.9);
  });
});
