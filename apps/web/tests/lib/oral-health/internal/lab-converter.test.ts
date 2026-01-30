/**
 * Lab 색공간 변환 테스트
 *
 * @module tests/lib/oral-health/internal/lab-converter
 * @description sRGB ↔ Lab 색공간 변환 검증
 */

import { describe, it, expect } from 'vitest';
import {
  rgbToLab,
  labToRgb,
  labToHex,
  calculateAverageLabFromPixels,
} from '@/lib/oral-health/internal/lab-converter';
import type { RGBColor } from '@/types/oral-health';

describe('lib/oral-health/internal/lab-converter', () => {
  describe('rgbToLab', () => {
    it('should convert pure white (255,255,255) to L=100', () => {
      const result = rgbToLab({ r: 255, g: 255, b: 255 });

      expect(result.L).toBeCloseTo(100, 0);
      expect(result.a).toBeCloseTo(0, 0);
      expect(result.b).toBeCloseTo(0, 0);
    });

    it('should convert pure black (0,0,0) to L=0', () => {
      const result = rgbToLab({ r: 0, g: 0, b: 0 });

      expect(result.L).toBeCloseTo(0, 0);
      expect(result.a).toBeCloseTo(0, 0);
      expect(result.b).toBeCloseTo(0, 0);
    });

    it('should convert red to positive a* value', () => {
      const result = rgbToLab({ r: 255, g: 0, b: 0 });

      expect(result.a).toBeGreaterThan(50); // 빨간색은 양의 a* 값
    });

    it('should convert green to negative a* value', () => {
      const result = rgbToLab({ r: 0, g: 255, b: 0 });

      expect(result.a).toBeLessThan(-50); // 녹색은 음의 a* 값
    });

    it('should convert yellow to positive b* value', () => {
      const result = rgbToLab({ r: 255, g: 255, b: 0 });

      expect(result.b).toBeGreaterThan(80); // 노란색은 양의 b* 값
    });

    it('should convert blue to negative b* value', () => {
      const result = rgbToLab({ r: 0, g: 0, b: 255 });

      expect(result.b).toBeLessThan(-80); // 파란색은 음의 b* 값
    });

    it('should convert mid-gray (128,128,128) to mid-lightness', () => {
      const result = rgbToLab({ r: 128, g: 128, b: 128 });

      expect(result.L).toBeGreaterThan(40);
      expect(result.L).toBeLessThan(60);
      expect(result.a).toBeCloseTo(0, 0);
      expect(result.b).toBeCloseTo(0, 0);
    });

    it('should handle typical tooth color (ivory)', () => {
      // 아이보리색 (치아 색상 범위)
      const result = rgbToLab({ r: 255, g: 255, b: 220 });

      expect(result.L).toBeGreaterThan(90);
      expect(result.b).toBeGreaterThan(10); // 약간의 황색기
    });
  });

  describe('labToRgb', () => {
    it('should convert L=100 back to white', () => {
      const result = labToRgb({ L: 100, a: 0, b: 0 });

      expect(result.r).toBeCloseTo(255, 0);
      expect(result.g).toBeCloseTo(255, 0);
      expect(result.b).toBeCloseTo(255, 0);
    });

    it('should convert L=0 back to black', () => {
      const result = labToRgb({ L: 0, a: 0, b: 0 });

      expect(result.r).toBe(0);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should handle round-trip conversion (RGB → Lab → RGB)', () => {
      const original: RGBColor = { r: 200, g: 180, b: 150 };
      const lab = rgbToLab(original);
      const result = labToRgb(lab);

      expect(result.r).toBeCloseTo(original.r, 0);
      expect(result.g).toBeCloseTo(original.g, 0);
      expect(result.b).toBeCloseTo(original.b, 0);
    });

    it('should clamp out-of-gamut values', () => {
      // Lab 공간에서 RGB로 변환 불가능한 값
      const result = labToRgb({ L: 50, a: 100, b: 100 });

      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    });
  });

  describe('labToHex', () => {
    it('should convert L=100 to #ffffff', () => {
      const result = labToHex({ L: 100, a: 0, b: 0 });

      expect(result.toLowerCase()).toBe('#ffffff');
    });

    it('should convert L=0 to #000000', () => {
      const result = labToHex({ L: 0, a: 0, b: 0 });

      expect(result).toBe('#000000');
    });

    it('should return valid hex format', () => {
      const result = labToHex({ L: 70, a: 2, b: 18 });

      expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should convert typical tooth Lab to valid hex', () => {
      // VITA A2: L=67, a=2.5, b=19
      const result = labToHex({ L: 67, a: 2.5, b: 19 });

      expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('calculateAverageLabFromPixels', () => {
    it('should return zeros for empty array', () => {
      const result = calculateAverageLabFromPixels([]);

      expect(result.L).toBe(0);
      expect(result.a).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should return same value for single pixel', () => {
      const pixel: RGBColor = { r: 200, g: 180, b: 160 };
      const singlePixelLab = rgbToLab(pixel);
      const result = calculateAverageLabFromPixels([pixel]);

      expect(result.L).toBeCloseTo(singlePixelLab.L, 5);
      expect(result.a).toBeCloseTo(singlePixelLab.a, 5);
      expect(result.b).toBeCloseTo(singlePixelLab.b, 5);
    });

    it('should calculate average for multiple pixels', () => {
      const pixels: RGBColor[] = [
        { r: 255, g: 255, b: 255 }, // 흰색 (L≈100)
        { r: 0, g: 0, b: 0 }, // 검정색 (L≈0)
      ];

      const result = calculateAverageLabFromPixels(pixels);

      // 평균 L 값은 0과 100 사이여야 함
      expect(result.L).toBeGreaterThan(30);
      expect(result.L).toBeLessThan(70);
    });

    it('should handle homogeneous pixels', () => {
      const pixels: RGBColor[] = Array(10).fill({ r: 200, g: 180, b: 160 });
      const singleLab = rgbToLab({ r: 200, g: 180, b: 160 });
      const result = calculateAverageLabFromPixels(pixels);

      expect(result.L).toBeCloseTo(singleLab.L, 5);
      expect(result.a).toBeCloseTo(singleLab.a, 5);
      expect(result.b).toBeCloseTo(singleLab.b, 5);
    });

    it('should calculate correct average for gum-like colors', () => {
      // 잇몸 색상 범위의 픽셀들
      const pixels: RGBColor[] = [
        { r: 200, g: 150, b: 140 },
        { r: 195, g: 145, b: 135 },
        { r: 205, g: 155, b: 145 },
      ];

      const result = calculateAverageLabFromPixels(pixels);

      // 평균 L은 60~70 범위
      expect(result.L).toBeGreaterThan(50);
      expect(result.L).toBeLessThan(80);

      // a*는 양수 (붉은기)
      expect(result.a).toBeGreaterThan(0);
    });
  });
});
