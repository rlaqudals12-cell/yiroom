/**
 * CIE-3 모듈 통합 테스트
 *
 * @module tests/lib/image-engine/cie-3/index
 * @description CIE-3 배럴 export 및 통합 기능 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  // 메인 프로세서
  processAWBCorrection,
  processAWBCorrectionWithTimeout,
  selectAndApplyAWB,
  // 피부 감지
  isSkinPixel,
  detectSkinMask,
  calculateSkinAverageRGB,
  calculateNonSkinAverageRGB,
  hasSufficientSkinCoverage,
  cleanSkinMask,
  // AWB 알고리즘
  calculateGrayWorldGains,
  applyGrayWorld,
  applyVonKries,
  applySkinAwareAWB,
  applyGains,
  calculateAppliedGains,
  isValidGains,
  // Fallback
  generateCIE3Fallback,
  generateAWBCorrectionFallback,
  generateCorrectedFallback,
  generateErrorCIE3Fallback,
  generateRandomCIE3Mock,
  // 신뢰도 계산
  calculateConfidence,
  calculateAWBConfidence,
  getMethodDefaultConfidence,
} from '@/lib/image-engine/cie-3';
import type { RGBImageData, AWBGains, SkinMask, RGB } from '@/lib/image-engine/types';

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

// 피부톤 이미지 생성
function createSkinToneImageData(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    // 피부톤 RGB (YCbCr 범위에 맞게)
    data[i * 3] = 200;     // R
    data[i * 3 + 1] = 150; // G
    data[i * 3 + 2] = 120; // B
  }

  return { data, width, height, channels: 3 };
}

// 색편향된 이미지 생성 (따뜻한 톤)
function createWarmToneImageData(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    data[i * 3] = 200;     // R
    data[i * 3 + 1] = 160; // G
    data[i * 3 + 2] = 100; // B
  }

  return { data, width, height, channels: 3 };
}

// 색편향된 이미지 생성 (차가운 톤)
function createCoolToneImageData(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    data[i * 3] = 100;     // R
    data[i * 3 + 1] = 140; // G
    data[i * 3 + 2] = 200; // B
  }

  return { data, width, height, channels: 3 };
}

// 테스트용 SkinMask 생성
function createTestSkinMask(width: number, height: number, ratio: number): SkinMask {
  const totalPixels = width * height;
  const skinPixelCount = Math.floor(totalPixels * ratio);
  const mask = new Uint8Array(totalPixels);

  for (let i = 0; i < skinPixelCount; i++) {
    mask[i] = 255;
  }

  return {
    mask,
    width,
    height,
    skinPixelCount,
    skinRatio: ratio,
  };
}

describe('CIE-3 모듈 통합 테스트', () => {
  // =========================================
  // 모듈 export 테스트
  // =========================================

  describe('모듈 export', () => {
    it('메인 프로세서 함수들이 export된다', () => {
      expect(processAWBCorrection).toBeDefined();
      expect(processAWBCorrectionWithTimeout).toBeDefined();
      expect(selectAndApplyAWB).toBeDefined();
    });

    it('피부 감지 함수들이 export된다', () => {
      expect(isSkinPixel).toBeDefined();
      expect(detectSkinMask).toBeDefined();
      expect(calculateSkinAverageRGB).toBeDefined();
      expect(calculateNonSkinAverageRGB).toBeDefined();
      expect(hasSufficientSkinCoverage).toBeDefined();
      expect(cleanSkinMask).toBeDefined();
    });

    it('AWB 알고리즘 함수들이 export된다', () => {
      expect(calculateGrayWorldGains).toBeDefined();
      expect(applyGrayWorld).toBeDefined();
      expect(applyVonKries).toBeDefined();
      expect(applySkinAwareAWB).toBeDefined();
      expect(applyGains).toBeDefined();
      expect(calculateAppliedGains).toBeDefined();
      expect(isValidGains).toBeDefined();
    });

    it('Fallback 함수들이 export된다', () => {
      expect(generateCIE3Fallback).toBeDefined();
      expect(generateAWBCorrectionFallback).toBeDefined();
      expect(generateCorrectedFallback).toBeDefined();
      expect(generateErrorCIE3Fallback).toBeDefined();
      expect(generateRandomCIE3Mock).toBeDefined();
    });

    it('신뢰도 계산 함수들이 export된다', () => {
      expect(calculateConfidence).toBeDefined();
      expect(calculateAWBConfidence).toBeDefined();
      expect(getMethodDefaultConfidence).toBeDefined();
    });
  });

  // =========================================
  // processAWBCorrection 통합 테스트
  // =========================================

  describe('processAWBCorrection 통합', () => {
    it('유효한 이미지에서 결과를 반환한다', async () => {
      const imageData = createSkinToneImageData(100, 100);
      const result = await processAWBCorrection(imageData);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('correctionApplied');
      expect(result).toHaveProperty('skinDetection');
      expect(result).toHaveProperty('metadata');
    });

    it('결과 구조가 CIE3Output 타입과 일치한다', async () => {
      const imageData = createSkinToneImageData(100, 100);
      const result = await processAWBCorrection(imageData);

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.correctionApplied).toBe('boolean');
      expect(result.skinDetection).toHaveProperty('detected');
      expect(result.skinDetection).toHaveProperty('coverage');
      expect(result.metadata).toHaveProperty('processingTime');
      expect(result.metadata).toHaveProperty('methodUsed');
      expect(result.metadata).toHaveProperty('confidence');
    });

    it('처리 시간을 기록한다', async () => {
      const imageData = createSkinToneImageData(100, 100);
      const result = await processAWBCorrection(imageData);

      expect(result.metadata.processingTime).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  // =========================================
  // isSkinPixel 테스트
  // =========================================

  describe('isSkinPixel', () => {
    it('피부톤 픽셀에서 true를 반환한다', () => {
      // YCbCr 피부 범위: Cb ∈ [77, 127], Cr ∈ [133, 173]
      const skinColor: RGB = { r: 200, g: 150, b: 120 };
      expect(isSkinPixel(skinColor)).toBe(true);
    });

    it('흰색에서 false를 반환한다', () => {
      const white: RGB = { r: 255, g: 255, b: 255 };
      expect(isSkinPixel(white)).toBe(false);
    });

    it('검정에서 false를 반환한다', () => {
      const black: RGB = { r: 0, g: 0, b: 0 };
      expect(isSkinPixel(black)).toBe(false);
    });

    it('파란색에서 false를 반환한다', () => {
      const blue: RGB = { r: 50, g: 50, b: 200 };
      expect(isSkinPixel(blue)).toBe(false);
    });
  });

  // =========================================
  // hasSufficientSkinCoverage 테스트
  // =========================================

  describe('hasSufficientSkinCoverage', () => {
    it('높은 피부 비율에서 true를 반환한다', () => {
      const skinMask = createTestSkinMask(100, 100, 0.3);
      expect(hasSufficientSkinCoverage(skinMask, 0.1)).toBe(true);
    });

    it('낮은 피부 비율에서 false를 반환한다', () => {
      const skinMask = createTestSkinMask(100, 100, 0.05);
      expect(hasSufficientSkinCoverage(skinMask, 0.1)).toBe(false);
    });

    it('경계값에서 올바르게 판단한다', () => {
      const skinMask = createTestSkinMask(100, 100, 0.1);
      expect(hasSufficientSkinCoverage(skinMask, 0.1)).toBe(true);
    });
  });

  // =========================================
  // calculateGrayWorldGains 테스트
  // =========================================

  describe('calculateGrayWorldGains', () => {
    it('균형 잡힌 RGB에서 1에 가까운 게인을 반환한다', () => {
      const avgRGB: RGB = { r: 128, g: 128, b: 128 };
      const gains = calculateGrayWorldGains(avgRGB);

      expect(gains.r).toBeCloseTo(1, 1);
      expect(gains.g).toBeCloseTo(1, 1);
      expect(gains.b).toBeCloseTo(1, 1);
    });

    it('빨간 편향 RGB에서 빨강 게인이 낮다', () => {
      const avgRGB: RGB = { r: 200, g: 160, b: 100 };
      const gains = calculateGrayWorldGains(avgRGB);

      expect(gains.r).toBeLessThan(gains.b);
    });

    it('파란 편향 RGB에서 파랑 게인이 낮다', () => {
      const avgRGB: RGB = { r: 100, g: 140, b: 200 };
      const gains = calculateGrayWorldGains(avgRGB);

      expect(gains.b).toBeLessThan(gains.r);
    });
  });

  // =========================================
  // isValidGains 테스트
  // =========================================

  describe('isValidGains', () => {
    it('유효한 게인에서 true를 반환한다', () => {
      const validGains: AWBGains = { r: 1.0, g: 1.0, b: 1.0 };
      expect(isValidGains(validGains)).toBe(true);
    });

    it('0 게인에서 false를 반환한다', () => {
      const zeroGains: AWBGains = { r: 0, g: 1.0, b: 1.0 };
      expect(isValidGains(zeroGains)).toBe(false);
    });

    it('음수 게인에서 false를 반환한다', () => {
      const negativeGains: AWBGains = { r: -1.0, g: 1.0, b: 1.0 };
      expect(isValidGains(negativeGains)).toBe(false);
    });

    it('매우 높은 게인에서 false를 반환한다', () => {
      const highGains: AWBGains = { r: 10.0, g: 1.0, b: 1.0 };
      expect(isValidGains(highGains)).toBe(false);
    });
  });

  // =========================================
  // applyGains 테스트
  // =========================================

  describe('applyGains', () => {
    it('게인을 올바르게 적용한다', () => {
      const imageData = createTestRGBImageData(10, 10, 100);
      const gains: AWBGains = { r: 1.5, g: 1.0, b: 0.8 };

      const result = applyGains(imageData, gains);

      expect(result.data[0]).toBeCloseTo(150, 0);
      expect(result.data[1]).toBeCloseTo(100, 0);
      expect(result.data[2]).toBeCloseTo(80, 0);
    });

    it('255를 초과하지 않는다', () => {
      const imageData = createTestRGBImageData(10, 10, 200);
      const gains: AWBGains = { r: 2.0, g: 2.0, b: 2.0 };

      const result = applyGains(imageData, gains);

      for (let i = 0; i < result.data.length; i++) {
        expect(result.data[i]).toBeLessThanOrEqual(255);
      }
    });

    it('원본 이미지를 변경하지 않는다', () => {
      const imageData = createTestRGBImageData(10, 10, 100);
      const originalFirst = imageData.data[0];
      const gains: AWBGains = { r: 1.5, g: 1.0, b: 0.8 };

      applyGains(imageData, gains);

      expect(imageData.data[0]).toBe(originalFirst);
    });
  });

  // =========================================
  // Fallback 함수 테스트
  // =========================================

  describe('Fallback 함수', () => {
    it('generateCIE3Fallback이 유효한 결과를 반환한다', () => {
      const fallback = generateCIE3Fallback();

      expect(fallback).toHaveProperty('success');
      expect(fallback).toHaveProperty('correctionApplied');
      expect(fallback).toHaveProperty('skinDetection');
      expect(fallback).toHaveProperty('metadata');
    });

    it('generateErrorCIE3Fallback이 success: false를 반환한다', () => {
      const fallback = generateErrorCIE3Fallback('Test error');

      expect(fallback.success).toBe(false);
    });

    it('generateRandomCIE3Mock이 무작위 결과를 생성한다', () => {
      const mock1 = generateRandomCIE3Mock();
      const mock2 = generateRandomCIE3Mock();

      expect(mock1).toHaveProperty('success');
      expect(mock2).toHaveProperty('success');
    });

    it('generateCIE3Fallback이 processingTime을 반영한다', () => {
      const fallback = generateCIE3Fallback(300);

      expect(fallback).toHaveProperty('metadata');
      expect(fallback.metadata?.processingTime).toBe(300);
    });
  });

  // =========================================
  // 신뢰도 계산 테스트
  // =========================================

  describe('신뢰도 계산', () => {
    it('getMethodDefaultConfidence가 메서드별 기본 신뢰도를 반환한다', () => {
      expect(getMethodDefaultConfidence('gray_world')).toBeGreaterThan(0);
      expect(getMethodDefaultConfidence('von_kries')).toBeGreaterThan(0);
      expect(getMethodDefaultConfidence('skin_aware')).toBeGreaterThan(0);
      expect(getMethodDefaultConfidence('none')).toBeGreaterThan(0);
    });

    it('skin_aware 메서드가 가장 높은 기본 신뢰도를 가진다', () => {
      expect(getMethodDefaultConfidence('skin_aware')).toBeGreaterThanOrEqual(
        getMethodDefaultConfidence('gray_world')
      );
      expect(getMethodDefaultConfidence('skin_aware')).toBeGreaterThanOrEqual(
        getMethodDefaultConfidence('von_kries')
      );
    });

    it('신뢰도가 0-1 범위 내에 있다', () => {
      const methods = ['gray_world', 'von_kries', 'skin_aware', 'none'] as const;

      methods.forEach((method) => {
        const confidence = getMethodDefaultConfidence(method);
        expect(confidence).toBeGreaterThanOrEqual(0);
        expect(confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  // =========================================
  // 타임아웃 테스트
  // =========================================

  describe('processAWBCorrectionWithTimeout', () => {
    it('타임아웃 내에 완료된다', async () => {
      const imageData = createSkinToneImageData(100, 100);
      const result = await processAWBCorrectionWithTimeout(imageData, undefined, 5000);

      expect(result).toBeDefined();
      expect(result.metadata.processingTime).toBeLessThan(5000);
    });
  });

  // =========================================
  // 엣지 케이스 테스트
  // =========================================

  describe('엣지 케이스', () => {
    it('작은 이미지를 처리한다', async () => {
      const imageData = createSkinToneImageData(5, 5);
      const result = await processAWBCorrection(imageData);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('균일한 이미지(피부 없음)를 처리한다', async () => {
      const imageData = createTestRGBImageData(100, 100, 128);
      const result = await processAWBCorrection(imageData);

      expect(result).toBeDefined();
      expect(result.skinDetection.detected).toBe(false);
    });

    it('완전히 어두운 이미지를 처리한다', async () => {
      const imageData = createTestRGBImageData(100, 100, 0);
      const result = await processAWBCorrection(imageData);

      expect(result).toBeDefined();
    });

    it('완전히 밝은 이미지를 처리한다', async () => {
      const imageData = createTestRGBImageData(100, 100, 255);
      const result = await processAWBCorrection(imageData);

      expect(result).toBeDefined();
    });
  });
});
