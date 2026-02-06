/**
 * PC-2 12톤 분류 알고리즘
 * Lab 색공간 기반 퍼스널컬러 분류
 *
 * @description 12톤 퍼스널컬러 분류
 * @see docs/principles/color-science.md
 */

import type {
  LabColor,
  Season,
  Subtype,
  TwelveTone,
  Undertone,
  TwelveToneClassificationResult,
  TonePalette,
} from './types';
import { TWELVE_TONE_REFERENCE_LAB, KOREAN_ADJUSTMENTS, TWELVE_TONE_LABELS } from './types';
import { calculateCIEDE2000, calculateChroma, calculateHue } from '@/lib/color';

/**
 * 12톤에서 시즌 추출
 */
export function getToneSeeason(tone: TwelveTone): Season {
  if (tone.includes('spring')) return 'spring';
  if (tone.includes('summer')) return 'summer';
  if (tone.includes('autumn')) return 'autumn';
  return 'winter';
}

/**
 * 12톤에서 서브타입 추출
 */
export function getToneSubtype(tone: TwelveTone): Subtype {
  if (tone.startsWith('light')) return 'light';
  if (tone.startsWith('true')) return 'true';
  if (tone.startsWith('bright')) return 'bright';
  if (tone.startsWith('muted')) return 'muted';
  return 'deep';
}

/**
 * 언더톤 판정 (웜/쿨/뉴트럴)
 */
export function classifyUndertone(lab: LabColor): Undertone {
  const hue = calculateHue(lab);
  const { warmCoolThresholdB, warmCoolThresholdHue } = KOREAN_ADJUSTMENTS;

  // b값과 Hue 각도 기반 판정
  // 높은 b값 + 노란 계열 Hue → 웜톤
  // 낮은 b값 + 파란 계열 Hue → 쿨톤

  if (lab.b > warmCoolThresholdB && hue < 90) {
    return 'warm';
  } else if (lab.b < warmCoolThresholdB - 5 || hue > warmCoolThresholdHue + 30) {
    return 'cool';
  }

  return 'neutral';
}

/**
 * 시즌 판정 (웜/쿨 + 밝기/채도)
 */
export function classifySeason(lab: LabColor): Season {
  const undertone = classifyUndertone(lab);
  const chroma = calculateChroma(lab);

  // 웜톤 계열
  if (undertone === 'warm' || (undertone === 'neutral' && lab.b > 15)) {
    // 밝고 선명하면 봄, 어둡고 muted면 가을
    if (lab.L > 65 && chroma > 25) {
      return 'spring';
    }
    return 'autumn';
  }

  // 쿨톤 계열
  // 부드럽고 muted면 여름, 선명하고 대비 높으면 겨울
  if (lab.L > 55 && chroma < 30) {
    return 'summer';
  }
  return 'winter';
}

/**
 * 12톤 분류 (CIEDE2000 거리 기반)
 */
export function classifyTwelveTone(skinLab: LabColor): TwelveToneClassificationResult {
  const toneScores: Record<TwelveTone, number> = {} as Record<TwelveTone, number>;
  let minDistance = Infinity;
  let bestTone: TwelveTone = 'true-summer';

  // 각 12톤 기준 Lab과의 거리 계산
  for (const [tone, refLab] of Object.entries(TWELVE_TONE_REFERENCE_LAB) as [
    TwelveTone,
    LabColor,
  ][]) {
    const distance = calculateCIEDE2000(skinLab, refLab);
    toneScores[tone] = 100 - Math.min(distance, 100);

    if (distance < minDistance) {
      minDistance = distance;
      bestTone = tone;
    }
  }

  // 신뢰도 계산 (거리가 가까울수록 높은 신뢰도)
  const confidence = Math.max(0, Math.min(100, 100 - minDistance * 2));

  return {
    tone: bestTone,
    season: getToneSeeason(bestTone),
    subtype: getToneSubtype(bestTone),
    undertone: classifyUndertone(skinLab),
    confidence,
    toneScores,
    measuredLab: skinLab,
  };
}

/**
 * 12톤별 추천 팔레트 생성
 */
