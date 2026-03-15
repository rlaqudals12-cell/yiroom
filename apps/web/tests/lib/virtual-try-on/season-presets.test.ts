import { describe, it, expect } from 'vitest';
import {
  getLipPresetsForSeason,
  getBlushPresetsForSeason,
  getEyeshadowPresetsForSeason,
  getHairPresetsForSeason,
  getFoundationPresetsForSeason,
  getDefaultColorForSeason,
  SEASON_LABELS,
} from '@/lib/virtual-try-on/season-presets';
import type { PersonalColorSeason } from '@/lib/virtual-try-on/season-presets';
import {
  LIP_PRESETS,
  BLUSH_PRESETS,
  EYESHADOW_PRESETS,
  HAIR_PRESETS,
  FOUNDATION_PRESETS,
} from '@/lib/virtual-try-on/types';

const ALL_SEASONS: PersonalColorSeason[] = ['spring', 'summer', 'autumn', 'winter'];

describe('Season Presets - 시즌별 프리셋 매핑', () => {
  describe('getLipPresetsForSeason', () => {
    it('모든 시즌에서 전체 립 프리셋 반환 (추천 표시 포함)', () => {
      for (const season of ALL_SEASONS) {
        const result = getLipPresetsForSeason(season);
        expect(result.length).toBe(LIP_PRESETS.length);
        // 각 항목에 preset과 isRecommended 존재
        for (const item of result) {
          expect(item).toHaveProperty('preset');
          expect(item).toHaveProperty('isRecommended');
        }
      }
    });

    it('봄 웜톤: 코랄/피치/오렌지 추천', () => {
      const result = getLipPresetsForSeason('spring');
      const recommended = result.filter((r) => r.isRecommended);
      expect(recommended.length).toBeGreaterThanOrEqual(3);

      const names = recommended.map((r) => r.preset.name);
      expect(names).toContain('코랄 핑크');
      expect(names).toContain('피치');
      expect(names).toContain('오렌지');
    });

    it('겨울 쿨톤: 레드/베리/플럼 추천', () => {
      const result = getLipPresetsForSeason('winter');
      const recommended = result.filter((r) => r.isRecommended);

      const names = recommended.map((r) => r.preset.name);
      expect(names).toContain('레드');
      expect(names).toContain('베리');
      expect(names).toContain('플럼');
    });

    it('추천 프리셋이 배열 앞쪽에 정렬됨', () => {
      for (const season of ALL_SEASONS) {
        const result = getLipPresetsForSeason(season);
        const firstNonRecommendedIdx = result.findIndex((r) => !r.isRecommended);
        if (firstNonRecommendedIdx === -1) continue; // 전부 추천이면 스킵

        // 추천이 아닌 첫 항목 이후에는 추천 항목 없어야 함
        const afterNonRecommended = result.slice(firstNonRecommendedIdx);
        const hasRecommendedAfter = afterNonRecommended.some((r) => r.isRecommended);
        expect(hasRecommendedAfter).toBe(false);
      }
    });
  });

  describe('getBlushPresetsForSeason', () => {
    it('모든 시즌에서 전체 블러셔 프리셋 반환', () => {
      for (const season of ALL_SEASONS) {
        const result = getBlushPresetsForSeason(season);
        expect(result.length).toBe(BLUSH_PRESETS.length);
      }
    });

    it('봄: 피치/코랄 추천', () => {
      const result = getBlushPresetsForSeason('spring');
      const names = result.filter((r) => r.isRecommended).map((r) => r.preset.name);
      expect(names).toContain('피치');
      expect(names).toContain('코랄');
    });
  });

  describe('getEyeshadowPresetsForSeason', () => {
    it('모든 시즌에서 전체 아이섀도 프리셋 반환', () => {
      for (const season of ALL_SEASONS) {
        const result = getEyeshadowPresetsForSeason(season);
        expect(result.length).toBe(EYESHADOW_PRESETS.length);
      }
    });

    it('가을: 테라코타/모카/올리브 추천', () => {
      const result = getEyeshadowPresetsForSeason('autumn');
      const names = result.filter((r) => r.isRecommended).map((r) => r.preset.name);
      expect(names).toContain('테라코타');
      expect(names).toContain('모카');
      expect(names).toContain('올리브');
    });
  });

  describe('getHairPresetsForSeason', () => {
    it('모든 시즌에서 전체 헤어 프리셋 반환', () => {
      for (const season of ALL_SEASONS) {
        const result = getHairPresetsForSeason(season);
        expect(result.length).toBe(HAIR_PRESETS.length);
      }
    });

    it('여름: 애쉬그레이/플래티넘 추천', () => {
      const result = getHairPresetsForSeason('summer');
      const names = result.filter((r) => r.isRecommended).map((r) => r.preset.name);
      expect(names).toContain('애쉬그레이');
      expect(names).toContain('플래티넘');
    });
  });

  describe('getFoundationPresetsForSeason', () => {
    it('모든 시즌에서 전체 파운데이션 프리셋 반환', () => {
      for (const season of ALL_SEASONS) {
        const result = getFoundationPresetsForSeason(season);
        expect(result.length).toBe(FOUNDATION_PRESETS.length);
      }
    });

    it('봄/가을(웜): warm/neutral undertone 추천', () => {
      for (const season of ['spring', 'autumn'] as PersonalColorSeason[]) {
        const result = getFoundationPresetsForSeason(season);
        const recommended = result.filter((r) => r.isRecommended);
        for (const item of recommended) {
          expect(['warm', 'neutral']).toContain(item.preset.undertone);
        }
      }
    });

    it('여름/겨울(쿨): cool/neutral undertone 추천', () => {
      for (const season of ['summer', 'winter'] as PersonalColorSeason[]) {
        const result = getFoundationPresetsForSeason(season);
        const recommended = result.filter((r) => r.isRecommended);
        for (const item of recommended) {
          expect(['cool', 'neutral']).toContain(item.preset.undertone);
        }
      }
    });
  });

  describe('getDefaultColorForSeason', () => {
    it('모든 시즌/탭 조합에서 유효한 RGBA 색상 반환', () => {
      const tabs = ['lip', 'blush', 'eyeshadow', 'hair-color', 'foundation'] as const;

      for (const season of ALL_SEASONS) {
        for (const tabVal of tabs) {
          const color = getDefaultColorForSeason(season, tabVal);
          expect(color).toHaveProperty('r');
          expect(color).toHaveProperty('g');
          expect(color).toHaveProperty('b');
          expect(color).toHaveProperty('a');
          expect(color.r).toBeGreaterThanOrEqual(0);
          expect(color.r).toBeLessThanOrEqual(255);
        }
      }
    });

    it('시즌별로 다른 기본 색상 반환', () => {
      const springLip = getDefaultColorForSeason('spring', 'lip');
      const winterLip = getDefaultColorForSeason('winter', 'lip');

      // 봄 웜과 겨울 쿨은 같은 색일 수 없음
      const isSame =
        springLip.r === winterLip.r && springLip.g === winterLip.g && springLip.b === winterLip.b;
      expect(isSame).toBe(false);
    });
  });

  describe('SEASON_LABELS', () => {
    it('모든 시즌에 한국어 라벨 존재', () => {
      expect(SEASON_LABELS.spring).toBe('봄 웜톤');
      expect(SEASON_LABELS.summer).toBe('여름 쿨톤');
      expect(SEASON_LABELS.autumn).toBe('가을 웜톤');
      expect(SEASON_LABELS.winter).toBe('겨울 쿨톤');
    });
  });
});
