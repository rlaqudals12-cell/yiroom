/**
 * 파운데이션 시뮬레이션 엔진 (모바일)
 * @description 얼굴 전체 파운데이션 셰이드 계산
 *
 * 웹 버전의 Canvas 렌더링 대신 색상 매핑 데이터만 계산.
 * 실제 렌더링은 React Native 컴포넌트에서 처리.
 */

import type { FoundationConfig, RgbaColor } from './types';

/** 기본 파운데이션 강도 (자연스러운 커버) */
const DEFAULT_FOUNDATION_OPACITY = 0.25;

/** 파운데이션 블렌딩 결과 */
export interface FoundationResult {
  /** 적용된 설정 */
  config: FoundationConfig;
  /** 블렌딩된 최종 색상 (미리보기용) */
  blendedColor: RgbaColor;
  /** 가장자리 페이드 색상 */
  edgeFadeColor: RgbaColor;
  /** 처리 시간 (ms) */
  processingTimeMs: number;
}

/**
 * 파운데이션 미리보기 색상 계산
 * 모바일에서는 Canvas 대신 색상 데이터만 계산
 */
export function calculateFoundationPreview(config: FoundationConfig): FoundationResult {
  const startTime = Date.now();
  const opacity = config.opacity ?? DEFAULT_FOUNDATION_OPACITY;

  // 피부톤과 블렌딩된 색상 (미리보기용)
  const blendedColor: RgbaColor = {
    r: Math.round(config.color.r * opacity + 230 * (1 - opacity)),
    g: Math.round(config.color.g * opacity + 210 * (1 - opacity)),
    b: Math.round(config.color.b * opacity + 190 * (1 - opacity)),
    a: opacity,
  };

  // 가장자리 페이드 색상 (opacity의 30%로 감소)
  const edgeOpacity = opacity * 0.3;
  const edgeFadeColor: RgbaColor = {
    r: Math.round(config.color.r * edgeOpacity + 230 * (1 - edgeOpacity)),
    g: Math.round(config.color.g * edgeOpacity + 210 * (1 - edgeOpacity)),
    b: Math.round(config.color.b * edgeOpacity + 190 * (1 - edgeOpacity)),
    a: edgeOpacity,
  };

  return {
    config,
    blendedColor,
    edgeFadeColor,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * 가장자리 페이드아웃 알파 계산
 * 얼굴 중심에서 가장자리로 갈수록 투명해짐
 *
 * @param normalizedDist - 얼굴 중심으로부터의 정규화된 거리 (0~1)
 * @param opacity - 기본 투명도
 * @returns 최종 알파값
 */
export function computeFoundationAlpha(normalizedDist: number, opacity: number): number {
  // 0.7 이내 = 풀 커버, 0.7~1.0 = 페이드아웃
  if (normalizedDist <= 0.7) return opacity;
  const edgeFalloff = Math.max(0, 1.0 - (normalizedDist - 0.7) / 0.3);
  return opacity * edgeFalloff * edgeFalloff;
}
