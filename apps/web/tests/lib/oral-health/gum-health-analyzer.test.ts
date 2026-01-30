/**
 * 잇몸 건강 분석기 테스트
 *
 * @module tests/lib/oral-health/gum-health-analyzer
 * @description 이미지 기반 잇몸 염증 탐지 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  analyzeGumHealth,
  getGumHealthGrade,
  generateGumHealthSummary,
} from '@/lib/oral-health/gum-health-analyzer';
import type { GumHealthResult } from '@/types/oral-health';

// Gemini 브릿지 모킹
vi.mock('@/lib/oral-health/internal/gemini-bridge', () => ({
  getGeminiOralAnalysis: vi.fn().mockResolvedValue({ data: null, usedFallback: true }),
  convertGeminiGumHealthResult: vi.fn(),
  extractGumPixelsWithGemini: vi.fn().mockResolvedValue({ usedFallback: true }),
}));

describe('lib/oral-health/gum-health-analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeGumHealth', () => {
    it('should return gum health analysis result', async () => {
      const result = await analyzeGumHealth(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false // Gemini 비활성화
      );

      expect(result).toBeDefined();
      expect(result.healthStatus).toBeDefined();
      expect(result.inflammationScore).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should return usedFallback: true when using mock', async () => {
      const result = await analyzeGumHealth(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      expect(result.usedFallback).toBe(true);
    });

    it('should return valid health status', async () => {
      const result = await analyzeGumHealth(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      const validStatuses = [
        'healthy',
        'mild_gingivitis',
        'moderate_gingivitis',
        'severe_inflammation',
      ];
      expect(validStatuses).toContain(result.healthStatus);
    });

    it('should have inflammation score in 0-100 range', async () => {
      const result = await analyzeGumHealth(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      expect(result.inflammationScore).toBeGreaterThanOrEqual(0);
      expect(result.inflammationScore).toBeLessThanOrEqual(100);
    });

    it('should include needsDentalVisit boolean', async () => {
      const result = await analyzeGumHealth(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      expect(typeof result.needsDentalVisit).toBe('boolean');
    });

    it('should include metrics with aStarMean', async () => {
      const result = await analyzeGumHealth(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      expect(result.metrics.aStarMean).toBeDefined();
      expect(result.metrics.aStarStd).toBeDefined();
      expect(result.metrics.rednessPercentage).toBeDefined();
      expect(result.metrics.swellingIndicator).toBeDefined();
    });

    it('should return array of recommendations', async () => {
      const result = await analyzeGumHealth(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should have recommendations as strings', async () => {
      const result = await analyzeGumHealth(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      for (const rec of result.recommendations) {
        expect(typeof rec).toBe('string');
      }
    });

    it('should optionally include affected areas', async () => {
      const result = await analyzeGumHealth(
        { imageBase64: 'data:image/jpeg;base64,mockdata' },
        false
      );

      // affectedAreas는 선택적 필드
      if (result.affectedAreas) {
        expect(Array.isArray(result.affectedAreas)).toBe(true);
        for (const area of result.affectedAreas) {
          expect(['upper_front', 'upper_back', 'lower_front', 'lower_back']).toContain(area.region);
          expect(['mild', 'moderate', 'severe']).toContain(area.severity);
        }
      }
    });
  });

  describe('getGumHealthGrade', () => {
    it('should return grade A for score < 20', () => {
      const result = getGumHealthGrade(15);

      expect(result.grade).toBe('A');
      expect(result.label).toBe('매우 좋음');
    });

    it('should return grade B for score 20-39', () => {
      const result = getGumHealthGrade(30);

      expect(result.grade).toBe('B');
      expect(result.label).toBe('좋음');
    });

    it('should return grade C for score 40-59', () => {
      const result = getGumHealthGrade(50);

      expect(result.grade).toBe('C');
      expect(result.label).toBe('보통');
    });

    it('should return grade D for score 60-79', () => {
      const result = getGumHealthGrade(70);

      expect(result.grade).toBe('D');
      expect(result.label).toBe('주의');
    });

    it('should return grade F for score >= 80', () => {
      const result = getGumHealthGrade(85);

      expect(result.grade).toBe('F');
      expect(result.label).toBe('위험');
    });

    it('should include description for each grade', () => {
      const scores = [10, 30, 50, 70, 90];

      for (const score of scores) {
        const result = getGumHealthGrade(score);
        expect(result.description.length).toBeGreaterThan(0);
      }
    });

    it('should handle boundary at 20', () => {
      expect(getGumHealthGrade(19).grade).toBe('A');
      expect(getGumHealthGrade(20).grade).toBe('B');
    });

    it('should handle boundary at 40', () => {
      expect(getGumHealthGrade(39).grade).toBe('B');
      expect(getGumHealthGrade(40).grade).toBe('C');
    });

    it('should handle boundary at 60', () => {
      expect(getGumHealthGrade(59).grade).toBe('C');
      expect(getGumHealthGrade(60).grade).toBe('D');
    });

    it('should handle boundary at 80', () => {
      expect(getGumHealthGrade(79).grade).toBe('D');
      expect(getGumHealthGrade(80).grade).toBe('F');
    });

    it('should handle zero score', () => {
      const result = getGumHealthGrade(0);

      expect(result.grade).toBe('A');
    });

    it('should handle score of 100', () => {
      const result = getGumHealthGrade(100);

      expect(result.grade).toBe('F');
    });
  });

  describe('generateGumHealthSummary', () => {
    const mockHealthyResult: GumHealthResult = {
      healthStatus: 'healthy',
      inflammationScore: 15,
      needsDentalVisit: false,
      metrics: {
        aStarMean: 8,
        aStarStd: 2,
        rednessPercentage: 0,
        swellingIndicator: 0,
      },
      recommendations: ['현재 잇몸 상태가 양호합니다.'],
    };

    const mockModerateResult: GumHealthResult = {
      healthStatus: 'moderate_gingivitis',
      inflammationScore: 60,
      needsDentalVisit: true,
      metrics: {
        aStarMean: 17,
        aStarStd: 4,
        rednessPercentage: 40,
        swellingIndicator: 5,
      },
      recommendations: ['치과 방문을 권장합니다.'],
    };

    it('should include grade in summary', () => {
      const summary = generateGumHealthSummary(mockHealthyResult);

      expect(summary).toContain('A');
      expect(summary).toContain('매우 좋음');
    });

    it('should include inflammation score', () => {
      const summary = generateGumHealthSummary(mockHealthyResult);

      expect(summary).toContain('15');
      expect(summary).toContain('/100');
    });

    it('should include dental visit recommendation when needed', () => {
      const summary = generateGumHealthSummary(mockModerateResult);

      expect(summary).toContain('치과 방문');
    });

    it('should not include dental visit for healthy gums', () => {
      const summary = generateGumHealthSummary(mockHealthyResult);

      // needsDentalVisit가 false면 치과 방문 권장 없음
      expect(summary).not.toContain('치과 방문을 권장합니다');
    });

    it('should include grade description', () => {
      const summary = generateGumHealthSummary(mockHealthyResult);

      expect(summary).toContain('건강한');
    });

    it('should handle severe inflammation', () => {
      const severeResult: GumHealthResult = {
        ...mockModerateResult,
        healthStatus: 'severe_inflammation',
        inflammationScore: 85,
      };
      const summary = generateGumHealthSummary(severeResult);

      expect(summary).toContain('F');
      expect(summary).toContain('위험');
    });

    it('should be multi-line format', () => {
      const summary = generateGumHealthSummary(mockHealthyResult);

      expect(summary).toContain('\n');
    });
  });
});
