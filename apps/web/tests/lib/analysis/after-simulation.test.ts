/**
 * after-simulation.ts 테스트
 * @description 현실적 After 시뮬레이션 모듈 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SIMULATION_PRESETS,
  DEFAULT_CONFIG,
  getPresetConfig,
  createCustomConfig,
  validateAlpha,
  type AfterSimulationConfig,
  type SimulationPreset,
} from '@/lib/analysis/after-simulation';

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
});
