/**
 * PC-2: 12-Tone 색상 팔레트
 * @module lib/analysis/personal-color/palette
 */

import type { LabColor, TwelveTone, TonePalette, ColorCompatibility } from './types';
import { hexToLab, calculateCIEDE2000 } from '@/lib/color';

const TWELVE_TONE_PALETTES: Record<TwelveTone, TonePalette> = {
  'light-spring': {
    tone: 'light-spring',
    bestColors: [
      { hex: '#FFEFD5', name: '파파야휩' },
      { hex: '#FFE4B5', name: '모카신' },
      { hex: '#FFDAB9', name: '피치퍼프' },
      { hex: '#98FB98', name: '페일그린' },
      { hex: '#FFB6C1', name: '라이트핑크' },
      { hex: '#ADD8E6', name: '라이트블루' },
    ],
    worstColors: [
      { hex: '#2F4F4F', name: '다크슬레이트그레이' },
      { hex: '#000000', name: '블랙' },
    ],
    lipColors: [{ hex: '#FFB6C1', name: '코랄핑크' }],
    eyeColors: [{ hex: '#DEB887', name: '버건디' }],
    blushColors: [{ hex: '#FFDAB9', name: '피치' }],
  },
  'true-spring': {
    tone: 'true-spring',
    bestColors: [
      { hex: '#FF7F50', name: '코랄' },
      { hex: '#FFD700', name: '골드' },
      { hex: '#FFA500', name: '오렌지' },
      { hex: '#32CD32', name: '라임그린' },
    ],
    worstColors: [
      { hex: '#000080', name: '네이비' },
      { hex: '#808080', name: '그레이' },
    ],
    lipColors: [{ hex: '#FF6347', name: '코랄레드' }],
    eyeColors: [{ hex: '#CD853F', name: '페루' }],
    blushColors: [{ hex: '#FFA07A', name: '코랄' }],
  },
  'bright-spring': {
    tone: 'bright-spring',
    bestColors: [
      { hex: '#FF4500', name: '오렌지레드' },
      { hex: '#00FF00', name: '라임' },
      { hex: '#FF1493', name: '딥핑크' },
      { hex: '#00BFFF', name: '딥스카이블루' },
    ],
    worstColors: [
      { hex: '#A9A9A9', name: '다크그레이' },
      { hex: '#8B4513', name: '새들브라운' },
    ],
    lipColors: [{ hex: '#FF4500', name: '비비드오렌지' }],
    eyeColors: [{ hex: '#FFD700', name: '골드' }],
    blushColors: [{ hex: '#FF7F50', name: '비비드코랄' }],
  },
  'light-summer': {
    tone: 'light-summer',
    bestColors: [
      { hex: '#E6E6FA', name: '라벤더' },
      { hex: '#DDA0DD', name: '플럼' },
      { hex: '#ADD8E6', name: '라이트블루' },
      { hex: '#FFC0CB', name: '핑크' },
    ],
    worstColors: [
      { hex: '#FF4500', name: '오렌지레드' },
      { hex: '#8B4513', name: '새들브라운' },
    ],
    lipColors: [{ hex: '#DB7093', name: '로즈' }],
    eyeColors: [{ hex: '#C0C0C0', name: '실버' }],
    blushColors: [{ hex: '#FFB6C1', name: '소프트핑크' }],
  },
  'true-summer': {
    tone: 'true-summer',
    bestColors: [
      { hex: '#6A5ACD', name: '슬레이트블루' },
      { hex: '#4169E1', name: '로얄블루' },
      { hex: '#87CEEB', name: '스카이블루' },
      { hex: '#C0C0C0', name: '실버' },
    ],
    worstColors: [
      { hex: '#FFD700', name: '골드' },
      { hex: '#D2691E', name: '초콜릿' },
    ],
    lipColors: [{ hex: '#DB7093', name: '로즈' }],
    eyeColors: [{ hex: '#778899', name: '슬레이트그레이' }],
    blushColors: [{ hex: '#DB7093', name: '로즈핑크' }],
  },
  'muted-summer': {
    tone: 'muted-summer',
    bestColors: [
      { hex: '#708090', name: '슬레이트그레이' },
      { hex: '#BC8F8F', name: '로지브라운' },
      { hex: '#D8BFD8', name: '시슬' },
      { hex: '#C0C0C0', name: '실버' },
    ],
    worstColors: [
      { hex: '#FF4500', name: '오렌지레드' },
      { hex: '#00FF00', name: '라임' },
    ],
    lipColors: [{ hex: '#BC8F8F', name: '더스티로즈' }],
    eyeColors: [{ hex: '#808080', name: '그레이' }],
    blushColors: [{ hex: '#BC8F8F', name: '더스티로즈' }],
  },
  'muted-autumn': {
    tone: 'muted-autumn',
    bestColors: [
      { hex: '#6B8E23', name: '올리브드랍' },
      { hex: '#D2B48C', name: '탄' },
      { hex: '#DAA520', name: '골든로드' },
      { hex: '#CD853F', name: '페루' },
    ],
    worstColors: [
      { hex: '#FF1493', name: '딥핑크' },
      { hex: '#0000FF', name: '블루' },
    ],
    lipColors: [{ hex: '#CD853F', name: '테라코타' }],
    eyeColors: [{ hex: '#808000', name: '올리브' }],
    blushColors: [{ hex: '#D2B48C', name: '테라코타' }],
  },
  'true-autumn': {
    tone: 'true-autumn',
    bestColors: [
      { hex: '#D2691E', name: '초콜릿' },
      { hex: '#DAA520', name: '골든로드' },
      { hex: '#8B4513', name: '새들브라운' },
      { hex: '#F4A460', name: '샌디브라운' },
    ],
    worstColors: [
      { hex: '#FF69B4', name: '핫핑크' },
      { hex: '#C0C0C0', name: '실버' },
    ],
    lipColors: [{ hex: '#8B4513', name: '테라코타' }],
    eyeColors: [{ hex: '#B8860B', name: '골드' }],
    blushColors: [{ hex: '#D2691E', name: '테라코타' }],
  },
  'deep-autumn': {
    tone: 'deep-autumn',
    bestColors: [
      { hex: '#8B4513', name: '새들브라운' },
      { hex: '#800000', name: '마룬' },
      { hex: '#556B2F', name: '다크올리브그린' },
      { hex: '#8B0000', name: '다크레드' },
    ],
    worstColors: [
      { hex: '#FFC0CB', name: '핑크' },
      { hex: '#00FFFF', name: '시안' },
    ],
    lipColors: [{ hex: '#800000', name: '다크와인' }],
    eyeColors: [{ hex: '#8B4513', name: '딥브라운' }],
    blushColors: [{ hex: '#A52A2A', name: '다크테라코타' }],
  },
  'true-winter': {
    tone: 'true-winter',
    bestColors: [
      { hex: '#000000', name: '블랙' },
      { hex: '#FFFFFF', name: '화이트' },
      { hex: '#DC143C', name: '크림슨' },
      { hex: '#4B0082', name: '인디고' },
    ],
    worstColors: [
      { hex: '#FFD700', name: '골드' },
      { hex: '#D2B48C', name: '탄' },
    ],
    lipColors: [{ hex: '#DC143C', name: '레드' }],
    eyeColors: [{ hex: '#C0C0C0', name: '실버' }],
    blushColors: [{ hex: '#DC143C', name: '핑크레드' }],
  },
  'bright-winter': {
    tone: 'bright-winter',
    bestColors: [
      { hex: '#FF0000', name: '레드' },
      { hex: '#00FF00', name: '라임' },
      { hex: '#0000FF', name: '블루' },
      { hex: '#FF00FF', name: '마젠타' },
    ],
    worstColors: [
      { hex: '#D2B48C', name: '탄' },
      { hex: '#808000', name: '올리브' },
    ],
    lipColors: [{ hex: '#FF0000', name: '비비드레드' }],
    eyeColors: [{ hex: '#C0C0C0', name: '실버' }],
    blushColors: [{ hex: '#FF1493', name: '비비드핑크' }],
  },
  'deep-winter': {
    tone: 'deep-winter',
    bestColors: [
      { hex: '#000000', name: '블랙' },
      { hex: '#191970', name: '미드나잇블루' },
      { hex: '#4B0082', name: '인디고' },
      { hex: '#8B0000', name: '다크레드' },
    ],
    worstColors: [
      { hex: '#FFA500', name: '오렌지' },
      { hex: '#DEB887', name: '벌리우드' },
    ],
    lipColors: [{ hex: '#800020', name: '딥버건디' }],
    eyeColors: [{ hex: '#000000', name: '블랙' }],
    blushColors: [{ hex: '#800020', name: '딥버건디' }],
  },
};

