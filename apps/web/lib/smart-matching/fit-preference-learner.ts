/**
 * 핏 선호도 자동 학습 모듈
 *
 * @description 사용자의 사이즈 피드백 패턴을 분석하여 선호 핏을 자동 업데이트.
 * 3회 이상 일관된 피드백이 쌓이면 preferredFit을 진화시킵니다.
 *
 * @example
 * ```typescript
 * const suggestion = analyzeFitPattern(feedbackHistory);
 * if (suggestion.shouldUpdate) {
 *   await applyFitPreferenceLearning(userId);
 * }
 * ```
 */

import type { SizeFit, PreferredFit } from '@/types/smart-matching';

// =============================================================================
// 상수
// =============================================================================

/** 학습에 필요한 최소 피드백 수 */
const MIN_FEEDBACK_COUNT = 3;

/** 일관성 임계값 (해당 피드백 비율이 이 이상이면 패턴으로 인정) */
const CONSISTENCY_THRESHOLD = 0.6;

/** 피드백 분석 시 최근 N개만 사용 (오래된 데이터 무시) */
const RECENT_FEEDBACK_LIMIT = 10;

// =============================================================================
// 타입
// =============================================================================

export interface FitFeedbackEntry {
  sizeFit: SizeFit;
  category: string;
  createdAt: Date | string;
}

export interface FitPatternAnalysis {
  /** 현재 선호 핏 */
  currentFit: PreferredFit;
  /** 추천하는 새 핏 */
  suggestedFit: PreferredFit;
  /** 업데이트 필요 여부 */
  shouldUpdate: boolean;
  /** 신뢰도 (0-1) */
  confidence: number;
  /** 분석 근거 */
  reasoning: string;
  /** 분석에 사용된 피드백 수 */
  feedbackCount: number;
  /** 피드백 분포 */
  distribution: {
    small: number;
    perfect: number;
    large: number;
  };
}

// =============================================================================
// 핵심 분석 함수
// =============================================================================

/**
 * 피드백 패턴 분석
 *
 * @description 최근 피드백을 분석하여 사용자의 실제 핏 선호도를 추론합니다.
 * - 'small' 피드백이 60%+ → 현재 tight 선호인데 regular/loose가 맞음
 * - 'large' 피드백이 60%+ → 현재 loose 선호인데 tight/regular가 맞음
 * - 'perfect' 피드백이 60%+ → 현재 핏이 적절함
 */
export function analyzeFitPattern(
  feedbackHistory: FitFeedbackEntry[],
  currentFit: PreferredFit
): FitPatternAnalysis {
  // 최근 피드백만 사용
  const recentFeedback = feedbackHistory
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_FEEDBACK_LIMIT);

  const total = recentFeedback.length;

  // 피드백 부족
  if (total < MIN_FEEDBACK_COUNT) {
    return {
      currentFit,
      suggestedFit: currentFit,
      shouldUpdate: false,
      confidence: 0,
      reasoning: `피드백이 ${total}개로 분석에 필요한 최소 ${MIN_FEEDBACK_COUNT}개에 미달합니다.`,
      feedbackCount: total,
      distribution: { small: 0, perfect: 0, large: 0 },
    };
  }

  // 분포 계산
  const distribution = {
    small: recentFeedback.filter((f) => f.sizeFit === 'small').length,
    perfect: recentFeedback.filter((f) => f.sizeFit === 'perfect').length,
    large: recentFeedback.filter((f) => f.sizeFit === 'large').length,
  };

  const smallRatio = distribution.small / total;
  const perfectRatio = distribution.perfect / total;
  const largeRatio = distribution.large / total;

  // 패턴 판정
  const suggestedFit = inferPreferredFit(currentFit, smallRatio, perfectRatio, largeRatio);
  const shouldUpdate = suggestedFit !== currentFit;
  const confidence = Math.max(smallRatio, perfectRatio, largeRatio);

  let reasoning: string;
  if (!shouldUpdate) {
    reasoning = `현재 ${FIT_LABELS[currentFit]} 핏이 적절합니다 (perfect ${Math.round(perfectRatio * 100)}%).`;
  } else if (smallRatio >= CONSISTENCY_THRESHOLD) {
    reasoning = `'작아요' 피드백이 ${Math.round(smallRatio * 100)}%로, ${FIT_LABELS[suggestedFit]} 핏으로 변경을 권장합니다.`;
  } else if (largeRatio >= CONSISTENCY_THRESHOLD) {
    reasoning = `'커요' 피드백이 ${Math.round(largeRatio * 100)}%로, ${FIT_LABELS[suggestedFit]} 핏으로 변경을 권장합니다.`;
  } else {
    reasoning = `피드백이 혼재되어 있어 현재 핏을 유지합니다.`;
  }

  return {
    currentFit,
    suggestedFit,
    shouldUpdate,
    confidence,
    reasoning,
    feedbackCount: total,
    distribution,
  };
}

// =============================================================================
// 내부 로직
// =============================================================================

const FIT_LABELS: Record<PreferredFit, string> = {
  tight: '타이트',
  regular: '레귤러',
  loose: '루즈',
};

/**
 * 피드백 비율에서 새 핏 추론
 *
 * 핵심 로직:
 * - small이 많다 → 사이즈가 작다 → 더 큰 핏으로 이동 (tight→regular, regular→loose)
 * - large가 많다 → 사이즈가 크다 → 더 작은 핏으로 이동 (loose→regular, regular→tight)
 * - perfect가 많다 → 현재 핏 유지
 */
function inferPreferredFit(
  current: PreferredFit,
  smallRatio: number,
  _perfectRatio: number,
  largeRatio: number
): PreferredFit {
  // "작다"가 주로 나오면 → 한 단계 루즈하게
  if (smallRatio >= CONSISTENCY_THRESHOLD) {
    if (current === 'tight') return 'regular';
    if (current === 'regular') return 'loose';
    // 이미 loose인데도 작다면 → loose 유지 (더 이상 올릴 수 없음)
    return 'loose';
  }

  // "크다"가 주로 나오면 → 한 단계 타이트하게
  if (largeRatio >= CONSISTENCY_THRESHOLD) {
    if (current === 'loose') return 'regular';
    if (current === 'regular') return 'tight';
    // 이미 tight인데도 크다면 → tight 유지
    return 'tight';
  }

  // 혼재 또는 perfect 다수 → 현재 유지
  return current;
}

/**
 * 핏 변경 시 사용자에게 보여줄 알림 메시지 생성
 */
export function generateFitUpdateMessage(analysis: FitPatternAnalysis): string {
  if (!analysis.shouldUpdate) {
    return `현재 ${FIT_LABELS[analysis.currentFit]} 핏 설정이 잘 맞고 있어요!`;
  }

  const fromLabel = FIT_LABELS[analysis.currentFit];
  const toLabel = FIT_LABELS[analysis.suggestedFit];

  return `최근 피드백을 분석한 결과, ${fromLabel} → ${toLabel} 핏으로 변경하면 더 잘 맞을 것 같아요. (${analysis.feedbackCount}건 분석, 신뢰도 ${Math.round(analysis.confidence * 100)}%)`;
}
