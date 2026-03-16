/**
 * 아이섀도 시뮬레이션 엔진 (모바일)
 * @description 눈꺼풀 영역 아이섀도 색상 계산
 *
 * 웹 버전의 Canvas 렌더링 대신 색상 매핑 데이터만 계산.
 * 실제 렌더링은 React Native 컴포넌트에서 처리.
 */

import type { EyeshadowConfig, RgbaColor } from './types';

/** 기본 아이섀도 강도 */
const DEFAULT_EYESHADOW_OPACITY = 0.4;

/** 아이섀도 블렌딩 결과 */
export interface EyeshadowResult {
  /** 적용된 설정 */
  config: EyeshadowConfig;
  /** 블렌딩된 최종 색상 (미리보기용) */
  blendedColor: RgbaColor;
  /** 듀얼 컬러 블렌딩 색상 (secondaryColor 있을 때) */
  blendedSecondaryColor?: RgbaColor;
  /** 처리 시간 (ms) */
  processingTimeMs: number;
}

/**
 * 아이섀도 미리보기 색상 계산
 * 모바일에서는 Canvas 대신 색상 데이터만 계산
 */
export function calculateEyeshadowPreview(config: EyeshadowConfig): EyeshadowResult {
  const startTime = Date.now();
  const opacity = config.opacity ?? DEFAULT_EYESHADOW_OPACITY;

  // 기본 색상에 투명도 적용
  const blendedColor: RgbaColor = {
    r: Math.round(config.color.r * opacity + 255 * (1 - opacity)),
    g: Math.round(config.color.g * opacity + 255 * (1 - opacity)),
    b: Math.round(config.color.b * opacity + 255 * (1 - opacity)),
    a: opacity,
  };

  let blendedSecondaryColor: RgbaColor | undefined;
  if (config.secondaryColor) {
    blendedSecondaryColor = {
      r: Math.round(config.secondaryColor.r * opacity + 255 * (1 - opacity)),
      g: Math.round(config.secondaryColor.g * opacity + 255 * (1 - opacity)),
      b: Math.round(config.secondaryColor.b * opacity + 255 * (1 - opacity)),
      a: opacity,
    };
  }

  return {
    config,
    blendedColor,
    blendedSecondaryColor,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * 듀얼 컬러 보간
 * 내측(primaryColor)에서 외측(secondaryColor)로 그래디언트
 */
export function interpolateDualColor(
  t: number,
  primaryColor: RgbaColor,
  secondaryColor: RgbaColor
): RgbaColor {
  const clampedT = Math.max(0, Math.min(1, t));
  if (clampedT <= 0.5) return primaryColor;
  const blendT = (clampedT - 0.5) * 2;
  return {
    r: Math.round(primaryColor.r * (1 - blendT) + secondaryColor.r * blendT),
    g: Math.round(primaryColor.g * (1 - blendT) + secondaryColor.g * blendT),
    b: Math.round(primaryColor.b * (1 - blendT) + secondaryColor.b * blendT),
    a: 1,
  };
}
