/**
 * PC-1 퍼스널 컬러 Mock 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockPersonalColorResult,
  calculateSeasonType,
  SEASON_INFO,
  BEST_COLORS,
  WORST_COLORS,
  LIPSTICK_RECOMMENDATIONS,
  STYLE_DESCRIPTIONS,
  ONBOARDING_QUESTIONS,
  getSeasonColor,
  getSeasonBgColor,
  getSeasonLightBgColor,
  getSeasonBorderColor,
  type SeasonType,
  type QuestionnaireAnswer,
} from '@/lib/mock/personal-color';

describe('PC-1 퍼스널 컬러 Mock', () => {
  describe('generateMockPersonalColorResult', () => {
    it('응답 없이 호출하면 랜덤 결과를 반환한다', () => {
      const result = generateMockPersonalColorResult();

      expect(result).toBeDefined();
      expect(result.seasonType).toBeDefined();
      expect(['spring', 'summer', 'autumn', 'winter']).toContain(result.seasonType);
      expect(result.seasonLabel).toBeDefined();
      expect(result.seasonDescription).toBeDefined();
      expect(result.tone).toBeDefined();
      expect(['warm', 'cool']).toContain(result.tone);
      expect(result.depth).toBeDefined();
      expect(['light', 'deep']).toContain(result.depth);
    });

    it('confidence는 85~95% 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockPersonalColorResult();
        expect(result.confidence).toBeGreaterThanOrEqual(85);
        expect(result.confidence).toBeLessThanOrEqual(95);
      }
    });

    it('베스트 컬러 10개를 반환한다', () => {
      const result = generateMockPersonalColorResult();
      expect(result.bestColors).toHaveLength(10);
      result.bestColors.forEach((color) => {
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(color.name).toBeDefined();
      });
    });

    it('워스트 컬러 5개를 반환한다', () => {
      const result = generateMockPersonalColorResult();
      expect(result.worstColors).toHaveLength(5);
    });

    it('립스틱 추천 3개를 반환한다', () => {
      const result = generateMockPersonalColorResult();
      expect(result.lipstickRecommendations).toHaveLength(3);
      result.lipstickRecommendations.forEach((rec) => {
        expect(rec.colorName).toBeDefined();
        expect(rec.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('의류 추천 3개를 반환한다', () => {
      const result = generateMockPersonalColorResult();
      expect(result.clothingRecommendations).toHaveLength(3);
      result.clothingRecommendations.forEach((rec) => {
        expect(rec.item).toBeDefined();
        expect(rec.colorSuggestion).toBeDefined();
        expect(rec.reason).toBeDefined();
      });
    });

    it('스타일 설명을 반환한다', () => {
      const result = generateMockPersonalColorResult();
      expect(result.styleDescription).toBeDefined();
      expect(result.styleDescription.imageKeywords).toBeDefined();
      expect(result.styleDescription.makeupStyle).toBeDefined();
      expect(result.styleDescription.fashionStyle).toBeDefined();
      expect(result.styleDescription.accessories).toBeDefined();
    });

    it('인사이트를 반환한다', () => {
      const result = generateMockPersonalColorResult();
      expect(result.insight).toBeDefined();
      expect(typeof result.insight).toBe('string');
      expect(result.insight.length).toBeGreaterThan(0);
    });

    it('분석 시간을 반환한다', () => {
      const result = generateMockPersonalColorResult();
      expect(result.analyzedAt).toBeInstanceOf(Date);
    });
  });

  describe('calculateSeasonType', () => {
    it('웜톤 + 라이트 응답은 봄(spring)을 반환한다', () => {
      const answers: QuestionnaireAnswer[] = [
        { questionId: 'vein_color', optionId: 'green' }, // warm
        { questionId: 'jewelry', optionId: 'gold' }, // warm
        { questionId: 'skin_tone', optionId: 'ivory' }, // light
      ];

      const result = calculateSeasonType(answers);
      expect(result.seasonType).toBe('spring');
      expect(result.tone).toBe('warm');
      expect(result.depth).toBe('light');
    });

    it('쿨톤 + 라이트 응답은 여름(summer)을 반환한다', () => {
      const answers: QuestionnaireAnswer[] = [
        { questionId: 'vein_color', optionId: 'blue' }, // cool
        { questionId: 'jewelry', optionId: 'silver' }, // cool
        { questionId: 'skin_tone', optionId: 'pink' }, // cool + light
      ];

      const result = calculateSeasonType(answers);
      expect(result.seasonType).toBe('summer');
      expect(result.tone).toBe('cool');
      expect(result.depth).toBe('light');
    });

    it('웜톤 + 딥 응답은 가을(autumn)을 반환한다', () => {
      const answers: QuestionnaireAnswer[] = [
        { questionId: 'vein_color', optionId: 'green' }, // warm
        { questionId: 'jewelry', optionId: 'gold' }, // warm
        { questionId: 'skin_tone', optionId: 'olive' }, // warm + deep
        { questionId: 'sun_reaction', optionId: 'tan_easy' }, // warm + deep
      ];

      const result = calculateSeasonType(answers);
      expect(result.seasonType).toBe('autumn');
      expect(result.tone).toBe('warm');
      expect(result.depth).toBe('deep');
    });

    it('쿨톤 + 딥 응답은 겨울(winter)을 반환한다', () => {
      const answers: QuestionnaireAnswer[] = [
        { questionId: 'vein_color', optionId: 'blue' }, // cool
        { questionId: 'jewelry', optionId: 'silver' }, // cool
        { questionId: 'hair_color', optionId: 'black' }, // cool + deep
        { questionId: 'lip_color', optionId: 'berry' }, // cool + deep
      ];

      const result = calculateSeasonType(answers);
      expect(result.seasonType).toBe('winter');
      expect(result.tone).toBe('cool');
      expect(result.depth).toBe('deep');
    });

    it('skip 옵션은 점수에 반영되지 않는다', () => {
      const answers: QuestionnaireAnswer[] = [
        { questionId: 'vein_color', optionId: 'mixed' }, // skip
        { questionId: 'jewelry', optionId: 'both' }, // skip
        { questionId: 'blush', optionId: 'unsure' }, // skip
      ];

      const result = calculateSeasonType(answers);
      // skip만 있으면 기본값 (warm + light = spring)
      expect(result.confidence).toBeGreaterThanOrEqual(85);
    });

    it('문진 응답으로 결과 생성 시 해당 계절 타입이 반영된다', () => {
      const answers: QuestionnaireAnswer[] = [
        { questionId: 'vein_color', optionId: 'blue' },
        { questionId: 'jewelry', optionId: 'silver' },
      ];

      const result = generateMockPersonalColorResult(answers);
      expect(result.tone).toBe('cool');
    });
  });

  describe('상수 데이터 검증', () => {
    it('SEASON_INFO에 4계절이 모두 정의되어 있다', () => {
      const seasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];
      seasons.forEach((season) => {
        expect(SEASON_INFO[season]).toBeDefined();
        expect(SEASON_INFO[season].label).toBeDefined();
        expect(SEASON_INFO[season].emoji).toBeDefined();
        expect(SEASON_INFO[season].description).toBeDefined();
        expect(SEASON_INFO[season].characteristics).toBeDefined();
        expect(SEASON_INFO[season].percentage).toBeGreaterThan(0);
      });
    });

    it('BEST_COLORS에 4계절 모두 10개씩 컬러가 있다', () => {
      const seasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];
      seasons.forEach((season) => {
        expect(BEST_COLORS[season]).toHaveLength(10);
      });
    });

    it('WORST_COLORS에 4계절 모두 5개씩 컬러가 있다', () => {
      const seasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];
      seasons.forEach((season) => {
        expect(WORST_COLORS[season]).toHaveLength(5);
      });
    });

    it('LIPSTICK_RECOMMENDATIONS에 4계절 모두 3개씩 추천이 있다', () => {
      const seasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];
      seasons.forEach((season) => {
        expect(LIPSTICK_RECOMMENDATIONS[season]).toHaveLength(3);
      });
    });

    it('STYLE_DESCRIPTIONS에 4계절 모두 스타일 설명이 있다', () => {
      const seasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];
      seasons.forEach((season) => {
        expect(STYLE_DESCRIPTIONS[season]).toBeDefined();
        expect(STYLE_DESCRIPTIONS[season].imageKeywords.length).toBeGreaterThan(0);
        expect(STYLE_DESCRIPTIONS[season].makeupStyle).toBeDefined();
        expect(STYLE_DESCRIPTIONS[season].fashionStyle).toBeDefined();
        expect(STYLE_DESCRIPTIONS[season].accessories).toBeDefined();
      });
    });

    it('ONBOARDING_QUESTIONS에 10개 질문이 있다', () => {
      expect(ONBOARDING_QUESTIONS).toHaveLength(10);
      ONBOARDING_QUESTIONS.forEach((q, index) => {
        expect(q.number).toBe(index + 1);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('유틸리티 함수', () => {
    it('getSeasonColor는 올바른 CSS 클래스를 반환한다', () => {
      expect(getSeasonColor('spring')).toBe('text-pink-500');
      expect(getSeasonColor('summer')).toBe('text-blue-500');
      expect(getSeasonColor('autumn')).toBe('text-orange-600');
      expect(getSeasonColor('winter')).toBe('text-purple-600');
    });

    it('getSeasonBgColor는 올바른 CSS 클래스를 반환한다', () => {
      expect(getSeasonBgColor('spring')).toBe('bg-pink-500');
      expect(getSeasonBgColor('summer')).toBe('bg-blue-500');
      expect(getSeasonBgColor('autumn')).toBe('bg-orange-600');
      expect(getSeasonBgColor('winter')).toBe('bg-purple-600');
    });

    it('getSeasonLightBgColor는 올바른 CSS 클래스를 반환한다', () => {
      expect(getSeasonLightBgColor('spring')).toBe('bg-pink-50');
      expect(getSeasonLightBgColor('summer')).toBe('bg-blue-50');
      expect(getSeasonLightBgColor('autumn')).toBe('bg-orange-50');
      expect(getSeasonLightBgColor('winter')).toBe('bg-purple-50');
    });

    it('getSeasonBorderColor는 올바른 CSS 클래스를 반환한다', () => {
      expect(getSeasonBorderColor('spring')).toBe('border-pink-200');
      expect(getSeasonBorderColor('summer')).toBe('border-blue-200');
      expect(getSeasonBorderColor('autumn')).toBe('border-orange-200');
      expect(getSeasonBorderColor('winter')).toBe('border-purple-200');
    });
  });
});
