/**
 * S-1 피부 Identity Label 생성
 *
 * skinType + 주요 고민(dominant concern)을 조합한 복합 라벨
 * @see docs/adr/ADR-080-identity-first-result-framing.md
 */

import type { SkinTypeV2 } from './types';
import { SKIN_TYPE_LABELS } from './types';

/** 점수 구성 요소 (V2 형식) */
interface ScoreBreakdown {
  hydration: number;
  elasticity: number;
  clarity: number;
  tone: number;
}

/** 메트릭 배열 항목 (V1 형식) */
interface MetricItem {
  id: string;
  value: number;
}

// 고민 기반 수식어 매핑
const CONCERN_QUALIFIERS: Record<string, string> = {
  hydration: '수분 부족',
  elasticity: '탄력 케어',
  clarity: '투명 맑은',
  tone: '톤 케어',
};

// V1 메트릭 ID → 고민 키 매핑
const METRIC_TO_CONCERN: Record<string, string> = {
  hydration: 'hydration',
  moisture: 'hydration',
  elasticity: 'elasticity',
  wrinkles: 'elasticity',
  pigmentation: 'clarity',
  spots: 'clarity',
  tone: 'tone',
  brightness: 'tone',
};

// skinType 기본 수식어 (고민이 두드러지지 않을 때)
const DEFAULT_QUALIFIERS: Record<SkinTypeV2, string> = {
  dry: '수분 부족',
  oily: '유분 활발',
  combination: '밸런스',
  normal: '균형 잡힌',
  sensitive: '고민감',
};

/**
 * 가장 낮은 점수의 고민 영역을 식별
 * 점수가 모두 70 이상이면 null (특별한 고민 없음)
 */
function findDominantConcern(breakdown: ScoreBreakdown): string | null {
  const entries = Object.entries(breakdown) as [keyof ScoreBreakdown, number][];
  const sorted = entries.sort((a, b) => a[1] - b[1]);
  const [lowestKey, lowestValue] = sorted[0];

  if (lowestValue >= 70) return null;

  return lowestKey;
}

/**
 * 메트릭 배열에서 ScoreBreakdown을 추출
 */
function metricsToBreakdown(metrics: MetricItem[]): ScoreBreakdown {
  const breakdown: ScoreBreakdown = { hydration: 75, elasticity: 75, clarity: 75, tone: 75 };

  for (const m of metrics) {
    const concernKey = METRIC_TO_CONCERN[m.id];
    if (concernKey && concernKey in breakdown) {
      // 같은 키에 여러 메트릭이 매핑되면 낮은 값 우선
      const key = concernKey as keyof ScoreBreakdown;
      breakdown[key] = Math.min(breakdown[key], m.value);
    }
  }

  return breakdown;
}

/**
 * S-1 피부 정체성 라벨 생성
 *
 * @example
 * generateSkinIdentityLabel('sensitive', { hydration: 45, elasticity: 60, clarity: 70, tone: 65 })
 * // → "수분 부족 민감성 타입"
 *
 * generateSkinIdentityLabel('normal', { hydration: 80, elasticity: 85, clarity: 78, tone: 82 })
 * // → "균형 잡힌 정상 타입"
 */
export function generateSkinIdentityLabel(
  skinType: SkinTypeV2,
  scoreBreakdown: ScoreBreakdown
): string {
  const typeLabel = SKIN_TYPE_LABELS[skinType];
  const dominantConcern = findDominantConcern(scoreBreakdown);

  if (dominantConcern && CONCERN_QUALIFIERS[dominantConcern]) {
    return `${CONCERN_QUALIFIERS[dominantConcern]} ${typeLabel} 타입`;
  }

  return `${DEFAULT_QUALIFIERS[skinType]} ${typeLabel} 타입`;
}

/**
 * 메트릭 배열로부터 피부 정체성 라벨 생성 (V1 결과 페이지용)
 *
 * @example
 * generateSkinIdentityLabelFromMetrics('oily', [
 *   { id: 'hydration', value: 42 },
 *   { id: 'oil', value: 78 },
 *   { id: 'elasticity', value: 65 },
 * ])
 * // → "수분 부족 지성 타입"
 */
export function generateSkinIdentityLabelFromMetrics(
  skinType: SkinTypeV2,
  metrics: MetricItem[]
): string {
  const breakdown = metricsToBreakdown(metrics);
  return generateSkinIdentityLabel(skinType, breakdown);
}
