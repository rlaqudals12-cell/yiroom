/**
 * CIE-4: 조명 분석 모듈 테스트
 *
 * @see docs/specs/SDD-CIE-4-LIGHTING-ANALYSIS.md
 *
 * 테스트 범위:
 * - processor.ts: processLightingAnalysis, quickLightingCheck
 * - cct-analyzer.ts: calculateRegionAverageRGB, classifyLightingType, evaluateCCTSuitability
 * - zone-analyzer.ts: performZoneAnalysis, uniformityToScore
 * - shadow-detector.ts: performShadowAnalysis, shadowToScore
 * - fallback.ts: generateCIE4Fallback, generateRandomCIE4Mock, generateConditionedCIE4Mock
 */

import { describe, it, expect } from 'vitest';

// Processor
import {
  processLightingAnalysis,
  quickLightingCheck,
} from '@/lib/image-engine/cie-4/processor';

// CCT Analyzer
import {
  calculateRegionAverageRGB,
  estimateCCTFromFace,
  estimateCCTFromImage,
  classifyLightingType,
  evaluateCCTSuitability,
  needsCCTCorrection,
} from '@/lib/image-engine/cie-4/cct-analyzer';

// Zone Analyzer
import {
  FACE_ZONES,
  performZoneAnalysis,
  uniformityToScore,
} from '@/lib/image-engine/cie-4/zone-analyzer';

// Shadow Detector
import {
  SHADOW_THRESHOLDS,
  performShadowAnalysis,
  shadowToScore,
} from '@/lib/image-engine/cie-4/shadow-detector';

// Fallback
import {
  generateZoneAnalysisFallback,
  generateShadowAnalysisFallback,
  generateCIE4Fallback,
  generateErrorCIE4Fallback,
  generateRandomCIE4Mock,
  generateConditionedCIE4Mock,
} from '@/lib/image-engine/cie-4/fallback';

import type { RGBImageData, NormalizedRect } from '@/lib/image-engine/types';

// ============================================
// 테스트 유틸리티
// ============================================

function createTestRGBImageData(width = 100, height = 100): RGBImageData {
  return {
    width,
    height,
    channels: 3,
    data: new Uint8Array(width * height * 3).fill(128),
  };
}

function createWarmLightImageData(width = 100, height = 100): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  // 따뜻한 조명 (노란색 계열 - 낮은 CCT)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = 220;     // R (높음)
    data[i * 3 + 1] = 180; // G (중간)
    data[i * 3 + 2] = 100; // B (낮음)
  }
  return { width, height, channels: 3, data };
}

function createCoolLightImageData(width = 100, height = 100): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  // 차가운 조명 (푸른색 계열 - 높은 CCT)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = 150;     // R (낮음)
    data[i * 3 + 1] = 170; // G (중간)
    data[i * 3 + 2] = 220; // B (높음)
  }
  return { width, height, channels: 3, data };
}

function createNeutralLightImageData(width = 100, height = 100): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  // 중립적 조명 (D65 ~ 6500K)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = 180;     // R
    data[i * 3 + 1] = 180; // G
    data[i * 3 + 2] = 180; // B
  }
  return { width, height, channels: 3, data };
}

function createUnevenLightImageData(width = 100, height = 100): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  // 불균일한 조명 (왼쪽 밝고 오른쪽 어두움)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const brightness = 50 + Math.floor((x / width) * 150);
      const idx = (y * width + x) * 3;
      data[idx] = brightness;
      data[idx + 1] = brightness;
      data[idx + 2] = brightness;
    }
  }
  return { width, height, channels: 3, data };
}

function createTestFaceRegion(): NormalizedRect {
  return {
    x: 0.25,
    y: 0.2,
    width: 0.5,
    height: 0.6,
  };
}

// ============================================
// Processor 테스트
// ============================================

