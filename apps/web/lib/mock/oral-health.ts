/**
 * OH-1 구강건강 분석 Mock 데이터 생성기
 *
 * @module lib/mock/oral-health
 * @description AI 타임아웃 시 Fallback용 Mock 데이터
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

import type {
  ToothColorResult,
  GumHealthResult,
  WhiteningGoalResult,
  OralProductRecommendation,
  OralHealthAssessment,
  VitaShade,
  PersonalColorSeason,
  GumHealthStatus,
} from '@/types/oral-health';

/**
 * Mock 치아 색상 분석 결과 생성
 *
 * @param options - 생성 옵션
 * @returns 가상 치아 색상 분석 결과
 */
export function generateMockToothColorResult(options?: {
  shade?: VitaShade;
  brightness?: 'very_bright' | 'bright' | 'medium' | 'dark' | 'very_dark';
}): ToothColorResult {
  const shade = options?.shade ?? 'A2';
  const brightness = options?.brightness ?? 'medium';

  // 셰이드별 Lab 값 매핑
  const shadeLabMap: Record<string, { L: number; a: number; b: number }> = {
    'B1': { L: 71, a: 1.5, b: 15 },
    'A1': { L: 70, a: 2, b: 16 },
    'B2': { L: 69, a: 2.5, b: 17 },
    'A2': { L: 67, a: 3, b: 19 },
    'A3': { L: 63, a: 4, b: 22 },
    'A4': { L: 58, a: 5.5, b: 26 },
  };

  const lab = shadeLabMap[shade] ?? { L: 67, a: 3, b: 19 };

  return {
    measuredLab: lab,
    matchedShade: shade,
    deltaE: 1.2,
    confidence: 85,
    alternativeMatches: [
      { shade: 'A1', deltaE: 2.1 },
      { shade: 'B2', deltaE: 2.8 },
    ],
    interpretation: {
      brightness,
      yellowness: brightness === 'dark' ? 'significant' : 'mild',
      series: (shade.charAt(0) as 'A' | 'B' | 'C' | 'D') || 'A',
    },
  };
}

/**
 * Mock 잇몸 건강 분석 결과 생성
 *
 * @param options - 생성 옵션
 * @returns 가상 잇몸 건강 분석 결과
 */
export function generateMockGumHealthResult(options?: {
  status?: GumHealthStatus;
}): GumHealthResult {
  const status = options?.status ?? 'healthy';

  const statusMetrics: Record<
    GumHealthStatus,
    { aStarMean: number; score: number; needsVisit: boolean }
  > = {
    'healthy': { aStarMean: 10, score: 15, needsVisit: false },
    'mild_gingivitis': { aStarMean: 18, score: 40, needsVisit: false },
    'moderate_gingivitis': { aStarMean: 25, score: 65, needsVisit: true },
    'severe_inflammation': { aStarMean: 35, score: 85, needsVisit: true },
  };

  const metrics = statusMetrics[status];

  const recommendationsMap: Record<GumHealthStatus, string[]> = {
    'healthy': [
      '현재 잇몸 상태가 양호합니다.',
      '정기적인 검진을 통해 유지하세요.',
      '하루 2회 올바른 칫솔질을 계속하세요.',
    ],
    'mild_gingivitis': [
      '경미한 잇몸 염증이 관찰됩니다.',
      '잇몸 전용 치약 사용을 권장합니다.',
      '치간 청소를 꼼꼼히 해주세요.',
      '2-3주 후 상태를 다시 확인해주세요.',
    ],
    'moderate_gingivitis': [
      '중등도 잇몸 염증이 있습니다.',
      '치과 방문을 권장합니다.',
      '부드러운 칫솔모로 잇몸 라인을 마사지해주세요.',
      '항균 구강 청결제 사용을 권장합니다.',
    ],
    'severe_inflammation': [
      '심한 잇몸 염증이 관찰됩니다.',
      '가능한 빨리 치과를 방문해주세요.',
      '딱딱한 음식은 피해주세요.',
      '전문적인 치료가 필요할 수 있습니다.',
    ],
  };

  return {
    healthStatus: status,
    inflammationScore: metrics.score,
    needsDentalVisit: metrics.needsVisit,
    metrics: {
      aStarMean: metrics.aStarMean,
      aStarStd: 3.5,
      rednessPercentage: metrics.score * 0.4,
      swellingIndicator: status === 'healthy' ? 0.1 : 0.4,
    },
    recommendations: recommendationsMap[status],
    affectedAreas:
      status === 'healthy'
        ? undefined
        : [
            {
              region: 'upper_front',
              severity: status === 'severe_inflammation' ? 'severe' : 'mild',
            },
          ],
  };
}

/**
 * Mock 미백 목표 결과 생성
 *
 * @param season - 퍼스널컬러 시즌
 * @param currentShade - 현재 셰이드
 * @returns 가상 미백 목표 결과
 */
