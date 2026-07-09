/**
 * 드레이프 반사광 효과 모듈
 * @description PC-1+ 드레이핑 시뮬레이션 - 금속 반사광 + 드레이프 색상 적용(체험 렌더)
 *
 * 순위/균일도 측정 로직 제거(2026-07): 드레이프 색은 얼굴 '밖'(목/어깨)에만 칠해지고
 * 금속 반사광은 색과 무관하게 적용되므로, 얼굴 영역 균일도는 색에 따라 유의미하게 달라지지
 * 않는다(모든 색이 사실상 동률). "베스트 컬러 순위·별점"은 측정 신호가 없는 지어낸 수치였기에
 * 삭제했고, 시뮬레이터는 '어울림을 판정하는 도구'가 아니라 '직접 대보는 체험 렌더 도구'로 남는다.
 * 추천 후보는 진단 정본(PC 결과의 bestColors)이 담당한다.
 */

import type { MetalType, ReflectanceConfig } from '@/types/visual-analysis';
import { rgbaToHsl, hslToRgba } from './canvas-utils';

// ============================================
// 금속 반사광 설정
// ============================================

/**
 * 금속별 반사광 설정
 * - 실버: 쿨톤 강조 (밝게 + 채도 낮춤)
 * - 골드: 웜톤 강조 (약간 밝게 + 채도 높임)
 */
export const METAL_REFLECTANCE: Record<MetalType, ReflectanceConfig> = {
  silver: { brightness: +10, saturation: -5 },
  gold: { brightness: +5, saturation: +5 },
};

// ============================================
// 드레이프 레이아웃 상수
// ============================================

/**
 * 드레이프(천) 영역 배치 — "얼굴 아래에 천을 대본다"는 은유에 맞춤.
 * - START: 얼굴 아래(목/어깨)에서 시작. 얼굴 침범을 줄이기 위해 하단 28%만 사용.
 * - FADE: 상단 경계 부드러운 전환 구간.
 * - MAX_BLEND: 반투명 천 느낌(단색 도포 방지). 마스크가 부정확해 얼굴에 번지더라도
 *   불투명 단색이 아니라 은은한 틴트로 보이게 해 "얼굴 절반이 단색" 현상을 완화.
 */
const DRAPE_START_RATIO = 0.72;
const DRAPE_FADE_RATIO = 0.08;
const DRAPE_MAX_BLEND = 0.68;

// ============================================
// 반사광 적용
// ============================================

/**
 * 얼굴 영역에 반사광 효과 적용
 * @param ctx - Canvas 2D 컨텍스트
 * @param faceMask - 얼굴 마스크
 * @param config - 반사광 설정
 */
export function applyReflectance(
  ctx: CanvasRenderingContext2D,
  faceMask: Uint8Array,
  config: ReflectanceConfig
): void {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    if (faceMask[pixelIndex] === 0) continue;

    // RGB → HSL 변환
    const { h, s, l } = rgbaToHsl(data[i], data[i + 1], data[i + 2]);

    // 밝기/채도 조정
    const newL = Math.max(0, Math.min(1, l + config.brightness / 100));
    const newS = Math.max(0, Math.min(1, s + config.saturation / 100));

    // HSL → RGB 변환
    const { r, g, b } = hslToRgba(h, newS, newL);

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * 금속 타입에 따른 반사광 적용
 */
export function applyMetalReflectance(
  ctx: CanvasRenderingContext2D,
  faceMask: Uint8Array,
  metalType: MetalType
): void {
  applyReflectance(ctx, faceMask, METAL_REFLECTANCE[metalType]);
}

// ============================================
// 드레이프 색상 적용
// ============================================

/**
 * 드레이프 색상을 얼굴 하단에 자연스럽게 적용
 * - 상단 경계 그라데이션으로 부드러운 전환
 * - 약간의 천 주름 효과 (밝기 변화)
 * - 얼굴 영역 주변 부드러운 블렌딩
 *
 * @param ctx - Canvas 2D 컨텍스트
 * @param drapeColor - 드레이프 색상 (HEX)
 * @param faceMask - 얼굴 마스크
 * @param canvasHeight - 캔버스 높이
 */
export function applyDrapeColor(
  ctx: CanvasRenderingContext2D,
  drapeColor: string,
  faceMask: Uint8Array,
  canvasHeight: number
): void {
  const canvasWidth = ctx.canvas.width;

  // HEX → RGB 변환
  const r = parseInt(drapeColor.slice(1, 3), 16);
  const g = parseInt(drapeColor.slice(3, 5), 16);
  const b = parseInt(drapeColor.slice(5, 7), 16);

  // 드레이프 영역 (얼굴 아래 목/어깨 — 얼굴 침범 최소화)
  const drapeStartY = Math.floor(canvasHeight * DRAPE_START_RATIO);
  const fadeZone = Math.floor(canvasHeight * DRAPE_FADE_RATIO);

  // 드레이프 색상 적용
  const imageData = ctx.getImageData(0, drapeStartY, canvasWidth, canvasHeight - drapeStartY);
  const { data } = imageData;

  // 간단한 시드 기반 노이즈 (주름 효과용)
  const getNoiseValue = (x: number, y: number): number => {
    const seed = (x * 12.9898 + y * 78.233) * 43758.5453;
    return (seed - Math.floor(seed)) * 0.12 - 0.06; // -0.06 ~ +0.06 범위
  };

  for (let i = 0; i < data.length; i += 4) {
    const localY = Math.floor(i / 4 / canvasWidth);
    const globalY = drapeStartY + localY;
    const x = (i / 4) % canvasWidth;
    const pixelIndex = globalY * canvasWidth + x;

    // 마스크 영역 외부만 드레이프 적용
    if (faceMask[pixelIndex] === 0) {
      // 상단 페이드 (부드러운 경계)
      let blendRatio = DRAPE_MAX_BLEND;
      if (localY < fadeZone) {
        // 0 ~ fadeZone 사이: 0.2 → DRAPE_MAX_BLEND 그라데이션
        blendRatio = 0.2 + (localY / fadeZone) * (DRAPE_MAX_BLEND - 0.2);
      }

      // 주름 효과 (밝기 미세 변화)
      const noise = getNoiseValue(x, localY);
      const foldEffect = 1 + noise;

      // 드레이프 색상 (주름 효과 적용)
      const drapeR = Math.min(255, Math.round(r * foldEffect));
      const drapeG = Math.min(255, Math.round(g * foldEffect));
      const drapeB = Math.min(255, Math.round(b * foldEffect));

      // 블렌딩
      data[i] = Math.round(data[i] * (1 - blendRatio) + drapeR * blendRatio);
      data[i + 1] = Math.round(data[i + 1] * (1 - blendRatio) + drapeG * blendRatio);
      data[i + 2] = Math.round(data[i + 2] * (1 - blendRatio) + drapeB * blendRatio);
    }
  }

  ctx.putImageData(imageData, 0, drapeStartY);
}
