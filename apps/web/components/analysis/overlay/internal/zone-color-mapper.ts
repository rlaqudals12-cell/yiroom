/**
 * A-2: 점수→색상+패턴 매핑 + 메이크업 존 스타일
 *
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md A-2
 */

import type { OverlayMode } from './overlay-tokens';
import { getZoneStyle, SCORE_COLORS } from './overlay-tokens';

/** 존 시각 스타일 */
export interface ZoneVisualStyle {
  fill: string;
  stroke: string;
  strokeDasharray?: string;
  icon: string;
  opacity: number;
  badgeText: string;
}

/** 메이크업 존 시각 스타일 */
export interface MakeupZoneVisualStyle {
  fill: string;
  stroke: string;
  opacity: number;
  colorHex: string;
  categoryLabel: string;
}

/** 하이라이트 가능한 메트릭 키 */
export type HighlightableMetric =
  | 'hydration'
  | 'oiliness'
  | 'pores'
  | 'texture'
  | 'pigmentation'
  | 'sensitivity'
  | 'elasticity';

/** 메트릭 한국어 라벨 */
export const METRIC_LABELS: Record<HighlightableMetric, string> = {
  hydration: '수분도',
  oiliness: '유분도',
  pores: '모공',
  texture: '피부결',
  pigmentation: '색소침착',
  sensitivity: '민감도',
  elasticity: '탄력',
};

/** 종합 점수 기반 시각 스타일 */
export function computeZoneVisualStyle(score: number, mode: OverlayMode): ZoneVisualStyle {
  const baseStyle = getZoneStyle(score, mode);
  const clamped = Math.max(0, Math.min(100, score));
  return {
    ...baseStyle,
    opacity: 1.0 - (clamped / 100) * 0.6,
    badgeText: `${Math.round(score)}`,
  };
}

/** 특정 지표 기반 시각 스타일 (sensitivity는 반전) */
export function computeHighlightedZoneStyle(
  metrics: Record<HighlightableMetric, number>,
  highlightMetric: HighlightableMetric | undefined,
  overallScore: number,
  mode: OverlayMode
): ZoneVisualStyle {
  if (!highlightMetric) return computeZoneVisualStyle(overallScore, mode);
  const raw = metrics[highlightMetric];
  const normalized = highlightMetric === 'sensitivity' ? 100 - raw : raw;
  return { ...computeZoneVisualStyle(normalized, mode), badgeText: `${Math.round(raw)}` };
}

/** 메이크업 추천색 → 존 오버레이 스타일 */
export function computeMakeupZoneStyle(
  colorHex: string,
  categoryLabel: string,
  isActive: boolean
): MakeupZoneVisualStyle {
  return {
    fill: isActive ? `${colorHex}66` : 'rgba(156, 163, 175, 0.1)',
    stroke: isActive ? colorHex : 'rgba(156, 163, 175, 0.3)',
    opacity: isActive ? 0.6 : 0.15,
    colorHex,
    categoryLabel,
  };
}

/** 점수 → 등급 라벨 */
export function getScoreTierLabel(score: number): string {
  const s = Math.max(0, Math.min(100, score));
  if (s <= 30) return SCORE_COLORS.critical.label;
  if (s <= 50) return SCORE_COLORS.poor.label;
  if (s <= 65) return SCORE_COLORS.fair.label;
  if (s <= 80) return SCORE_COLORS.good.label;
  return SCORE_COLORS.excellent.label;
}