export function generateTonePalette(tone: TwelveTone): TonePalette {
  // 톤별 팔레트 데이터 (미리 정의된 색상)
  const PALETTES: Record<TwelveTone, Omit<TonePalette, 'tone'>> = {
    'light-spring': {
      mainColors: ['#FFE4B5', '#FFDAB9', '#98FB98', '#AFEEEE', '#FFB6C1', '#F0E68C'],
      accentColors: ['#FF6347', '#FF69B4', '#00CED1', '#32CD32'],
      avoidColors: ['#800000', '#2F4F4F', '#4B0082', '#191970'],
      lipColors: ['#FF6B6B', '#FF8C69', '#F08080', '#FFA07A'],
      eyeshadowColors: ['#FFDEAD', '#DEB887', '#F5DEB3', '#FAEBD7'],
      blushColors: ['#FFB6C1', '#FFA07A', '#FFDAB9', '#F08080'],
    },
    'true-spring': {
      mainColors: ['#FF7F50', '#FFA500', '#FFD700', '#32CD32', '#00FA9A', '#20B2AA'],
      accentColors: ['#FF4500', '#FF6347', '#00FF7F', '#40E0D0'],
      avoidColors: ['#708090', '#2F4F4F', '#483D8B', '#8B0000'],
      lipColors: ['#FF6347', '#FF7F50', '#FF4500', '#CD5C5C'],
      eyeshadowColors: ['#DAA520', '#D2691E', '#CD853F', '#BC8F8F'],
      blushColors: ['#FFA07A', '#FA8072', '#E9967A', '#F08080'],
    },
    'bright-spring': {
      mainColors: ['#FF4500', '#FF6347', '#00FF00', '#00FFFF', '#FF1493', '#FFD700'],
      accentColors: ['#FF0000', '#FF00FF', '#00FF7F', '#FFFF00'],
      avoidColors: ['#696969', '#2F4F4F', '#556B2F', '#8B4513'],
      lipColors: ['#FF3030', '#FF4040', '#FF6A6A', '#FF6EB4'],
      eyeshadowColors: ['#FFD700', '#FFA500', '#FF8C00', '#FF7F24'],
      blushColors: ['#FF69B4', '#FF6EB4', '#FF82AB', '#FF3E96'],
    },
    'light-summer': {
      mainColors: ['#E6E6FA', '#D8BFD8', '#B0C4DE', '#AFEEEE', '#F0FFF0', '#FFF0F5'],
      accentColors: ['#DDA0DD', '#87CEEB', '#98FB98', '#FFB6C1'],
      avoidColors: ['#8B0000', '#8B4513', '#FF4500', '#FFD700'],
      lipColors: ['#DB7093', '#C71585', '#FFB6C1', '#FFC0CB'],
      eyeshadowColors: ['#E6E6FA', '#D8BFD8', '#DDA0DD', '#DA70D6'],
      blushColors: ['#FFC0CB', '#FFB6C1', '#FF69B4', '#DB7093'],
    },
    'true-summer': {
      mainColors: ['#708090', '#778899', '#B0C4DE', '#87CEEB', '#ADD8E6', '#E0FFFF'],
      accentColors: ['#4682B4', '#5F9EA0', '#6495ED', '#7B68EE'],
      avoidColors: ['#FF4500', '#FF6347', '#FFD700', '#FF8C00'],
      lipColors: ['#CD5C5C', '#BC8F8F', '#F08080', '#E9967A'],
      eyeshadowColors: ['#B0C4DE', '#A9A9A9', '#C0C0C0', '#D3D3D3'],
      blushColors: ['#F08080', '#E9967A', '#FA8072', '#FFA07A'],
    },
    'muted-summer': {
      mainColors: ['#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#DCDCDC'],
      accentColors: ['#708090', '#778899', '#B0C4DE', '#6A5ACD'],
      avoidColors: ['#FF0000', '#FF8C00', '#FFD700', '#00FF00'],
      lipColors: ['#BC8F8F', '#C9A9A9', '#D2B48C', '#DEB887'],
      eyeshadowColors: ['#A9A9A9', '#808080', '#696969', '#778899'],
      blushColors: ['#D2B48C', '#C4AEAD', '#C9A9A9', '#BC8F8F'],
    },
    'muted-autumn': {
      mainColors: ['#D2B48C', '#BC8F8F', '#A0522D', '#8B4513', '#CD853F', '#DEB887'],
      accentColors: ['#D2691E', '#B8860B', '#DAA520', '#8B4513'],
      avoidColors: ['#FF1493', '#FF00FF', '#00FFFF', '#0000FF'],
      lipColors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E'],
      eyeshadowColors: ['#D2B48C', '#C4AEAD', '#BC8F8F', '#A0522D'],
      blushColors: ['#CD853F', '#D2691E', '#DAA520', '#B8860B'],
    },
    'true-autumn': {
      mainColors: ['#FF8C00', '#FF7F00', '#D2691E', '#8B4513', '#A0522D', '#CD853F'],
      accentColors: ['#FF4500', '#FF6347', '#B8860B', '#DAA520'],
      avoidColors: ['#FF69B4', '#EE82EE', '#87CEEB', '#ADD8E6'],
      lipColors: ['#CD5C5C', '#B22222', '#8B0000', '#A52A2A'],
      eyeshadowColors: ['#D2691E', '#8B4513', '#A0522D', '#CD853F'],
      blushColors: ['#D2691E', '#CD853F', '#B8860B', '#A0522D'],
    },
    'deep-autumn': {
      mainColors: ['#8B4513', '#A0522D', '#6B4423', '#704214', '#8B0000', '#800000'],
      accentColors: ['#B8860B', '#CD853F', '#D2691E', '#A52A2A'],
      avoidColors: ['#ADD8E6', '#87CEEB', '#FF69B4', '#DDA0DD'],
      lipColors: ['#800000', '#8B0000', '#A52A2A', '#B22222'],
      eyeshadowColors: ['#8B4513', '#6B4423', '#704214', '#5C4033'],
      blushColors: ['#A0522D', '#8B4513', '#6B4423', '#A52A2A'],
    },
    'deep-winter': {
      mainColors: ['#191970', '#000080', '#2F4F4F', '#1C1C1C', '#4B0082', '#8B008B'],
      accentColors: ['#FF0000', '#00FF00', '#FFFFFF', '#FF00FF'],
      avoidColors: ['#FFA500', '#FFD700', '#DEB887', '#F5DEB3'],
      lipColors: ['#8B0000', '#800000', '#DC143C', '#C71585'],
      eyeshadowColors: ['#2F4F4F', '#191970', '#4B0082', '#3D0C02'],
      blushColors: ['#8B008B', '#800080', '#4B0082', '#483D8B'],
    },
    'true-winter': {
      mainColors: ['#000000', '#FFFFFF', '#0000FF', '#FF0000', '#00FF00', '#FF00FF'],
      accentColors: ['#00FFFF', '#FFFF00', '#FF1493', '#7FFF00'],
      avoidColors: ['#DEB887', '#D2B48C', '#F5DEB3', '#FAEBD7'],
      lipColors: ['#DC143C', '#FF0000', '#C71585', '#FF1493'],
      eyeshadowColors: ['#000000', '#2F4F4F', '#191970', '#4B0082'],
      blushColors: ['#FF1493', '#FF69B4', '#C71585', '#DB7093'],
    },
    'bright-winter': {
      mainColors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0000', '#00FF00', '#0000FF'],
      accentColors: ['#FF1493', '#00FF7F', '#FFD700', '#FF6347'],
      avoidColors: ['#8B4513', '#A0522D', '#D2B48C', '#BC8F8F'],
      lipColors: ['#FF0000', '#FF1493', '#FF00FF', '#DC143C'],
      eyeshadowColors: ['#FF00FF', '#00FFFF', '#FF1493', '#7B68EE'],
      blushColors: ['#FF69B4', '#FF1493', '#FF6EB4', '#FF82AB'],
    },
  };

  return {
    tone,
    ...PALETTES[tone],
  };
}

/**
 * 분류 결과에서 한국어 라벨 가져오기
 */
export function getToneLabel(tone: TwelveTone): string {
  return TWELVE_TONE_LABELS[tone];
}

/**
 * 피부톤 Lab 평균 계산 (여러 샘플에서)
 */
export function averageLab(samples: LabColor[]): LabColor {
  if (samples.length === 0) {
    return { L: 0, a: 0, b: 0 };
  }

  const sum = samples.reduce(
    (acc, lab) => ({
      L: acc.L + lab.L,
      a: acc.a + lab.a,
      b: acc.b + lab.b,
    }),
    { L: 0, a: 0, b: 0 }
  );

  return {
    L: sum.L / samples.length,
    a: sum.a / samples.length,
    b: sum.b / samples.length,
  };
}

/**
 * 한국인 피부톤 보정 적용
 */
export function applyKoreanAdjustment(lab: LabColor): LabColor {
  return {
    L: lab.L + KOREAN_ADJUSTMENTS.lightnessOffset,
    a: lab.a,
    b: lab.b * KOREAN_ADJUSTMENTS.chromaWeight,
  };
}