export function generateTonePalette(tone: TwelveTone): TonePalette {
  return { ...TWELVE_TONE_PALETTES[tone] };
}

export function getToneCompatibility(tone: TwelveTone, testColor: LabColor): ColorCompatibility {
  const palette = TWELVE_TONE_PALETTES[tone];
  const bestDistances = palette.bestColors.map((c) =>
    calculateCIEDE2000(testColor, hexToLab(c.hex))
  );
  const worstDistances = palette.worstColors.map((c) =>
    calculateCIEDE2000(testColor, hexToLab(c.hex))
  );
  const avgBest = bestDistances.reduce((a, b) => a + b, 0) / bestDistances.length;
  const avgWorst = worstDistances.reduce((a, b) => a + b, 0) / worstDistances.length;
  const minBest = Math.min(...bestDistances);
  let score =
    minBest < 5 ? 95 - minBest : avgWorst < 10 ? 20 + avgWorst : 50 + (avgWorst - avgBest) * 2;
  score = Math.max(0, Math.min(100, score));
  const grade =
    score >= 85
      ? 'perfect'
      : score >= 70
        ? 'good'
        : score >= 50
          ? 'neutral'
          : score >= 30
            ? 'poor'
            : 'avoid';
  const desc: Record<string, string> = {
    perfect: '이 색상은 당신의 퍼스널 컬러와 완벽하게 어울립니다.',
    good: '이 색상은 당신에게 잘 어울리는 색상입니다.',
    neutral: '이 색상은 무난하게 소화할 수 있습니다.',
    poor: '이 색상은 다소 어울리지 않을 수 있습니다.',
    avoid: '이 색상은 피하는 것이 좋습니다.',
  };
  return {
    color: { hex: '#000000', name: '테스트 색상', lab: testColor },
    score: Math.round(score),
    grade,
    description: desc[grade],
  };
}

export function getAllTonePalettes(): TonePalette[] {
  return Object.values(TWELVE_TONE_PALETTES);
}
