/**
 * 피부 상관관계 분석
 * @description 피부 Phase C: 생활 요인과 피부 컨디션 간의 상관관계 분석
 * @version 1.0
 * @date 2026-01-10
 */

import type { SkinDiaryEntry, CorrelationInsight, CorrelationFactor } from '@/types/skin-diary';
import { INSIGHT_TEMPLATES, DEFAULT_INSIGHTS } from '@/lib/mock/skin-diary';

// ================================================
// 분석 요인 정의
// ================================================

/** 분석할 요인 목록 */
const CORRELATION_FACTORS: CorrelationFactor[] = [
  { key: 'sleepHours', name: '수면 시간' },
  { key: 'sleepQuality', name: '수면 품질' },
  { key: 'waterIntakeMl', name: '수분 섭취' },
  { key: 'stressLevel', name: '스트레스', inverse: true },
  { key: 'morningRoutineCompleted', name: '아침 루틴' },
  { key: 'eveningRoutineCompleted', name: '저녁 루틴' },
];

// ================================================
// 피어슨 상관계수 계산
// ================================================

/**
 * 피어슨 상관계수 계산
 * @param x 첫 번째 변수 배열
 * @param y 두 번째 변수 배열
 * @returns 상관계수 (-1 ~ 1)
 */
export function calculatePearson(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) {
    return 0;
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * 신뢰도 계산 (데이터 수 기반)
 * @param dataCount 데이터 개수
 * @returns 신뢰도 (0-100)
 */
export function calculateConfidence(dataCount: number): number {
  if (dataCount < 7) return 30;
  if (dataCount < 14) return 50;
  if (dataCount < 21) return 70;
  if (dataCount < 30) return 85;
  return 95;
}

// ================================================
// 인사이트 생성
// ================================================

/**
 * 인사이트 텍스트 생성
 * @param factor 요인 정보
 * @param correlation 상관계수
 * @param entries 엔트리 배열 (평균 계산용)
 */
export function generateInsight(
  factor: CorrelationFactor,
  correlation: number,
  _entries: SkinDiaryEntry[] // 향후 평균 계산용 (현재 미사용)
): string {
  const template = INSIGHT_TEMPLATES[factor.key];
  if (!template) {
    return `${factor.name}이(가) 피부 상태에 영향을 줍니다`;
  }

  const absCorr = Math.abs(correlation);
  const percent = Math.round(absCorr * 30); // 상관계수를 대략적인 % 영향으로 변환

  // 역상관 요인 (스트레스) 처리
  const isPositiveEffect = factor.inverse ? correlation < 0 : correlation > 0;

  if (isPositiveEffect && absCorr > 0.3) {
    return template.positive.insight
      .replace('{threshold}', String(template.positive.threshold))
      .replace('{percent}', String(percent));
  } else if (!isPositiveEffect && absCorr > 0.3) {
    return template.negative.insight
      .replace('{threshold}', String(template.negative.threshold))
      .replace('{percent}', String(percent));
  }

  return `${factor.name}과 피부 상태 간에 약한 상관관계가 있어요`;
}

/**
 * 추천 텍스트 생성
 */
export function generateRecommendation(factor: CorrelationFactor, correlation: number): string {
  const template = INSIGHT_TEMPLATES[factor.key];
  if (!template) {
    return `${factor.name}을(를) 관리해보세요`;
  }

  const absCorr = Math.abs(correlation);
  const isPositiveEffect = factor.inverse ? correlation < 0 : correlation > 0;

  if (isPositiveEffect && absCorr > 0.3) {
    return template.positive.recommendation.replace(
      '{threshold}',
      String(template.positive.threshold)
    );
  } else if (!isPositiveEffect && absCorr > 0.3) {
    return template.negative.recommendation.replace(
      '{threshold}',
      String(template.negative.threshold)
    );
  }

  return `${factor.name}을(를) 꾸준히 기록해주세요`;
}

// ================================================
// 상관관계 분석
// ================================================

/**
 * 엔트리에서 특정 요인 값 추출
 */
function extractFactorValues(entries: SkinDiaryEntry[], factorKey: string): (number | null)[] {
  return entries.map((entry) => {
    switch (factorKey) {
      case 'sleepHours':
        return entry.sleepHours ?? null;
      case 'sleepQuality':
        return entry.sleepQuality ?? null;
      case 'waterIntakeMl':
        return entry.waterIntakeMl ?? null;
      case 'stressLevel':
        return entry.stressLevel ?? null;
      case 'morningRoutineCompleted':
        return entry.morningRoutineCompleted ? 1 : 0;
      case 'eveningRoutineCompleted':
        return entry.eveningRoutineCompleted ? 1 : 0;
      default:
        return null;
    }
  });
}

/**
 * 상관관계 분석 수행
 * @param entries 피부 일기 엔트리 배열
 * @param period 분석 기간
 * @returns 상관관계 인사이트 배열 (상관계수 절대값 순 정렬)
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- complex business logic
export function analyzeCorrelations(
  entries: SkinDiaryEntry[],
  period: '7days' | '30days' | '90days'
): CorrelationInsight[] {
  // 기간에 따른 필터링
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
  }

  const filteredEntries = entries.filter((e) => e.entryDate >= startDate && e.entryDate <= now);

  // 데이터가 부족하면 기본 인사이트 반환
  if (filteredEntries.length < 7) {
    return DEFAULT_INSIGHTS;
  }

  // 피부 컨디션 배열
  const skinConditions = filteredEntries.map((e) => e.skinCondition);

  // 각 요인별 상관관계 계산
  const insights: CorrelationInsight[] = [];

  for (const factor of CORRELATION_FACTORS) {
    const factorValues = extractFactorValues(filteredEntries, factor.key);

    // null이 아닌 값만 필터링
    const validPairs: { factor: number; condition: number }[] = [];
    for (let i = 0; i < factorValues.length; i++) {
      if (factorValues[i] !== null) {
        validPairs.push({
          factor: factorValues[i]!,
          condition: skinConditions[i],
        });
      }
    }

    // 유효한 데이터가 5개 미만이면 건너뛰기
    if (validPairs.length < 5) {
      continue;
    }

    const factorArray = validPairs.map((p) => p.factor);
    const conditionArray = validPairs.map((p) => p.condition);

    const correlation = calculatePearson(factorArray, conditionArray);
    const confidence = calculateConfidence(validPairs.length);

    // 상관계수 절대값이 0.2 이상일 때만 인사이트 추가
    if (Math.abs(correlation) >= 0.2) {
      const isPositive = factor.inverse ? correlation < 0 : correlation > 0;

      insights.push({
        factor: factor.name,
        factorKey: factor.key,
        correlation: Math.round(correlation * 100) / 100,
        confidence,
        insight: generateInsight(factor, correlation, filteredEntries),
        recommendation: generateRecommendation(factor, correlation),
        isPositive,
      });
    }
  }

  // 상관계수 절대값 순으로 정렬
  insights.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // 인사이트가 없으면 기본 인사이트 반환
  if (insights.length === 0) {
    return DEFAULT_INSIGHTS;
  }

  return insights;
}

// ================================================
// 기간별 평균 계산
// ================================================

/**
 * 특정 요인의 기간별 평균 계산
 */
export function calculateFactorAverage(
  entries: SkinDiaryEntry[],
  factorKey: string
): { average: number; count: number } {
  const values = extractFactorValues(entries, factorKey).filter((v) => v !== null) as number[];

  if (values.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  return {
    average: Math.round((sum / values.length) * 10) / 10,
    count: values.length,
  };
}

/**
 * 피부 컨디션 평균 계산
 */
export function calculateConditionAverage(entries: SkinDiaryEntry[]): number {
  if (entries.length === 0) return 0;

  const sum = entries.reduce((total, e) => total + e.skinCondition, 0);
  return Math.round((sum / entries.length) * 10) / 10;
}

// ================================================
// 트렌드 분석
// ================================================

/**
 * 피부 컨디션 트렌드 분석
 * @param entries 시간순 정렬된 엔트리 배열
 * @returns 선형 회귀 기울기 (양수: 개선, 음수: 악화)
 */
export function analyzeTrend(entries: SkinDiaryEntry[]): number {
  if (entries.length < 2) return 0;

  // x: 일수 (0부터 시작), y: 피부 컨디션
  const x = entries.map((_, i) => i);
  const y = entries.map((e) => e.skinCondition);

  const n = entries.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  return Math.round(slope * 100) / 100;
}

/**
 * 트렌드 해석
 */
export function interpretTrend(slope: number): {
  direction: 'improving' | 'stable' | 'declining';
  message: string;
} {
  if (slope > 0.05) {
    return {
      direction: 'improving',
      message: '피부 상태가 점점 좋아지고 있어요! 🌟',
    };
  } else if (slope < -0.05) {
    return {
      direction: 'declining',
      message: '피부 상태가 조금 저하되고 있어요. 생활 습관을 점검해보세요.',
    };
  }

  return {
    direction: 'stable',
    message: '피부 상태가 안정적으로 유지되고 있어요.',
  };
}
