/**
 * PC-2: Lab 색공간 유틸리티 (SSOT 위임)
 *
 * 모든 구현은 lib/color/ 통합 모듈에 위치.
 * 이 파일은 하위 호환을 위한 re-export 래퍼.
 *
 * @deprecated 직접 @/lib/color 에서 import 권장
 * @see lib/color/conversions.ts
 * @see lib/color/ciede2000.ts
 */

export {
  rgbToLab,
  labToRgb,
  hexToLab,
  labToHex,
  calculateChroma,
  calculateHue,
  calculateITA,
  calculateLabDistance,
  calculateCIEDE2000,
} from '@/lib/color';
