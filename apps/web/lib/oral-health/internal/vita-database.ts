/**
 * VITA Classical 셰이드 데이터베이스
 *
 * @module lib/oral-health/internal/vita-database
 * @description VITA 16색 참조값 (VITA Easyshade 측정 데이터)
 * @see docs/principles/oral-health.md
 */

import type { LabColor, VitaShade, VitaSeries, VitaShadeReference } from '@/types/oral-health';
import { calculateCIEDE2000 } from './ciede2000';

/**
 * VITA Classical 16색 참조값 데이터베이스
 * 출처: VITA Easyshade 측정 데이터
 *
 * 명도 순서 (밝은 순서대로):
 * B1 > A1 > B2 > D2 > A2 > C1 > C2 > D4 > A3 > D3 > B3 > A3.5 > B4 > C3 > A4 > C4
 */
export const VITA_SHADE_DATABASE: VitaShadeReference[] = [
  // 밝은 셰이드 (1-8위)
  { shade: 'B1', lab: { L: 71, a: 1.5, b: 15 }, series: 'B', brightnessRank: 1, description: '가장 밝은 자연 셰이드' },
  { shade: 'A1', lab: { L: 70, a: 2, b: 16 }, series: 'A', brightnessRank: 2, description: '밝은 황갈색' },
  { shade: 'B2', lab: { L: 68.5, a: 2, b: 17 }, series: 'B', brightnessRank: 3, description: '밝은 황색' },
  { shade: 'D2', lab: { L: 68, a: 1.5, b: 14 }, series: 'D', brightnessRank: 4, description: '밝은 적회색' },
  { shade: 'A2', lab: { L: 67, a: 2.5, b: 19 }, series: 'A', brightnessRank: 5, description: '중간 황갈색' },
  { shade: 'C1', lab: { L: 66, a: 0.5, b: 12 }, series: 'C', brightnessRank: 6, description: '밝은 회색' },
  { shade: 'C2', lab: { L: 64.5, a: 1, b: 13 }, series: 'C', brightnessRank: 7, description: '중간 회색' },
  { shade: 'D4', lab: { L: 64, a: 2, b: 15 }, series: 'D', brightnessRank: 8, description: '중간 적회색' },

  // 중간 셰이드 (9-12위)
  { shade: 'A3', lab: { L: 63.5, a: 3.5, b: 21.5 }, series: 'A', brightnessRank: 9, description: '중간 황갈색' },
  { shade: 'D3', lab: { L: 62, a: 2.5, b: 16 }, series: 'D', brightnessRank: 10, description: '어두운 적회색' },
  { shade: 'B3', lab: { L: 61, a: 3, b: 20 }, series: 'B', brightnessRank: 11, description: '중간 황색' },
  { shade: 'A3.5', lab: { L: 59, a: 4, b: 22 }, series: 'A', brightnessRank: 12, description: '진한 황갈색' },

  // 어두운 셰이드 (13-16위)
  { shade: 'B4', lab: { L: 58, a: 4, b: 23 }, series: 'B', brightnessRank: 13, description: '어두운 황색' },
  { shade: 'C3', lab: { L: 56, a: 1.5, b: 14 }, series: 'C', brightnessRank: 14, description: '어두운 회색' },
  { shade: 'A4', lab: { L: 56.5, a: 5.5, b: 25.5 }, series: 'A', brightnessRank: 15, description: '가장 어두운 황갈색' },
  { shade: 'C4', lab: { L: 48.5, a: 0.5, b: 11 }, series: 'C', brightnessRank: 16, description: '가장 어두운 회색' },

  // Bleached 셰이드 (미백 후 목표)
  { shade: '0M1', lab: { L: 74, a: 0, b: 10 }, series: 'B', brightnessRank: 0, description: '미백 1단계 (블루 화이트)' },
  { shade: '0M2', lab: { L: 72.5, a: 0.5, b: 12 }, series: 'B', brightnessRank: 0, description: '미백 2단계 (뉴트럴 화이트)' },
  { shade: '0M3', lab: { L: 71.5, a: 1, b: 13 }, series: 'B', brightnessRank: 0, description: '미백 3단계 (웜 화이트)' },
];

/**
 * 명도 순서로 정렬된 셰이드 목록 (밝은 순)
 */
export const VITA_BRIGHTNESS_ORDER: VitaShade[] = [
  '0M1', '0M2', '0M3', 'B1', 'A1', 'B2', 'D2', 'A2', 'C1', 'C2', 'D4',
  'A3', 'D3', 'B3', 'A3.5', 'B4', 'C3', 'A4', 'C4',
];

/**
 * 시리즈별 셰이드 그룹
 */
export const VITA_SERIES_GROUPS: Record<VitaSeries, VitaShade[]> = {
  A: ['A1', 'A2', 'A3', 'A3.5', 'A4'],
  B: ['B1', 'B2', 'B3', 'B4'],
  C: ['C1', 'C2', 'C3', 'C4'],
  D: ['D2', 'D3', 'D4'],
};

