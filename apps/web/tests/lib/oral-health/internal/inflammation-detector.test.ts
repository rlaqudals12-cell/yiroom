/**
 * 잇몸 염증 탐지 테스트
 *
 * @module tests/lib/oral-health/internal/inflammation-detector
 * @description a* 값 기반 염증 탐지 알고리즘 검증
 */

import { describe, it, expect } from 'vitest';
import {
  detectGumInflammation,
  classifyGumHealth,
  generateGumHealthRecommendations,
  GUM_STATUS_CONFIG,
} from '@/lib/oral-health/internal/inflammation-detector';
import type { LabColor, GumHealthStatus } from '@/types/oral-health';

describe('lib/oral-health/internal/inflammation-detector', () => {
  describe('detectGumInflammation', () => {
    it('should return zeros for empty array', () => {
      const result = detectGumInflammation([]);

      expect(result.aStarMean).toBe(0);
      expect(result.aStarStd).toBe(0);
      expect(result.rednessPercentage).toBe(0);
      expect(result.swellingIndicator).toBe(0);
    });

    it('should calculate correct mean for uniform a* values', () => {
      const pixels: LabColor[] = Array(10).fill({ L: 60, a: 12, b: 15 });
      const result = detectGumInflammation(pixels);

      expect(result.aStarMean).toBe(12);
      expect(result.aStarStd).toBe(0);
    });

    it('should calculate standard deviation for varied a* values', () => {
      const pixels: LabColor[] = [
        { L: 60, a: 10, b: 15 },
        { L: 60, a: 14, b: 15 },
        { L: 60, a: 12, b: 15 },
      ];
      const result = detectGumInflammation(pixels);

      expect(result.aStarMean).toBeCloseTo(12, 1);
      expect(result.aStarStd).toBeGreaterThan(0);
    });

    it('should calculate redness percentage (a* > 15)', () => {
      const pixels: LabColor[] = [
        { L: 60, a: 10, b: 15 }, // 정상
        { L: 60, a: 16, b: 15 }, // 붉음
        { L: 60, a: 18, b: 15 }, // 붉음
        { L: 60, a: 8, b: 15 }, // 정상
      ];
      const result = detectGumInflammation(pixels);

      // 4개 중 2개가 a > 15 → 50%
      expect(result.rednessPercentage).toBe(50);
    });

    it('should calculate swelling indicator based on L and a combination', () => {
      // 부은 잇몸: 어둡고(L 낮음) 붉음(a 높음)
      const healthyPixels: LabColor[] = Array(10).fill({ L: 65, a: 8, b: 12 });
      const swollenPixels: LabColor[] = Array(10).fill({ L: 50, a: 20, b: 15 });

      const healthyResult = detectGumInflammation(healthyPixels);
      const swollenResult = detectGumInflammation(swollenPixels);

      expect(swollenResult.swellingIndicator).toBeGreaterThan(healthyResult.swellingIndicator);
    });

    it('should handle healthy gum pixels (low a*)', () => {
      const healthyPixels: LabColor[] = Array(20).fill({ L: 65, a: 8, b: 12 });
      const result = detectGumInflammation(healthyPixels);

      expect(result.aStarMean).toBe(8);
      expect(result.rednessPercentage).toBe(0);
    });

    it('should handle inflamed gum pixels (high a*)', () => {
      const inflamedPixels: LabColor[] = Array(20).fill({ L: 55, a: 22, b: 15 });
      const result = detectGumInflammation(inflamedPixels);

      expect(result.aStarMean).toBe(22);
      expect(result.rednessPercentage).toBe(100);
    });
  });

  describe('classifyGumHealth', () => {
    it('should classify as healthy for low inflammation indicators', () => {
      const metrics = {
        aStarMean: 8,
        aStarStd: 2,
        rednessPercentage: 0,
        swellingIndicator: 0,
      };
      const result = classifyGumHealth(metrics);

      expect(result.status).toBe('healthy');
      expect(result.inflammationScore).toBeLessThan(25);
      expect(result.needsDentalVisit).toBe(false);
      expect(result.confidence).toBeGreaterThanOrEqual(85);
    });

    it('should classify as mild_gingivitis for moderate a* values', () => {
      const metrics = {
        aStarMean: 12,
        aStarStd: 3,
        rednessPercentage: 20,
        swellingIndicator: 2,
      };
      const result = classifyGumHealth(metrics);

      expect(result.status).toBe('mild_gingivitis');
      expect(result.needsDentalVisit).toBe(false);
    });

    it('should classify as moderate_gingivitis for elevated values', () => {
      const metrics = {
        aStarMean: 17,
        aStarStd: 4,
        rednessPercentage: 40,
        swellingIndicator: 5,
      };
      const result = classifyGumHealth(metrics);

      expect(result.status).toBe('moderate_gingivitis');
      expect(result.needsDentalVisit).toBe(true);
    });

    it('should classify as severe_inflammation for high values', () => {
      const metrics = {
        aStarMean: 25,
        aStarStd: 5,
        rednessPercentage: 80,
        swellingIndicator: 10,
      };
      const result = classifyGumHealth(metrics);

      expect(result.status).toBe('severe_inflammation');
      expect(result.needsDentalVisit).toBe(true);
      expect(result.inflammationScore).toBeGreaterThan(70);
    });

    it('should calculate inflammation score capped at 100', () => {
      const extremeMetrics = {
        aStarMean: 50,
        aStarStd: 10,
        rednessPercentage: 100,
        swellingIndicator: 20,
      };
      const result = classifyGumHealth(extremeMetrics);

      expect(result.inflammationScore).toBeLessThanOrEqual(100);
    });

    it('should have higher confidence for clear healthy cases', () => {
      const healthyMetrics = {
        aStarMean: 7,
        aStarStd: 1,
        rednessPercentage: 0,
        swellingIndicator: 0,
      };
      const result = classifyGumHealth(healthyMetrics);

      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should have lower confidence for severe cases (needs professional diagnosis)', () => {
      const severeMetrics = {
        aStarMean: 25,
        aStarStd: 5,
        rednessPercentage: 80,
        swellingIndicator: 10,
      };
      const result = classifyGumHealth(severeMetrics);

      expect(result.confidence).toBeLessThan(80);
    });
  });

  describe('generateGumHealthRecommendations', () => {
    it('should return maintenance recommendations for healthy gums', () => {
      const recommendations = generateGumHealthRecommendations('healthy');

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((r) => r.includes('양호'))).toBe(true);
      expect(recommendations.some((r) => r.includes('정기 치과 검진'))).toBe(true);
    });

    it('should return home care advice for mild gingivitis', () => {
      const recommendations = generateGumHealthRecommendations('mild_gingivitis');

      expect(recommendations.length).toBeGreaterThan(3);
      expect(recommendations.some((r) => r.includes('잇몸 관리 치약'))).toBe(true);
      expect(recommendations.some((r) => r.includes('2주'))).toBe(true);
    });

    it('should recommend dental visit for moderate gingivitis', () => {
      const recommendations = generateGumHealthRecommendations('moderate_gingivitis');

      expect(recommendations.some((r) => r.includes('치과 방문'))).toBe(true);
      expect(recommendations.some((r) => r.includes('스케일링'))).toBe(true);
    });

    it('should urgently recommend dental visit for severe inflammation', () => {
      const recommendations = generateGumHealthRecommendations('severe_inflammation');

      expect(recommendations.some((r) => r.includes('빨리'))).toBe(true);
      expect(recommendations.some((r) => r.includes('치주 질환'))).toBe(true);
      expect(recommendations.some((r) => r.includes('금연'))).toBe(true);
    });

    it('should always return array of strings', () => {
      const statuses: GumHealthStatus[] = [
        'healthy',
        'mild_gingivitis',
        'moderate_gingivitis',
        'severe_inflammation',
      ];

      for (const status of statuses) {
        const recommendations = generateGumHealthRecommendations(status);
        expect(Array.isArray(recommendations)).toBe(true);
        expect(recommendations.every((r) => typeof r === 'string')).toBe(true);
      }
    });
  });

  describe('GUM_STATUS_CONFIG', () => {
    it('should have all four statuses defined', () => {
      expect(GUM_STATUS_CONFIG.healthy).toBeDefined();
      expect(GUM_STATUS_CONFIG.mild_gingivitis).toBeDefined();
      expect(GUM_STATUS_CONFIG.moderate_gingivitis).toBeDefined();
      expect(GUM_STATUS_CONFIG.severe_inflammation).toBeDefined();
    });

    it('should have increasing severity levels', () => {
      expect(GUM_STATUS_CONFIG.healthy.severity).toBe(0);
      expect(GUM_STATUS_CONFIG.mild_gingivitis.severity).toBe(1);
      expect(GUM_STATUS_CONFIG.moderate_gingivitis.severity).toBe(2);
      expect(GUM_STATUS_CONFIG.severe_inflammation.severity).toBe(3);
    });

    it('should have valid CSS color classes', () => {
      const statuses = Object.values(GUM_STATUS_CONFIG);

      for (const status of statuses) {
        expect(status.color).toMatch(/^text-\w+-\d+$/);
        expect(status.bgColor).toMatch(/^bg-\w+-\d+$/);
      }
    });

    it('should have Korean and English labels', () => {
      const statuses = Object.values(GUM_STATUS_CONFIG);

      for (const status of statuses) {
        expect(status.label).toBeTruthy();
        expect(status.labelEn).toBeTruthy();
      }
    });

    it('should have appropriate icons', () => {
      expect(GUM_STATUS_CONFIG.healthy.icon).toBe('check');
      expect(GUM_STATUS_CONFIG.mild_gingivitis.icon).toBe('info');
      expect(GUM_STATUS_CONFIG.moderate_gingivitis.icon).toBe('warning');
      expect(GUM_STATUS_CONFIG.severe_inflammation.icon).toBe('alert');
    });
  });
});
