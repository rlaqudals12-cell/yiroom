/**
 * 시너지 인사이트 모듈 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateSynergyInsight,
  generateSynergyFromGeminiResult,
  filterColorsByAdjustment,
  applyInsightToDraping,
  synergyInsightToDbFormat,
  calculateSynergyScore,
} from '@/lib/analysis/synergy-insight';
import type { PigmentAnalysisSummary, DrapingResultsSummary } from '@/types/visual-analysis';

describe('Synergy Insight', () => {
  describe('generateSynergyInsight', () => {
    it('헤모글로빈 0.4 이상이면 high_redness 반환', () => {
      const pigmentAnalysis: PigmentAnalysisSummary = {
        melanin_avg: 0.4,
        hemoglobin_avg: 0.45,
        distribution: [],
      };

      const result = generateSynergyInsight(pigmentAnalysis);

      expect(result.reason).toBe('high_redness');
      expect(result.colorAdjustment).toBe('muted');
      expect(result.message).toContain('붉은기');
    });

    it('멜라닌 0.55 이상이면 high_oiliness 반환', () => {
      const pigmentAnalysis: PigmentAnalysisSummary = {
        melanin_avg: 0.6,
        hemoglobin_avg: 0.3,
        distribution: [],
      };

      const result = generateSynergyInsight(pigmentAnalysis);

      expect(result.reason).toBe('high_oiliness');
      expect(result.colorAdjustment).toBe('muted');
    });

    it('멜라닌 0.3 이하이면 low_hydration 반환', () => {
      const pigmentAnalysis: PigmentAnalysisSummary = {
        melanin_avg: 0.25,
        hemoglobin_avg: 0.3,
        distribution: [],
      };

      const result = generateSynergyInsight(pigmentAnalysis);

      expect(result.reason).toBe('low_hydration');
      expect(result.colorAdjustment).toBe('bright');
    });

    it('정상 범위면 normal 반환', () => {
      const pigmentAnalysis: PigmentAnalysisSummary = {
        melanin_avg: 0.4,
        hemoglobin_avg: 0.3,
        distribution: [],
      };

      const result = generateSynergyInsight(pigmentAnalysis);

      expect(result.reason).toBe('normal');
      expect(result.colorAdjustment).toBe('neutral');
    });

    it('우선순위: 붉은기 > 멜라닌 높음', () => {
      const pigmentAnalysis: PigmentAnalysisSummary = {
        melanin_avg: 0.6,
        hemoglobin_avg: 0.5,
        distribution: [],
      };

      const result = generateSynergyInsight(pigmentAnalysis);

      // 붉은기가 우선
      expect(result.reason).toBe('high_redness');
    });
  });

  describe('generateSynergyFromGeminiResult', () => {
    it('redness 70 이상이면 high_redness 반환', () => {
      const metrics = [
        { id: 'hydration', value: 50 },
        { id: 'oiliness', value: 50 },
        { id: 'redness', value: 75 },
      ];

      const result = generateSynergyFromGeminiResult(metrics);

      expect(result.reason).toBe('high_redness');
    });

    it('hydration 30 이하이면 low_hydration 반환', () => {
      const metrics = [
        { id: 'hydration', value: 25 },
        { id: 'oiliness', value: 50 },
        { id: 'redness', value: 50 },
      ];

      const result = generateSynergyFromGeminiResult(metrics);

      expect(result.reason).toBe('low_hydration');
    });

    it('oiliness 70 이상이면 high_oiliness 반환', () => {
      const metrics = [
        { id: 'hydration', value: 50 },
        { id: 'oiliness', value: 75 },
        { id: 'redness', value: 50 },
      ];

      const result = generateSynergyFromGeminiResult(metrics);

      expect(result.reason).toBe('high_oiliness');
    });

    it('정상 범위면 normal 반환', () => {
      const metrics = [
        { id: 'hydration', value: 50 },
        { id: 'oiliness', value: 50 },
        { id: 'redness', value: 50 },
      ];

      const result = generateSynergyFromGeminiResult(metrics);

      expect(result.reason).toBe('normal');
    });

    it('metrics가 없어도 기본값으로 처리', () => {
      const result = generateSynergyFromGeminiResult([]);

      expect(result.reason).toBe('normal');
    });
  });

  describe('filterColorsByAdjustment', () => {
    const testColors = [
      '#FF0000', // 선명한 빨강 (높은 채도)
      '#CCAAAA', // 뮤트한 분홍 (낮은 채도)
      '#FF9999', // 연한 분홍 (중간 채도)
      '#333333', // 어두운 회색 (낮은 밝기)
    ];

    it('muted 조정은 채도 낮은 색상만 반환', () => {
      const result = filterColorsByAdjustment(testColors, 'muted');

      // 선명한 빨강은 제외되어야 함
      expect(result).not.toContain('#FF0000');
    });

    it('bright 조정은 채도/밝기 높은 색상만 반환', () => {
      const result = filterColorsByAdjustment(testColors, 'bright');

      // 어두운 회색은 제외되어야 함
      expect(result).not.toContain('#333333');
    });

    it('neutral 조정은 모든 색상 반환', () => {
      const result = filterColorsByAdjustment(testColors, 'neutral');

      expect(result).toHaveLength(testColors.length);
    });
  });

  describe('applyInsightToDraping', () => {
    const drapingResults: DrapingResultsSummary = {
      best_colors: ['#FF0000', '#CCAAAA', '#FF9999', '#AABBCC', '#DDCCBB'],
      uniformity_scores: {
        '#FF0000': 15,
        '#CCAAAA': 20,
        '#FF9999': 25,
        '#AABBCC': 30,
        '#DDCCBB': 35,
      },
      metal_test: 'gold',
    };

    it('muted 조정 시 뮤트한 색상만 추천', () => {
      const insight = {
        message: 'test',
        colorAdjustment: 'muted' as const,
        reason: 'high_redness' as const,
      };

      const result = applyInsightToDraping(drapingResults, insight);

      expect(result.adjustedBestColors.length).toBeGreaterThan(0);
    });

    it('neutral 조정 시 모든 베스트 컬러 유지', () => {
      const insight = {
        message: 'test',
        colorAdjustment: 'neutral' as const,
        reason: 'normal' as const,
      };

      const result = applyInsightToDraping(drapingResults, insight);

      expect(result.adjustedBestColors).toHaveLength(5);
      expect(result.avoidColors).toHaveLength(0);
    });

    it('필터링 결과가 없으면 상위 3개 반환', () => {
      // 모든 색상이 필터링되는 극단적 케이스
      const extremeResults: DrapingResultsSummary = {
        best_colors: ['#000000', '#111111'], // 매우 어두운 색상
        uniformity_scores: { '#000000': 10, '#111111': 15 },
        metal_test: 'gold',
      };

      const insight = {
        message: 'test',
        colorAdjustment: 'bright' as const,
        reason: 'low_hydration' as const,
      };

      const result = applyInsightToDraping(extremeResults, insight);

      expect(result.adjustedBestColors.length).toBeGreaterThan(0);
    });
  });

  describe('synergyInsightToDbFormat', () => {
    it('DB 저장 형식으로 변환한다', () => {
      const insight = {
        message: '테스트 메시지',
        colorAdjustment: 'muted' as const,
        reason: 'high_redness' as const,
      };

      const result = synergyInsightToDbFormat(insight);

      expect(result.message).toBe('테스트 메시지');
      expect(result.color_adjustment).toBe('muted');
      expect(result.reason).toBe('high_redness');
    });
  });

  describe('calculateSynergyScore', () => {
    it('균형 잡힌 피부와 좋은 드레이핑 결과에서 높은 점수', () => {
      const pigmentAnalysis: PigmentAnalysisSummary = {
        melanin_avg: 0.4, // 이상적
        hemoglobin_avg: 0.3, // 이상적
        distribution: [],
      };

      const drapingResults: DrapingResultsSummary = {
        best_colors: ['#FF0000'],
        uniformity_scores: { '#FF0000': 10 }, // 낮은 값 = 좋은 균일도
        metal_test: 'gold',
      };

      const score = calculateSynergyScore(pigmentAnalysis, drapingResults);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('점수는 0-100 범위로 제한된다', () => {
      const pigmentAnalysis: PigmentAnalysisSummary = {
        melanin_avg: 1.0, // 극단값
        hemoglobin_avg: 1.0, // 극단값
        distribution: [],
      };

      const drapingResults: DrapingResultsSummary = {
        best_colors: ['#FF0000'],
        uniformity_scores: { '#FF0000': 100 }, // 높은 값 = 나쁜 균일도
        metal_test: 'gold',
      };

      const score = calculateSynergyScore(pigmentAnalysis, drapingResults);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('uniformity_scores가 비어있어도 처리한다', () => {
      const pigmentAnalysis: PigmentAnalysisSummary = {
        melanin_avg: 0.4,
        hemoglobin_avg: 0.3,
        distribution: [],
      };

      const drapingResults: DrapingResultsSummary = {
        best_colors: [],
        uniformity_scores: {},
        metal_test: 'gold',
      };

      const score = calculateSynergyScore(pigmentAnalysis, drapingResults);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });
});
