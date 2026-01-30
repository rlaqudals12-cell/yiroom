/**
 * 미백 목표 계산기
 *
 * @module lib/oral-health/whitening-goal-calculator
 * @description 퍼스널컬러 연계 미백 목표 추천
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

import type { WhiteningGoalInput, WhiteningGoalResult, VitaShade, PersonalColorSeason } from '@/types/oral-health';
import {
  SEASON_SHADE_RECOMMENDATIONS,
  isOverWhitening,
  recommendTargetShade,
  getWhiteningMethodsForSeason,
} from './internal/season-shade-map';
import { calculateShadeSteps, getShadeReference } from './internal/vita-database';

/**
 * 미백 목표 계산
 *
 * @param input - 미백 목표 입력
 * @returns 미백 목표 결과
 */
export function calculateWhiteningGoal(input: WhiteningGoalInput): WhiteningGoalResult {
  const { currentShade, personalColorSeason, desiredLevel } = input;

  // 목표 셰이드 추천
  const recommendation = recommendTargetShade(currentShade, personalColorSeason, desiredLevel);

  // 과도한 미백 체크
  const overWhiteningCheck = isOverWhitening(recommendation.targetShade, personalColorSeason);

  // 예상 소요 기간 계산
  const duration = calculateExpectedDuration(recommendation.shadeSteps, desiredLevel);

  // 미백 방법 추천
  const methods = getWhiteningMethodsForSeason(personalColorSeason, recommendation.shadeSteps);

  // 조화 설명 가져오기
  const seasonConfig = SEASON_SHADE_RECOMMENDATIONS[personalColorSeason];

  return {
    targetShade: recommendation.targetShade,
    shadeStepsNeeded: recommendation.shadeSteps,
    expectedDuration: duration,
    isOverWhitening: overWhiteningCheck.isOver,
    overWhiteningReason: overWhiteningCheck.reason,
    harmonySuggestion: seasonConfig.harmony,
    recommendedMethods: methods.slice(0, 3).map(m => ({
      method: m.method as WhiteningGoalResult['recommendedMethods'][0]['method'],
      effectiveness: m.effectiveness,
      duration: m.duration,
      notes: m.notes,
    })),
  };
}

/**
 * 예상 소요 기간 계산
 */
function calculateExpectedDuration(
  shadeSteps: number,
  desiredLevel: 'subtle' | 'moderate' | 'dramatic'
): { minWeeks: number; maxWeeks: number } {
  // 기본 가정: 1단계당 1-2주 (홈 블리칭 기준)
  const baseMinWeeks = shadeSteps;
  const baseMaxWeeks = shadeSteps * 2;

  // 레벨에 따른 조정
  switch (desiredLevel) {
    case 'subtle':
      // 가장 안전한 방법 → 더 오래 걸림
      return {
        minWeeks: Math.max(2, baseMinWeeks),
        maxWeeks: Math.max(4, baseMaxWeeks + 2),
      };
    case 'moderate':
      return {
        minWeeks: Math.max(2, baseMinWeeks),
        maxWeeks: Math.max(4, baseMaxWeeks),
      };
    case 'dramatic':
      // 전문 시술 병행 시 빠름
      return {
        minWeeks: Math.max(1, Math.floor(baseMinWeeks * 0.5)),
        maxWeeks: Math.max(3, baseMaxWeeks - 2),
      };
  }
}

/**
 * 미백 진행 상황 추적
 *
 * @description 시작 셰이드와 현재 셰이드 비교
 */
export function trackWhiteningProgress(
  startShade: VitaShade,
  currentShade: VitaShade,
  targetShade: VitaShade
): {
  progressPercentage: number;
  stepsCompleted: number;
  stepsRemaining: number;
  isGoalReached: boolean;
  message: string;
} {
  const totalSteps = calculateShadeSteps(startShade, targetShade);
  const completedSteps = calculateShadeSteps(startShade, currentShade);
  const remainingSteps = calculateShadeSteps(currentShade, targetShade);

  const progressPercentage = totalSteps > 0
    ? Math.min(100, Math.round((completedSteps / totalSteps) * 100))
    : 100;

  const isGoalReached = remainingSteps <= 0;

  let message: string;
  if (isGoalReached) {
    message = '축하합니다! 목표 셰이드에 도달했습니다.';
  } else if (progressPercentage >= 75) {
    message = '목표에 거의 도달했습니다. 조금만 더 힘내세요!';
  } else if (progressPercentage >= 50) {
    message = '절반 이상 진행되었습니다. 잘하고 계세요!';
  } else if (progressPercentage >= 25) {
    message = '미백이 순조롭게 진행 중입니다.';
  } else {
    message = '미백을 시작했습니다. 꾸준히 관리해주세요.';
  }

  return {
    progressPercentage,
    stepsCompleted: Math.max(0, completedSteps),
    stepsRemaining: Math.max(0, remainingSteps),
    isGoalReached,
    message,
  };
}

/**
 * 미백 주의사항 생성
 */
export function generateWhiteningPrecautions(
  season: PersonalColorSeason,
  shadeSteps: number
): string[] {
  const precautions: string[] = [
    '미백 중에는 착색 음식(커피, 와인, 카레 등)을 피하세요.',
    '미백 제품 사용 시 잇몸에 닿지 않도록 주의하세요.',
    '민감도가 증가하면 사용 빈도를 줄이세요.',
  ];

  // 많은 단계 변화 시 추가 주의사항
  if (shadeSteps >= 4) {
    precautions.push('급격한 미백은 치아 민감도를 유발할 수 있습니다. 점진적으로 진행하세요.');
    precautions.push('전문가 상담 하에 진행하는 것을 권장합니다.');
  }

  // 시즌별 주의사항
  const seasonConfig = SEASON_SHADE_RECOMMENDATIONS[season];
  if (season === 'autumn' || season === 'spring') {
    precautions.push(seasonConfig.whiteningNotes);
  }

  return precautions;
}

/**
 * 미백 결과 요약 텍스트 생성
 */
export function generateWhiteningGoalSummary(result: WhiteningGoalResult): string {
  const { targetShade, shadeStepsNeeded, expectedDuration, isOverWhitening, harmonySuggestion } = result;

  let summary = `추천 목표 셰이드: ${targetShade}\n`;
  summary += `필요한 단계: ${shadeStepsNeeded}단계\n`;
  summary += `예상 기간: ${expectedDuration.minWeeks}-${expectedDuration.maxWeeks}주\n\n`;
  summary += harmonySuggestion;

  if (isOverWhitening) {
    summary += '\n\n⚠️ 주의: 과도한 미백 경고';
    if (result.overWhiteningReason) {
      summary += `\n${result.overWhiteningReason}`;
    }
  }

  return summary;
}
