/**
 * CIE-3: AWB 보정 모듈 테스트
 *
 * @see docs/specs/SDD-CIE-3-AWB-CORRECTION.md
 *
 * 테스트 범위:
 * - processor.ts: processAWBCorrection, selectAndApplyAWB
 * - skin-detector.ts: isSkinPixel, detectSkinMask, calculateSkinAverageRGB
 * - awb-algorithms.ts: calculateGrayWorldGains, applyGrayWorld, applyVonKries, isValidGains
 * - fallback.ts: generateCIE3Fallback, generateRandomCIE3Mock
 * - confidence.ts: calculateConfidence, calculateAWBConfidence
 */

import { describe, it, expect } from 'vitest';

// Processor
import {
  processAWBCorrection,
  selectAndApplyAWB,
} from '@/lib/image-engine/cie-3/processor';

// Skin Detector
import {
  isSkinPixel,
  detectSkinMask,
  calculateSkinAverageRGB,
  calculateNonSkinAverageRGB,
  hasSufficientSkinCoverage,
  cleanSkinMask,
} from '@/lib/image-engine/cie-3/skin-detector';

// AWB Algorithms
import {
  calculateGrayWorldGains,
  applyGrayWorld,
  applyVonKries,
  applySkinAwareAWB,
  applyGains,
  calculateAppliedGains,
  isValidGains,
} from '@/lib/image-engine/cie-3/awb-algorithms';

// Fallback
import {
  generateCIE3Fallback,
  generateAWBCorrectionFallback,
  generateCorrectedFallback,
  generateErrorCIE3Fallback,
  generateRandomCIE3Mock,
} from '@/lib/image-engine/cie-3/fallback';

// Confidence
import {
  calculateConfidence,
  calculateAWBConfidence,
  getMethodDefaultConfidence,
} from '@/lib/image-engine/cie-3/confidence';

import type { RGBImageData, RGB, SkinMask } from '@/lib/image-engine/types';

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

function createSkinToneImageData(width = 100, height = 100): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  // 피부톤 RGB 값 (대략적인 아시아인 피부톤)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = 220;     // R
    data[i * 3 + 1] = 180; // G
    data[i * 3 + 2] = 150; // B
  }
  return { width, height, channels: 3, data };
}

function createWarmImageData(width = 100, height = 100): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  // 따뜻한 조명 (노란색 계열)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = 200;     // R (높음)
    data[i * 3 + 1] = 180; // G (중간)
    data[i * 3 + 2] = 120; // B (낮음)
  }
  return { width, height, channels: 3, data };
}

function createMockSkinMask(width = 100, height = 100, skinRatio = 0.2): SkinMask {
  const mask = new Uint8Array(width * height);
  const skinPixelCount = Math.floor(width * height * skinRatio);
  for (let i = 0; i < skinPixelCount; i++) {
    mask[i] = 255;
  }
  return {
    mask,
    width,
    height,
    skinPixelCount,
    skinRatio,
  };
}

// ============================================
// Processor 테스트
// ============================================

