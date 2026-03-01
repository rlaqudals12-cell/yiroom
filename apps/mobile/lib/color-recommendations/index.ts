/**
 * 팔레트 추천 모듈
 *
 * 퍼스널컬러 시즌 기반 색상 팔레트 추천
 *
 * @module lib/color-recommendations
 * @see docs/principles/color-science.md
 */

import type { Season } from '../color-classification';

// ─── 타입 ────────────────────────────────────────────

export interface ColorPalette {
  name: string;
  colors: string[];
  description: string;
}

export interface SeasonPalette {
  season: Season;
  label: string;
  bestColors: string[];
  avoidColors: string[];
  palettes: ColorPalette[];
}

// ─── 시즌별 추천 팔레트 ─────────────────────────────

const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  spring: {
    season: 'spring',
    label: '봄 웜톤',
    bestColors: [
      '#FF7F50', '#FFA07A', '#FFD700', '#F0E68C',
      '#98FB98', '#00CED1', '#FF6347', '#FFDAB9',
      '#FFCBA4', '#E8A861', '#FF8C69', '#FFC0CB',
    ],
    avoidColors: ['#000000', '#808080', '#4B0082', '#191970'],
    palettes: [
      {
        name: '데일리 내추럴',
        colors: ['#FFDAB9', '#FFA07A', '#FFD700', '#98FB98'],
        description: '따뜻하고 자연스러운 일상 팔레트',
      },
      {
        name: '비비드 코럴',
        colors: ['#FF7F50', '#FF6347', '#FF8C69', '#E8A861'],
        description: '화사하고 생기 있는 포인트 팔레트',
      },
    ],
  },
  summer: {
    season: 'summer',
    label: '여름 쿨톤',
    bestColors: [
      '#E6E6FA', '#B0C4DE', '#87CEEB', '#DDA0DD',
      '#C0C0C0', '#778899', '#DB7093', '#F0F8FF',
      '#D8BFD8', '#BC8F8F', '#ADD8E6', '#FFB6C1',
    ],
    avoidColors: ['#FF4500', '#FF8C00', '#FFD700', '#8B4513'],
    palettes: [
      {
        name: '소프트 라벤더',
        colors: ['#E6E6FA', '#DDA0DD', '#D8BFD8', '#B0C4DE'],
        description: '부드럽고 우아한 뮤트 팔레트',
      },
      {
        name: '로즈 핑크',
        colors: ['#DB7093', '#FFB6C1', '#BC8F8F', '#ADD8E6'],
        description: '여성스럽고 차분한 로즈 팔레트',
      },
    ],
  },
  autumn: {
    season: 'autumn',
    label: '가을 웜톤',
    bestColors: [
      '#D2691E', '#8B4513', '#CD853F', '#DAA520',
      '#556B2F', '#6B8E23', '#A0522D', '#BC8F8F',
      '#B8860B', '#808000', '#8B0000', '#F4A460',
    ],
    avoidColors: ['#FF69B4', '#00FFFF', '#7B68EE', '#FF1493'],
    palettes: [
      {
        name: '어스 톤',
        colors: ['#D2691E', '#CD853F', '#8B4513', '#DAA520'],
        description: '깊고 따뜻한 어스 톤 팔레트',
      },
      {
        name: '포레스트',
        colors: ['#556B2F', '#6B8E23', '#808000', '#A0522D'],
        description: '자연스러운 올리브/카키 팔레트',
      },
    ],
  },
  winter: {
    season: 'winter',
    label: '겨울 쿨톤',
    bestColors: [
      '#000000', '#FFFFFF', '#FF0000', '#0000FF',
      '#FF00FF', '#00FFFF', '#4169E1', '#8B008B',
      '#191970', '#C0C0C0', '#DC143C', '#4B0082',
    ],
    avoidColors: ['#FFD700', '#F0E68C', '#FFDAB9', '#DEB887'],
    palettes: [
      {
        name: '모노크롬',
        colors: ['#000000', '#FFFFFF', '#C0C0C0', '#191970'],
        description: '시크하고 모던한 흑백 팔레트',
      },
      {
        name: '비비드 쿨',
        colors: ['#FF0000', '#0000FF', '#FF00FF', '#DC143C'],
        description: '선명하고 강렬한 비비드 팔레트',
      },
    ],
  },
};

// ─── 공개 API ───────────────────────────────────────

/**
 * 시즌별 추천 팔레트 조회
 */
export function getSeasonPalette(season: Season): SeasonPalette {
  return SEASON_PALETTES[season];
}

/**
 * 시즌별 베스트 색상 목록
 */
export function getBestColors(season: Season): string[] {
  return SEASON_PALETTES[season].bestColors;
}

/**
 * 시즌별 피해야 할 색상 목록
 */
export function getAvoidColors(season: Season): string[] {
  return SEASON_PALETTES[season].avoidColors;
}

/**
 * 시즌별 추천 팔레트 (이름 있는 세트)
 */
export function getPalettes(season: Season): ColorPalette[] {
  return SEASON_PALETTES[season].palettes;
}

/**
 * 특정 색상이 해당 시즌에 적합한지 판단
 */
export function isColorSuitable(hex: string, season: Season): boolean {
  const avoid = SEASON_PALETTES[season].avoidColors;
  return !avoid.includes(hex.toUpperCase());
}

/**
 * 모든 시즌 팔레트 데이터
 */
export function getAllSeasonPalettes(): Record<Season, SeasonPalette> {
  return SEASON_PALETTES;
}
