/**
 * 퍼스널컬러 시즌별 셰이드 매핑
 *
 * @module lib/oral-health/internal/season-shade-map
 * @description 피부 언더톤과 치아 톤의 조화
 * @see docs/principles/oral-health.md
 */

import type { PersonalColorSeason, VitaShade, VitaSeries } from '@/types/oral-health';

/**
 * 시즌별 셰이드 추천 설정
 */
export interface SeasonShadeConfig {
  /** 추천 셰이드 (퍼스널컬러와 조화로운) */
  recommendedShades: VitaShade[];
  /** 과도한 미백 경고선 (이 이상 밝으면 부자연스러움) */
  maxBrightShade: VitaShade;
  /** 선호 시리즈 */
  preferredSeries: VitaSeries[];
  /** 피해야 할 셰이드 */
  avoidShades: VitaShade[];
  /** 조화 설명 */
  harmony: string;
  /** 미백 주의사항 */
  whiteningNotes: string;
}

/**
 * 퍼스널컬러 시즌별 추천 셰이드 매핑
 */
export const SEASON_SHADE_RECOMMENDATIONS: Record<PersonalColorSeason, SeasonShadeConfig> = {
  spring: {
    recommendedShades: ['A1', 'B1', 'B2'],
    maxBrightShade: '0M2',
    preferredSeries: ['A', 'B'],
    avoidShades: ['C1', 'C2', 'C3', 'C4'],
    harmony: '밝고 투명한 노란 피부에 따뜻한 아이보리 톤이 조화롭습니다.',
    whiteningNotes: '너무 차가운 블루 화이트(0M1)는 피부 톤과 충돌할 수 있습니다.',
  },
  summer: {
    recommendedShades: ['B1', 'C1', 'A1'],
    maxBrightShade: '0M1',
    preferredSeries: ['B', 'C'],
    avoidShades: ['A3', 'A3.5', 'A4'],
    harmony: '핑크빛 밝은 피부에 블루 언더톤의 쿨 화이트가 어울립니다.',
    whiteningNotes: '가장 밝은 셰이드까지 자연스럽게 어울릴 수 있습니다.',
  },
  autumn: {
    recommendedShades: ['A2', 'B2', 'A3'],
    maxBrightShade: 'A1',
    preferredSeries: ['A', 'B'],
    avoidShades: ['0M1', '0M2', 'C1'],
    harmony: '구릿빛 건강한 피부에 자연스러운 아이보리~옐로 톤이 조화롭습니다.',
    whiteningNotes: '과도한 미백(0M 셰이드)은 피부와 부조화를 일으킬 수 있습니다.',
  },
  winter: {
    recommendedShades: ['B1', '0M1', 'C1'],
    maxBrightShade: '0M1',
    preferredSeries: ['B', 'C'],
    avoidShades: ['A3', 'A3.5', 'A4', 'B4'],
    harmony: '선명한 핑크 베이스에 순백에 가까운 밝은 화이트가 어울립니다.',
    whiteningNotes: '높은 대비를 위해 밝은 셰이드가 효과적입니다.',
  },
};

/**
 * 과도한 미백 여부 검증
 *
 * @param targetShade - 목표 셰이드
 * @param season - 퍼스널컬러 시즌
 * @returns 검증 결과
 */
export function isOverWhitening(
  targetShade: VitaShade,
  season: PersonalColorSeason
): { isOver: boolean; reason?: string } {
  const config = SEASON_SHADE_RECOMMENDATIONS[season];
  const bleachedShades: VitaShade[] = ['0M1', '0M2', '0M3'];
  const warmSeasons: PersonalColorSeason[] = ['spring', 'autumn'];

  // 웜톤에 0M1 목표
  if (warmSeasons.includes(season) && targetShade === '0M1') {
    return {
      isOver: true,
      reason: '웜톤 피부에 차가운 블루 화이트는 부자연스러울 수 있습니다.',
    };
  }

  // 가을에 너무 밝은 목표
  if (season === 'autumn' && bleachedShades.includes(targetShade)) {
    return {
      isOver: true,
      reason: '따뜻한 피부톤에 과도한 미백은 부자연스러울 수 있습니다.',
    };
  }

  // 피해야 할 셰이드 확인
  if (config.avoidShades.includes(targetShade)) {
    return {
      isOver: false,  // 어두운 셰이드는 over whitening이 아님
      reason: `${season} 시즌에 권장하지 않는 셰이드입니다.`,
    };
  }

  return { isOver: false };
}

/**
 * 시즌에 맞는 목표 셰이드 추천
 *
 * @param currentShade - 현재 셰이드
 * @param season - 퍼스널컬러 시즌
 * @param desiredLevel - 원하는 미백 수준
 * @returns 추천 목표 셰이드
 */
