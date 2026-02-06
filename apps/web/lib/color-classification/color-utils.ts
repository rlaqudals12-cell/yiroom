/**
 * 색상 변환 유틸리티 (SSOT 위임)
 *
 * 모든 색공간 변환 구현은 lib/color/ 통합 모듈에 위치.
 * 이 파일은 하위 호환을 위한 re-export 래퍼.
 * 이름이 다른 함수는 별칭으로 re-export.
 *
 * @module lib/color-classification/color-utils
 * @deprecated 직접 @/lib/color 에서 import 권장
 * @see lib/color/conversions.ts
 */

import type { RGBColor } from './types';

// 이름이 일치하는 함수: 직접 re-export
export { rgbToLab, labToRgb, rgbToHex, hexToRgb } from '@/lib/color';

// 이름이 다른 함수: 별칭 re-export
export {
  calculateLabDistance as labDistanceCIE76,
  calculateChroma as getChroma,
  calculateHue as getHue,
} from '@/lib/color';

/**
 * RGB 색상 거리 계산 (유클리드)
 *
 * 이 함수는 lib/color에 없는 고유 함수이므로 로컬에 유지
 */
export function rgbDistance(rgb1: RGBColor, rgb2: RGBColor): number {
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}
