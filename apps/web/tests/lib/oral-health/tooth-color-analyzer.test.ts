/**
 * 치아 색상 분석기 테스트
 *
 * @module tests/lib/oral-health/tooth-color-analyzer
 * @description VITA 셰이드 기반 치아 색상 분석 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  analyzeToothColor,
  generateToothColorSummary,
} from '@/lib/oral-health/tooth-color-analyzer';
import type { ToothColorResult } from '@/types/oral-health';

// Gemini 브릿지 모킹
vi.mock('@/lib/oral-health/internal/gemini-bridge', () => ({
  getGeminiOralAnalysis: vi.fn().mockResolvedValue({ data: null, usedFallback: true }),
  convertGeminiToothColorResult: vi.fn(),
  extractToothLabWithGemini: vi.fn().mockResolvedValue({ usedFallback: true }),
}));

describe('lib/oral-health/tooth-color-analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeToothColor', () => {
    it('should return tooth color analysis result', async () => {
      const result = await analyzeToothColor(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false // Gemini 비활성화
      );

      expect(result).toBeDefined();
      expect(result.matchedShade).toBeDefined();
      expect(result.measuredLab).toBeDefined();
      expect(result.deltaE).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should return usedFallback: true when using mock', async () => {
      const result = await analyzeToothColor(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      expect(result.usedFallback).toBe(true);
    });

    it('should include alternative matches', async () => {
      const result = await analyzeToothColor(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      expect(result.alternativeMatches).toBeDefined();
      expect(Array.isArray(result.alternativeMatches)).toBe(true);
    });

    it('should include brightness interpretation', async () => {
      const result = await analyzeToothColor(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      expect(result.interpretation).toBeDefined();
      expect(result.interpretation.brightness).toBeDefined();
      expect(['very_bright', 'bright', 'medium', 'dark', 'very_dark']).toContain(
        result.interpretation.brightness
      );
    });

    it('should include yellowness interpretation', async () => {
      const result = await analyzeToothColor(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      expect(result.interpretation.yellowness).toBeDefined();
      expect(['minimal', 'mild', 'moderate', 'significant']).toContain(
        result.interpretation.yellowness
      );
    });

    it('should include series information', async () => {
      const result = await analyzeToothColor(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      expect(result.interpretation.series).toBeDefined();
      expect(['A', 'B', 'C', 'D']).toContain(result.interpretation.series);
    });

    it('should have deltaE rounded to 2 decimal places', async () => {
      const result = await analyzeToothColor(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      const decimals = (result.deltaE.toString().split('.')[1] || '').length;
      expect(decimals).toBeLessThanOrEqual(2);
    });

    it('should have confidence in valid range (50-100)', async () => {
      const result = await analyzeToothColor(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      expect(result.confidence).toBeGreaterThanOrEqual(50);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should match a valid VITA shade', async () => {
      const result = await analyzeToothColor(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      const validShades = [
        '0M1',
        '0M2',
        '0M3',
        'A1',
        'A2',
        'A3',
        'A3.5',
        'A4',
        'B1',
        'B2',
        'B3',
        'B4',
        'C1',
        'C2',
        'C3',
        'C4',
        'D2',
        'D3',
        'D4',
      ];
      expect(validShades).toContain(result.matchedShade);
    });

    it('should have Lab values in valid ranges', async () => {
      const result = await analyzeToothColor(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      // 치아 색상은 일반적으로 L: 50-80, a: 0-10, b: 10-30 범위
      expect(result.measuredLab.L).toBeGreaterThan(40);
      expect(result.measuredLab.L).toBeLessThan(90);
      expect(result.measuredLab.a).toBeGreaterThanOrEqual(-5);
      expect(result.measuredLab.a).toBeLessThan(20);
      expect(result.measuredLab.b).toBeGreaterThan(0);
      expect(result.measuredLab.b).toBeLessThan(40);
    });
  });

  describe('generateToothColorSummary', () => {
    const mockResult: ToothColorResult = {
      measuredLab: { L: 67, a: 2.5, b: 19 },
      matchedShade: 'A2',
      deltaE: 1.5,
      confidence: 85,
      alternativeMatches: [
        { shade: 'A3', deltaE: 2.3 },
        { shade: 'B2', deltaE: 2.8 },
      ],
      interpretation: {
        brightness: 'bright',
        yellowness: 'moderate',
        series: 'A',
      },
    };

    it('should include matched shade in summary', () => {
      const summary = generateToothColorSummary(mockResult);

      expect(summary).toContain('A2');
    });

    it('should include confidence percentage', () => {
      const summary = generateToothColorSummary(mockResult);

      expect(summary).toContain('85%');
    });

    it('should include brightness description', () => {
      const summary = generateToothColorSummary(mockResult);

      expect(summary).toContain('밝은');
    });

    it('should include yellowness description', () => {
      const summary = generateToothColorSummary(mockResult);

      expect(summary).toContain('황색기');
    });

    it('should include series description', () => {
      const summary = generateToothColorSummary(mockResult);

      expect(summary).toContain('황갈색 계열');
    });

    it('should handle very_bright brightness', () => {
      const result: ToothColorResult = {
        ...mockResult,
        interpretation: { ...mockResult.interpretation, brightness: 'very_bright' },
      };
      const summary = generateToothColorSummary(result);

      expect(summary).toContain('매우 밝은');
    });

    it('should handle B series', () => {
      const result: ToothColorResult = {
        ...mockResult,
        matchedShade: 'B1',
        interpretation: { ...mockResult.interpretation, series: 'B' },
      };
      const summary = generateToothColorSummary(result);

      expect(summary).toContain('황색 계열');
    });

    it('should handle C series', () => {
      const result: ToothColorResult = {
        ...mockResult,
        matchedShade: 'C1',
        interpretation: { ...mockResult.interpretation, series: 'C' },
      };
      const summary = generateToothColorSummary(result);

      expect(summary).toContain('회색 계열');
    });

    it('should handle D series', () => {
      const result: ToothColorResult = {
        ...mockResult,
        matchedShade: 'D2',
        interpretation: { ...mockResult.interpretation, series: 'D' },
      };
      const summary = generateToothColorSummary(result);

      expect(summary).toContain('적회색 계열');
    });

    it('should handle minimal yellowness', () => {
      const result: ToothColorResult = {
        ...mockResult,
        interpretation: { ...mockResult.interpretation, yellowness: 'minimal' },
      };
      const summary = generateToothColorSummary(result);

      expect(summary).toContain('황색기가 거의 없는');
    });

    it('should handle significant yellowness', () => {
      const result: ToothColorResult = {
        ...mockResult,
        interpretation: { ...mockResult.interpretation, yellowness: 'significant' },
      };
      const summary = generateToothColorSummary(result);

      expect(summary).toContain('뚜렷한 황색기');
    });
  });
});
