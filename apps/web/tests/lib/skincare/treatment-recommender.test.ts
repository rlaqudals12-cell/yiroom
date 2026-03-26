import { describe, it, expect } from 'vitest';
import {
  recommendTreatments,
  extractTreatmentConcerns,
  TREATMENT_DISCLAIMER,
} from '@/lib/skincare/treatment-recommender';

describe('treatment-recommender', () => {
  describe('extractTreatmentConcerns', () => {
    it('점수 40 이하인 지표만 추출한다', () => {
      const metrics = [
        { id: 'hydration', value: 35 },
        { id: 'oil', value: 60 },
        { id: 'pores', value: 25 },
        { id: 'wrinkles', value: 70 },
      ];
      const concerns = extractTreatmentConcerns(metrics);
      expect(concerns).toEqual(['hydration', 'pores']);
    });

    it('모든 지표가 41+ 이면 빈 배열', () => {
      const metrics = [
        { id: 'hydration', value: 75 },
        { id: 'oil', value: 60 },
      ];
      expect(extractTreatmentConcerns(metrics)).toEqual([]);
    });

    it('빈 배열 입력 시 빈 배열 반환', () => {
      expect(extractTreatmentConcerns([])).toEqual([]);
    });
  });

  describe('recommendTreatments', () => {
    it('고민 없으면 빈 배열 반환', () => {
      expect(recommendTreatments([])).toEqual([]);
    });

    it('색소침착 고민에 IPL/필링을 추천한다', () => {
      const results = recommendTreatments(['pigmentation']);
      const names = results.map((r) => r.treatment.id);
      expect(names).toContain('ipl');
      expect(names).toContain('chemical-peel');
    });

    it('주름 고민에 프락셔널/보톡스를 추천한다', () => {
      const results = recommendTreatments(['wrinkles']);
      const names = results.map((r) => r.treatment.id);
      expect(names).toContain('fractional-laser');
      expect(names).toContain('botox');
    });

    it('건조 고민에 스킨부스터를 추천한다', () => {
      const results = recommendTreatments(['dryness']);
      const names = results.map((r) => r.treatment.id);
      expect(names).toContain('skin-booster');
    });

    it('민감성 높으면 주사 시술 점수 낮아짐', () => {
      const normal = recommendTreatments(['wrinkles'], 'normal', 'low');
      const sensitive = recommendTreatments(['wrinkles'], 'sensitive', 'high');

      const normalBotox = normal.find((r) => r.treatment.id === 'botox');
      const sensitiveBotox = sensitive.find((r) => r.treatment.id === 'botox');

      expect(sensitiveBotox!.matchScore).toBeLessThan(normalBotox!.matchScore);
    });

    it('건성 피부면 필링 점수 낮아짐', () => {
      const normal = recommendTreatments(['pigmentation'], 'normal');
      const dry = recommendTreatments(['pigmentation'], 'dry');

      const normalPeel = normal.find((r) => r.treatment.id === 'chemical-peel');
      const dryPeel = dry.find((r) => r.treatment.id === 'chemical-peel');

      expect(dryPeel!.matchScore).toBeLessThan(normalPeel!.matchScore);
    });

    it('모든 추천에 면책 고지가 포함된다', () => {
      const results = recommendTreatments(['pigmentation', 'wrinkles']);
      for (const r of results) {
        expect(r.disclaimer).toBe(TREATMENT_DISCLAIMER.ko);
      }
    });

    it('매칭 점수 내림차순 정렬', () => {
      const results = recommendTreatments(['pigmentation', 'wrinkles', 'pores']);
      for (let i = 1; i < results.length; i++) {
        expect(results[i].matchScore).toBeLessThanOrEqual(results[i - 1].matchScore);
      }
    });
  });
});
