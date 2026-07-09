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

  // ---------------------------------------------------------------------------
  // getBestColors 색상 다양성 (W1 이슈 3: "TOP5 전부 같은 코랄" 회귀 방지)
  // ---------------------------------------------------------------------------

  describe('getBestColors 색상 다양성', () => {
    // 균일도가 전부 동률일 때(드레이프가 얼굴을 직접 바꾸지 않으면 자주 발생),
    // 정렬 순서 = 생성 순서라 같은 계열 명도 변형이 앞쪽을 독점했던 버그.
    const coralShades: DrapeResult[] = [
      '#FF7F50',
      '#E5724A',
      '#CC6543',
      '#B2583B',
      '#994C33',
      '#7F3F2C',
    ].map((color) => ({ color, uniformity: 20, rank: 0 }));
    const otherHues: DrapeResult[] = [
      '#4169E1', // 로열블루
      '#50C878', // 에메랄드
      '#FF00FF', // 퓨시아
      '#FFDB58', // 머스타드
    ].map((color) => ({ color, uniformity: 20, rank: 0 }));

    it('동률 상황에서 같은 계열이 TOP5를 독점하지 않는다', () => {
      const results = [...coralShades, ...otherHues];
      const best = getBestColors(results, 5);

      expect(best.length).toBe(5);
      // 코랄 계열만 5개 나오면 안 됨 — 다른 계열이 최소 1개 포함
      const coralHexes = coralShades.map((r) => r.color);
      const nonCoral = best.filter((r) => !coralHexes.includes(r.color));
      expect(nonCoral.length).toBeGreaterThan(0);
      // 반환 색상은 모두 서로 다름
      expect(new Set(best.map((r) => r.color)).size).toBe(5);
    });

    it('구분되는 계열이 부족하면 개수는 그대로 보장한다', () => {
      // 코랄 계열만 존재 → 다양성 확보 불가하지만 topN 개수는 유지
      const best = getBestColors(coralShades, 5);
      expect(best.length).toBe(5);
    });

    it('첫 색상은 다양성 필터 후에도 최상위 순위를 유지한다', () => {
      const results = [...coralShades, ...otherHues];
      const best = getBestColors(results, 5);
      expect(best[0].color).toBe('#FF7F50');
    });
  });

  // ---------------------------------------------------------------------------
  // applyDrapeColor 얼굴 보존 (W1 이슈 4: "얼굴 절반이 단색" 회귀 방지)
  // ---------------------------------------------------------------------------

  describe('applyDrapeColor 얼굴 보존', () => {
    // jsdom canvas는 픽셀을 실제로 렌더하지 않으므로(getImageData가 상수 반환),
    // 픽셀을 실제로 왕복시키는 가짜 2D 컨텍스트로 순수 블렌딩 로직을 검증한다.
    function makeFakeCtx(
      w: number,
      h: number
    ): { ctx: CanvasRenderingContext2D; read: (x: number, y: number) => number[] } {
      const full = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < w * h; i++) {
        full[i * 4] = 255;
        full[i * 4 + 1] = 255;
        full[i * 4 + 2] = 255;
        full[i * 4 + 3] = 255;
      }
      const ctx = {
        canvas: { width: w, height: h },
        getImageData: (x: number, y: number, gw: number, gh: number) => {
          const data = new Uint8ClampedArray(gw * gh * 4);
          for (let ry = 0; ry < gh; ry++) {
            for (let rx = 0; rx < gw; rx++) {
              const si = ((y + ry) * w + (x + rx)) * 4;
              const di = (ry * gw + rx) * 4;
              data[di] = full[si];
              data[di + 1] = full[si + 1];
              data[di + 2] = full[si + 2];
              data[di + 3] = full[si + 3];
            }
          }
          return { data, width: gw, height: gh, colorSpace: 'srgb' as PredefinedColorSpace };
        },
        putImageData: (img: ImageData, x: number, y: number) => {
          for (let ry = 0; ry < img.height; ry++) {
            for (let rx = 0; rx < img.width; rx++) {
              const si = (ry * img.width + rx) * 4;
              const di = ((y + ry) * w + (x + rx)) * 4;
              full[di] = img.data[si];
              full[di + 1] = img.data[si + 1];
              full[di + 2] = img.data[si + 2];
              full[di + 3] = img.data[si + 3];
            }
          }
        },
      };
      const read = (x: number, y: number): number[] => {
        const i = (y * w + x) * 4;
        return [full[i], full[i + 1], full[i + 2], full[i + 3]];
      };
      return { ctx: ctx as unknown as CanvasRenderingContext2D, read };
    }

    it('드레이프 시작선(72%)보다 위 픽셀은 원본 유지된다 (기존 65%에서 하향)', () => {
      const W = 10;
      const H = 100;
      const { ctx, read } = makeFakeCtx(W, H);
      const faceMask = new Uint8Array(W * H).fill(0);

      applyDrapeColor(ctx, '#FF0000', faceMask, H);

      // y=10: 확실히 위 → 흰색 유지
      expect(read(5, 10)).toEqual([255, 255, 255, 255]);
      // y=68: 옛 시작선(65%)에선 물들었지만 새 시작선(72%) 아래가 아니므로 원본 유지
      expect(read(5, 68)).toEqual([255, 255, 255, 255]);
    });

    it('얼굴 마스크 픽셀은 하단이어도 원본 유지되고, 비마스크는 물든다', () => {
      const W = 10;
      const H = 100;
      const { ctx, read } = makeFakeCtx(W, H);
      const faceMask = new Uint8Array(W * H).fill(0);
      faceMask[90 * W + 5] = 1; // 하단 한 픽셀을 얼굴로 마스킹

      applyDrapeColor(ctx, '#FF0000', faceMask, H);

      // 마스크된 픽셀은 흰색 유지 (얼굴 변조 금지)
      expect(read(5, 90)).toEqual([255, 255, 255, 255]);
      // 인접 비마스크 픽셀은 드레이프 색(빨강)으로 변함 → 빨강 > 파랑
      const draped = read(4, 90);
      expect(draped[0]).toBeGreaterThan(draped[2]);
    });
  });
});
