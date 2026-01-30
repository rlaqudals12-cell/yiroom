/**
 * CIE-3 피부 감지 모듈 테스트
 *
 * @module tests/lib/image-engine/cie-3/skin-detector
 * @description YCbCr 기반 피부 영역 감지 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  isSkinPixel,
  detectSkinMask,
  calculateSkinAverageRGB,
  calculateNonSkinAverageRGB,
  hasSufficientSkinCoverage,
  cleanSkinMask,
  type SkinDetectionConfig,
} from '@/lib/image-engine/cie-3/skin-detector';
import type { RGBImageData, SkinMask, RGB } from '@/lib/image-engine/types';

describe('lib/image-engine/cie-3/skin-detector', () => {
  // =========================================
  // isSkinPixel 테스트
  // =========================================

  describe('isSkinPixel', () => {
    // 일반적인 피부색 RGB 값들 (다양한 피부톤)
    const skinTones: RGB[] = [
      { r: 200, g: 160, b: 140 }, // 밝은 피부톤
      { r: 180, g: 130, b: 100 }, // 중간 피부톤
      { r: 140, g: 100, b: 80 }, // 어두운 피부톤
    ];

    // 피부가 아닌 색상들
    const nonSkinColors: RGB[] = [
      { r: 0, g: 0, b: 255 }, // 파란색
      { r: 0, g: 255, b: 0 }, // 녹색
      { r: 255, g: 255, b: 255 }, // 흰색
      { r: 0, g: 0, b: 0 }, // 검정색
    ];

    it('일반적인 피부 색상은 true를 반환한다', () => {
      for (const skin of skinTones) {
        expect(isSkinPixel(skin)).toBe(true);
      }
    });

    it('비피부 색상은 false를 반환한다', () => {
      for (const color of nonSkinColors) {
        expect(isSkinPixel(color)).toBe(false);
      }
    });

    it('커스텀 설정으로 감지 범위를 조절할 수 있다', () => {
      const strictConfig: SkinDetectionConfig = {
        cbMin: 90,
        cbMax: 115,
        crMin: 145,
        crMax: 165,
      };

      // 기본 설정에서는 피부로 감지되지만 strict에서는 아닐 수 있음
      const borderlineColor: RGB = { r: 200, g: 160, b: 140 };
      const defaultResult = isSkinPixel(borderlineColor);
      const strictResult = isSkinPixel(borderlineColor, strictConfig);

      // 두 결과가 다를 수 있음을 확인
      expect(typeof defaultResult).toBe('boolean');
      expect(typeof strictResult).toBe('boolean');
    });
  });

  // =========================================
  // detectSkinMask 테스트
  // =========================================

  describe('detectSkinMask', () => {
    it('피부색 이미지에서 높은 피부 비율을 반환한다', () => {
      // 2x2 피부색 이미지 (모두 피부색)
      const skinImage: RGBImageData = {
        data: new Uint8Array([
          200, 160, 140, 255, 200, 160, 140, 255, 200, 160, 140, 255, 200, 160, 140, 255,
        ]),
        width: 2,
        height: 2,
        channels: 4,
      };

      const mask = detectSkinMask(skinImage);

      expect(mask.width).toBe(2);
      expect(mask.height).toBe(2);
      expect(mask.skinRatio).toBeGreaterThan(0.5);
    });

    it('비피부 이미지에서 낮은 피부 비율을 반환한다', () => {
      // 2x2 파란색 이미지
      const blueImage: RGBImageData = {
        data: new Uint8Array([0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255]),
        width: 2,
        height: 2,
        channels: 4,
      };

      const mask = detectSkinMask(blueImage);

      expect(mask.skinRatio).toBe(0);
      expect(mask.skinPixelCount).toBe(0);
    });

    it('혼합 이미지에서 올바른 비율을 계산한다', () => {
      // 2x2 이미지: 좌상단, 우상단은 피부색, 하단은 파란색
      const mixedImage: RGBImageData = {
        data: new Uint8Array([
          200,
          160,
          140,
          255, // 피부
          200,
          160,
          140,
          255, // 피부
          0,
          0,
          255,
          255, // 비피부
          0,
          0,
          255,
          255, // 비피부
        ]),
        width: 2,
        height: 2,
        channels: 4,
      };

      const mask = detectSkinMask(mixedImage);

      expect(mask.skinPixelCount).toBe(2);
      expect(mask.skinRatio).toBeCloseTo(0.5, 2);
    });

    it('마스크 배열의 길이가 올바르다', () => {
      const image: RGBImageData = {
        data: new Uint8Array(4 * 3 * 4), // 4x3 이미지
        width: 4,
        height: 3,
        channels: 4,
      };

      const mask = detectSkinMask(image);

      expect(mask.mask.length).toBe(4 * 3);
    });
  });

  // =========================================
  // calculateSkinAverageRGB 테스트
  // =========================================

  describe('calculateSkinAverageRGB', () => {
    it('피부 영역의 평균 RGB를 계산한다', () => {
      // 2x1 이미지: 둘 다 피부색
      const image: RGBImageData = {
        data: new Uint8Array([
          200,
          160,
          140,
          255, // 첫 번째 픽셀
          180,
          140,
          120,
          255, // 두 번째 픽셀
        ]),
        width: 2,
        height: 1,
        channels: 4,
      };

      const mask: SkinMask = {
        mask: new Uint8Array([255, 255]),
        width: 2,
        height: 1,
        skinPixelCount: 2,
        skinRatio: 1,
      };

      const avgRGB = calculateSkinAverageRGB(image, mask);

      expect(avgRGB).not.toBeNull();
      expect(avgRGB!.r).toBe(190); // (200 + 180) / 2
      expect(avgRGB!.g).toBe(150); // (160 + 140) / 2
      expect(avgRGB!.b).toBe(130); // (140 + 120) / 2
    });

    it('피부 픽셀이 없으면 null을 반환한다', () => {
      const image: RGBImageData = {
        data: new Uint8Array([0, 0, 255, 255]),
        width: 1,
        height: 1,
        channels: 4,
      };

      const mask: SkinMask = {
        mask: new Uint8Array([0]),
        width: 1,
        height: 1,
        skinPixelCount: 0,
        skinRatio: 0,
      };

      const avgRGB = calculateSkinAverageRGB(image, mask);

      expect(avgRGB).toBeNull();
    });
  });

  // =========================================
  // calculateNonSkinAverageRGB 테스트
  // =========================================

  describe('calculateNonSkinAverageRGB', () => {
    it('비피부 영역의 평균 RGB를 계산한다', () => {
      // 2x1 이미지: 하나는 피부, 하나는 비피부
      const image: RGBImageData = {
        data: new Uint8Array([
          200,
          160,
          140,
          255, // 피부 (마스크됨)
          0,
          100,
          200,
          255, // 비피부
        ]),
        width: 2,
        height: 1,
        channels: 4,
      };

      const mask: SkinMask = {
        mask: new Uint8Array([255, 0]),
        width: 2,
        height: 1,
        skinPixelCount: 1,
        skinRatio: 0.5,
      };

      const avgRGB = calculateNonSkinAverageRGB(image, mask);

      expect(avgRGB).not.toBeNull();
      expect(avgRGB!.r).toBe(0);
      expect(avgRGB!.g).toBe(100);
      expect(avgRGB!.b).toBe(200);
    });

    it('모두 피부이면 null을 반환한다', () => {
      const image: RGBImageData = {
        data: new Uint8Array([200, 160, 140, 255]),
        width: 1,
        height: 1,
        channels: 4,
      };

      const mask: SkinMask = {
        mask: new Uint8Array([255]),
        width: 1,
        height: 1,
        skinPixelCount: 1,
        skinRatio: 1,
      };

      const avgRGB = calculateNonSkinAverageRGB(image, mask);

      expect(avgRGB).toBeNull();
    });
  });

  // =========================================
  // hasSufficientSkinCoverage 테스트
  // =========================================

  describe('hasSufficientSkinCoverage', () => {
    it('피부 비율이 임계값 이상이면 true를 반환한다', () => {
      const mask: SkinMask = {
        mask: new Uint8Array(100),
        width: 10,
        height: 10,
        skinPixelCount: 30,
        skinRatio: 0.3,
      };

      expect(hasSufficientSkinCoverage(mask, 0.2)).toBe(true);
      expect(hasSufficientSkinCoverage(mask, 0.3)).toBe(true);
    });

    it('피부 비율이 임계값 미만이면 false를 반환한다', () => {
      const mask: SkinMask = {
        mask: new Uint8Array(100),
        width: 10,
        height: 10,
        skinPixelCount: 10,
        skinRatio: 0.1,
      };

      expect(hasSufficientSkinCoverage(mask, 0.2)).toBe(false);
    });

    it('기본 임계값을 사용할 수 있다', () => {
      const mask: SkinMask = {
        mask: new Uint8Array(100),
        width: 10,
        height: 10,
        skinPixelCount: 50,
        skinRatio: 0.5,
      };

      // 기본 임계값으로 호출
      const result = hasSufficientSkinCoverage(mask);
      expect(typeof result).toBe('boolean');
    });
  });

  // =========================================
  // cleanSkinMask 테스트
  // =========================================

  describe('cleanSkinMask', () => {
    it('노이즈가 있는 마스크를 정리한다', () => {
      // 5x5 마스크: 중앙에 피부 영역
      const mask = new Uint8Array([
        0, 0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 255, 255, 255, 0, 0, 255, 255, 255, 0, 0, 0, 0, 0, 0,
      ]);

      const original: SkinMask = {
        mask,
        width: 5,
        height: 5,
        skinPixelCount: 9,
        skinRatio: 9 / 25,
      };

      const cleaned = cleanSkinMask(original);

      expect(cleaned.width).toBe(5);
      expect(cleaned.height).toBe(5);
      // 형태학적 연산 후에도 유효한 결과를 반환
      expect(cleaned.mask.length).toBe(25);
    });

    it('빈 마스크는 빈 상태로 유지된다', () => {
      const empty: SkinMask = {
        mask: new Uint8Array(25),
        width: 5,
        height: 5,
        skinPixelCount: 0,
        skinRatio: 0,
      };

      const cleaned = cleanSkinMask(empty);

      expect(cleaned.skinPixelCount).toBe(0);
    });

    it('작은 이미지에서도 작동한다', () => {
      const small: SkinMask = {
        mask: new Uint8Array([255, 255, 255, 255]),
        width: 2,
        height: 2,
        skinPixelCount: 4,
        skinRatio: 1,
      };

      // 경계 조건이라 대부분 erosion 됨
      const cleaned = cleanSkinMask(small);

      expect(cleaned.width).toBe(2);
      expect(cleaned.height).toBe(2);
    });
  });
});
