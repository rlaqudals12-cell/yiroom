/**
 * Visual Analysis Engine 통합 Export 테스트
 *
 * @module tests/lib/analysis/index
 * @description S-1+ 광원 시뮬레이션, PC-1+ 드레이핑 관련 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import * as AnalysisModule from '@/lib/analysis';

describe('lib/analysis 배럴 익스포트', () => {
  // ==========================================================================
  // Canvas 유틸리티
  // ==========================================================================
  describe('Canvas 유틸리티', () => {
    it('createOptimizedContext가 export된다', () => {
      expect(AnalysisModule.createOptimizedContext).toBeDefined();
      expect(typeof AnalysisModule.createOptimizedContext).toBe('function');
    });

    it('supportsOffscreenCanvas가 export된다', () => {
      expect(AnalysisModule.supportsOffscreenCanvas).toBeDefined();
      expect(typeof AnalysisModule.supportsOffscreenCanvas).toBe('function');
    });

    it('createOffscreenCanvas가 export된다', () => {
      expect(AnalysisModule.createOffscreenCanvas).toBeDefined();
      expect(typeof AnalysisModule.createOffscreenCanvas).toBe('function');
    });
  });

  // ==========================================================================
  // 피부 분석 (ITA 기반)
  // ==========================================================================
  describe('피부 분석 (ITA 기반)', () => {
    it('calculateITA가 export된다', () => {
      expect(AnalysisModule.calculateITA).toBeDefined();
      expect(typeof AnalysisModule.calculateITA).toBe('function');
    });
  });

  // ==========================================================================
  // PC-2: 12-Tone 퍼스널컬러 분류
  // ==========================================================================
  describe('PC-2: 12-Tone 퍼스널컬러 분류', () => {
    it('classify12Tone이 export된다', () => {
      expect(AnalysisModule.classify12Tone).toBeDefined();
      expect(typeof AnalysisModule.classify12Tone).toBe('function');
    });

    it('determineSeason이 export된다', () => {
      expect(AnalysisModule.determineSeason).toBeDefined();
      expect(typeof AnalysisModule.determineSeason).toBe('function');
    });

    it('determineUndertone이 export된다', () => {
      expect(AnalysisModule.determineUndertone).toBeDefined();
      expect(typeof AnalysisModule.determineUndertone).toBe('function');
    });

    it('rgbToLab이 export된다', () => {
      expect(AnalysisModule.rgbToLab).toBeDefined();
      expect(typeof AnalysisModule.rgbToLab).toBe('function');
    });

    it('hexToLab이 export된다', () => {
      expect(AnalysisModule.hexToLab).toBeDefined();
      expect(typeof AnalysisModule.hexToLab).toBe('function');
    });

    it('calculateChroma가 export된다', () => {
      expect(AnalysisModule.calculateChroma).toBeDefined();
      expect(typeof AnalysisModule.calculateChroma).toBe('function');
    });

    it('calculateHue가 export된다', () => {
      expect(AnalysisModule.calculateHue).toBeDefined();
      expect(typeof AnalysisModule.calculateHue).toBe('function');
    });

    it('generateTonePalette가 export된다', () => {
      expect(AnalysisModule.generateTonePalette).toBeDefined();
      expect(typeof AnalysisModule.generateTonePalette).toBe('function');
    });
  });

  // ==========================================================================
  // 상수 export
  // ==========================================================================
  describe('상수 export', () => {
    it('KOREAN_ADJUSTMENTS가 export된다', () => {
      expect(AnalysisModule.KOREAN_ADJUSTMENTS).toBeDefined();
      expect(typeof AnalysisModule.KOREAN_ADJUSTMENTS).toBe('object');
    });

    it('SEASON_SUBTYPES가 export된다', () => {
      expect(AnalysisModule.SEASON_SUBTYPES).toBeDefined();
      expect(typeof AnalysisModule.SEASON_SUBTYPES).toBe('object');
    });
  });

  // ==========================================================================
  // 모듈 구조 검증
  // ==========================================================================
  describe('모듈 구조', () => {
    it('필수 모듈이 모두 export된다', () => {
      const exports = Object.keys(AnalysisModule);

      // 최소 10개 이상의 함수/타입이 있어야 함
      expect(exports.length).toBeGreaterThanOrEqual(10);
    });

    it('주요 함수들이 export되어 있다', () => {
      const exports = Object.keys(AnalysisModule);

      // Canvas 유틸리티
      expect(exports).toContain('createOptimizedContext');

      // 12-Tone 분류
      expect(exports).toContain('classify12Tone');
      expect(exports).toContain('rgbToLab');
      expect(exports).toContain('hexToLab');
    });
  });
});
