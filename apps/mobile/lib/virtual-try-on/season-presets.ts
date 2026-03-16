/**
 * VTO 프리셋 - 퍼스널컬러 시즌 매핑 (모바일)
 *
 * K-뷰티 기반 시즌별 추천 색상 매핑
 * 근거: docs/principles/color-science.md
 */

import {
  LIP_PRESETS,
  BLUSH_PRESETS,
  EYESHADOW_PRESETS,
  HAIR_PRESETS,
  FOUNDATION_PRESETS,
} from './types';
import type { RgbaColor } from './types';

/** 퍼스널컬러 시즌 타입 */
export type PersonalColorSeason = 'spring' | 'summer' | 'autumn' | 'winter';

// 시즌별 추천 프리셋 이름 매핑
const SEASON_LIP_NAMES: Record<PersonalColorSeason, string[]> = {
  spring: ['코랄 핑크', '피치', '오렌지', 'MLBB'],
  summer: ['로즈', '푸치아', '누드 핑크', 'MLBB'],
  autumn: ['브릭', '와인', '누드 핑크', 'MLBB'],
  winter: ['레드', '베리', '플럼', '와인'],
};

const SEASON_BLUSH_NAMES: Record<PersonalColorSeason, string[]> = {
  spring: ['피치', '코랄'],
  summer: ['핑크', '라벤더', '로즈'],
  autumn: ['코랄', '선번트'],
  winter: ['로즈', '핑크'],
};

const SEASON_EYESHADOW_NAMES: Record<PersonalColorSeason, string[]> = {
  spring: ['코랄 브라운', '피치 핑크', '로즈 골드'],
  summer: ['로즈 골드', '플럼', '글리터 골드'],
  autumn: ['테라코타', '모카', '올리브', '버건디'],
  winter: ['버건디', '스모키', '플럼'],
};

const SEASON_HAIR_NAMES: Record<PersonalColorSeason, string[]> = {
  spring: ['밀크브라운', '자연갈색', '핑크브라운'],
  summer: ['애쉬그레이', '플래티넘', '핑크브라운'],
  autumn: ['자연갈색', '다크브라운', '카키브라운', '버건디'],
  winter: ['블루블랙', '다크브라운', '체리레드'],
};

const SEASON_UNDERTONE: Record<PersonalColorSeason, ('warm' | 'cool' | 'neutral')[]> = {
  spring: ['warm', 'neutral'],
  summer: ['cool', 'neutral'],
  autumn: ['warm', 'neutral'],
  winter: ['cool', 'neutral'],
};

/** 시즌 추천 표시용 프리셋 */
export interface SeasonPreset<T> {
  preset: T;
  isRecommended: boolean;
}

/** 프리셋 정렬 헬퍼 */
function sortByRecommendation<T extends { name: string }>(
  presets: readonly T[],
  recommendedNames: string[]
): SeasonPreset<T>[] {
  return [...presets]
    .map((preset) => ({
      preset,
      isRecommended: recommendedNames.includes(preset.name),
    }))
    .sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return 0;
    });
}

export function getLipPresetsForSeason(
  season: PersonalColorSeason
): SeasonPreset<(typeof LIP_PRESETS)[number]>[] {
  return sortByRecommendation(LIP_PRESETS, SEASON_LIP_NAMES[season]);
}

export function getBlushPresetsForSeason(
  season: PersonalColorSeason
): SeasonPreset<(typeof BLUSH_PRESETS)[number]>[] {
  return sortByRecommendation(BLUSH_PRESETS, SEASON_BLUSH_NAMES[season]);
}

export function getEyeshadowPresetsForSeason(
  season: PersonalColorSeason
): SeasonPreset<(typeof EYESHADOW_PRESETS)[number]>[] {
  return sortByRecommendation(EYESHADOW_PRESETS, SEASON_EYESHADOW_NAMES[season]);
}

export function getHairPresetsForSeason(
  season: PersonalColorSeason
): SeasonPreset<(typeof HAIR_PRESETS)[number]>[] {
  return sortByRecommendation(HAIR_PRESETS, SEASON_HAIR_NAMES[season]);
}

export function getFoundationPresetsForSeason(
  season: PersonalColorSeason
): SeasonPreset<(typeof FOUNDATION_PRESETS)[number]>[] {
  const recommendedUndertones = SEASON_UNDERTONE[season];
  return FOUNDATION_PRESETS.map((preset) => ({
    preset,
    isRecommended: recommendedUndertones.includes(preset.undertone),
  })).sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return 0;
  });
}

/** 시즌 기반 기본 선택 색상 */
export function getDefaultColorForSeason(
  season: PersonalColorSeason,
  tab: 'lip' | 'blush' | 'eyeshadow' | 'hair-color' | 'foundation'
): RgbaColor {
  switch (tab) {
    case 'lip':
      return getLipPresetsForSeason(season)[0]?.preset.color ?? LIP_PRESETS[0].color;
    case 'blush':
      return getBlushPresetsForSeason(season)[0]?.preset.color ?? BLUSH_PRESETS[0].color;
    case 'eyeshadow':
      return getEyeshadowPresetsForSeason(season)[0]?.preset.color ?? EYESHADOW_PRESETS[0].color;
    case 'hair-color':
      return getHairPresetsForSeason(season)[0]?.preset.displayColor ?? HAIR_PRESETS[0].displayColor;
    case 'foundation':
      return getFoundationPresetsForSeason(season)[0]?.preset.color ?? FOUNDATION_PRESETS[0].color;
  }
}

/** 시즌별 한국어 라벨 */
export const SEASON_LABELS: Record<PersonalColorSeason, string> = {
  spring: '봄 웜톤',
  summer: '여름 쿨톤',
  autumn: '가을 웜톤',
  winter: '겨울 쿨톤',
};
