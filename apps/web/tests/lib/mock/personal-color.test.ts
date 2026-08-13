/**
 * PC-1 퍼스널 컬러 Mock 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockPersonalColorResult,
  calculateSeasonFromComparison,
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
    it('응답 없이 호출하면 시드 기반 결과를 반환한다', () => {
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

  // 재현성 계약: 같은 사용자·같은 사진이면 폴백 결과도 항상 같아야 한다.
  // (Math.random 시절엔 같은 사진 재분석마다 시즌이 널뛰었다)
  describe('폴백 결정론 (시드)', () => {
    // buildFallbackSeed(userId, axis, image)와 동일한 규약의 테스트용 시드
    const seedA = 'user_a:personal-color:1234-abc';
    const seedB = 'user_b:personal-color:1234-abc';

    it('같은 시드는 시즌·톤·깊이·confidence·인사이트까지 동일하게 재현한다', () => {
      const first = generateMockPersonalColorResult(undefined, { seed: seedA });
      const second = generateMockPersonalColorResult(undefined, { seed: seedA });

      expect(second.seasonType).toBe(first.seasonType);
      expect(second.tone).toBe(first.tone);
      expect(second.depth).toBe(first.depth);
      expect(second.confidence).toBe(first.confidence);
      expect(second.insight).toBe(first.insight);
      expect(second.easyInsight).toEqual(first.easyInsight);
    });

    it('시드를 지정하지 않아도 고정 기본 시드로 항상 같은 결과를 낸다 (난수 아님)', () => {
      const results = Array.from({ length: 5 }, () => generateMockPersonalColorResult());

      results.forEach((result) => {
        expect(result.seasonType).toBe(results[0].seasonType);
        expect(result.confidence).toBe(results[0].confidence);
        expect(result.insight).toBe(results[0].insight);
      });
    });

    it('사용자가 다르면(시드가 다르면) 결과가 고정 상수로 굳지 않는다', () => {
      const seeds = Array.from({ length: 120 }, (_, i) => `user_${i}:personal-color:img-${i}`);
      const seasons = new Set(
        seeds.map((seed) => generateMockPersonalColorResult(undefined, { seed }).seasonType)
      );

      // 4시즌이 모두 등장해야 한다 — 특정 시즌으로 상수 고정된 게 아님을 실증
      expect(seasons).toEqual(new Set(['spring', 'summer', 'autumn', 'winter']));
    });

    it('시즌 가중 분포(봄25·여름18·가을30·겨울27)를 유지한다', () => {
      const counts: Record<SeasonType, number> = { spring: 0, summer: 0, autumn: 0, winter: 0 };
      const sampleSize = 600;

      for (let i = 0; i < sampleSize; i++) {
        const result = generateMockPersonalColorResult(undefined, {
          seed: `dist_user_${i}:personal-color:img`,
        });
        counts[result.seasonType] += 1;
      }

      // 가중치가 살아있는지: 가을(30%) > 여름(18%) — 12%p 격차라 표본 600에서 안정적
      expect(counts.autumn).toBeGreaterThan(counts.summer);
      // 각 시즌이 명목 비율 ±10%p 이내
      expect(counts.spring / sampleSize).toBeCloseTo(0.25, 1);
      expect(counts.summer / sampleSize).toBeCloseTo(0.18, 1);
      expect(counts.autumn / sampleSize).toBeCloseTo(0.3, 1);
      expect(counts.winter / sampleSize).toBeCloseTo(0.27, 1);
    });

    it('시드마다 confidence는 85~95 범위를 지킨다', () => {
      for (let i = 0; i < 50; i++) {
        const result = generateMockPersonalColorResult(undefined, {
          seed: `conf_user_${i}:personal-color:img`,
        });
        expect(result.confidence).toBeGreaterThanOrEqual(85);
        expect(result.confidence).toBeLessThanOrEqual(95);
      }
    });

    it('인사이트도 상수 고정이 아니라 시드로 갈린다', () => {
      const insights = new Set(
        Array.from({ length: 60 }, (_, i) =>
          generateMockPersonalColorResult(undefined, {
            seed: `insight_user_${i}:personal-color:img`,
          })
        ).map((result) => result.insight)
      );

      expect(insights.size).toBeGreaterThan(1);
    });

    it('같은 사진이라도 사용자가 다르면 시드가 달라 결과가 각자 재현된다', () => {
      const a1 = generateMockPersonalColorResult(undefined, { seed: seedA });
      const a2 = generateMockPersonalColorResult(undefined, { seed: seedA });
      const b1 = generateMockPersonalColorResult(undefined, { seed: seedB });
      const b2 = generateMockPersonalColorResult(undefined, { seed: seedB });

      expect(a1.seasonType).toBe(a2.seasonType);
      expect(b1.seasonType).toBe(b2.seasonType);
      expect(a1.insight).toBe(a2.insight);
      expect(b1.insight).toBe(b2.insight);
    });

    it('문진 응답 경로에서도 인사이트가 시드로 결정된다 (시즌은 응답이 결정)', () => {
      const answers: QuestionnaireAnswer[] = [
        { questionId: 'vein_color', optionId: 'blue' },
        { questionId: 'jewelry', optionId: 'silver' },
      ];

      const first = generateMockPersonalColorResult(answers, { seed: seedA });
      const second = generateMockPersonalColorResult(answers, { seed: seedA });

      expect(first.seasonType).toBe(second.seasonType);
      expect(first.insight).toBe(second.insight);
      expect(first.confidence).toBe(second.confidence);
    });
  });

  describe('calculateSeasonFromComparison', () => {
    const comparisonAnswers = [
      { setId: 'warm_cool', selectedOptionId: 'cool' },
      { setId: 'light_deep', selectedOptionId: 'deep' },
    ];

    it('같은 시드는 같은 confidence를 재현한다 (88~94)', () => {
      const seed = 'user_a:personal-color:cmp';
      const first = calculateSeasonFromComparison(comparisonAnswers, { seed });
      const second = calculateSeasonFromComparison(comparisonAnswers, { seed });

      // 시즌 판정은 응답이 결정 (쿨 + 딥 = 겨울)
      expect(first.seasonType).toBe('winter');
      expect(first.confidence).toBe(second.confidence);
      expect(first.confidence).toBeGreaterThanOrEqual(88);
      expect(first.confidence).toBeLessThanOrEqual(94);
    });

    it('시드를 지정하지 않아도 호출마다 같은 confidence를 낸다 (난수 아님)', () => {
      const values = Array.from(
        { length: 5 },
        () => calculateSeasonFromComparison(comparisonAnswers).confidence
      );

      values.forEach((value) => expect(value).toBe(values[0]));
    });

    it('시드가 다르면 confidence가 상수로 굳지 않는다', () => {
      const values = new Set(
        Array.from(
          { length: 40 },
          (_, i) =>
            calculateSeasonFromComparison(comparisonAnswers, {
              seed: `cmp_user_${i}:personal-color:img`,
            }).confidence
        )
      );

      expect(values.size).toBeGreaterThan(1);
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
