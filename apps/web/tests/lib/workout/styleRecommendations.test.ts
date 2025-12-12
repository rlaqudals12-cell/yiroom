import { describe, it, expect } from 'vitest';
import {
  getWorkoutStyleRecommendation,
  getPersonalColorLabel,
  getPersonalColorEmoji,
  getPersonalColorTheme,
  PC_COLORS,
  PC_AVOID_COLORS,
  BODY_TYPE_FITS,
  PC_ACCESSORIES,
  PC_AMBIENT,
  STYLE_TIPS,
} from '@/lib/workout/styleRecommendations';
import type { PersonalColorSeason, BodyType } from '@/types/workout';

describe('styleRecommendations', () => {
  describe('getWorkoutStyleRecommendation', () => {
    const personalColors: PersonalColorSeason[] = ['Spring', 'Summer', 'Autumn', 'Winter'];
    const bodyTypes: BodyType[] = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'];

    it.each(personalColors)('PC타입 %s에 대한 추천을 반환한다', (pc) => {
      const result = getWorkoutStyleRecommendation(pc, null);

      expect(result.personalColor).toBe(pc);
      expect(result.bodyType).toBeNull();
      expect(result.recommendedColors).toEqual(PC_COLORS[pc]);
      expect(result.avoidColors).toEqual(PC_AVOID_COLORS[pc]);
      expect(result.accessories).toEqual(PC_ACCESSORIES[pc]);
      expect(result.ambient).toEqual(PC_AMBIENT[pc]);
      expect(result.fitRecommendation).toBeNull();
      expect(STYLE_TIPS[pc]).toContain(result.styleTip);
    });

    it.each(bodyTypes)('체형 %s에 대한 핏 추천을 반환한다', (bodyType) => {
      const result = getWorkoutStyleRecommendation('Spring', bodyType);

      expect(result.bodyType).toBe(bodyType);
      expect(result.fitRecommendation).toEqual(BODY_TYPE_FITS[bodyType]);
      expect(result.fitRecommendation?.top).toBeDefined();
      expect(result.fitRecommendation?.bottom).toBeDefined();
      expect(result.fitRecommendation?.avoid).toBeDefined();
    });

    it('PC와 체형 모두 조합해서 반환한다', () => {
      const result = getWorkoutStyleRecommendation('Summer', 'X');

      expect(result.personalColor).toBe('Summer');
      expect(result.bodyType).toBe('X');
      expect(result.recommendedColors).toEqual(PC_COLORS['Summer']);
      expect(result.fitRecommendation).toEqual(BODY_TYPE_FITS['X']);
    });
  });

  describe('getPersonalColorLabel', () => {
    it('봄 웜톤 라벨을 반환한다', () => {
      expect(getPersonalColorLabel('Spring')).toBe('봄 웜톤');
    });

    it('여름 쿨톤 라벨을 반환한다', () => {
      expect(getPersonalColorLabel('Summer')).toBe('여름 쿨톤');
    });

    it('가을 웜톤 라벨을 반환한다', () => {
      expect(getPersonalColorLabel('Autumn')).toBe('가을 웜톤');
    });

    it('겨울 쿨톤 라벨을 반환한다', () => {
      expect(getPersonalColorLabel('Winter')).toBe('겨울 쿨톤');
    });
  });

  describe('getPersonalColorEmoji', () => {
    it('각 PC 타입에 맞는 이모지를 반환한다', () => {
      expect(getPersonalColorEmoji('Spring')).toBe('🌸');
      expect(getPersonalColorEmoji('Summer')).toBe('🌊');
      expect(getPersonalColorEmoji('Autumn')).toBe('🍂');
      expect(getPersonalColorEmoji('Winter')).toBe('❄️');
    });
  });

  describe('getPersonalColorTheme', () => {
    it('Spring 테마를 반환한다', () => {
      const theme = getPersonalColorTheme('Spring');
      expect(theme.bg).toBe('bg-pink-500');
      expect(theme.bgLight).toBe('bg-pink-50');
      expect(theme.text).toBe('text-pink-600');
      expect(theme.border).toBe('border-pink-200');
    });

    it('Summer 테마를 반환한다', () => {
      const theme = getPersonalColorTheme('Summer');
      expect(theme.bg).toBe('bg-blue-500');
      expect(theme.text).toBe('text-blue-600');
    });

    it('Autumn 테마를 반환한다', () => {
      const theme = getPersonalColorTheme('Autumn');
      expect(theme.bg).toBe('bg-orange-500');
      expect(theme.text).toBe('text-orange-600');
    });

    it('Winter 테마를 반환한다', () => {
      const theme = getPersonalColorTheme('Winter');
      expect(theme.bg).toBe('bg-purple-500');
      expect(theme.text).toBe('text-purple-600');
    });
  });

  describe('PC_COLORS 상수', () => {
    it('각 PC 타입에 5개의 추천 색상이 있다', () => {
      expect(PC_COLORS['Spring'].length).toBe(5);
      expect(PC_COLORS['Summer'].length).toBe(5);
      expect(PC_COLORS['Autumn'].length).toBe(5);
      expect(PC_COLORS['Winter'].length).toBe(5);
    });

    it('각 색상에 hex와 name이 있다', () => {
      PC_COLORS['Spring'].forEach((color) => {
        expect(color.hex).toMatch(/^#[0-9A-F]{6}$/i);
        expect(color.name).toBeDefined();
      });
    });
  });

  describe('PC_AVOID_COLORS 상수', () => {
    it('각 PC 타입에 3개의 피해야 할 색상이 있다', () => {
      expect(PC_AVOID_COLORS['Spring'].length).toBe(3);
      expect(PC_AVOID_COLORS['Summer'].length).toBe(3);
      expect(PC_AVOID_COLORS['Autumn'].length).toBe(3);
      expect(PC_AVOID_COLORS['Winter'].length).toBe(3);
    });
  });

  describe('BODY_TYPE_FITS 상수', () => {
    const bodyTypes: BodyType[] = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'];

    it.each(bodyTypes)('체형 %s에 대한 핏 추천이 있다', (bodyType) => {
      const fit = BODY_TYPE_FITS[bodyType];
      expect(fit.top).toBeDefined();
      expect(fit.bottom).toBeDefined();
      expect(fit.avoid).toBeDefined();
      expect(fit.avoid.length).toBeGreaterThan(0);
    });
  });

  describe('PC_ACCESSORIES 상수', () => {
    it('각 PC 타입에 4개의 소품 추천이 있다', () => {
      expect(PC_ACCESSORIES['Spring'].length).toBe(4);
      expect(PC_ACCESSORIES['Summer'].length).toBe(4);
      expect(PC_ACCESSORIES['Autumn'].length).toBe(4);
      expect(PC_ACCESSORIES['Winter'].length).toBe(4);
    });

    it('각 소품에 item, colorName, hex가 있다', () => {
      PC_ACCESSORIES['Spring'].forEach((accessory) => {
        expect(accessory.item).toBeDefined();
        expect(accessory.colorName).toBeDefined();
        expect(accessory.hex).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('PC_AMBIENT 상수', () => {
    it('각 PC 타입에 분위기 추천이 있다', () => {
      expect(PC_AMBIENT['Spring'].environment).toBeDefined();
      expect(PC_AMBIENT['Spring'].activities.length).toBeGreaterThan(0);
      expect(PC_AMBIENT['Spring'].mood).toBeDefined();

      expect(PC_AMBIENT['Winter'].environment).toBeDefined();
      expect(PC_AMBIENT['Winter'].activities).toContain('웨이트 트레이닝');
    });
  });

  describe('STYLE_TIPS 상수', () => {
    it('각 PC 타입에 3개의 스타일 팁이 있다', () => {
      expect(STYLE_TIPS['Spring'].length).toBe(3);
      expect(STYLE_TIPS['Summer'].length).toBe(3);
      expect(STYLE_TIPS['Autumn'].length).toBe(3);
      expect(STYLE_TIPS['Winter'].length).toBe(3);
    });
  });
});
