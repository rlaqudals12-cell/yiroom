/**
 * 인사이트 우선순위 점수 계산
 *
 * @module lib/insights/scoring
 * @description 다양한 요소를 기반으로 인사이트 우선순위 점수 계산
 */

import type {
  InsightCategory,
  InsightPriority,
  AnalysisModule,
  AnalysisDataBundle,
} from './types';

// ============================================
// 점수 가중치 상수
// ============================================

/**
 * 카테고리별 기본 점수 (0-30)
 */
const CATEGORY_BASE_SCORES: Record<InsightCategory, number> = {
  health_alert: 30, // 건강 관련 최우선
  skin_care: 25, // 스킨케어 높은 우선순위
  color_match: 22, // 컬러 매칭
  style_tip: 20, // 스타일 팁
  product_recommendation: 18, // 제품 추천
  routine_suggestion: 15, // 루틴 제안
  synergy: 12, // 시너지 (보너스 성격)
};

/**
 * 관련 모듈 수에 따른 보너스 (0-20)
 * 여러 모듈이 연결될수록 가치 있는 인사이트
 */
const MODULE_COUNT_BONUS: Record<number, number> = {
  1: 0,
  2: 10,
  3: 15,
  4: 18,
  5: 20,
  6: 20, // 최대값
};

/**
 * 분석 결과 신뢰도에 따른 보너스 (0-20)
 */
const CONFIDENCE_THRESHOLDS = {
  high: { min: 80, bonus: 20 },
  medium: { min: 60, bonus: 12 },
  low: { min: 40, bonus: 5 },
  veryLow: { min: 0, bonus: 0 },
};

/**
 * 데이터 완성도에 따른 보너스 (0-15)
 */
const COMPLETENESS_BONUS_FACTOR = 15;

/**
 * 신선도 (최근 분석)에 따른 보너스 (0-15)
 */
const FRESHNESS_BONUS = {
  within1Day: 15,
  within7Days: 10,
  within30Days: 5,
  older: 0,
};

// ============================================
// 점수 계산 함수
// ============================================

/**
 * 카테고리 기본 점수 조회
 */
export function getCategoryBaseScore(category: InsightCategory): number {
  return CATEGORY_BASE_SCORES[category] ?? 10;
}

/**
 * 관련 모듈 수 보너스 계산
 */
export function getModuleCountBonus(moduleCount: number): number {
  const count = Math.min(moduleCount, 6);
  return MODULE_COUNT_BONUS[count] ?? 0;
}

/**
 * 신뢰도 기반 보너스 계산
 */
export function getConfidenceBonus(confidence: number): number {
  if (confidence >= CONFIDENCE_THRESHOLDS.high.min) {
    return CONFIDENCE_THRESHOLDS.high.bonus;
  }
  if (confidence >= CONFIDENCE_THRESHOLDS.medium.min) {
    return CONFIDENCE_THRESHOLDS.medium.bonus;
  }
  if (confidence >= CONFIDENCE_THRESHOLDS.low.min) {
    return CONFIDENCE_THRESHOLDS.low.bonus;
  }
  return CONFIDENCE_THRESHOLDS.veryLow.bonus;
}

/**
 * 데이터 완성도 보너스 계산
 *
 * @param dataBundle - 분석 데이터 번들
 * @returns 완성도 점수 (0-15)
 */
export function getCompletenessBonus(dataBundle: AnalysisDataBundle): number {
  const modules = [
    dataBundle.personalColor,
    dataBundle.skin,
    dataBundle.body,
    dataBundle.face,
    dataBundle.hair,
    dataBundle.oralHealth,
  ];

  const completedCount = modules.filter((m) => m !== null && m !== undefined).length;
  const completenessRatio = completedCount / modules.length;

  return Math.round(completenessRatio * COMPLETENESS_BONUS_FACTOR);
}

/**
 * 분석 신선도 보너스 계산
 *
 * @param analysisDate - 분석 날짜
 * @returns 신선도 점수 (0-15)
 */
export function getFreshnessBonus(analysisDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - analysisDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) return FRESHNESS_BONUS.within1Day;
  if (diffDays <= 7) return FRESHNESS_BONUS.within7Days;
  if (diffDays <= 30) return FRESHNESS_BONUS.within30Days;
  return FRESHNESS_BONUS.older;
}

/**
 * 종합 우선순위 점수 계산
 *
 * @description
 * 점수 구성:
 * - 카테고리 기본점수: 0-30
 * - 모듈 수 보너스: 0-20
 * - 신뢰도 보너스: 0-20
 * - 완성도 보너스: 0-15
 * - 신선도 보너스: 0-15
 * 총합: 0-100
 */
export function calculatePriorityScore(params: {
  category: InsightCategory;
  relatedModules: AnalysisModule[];
  confidence?: number;
  dataBundle?: AnalysisDataBundle;
  analysisDate?: Date;
}): number {
  const { category, relatedModules, confidence = 70, dataBundle, analysisDate } = params;

  // 1. 카테고리 기본 점수
  let score = getCategoryBaseScore(category);

  // 2. 모듈 수 보너스
  score += getModuleCountBonus(relatedModules.length);

  // 3. 신뢰도 보너스
  score += getConfidenceBonus(confidence);

  // 4. 완성도 보너스 (데이터 번들이 있는 경우)
  if (dataBundle) {
    score += getCompletenessBonus(dataBundle);
  }

  // 5. 신선도 보너스 (분석 날짜가 있는 경우)
  if (analysisDate) {
    score += getFreshnessBonus(analysisDate);
  }

  // 최대 100점으로 클램프
  return Math.min(100, Math.max(0, score));
}

/**
 * 점수를 우선순위 레이블로 변환
 */
export function scoreToPriority(score: number): InsightPriority {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * 우선순위 레이블을 점수 범위로 변환
 */
export function priorityToScoreRange(priority: InsightPriority): { min: number; max: number } {
  switch (priority) {
    case 'critical':
      return { min: 80, max: 100 };
    case 'high':
      return { min: 60, max: 79 };
    case 'medium':
      return { min: 40, max: 59 };
    case 'low':
      return { min: 0, max: 39 };
  }
}

/**
 * 인사이트 배열을 점수 기준으로 정렬
 */
export function sortByPriorityScore<T extends { priorityScore: number }>(insights: T[]): T[] {
  return [...insights].sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * 최소 점수 이상의 인사이트만 필터링
 */
export function filterByMinScore<T extends { priorityScore: number }>(
  insights: T[],
  minScore: number
): T[] {
  return insights.filter((insight) => insight.priorityScore >= minScore);
}
