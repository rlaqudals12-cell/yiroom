/** 웹 PC-2 CIEDE2000 색 적합도 엔진의 모바일 미러. */
import { calculateCIEDE2000, hexToLab, type LabColor } from '@/lib/color';
import { classifyByRange } from '@/lib/utils/conditional-helpers';

import type { Season, TwelveTone } from './types';

/** 웹 `personal-color/palette.ts`의 CIE 판정용 best/worst HEX 정본 미러. */
const COMPATIBILITY_PALETTES: Record<
  TwelveTone,
  { bestColors: readonly string[]; worstColors: readonly string[] }
> = {
  'light-spring': {
    bestColors: ['#FFEFD5', '#FFE4B5', '#FFDAB9', '#98FB98', '#FFB6C1', '#ADD8E6'],
    worstColors: ['#2F4F4F', '#000000'],
  },
  'true-spring': {
    bestColors: ['#FF7F50', '#FFD700', '#FFA500', '#32CD32'],
    worstColors: ['#000080', '#808080'],
  },
  'bright-spring': {
    bestColors: ['#FF4500', '#00FF00', '#FF1493', '#00BFFF'],
    worstColors: ['#A9A9A9', '#8B4513'],
  },
  'light-summer': {
    bestColors: ['#E6E6FA', '#DDA0DD', '#ADD8E6', '#FFC0CB'],
    worstColors: ['#FF4500', '#8B4513'],
  },
  'true-summer': {
    bestColors: ['#6A5ACD', '#4169E1', '#87CEEB', '#C0C0C0'],
    worstColors: ['#FFD700', '#D2691E'],
  },
  'muted-summer': {
    bestColors: ['#708090', '#BC8F8F', '#D8BFD8', '#C0C0C0'],
    worstColors: ['#FF4500', '#00FF00'],
  },
  'muted-autumn': {
    bestColors: ['#6B8E23', '#D2B48C', '#DAA520', '#CD853F'],
    worstColors: ['#FF1493', '#0000FF'],
  },
  'true-autumn': {
    bestColors: ['#D2691E', '#DAA520', '#8B4513', '#F4A460'],
    worstColors: ['#FF69B4', '#C0C0C0'],
  },
  'deep-autumn': {
    bestColors: ['#8B4513', '#800000', '#556B2F', '#8B0000'],
    worstColors: ['#FFC0CB', '#00FFFF'],
  },
  'true-winter': {
    bestColors: ['#000000', '#FFFFFF', '#DC143C', '#4B0082'],
    worstColors: ['#FFD700', '#D2B48C'],
  },
  'bright-winter': {
    bestColors: ['#FF0000', '#00FF00', '#0000FF', '#FF00FF'],
    worstColors: ['#D2B48C', '#808000'],
  },
  'deep-winter': {
    bestColors: ['#000000', '#191970', '#4B0082', '#8B0000'],
    worstColors: ['#FFA500', '#DEB887'],
  },
};

export type ToneCompatibilityGrade = 'perfect' | 'good' | 'neutral' | 'poor' | 'avoid';

export interface ToneColorCompatibility {
  score: number;
  grade: ToneCompatibilityGrade;
  description: string;
}

/** DB/API 시즌·서브타입을 유효한 12톤 키로 바꾼다. 미상이면 지어내지 않고 null. */
export function resolveTwelveTone(
  season: Season | string,
  subtype: string | null | undefined
): TwelveTone | null {
  if (!subtype) return null;
  const normalizedSeason = season.toLowerCase();
  if (!['spring', 'summer', 'autumn', 'winter'].includes(normalizedSeason)) return null;
  const normalizedSubtype = subtype.toLowerCase() === 'mute' ? 'muted' : subtype.toLowerCase();
  const candidate = `${normalizedSubtype}-${normalizedSeason}`;
  return candidate in COMPATIBILITY_PALETTES ? (candidate as TwelveTone) : null;
}

/** 진단 12톤의 추천·회피 팔레트와 색차를 비교한다. 점수는 UI에 직접 노출하지 않는다. */
export function getToneCompatibility(
  tone: TwelveTone,
  testColor: LabColor
): ToneColorCompatibility {
  const palette = COMPATIBILITY_PALETTES[tone];
  const bestDistances = palette.bestColors.map((hex) =>
    calculateCIEDE2000(testColor, hexToLab(hex))
  );
  const avoidDistances = palette.worstColors.map((hex) =>
    calculateCIEDE2000(testColor, hexToLab(hex))
  );
  const avgBest = bestDistances.reduce((sum, value) => sum + value, 0) / bestDistances.length;
  const avgAvoid = avoidDistances.reduce((sum, value) => sum + value, 0) / avoidDistances.length;
  const minBest = Math.min(...bestDistances);

  let score: number;
  if (minBest < 5) score = 95 - minBest;
  else if (avgAvoid < 10) score = 20 + avgAvoid;
  else score = 50 + (avgAvoid - avgBest) * 2;
  score = Math.max(0, Math.min(100, score));

  const grade = classifyByRange(score, [
    { max: 30, result: 'avoid' as const },
    { min: 30, max: 50, result: 'poor' as const },
    { min: 50, max: 70, result: 'neutral' as const },
    { min: 70, max: 85, result: 'good' as const },
    { min: 85, result: 'perfect' as const },
  ])!;
  const descriptions: Record<ToneCompatibilityGrade, string> = {
    perfect: '진단된 12톤에 매우 잘 어울려요.',
    good: '진단된 12톤에 잘 어울려요.',
    neutral: '무난하게 활용할 수 있어요.',
    poor: '다른 색이 더 잘 어울릴 수 있어요.',
    avoid: '피하는 편이 좋아요.',
  };

  return { score: Math.round(score), grade, description: descriptions[grade] };
}
