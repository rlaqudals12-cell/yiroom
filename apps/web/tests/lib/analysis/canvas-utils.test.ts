/**
 * Canvas 유틸리티 테스트
 *
 * @module tests/lib/analysis/canvas-utils
 * @description Canvas 색상 변환 및 유틸리티 함수 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  rgbaToHsl,
  hslToRgba,
  getHeatmapColor,
  supportsOffscreenCanvas,
  createOptimizedContext,
  createOffscreenCanvas,
  setupCanvasSize,
  drawImageCentered,
  extractRegion,
  canvasToDataURL,
  clearCanvas,
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

  // ---------------------------------------------------------------------------
  // createOptimizedContext
  // ---------------------------------------------------------------------------

  describe('createOptimizedContext', () => {
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
    });

    it('should create a 2D context', () => {
      const ctx = createOptimizedContext(canvas);

      expect(ctx).not.toBeNull();
    });

    it('should accept willReadFrequently option', () => {
      const ctx = createOptimizedContext(canvas, { willReadFrequently: true });

      expect(ctx).not.toBeNull();
    });

    it('should accept alpha option', () => {
      const ctx = createOptimizedContext(canvas, { alpha: false });

      expect(ctx).not.toBeNull();
    });

    it('should accept desynchronized option', () => {
      const ctx = createOptimizedContext(canvas, { desynchronized: true });

      expect(ctx).not.toBeNull();
    });

    it('should accept all options together', () => {
      const ctx = createOptimizedContext(canvas, {
        willReadFrequently: true,
        alpha: true,
        desynchronized: false,
      });

      expect(ctx).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // createOffscreenCanvas
  // ---------------------------------------------------------------------------

  describe('createOffscreenCanvas', () => {
    it('should create a canvas with specified dimensions', () => {
      const canvas = createOffscreenCanvas(200, 150);

      expect(canvas.width).toBe(200);
      expect(canvas.height).toBe(150);
    });

    it('should create HTMLCanvasElement as fallback in test environment', () => {
      // Node/JSDOM 환경에서는 OffscreenCanvas가 없으므로 HTMLCanvasElement 반환
      const canvas = createOffscreenCanvas(100, 100);

      // HTMLCanvasElement 인스턴스 확인
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(100);
    });
  });

  // ---------------------------------------------------------------------------
  // setupCanvasSize
  // ---------------------------------------------------------------------------

  describe('setupCanvasSize', () => {
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
      canvas = document.createElement('canvas');
    });

    it('should set canvas dimensions', () => {
      setupCanvasSize(canvas, 400, 300);

      // DPR이 적용된 크기 (최대 2배)
      expect(canvas.width).toBeGreaterThanOrEqual(400);
      expect(canvas.height).toBeGreaterThanOrEqual(300);
    });

    it('should set CSS dimensions', () => {
      setupCanvasSize(canvas, 400, 300);

      expect(canvas.style.width).toBe('400px');
      expect(canvas.style.height).toBe('300px');
    });

    it('should respect maxDpr parameter', () => {
      setupCanvasSize(canvas, 400, 300, 1);

      // maxDpr=1이면 실제 크기와 동일
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(300);
    });

    it('should handle zero dimensions gracefully', () => {
      expect(() => {
        setupCanvasSize(canvas, 0, 0);
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // drawImageCentered
  // ---------------------------------------------------------------------------

  describe('drawImageCentered', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      ctx = canvas.getContext('2d')!;
    });

    // 이미지 mock 생성 헬퍼
    function createMockImage(width: number, height: number): HTMLImageElement {
      const image = new Image();
      Object.defineProperty(image, 'width', { value: width, configurable: true });
      Object.defineProperty(image, 'height', { value: height, configurable: true });
      return image;
    }

    it('should return scale and offset for square image in square canvas', () => {
      const image = createMockImage(100, 100);
      const result = drawImageCentered(ctx, image, 200, 200);

      expect(result.scale).toBe(2); // 100 -> 200
      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBe(0);
    });

    it('should center wide image vertically', () => {
      const image = createMockImage(200, 100);
      const result = drawImageCentered(ctx, image, 200, 200);

      expect(result.scale).toBe(1);
      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBeGreaterThan(0); // 세로 중앙 정렬
    });

    it('should center tall image horizontally', () => {
      const image = createMockImage(100, 200);
      const result = drawImageCentered(ctx, image, 200, 200);

      expect(result.scale).toBe(1);
      expect(result.offsetX).toBeGreaterThan(0); // 가로 중앙 정렬
      expect(result.offsetY).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // extractRegion
  // ---------------------------------------------------------------------------

  describe('extractRegion', () => {
    it('should extract region from ImageData', () => {
      const width = 20;
      const height = 20;
      const data = new Uint8ClampedArray(width * height * 4).fill(128);
      const imageData = new ImageData(data, width, height);

      const region = extractRegion(imageData, 5, 5, 10, 10);

      expect(region.width).toBe(10);
      expect(region.height).toBe(10);
      expect(region.data.length).toBe(10 * 10 * 4);
    });

    it('should extract full image when region equals dimensions', () => {
      const width = 10;
      const height = 10;
      const data = new Uint8ClampedArray(width * height * 4).fill(200);
      const imageData = new ImageData(data, width, height);

      const region = extractRegion(imageData, 0, 0, width, height);

      expect(region.width).toBe(width);
      expect(region.height).toBe(height);
    });

    it('should extract corner region', () => {
      const width = 20;
      const height = 20;
      const data = new Uint8ClampedArray(width * height * 4).fill(100);
      const imageData = new ImageData(data, width, height);

      const region = extractRegion(imageData, 0, 0, 5, 5);

      expect(region.width).toBe(5);
      expect(region.height).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // canvasToDataURL
  // ---------------------------------------------------------------------------

  describe('canvasToDataURL', () => {
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 50;
      canvas.height = 50;
    });

    it('should return data URL string', () => {
      const dataURL = canvasToDataURL(canvas);

      expect(typeof dataURL).toBe('string');
      expect(dataURL.startsWith('data:')).toBe(true);
    });

    it('should support PNG format', () => {
      const dataURL = canvasToDataURL(canvas, 'image/png');

      expect(dataURL).toContain('data:');
    });

    it('should support JPEG format', () => {
      const dataURL = canvasToDataURL(canvas, 'image/jpeg');

      expect(dataURL).toContain('data:');
    });

    it('should accept quality parameter', () => {
      const dataURL = canvasToDataURL(canvas, 'image/jpeg', 0.5);

      expect(typeof dataURL).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------
  // clearCanvas
  // ---------------------------------------------------------------------------

  describe('clearCanvas', () => {
    it('should clear canvas without error', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;

      expect(() => {
        clearCanvas(canvas);
      }).not.toThrow();
    });

    it('should work with empty canvas', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 0;
      canvas.height = 0;

      expect(() => {
        clearCanvas(canvas);
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 색상 변환 정밀도 테스트
  // ---------------------------------------------------------------------------

  describe('색상 변환 정밀도', () => {
    it('should handle edge case colors correctly', () => {
      // 어두운 색상
      const dark = rgbaToHsl(10, 10, 10);
      expect(dark.l).toBeLessThan(0.1);

      // 밝은 색상
      const bright = rgbaToHsl(245, 245, 245);
      expect(bright.l).toBeGreaterThan(0.9);
    });

    it('should preserve color in round-trip conversion', () => {
      const testColors = [
        [255, 128, 64],
        [64, 128, 255],
        [128, 255, 64],
        [200, 50, 150],
        [100, 100, 100],
      ];

      testColors.forEach(([r, g, b]) => {
        const hsl = rgbaToHsl(r, g, b);
        const rgb = hslToRgba(hsl.h, hsl.s, hsl.l);

        expect(rgb.r).toBeCloseTo(r, 0);
        expect(rgb.g).toBeCloseTo(g, 0);
        expect(rgb.b).toBeCloseTo(b, 0);
      });
    });
  });
});
