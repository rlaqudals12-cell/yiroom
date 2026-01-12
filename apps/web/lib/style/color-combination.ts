/**
 * Phase L-3-3: 색상 조합 평가 유틸리티
 */

import type { SeasonType } from '@/lib/mock/personal-color';
import type { ColorCombinationScore } from '@/types/virtual-fitting';

/** 시즌별 추천 색상 범위 (Hue 기준) */
const SEASON_COLOR_RANGES: Record<
  SeasonType,
  { hue: [number, number][]; saturation: [number, number]; lightness: [number, number] }
> = {
  spring: {
    hue: [
      [0, 60],
      [340, 360],
    ], // 따뜻한 색상 (빨강~노랑)
    saturation: [40, 100], // 중간~높은 채도
    lightness: [50, 90], // 밝은 명도
  },
  summer: {
    hue: [[180, 280]], // 차가운 색상 (파랑~보라)
    saturation: [20, 60], // 낮은~중간 채도
    lightness: [60, 95], // 밝은 명도
  },
  autumn: {
    hue: [[20, 60]], // 따뜻한 색상 (주황~노랑)
    saturation: [30, 80], // 중간 채도
    lightness: [30, 70], // 중간 명도
  },
  winter: {
    hue: [[180, 280]], // 차가운 색상 (파랑~보라)
    saturation: [50, 100], // 높은 채도
    lightness: [20, 80], // 낮은~중간 명도
  },
};

/**
 * Hex 색상을 HSL로 변환
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // #RRGGBB 형식 처리
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * 색상이 시즌에 맞는지 확인
 */
function isColorMatchingSeason(colorHex: string, season: SeasonType): boolean {
  const hsl = hexToHSL(colorHex);
  const range = SEASON_COLOR_RANGES[season];

  // Hue 범위 체크
  const hueMatch = range.hue.some(([min, max]) => hsl.h >= min && hsl.h <= max);
  // Saturation 범위 체크
  const satMatch = hsl.s >= range.saturation[0] && hsl.s <= range.saturation[1];
  // Lightness 범위 체크
  const lightMatch = hsl.l >= range.lightness[0] && hsl.l <= range.lightness[1];

  return hueMatch && satMatch && lightMatch;
}

/**
 * 퍼스널 컬러와 의류 색상 조합 평가
 */
export function evaluateColorCombination(
  personalColor: SeasonType | undefined,
  clothingColors: string[]
): ColorCombinationScore {
  // 퍼스널 컬러 정보가 없으면 기본 점수
  if (!personalColor || clothingColors.length === 0) {
    return {
      score: 75,
      feedback: '색상 조합이 조화롭습니다.',
      suggestions: ['퍼스널 컬러 진단을 받으면 더 정확한 평가를 받을 수 있어요.'],
      personalColorMatch: false,
    };
  }

  // 각 색상이 시즌에 맞는지 평가
  const matchedColors = clothingColors.filter((color) =>
    isColorMatchingSeason(color, personalColor)
  );
  const matchRate = matchedColors.length / clothingColors.length;

  const score = Math.round(matchRate * 100);
  let feedback = '';
  const suggestions: string[] = [];

  // 점수에 따른 피드백
  if (score >= 80) {
    feedback = `${personalColor} 타입에 완벽하게 어울리는 색상 조합이에요! 이 조합은 피부톤을 더욱 화사하게 만들어줍니다.`;
  } else if (score >= 60) {
    feedback = `${personalColor} 타입과 잘 어울리는 색상이 많아요. 약간의 조정으로 더 완벽해질 수 있습니다.`;
    suggestions.push('일부 아이템의 색상을 조정해보세요.');
  } else if (score >= 40) {
    feedback = `${personalColor} 타입과 맞지 않는 색상이 섞여 있어요. 퍼스널 컬러에 맞는 색상으로 바꾸면 더 좋을 것 같아요.`;
    suggestions.push('상의나 하의 중 하나를 퍼스널 컬러에 맞는 색으로 교체해보세요.');
    suggestions.push('액세서리로 포인트를 주는 것도 좋은 방법입니다.');
  } else {
    feedback = `${personalColor} 타입과 맞지 않는 색상이 대부분이에요. 다른 색상으로 시도해보시는 걸 추천드려요.`;
    suggestions.push('퍼스널 컬러 팔레트에서 추천하는 색상을 확인해보세요.');
    suggestions.push('베이직 색상(베이지, 화이트 등)부터 시작해보세요.');
  }

  return {
    score,
    feedback,
    suggestions,
    personalColorMatch: matchRate >= 0.6,
  };
}

/**
 * 색상 이름에서 Hex 코드 추출 (간단한 매핑)
 */
export function colorNameToHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    빨강: '#FF0000',
    주황: '#FF8800',
    노랑: '#FFFF00',
    초록: '#00FF00',
    파랑: '#0000FF',
    남색: '#000080',
    보라: '#800080',
    분홍: '#FF69B4',
    갈색: '#8B4513',
    베이지: '#F5F5DC',
    회색: '#808080',
    검정: '#000000',
    흰색: '#FFFFFF',
    코랄: '#FF6B6B',
    피치: '#FFB4A2',
    민트: '#98D8C8',
    라벤더: '#E6E6FA',
    카키: '#C3B091',
  };

  return colorMap[colorName] || '#CCCCCC';
}
