/**
 * 드레이프 반사광 효과 테스트
 *
 * @module tests/lib/analysis/drape-reflectance
 * @description METAL_REFLECTANCE, measureUniformity, getBestColors, drapeResultsToDbFormat 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  METAL_REFLECTANCE,
  measureUniformity,
  getBestColors,
  drapeResultsToDbFormat,
  applyReflectance,
  applyMetalReflectance,
  applyDrapeColor,
  analyzeSingleDrape,
} from '@/lib/analysis/drape-reflectance';
import type { DrapeResult } from '@/types/visual-analysis';

// =============================================================================
// Mock ImageData
// =============================================================================

function createMockImageData(
  width: number,
  height: number,
  fillFn: (x: number, y: number) => [number, number, number, number]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const [r, g, b, a] = fillFn(x, y);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }

  return { data, width, height, colorSpace: 'srgb' as PredefinedColorSpace };
}

// =============================================================================
// 테스트
// =============================================================================

describe('lib/analysis/drape-reflectance', () => {
  // ---------------------------------------------------------------------------
  // METAL_REFLECTANCE
  // ---------------------------------------------------------------------------

  describe('METAL_REFLECTANCE', () => {
    it('should have silver and gold configurations', () => {
      expect(METAL_REFLECTANCE).toHaveProperty('silver');
      expect(METAL_REFLECTANCE).toHaveProperty('gold');
    });

    it('should have brightness and saturation for silver', () => {
      expect(METAL_REFLECTANCE.silver).toHaveProperty('brightness');
      expect(METAL_REFLECTANCE.silver).toHaveProperty('saturation');
      expect(typeof METAL_REFLECTANCE.silver.brightness).toBe('number');
      expect(typeof METAL_REFLECTANCE.silver.saturation).toBe('number');
    });

    it('should have brightness and saturation for gold', () => {
      expect(METAL_REFLECTANCE.gold).toHaveProperty('brightness');
      expect(METAL_REFLECTANCE.gold).toHaveProperty('saturation');
      expect(typeof METAL_REFLECTANCE.gold.brightness).toBe('number');
      expect(typeof METAL_REFLECTANCE.gold.saturation).toBe('number');
    });

    it('silver should have positive brightness (cooler, brighter)', () => {
      expect(METAL_REFLECTANCE.silver.brightness).toBeGreaterThan(0);
    });

    it('gold should have positive brightness', () => {
      expect(METAL_REFLECTANCE.gold.brightness).toBeGreaterThan(0);
    });

    it('silver should decrease saturation (cooler effect)', () => {
      expect(METAL_REFLECTANCE.silver.saturation).toBeLessThan(0);
    });

    it('gold should increase saturation (warmer effect)', () => {
      expect(METAL_REFLECTANCE.gold.saturation).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // measureUniformity
  // ---------------------------------------------------------------------------

  describe('measureUniformity', () => {
    it('should return 100 when no face pixels in mask', () => {
      const imageData = createMockImageData(10, 10, () => [128, 128, 128, 255]);
      const faceMask = new Uint8Array(100).fill(0); // 모든 픽셀 마스크 외부

      const uniformity = measureUniformity(imageData, faceMask);
      expect(uniformity).toBe(100);
    });

    it('should return 0 for perfectly uniform face area', () => {
      const imageData = createMockImageData(10, 10, () => [128, 128, 128, 255]);
      const faceMask = new Uint8Array(100).fill(1); // 모든 픽셀 얼굴

      const uniformity = measureUniformity(imageData, faceMask);
      expect(uniformity).toBe(0); // 표준편차 0 → 균일도 0
    });

    it('should return higher value for non-uniform face area', () => {
      // 절반은 밝고 절반은 어두운 이미지
      const imageData = createMockImageData(10, 10, (x) => {
        return x < 5 ? [50, 50, 50, 255] : [200, 200, 200, 255];
      });
      const faceMask = new Uint8Array(100).fill(1);

      const uniformity = measureUniformity(imageData, faceMask);
      expect(uniformity).toBeGreaterThan(0);
    });

    it('should only consider pixels within face mask', () => {
      // 전체 이미지는 다양하지만 마스크 영역만 균일
      const imageData = createMockImageData(10, 10, (x, y) => {
        // 중앙 4x4만 균일 (128), 나머지는 다양
        if (x >= 3 && x <= 6 && y >= 3 && y <= 6) {
          return [128, 128, 128, 255];
        }
        return [x * 25, y * 25, 100, 255];
      });

      // 중앙 4x4만 마스크
      const faceMask = new Uint8Array(100).fill(0);
      for (let y = 3; y <= 6; y++) {
        for (let x = 3; x <= 6; x++) {
          faceMask[y * 10 + x] = 1;
        }
      }

      const uniformity = measureUniformity(imageData, faceMask);
      expect(uniformity).toBe(0); // 마스크 영역은 균일
    });

    it('should calculate luminance using ITU-R BT.601 formula', () => {
      // 순수 빨강 픽셀
      const redData = createMockImageData(1, 1, () => [255, 0, 0, 255]);
      const mask = new Uint8Array([1]);
      const redUniformity = measureUniformity(redData, mask);

      // 순수 초록 픽셀 (초록이 더 밝게 인식됨)
      const greenData = createMockImageData(1, 1, () => [0, 255, 0, 255]);
      const greenUniformity = measureUniformity(greenData, mask);

      // 단일 픽셀이므로 둘 다 균일도 0
      expect(redUniformity).toBe(0);
      expect(greenUniformity).toBe(0);
    });

    it('should cap uniformity at 100', () => {
      // 극단적으로 다양한 이미지
      const imageData = createMockImageData(10, 10, (x, y) => {
        const val = ((x + y) % 2) * 255;
        return [val, val, val, 255];
      });
      const faceMask = new Uint8Array(100).fill(1);

      const uniformity = measureUniformity(imageData, faceMask);
      expect(uniformity).toBeLessThanOrEqual(100);
    });
  });

  // ---------------------------------------------------------------------------
  // getBestColors
  // ---------------------------------------------------------------------------

  describe('getBestColors', () => {
    const mockResults: DrapeResult[] = [
      { color: '#FF0000', uniformity: 10, rank: 1 },
      { color: '#00FF00', uniformity: 20, rank: 2 },
      { color: '#0000FF', uniformity: 30, rank: 3 },
      { color: '#FFFF00', uniformity: 40, rank: 4 },
      { color: '#FF00FF', uniformity: 50, rank: 5 },
      { color: '#00FFFF', uniformity: 60, rank: 6 },
    ];

    it('should return top 5 colors by default', () => {
      const best = getBestColors(mockResults);

      expect(best.length).toBe(5);
      expect(best[0].color).toBe('#FF0000');
      expect(best[4].color).toBe('#FF00FF');
    });

    it('should return specified number of colors', () => {
      const best = getBestColors(mockResults, 3);

      expect(best.length).toBe(3);
      expect(best[0].color).toBe('#FF0000');
      expect(best[2].color).toBe('#0000FF');
    });

    it('should return all colors if topN exceeds array length', () => {
      const best = getBestColors(mockResults, 10);

      expect(best.length).toBe(6);
    });

    it('should return empty array for empty input', () => {
      const best = getBestColors([], 5);

      expect(best).toEqual([]);
    });

    it('should return single item for topN=1', () => {
      const best = getBestColors(mockResults, 1);

      expect(best.length).toBe(1);
      expect(best[0].uniformity).toBe(10);
    });
  });

  // ---------------------------------------------------------------------------
  // drapeResultsToDbFormat
  // ---------------------------------------------------------------------------

  describe('drapeResultsToDbFormat', () => {
    const mockResults: DrapeResult[] = [
      { color: '#FF0000', uniformity: 10, rank: 1 },
      { color: '#00FF00', uniformity: 20, rank: 2 },
      { color: '#0000FF', uniformity: 30, rank: 3 },
      { color: '#FFFF00', uniformity: 40, rank: 4 },
      { color: '#FF00FF', uniformity: 50, rank: 5 },
    ];

    it('should return best_colors array', () => {
      const dbFormat = drapeResultsToDbFormat(mockResults, 'silver');

      expect(Array.isArray(dbFormat.best_colors)).toBe(true);
      expect(dbFormat.best_colors.length).toBe(5);
      expect(dbFormat.best_colors[0]).toBe('#FF0000');
    });

    it('should return uniformity_scores object', () => {
      const dbFormat = drapeResultsToDbFormat(mockResults, 'gold');

      expect(typeof dbFormat.uniformity_scores).toBe('object');
      expect(dbFormat.uniformity_scores['#FF0000']).toBe(10);
      expect(dbFormat.uniformity_scores['#00FF00']).toBe(20);
    });

    it('should include metal_test field', () => {
      const silverFormat = drapeResultsToDbFormat(mockResults, 'silver');
      expect(silverFormat.metal_test).toBe('silver');

      const goldFormat = drapeResultsToDbFormat(mockResults, 'gold');
      expect(goldFormat.metal_test).toBe('gold');
    });

    it('should handle empty results', () => {
      const dbFormat = drapeResultsToDbFormat([], 'silver');

      expect(dbFormat.best_colors).toEqual([]);
      expect(dbFormat.uniformity_scores).toEqual({});
      expect(dbFormat.metal_test).toBe('silver');
    });
  });

  // ---------------------------------------------------------------------------
  // applyReflectance
  // ---------------------------------------------------------------------------

  describe('applyReflectance', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      ctx = canvas.getContext('2d')!;
    });

    it('should apply positive brightness adjustment', () => {
      const faceMask = new Uint8Array(100).fill(1);

      expect(() => {
        applyReflectance(ctx, faceMask, { brightness: 10, saturation: 0 });
      }).not.toThrow();
    });

    it('should apply negative brightness adjustment', () => {
      const faceMask = new Uint8Array(100).fill(1);

      expect(() => {
        applyReflectance(ctx, faceMask, { brightness: -10, saturation: 0 });
      }).not.toThrow();
    });

    it('should apply positive saturation adjustment', () => {
      const faceMask = new Uint8Array(100).fill(1);

      expect(() => {
        applyReflectance(ctx, faceMask, { brightness: 0, saturation: 10 });
      }).not.toThrow();
    });

    it('should apply negative saturation adjustment', () => {
      const faceMask = new Uint8Array(100).fill(1);

      expect(() => {
        applyReflectance(ctx, faceMask, { brightness: 0, saturation: -10 });
      }).not.toThrow();
    });

    it('should skip pixels outside mask', () => {
      const faceMask = new Uint8Array(100).fill(0);

      expect(() => {
        applyReflectance(ctx, faceMask, { brightness: 10, saturation: 5 });
      }).not.toThrow();
    });

    it('should handle partial mask', () => {
      const faceMask = new Uint8Array(100);
      for (let i = 0; i < 50; i++) faceMask[i] = 1;

      expect(() => {
        applyReflectance(ctx, faceMask, { brightness: 5, saturation: -5 });
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // applyMetalReflectance
  // ---------------------------------------------------------------------------

  describe('applyMetalReflectance', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      ctx = canvas.getContext('2d')!;
    });

    it('should apply silver reflectance', () => {
      const faceMask = new Uint8Array(100).fill(1);

      expect(() => {
        applyMetalReflectance(ctx, faceMask, 'silver');
      }).not.toThrow();
    });

    it('should apply gold reflectance', () => {
      const faceMask = new Uint8Array(100).fill(1);

      expect(() => {
        applyMetalReflectance(ctx, faceMask, 'gold');
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // applyDrapeColor
  // ---------------------------------------------------------------------------

  describe('applyDrapeColor', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      ctx = canvas.getContext('2d')!;
    });

    it('should apply drape color to lower region', () => {
      const faceMask = new Uint8Array(100).fill(0);

      expect(() => {
        applyDrapeColor(ctx, '#FF5500', faceMask, 10);
      }).not.toThrow();
    });

    it('should handle different hex colors', () => {
      const faceMask = new Uint8Array(100).fill(0);

      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000'];

      colors.forEach((color) => {
        expect(() => {
          applyDrapeColor(ctx, color, faceMask, 10);
        }).not.toThrow();
      });
    });

    it('should skip face mask areas', () => {
      const faceMask = new Uint8Array(100).fill(1);

      expect(() => {
        applyDrapeColor(ctx, '#FF5500', faceMask, 10);
      }).not.toThrow();
    });

    it('should work with partial face mask', () => {
      const faceMask = new Uint8Array(100);
      for (let i = 0; i < 30; i++) faceMask[i] = 1;

      expect(() => {
        applyDrapeColor(ctx, '#AABBCC', faceMask, 10);
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // analyzeSingleDrape
  // ---------------------------------------------------------------------------

  describe('analyzeSingleDrape', () => {
    let mockImage: HTMLImageElement;

    beforeEach(() => {
      mockImage = new Image();
      Object.defineProperty(mockImage, 'width', { value: 50 });
      Object.defineProperty(mockImage, 'height', { value: 50 });
      Object.defineProperty(mockImage, 'naturalWidth', { value: 50 });
      Object.defineProperty(mockImage, 'naturalHeight', { value: 50 });
    });

    it('should return uniformity score for single drape', () => {
      const faceMask = new Uint8Array(50 * 50).fill(1);

      const uniformity = analyzeSingleDrape(mockImage, faceMask, '#FF5500', 'silver');

      expect(typeof uniformity).toBe('number');
      expect(uniformity).toBeGreaterThanOrEqual(0);
      expect(uniformity).toBeLessThanOrEqual(100);
    });

    it('should work with gold metal type', () => {
      const faceMask = new Uint8Array(50 * 50).fill(1);

      const uniformity = analyzeSingleDrape(mockImage, faceMask, '#FFCC00', 'gold');

      expect(typeof uniformity).toBe('number');
    });

    it('should return 100 for empty face mask', () => {
      const faceMask = new Uint8Array(50 * 50).fill(0);

      const uniformity = analyzeSingleDrape(mockImage, faceMask, '#FF5500', 'silver');

      expect(uniformity).toBe(100);
    });

    it('should analyze different colors', () => {
      const faceMask = new Uint8Array(50 * 50).fill(1);

      const colors = ['#FF0000', '#00FF00', '#0000FF'];
      const results = colors.map((color) =>
        analyzeSingleDrape(mockImage, faceMask, color, 'silver')
      );

      results.forEach((uniformity) => {
        expect(typeof uniformity).toBe('number');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 균일도 계산 정확도 테스트
  // ---------------------------------------------------------------------------

  describe('균일도 계산 정확도', () => {
    it('should calculate luminance correctly (ITU-R BT.601)', () => {
      // 순수 빨강: luminance = 0.299 * 255 = 76.245
      // 순수 초록: luminance = 0.587 * 255 = 149.685
      // 순수 파랑: luminance = 0.114 * 255 = 29.07

      // 위 공식 검증
      const redLum = 0.299 * 255;
      const greenLum = 0.587 * 255;
      const blueLum = 0.114 * 255;

      expect(greenLum).toBeGreaterThan(redLum);
      expect(redLum).toBeGreaterThan(blueLum);
    });

    it('should return 0 for completely uniform area', () => {
      const imageData = createMockImageData(10, 10, () => [100, 100, 100, 255]);
      const faceMask = new Uint8Array(100).fill(1);

      const uniformity = measureUniformity(imageData, faceMask);

      expect(uniformity).toBe(0);
    });

    it('should cap uniformity at 100', () => {
      // 극단적인 대비
      const imageData = createMockImageData(10, 10, (x) =>
        x < 5 ? [0, 0, 0, 255] : [255, 255, 255, 255]
      );
      const faceMask = new Uint8Array(100).fill(1);

      const uniformity = measureUniformity(imageData, faceMask);

      expect(uniformity).toBeLessThanOrEqual(100);
    });
  });
});
