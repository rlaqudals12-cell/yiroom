/**
 * AI 분석 신뢰도 유틸리티
 *
 * 신뢰도 수준 계산, 색상 매핑, 한국어 라벨
 */

/** 신뢰도 수준 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'fallback';

/** 신뢰도 정보 */
export interface ConfidenceLevelInfo {
  level: ConfidenceLevel;
  label: string;
  description: string;
}

/**
 * 신뢰도 수치 → 수준 변환
 *
 * @param confidence - 0~100 사이 신뢰도 값
 * @param usedFallback - Mock 데이터 사용 여부
 */
export function getConfidenceLevel(
  confidence: number,
  usedFallback: boolean = false
): ConfidenceLevel {
  if (usedFallback) return 'fallback';
  if (confidence >= 80) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
}

/**
 * 신뢰도 수준 → 한국어 라벨 + 설명
 */
export function getConfidenceLevelInfo(
  confidence: number,
  usedFallback: boolean = false
): ConfidenceLevelInfo {
  const level = getConfidenceLevel(confidence, usedFallback);

  const info: Record<ConfidenceLevel, Omit<ConfidenceLevelInfo, 'level'>> = {
    high: {
      label: '높은 신뢰도',
      description: 'AI가 높은 확신으로 분석한 결과입니다.',
    },
    medium: {
      label: '보통 신뢰도',
      description: '참고용으로 활용해주세요. 조명이나 각도에 따라 결과가 달라질 수 있습니다.',
    },
    low: {
      label: '낮은 신뢰도',
      description: '이미지 품질이 분석에 적합하지 않을 수 있습니다. 다시 촬영해보세요.',
    },
    fallback: {
      label: '샘플 결과',
      description: '실제 AI 분석이 아닌 참고용 샘플 데이터입니다.',
    },
  };

  return { level, ...info[level] };
}

/**
 * 신뢰도 수준별 테마 색상 키
 *
 * useTheme()의 trust/score 색상과 매핑
 */
export function getConfidenceColorKey(
  level: ConfidenceLevel
): 'excellent' | 'good' | 'caution' | 'poor' {
  switch (level) {
    case 'high':
      return 'excellent';
    case 'medium':
      return 'good';
    case 'low':
      return 'caution';
    case 'fallback':
      return 'poor';
  }
}

/**
 * 신뢰도 접근성 라벨
 */
export function getConfidenceA11yLabel(
  confidence: number,
  usedFallback: boolean = false
): string {
  const info = getConfidenceLevelInfo(confidence, usedFallback);
  return `${info.label}, ${Math.round(confidence)}%. ${info.description}`;
}
