/**
 * 드레이프 반사광 효과 테스트
 *
 * @module tests/lib/analysis/drape-reflectance
 * @description METAL_REFLECTANCE, applyReflectance, applyMetalReflectance, applyDrapeColor 테스트
 *
 * 순위/균일도 측정(measureUniformity·getBestColors·analyzeFullPalette·drapeResultsToDbFormat·
 * analyzeSingleDrape)은 "측정 신호 없는 지어낸 순위"라 모듈에서 제거됨 → 관련 테스트도 제거.
 * 남은 것은 체험 렌더에 필요한 반사광·드레이프 블렌딩·얼굴 보존 로직뿐이다.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  METAL_REFLECTANCE,
  applyReflectance,
  applyMetalReflectance,
  applyDrapeColor,
} from '@/lib/analysis/drape-reflectance';

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
