/**
 * 인사이트 우선순위 점수 계산 테스트
 *
 * @module tests/lib/insights/scoring
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCategoryBaseScore,
  getModuleCountBonus,
  getConfidenceBonus,
  getCompletenessBonus,
  getFreshnessBonus,
  calculatePriorityScore,
  scoreToPriority,
  priorityToScoreRange,
  sortByPriorityScore,
  filterByMinScore,
} from '@/lib/insights/scoring';
import type { AnalysisDataBundle } from '@/lib/insights/types';

describe('Insights Scoring', () => {
  describe('getCategoryBaseScore', () => {
    it('should return highest score for health_alert', () => {
      expect(getCategoryBaseScore('health_alert')).toBe(30);
    });

    it('should return correct score for skin_care', () => {
      expect(getCategoryBaseScore('skin_care')).toBe(25);
    });

    it('should return correct score for color_match', () => {
      expect(getCategoryBaseScore('color_match')).toBe(22);
    });

    it('should return correct score for style_tip', () => {
      expect(getCategoryBaseScore('style_tip')).toBe(20);
    });

    it('should return correct score for product_recommendation', () => {
      expect(getCategoryBaseScore('product_recommendation')).toBe(18);
    });

    it('should return correct score for routine_suggestion', () => {
      expect(getCategoryBaseScore('routine_suggestion')).toBe(15);
    });

    it('should return correct score for synergy', () => {
      expect(getCategoryBaseScore('synergy')).toBe(12);
    });

    it('should return default score for unknown category', () => {
      // @ts-expect-error - 테스트를 위한 알 수 없는 카테고리
      expect(getCategoryBaseScore('unknown_category')).toBe(10);
    });
  });

  describe('getModuleCountBonus', () => {
    it('should return 0 for single module', () => {
      expect(getModuleCountBonus(1)).toBe(0);
    });

    it('should return 10 for 2 modules', () => {
      expect(getModuleCountBonus(2)).toBe(10);
    });

    it('should return 15 for 3 modules', () => {
      expect(getModuleCountBonus(3)).toBe(15);
    });

    it('should return 18 for 4 modules', () => {
      expect(getModuleCountBonus(4)).toBe(18);
    });

    it('should return 20 for 5 modules', () => {
      expect(getModuleCountBonus(5)).toBe(20);
    });

    it('should cap at 20 for 6 or more modules', () => {
      expect(getModuleCountBonus(6)).toBe(20);
      expect(getModuleCountBonus(10)).toBe(20);
    });

    it('should return 0 for 0 modules', () => {
      expect(getModuleCountBonus(0)).toBe(0);
    });
  });

  describe('getConfidenceBonus', () => {
    it('should return 20 for high confidence (80+)', () => {
      expect(getConfidenceBonus(80)).toBe(20);
      expect(getConfidenceBonus(95)).toBe(20);
      expect(getConfidenceBonus(100)).toBe(20);
    });

    it('should return 12 for medium confidence (60-79)', () => {
      expect(getConfidenceBonus(60)).toBe(12);
      expect(getConfidenceBonus(70)).toBe(12);
      expect(getConfidenceBonus(79)).toBe(12);
    });

    it('should return 5 for low confidence (40-59)', () => {
      expect(getConfidenceBonus(40)).toBe(5);
      expect(getConfidenceBonus(50)).toBe(5);
      expect(getConfidenceBonus(59)).toBe(5);
    });

    it('should return 0 for very low confidence (<40)', () => {
      expect(getConfidenceBonus(0)).toBe(0);
      expect(getConfidenceBonus(20)).toBe(0);
      expect(getConfidenceBonus(39)).toBe(0);
    });
  });

  describe('getCompletenessBonus', () => {
    it('should return 0 for empty bundle', () => {
      const bundle: AnalysisDataBundle = {};
      expect(getCompletenessBonus(bundle)).toBe(0);
    });

    it('should return proportional bonus for partial bundle', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: { season: 'spring', undertone: 'warm', confidence: 85 },
        skin: { skinType: 'combination' },
      };
      // 2/6 = 33.3% → 33.3% * 15 = 5
      expect(getCompletenessBonus(bundle)).toBe(5);
    });

    it('should return 15 for complete bundle', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: { season: 'spring', undertone: 'warm', confidence: 85 },
        skin: { skinType: 'combination' },
        body: { bodyType: 'hourglass' },
        face: { faceShape: 'oval' },
        hair: { hairType: 'straight' },
        oralHealth: { gumHealthStatus: 'healthy' },
      };
      expect(getCompletenessBonus(bundle)).toBe(15);
    });

    it('should handle null values correctly', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: { season: 'spring', undertone: 'warm', confidence: 85 },
        skin: null,
        body: null,
      };
      // 1/6 = 16.7% → 16.7% * 15 = 2.5 → 3 (반올림)
      expect(getCompletenessBonus(bundle)).toBe(3);
    });
  });

  describe('getFreshnessBonus', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-30T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return 15 for analysis within 1 day', () => {
      const analysisDate = new Date('2026-01-30T10:00:00Z');
      expect(getFreshnessBonus(analysisDate)).toBe(15);
    });

    it('should return 10 for analysis within 7 days', () => {
      const analysisDate = new Date('2026-01-25T12:00:00Z');
      expect(getFreshnessBonus(analysisDate)).toBe(10);
    });

    it('should return 5 for analysis within 30 days', () => {
      const analysisDate = new Date('2026-01-10T12:00:00Z');
      expect(getFreshnessBonus(analysisDate)).toBe(5);
    });

    it('should return 0 for analysis older than 30 days', () => {
      const analysisDate = new Date('2025-12-01T12:00:00Z');
      expect(getFreshnessBonus(analysisDate)).toBe(0);
    });
  });

  describe('calculatePriorityScore', () => {
    it('should calculate correct score for basic input', () => {
      const score = calculatePriorityScore({
        category: 'color_match',
        relatedModules: ['personal_color', 'skin'],
        confidence: 85,
      });

      // 카테고리(22) + 모듈수(10) + 신뢰도(20) = 52
      expect(score).toBe(52);
    });

    it('should include completeness bonus when dataBundle provided', () => {
      const dataBundle: AnalysisDataBundle = {
        personalColor: { season: 'spring', undertone: 'warm', confidence: 85 },
        skin: { skinType: 'combination' },
      };

      const score = calculatePriorityScore({
        category: 'color_match',
        relatedModules: ['personal_color', 'skin'],
        confidence: 85,
        dataBundle,
      });

      // 카테고리(22) + 모듈수(10) + 신뢰도(20) + 완성도(5) = 57
      expect(score).toBe(57);
    });

    it('should cap score at 100', () => {
      const completeBundle: AnalysisDataBundle = {
        personalColor: { season: 'spring', undertone: 'warm', confidence: 100 },
        skin: { skinType: 'combination' },
        body: { bodyType: 'hourglass' },
        face: { faceShape: 'oval' },
        hair: { hairType: 'straight' },
        oralHealth: { gumHealthStatus: 'healthy' },
      };

      const score = calculatePriorityScore({
        category: 'health_alert',
        relatedModules: ['personal_color', 'skin', 'body', 'face', 'hair', 'oral_health'],
        confidence: 100,
        dataBundle: completeBundle,
        analysisDate: new Date(),
      });

      // 30 + 20 + 20 + 15 + 15 = 100
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should use default confidence of 70 when not provided', () => {
      const score = calculatePriorityScore({
        category: 'skin_care',
        relatedModules: ['skin'],
      });

      // 카테고리(25) + 모듈수(0) + 신뢰도(12, 70은 medium) = 37
      expect(score).toBe(37);
    });
  });

  describe('scoreToPriority', () => {
    it('should return critical for score >= 80', () => {
      expect(scoreToPriority(80)).toBe('critical');
      expect(scoreToPriority(90)).toBe('critical');
      expect(scoreToPriority(100)).toBe('critical');
    });

    it('should return high for score 60-79', () => {
      expect(scoreToPriority(60)).toBe('high');
      expect(scoreToPriority(70)).toBe('high');
      expect(scoreToPriority(79)).toBe('high');
    });

    it('should return medium for score 40-59', () => {
      expect(scoreToPriority(40)).toBe('medium');
      expect(scoreToPriority(50)).toBe('medium');
      expect(scoreToPriority(59)).toBe('medium');
    });

    it('should return low for score < 40', () => {
      expect(scoreToPriority(0)).toBe('low');
      expect(scoreToPriority(20)).toBe('low');
      expect(scoreToPriority(39)).toBe('low');
    });
  });

  describe('priorityToScoreRange', () => {
    it('should return correct range for critical', () => {
      expect(priorityToScoreRange('critical')).toEqual({ min: 80, max: 100 });
    });

    it('should return correct range for high', () => {
      expect(priorityToScoreRange('high')).toEqual({ min: 60, max: 79 });
    });

    it('should return correct range for medium', () => {
      expect(priorityToScoreRange('medium')).toEqual({ min: 40, max: 59 });
    });

    it('should return correct range for low', () => {
      expect(priorityToScoreRange('low')).toEqual({ min: 0, max: 39 });
    });
  });

  describe('sortByPriorityScore', () => {
    it('should sort insights by priority score descending', () => {
      const insights = [
        { id: '1', priorityScore: 30 },
        { id: '2', priorityScore: 80 },
        { id: '3', priorityScore: 50 },
      ];

      const sorted = sortByPriorityScore(insights);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });

    it('should not mutate original array', () => {
      const insights = [
        { id: '1', priorityScore: 30 },
        { id: '2', priorityScore: 80 },
      ];

      const sorted = sortByPriorityScore(insights);

      expect(insights[0].id).toBe('1');
      expect(sorted[0].id).toBe('2');
    });

    it('should handle empty array', () => {
      expect(sortByPriorityScore([])).toEqual([]);
    });
  });

  describe('filterByMinScore', () => {
    it('should filter insights below minimum score', () => {
      const insights = [
        { id: '1', priorityScore: 30 },
        { id: '2', priorityScore: 80 },
        { id: '3', priorityScore: 50 },
      ];

      const filtered = filterByMinScore(insights, 40);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((i) => i.id)).toEqual(['2', '3']);
    });

    it('should return all insights when minScore is 0', () => {
      const insights = [
        { id: '1', priorityScore: 30 },
        { id: '2', priorityScore: 80 },
      ];

      const filtered = filterByMinScore(insights, 0);

      expect(filtered).toHaveLength(2);
    });

    it('should return empty array when no insights meet threshold', () => {
      const insights = [
        { id: '1', priorityScore: 30 },
        { id: '2', priorityScore: 40 },
      ];

      const filtered = filterByMinScore(insights, 50);

      expect(filtered).toHaveLength(0);
    });
  });
});