export function recommendTargetShade(
  currentShade: VitaShade,
  season: PersonalColorSeason,
  desiredLevel: 'subtle' | 'moderate' | 'dramatic'
): {
  targetShade: VitaShade;
  shadeSteps: number;
  isRealistic: boolean;
  warning?: string;
} {
  const config = SEASON_SHADE_RECOMMENDATIONS[season];

  // 현재 셰이드 순위 파악
  const brightnessOrder: VitaShade[] = [
    '0M1', '0M2', '0M3', 'B1', 'A1', 'B2', 'D2', 'A2', 'C1', 'C2', 'D4',
    'A3', 'D3', 'B3', 'A3.5', 'B4', 'C3', 'A4', 'C4',
  ];

  const currentIdx = brightnessOrder.indexOf(currentShade);
  if (currentIdx === -1) {
    return {
      targetShade: config.recommendedShades[0],
      shadeSteps: 0,
      isRealistic: false,
      warning: '현재 셰이드를 식별할 수 없습니다.',
    };
  }

  // 미백 수준에 따른 단계 수
  const stepsMap = {
    subtle: 2,
    moderate: 4,
    dramatic: 6,
  };
  const desiredSteps = stepsMap[desiredLevel];

  // 목표 인덱스 계산
  const targetIdx = Math.max(0, currentIdx - desiredSteps);
  let targetShade = brightnessOrder[targetIdx];

  // 시즌별 최대 밝기 체크
  const maxIdx = brightnessOrder.indexOf(config.maxBrightShade);
  if (targetIdx < maxIdx) {
    targetShade = config.maxBrightShade;
  }

  // 권장 셰이드 중 가장 가까운 것 선택
  const targetIdxFinal = brightnessOrder.indexOf(targetShade);
  for (const recommended of config.recommendedShades) {
    const recIdx = brightnessOrder.indexOf(recommended);
    if (recIdx >= targetIdxFinal) {
      targetShade = recommended;
      break;
    }
  }

  const shadeSteps = currentIdx - brightnessOrder.indexOf(targetShade);

  // 과도한 미백 체크
  const overWhitening = isOverWhitening(targetShade, season);

  return {
    targetShade,
    shadeSteps,
    isRealistic: shadeSteps <= 8,  // 8단계 이상은 비현실적
    warning: overWhitening.isOver ? overWhitening.reason : undefined,
  };
}

/**
 * 시즌별 미백 방법 추천
 */
export function getWhiteningMethodsForSeason(
  season: PersonalColorSeason,
  shadeSteps: number
): Array<{
  method: string;
  effectiveness: 'low' | 'medium' | 'high';
  duration: string;
  notes: string;
  suitability: number;  // 0-100
}> {
  const methods = [];

  // 미백 치약 (1-2단계)
  if (shadeSteps <= 2) {
    methods.push({
      method: 'whitening_toothpaste',
      effectiveness: 'low' as const,
      duration: '4-12주',
      notes: '저농도 과산화수소 또는 연마제 기반',
      suitability: shadeSteps <= 1 ? 90 : 70,
    });
  }

  // 미백 스트립 (2-4단계)
  if (shadeSteps >= 2 && shadeSteps <= 4) {
    methods.push({
      method: 'whitening_strips',
      effectiveness: 'medium' as const,
      duration: '2-4주',
      notes: '6-10% 과산화수소',
      suitability: 80,
    });
  }

  // 홈 블리칭 (3-5단계)
  if (shadeSteps >= 3 && shadeSteps <= 6) {
    methods.push({
      method: 'home_bleaching',
      effectiveness: 'medium' as const,
      duration: '2-4주',
      notes: '10-15% 카바마이드 퍼옥사이드, 치과 트레이 제작 필요',
      suitability: 85,
    });
  }

  // 인-오피스 블리칭 (4단계 이상)
  if (shadeSteps >= 4) {
    methods.push({
      method: 'in_office_bleaching',
      effectiveness: 'high' as const,
      duration: '1-2회 시술',
      notes: '25-40% 과산화수소, 전문가 시술',
      suitability: shadeSteps >= 6 ? 95 : 75,
    });
  }

  // 가을 시즌은 자연스러운 방법 강조
  if (season === 'autumn') {
    for (const m of methods) {
      if (m.method === 'in_office_bleaching') {
        m.notes += ' (웜톤에 과도한 미백 주의)';
        m.suitability = Math.max(50, m.suitability - 20);
      }
    }
  }

  return methods.sort((a, b) => b.suitability - a.suitability);
}
