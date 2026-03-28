/**
 * P1-2: 오버레이 디자인 토큰
 *
 * @description 7모듈 시각적 오버레이의 공통 디자인 토큰
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md 섹션 2.1
 * @see docs/adr/ADR-097-visual-overlay-anonymous-share.md D4 (강점 하이라이트)
 */

// =============================================================================
// 오버레이 모드 타입
// =============================================================================

/** 오버레이 표시 모드 */
export type OverlayMode = 'strength' | 'full';

// =============================================================================
// 디자인 토큰
// =============================================================================

/**
 * 오버레이 공통 디자인 토큰
 * - 강점 모드: 에메랄드 계열 (긍정적 인상)
 * - 약점 모드: 빨강 계열 (주의 영역)
 * - 중립: 회색 계열 + 점선 (색맹 대응 ADR-097 D7)
 */
export const OVERLAY_TOKENS = {
  // 강점 모드 (기본값)
  strengthColor: 'rgba(16, 185, 129, 0.35)',
  strengthBorder: 'rgba(16, 185, 129, 0.8)',
  strengthIcon: 'check-circle' as const,

  // 약점 (전체 보기 모드)
  weaknessColor: 'rgba(239, 68, 68, 0.3)',
  weaknessBorder: 'rgba(239, 68, 68, 0.7)',
  weaknessIcon: 'alert-triangle' as const,

  // 중립
  neutralColor: 'rgba(156, 163, 175, 0.2)',
  neutralBorder: 'rgba(156, 163, 175, 0.5)',
  neutralPattern: 'dashed' as const,

  // 공통
  overlayOpacity: 0.35,
  badgeRadius: 20,
  lineWidth: { active: 2, inactive: 1 } as const,
  fontFamily: 'inherit',
} as const;

/** OVERLAY_TOKENS 타입 */
export type OverlayTokens = typeof OVERLAY_TOKENS;

// =============================================================================
// 점수→색상 매핑 (zone-heatmap-data.ts SCORE_COLOR_RANGES와 일치)
// =============================================================================

/** 점수 구간별 색상 정의 */
export const SCORE_COLORS = {
  critical: { fill: 'rgba(239, 68, 68, 0.4)', stroke: '#EF4444', label: '심각' },
  poor: { fill: 'rgba(249, 115, 22, 0.35)', stroke: '#F97316', label: '나쁨' },
  fair: { fill: 'rgba(234, 179, 8, 0.3)', stroke: '#EAB308', label: '보통' },
  good: { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22C55E', label: '양호' },
  excellent: { fill: 'rgba(16, 185, 129, 0.35)', stroke: '#10B981', label: '우수' },
} as const;

/**
 * 점수(0-100)를 모드에 따른 시각 스타일로 변환
 * - strength 모드: 좋은 점수만 강조, 나머지는 중립
 * - full 모드: 모든 점수를 색상으로 표시
 */
export function getZoneStyle(
  score: number,
  mode: OverlayMode
): { fill: string; stroke: string; strokeDasharray?: string; icon: string } {
  const tier = getScoreTier(score);

  // 강점 모드에서 좋은 점수가 아니면 중립 처리
  if (mode === 'strength' && (tier === 'critical' || tier === 'poor' || tier === 'fair')) {
    return {
      fill: OVERLAY_TOKENS.neutralColor,
      stroke: OVERLAY_TOKENS.neutralBorder,
      strokeDasharray: '4 2',
      icon: '',
    };
  }

  const colorDef = SCORE_COLORS[tier];
  return {
    fill: colorDef.fill,
    stroke: colorDef.stroke,
    icon:
      tier === 'good' || tier === 'excellent'
        ? OVERLAY_TOKENS.strengthIcon
        : OVERLAY_TOKENS.weaknessIcon,
  };
}

/** 점수→등급 변환 */
function getScoreTier(score: number): keyof typeof SCORE_COLORS {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped <= 30) return 'critical';
  if (clamped <= 50) return 'poor';
  if (clamped <= 65) return 'fair';
  if (clamped <= 80) return 'good';
  return 'excellent';
}
