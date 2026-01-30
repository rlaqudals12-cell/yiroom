/**
 * 인사이트 어댑터 테스트
 *
 * @module tests/lib/insights/adapters
 */

import { describe, it, expect } from 'vitest';
import { analysisToDataBundle, calculateProgressFromFlags } from '@/lib/insights/adapters';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

describe('Insights Adapters', () => {
  describe('analysisToDataBundle', () => {
    it('should convert empty analyses to empty bundle', () => {
      const result = analysisToDataBundle([]);

      expect(result).toEqual({});
    });

    it('should convert personal color analysis', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'pc_1',
          type: 'personal-color',
          createdAt: new Date(),
          summary: '봄 웜톤',
          seasonType: 'Spring',
        },
      ];

      const result = analysisToDataBundle(analyses);

      expect(result.personalColor).toBeDefined();
      expect(result.personalColor?.season).toBe('spring');
      expect(result.personalColor?.undertone).toBe('warm');
      expect(result.personalColor?.subType).toBe('bright');
      expect(result.personalColor?.confidence).toBe(80);
    });

    it('should convert skin analysis with high score', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'skin_1',
          type: 'skin',
          createdAt: new Date(),
          summary: '85점',
          skinScore: 85,
        },
      ];

      const result = analysisToDataBundle(analyses);

      expect(result.skin).toBeDefined();
      expect(result.skin?.skinType).toBe('normal');
      expect(result.skin?.hydrationLevel).toBe(85);
      expect(result.skin?.oilLevel).toBe(15);
    });

    it('should convert skin analysis with low score to sensitive', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'skin_1',
          type: 'skin',
          createdAt: new Date(),
          summary: '35점',
          skinScore: 35,
        },
      ];

      const result = analysisToDataBundle(analyses);

      expect(result.skin?.skinType).toBe('sensitive');
    });

    it('should convert skin analysis with medium score to combination', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'skin_1',
          type: 'skin',
          createdAt: new Date(),
          summary: '65점',
          skinScore: 65,
        },
      ];

      const result = analysisToDataBundle(analyses);

      expect(result.skin?.skinType).toBe('combination');
    });

    it('should convert body analysis', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'body_1',
          type: 'body',
          createdAt: new Date(),
          summary: '모래시계형',
          bodyType: 'hourglass',
        },
      ];

      const result = analysisToDataBundle(analyses);

      expect(result.body).toBeDefined();
      expect(result.body?.bodyType).toBe('hourglass');
    });

    it('should convert hair analysis with score', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'hair_1',
          type: 'hair',
          createdAt: new Date(),
          summary: '직모 · 75점',
          hairType: 'straight',
          hairScore: 75,
        },
      ];

      const result = analysisToDataBundle(analyses);

      expect(result.hair).toBeDefined();
      expect(result.hair?.hairType).toBe('straight');
      expect(result.hair?.hairCondition).toBe('healthy');
    });

    it('should convert hair analysis with low score to damaged', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'hair_1',
          type: 'hair',
          createdAt: new Date(),
          summary: '곱슬 · 30점',
          hairType: 'curly',
          hairScore: 30,
        },
      ];

      const result = analysisToDataBundle(analyses);

      expect(result.hair?.hairCondition).toBe('damaged');
    });

    it('should convert multiple analyses', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'pc_1',
          type: 'personal-color',
          createdAt: new Date(),
          summary: '여름 쿨톤',
          seasonType: 'Summer',
        },
        {
          id: 'skin_1',
          type: 'skin',
          createdAt: new Date(),
          summary: '70점',
          skinScore: 70,
        },
        {
          id: 'body_1',
          type: 'body',
          createdAt: new Date(),
          summary: '서양배형',
          bodyType: 'pear',
        },
      ];

      const result = analysisToDataBundle(analyses);

      expect(result.personalColor).toBeDefined();
      expect(result.personalColor?.season).toBe('summer');
      expect(result.personalColor?.undertone).toBe('cool');

      expect(result.skin).toBeDefined();
      expect(result.skin?.skinType).toBe('combination');

      expect(result.body).toBeDefined();
      expect(result.body?.bodyType).toBe('pear');
    });

    it('should handle winter season correctly', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'pc_1',
          type: 'personal-color',
          createdAt: new Date(),
          summary: '겨울 쿨톤',
          seasonType: 'Winter',
        },
      ];

      const result = analysisToDataBundle(analyses);

      expect(result.personalColor?.season).toBe('winter');
      expect(result.personalColor?.undertone).toBe('cool');
      expect(result.personalColor?.subType).toBe('dark');
    });

    it('should handle autumn season correctly', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'pc_1',
          type: 'personal-color',
          createdAt: new Date(),
          summary: '가을 웜톤',
          seasonType: 'Autumn',
        },
      ];

      const result = analysisToDataBundle(analyses);

      expect(result.personalColor?.season).toBe('autumn');
      expect(result.personalColor?.undertone).toBe('warm');
      expect(result.personalColor?.subType).toBe('muted');
    });

    it('should return null for missing optional fields', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'pc_1',
          type: 'personal-color',
          createdAt: new Date(),
          summary: '분석 완료',
          // seasonType missing
        },
      ];

      const result = analysisToDataBundle(analyses);

      expect(result.personalColor).toBeNull();
    });

    it('should ignore makeup analysis (not supported)', () => {
      const analyses: AnalysisSummary[] = [
        {
          id: 'makeup_1',
          type: 'makeup',
          createdAt: new Date(),
          summary: '웜톤 · 80점',
          makeupScore: 80,
          undertone: 'warm',
        },
      ];

      const result = analysisToDataBundle(analyses);

      // makeup은 insights 모듈에서 미지원
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('calculateProgressFromFlags', () => {
    it('should return 0% for no completed analyses', () => {
      const result = calculateProgressFromFlags(false, false, false);

      expect(result.completed).toBe(0);
      expect(result.total).toBe(3);
      expect(result.percentage).toBe(0);
    });

    it('should return 33% for one completed analysis', () => {
      const result = calculateProgressFromFlags(true, false, false);

      expect(result.completed).toBe(1);
      expect(result.percentage).toBe(33);
    });

    it('should return 67% for two completed analyses', () => {
      const result = calculateProgressFromFlags(true, true, false);

      expect(result.completed).toBe(2);
      expect(result.percentage).toBe(67);
    });

    it('should return 100% for all completed analyses', () => {
      const result = calculateProgressFromFlags(true, true, true);

      expect(result.completed).toBe(3);
      expect(result.total).toBe(3);
      expect(result.percentage).toBe(100);
    });

    it('should count skin-only completion', () => {
      const result = calculateProgressFromFlags(false, true, false);

      expect(result.completed).toBe(1);
      expect(result.percentage).toBe(33);
    });

    it('should count body-only completion', () => {
      const result = calculateProgressFromFlags(false, false, true);

      expect(result.completed).toBe(1);
      expect(result.percentage).toBe(33);
    });
  });
});
