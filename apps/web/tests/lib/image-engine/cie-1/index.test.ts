/**
 * CIE-1 모듈 통합 테스트
 *
 * @module tests/lib/image-engine/cie-1/index
 * @description CIE-1 배럴 export 및 통합 기능 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  // 메인 검증 함수
  validateImageQuality,
  validateImageQualityWithTimeout,
  calculateOverallScore,
  isAcceptable,
  determinePrimaryIssue,
  collectAllIssues,
  // 선명도 분석
  analyzeSharpness,
  analyzeSharpnessFromGray,
  getSharpnessVerdict,
  // 노출 분석
  analyzeExposure,
  analyzeExposureFromGray,
  getExposureVerdict,
  // 색온도 분석
  analyzeColorTemperature,
  getCCTVerdict,
  // 해상도 검증
  validateResolution,
  validateResolutionDirect,
  isSuitableForFaceAnalysis,
  // Fallback
  generateCIE1Fallback,
  generateRandomCIE1Mock,
} from '@/lib/image-engine/cie-1';
import type { RGBImageData, GrayscaleImageData } from '@/lib/image-engine/types';

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

function createTestGrayscaleData(
  width: number,
  height: number,
  fillValue = 128
): GrayscaleImageData {
  const data = new Uint8Array(width * height);
  data.fill(fillValue);
  return { data, width, height };
}

// 변화가 있는 이미지 생성 (선명도 테스트용)
function createVariedImageData(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      // 체커보드 패턴으로 변화 추가
      const value = ((x + y) % 2 === 0) ? 100 : 200;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
    }
  }
  return { data, width, height, channels: 3 };
}

describe('CIE-1 모듈 통합 테스트', () => {
  // =========================================
  // 모듈 export 테스트
  // =========================================

  describe('모듈 export', () => {
    it('메인 검증 함수들이 export된다', () => {
      expect(validateImageQuality).toBeDefined();
      expect(validateImageQualityWithTimeout).toBeDefined();
      expect(calculateOverallScore).toBeDefined();
      expect(isAcceptable).toBeDefined();
      expect(determinePrimaryIssue).toBeDefined();
      expect(collectAllIssues).toBeDefined();
    });

    it('선명도 분석 함수들이 export된다', () => {
      expect(analyzeSharpness).toBeDefined();
      expect(analyzeSharpnessFromGray).toBeDefined();
      expect(getSharpnessVerdict).toBeDefined();
    });

    it('노출 분석 함수들이 export된다', () => {
      expect(analyzeExposure).toBeDefined();
      expect(analyzeExposureFromGray).toBeDefined();
      expect(getExposureVerdict).toBeDefined();
    });

    it('색온도 분석 함수들이 export된다', () => {
      expect(analyzeColorTemperature).toBeDefined();
      expect(getCCTVerdict).toBeDefined();
    });

    it('해상도 검증 함수들이 export된다', () => {
      expect(validateResolution).toBeDefined();
      expect(validateResolutionDirect).toBeDefined();
      expect(isSuitableForFaceAnalysis).toBeDefined();
    });

    it('Fallback 함수들이 export된다', () => {
      expect(generateCIE1Fallback).toBeDefined();
      expect(generateRandomCIE1Mock).toBeDefined();
    });
  });

  // =========================================
  // validateImageQuality 통합 테스트
  // =========================================

  describe('validateImageQuality 통합', () => {
    it('유효한 이미지에서 결과를 반환한다', async () => {
      const imageData = createVariedImageData(640, 480);
      const result = await validateImageQuality(imageData);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('isAcceptable');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('sharpness');
      expect(result).toHaveProperty('exposure');
      expect(result).toHaveProperty('colorTemperature');
    });

    it('결과 구조가 CIE1Output 타입과 일치한다', async () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = await validateImageQuality(imageData);

      // 필수 필드 확인
      expect(typeof result.isAcceptable).toBe('boolean');
      expect(typeof result.overallScore).toBe('number');
      expect(typeof result.confidence).toBe('number');
      expect(result.sharpness).toHaveProperty('score');
      expect(result.sharpness).toHaveProperty('verdict');
      expect(result.exposure).toHaveProperty('meanBrightness');
      expect(result.colorTemperature).toHaveProperty('kelvin');
    });

    it('점수가 0-100 범위 내에 있다', async () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = await validateImageQuality(imageData);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.sharpness.score).toBeGreaterThanOrEqual(0);
      expect(result.sharpness.score).toBeLessThanOrEqual(100);
    });

    it('신뢰도가 0-1 범위 내에 있다', async () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = await validateImageQuality(imageData);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('처리 시간을 기록한다', async () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = await validateImageQuality(imageData);

      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  // =========================================
  // validateImageQualityWithTimeout 테스트
  // =========================================

  describe('validateImageQualityWithTimeout', () => {
    it('타임아웃 내에 완료된다', async () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = await validateImageQualityWithTimeout(imageData);

      expect(result).toBeDefined();
      expect(result.processingTime).toBeLessThan(5000);
    });

    it('결과 형식이 validateImageQuality와 동일하다', async () => {
      const imageData = createTestRGBImageData(640, 480);
      const result = await validateImageQualityWithTimeout(imageData);

      expect(result).toHaveProperty('isAcceptable');
      expect(result).toHaveProperty('sharpness');
      expect(result).toHaveProperty('exposure');
      expect(result).toHaveProperty('colorTemperature');
    });
  });

  // =========================================
  // isAcceptable 테스트
  // =========================================

  describe('isAcceptable', () => {
    it('높은 점수에서 true를 반환한다', () => {
      const sharpness = { score: 85, laplacianVariance: 150, verdict: 'acceptable' as const, feedback: '' };
      const exposure = { verdict: 'normal' as const, meanBrightness: 128, confidence: 0.9, feedback: '' };
      const resolution = { isValid: true, width: 640, height: 480, pixelCount: 640 * 480, feedback: null };

      expect(isAcceptable(sharpness, exposure, resolution)).toBe(true);
    });

    it('선명도가 rejected면 false를 반환한다', () => {
      const sharpness = { score: 10, laplacianVariance: 10, verdict: 'rejected' as const, feedback: '' };
      const exposure = { verdict: 'normal' as const, meanBrightness: 128, confidence: 0.9, feedback: '' };
      const resolution = { isValid: true, width: 640, height: 480, pixelCount: 640 * 480, feedback: null };

      expect(isAcceptable(sharpness, exposure, resolution)).toBe(false);
    });

    it('해상도가 미달이면 false를 반환한다', () => {
      const sharpness = { score: 85, laplacianVariance: 150, verdict: 'acceptable' as const, feedback: '' };
      const exposure = { verdict: 'normal' as const, meanBrightness: 128, confidence: 0.9, feedback: '' };
      const resolution = { isValid: false, width: 100, height: 100, pixelCount: 100 * 100, feedback: '해상도 미달' };

      expect(isAcceptable(sharpness, exposure, resolution)).toBe(false);
    });

    it('노출이 극단적이면 false를 반환한다', () => {
      const sharpness = { score: 85, laplacianVariance: 150, verdict: 'acceptable' as const, feedback: '' };
      const exposure = { verdict: 'underexposed' as const, meanBrightness: 30, confidence: 0.5, feedback: '' };
      const resolution = { isValid: true, width: 640, height: 480, pixelCount: 640 * 480, feedback: null };

      expect(isAcceptable(sharpness, exposure, resolution)).toBe(false);
    });
  });

  // =========================================
  // Fallback 함수 테스트
  // =========================================

  describe('Fallback 함수', () => {
    it('generateCIE1Fallback이 유효한 결과를 반환한다', () => {
      const fallback = generateCIE1Fallback();

      expect(fallback).toHaveProperty('isAcceptable');
      expect(fallback).toHaveProperty('overallScore');
      expect(fallback).toHaveProperty('sharpness');
      expect(fallback).toHaveProperty('exposure');
      expect(fallback).toHaveProperty('colorTemperature');
    });

    it('generateRandomCIE1Mock이 무작위 결과를 생성한다', () => {
      const mock1 = generateRandomCIE1Mock();
      const mock2 = generateRandomCIE1Mock();

      // 두 호출이 다른 결과를 생성할 수 있음 (무작위)
      expect(mock1).toHaveProperty('overallScore');
      expect(mock2).toHaveProperty('overallScore');
      expect(typeof mock1.overallScore).toBe('number');
    });

    it('Fallback 결과가 processingTime을 반영한다', () => {
      const fallback = generateCIE1Fallback(500);

      expect(fallback).toHaveProperty('processingTime');
      expect(fallback.processingTime).toBe(500);
    });
  });

  // =========================================
  // 엣지 케이스 테스트
  // =========================================

  describe('엣지 케이스', () => {
    it('작은 이미지를 처리한다', async () => {
      const imageData = createTestRGBImageData(50, 50);
      const result = await validateImageQuality(imageData);

      expect(result).toBeDefined();
      // 작은 이미지는 해상도 검증에서 실패할 수 있음
    });

    it('균일한 이미지(선명도 낮음)를 처리한다', async () => {
      const imageData = createTestRGBImageData(640, 480, 128);
      const result = await validateImageQuality(imageData);

      // 균일한 이미지는 낮은 선명도 점수
      expect(result.sharpness.score).toBeLessThan(50);
    });

    it('어두운 이미지를 처리한다', async () => {
      const imageData = createTestRGBImageData(640, 480, 20);
      const result = await validateImageQuality(imageData);

      expect(result.exposure.verdict).toBe('underexposed');
    });

    it('밝은 이미지를 처리한다', async () => {
      const imageData = createTestRGBImageData(640, 480, 240);
      const result = await validateImageQuality(imageData);

      expect(result.exposure.verdict).toBe('overexposed');
    });
  });
});
