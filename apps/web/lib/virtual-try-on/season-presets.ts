/**
 * VTO 프리셋 - 퍼스널컬러 시즌 매핑
 *
 * K-뷰티 기반 시즌별 추천 색상 매핑
 * 근거: docs/principles/color-science.md + docs/principles/fashion-matching.md
 *
 * @module lib/virtual-try-on
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

/**
 * 시즌별 추천 프리셋 이름 매핑 (K-뷰티 기준)
 *
 * 봄 웜: 코랄, 피치, 오렌지 계열 (밝고 따뜻한)
 * 여름 쿨: 로즈, 핑크, 라벤더 계열 (부드럽고 시원한)
 * 가을 웜: 브릭, 와인, 누드 계열 (깊고 따뜻한)
 * 겨울 쿨: 레드, 베리, 플럼 계열 (선명하고 차가운)
 */
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

// 파운데이션은 undertone 기반 매핑
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

/**
 * 립 프리셋을 시즌 기반으로 정렬 (추천 색상 우선)
 */
export function getLipPresetsForSeason(
  season: PersonalColorSeason
): SeasonPreset<(typeof LIP_PRESETS)[number]>[] {
  const recommendedNames = SEASON_LIP_NAMES[season];
  return sortByRecommendation(LIP_PRESETS, recommendedNames);
}

/**
 * 블러셔 프리셋을 시즌 기반으로 정렬
 */
export function getBlushPresetsForSeason(
  season: PersonalColorSeason
): SeasonPreset<(typeof BLUSH_PRESETS)[number]>[] {
  const recommendedNames = SEASON_BLUSH_NAMES[season];
  return sortByRecommendation(BLUSH_PRESETS, recommendedNames);
}

/**
 * 아이섀도 프리셋을 시즌 기반으로 정렬
 */
export function getEyeshadowPresetsForSeason(
  season: PersonalColorSeason
): SeasonPreset<(typeof EYESHADOW_PRESETS)[number]>[] {
  const recommendedNames = SEASON_EYESHADOW_NAMES[season];
  return sortByRecommendation(EYESHADOW_PRESETS, recommendedNames);
}

/**
 * 헤어 프리셋을 시즌 기반으로 정렬
 */
export function getHairPresetsForSeason(
  season: PersonalColorSeason
): SeasonPreset<(typeof HAIR_PRESETS)[number]>[] {
  const recommendedNames = SEASON_HAIR_NAMES[season];
  return sortByRecommendation(HAIR_PRESETS, recommendedNames);
}

/**
 * 파운데이션 프리셋을 시즌 기반으로 정렬 (undertone 매핑)
 */
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

/**
 * 시즌 기반 기본 선택 색상 (첫 번째 추천 프리셋)
 */
export function getDefaultColorForSeason(
  season: PersonalColorSeason,
  tab: 'lip' | 'blush' | 'eyeshadow' | 'hair-color' | 'foundation'
): RgbaColor {
  switch (tab) {
    case 'lip': {
      const presets = getLipPresetsForSeason(season);
      return presets[0]?.preset.color ?? LIP_PRESETS[0].color;
    }
    case 'blush': {
      const presets = getBlushPresetsForSeason(season);
      return presets[0]?.preset.color ?? BLUSH_PRESETS[0].color;
    }
    case 'eyeshadow': {
      const presets = getEyeshadowPresetsForSeason(season);
      return presets[0]?.preset.color ?? EYESHADOW_PRESETS[0].color;
    }
    case 'hair-color': {
      const presets = getHairPresetsForSeason(season);
      return presets[0]?.preset.displayColor ?? HAIR_PRESETS[0].displayColor;
    }
    case 'foundation': {
      const presets = getFoundationPresetsForSeason(season);
      return presets[0]?.preset.color ?? FOUNDATION_PRESETS[0].color;
    }
  }
}

/**
 * 시즌별 한국어 라벨
 */
export const SEASON_LABELS: Record<PersonalColorSeason, string> = {
  spring: '봄 웜톤',
  summer: '여름 쿨톤',
  autumn: '가을 웜톤',
  winter: '겨울 쿨톤',
};

/**
 * 프리셋 정렬 헬퍼: 추천 이름 기반으로 추천 우선 정렬
 */
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