export function generateMockWhiteningGoalResult(
  season: PersonalColorSeason,
  currentShade: VitaShade
): WhiteningGoalResult {
  const seasonTargets: Record<PersonalColorSeason, VitaShade> = {
    spring: 'A1',
    summer: 'B1',
    autumn: 'A2',
    winter: 'B1',
  };

  const seasonHarmony: Record<PersonalColorSeason, string> = {
    spring: '봄 웜톤에는 아이보리 빛 자연스러운 치아 색상이 어울립니다.',
    summer: '여름 쿨톤에는 밝은 흰색 치아가 잘 어울립니다.',
    autumn: '가을 웜톤에는 너무 하얀 치아보다 자연스러운 아이보리가 조화롭습니다.',
    winter: '겨울 쿨톤에는 밝고 선명한 흰색 치아가 어울립니다.',
  };

  const targetShade = seasonTargets[season];
  const isOverWhitening = season === 'autumn' && ['0M1', '0M2', '0M3', 'B1'].includes(targetShade);

  return {
    targetShade,
    shadeStepsNeeded: 2,
    expectedDuration: {
      minWeeks: 3,
      maxWeeks: 6,
    },
    isOverWhitening,
    overWhiteningReason: isOverWhitening
      ? '가을 웜톤에 과도하게 밝은 치아는 부자연스러워 보일 수 있습니다.'
      : undefined,
    harmonySuggestion: seasonHarmony[season],
    recommendedMethods: [
      {
        method: 'whitening_toothpaste',
        effectiveness: 'low',
        duration: '4-8주',
        notes: '일상적 관리에 적합합니다.',
      },
      {
        method: 'strips',
        effectiveness: 'medium',
        duration: '2-4주',
        notes: '집에서 손쉽게 사용할 수 있습니다.',
      },
      {
        method: 'professional_bleaching',
        effectiveness: 'high',
        duration: '1-2주',
        notes: '치과 전문의 상담 후 진행하세요.',
      },
    ],
  };
}

/**
 * Mock 제품 추천 결과 생성
 *
 * @returns 가상 제품 추천 결과
 */
export function generateMockProductRecommendation(): OralProductRecommendation {
  return {
    toothpaste: [
      {
        name: '시린이 전용 치약',
        brand: '센소다인',
        keyIngredients: ['질산칼륨', '불소'],
        matchScore: 88,
        reason: '시린 이에 효과적입니다.',
      },
      {
        name: '잇몸 케어 치약',
        brand: '페리오',
        keyIngredients: ['토코페롤', '알란토인', '불소'],
        matchScore: 82,
        reason: '잇몸 건강 개선에 도움이 됩니다.',
      },
    ],
    mouthwash: [
      {
        name: '가그린 무알콜',
        brand: '가그린',
        keyIngredients: ['CPC', '자일리톨'],
        matchScore: 85,
        reason: '무알콜로 자극이 적습니다.',
      },
    ],
    interdental: {
      primary: [
        {
          type: 'floss_waxed',
          reason: '일반적인 치간 청소에 적합합니다.',
        },
      ],
      alternative: [
        {
          type: 'water_flosser',
          reason: '편리하게 치간 청소를 할 수 있습니다.',
        },
      ],
    },
    accessories: [
      {
        type: '혀 클리너',
        reason: '혀 세균 제거로 구취를 줄여줍니다.',
      },
    ],
    avoidIngredients: ['SLS (소듐라우릴설페이트)'],
    keyIngredients: ['불소 1450ppm', '자일리톨'],
    careRoutine: [
      {
        step: 1,
        action: '칫솔질',
        timing: '아침, 저녁 식후 30분',
        duration: '2-3분',
      },
      {
        step: 2,
        action: '치간 청소',
        timing: '저녁 칫솔질 전',
        duration: '1-2분',
      },
      {
        step: 3,
        action: '구강 청결제 가글',
        timing: '칫솔질 후',
        duration: '30초-1분',
      },
    ],
  };
}

/**
 * Mock 종합 평가 결과 생성
 *
 * @param options - 생성 옵션
 * @returns 가상 종합 평가 결과
 */
export function generateMockOralHealthAssessment(options?: {
  id?: string;
  clerkUserId?: string;
  includeToothColor?: boolean;
  includeGumHealth?: boolean;
  includeWhiteningGoal?: boolean;
}): OralHealthAssessment {
  const {
    id = `oh_mock_${Date.now()}`,
    clerkUserId = 'mock_user',
    includeToothColor = true,
    includeGumHealth = true,
    includeWhiteningGoal = false,
  } = options ?? {};

  let overallScore = 70;
  const recommendations: string[] = [];

  const toothColor = includeToothColor ? generateMockToothColorResult() : undefined;
  const gumHealth = includeGumHealth ? generateMockGumHealthResult() : undefined;

  if (toothColor) {
    if (toothColor.interpretation.brightness === 'dark') {
      overallScore -= 10;
      recommendations.push('치아 미백을 고려해보세요.');
    }
  }

  if (gumHealth) {
    if (gumHealth.healthStatus !== 'healthy') {
      overallScore -= 15;
      recommendations.push('잇몸 건강 관리가 필요합니다.');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('전반적인 구강 건강 상태가 양호합니다.');
    recommendations.push('정기적인 치과 검진을 유지해주세요.');
  }

  const whiteningGoal = includeWhiteningGoal
    ? {
        targetShade: 'A1' as VitaShade,
        personalColorSeason: 'spring' as PersonalColorSeason,
        shadeStepsNeeded: 2,
        isOverWhitening: false,
        harmonySuggestion: '봄 웜톤에는 자연스러운 치아 색상이 어울립니다.',
      }
    : undefined;

  return {
    id,
    clerkUserId,
    createdAt: new Date().toISOString(),
    usedFallback: true,
    toothColor,
    gumHealth,
    whiteningGoal,
    overallScore: Math.max(0, Math.min(100, overallScore)),
    recommendations,
  };
}