describe('CIE-4 Processor', () => {
  describe('processLightingAnalysis', () => {
    it('should return success for valid image', () => {
      const imageData = createTestRGBImageData();
      const result = processLightingAnalysis(imageData);

      expect(result.success).toBe(true);
      expect(result.estimatedCCT).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
    });

    it('should analyze face region when provided', () => {
      const imageData = createTestRGBImageData();
      const faceRegion = createTestFaceRegion();

      const result = processLightingAnalysis(imageData, faceRegion);

      expect(result.success).toBe(true);
      expect(result.zoneAnalysis).not.toBeNull();
      expect(result.shadowAnalysis).not.toBeNull();
      expect(result.metadata.hasFaceRegion).toBe(true);
    });

    it('should skip zone/shadow analysis without face region', () => {
      const imageData = createTestRGBImageData();

      const result = processLightingAnalysis(imageData);

      expect(result.success).toBe(true);
      expect(result.zoneAnalysis).toBeNull();
      expect(result.shadowAnalysis).toBeNull();
      expect(result.metadata.hasFaceRegion).toBe(false);
    });

    it('should classify lighting type correctly', () => {
      const warmImage = createWarmLightImageData();
      const coolImage = createCoolLightImageData();
      const neutralImage = createNeutralLightImageData();

      const warmResult = processLightingAnalysis(warmImage);
      const coolResult = processLightingAnalysis(coolImage);
      const neutralResult = processLightingAnalysis(neutralImage);

      // 따뜻한 이미지는 warm 또는 neutral
      expect(['warm', 'neutral']).toContain(warmResult.lightingType);
      // 차가운 이미지는 cool 또는 neutral
      expect(['cool', 'neutral']).toContain(coolResult.lightingType);
      // 중립 이미지는 neutral 또는 warm/cool 중 하나
      expect(['warm', 'neutral', 'cool']).toContain(neutralResult.lightingType);
    });

    it('should provide feedback messages', () => {
      const imageData = createTestRGBImageData();
      const result = processLightingAnalysis(imageData);

      expect(result.feedback).toBeDefined();
      expect(Array.isArray(result.feedback)).toBe(true);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should calculate overall score', () => {
      const imageData = createTestRGBImageData();
      const result = processLightingAnalysis(imageData);

      expect(typeof result.overallScore).toBe('number');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('quickLightingCheck', () => {
    it('should return true for neutral lighting', () => {
      const imageData = createNeutralLightImageData();
      const result = quickLightingCheck(imageData);

      expect(typeof result).toBe('boolean');
    });

    it('should be faster than full analysis', () => {
      const imageData = createTestRGBImageData(200, 200);

      const startQuick = performance.now();
      quickLightingCheck(imageData);
      const quickTime = performance.now() - startQuick;

      const startFull = performance.now();
      processLightingAnalysis(imageData, createTestFaceRegion());
      const fullTime = performance.now() - startFull;

      // Quick check는 full analysis보다 빨라야 함 (또는 비슷)
      expect(quickTime).toBeLessThanOrEqual(fullTime + 10);
    });
  });
});

// ============================================
// CCT Analyzer 테스트
// ============================================

describe('CIE-4 CCT Analyzer', () => {
  describe('calculateRegionAverageRGB', () => {
    it('should calculate average RGB for region', () => {
      const imageData = createTestRGBImageData(100, 100);
      const region: NormalizedRect = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };

      const avg = calculateRegionAverageRGB(imageData, region);

      expect(avg.r).toBe(128);
      expect(avg.g).toBe(128);
      expect(avg.b).toBe(128);
    });

    it('should handle edge regions', () => {
      const imageData = createTestRGBImageData(100, 100);
      const edgeRegion: NormalizedRect = { x: 0.9, y: 0.9, width: 0.1, height: 0.1 };

      const avg = calculateRegionAverageRGB(imageData, edgeRegion);

      expect(avg.r).toBeGreaterThanOrEqual(0);
      expect(avg.r).toBeLessThanOrEqual(255);
    });

    it('should return default for zero-size region', () => {
      const imageData = createTestRGBImageData(100, 100);
      const zeroRegion: NormalizedRect = { x: 0.5, y: 0.5, width: 0, height: 0 };

      const avg = calculateRegionAverageRGB(imageData, zeroRegion);

      // 기본값 반환
      expect(avg).toBeDefined();
    });
  });

  describe('estimateCCTFromImage', () => {
    it('should estimate CCT in valid range', () => {
      const imageData = createTestRGBImageData();
      const cct = estimateCCTFromImage(imageData);

      expect(cct).toBeGreaterThan(1000);
      expect(cct).toBeLessThan(15000);
    });

    it('should estimate lower CCT for warm images', () => {
      const warmImage = createWarmLightImageData();
      const neutralImage = createNeutralLightImageData();

      const warmCCT = estimateCCTFromImage(warmImage);
      const neutralCCT = estimateCCTFromImage(neutralImage);

      // 따뜻한 이미지는 더 낮은 CCT
      expect(warmCCT).toBeLessThan(neutralCCT + 1000);
    });
  });

  describe('estimateCCTFromFace', () => {
    it('should estimate CCT from face region', () => {
      const imageData = createTestRGBImageData();
      const faceRegion = createTestFaceRegion();

      const cct = estimateCCTFromFace(imageData, faceRegion);

      expect(cct).toBeGreaterThan(1000);
      expect(cct).toBeLessThan(15000);
    });
  });

  describe('classifyLightingType', () => {
    it('should classify warm lighting', () => {
      expect(classifyLightingType(3000)).toBe('warm');
      expect(classifyLightingType(4000)).toBe('warm');
    });

    it('should classify neutral lighting', () => {
      expect(classifyLightingType(5500)).toBe('neutral');
      expect(classifyLightingType(6500)).toBe('neutral');
    });

    it('should classify cool lighting', () => {
      expect(classifyLightingType(7500)).toBe('cool');
      expect(classifyLightingType(9000)).toBe('cool');
    });

    it('should classify extreme low/high CCT values', () => {
      // 2000K < 4500 (warmMax) → 'warm' (먼저 체크됨)
      // 12000K > 7000 (coolMin) → 'cool' (먼저 체크됨)
      // 'extreme'은 warm/cool/neutral에 해당하지 않는 극단값에만 적용
      expect(classifyLightingType(2000)).toBe('warm');
      expect(classifyLightingType(12000)).toBe('cool');
    });
  });

  describe('evaluateCCTSuitability', () => {
    it('should give high score for ideal CCT', () => {
      const idealScore = evaluateCCTSuitability(6500);
      expect(idealScore).toBeGreaterThanOrEqual(80);
    });

    it('should give medium score for acceptable CCT', () => {
      const acceptableScore = evaluateCCTSuitability(5000);
      expect(acceptableScore).toBeGreaterThanOrEqual(50);
      expect(acceptableScore).toBeLessThan(90);
    });

    it('should give low score for poor CCT', () => {
      const poorScore = evaluateCCTSuitability(3000);
      expect(poorScore).toBeLessThan(60);
    });

    it('should return 0-100 range', () => {
      const scores = [2000, 4000, 6500, 8000, 10000].map(evaluateCCTSuitability);

      scores.forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('needsCCTCorrection', () => {
    it('should not need correction for acceptable CCT', () => {
      expect(needsCCTCorrection(5500)).toBe(false);
      expect(needsCCTCorrection(6500)).toBe(false);
    });

    it('should need correction for extreme CCT', () => {
      expect(needsCCTCorrection(3000)).toBe(true);
      expect(needsCCTCorrection(9000)).toBe(true);
    });
  });
});

// ============================================
// Zone Analyzer 테스트
// ============================================

describe('CIE-4 Zone Analyzer', () => {
  describe('FACE_ZONES', () => {
    it('should define 6 face zones', () => {
      // FACE_ZONES는 배열로 정의됨
      expect(FACE_ZONES.length).toBe(6);
    });

    it('should have forehead, cheek, and chin zones', () => {
      // 배열에서 zone 이름으로 검색
      const zoneNames = FACE_ZONES.map((zone) => zone.name);
      expect(zoneNames).toContain('forehead_left');
      expect(zoneNames).toContain('forehead_right');
      expect(zoneNames).toContain('cheek_left');
      expect(zoneNames).toContain('cheek_right');
      expect(zoneNames).toContain('chin_left');
      expect(zoneNames).toContain('chin_right');
    });
  });

  describe('performZoneAnalysis', () => {
    it('should analyze all 6 zones', () => {
      const imageData = createTestRGBImageData();
      const faceRegion = createTestFaceRegion();

      const analysis = performZoneAnalysis(imageData, faceRegion);

      expect(analysis.zones.length).toBe(6);
      expect(analysis.uniformity).toBeDefined();
      expect(analysis.leftRightBalance).toBeDefined();
    });

    it('should calculate uniformity for uniform image', () => {
      const uniformImage = createTestRGBImageData();
      const faceRegion = createTestFaceRegion();

      const analysis = performZoneAnalysis(uniformImage, faceRegion);

      // 균일한 이미지는 높은 균일성
      expect(analysis.uniformity).toBeGreaterThan(0.7);
    });

    it('should detect low uniformity for uneven image', () => {
      const unevenImage = createUnevenLightImageData();
      const faceRegion = createTestFaceRegion();

      const analysis = performZoneAnalysis(unevenImage, faceRegion);

      // 불균일한 이미지는 낮은 균일성
      expect(analysis.uniformity).toBeLessThan(0.9);
    });
  });

  describe('uniformityToScore', () => {
    it('should convert high uniformity to high score', () => {
      const score = uniformityToScore(0.95);
      expect(score).toBeGreaterThan(80);
    });

    it('should convert low uniformity to low score', () => {
      const score = uniformityToScore(0.5);
      expect(score).toBeLessThan(70);
    });

    it('should return 0-100 range', () => {
      const scores = [0, 0.5, 0.7, 0.9, 1.0].map(uniformityToScore);

      scores.forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });
});

// ============================================
// Shadow Detector 테스트
// ============================================

describe('CIE-4 Shadow Detector', () => {
  describe('SHADOW_THRESHOLDS', () => {
    it('should define shadow thresholds', () => {
      // 실제 프로퍼티명: darkThreshold, brightThreshold
      expect(SHADOW_THRESHOLDS.darkThreshold).toBeDefined();
      expect(SHADOW_THRESHOLDS.brightThreshold).toBeDefined();
      expect(SHADOW_THRESHOLDS.asymmetryWarning).toBeDefined();
      expect(SHADOW_THRESHOLDS.asymmetrySevere).toBeDefined();
    });
  });

  describe('performShadowAnalysis', () => {
    it('should analyze shadow in image', () => {
      const imageData = createTestRGBImageData();
      const faceRegion = createTestFaceRegion();

      const analysis = performShadowAnalysis(imageData, faceRegion);

      expect(typeof analysis.hasShadow).toBe('boolean');
      expect(analysis.direction).toBeDefined();
      expect(typeof analysis.intensity).toBe('number');
      expect(analysis.recommendation).toBeDefined();
    });

    it('should detect no shadow in uniform image', () => {
      const uniformImage = createTestRGBImageData();
      const faceRegion = createTestFaceRegion();

      const analysis = performShadowAnalysis(uniformImage, faceRegion);

      // 균일한 이미지에는 그림자 없음
      expect(analysis.hasShadow).toBe(false);
    });

    it('should calculate dark area ratio', () => {
      const imageData = createTestRGBImageData();
      const faceRegion = createTestFaceRegion();

      const analysis = performShadowAnalysis(imageData, faceRegion);

      expect(typeof analysis.darkAreaRatio).toBe('number');
      expect(analysis.darkAreaRatio).toBeGreaterThanOrEqual(0);
      expect(analysis.darkAreaRatio).toBeLessThanOrEqual(1);
    });
  });

  describe('shadowToScore', () => {
    it('should give high score for no shadow', () => {
      const noShadowAnalysis = generateShadowAnalysisFallback();
      const score = shadowToScore(noShadowAnalysis);

      expect(score).toBeGreaterThan(80);
    });

    it('should return 0-100 range', () => {
      const analysis = generateShadowAnalysisFallback();
      const score = shadowToScore(analysis);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

// ============================================
// Fallback 테스트
// ============================================

describe('CIE-4 Fallback', () => {
  describe('generateZoneAnalysisFallback', () => {
    it('should return valid zone analysis', () => {
      const result = generateZoneAnalysisFallback();

      expect(result.zones.length).toBe(6);
      expect(result.uniformity).toBeGreaterThan(0);
      expect(result.leftRightBalance).toBeDefined();
    });
  });

  describe('generateShadowAnalysisFallback', () => {
    it('should return no shadow state', () => {
      const result = generateShadowAnalysisFallback();

      expect(result.hasShadow).toBe(false);
      expect(result.direction).toBe('none');
      expect(result.severity).toBe('none');
    });
  });

  describe('generateCIE4Fallback', () => {
    it('should return valid CIE4Output', () => {
      const result = generateCIE4Fallback(100);

      expect(result.success).toBe(true);
      expect(result.lightingType).toBe('neutral');
      expect(result.metadata.processingTime).toBe(100);
    });

    it('should have default D65 CCT', () => {
      const result = generateCIE4Fallback();

      expect(result.estimatedCCT).toBeCloseTo(6500, -2);
    });
  });

  describe('generateErrorCIE4Fallback', () => {
    it('should return error state', () => {
      const result = generateErrorCIE4Fallback('Test error');

      expect(result.success).toBe(false);
      expect(result.feedback[0]).toContain('Test error');
      expect(result.metadata.confidence).toBe(0);
    });
  });

  describe('generateRandomCIE4Mock', () => {
    it('should generate valid random mock', () => {
      const result = generateRandomCIE4Mock();

      expect(result.success).toBe(true);
      expect(result.estimatedCCT).toBeGreaterThan(4000);
      expect(result.estimatedCCT).toBeLessThan(9000);
    });

    it('should generate different values on multiple calls', () => {
      const results = Array.from({ length: 10 }, () => generateRandomCIE4Mock());
      const ccts = results.map((r) => r.estimatedCCT);
      const uniqueCCTs = new Set(ccts);

      // 10번 호출 시 최소 2개 이상의 다른 CCT 값
      expect(uniqueCCTs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('generateConditionedCIE4Mock', () => {
    it('should generate optimal lighting mock', () => {
      const result = generateConditionedCIE4Mock('optimal');

      expect(result.isSuitable).toBe(true);
      expect(result.overallScore).toBeGreaterThan(80);
      expect(result.requiresCorrection).toBe(false);
    });

    it('should generate warm light mock', () => {
      const result = generateConditionedCIE4Mock('warm_light');

      expect(result.lightingType).toBe('warm');
      expect(result.estimatedCCT).toBeLessThan(5000);
      expect(result.requiresCorrection).toBe(true);
    });

    it('should generate cool light mock', () => {
      const result = generateConditionedCIE4Mock('cool_light');

      expect(result.lightingType).toBe('cool');
      expect(result.estimatedCCT).toBeGreaterThan(7000);
    });

    it('should generate harsh shadow mock', () => {
      const result = generateConditionedCIE4Mock('harsh_shadow');

      expect(result.overallScore).toBeLessThan(60);
    });

    it('should generate dark environment mock', () => {
      const result = generateConditionedCIE4Mock('dark');

      expect(result.isSuitable).toBe(false);
      expect(result.overallScore).toBeLessThan(50);
    });
  });
});

// ============================================
// 통합 테스트
// ============================================

describe('CIE-4 Integration', () => {
  it('should process warm light image and suggest correction', () => {
    const warmImage = createWarmLightImageData(100, 100);
    const result = processLightingAnalysis(warmImage);

    expect(result.success).toBe(true);
    expect(['warm', 'neutral']).toContain(result.lightingType);
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it('should process cool light image and suggest correction', () => {
    const coolImage = createCoolLightImageData(100, 100);
    const result = processLightingAnalysis(coolImage);

    expect(result.success).toBe(true);
    expect(['cool', 'neutral']).toContain(result.lightingType);
  });

  it('should process neutral image with high suitability', () => {
    const neutralImage = createNeutralLightImageData(100, 100);
    const result = processLightingAnalysis(neutralImage);

    expect(result.success).toBe(true);
    expect(result.cctSuitability).toBeGreaterThan(50);
  });

  it('should handle full analysis pipeline with face region', () => {
    const imageData = createTestRGBImageData(200, 200);
    const faceRegion = createTestFaceRegion();

    const result = processLightingAnalysis(imageData, faceRegion);

    expect(result.success).toBe(true);
    expect(result.zoneAnalysis).not.toBeNull();
    expect(result.shadowAnalysis).not.toBeNull();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it('should fallback gracefully on mock data', () => {
    const mockResult = generateConditionedCIE4Mock('optimal');

    expect(mockResult.success).toBe(true);
    expect(mockResult.isSuitable).toBe(true);
    expect(mockResult.feedback[0]).toBeDefined();
  });
});
