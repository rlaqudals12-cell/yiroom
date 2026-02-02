/**
 * CIE-4 모듈 통합 테스트
 *
 * @module tests/lib/image-engine/cie-4/index
 * @description CIE-4 배럴 export 및 통합 기능 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  processLightingAnalysis,
  processLightingAnalysisWithTimeout,
  quickLightingCheck,
  calculateRegionAverageRGB,
  estimateCCTFromForehead,
  estimateCCTFromFace,
  estimateCCTFromImage,
  classifyLightingType,
  evaluateCCTSuitability,
  needsCCTCorrection,
  FACE_ZONES,
  calculateZoneBrightness,
  analyzeZoneBrightness,
  calculateUniformity,
  calculateLeftRightAsymmetry,
  calculateVerticalGradient,
  performZoneAnalysis,
  uniformityToScore,
  SHADOW_THRESHOLDS,
  detectShadowDirection,
  calculateShadowIntensity,
  calculateDarkAreaRatio,
  calculateOverexposedRatio,
  performShadowAnalysis,
  shadowToScore,
  generateZoneAnalysisFallback,
  generateShadowAnalysisFallback,
  generateCIE4Fallback,
  generateErrorCIE4Fallback,
  generateRandomCIE4Mock,
  generateConditionedCIE4Mock,
} from '@/lib/image-engine/cie-4';
import type { RGBImageData, BoundingBox } from '@/lib/image-engine/types';

function createTestRGBImageData(
  width: number,
  height: number,
  fillValue = 128
): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  data.fill(fillValue);
  return { data, width, height, channels: 3 };
}

describe('CIE-4 모듈 통합 테스트', () => {
  describe('모듈 export', () => {
    it('메인 프로세서 함수들이 export된다', () => {
      expect(processLightingAnalysis).toBeDefined();
      expect(processLightingAnalysisWithTimeout).toBeDefined();
      expect(quickLightingCheck).toBeDefined();
    });

    it('CCT 분석 함수들이 export된다', () => {
      expect(calculateRegionAverageRGB).toBeDefined();
      expect(estimateCCTFromForehead).toBeDefined();
      expect(estimateCCTFromFace).toBeDefined();
      expect(estimateCCTFromImage).toBeDefined();
      expect(classifyLightingType).toBeDefined();
      expect(evaluateCCTSuitability).toBeDefined();
      expect(needsCCTCorrection).toBeDefined();
    });

    it('6존 분석 함수들이 export된다', () => {
      expect(FACE_ZONES).toBeDefined();
      expect(calculateZoneBrightness).toBeDefined();
      expect(analyzeZoneBrightness).toBeDefined();
      expect(calculateUniformity).toBeDefined();
      expect(calculateLeftRightAsymmetry).toBeDefined();
      expect(calculateVerticalGradient).toBeDefined();
      expect(performZoneAnalysis).toBeDefined();
      expect(uniformityToScore).toBeDefined();
    });

    it('그림자 감지 함수들이 export된다', () => {
      expect(SHADOW_THRESHOLDS).toBeDefined();
      expect(detectShadowDirection).toBeDefined();
      expect(calculateShadowIntensity).toBeDefined();
      expect(calculateDarkAreaRatio).toBeDefined();
      expect(calculateOverexposedRatio).toBeDefined();
      expect(performShadowAnalysis).toBeDefined();
      expect(shadowToScore).toBeDefined();
    });

    it('Fallback 함수들이 export된다', () => {
      expect(generateZoneAnalysisFallback).toBeDefined();
      expect(generateShadowAnalysisFallback).toBeDefined();
      expect(generateCIE4Fallback).toBeDefined();
      expect(generateErrorCIE4Fallback).toBeDefined();
      expect(generateRandomCIE4Mock).toBeDefined();
      expect(generateConditionedCIE4Mock).toBeDefined();
    });
  });

  describe('processLightingAnalysis', () => {
    it('유효한 이미지에서 결과를 반환한다', () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = processLightingAnalysis(imageData);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isSuitable');
      expect(result).toHaveProperty('metadata');
    });

    it('결과 구조가 CIE4Output 타입과 일치한다', () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = processLightingAnalysis(imageData);
      expect(typeof result.isSuitable).toBe('boolean');
      expect(typeof result.metadata.processingTime).toBe('number');
      expect(typeof result.overallScore).toBe('number');
    });

    it('점수가 0-100 범위 내에 있다', () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = processLightingAnalysis(imageData);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('CCT 분석', () => {
    it('estimateCCTFromImage가 CCT를 추정한다', () => {
      const imageData = createTestRGBImageData(640, 480, 128);
      const cct = estimateCCTFromImage(imageData);
      expect(typeof cct).toBe('number');
      expect(cct).toBeGreaterThan(1000);
      expect(cct).toBeLessThan(20000);
    });

    it('classifyLightingType이 조명 유형을 분류한다', () => {
      const type = classifyLightingType(6500);
      expect(typeof type).toBe('string');
    });

    it('evaluateCCTSuitability가 적합성 점수를 평가한다', () => {
      const result = evaluateCCTSuitability(6500);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('Fallback 함수', () => {
    it('generateCIE4Fallback이 유효한 결과를 반환한다', () => {
      const fallback = generateCIE4Fallback();
      expect(fallback).toHaveProperty('isSuitable');
      expect(fallback).toHaveProperty('metadata');
      expect(fallback.metadata).toHaveProperty('processingTime');
    });

    it('generateRandomCIE4Mock이 무작위 결과를 생성한다', () => {
      const mock = generateRandomCIE4Mock();
      expect(mock).toHaveProperty('isSuitable');
      expect(mock).toHaveProperty('overallScore');
    });

    it('generateConditionedCIE4Mock이 조건부 결과를 생성한다', () => {
      const mock = generateConditionedCIE4Mock('optimal');
      expect(mock).toHaveProperty('isSuitable');
      expect(mock).toHaveProperty('lightingType');
    });
  });
});