/**
 * 시리즈별 특성 설명
 */
export const VITA_SERIES_CHARACTERISTICS: Record<VitaSeries, {
  name: string;
  undertone: string;
  description: string;
}> = {
  A: {
    name: 'Reddish Brown',
    undertone: 'warm',
    description: '적갈색 계열 - 따뜻한 황색 기반',
  },
  B: {
    name: 'Reddish Yellow',
    undertone: 'warm',
    description: '적황색 계열 - 밝고 따뜻한 톤',
  },
  C: {
    name: 'Grey',
    undertone: 'cool',
    description: '회색 계열 - 차갑고 중성적',
  },
  D: {
    name: 'Reddish Grey',
    undertone: 'neutral',
    description: '적회색 계열 - 중간 톤',
  },
};

/**
 * 셰이드 참조값 조회
 *
 * @param shade - VITA 셰이드 코드
 * @returns 셰이드 참조값 (없으면 undefined)
 */
export function getShadeReference(shade: VitaShade): VitaShadeReference | undefined {
  return VITA_SHADE_DATABASE.find(s => s.shade === shade);
}

/**
 * 최근접 VITA 셰이드 매칭
 *
 * @param measuredLab - 측정된 Lab 색상
 * @param excludeBleached - Bleached 셰이드 제외 여부
 * @returns 매칭 결과
 */
export function findBestShadeMatch(
  measuredLab: LabColor,
  excludeBleached: boolean = false
): {
  shade: VitaShade;
  deltaE: number;
  reference: VitaShadeReference;
  alternativeMatches: Array<{ shade: VitaShade; deltaE: number }>;
} {
  const candidates = excludeBleached
    ? VITA_SHADE_DATABASE.filter(s => !s.shade.startsWith('0M'))
    : VITA_SHADE_DATABASE;

  const matches = candidates.map(ref => ({
    shade: ref.shade,
    deltaE: calculateCIEDE2000(measuredLab, ref.lab),
    reference: ref,
  })).sort((a, b) => a.deltaE - b.deltaE);

  const best = matches[0];
  const alternatives = matches.slice(1, 4).map(m => ({
    shade: m.shade,
    deltaE: m.deltaE,
  }));

  return {
    shade: best.shade,
    deltaE: best.deltaE,
    reference: best.reference,
    alternativeMatches: alternatives,
  };
}

/**
 * 두 셰이드 간 단계 차이 계산
 *
 * @param shade1 - 첫 번째 셰이드
 * @param shade2 - 두 번째 셰이드
 * @returns 단계 차이 (양수: shade2가 더 밝음)
 */
export function calculateShadeSteps(shade1: VitaShade, shade2: VitaShade): number {
  const ref1 = getShadeReference(shade1);
  const ref2 = getShadeReference(shade2);

  if (!ref1 || !ref2) return 0;

  // 밝기 순위 기반 비교
  const rank1 = VITA_BRIGHTNESS_ORDER.indexOf(shade1);
  const rank2 = VITA_BRIGHTNESS_ORDER.indexOf(shade2);

  return rank1 - rank2;  // 양수면 shade2가 더 밝음 (순위가 낮음)
}

/**
 * 셰이드 밝기 해석
 */
export function interpretBrightness(shade: VitaShade): {
  level: 'very_bright' | 'bright' | 'medium' | 'dark' | 'very_dark';
  description: string;
} {
  const ref = getShadeReference(shade);
  if (!ref) return { level: 'medium', description: '정보 없음' };

  const rank = ref.brightnessRank;

  if (rank === 0) {
    return { level: 'very_bright', description: '미백 셰이드 (비자연스러울 수 있음)' };
  } else if (rank <= 4) {
    return { level: 'very_bright', description: '매우 밝은 자연 셰이드' };
  } else if (rank <= 8) {
    return { level: 'bright', description: '밝은 셰이드' };
  } else if (rank <= 12) {
    return { level: 'medium', description: '중간 밝기' };
  } else if (rank <= 14) {
    return { level: 'dark', description: '어두운 셰이드' };
  } else {
    return { level: 'very_dark', description: '매우 어두운 셰이드' };
  }
}

/**
 * 황색도 해석 (b* 값 기반)
 */
export function interpretYellowness(lab: LabColor): {
  level: 'minimal' | 'mild' | 'moderate' | 'significant';
  description: string;
} {
  const b = lab.b;

  if (b <= 12) {
    return { level: 'minimal', description: '황색기 거의 없음' };
  } else if (b <= 16) {
    return { level: 'mild', description: '자연스러운 아이보리 톤' };
  } else if (b <= 20) {
    return { level: 'moderate', description: '중간 정도의 황색기' };
  } else {
    return { level: 'significant', description: '뚜렷한 황색기' };
  }
}
