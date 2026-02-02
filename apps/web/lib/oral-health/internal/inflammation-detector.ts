/**
 * 잇몸 염증 탐지 알고리즘
 *
 * @module lib/oral-health/internal/inflammation-detector
 * @description a* 값 기반 붉은기 분석, 연구 근거: 치은염 탐지 AUC 87.11%
 * @see docs/principles/oral-health.md
 */

import type { LabColor, GumHealthStatus, GumHealthMetrics } from '@/types/oral-health';

/**
 * 배열 평균 계산
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * 배열 표준편차 계산
 */
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * 잇몸 염증 탐지
 *
 * @param gumPixels - 잇몸 영역 픽셀의 Lab 값 배열
 * @returns 잇몸 건강 지표
 *
 * @description
 * - a* 값: 붉은기 지표 (양수가 클수록 붉음)
 * - 건강한 잇몸: a* < 10 (연분홍)
 * - 염증 잇몸: a* > 15 (붉은색)
 */
export function detectGumInflammation(gumPixels: LabColor[]): GumHealthMetrics {
  if (gumPixels.length === 0) {
    return {
      aStarMean: 0,
      aStarStd: 0,
      rednessPercentage: 0,
      swellingIndicator: 0,
    };
  }

  // a* 값 통계 계산
  const aStarValues = gumPixels.map(p => p.a);
  const aStarMean = mean(aStarValues);
  const aStarStd = standardDeviation(aStarValues);

  // 붉은 영역 비율 (a* > 15)
  const redPixels = aStarValues.filter(a => a > 15);
  const rednessPercentage = (redPixels.length / aStarValues.length) * 100;

  // 부종 지표 (L* 감소 + a* 증가 조합)
  // 부은 잇몸은 어두워지고(L* 감소) 붉어짐(a* 증가)
  const lStarValues = gumPixels.map(p => p.L);
  const lStarMean = mean(lStarValues);
  const swellingIndicator = Math.max(0, (aStarMean - 10) * (70 - lStarMean) / 100);

  return {
    aStarMean,
    aStarStd,
    rednessPercentage,
    swellingIndicator,
  };
}

/**
 * 잇몸 건강 상태 분류
 *
 * @param metrics - 잇몸 건강 지표
 * @returns 분류 결과
 */
export function classifyGumHealth(metrics: GumHealthMetrics): {
  status: GumHealthStatus;
  inflammationScore: number;
  needsDentalVisit: boolean;
  confidence: number;
} {
  const { aStarMean, rednessPercentage, swellingIndicator } = metrics;

  // 염증 점수 계산 (0-100)
  let inflammationScore = 0;
  inflammationScore += Math.min(40, aStarMean * 2);           // a* 기여 (최대 40)
  inflammationScore += Math.min(30, rednessPercentage * 0.5); // 붉은 영역 기여 (최대 30)
  inflammationScore += Math.min(30, swellingIndicator * 3);   // 부종 기여 (최대 30)
  inflammationScore = Math.min(100, Math.round(inflammationScore));

  // 상태 분류
  let status: GumHealthStatus;
  let needsDentalVisit = false;
  let confidence: number;

  if (aStarMean < 10 && inflammationScore < 25) {
    status = 'healthy';
    confidence = 90;
  } else if (aStarMean < 15 && inflammationScore < 50) {
    status = 'mild_gingivitis';
    confidence = 85;
    // 경미한 경우 홈케어로 개선 가능
  } else if (aStarMean < 20 && inflammationScore < 75) {
    status = 'moderate_gingivitis';
    needsDentalVisit = true;
    confidence = 80;
  } else {
    status = 'severe_inflammation';
    needsDentalVisit = true;
    confidence = 75;  // 심한 경우 전문 진단 필요
  }

  return {
    status,
    inflammationScore,
    needsDentalVisit,
    confidence,
  };
}

/**
 * 염증 상태에 따른 권장 사항 생성
 *
 * @param status - 잇몸 건강 상태
 * @returns 권장 사항 목록
 */
export function generateGumHealthRecommendations(status: GumHealthStatus): string[] {
  const recommendations: string[] = [];

  switch (status) {
    case 'healthy':
      recommendations.push('현재 잇몸 상태가 양호합니다.');
      recommendations.push('하루 2회 칫솔질과 매일 치실 사용을 유지하세요.');
      recommendations.push('6개월마다 정기 치과 검진을 권장합니다.');
      break;

    case 'mild_gingivitis':
      recommendations.push('경미한 잇몸 염증이 감지되었습니다.');
      recommendations.push('잇몸 관리 치약 사용을 권장합니다.');
      recommendations.push('부드러운 칫솔모로 잇몸 라인을 마사지하듯 닦아주세요.');
      recommendations.push('항균 구강청결제 사용을 고려해보세요.');
      recommendations.push('2주간 홈케어 후에도 개선되지 않으면 치과 방문을 권장합니다.');
      break;

    case 'moderate_gingivitis':
      recommendations.push('중등도 잇몸 염증이 감지되었습니다.');
      recommendations.push('가까운 시일 내 치과 방문을 권장합니다.');
      recommendations.push('전문 스케일링이 필요할 수 있습니다.');
      recommendations.push('잇몸 질환 전용 치약과 구강청결제를 사용하세요.');
      recommendations.push('치실 또는 치간 칫솔로 치아 사이를 꼼꼼히 청소하세요.');
      break;

    case 'severe_inflammation':
      recommendations.push('심한 잇몸 염증이 감지되었습니다.');
      recommendations.push('가능한 빨리 치과를 방문하세요.');
      recommendations.push('치주 질환으로 진행될 수 있어 전문 치료가 필요합니다.');
      recommendations.push('잇몸에서 피가 나더라도 부드럽게 닦아주세요.');
      recommendations.push('금연은 잇몸 건강 회복에 매우 중요합니다.');
      break;
  }

  return recommendations;
}

/**
 * 잇몸 상태 라벨 및 색상
 */
export const GUM_STATUS_CONFIG: Record<GumHealthStatus, {
  label: string;
  labelEn: string;
  color: string;
  bgColor: string;
  icon: 'check' | 'info' | 'warning' | 'alert';
  severity: number;  // 0-3
}> = {
  healthy: {
    label: '건강',
    labelEn: 'Healthy',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: 'check',
    severity: 0,
  },
  mild_gingivitis: {
    label: '경미한 염증',
    labelEn: 'Mild Gingivitis',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    icon: 'info',
    severity: 1,
  },
  moderate_gingivitis: {
    label: '중등도 염증',
    labelEn: 'Moderate Gingivitis',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    icon: 'warning',
    severity: 2,
  },
  severe_inflammation: {
    label: '심한 염증',
    labelEn: 'Severe Inflammation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: 'alert',
    severity: 3,
  },
};
