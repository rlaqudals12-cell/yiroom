/**
 * 드레이프 색상 합성 테스트
 *
 * @module tests/lib/analysis/drape-reflectance
 * @description applyDrapeColor 테스트
 *
 * 순위/균일도 측정(measureUniformity·getBestColors·analyzeFullPalette·drapeResultsToDbFormat·
 * analyzeSingleDrape)은 "측정 신호 없는 지어낸 순위"라 모듈에서 제거됨 → 관련 테스트도 제거.
 * 금속 반사광(METAL_REFLECTANCE·applyReflectance·applyMetalReflectance)도 유일 소비자였던
 * DrapeSimulator(MediaPipe 실패 경로)가 삭제되며 함께 제거됨(2026-07).
 * 남은 것은 체험 렌더에 필요한 드레이프 블렌딩·얼굴 보존 로직뿐이다.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { applyDrapeColor } from '@/lib/analysis/drape-reflectance';

// =============================================================================
// 테스트
// =============================================================================

describe('lib/analysis/drape-reflectance', () => {
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

    // 정본 호출 경로(DrapingSection)는 항상 zero-mask를 넘긴다 — 얼굴 보존은 마스크가 아니라
    // "드레이프가 하단 밴드를 벗어나지 않는다"는 기하 계약이 담당한다. 따라서 회귀 가드도
    // 실제 입력(zero-mask)으로 밴드 경계를 검증한다.
    const W = 10;
    const H = 100; // 1픽셀 = 프레임 1%

    it('zero-mask에서도 드레이프는 하단 13% 밴드(87%~)를 벗어나지 않는다', () => {
      const { ctx, read } = makeFakeCtx(W, H);
      const faceMask = new Uint8Array(W * H).fill(0);

      applyDrapeColor(ctx, '#FF0000', faceMask, H);

      // 시작선 바로 위(86%)까지는 원본 그대로 — 턱끝(≈88%)이 물들지 않는다
      expect(read(5, 86)).toEqual([255, 255, 255, 255]);
      // 시작선(87%)부터는 드레이프가 칠해진다 → 빨강 > 파랑
      const bandTop = read(5, 87);
      expect(bandTop[0]).toBeGreaterThan(bandTop[2]);
      // 밴드 하단(99%)도 칠해진다
      const bandBottom = read(5, 99);
      expect(bandBottom[0]).toBeGreaterThan(bandBottom[2]);
    });

    it('상단 72% 이하 구간은 전 픽셀 원본 무변조다 (구 시작선 72% 회귀 가드)', () => {
      const { ctx, read } = makeFakeCtx(W, H);
      const faceMask = new Uint8Array(W * H).fill(0);

      applyDrapeColor(ctx, '#FF0000', faceMask, H);

      // 구 시작선(72%)·그 위 얼굴 영역이 모두 흰색이어야 한다 (드레이프 상향 이동 방지)
      for (let y = 0; y <= 72; y++) {
        for (let x = 0; x < W; x++) {
          expect(read(x, y)).toEqual([255, 255, 255, 255]);
        }
      }
    });
  });
});
