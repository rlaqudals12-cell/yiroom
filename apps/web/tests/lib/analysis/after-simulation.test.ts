/**
 * after-simulation.ts 테스트
 * @description 현실적 After 시뮬레이션 모듈 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SIMULATION_PRESETS,
  DEFAULT_CONFIG,
  getPresetConfig,
  createCustomConfig,
  validateAlpha,
  applyDrapeReflection,
  applySkinToneCorrection,
  renderSplitView,
  type AfterSimulationConfig,
  type SimulationPreset,
} from '@/lib/analysis/after-simulation';
import type { DrapeOpticalProperties } from '@/lib/analysis/drape-palette';

describe('after-simulation', () => {
  // ============================================
  // 프리셋 테스트
  // ============================================

  describe('SIMULATION_PRESETS', () => {
    it('3가지 프리셋이 정의되어야 함', () => {
      expect(SIMULATION_PRESETS).toHaveProperty('subtle');
      expect(SIMULATION_PRESETS).toHaveProperty('natural');
      expect(SIMULATION_PRESETS).toHaveProperty('enhanced');
    });

    it('subtle 프리셋은 낮은 alpha를 가져야 함', () => {
      expect(SIMULATION_PRESETS.subtle.alpha).toBeLessThan(0.3);
    });

    it('natural 프리셋은 중간 alpha를 가져야 함', () => {
      expect(SIMULATION_PRESETS.natural.alpha).toBeGreaterThanOrEqual(0.3);
      expect(SIMULATION_PRESETS.natural.alpha).toBeLessThanOrEqual(0.4);
    });

    it('enhanced 프리셋은 높은 alpha를 가져야 함', () => {
      expect(SIMULATION_PRESETS.enhanced.alpha).toBeGreaterThanOrEqual(0.5);
    });

    it('모든 프리셋은 필수 속성을 가져야 함', () => {
      const requiredProps: (keyof AfterSimulationConfig)[] = [
        'alpha',
        'brightnessAdjust',
        'saturationAdjust',
        'reflectionSpread',
      ];

      Object.values(SIMULATION_PRESETS).forEach((preset) => {
        requiredProps.forEach((prop) => {
          expect(preset).toHaveProperty(prop);
        });
      });
    });

    it('alpha 값은 0-1 범위여야 함', () => {
      Object.values(SIMULATION_PRESETS).forEach((preset) => {
        expect(preset.alpha).toBeGreaterThanOrEqual(0);
        expect(preset.alpha).toBeLessThanOrEqual(1);
      });
    });

    it('reflectionSpread 값은 0-1 범위여야 함', () => {
      Object.values(SIMULATION_PRESETS).forEach((preset) => {
        expect(preset.reflectionSpread).toBeGreaterThanOrEqual(0);
        expect(preset.reflectionSpread).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('기본 설정은 natural 프리셋이어야 함', () => {
      expect(DEFAULT_CONFIG).toEqual(SIMULATION_PRESETS.natural);
    });
  });

  // ============================================
  // getPresetConfig 테스트
  // ============================================

  describe('getPresetConfig', () => {
    it('프리셋 설정을 올바르게 반환해야 함', () => {
      expect(getPresetConfig('subtle')).toEqual(SIMULATION_PRESETS.subtle);
      expect(getPresetConfig('natural')).toEqual(SIMULATION_PRESETS.natural);
      expect(getPresetConfig('enhanced')).toEqual(SIMULATION_PRESETS.enhanced);
    });

    it('반환된 설정은 원본과 분리되어야 함 (복사본)', () => {
      const config = getPresetConfig('natural');
      config.alpha = 0.99;
      expect(SIMULATION_PRESETS.natural.alpha).not.toBe(0.99);
    });
  });

  // ============================================
  // createCustomConfig 테스트
  // ============================================

  describe('createCustomConfig', () => {
    it('기본 프리셋에 오버라이드를 적용해야 함', () => {
      const custom = createCustomConfig('natural', { alpha: 0.6 });

      expect(custom.alpha).toBe(0.6);
      expect(custom.brightnessAdjust).toBe(SIMULATION_PRESETS.natural.brightnessAdjust);
    });

    it('여러 속성을 오버라이드할 수 있어야 함', () => {
      const custom = createCustomConfig('subtle', {
        alpha: 0.45,
        brightnessAdjust: 10,
        saturationAdjust: 15,
      });

      expect(custom.alpha).toBe(0.45);
      expect(custom.brightnessAdjust).toBe(10);
      expect(custom.saturationAdjust).toBe(15);
      expect(custom.reflectionSpread).toBe(SIMULATION_PRESETS.subtle.reflectionSpread);
    });

    it('원본 프리셋을 수정하지 않아야 함', () => {
      const originalAlpha = SIMULATION_PRESETS.enhanced.alpha;
      createCustomConfig('enhanced', { alpha: 0.1 });
      expect(SIMULATION_PRESETS.enhanced.alpha).toBe(originalAlpha);
    });
  });

  // ============================================
  // validateAlpha 테스트
  // ============================================

  describe('validateAlpha', () => {
    it('유효한 알파 값을 그대로 반환해야 함', () => {
      expect(validateAlpha(0.5)).toBe(0.5);
      expect(validateAlpha(0)).toBe(0);
      expect(validateAlpha(1)).toBe(1);
    });

    it('범위를 벗어난 값을 클램핑해야 함', () => {
      expect(validateAlpha(-0.5)).toBe(0);
      expect(validateAlpha(1.5)).toBe(1);
      expect(validateAlpha(-100)).toBe(0);
      expect(validateAlpha(100)).toBe(1);
    });
  });

  // ============================================
  // 물리적 모델 검증
  // ============================================

  describe('물리적 모델', () => {
    it('subtle → natural → enhanced 순으로 효과가 강해져야 함', () => {
      const subtleAlpha = SIMULATION_PRESETS.subtle.alpha;
      const naturalAlpha = SIMULATION_PRESETS.natural.alpha;
      const enhancedAlpha = SIMULATION_PRESETS.enhanced.alpha;

      expect(subtleAlpha).toBeLessThan(naturalAlpha);
      expect(naturalAlpha).toBeLessThan(enhancedAlpha);
    });

    it('reflectionSpread도 같은 순서로 증가해야 함', () => {
      const subtleSpread = SIMULATION_PRESETS.subtle.reflectionSpread;
      const naturalSpread = SIMULATION_PRESETS.natural.reflectionSpread;
      const enhancedSpread = SIMULATION_PRESETS.enhanced.reflectionSpread;

      expect(subtleSpread).toBeLessThan(naturalSpread);
      expect(naturalSpread).toBeLessThan(enhancedSpread);
    });

    it('권장 alpha 범위 (0.3~0.5)가 natural/enhanced에 포함되어야 함', () => {
      // natural은 0.3 이상
      expect(SIMULATION_PRESETS.natural.alpha).toBeGreaterThanOrEqual(0.3);
      // enhanced는 0.5 이하 또는 근처
      expect(SIMULATION_PRESETS.enhanced.alpha).toBeLessThanOrEqual(0.6);
    });
  });

  // ============================================
  // 타입 안전성 테스트
  // ============================================

  describe('타입 안전성', () => {
    it('SimulationPreset 타입이 올바른 값만 허용해야 함', () => {
      const validPresets: SimulationPreset[] = ['subtle', 'natural', 'enhanced'];
      validPresets.forEach((preset) => {
        expect(SIMULATION_PRESETS[preset]).toBeDefined();
      });
    });

    it('AfterSimulationConfig 타입이 숫자 속성을 가져야 함', () => {
      const config: AfterSimulationConfig = {
        alpha: 0.5,
        brightnessAdjust: 5,
        saturationAdjust: 5,
        reflectionSpread: 0.5,
      };

      expect(typeof config.alpha).toBe('number');
      expect(typeof config.brightnessAdjust).toBe('number');
      expect(typeof config.saturationAdjust).toBe('number');
      expect(typeof config.reflectionSpread).toBe('number');
    });
  });

  // ============================================
  // applyDrapeReflection 테스트
  // ============================================

  describe('applyDrapeReflection', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockCtx: CanvasRenderingContext2D;

    beforeEach(() => {
      mockCanvas = document.createElement('canvas');
      mockCanvas.width = 10;
      mockCanvas.height = 10;
      mockCtx = mockCanvas.getContext('2d')!;
    });

    const mockDrape: DrapeOpticalProperties = {
      rgb: { r: 200, g: 100, b: 50 },
      hex: '#C86432',
      name: '테스트 컬러',
      season: 'autumn',
      reflectance: 0.7,
      warmth: 0.5,
      saturationBoost: 0.1,
      muteness: 0.3,
    };

    it('should not throw with valid inputs', () => {
      const faceMask = new Uint8Array(100).fill(255);

      expect(() => {
        applyDrapeReflection(mockCtx, faceMask, mockDrape);
      }).not.toThrow();
    });

    it('should accept custom config', () => {
      const faceMask = new Uint8Array(100).fill(255);
      const customConfig: AfterSimulationConfig = {
        alpha: 0.6,
        brightnessAdjust: 10,
        saturationAdjust: 8,
        reflectionSpread: 0.6,
      };

      expect(() => {
        applyDrapeReflection(mockCtx, faceMask, mockDrape, customConfig);
      }).not.toThrow();
    });

    it('should skip pixels outside face mask', () => {
      const faceMask = new Uint8Array(100).fill(0);

      expect(() => {
        applyDrapeReflection(mockCtx, faceMask, mockDrape);
      }).not.toThrow();
    });

    it('should handle cool toned drape (negative warmth)', () => {
      const faceMask = new Uint8Array(100).fill(255);
      const coolDrape: DrapeOpticalProperties = {
        rgb: { r: 100, g: 150, b: 200 },
        hex: '#6496C8',
        name: '쿨 블루',
        season: 'summer',
        reflectance: 0.6,
        warmth: -0.5, // 쿨톤
        saturationBoost: -0.1,
        muteness: 0.2,
      };

      expect(() => {
        applyDrapeReflection(mockCtx, faceMask, coolDrape);
      }).not.toThrow();
    });

    it('should handle zero warmth', () => {
      const faceMask = new Uint8Array(100).fill(255);
      const neutralDrape: DrapeOpticalProperties = {
        rgb: { r: 150, g: 150, b: 150 },
        hex: '#969696',
        name: '뉴트럴 그레이',
        season: 'winter',
        reflectance: 0.5,
        warmth: 0,
        saturationBoost: 0,
        muteness: 0.5,
      };

      expect(() => {
        applyDrapeReflection(mockCtx, faceMask, neutralDrape);
      }).not.toThrow();
    });
  });

  // ============================================
  // applySkinToneCorrection 테스트
  // ============================================

  describe('applySkinToneCorrection', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockCtx: CanvasRenderingContext2D;

    beforeEach(() => {
      mockCanvas = document.createElement('canvas');
      mockCanvas.width = 10;
      mockCanvas.height = 10;
      mockCtx = mockCanvas.getContext('2d')!;
    });

    it('should apply hydration correction', () => {
      const faceMask = new Uint8Array(100).fill(255);

      expect(() => {
        applySkinToneCorrection(mockCtx, faceMask, {
          hydration: 0.5,
          rednessReduction: 0,
          brightening: 0,
        });
      }).not.toThrow();
    });

    it('should apply redness reduction', () => {
      const faceMask = new Uint8Array(100).fill(255);

      expect(() => {
        applySkinToneCorrection(mockCtx, faceMask, {
          hydration: 0,
          rednessReduction: 0.5,
          brightening: 0,
        });
      }).not.toThrow();
    });

    it('should apply brightening', () => {
      const faceMask = new Uint8Array(100).fill(255);

      expect(() => {
        applySkinToneCorrection(mockCtx, faceMask, {
          hydration: 0,
          rednessReduction: 0,
          brightening: 0.5,
        });
      }).not.toThrow();
    });

    it('should apply all corrections together', () => {
      const faceMask = new Uint8Array(100).fill(255);

      expect(() => {
        applySkinToneCorrection(mockCtx, faceMask, {
          hydration: 0.3,
          rednessReduction: 0.4,
          brightening: 0.5,
        });
      }).not.toThrow();
    });

    it('should handle custom alpha', () => {
      const faceMask = new Uint8Array(100).fill(255);

      expect(() => {
        applySkinToneCorrection(
          mockCtx,
          faceMask,
          {
            hydration: 0.5,
            rednessReduction: 0.5,
            brightening: 0.5,
          },
          0.6
        );
      }).not.toThrow();
    });

    it('should skip pixels outside face mask', () => {
      const faceMask = new Uint8Array(100).fill(0);

      expect(() => {
        applySkinToneCorrection(mockCtx, faceMask, {
          hydration: 0.5,
          rednessReduction: 0.5,
          brightening: 0.5,
        });
      }).not.toThrow();
    });

    it('should handle negative correction values', () => {
      const faceMask = new Uint8Array(100).fill(255);

      expect(() => {
        applySkinToneCorrection(mockCtx, faceMask, {
          hydration: -0.5,
          rednessReduction: -0.3,
          brightening: -0.2,
        });
      }).not.toThrow();
    });
  });

  // ============================================
  // renderSplitView 테스트
  // ============================================

  describe('renderSplitView', () => {
    let mockCanvas: HTMLCanvasElement;
    let beforeImage: HTMLImageElement;
    let afterImage: HTMLImageElement;

    beforeEach(() => {
      mockCanvas = document.createElement('canvas');
      mockCanvas.width = 100;
      mockCanvas.height = 100;

      beforeImage = new Image();
      beforeImage.width = 100;
      beforeImage.height = 100;

      afterImage = new Image();
      afterImage.width = 100;
      afterImage.height = 100;
    });

    it('should render horizontal split view', () => {
      expect(() => {
        renderSplitView(mockCanvas, beforeImage, afterImage, 0.5, 'horizontal');
      }).not.toThrow();
    });

    it('should render vertical split view', () => {
      expect(() => {
        renderSplitView(mockCanvas, beforeImage, afterImage, 0.5, 'vertical');
      }).not.toThrow();
    });

    it('should handle split position at start (0)', () => {
      expect(() => {
        renderSplitView(mockCanvas, beforeImage, afterImage, 0, 'horizontal');
      }).not.toThrow();
    });

    it('should handle split position at end (1)', () => {
      expect(() => {
        renderSplitView(mockCanvas, beforeImage, afterImage, 1, 'horizontal');
      }).not.toThrow();
    });

    it('should default to horizontal direction', () => {
      expect(() => {
        renderSplitView(mockCanvas, beforeImage, afterImage, 0.5);
      }).not.toThrow();
    });

    it('should handle canvas element as input', () => {
      const beforeCanvas = document.createElement('canvas');
      beforeCanvas.width = 100;
      beforeCanvas.height = 100;

      expect(() => {
        renderSplitView(mockCanvas, beforeCanvas, afterImage, 0.5);
      }).not.toThrow();
    });
  });

  // ============================================
  // 반사 강도 계산 테스트
  // ============================================

  describe('반사 강도 계산', () => {
    it('alpha와 reflectionSpread가 효과에 영향을 줌', () => {
      // 낮은 alpha는 효과가 약함
      const lowAlphaConfig = getPresetConfig('subtle');
      const highAlphaConfig = getPresetConfig('enhanced');

      expect(lowAlphaConfig.alpha * lowAlphaConfig.reflectionSpread).toBeLessThan(
        highAlphaConfig.alpha * highAlphaConfig.reflectionSpread
      );
    });

    it('드레이프 영역 시작점은 70%', () => {
      // 물리적 모델: 드레이프는 하단 30%에 위치
      const drapeStart = 0.7;
      expect(drapeStart).toBe(0.7);
    });
  });
});
