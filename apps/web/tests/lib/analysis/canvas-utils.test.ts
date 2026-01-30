/**
 * Canvas 유틸리티 테스트
 *
 * @module tests/lib/analysis/canvas-utils
 * @description Canvas 색상 변환 및 유틸리티 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  rgbaToHsl,
  hslToRgba,
  getHeatmapColor,
  supportsOffscreenCanvas,
} from '@/lib/analysis/canvas-utils';

// =============================================================================
// 테스트
// =============================================================================

describe('lib/analysis/canvas-utils', () => {
  // ---------------------------------------------------------------------------
  // rgbaToHsl
  // ---------------------------------------------------------------------------

  describe('rgbaToHsl', () => {
    it('should convert pure red to HSL', () => {
      const { h, s, l } = rgbaToHsl(255, 0, 0);

      expect(h).toBeCloseTo(0, 2); // 0도 (빨강)
      expect(s).toBeCloseTo(1, 2); // 100% 채도
      expect(l).toBeCloseTo(0.5, 2); // 50% 밝기
    });

    it('should convert pure green to HSL', () => {
      const { h, s, l } = rgbaToHsl(0, 255, 0);

      expect(h).toBeCloseTo(0.333, 2); // 120도 → 0.333 (녹색)
      expect(s).toBeCloseTo(1, 2);
      expect(l).toBeCloseTo(0.5, 2);
    });

    it('should convert pure blue to HSL', () => {
      const { h, s, l } = rgbaToHsl(0, 0, 255);

      expect(h).toBeCloseTo(0.667, 2); // 240도 → 0.667 (파랑)
      expect(s).toBeCloseTo(1, 2);
      expect(l).toBeCloseTo(0.5, 2);
    });

    it('should convert white to HSL', () => {
      const { s, l } = rgbaToHsl(255, 255, 255);

      expect(s).toBe(0); // 무채색
      expect(l).toBe(1); // 100% 밝기
    });

    it('should convert black to HSL', () => {
      const { s, l } = rgbaToHsl(0, 0, 0);

      expect(s).toBe(0); // 무채색
      expect(l).toBe(0); // 0% 밝기
    });

    it('should convert gray to HSL', () => {
      const { s, l } = rgbaToHsl(128, 128, 128);

      expect(s).toBe(0); // 무채색
      expect(l).toBeCloseTo(0.5, 1); // 약 50% 밝기
    });

    it('should handle skin tone colors', () => {
      // 피부톤 (약간 주황/갈색)
      const { h, s, l } = rgbaToHsl(210, 180, 140);

      expect(h).toBeGreaterThan(0);
      expect(h).toBeLessThan(0.15); // 주황-갈색 범위
      expect(s).toBeGreaterThan(0);
      expect(l).toBeGreaterThan(0.5);
    });
  });

  // ---------------------------------------------------------------------------
  // hslToRgba
  // ---------------------------------------------------------------------------

  describe('hslToRgba', () => {
    it('should convert HSL red to RGBA', () => {
      const { r, g, b } = hslToRgba(0, 1, 0.5);

      expect(r).toBe(255);
      expect(g).toBe(0);
      expect(b).toBe(0);
    });

    it('should convert HSL green to RGBA', () => {
      const { r, g, b } = hslToRgba(0.333, 1, 0.5);

      expect(r).toBeLessThan(10);
      expect(g).toBe(255);
      expect(b).toBeLessThan(10);
    });

    it('should convert HSL blue to RGBA', () => {
      const { r, g, b } = hslToRgba(0.667, 1, 0.5);

      expect(r).toBeLessThan(10);
      expect(g).toBeLessThan(10);
      expect(b).toBe(255);
    });

    it('should convert HSL white to RGBA', () => {
      const { r, g, b } = hslToRgba(0, 0, 1);

      expect(r).toBe(255);
      expect(g).toBe(255);
      expect(b).toBe(255);
    });

    it('should convert HSL black to RGBA', () => {
      const { r, g, b } = hslToRgba(0, 0, 0);

      expect(r).toBe(0);
      expect(g).toBe(0);
      expect(b).toBe(0);
    });

    it('should handle zero saturation (grayscale)', () => {
      const { r, g, b } = hslToRgba(0.5, 0, 0.5);

      // 회색 - R=G=B
      expect(r).toBeCloseTo(g, 0);
      expect(g).toBeCloseTo(b, 0);
      expect(r).toBeCloseTo(128, 0);
    });

    it('should be inverse of rgbaToHsl', () => {
      // 임의의 색상으로 왕복 변환 테스트
      const originalR = 180;
      const originalG = 100;
      const originalB = 50;

      const hsl = rgbaToHsl(originalR, originalG, originalB);
      const rgba = hslToRgba(hsl.h, hsl.s, hsl.l);

      expect(rgba.r).toBeCloseTo(originalR, 0);
      expect(rgba.g).toBeCloseTo(originalG, 0);
      expect(rgba.b).toBeCloseTo(originalB, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // getHeatmapColor
  // ---------------------------------------------------------------------------

  describe('getHeatmapColor', () => {
    describe('brown color scheme (melanin)', () => {
      it('should return light color for value 0', () => {
        const color = getHeatmapColor(0, 'brown');

        // 밝은 베이지 [255, 248, 220]
        expect(color.r).toBeGreaterThan(240);
        expect(color.g).toBeGreaterThan(240);
        expect(color.b).toBeGreaterThan(200);
      });

      it('should return dark color for value 1', () => {
        const color = getHeatmapColor(1, 'brown');

        // 진한 갈색 [101, 67, 33]
        expect(color.r).toBeLessThan(120);
        expect(color.g).toBeLessThan(80);
        expect(color.b).toBeLessThan(50);
      });

      it('should return mid color for value 0.5', () => {
        const color = getHeatmapColor(0.5, 'brown');

        // 중간 갈색
        expect(color.r).toBeGreaterThan(130);
        expect(color.r).toBeLessThan(220);
      });

      it('should have increasing alpha with value', () => {
        const color0 = getHeatmapColor(0, 'brown');
        const color1 = getHeatmapColor(1, 'brown');

        expect(color1.a).toBeGreaterThan(color0.a);
        expect(color0.a).toBeGreaterThanOrEqual(180);
        expect(color1.a).toBeLessThanOrEqual(255);
      });
    });

    describe('red color scheme (hemoglobin)', () => {
      it('should return light pink for value 0', () => {
        const color = getHeatmapColor(0, 'red');

        // 밝은 분홍 [255, 240, 240]
        expect(color.r).toBe(255);
        expect(color.g).toBeGreaterThan(230);
        expect(color.b).toBeGreaterThan(230);
      });

      it('should return dark red for value 1', () => {
        const color = getHeatmapColor(1, 'red');

        // 진한 빨강 [178, 34, 34]
        expect(color.r).toBeGreaterThan(150);
        expect(color.g).toBeLessThan(50);
        expect(color.b).toBeLessThan(50);
      });
    });

    describe('yellow color scheme (sebum)', () => {
      it('should return light ivory for value 0', () => {
        const color = getHeatmapColor(0, 'yellow');

        // 밝은 아이보리 [255, 255, 240]
        expect(color.r).toBe(255);
        expect(color.g).toBe(255);
        expect(color.b).toBeGreaterThan(230);
      });

      it('should return dark gold for value 1', () => {
        const color = getHeatmapColor(1, 'yellow');

        // 진한 골드 [184, 134, 11]
        expect(color.r).toBeGreaterThan(150);
        expect(color.g).toBeGreaterThan(100);
        expect(color.b).toBeLessThan(30);
      });
    });

    describe('edge cases', () => {
      it('should clamp values below 0', () => {
        const color = getHeatmapColor(-0.5, 'brown');

        // 0과 동일한 결과
        const color0 = getHeatmapColor(0, 'brown');
        expect(color.r).toBe(color0.r);
        expect(color.g).toBe(color0.g);
        expect(color.b).toBe(color0.b);
      });

      it('should clamp values above 1', () => {
        const color = getHeatmapColor(1.5, 'brown');

        // 1과 동일한 결과
        const color1 = getHeatmapColor(1, 'brown');
        expect(color.r).toBe(color1.r);
        expect(color.g).toBe(color1.g);
        expect(color.b).toBe(color1.b);
      });

      it('should use brown as default for unknown scheme', () => {
        // @ts-expect-error - 테스트를 위한 잘못된 스키마
        const color = getHeatmapColor(0.5, 'unknown');
        const brownColor = getHeatmapColor(0.5, 'brown');

        expect(color.r).toBe(brownColor.r);
        expect(color.g).toBe(brownColor.g);
        expect(color.b).toBe(brownColor.b);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // supportsOffscreenCanvas
  // ---------------------------------------------------------------------------

  describe('supportsOffscreenCanvas', () => {
    it('should return boolean', () => {
      const result = supportsOffscreenCanvas();

      expect(typeof result).toBe('boolean');
    });

    it('should return false in Node.js test environment', () => {
      // Node.js 환경에서는 OffscreenCanvas가 없음
      const result = supportsOffscreenCanvas();

      // Vitest/Node 환경에서는 false
      expect(result).toBe(false);
    });
  });
});