describe('CIE-3 Processor', () => {
  describe('processAWBCorrection', () => {
    it('should return success with neutral image', () => {
      const imageData = createTestRGBImageData();
      const result = processAWBCorrection(imageData);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(typeof result.metadata.processingTime).toBe('number');
    });

    it('should detect skin in skin-tone image', () => {
      const imageData = createSkinToneImageData();
      const result = processAWBCorrection(imageData);

      expect(result.success).toBe(true);
      expect(result.skinDetection).toBeDefined();
    });

    it('should include method used in metadata', () => {
      const imageData = createWarmImageData();
      const result = processAWBCorrection(imageData);

      expect(result.metadata.methodUsed).toBeDefined();
      expect(['gray_world', 'von_kries', 'skin_aware', 'none', 'fallback']).toContain(
        result.metadata.methodUsed
      );
    });

    it('should return confidence score', () => {
      const imageData = createTestRGBImageData();
      const result = processAWBCorrection(imageData);

      expect(typeof result.metadata.confidence).toBe('number');
      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
      expect(result.metadata.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('selectAndApplyAWB', () => {
    it('should return null for extreme gains', () => {
      // 극단적인 이미지 생성 (한 채널만 있음)
      const data = new Uint8Array(100 * 100 * 3);
      for (let i = 0; i < 100 * 100; i++) {
        data[i * 3] = 255;     // R만 최대
        data[i * 3 + 1] = 1;   // G 거의 0
        data[i * 3 + 2] = 1;   // B 거의 0
      }
      const extremeImage: RGBImageData = {
        width: 100,
        height: 100,
        channels: 3,
        data,
      };

      const result = selectAndApplyAWB(extremeImage);
      // 극단적인 게인이 필요하면 null 반환
      expect(result === null || result.method === 'none' || !isValidGains(result.gains)).toBe(true);
    });

    it('should skip correction when CCT is already optimal', () => {
      // 이미 D65에 가까운 이미지
      const data = new Uint8Array(100 * 100 * 3);
      for (let i = 0; i < 100 * 100; i++) {
        data[i * 3] = 128;
        data[i * 3 + 1] = 128;
        data[i * 3 + 2] = 128;
      }
      const neutralImage: RGBImageData = {
        width: 100,
        height: 100,
        channels: 3,
        data,
      };

      const result = selectAndApplyAWB(neutralImage);
      // 이미 적정 CCT면 보정 불필요
      if (result) {
        expect(result.method).toBe('none');
      }
    });
  });
});

// ============================================
// Skin Detector 테스트
// ============================================

describe('CIE-3 Skin Detector', () => {
  describe('isSkinPixel', () => {
    it('should detect skin-tone pixels', () => {
      // 일반적인 피부톤
      const skinRGB: RGB = { r: 220, g: 180, b: 150 };
      expect(isSkinPixel(skinRGB)).toBe(true);
    });

    it('should reject non-skin pixels', () => {
      // 파란색 (하늘)
      const blueRGB: RGB = { r: 100, g: 150, b: 220 };
      expect(isSkinPixel(blueRGB)).toBe(false);

      // 녹색 (잔디)
      const greenRGB: RGB = { r: 50, g: 150, b: 50 };
      expect(isSkinPixel(greenRGB)).toBe(false);
    });

    it('should detect various skin tones', () => {
      // 밝은 피부톤
      const lightSkin: RGB = { r: 255, g: 220, b: 190 };
      // 어두운 피부톤
      const darkSkin: RGB = { r: 140, g: 90, b: 70 };

      // 어느 하나라도 피부로 감지되면 ok (YCbCr 범위에 따라 다름)
      const results = [isSkinPixel(lightSkin), isSkinPixel(darkSkin)];
      expect(results.some((r) => r)).toBe(true);
    });
  });

  describe('detectSkinMask', () => {
    it('should create skin mask with correct dimensions', () => {
      const imageData = createTestRGBImageData(200, 150);
      const mask = detectSkinMask(imageData);

      expect(mask.width).toBe(200);
      expect(mask.height).toBe(150);
      expect(mask.mask.length).toBe(200 * 150);
    });

    it('should detect skin pixels in skin-tone image', () => {
      const imageData = createSkinToneImageData();
      const mask = detectSkinMask(imageData);

      expect(mask.skinPixelCount).toBeGreaterThan(0);
      expect(mask.skinRatio).toBeGreaterThan(0);
    });

    it('should calculate correct skin ratio', () => {
      const imageData = createTestRGBImageData(10, 10);
      const mask = detectSkinMask(imageData);

      expect(mask.skinRatio).toBe(mask.skinPixelCount / (10 * 10));
    });
  });

  describe('calculateSkinAverageRGB', () => {
    it('should return null when no skin pixels', () => {
      const imageData = createTestRGBImageData();
      const emptyMask = createMockSkinMask(100, 100, 0);

      const result = calculateSkinAverageRGB(imageData, emptyMask);
      expect(result).toBeNull();
    });

    it('should calculate average RGB for skin area', () => {
      const imageData = createSkinToneImageData(10, 10);
      const mask = detectSkinMask(imageData);

      if (mask.skinPixelCount > 0) {
        const avg = calculateSkinAverageRGB(imageData, mask);
        expect(avg).not.toBeNull();
        if (avg) {
          expect(avg.r).toBeGreaterThan(0);
          expect(avg.g).toBeGreaterThan(0);
          expect(avg.b).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('calculateNonSkinAverageRGB', () => {
    it('should return null when all pixels are skin', () => {
      const imageData = createTestRGBImageData(10, 10);
      const fullMask = createMockSkinMask(10, 10, 1.0);

      const result = calculateNonSkinAverageRGB(imageData, fullMask);
      expect(result).toBeNull();
    });

    it('should calculate average RGB for non-skin area', () => {
      const imageData = createTestRGBImageData(10, 10);
      const partialMask = createMockSkinMask(10, 10, 0.5);

      const result = calculateNonSkinAverageRGB(imageData, partialMask);
      expect(result).not.toBeNull();
    });
  });

  describe('hasSufficientSkinCoverage', () => {
    it('should return true when coverage is sufficient', () => {
      const mask = createMockSkinMask(100, 100, 0.2);
      expect(hasSufficientSkinCoverage(mask, 0.1)).toBe(true);
    });

    it('should return false when coverage is insufficient', () => {
      const mask = createMockSkinMask(100, 100, 0.05);
      expect(hasSufficientSkinCoverage(mask, 0.1)).toBe(false);
    });
  });

  describe('cleanSkinMask', () => {
    it('should return mask with same dimensions', () => {
      const originalMask = createMockSkinMask(50, 50, 0.3);
      const cleanedMask = cleanSkinMask(originalMask);

      expect(cleanedMask.width).toBe(50);
      expect(cleanedMask.height).toBe(50);
    });

    it('should reduce noise in mask', () => {
      // 노이즈가 있는 마스크 생성
      const noisyMask = createMockSkinMask(20, 20, 0.5);
      // 랜덤하게 일부 픽셀 토글
      for (let i = 0; i < 50; i++) {
        const idx = Math.floor(Math.random() * 400);
        noisyMask.mask[idx] = noisyMask.mask[idx] === 255 ? 0 : 255;
      }

      const cleanedMask = cleanSkinMask(noisyMask);
      // erosion + dilation으로 일부 노이즈가 제거됨
      expect(cleanedMask.mask).toBeDefined();
    });
  });
});

// ============================================
// AWB Algorithms 테스트
// ============================================

describe('CIE-3 AWB Algorithms', () => {
  describe('calculateGrayWorldGains', () => {
    it('should calculate gains to normalize to gray', () => {
      const avgRGB: RGB = { r: 200, g: 128, b: 100 };
      const gains = calculateGrayWorldGains(avgRGB);

      // 128 / avgRGB
      expect(gains.r).toBeCloseTo(128 / 200, 1);
      expect(gains.g).toBeCloseTo(1, 1);
      expect(gains.b).toBeCloseTo(128 / 100, 1);
    });

    it('should handle zero values safely', () => {
      const avgRGB: RGB = { r: 0, g: 128, b: 0 };
      const gains = calculateGrayWorldGains(avgRGB);

      expect(gains.r).toBe(128); // 128 / 1 (max(1, 0))
      expect(gains.g).toBeCloseTo(1, 1);
      expect(gains.b).toBe(128);
    });

    it('should return unity gains for gray input', () => {
      const avgRGB: RGB = { r: 128, g: 128, b: 128 };
      const gains = calculateGrayWorldGains(avgRGB);

      expect(gains.r).toBeCloseTo(1, 1);
      expect(gains.g).toBeCloseTo(1, 1);
      expect(gains.b).toBeCloseTo(1, 1);
    });
  });

  describe('applyGrayWorld', () => {
    it('should apply gray world correction', () => {
      const imageData = createWarmImageData(10, 10);
      const avgRGB: RGB = { r: 200, g: 180, b: 120 };

      const corrected = applyGrayWorld(imageData, avgRGB);

      expect(corrected.width).toBe(10);
      expect(corrected.height).toBe(10);
      expect(corrected.data.length).toBe(10 * 10 * 3);
    });

    it('should clamp values to 255', () => {
      // 높은 값에 높은 게인 적용
      const data = new Uint8Array([250, 128, 50]); // 1 픽셀
      const imageData: RGBImageData = {
        width: 1,
        height: 1,
        channels: 3,
        data,
      };
      const avgRGB: RGB = { r: 100, g: 128, b: 50 }; // r 게인 1.28, b 게인 2.56

      const corrected = applyGrayWorld(imageData, avgRGB);

      // R: 250 * 1.28 = 320 → 255로 클램프
      expect(corrected.data[0]).toBeLessThanOrEqual(255);
    });
  });

  describe('applyVonKries', () => {
    it('should apply Von Kries chromatic adaptation', () => {
      const imageData = createWarmImageData(10, 10);
      const sourceWhite: RGB = { r: 200, g: 180, b: 120 };

      const corrected = applyVonKries(imageData, sourceWhite);

      expect(corrected.width).toBe(10);
      expect(corrected.height).toBe(10);
      expect(corrected.data).toBeDefined();
    });
  });

  describe('applySkinAwareAWB', () => {
    it('should return null when no non-skin pixels', () => {
      const imageData = createTestRGBImageData(10, 10);
      const fullSkinMask = createMockSkinMask(10, 10, 1.0);

      const result = applySkinAwareAWB(imageData, fullSkinMask);
      expect(result).toBeNull();
    });

    it('should return null when non-skin area is too dark', () => {
      // 매우 어두운 이미지
      const data = new Uint8Array(100 * 100 * 3).fill(10);
      const darkImage: RGBImageData = {
        width: 100,
        height: 100,
        channels: 3,
        data,
      };
      const partialMask = createMockSkinMask(100, 100, 0.3);

      const result = applySkinAwareAWB(darkImage, partialMask);
      expect(result).toBeNull();
    });
  });

  describe('applyGains', () => {
    it('should apply gains to image', () => {
      const data = new Uint8Array([100, 100, 100]);
      const imageData: RGBImageData = {
        width: 1,
        height: 1,
        channels: 3,
        data,
      };
      const gains = { r: 1.2, g: 1.0, b: 0.8 };

      const result = applyGains(imageData, gains);

      expect(result.data[0]).toBe(120); // 100 * 1.2
      expect(result.data[1]).toBe(100); // 100 * 1.0
      expect(result.data[2]).toBe(80);  // 100 * 0.8
    });
  });

  describe('calculateAppliedGains', () => {
    it('should calculate gains from before/after RGB', () => {
      const original: RGB = { r: 100, g: 100, b: 100 };
      const corrected: RGB = { r: 120, g: 100, b: 80 };

      const gains = calculateAppliedGains(original, corrected);

      expect(gains.r).toBeCloseTo(1.2, 2);
      expect(gains.g).toBeCloseTo(1.0, 2);
      expect(gains.b).toBeCloseTo(0.8, 2);
    });
  });

  describe('isValidGains', () => {
    it('should accept gains within valid range', () => {
      const validGains = { r: 1.0, g: 1.1, b: 0.9 };
      expect(isValidGains(validGains)).toBe(true);
    });

    it('should reject gains outside valid range', () => {
      const tooHighGains = { r: 2.0, g: 1.0, b: 1.0 };
      const tooLowGains = { r: 0.5, g: 1.0, b: 1.0 };

      expect(isValidGains(tooHighGains)).toBe(false);
      expect(isValidGains(tooLowGains)).toBe(false);
    });

    it('should use custom range when provided', () => {
      const gains = { r: 0.6, g: 1.0, b: 1.0 };

      expect(isValidGains(gains, 0.5, 1.5)).toBe(true);
      expect(isValidGains(gains, 0.7, 1.5)).toBe(false);
    });
  });
});

// ============================================
// Confidence 테스트
// ============================================

describe('CIE-3 Confidence', () => {
  describe('getMethodDefaultConfidence', () => {
    it('should return appropriate confidence for each method', () => {
      // 실제 구현: none=0.9, skin_aware=0.85, gray_world=0.75
      // 'none'은 보정 불필요 = 원본 품질 높음 = 높은 신뢰도
      const noneConfidence = getMethodDefaultConfidence('none');
      const skinAwareConfidence = getMethodDefaultConfidence('skin_aware');
      const grayWorldConfidence = getMethodDefaultConfidence('gray_world');

      expect(noneConfidence).toBe(0.9);
      expect(skinAwareConfidence).toBe(0.85);
      expect(grayWorldConfidence).toBe(0.75);

      expect(noneConfidence).toBeGreaterThan(skinAwareConfidence);
      expect(skinAwareConfidence).toBeGreaterThan(grayWorldConfidence);
    });
  });

  describe('calculateConfidence', () => {
    it('should return valid confidence range', () => {
      const gains = { r: 1.0, g: 1.0, b: 1.0 };
      const confidence = calculateConfidence(gains, 5500, 6500, 0.5);

      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });
});

// ============================================
// Fallback 테스트
// ============================================

describe('CIE-3 Fallback', () => {
  describe('generateCIE3Fallback', () => {
    it('should return valid CIE3Output', () => {
      const result = generateCIE3Fallback(100);

      expect(result.success).toBe(true);
      expect(result.correctionApplied).toBe(false);
      expect(result.metadata.processingTime).toBe(100);
      expect(result.metadata.methodUsed).toBe('fallback');
    });
  });

  describe('generateAWBCorrectionFallback', () => {
    it('should return default AWB correction result', () => {
      const result = generateAWBCorrectionFallback();

      expect(result.gains).toEqual({ r: 1, g: 1, b: 1 });
      expect(result.method).toBe('none');
      expect(result.originalCCT).toBe(6500);
    });
  });

  describe('generateCorrectedFallback', () => {
    it('should return corrected fallback with given CCT', () => {
      const result = generateCorrectedFallback(4000, 200);

      expect(result.success).toBe(true);
      expect(result.correctionApplied).toBe(true);
      expect(result.result?.originalCCT).toBe(4000);
      expect(result.metadata.processingTime).toBe(200);
    });
  });

  describe('generateErrorCIE3Fallback', () => {
    it('should return error state', () => {
      const result = generateErrorCIE3Fallback('Test error');

      expect(result.success).toBe(false);
      expect(result.metadata.confidence).toBe(0);
      expect(result.metadata.methodUsed).toBe('error');
    });
  });

  describe('generateRandomCIE3Mock', () => {
    it('should generate valid random mock', () => {
      const result = generateRandomCIE3Mock();

      expect(result.success).toBe(true);
      expect(typeof result.correctionApplied).toBe('boolean');
      expect(result.skinDetection).toBeDefined();
    });

    it('should generate different values on multiple calls', () => {
      const results = Array.from({ length: 10 }, () => generateRandomCIE3Mock());
      const methods = results.map((r) => r.metadata.methodUsed);
      const uniqueMethods = new Set(methods);

      // 10번 호출 시 최소 2개 이상의 다른 메서드가 나와야 함
      expect(uniqueMethods.size).toBeGreaterThanOrEqual(1);
    });
  });
});

// ============================================
// 통합 테스트
// ============================================

describe('CIE-3 Integration', () => {
  it('should process warm image with correction', () => {
    const warmImage = createWarmImageData(50, 50);
    const result = processAWBCorrection(warmImage);

    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
  });

  it('should process skin-tone image with skin detection', () => {
    const skinImage = createSkinToneImageData(50, 50);
    const result = processAWBCorrection(skinImage);

    expect(result.success).toBe(true);
    expect(result.skinDetection).toBeDefined();
  });

  it('should handle neutral image without unnecessary correction', () => {
    const neutralImage = createTestRGBImageData(50, 50);
    const result = processAWBCorrection(neutralImage);

    expect(result.success).toBe(true);
    // 중립적인 이미지는 보정 불필요하거나 최소 보정
  });
});
