/**
 * 인사이트 생성기 테스트
 *
 * @module tests/lib/insights/generator
 */

import { describe, it, expect } from 'vitest';
import {
  generateInsights,
  generateInsightsByCategory,
  generateInsightsForModule,
} from '@/lib/insights/generator';
import type { AnalysisDataBundle } from '@/lib/insights/types';

describe('Insights Generator', () => {
  // 테스트용 기본 데이터 번들
  const baseDataBundle: AnalysisDataBundle = {
    personalColor: {
      season: 'spring',
      undertone: 'warm',
      confidence: 85,
      colorPalette: ['#FFD700', '#FF6347', '#32CD32'],
    },
    skin: {
      skinType: 'combination',
      concerns: ['dehydration', 'enlarged_pores'],
      hydrationLevel: 60,
      oilLevel: 70,
    },
    body: {
      bodyType: 'hourglass',
      shoulderType: 'balanced',
    },
    face: {
      faceShape: 'oval',
      facialFeatures: ['high_cheekbones'],
    },
    hair: {
      hairType: 'straight',
      hairCondition: 'normal',
    },
    oralHealth: {
      gumHealthStatus: 'healthy',
      toothShade: 'A2',
      inflammationScore: 15,
    },
  };

  describe('generateInsights', () => {
    it('should generate insights from complete data bundle', () => {
      const result = generateInsights(baseDataBundle);

      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.totalGenerated).toBeGreaterThan(0);
      expect(result.returnedCount).toBe(result.insights.length);
      expect(result.generationTime).toBeGreaterThanOrEqual(0);
    });

    it('should include used modules in result', () => {
      const result = generateInsights(baseDataBundle);

      expect(result.usedModules).toBeInstanceOf(Array);
      expect(result.usedModules.length).toBeGreaterThan(0);
    });

    it('should respect maxInsights option', () => {
      const result = generateInsights(baseDataBundle, { maxInsights: 2 });

      expect(result.insights.length).toBeLessThanOrEqual(2);
    });

    it('should filter by minPriorityScore', () => {
      const result = generateInsights(baseDataBundle, { minPriorityScore: 50 });

      result.insights.forEach((insight) => {
        expect(insight.priorityScore).toBeGreaterThanOrEqual(50);
      });
    });

    it('should sort insights by priority score descending', () => {
      const result = generateInsights(baseDataBundle);

      for (let i = 1; i < result.insights.length; i++) {
        expect(result.insights[i - 1].priorityScore).toBeGreaterThanOrEqual(
          result.insights[i].priorityScore
        );
      }
    });

    it('should include only specified categories when includeCategories is set', () => {
      const result = generateInsights(baseDataBundle, {
        includeCategories: ['color_match', 'skin_care'],
      });

      result.insights.forEach((insight) => {
        expect(['color_match', 'skin_care']).toContain(insight.category);
      });
    });

    it('should exclude specified categories when excludeCategories is set', () => {
      const result = generateInsights(baseDataBundle, {
        excludeCategories: ['synergy'],
      });

      result.insights.forEach((insight) => {
        expect(insight.category).not.toBe('synergy');
      });
    });

    it('should generate Korean content by default', () => {
      const result = generateInsights(baseDataBundle);

      // 한국어 타이틀 확인
      const hasKorean = result.insights.some(
        (insight) =>
          /[가-힣]/.test(insight.title) || /[가-힣]/.test(insight.description)
      );
      expect(hasKorean).toBe(true);
    });

    it('should generate English content when language is en', () => {
      const result = generateInsights(baseDataBundle, { language: 'en' });

      // 영어 타이틀 확인 (한글 없음)
      result.insights.forEach((insight) => {
        expect(/[가-힣]/.test(insight.title)).toBe(false);
      });
    });

    it('should return empty insights for empty data bundle', () => {
      const result = generateInsights({});

      expect(result.insights).toHaveLength(0);
      expect(result.totalGenerated).toBe(0);
    });
  });

  describe('Color Match Insight', () => {
    it('should generate color match insight when personalColor and skin exist', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: {
          season: 'spring',
          undertone: 'warm',
          confidence: 85,
          colorPalette: ['#FFD700', '#FF6347'],
        },
        skin: { skinType: 'combination' },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['color_match'],
      });

      expect(result.insights.length).toBe(1);
      expect(result.insights[0].category).toBe('color_match');
      expect(result.insights[0].relatedModules).toContain('personal_color');
      expect(result.insights[0].relatedModules).toContain('skin');
    });

    it('should not generate color match insight without personalColor', () => {
      const bundle: AnalysisDataBundle = {
        skin: { skinType: 'combination' },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['color_match'],
      });

      expect(result.insights).toHaveLength(0);
    });

    it('should include recommended colors from personal color palette', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: {
          season: 'spring',
          undertone: 'warm',
          confidence: 85,
          colorPalette: ['#FFD700', '#FF6347', '#32CD32', '#FF4500', '#ADFF2F', '#FFA500'],
        },
        skin: { skinType: 'normal' },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['color_match'],
      });

      const insight = result.insights[0];
      if ('recommendedColors' in insight) {
        expect(insight.recommendedColors?.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Skin Care Insight', () => {
    it('should generate skin care insight when skin data exists', () => {
      const bundle: AnalysisDataBundle = {
        skin: { skinType: 'oily', concerns: ['acne', 'enlarged_pores'] },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['skin_care'],
      });

      expect(result.insights.length).toBe(1);
      expect(result.insights[0].category).toBe('skin_care');
    });

    it('should include skin concerns in insight', () => {
      const bundle: AnalysisDataBundle = {
        skin: { skinType: 'dry', concerns: ['dehydration', 'fine_lines'] },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['skin_care'],
      });

      const insight = result.insights[0];
      if ('skinConcerns' in insight) {
        expect(insight.skinConcerns).toEqual(['dehydration', 'fine_lines']);
      }
    });

    it('should generate appropriate description for each skin type', () => {
      const skinTypes = ['dry', 'oily', 'combination', 'sensitive', 'normal'];

      skinTypes.forEach((skinType) => {
        const bundle: AnalysisDataBundle = {
          skin: { skinType },
        };

        const result = generateInsights(bundle, {
          includeCategories: ['skin_care'],
          language: 'ko',
        });

        expect(result.insights.length).toBe(1);
        expect(result.insights[0].description).toBeTruthy();
      });
    });
  });

  describe('Style Tip Insight', () => {
    it('should generate style tip insight when personalColor and body exist', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: { season: 'autumn', undertone: 'warm', confidence: 80 },
        body: { bodyType: 'rectangle' },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['style_tip'],
      });

      expect(result.insights.length).toBe(1);
      expect(result.insights[0].category).toBe('style_tip');
    });

    it('should include body type in insight', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: { season: 'winter', undertone: 'cool', confidence: 90 },
        body: { bodyType: 'pear' },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['style_tip'],
      });

      const insight = result.insights[0];
      if ('bodyType' in insight) {
        expect(insight.bodyType).toBe('pear');
      }
    });
  });

  describe('Health Alert Insight', () => {
    it('should generate health alert for oral health data', () => {
      const bundle: AnalysisDataBundle = {
        oralHealth: {
          gumHealthStatus: 'warning',
          inflammationScore: 30,
        },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['health_alert'],
      });

      expect(result.insights.length).toBe(1);
      expect(result.insights[0].category).toBe('health_alert');
    });

    it('should set urgent severity for high inflammation score', () => {
      const bundle: AnalysisDataBundle = {
        oralHealth: {
          gumHealthStatus: 'concern',
          inflammationScore: 70,
        },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['health_alert'],
      });

      const insight = result.insights[0];
      if ('severity' in insight) {
        expect(insight.severity).toBe('urgent');
      }
    });

    it('should set warning severity for moderate inflammation score', () => {
      const bundle: AnalysisDataBundle = {
        oralHealth: {
          gumHealthStatus: 'moderate',
          inflammationScore: 40,
        },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['health_alert'],
      });

      const insight = result.insights[0];
      if ('severity' in insight) {
        expect(insight.severity).toBe('warning');
      }
    });

    it('should set info severity for low inflammation score', () => {
      const bundle: AnalysisDataBundle = {
        oralHealth: {
          gumHealthStatus: 'healthy',
          inflammationScore: 10,
        },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['health_alert'],
      });

      const insight = result.insights[0];
      if ('severity' in insight) {
        expect(insight.severity).toBe('info');
      }
    });
  });

  describe('Synergy Insight', () => {
    it('should generate synergy insight when 3+ modules exist', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: { season: 'summer', undertone: 'cool', confidence: 85 },
        skin: { skinType: 'normal' },
        body: { bodyType: 'hourglass' },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['synergy'],
      });

      expect(result.insights.length).toBe(1);
      expect(result.insights[0].category).toBe('synergy');
    });

    it('should not generate synergy insight for less than 3 modules', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: { season: 'summer', undertone: 'cool', confidence: 85 },
        skin: { skinType: 'normal' },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['synergy'],
      });

      expect(result.insights).toHaveLength(0);
    });

    it('should calculate correct synergy score', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: { season: 'summer', undertone: 'cool', confidence: 85 },
        skin: { skinType: 'normal' },
        body: { bodyType: 'hourglass' },
        face: { faceShape: 'oval' },
        hair: { hairType: 'wavy' },
        oralHealth: { gumHealthStatus: 'healthy' },
      };

      const result = generateInsights(bundle, {
        includeCategories: ['synergy'],
      });

      const insight = result.insights[0];
      if ('synergyScore' in insight) {
        expect(insight.synergyScore).toBe(100); // 6/6 = 100%
      }
    });
  });

  describe('generateInsightsByCategory', () => {
    it('should return only insights of specified category', () => {
      const insights = generateInsightsByCategory(baseDataBundle, 'skin_care');

      insights.forEach((insight) => {
        expect(insight.category).toBe('skin_care');
      });
    });

    it('should return empty array for category without data', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: { season: 'spring', undertone: 'warm', confidence: 85 },
      };

      const insights = generateInsightsByCategory(bundle, 'health_alert');

      expect(insights).toHaveLength(0);
    });
  });

  describe('generateInsightsForModule', () => {
    it('should return only insights related to specified module', () => {
      const insights = generateInsightsForModule(baseDataBundle, 'personal_color');

      insights.forEach((insight) => {
        expect(insight.relatedModules).toContain('personal_color');
      });
    });

    it('should return skin-related insights for skin module', () => {
      const insights = generateInsightsForModule(baseDataBundle, 'skin');

      expect(insights.length).toBeGreaterThan(0);
      insights.forEach((insight) => {
        expect(insight.relatedModules).toContain('skin');
      });
    });

    it('should return empty array for module without data', () => {
      const bundle: AnalysisDataBundle = {
        personalColor: { season: 'spring', undertone: 'warm', confidence: 85 },
      };

      const insights = generateInsightsForModule(bundle, 'oral_health');

      expect(insights).toHaveLength(0);
    });
  });

  describe('Insight Structure', () => {
    it('should generate valid insight IDs', () => {
      const result = generateInsights(baseDataBundle);

      result.insights.forEach((insight) => {
        expect(insight.id).toMatch(/^insight_\d+_[a-z0-9]+$/);
      });
    });

    it('should generate valid ISO timestamps', () => {
      const result = generateInsights(baseDataBundle);

      result.insights.forEach((insight) => {
        expect(() => new Date(insight.createdAt)).not.toThrow();
        expect(new Date(insight.createdAt).toISOString()).toBe(insight.createdAt);
      });
    });

    it('should always have required fields', () => {
      const result = generateInsights(baseDataBundle);

      result.insights.forEach((insight) => {
        expect(insight.id).toBeDefined();
        expect(insight.category).toBeDefined();
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.relatedModules).toBeDefined();
        expect(insight.priority).toBeDefined();
        expect(insight.priorityScore).toBeDefined();
        expect(insight.createdAt).toBeDefined();
      });
    });
  });
});
