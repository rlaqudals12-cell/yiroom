/**
 * PC-2 색공간 변환 유틸리티 (SSOT 위임)
 *
 * 모든 구현은 lib/color/ 통합 모듈에 위치.
 * 이 파일은 하위 호환을 위한 re-export 래퍼.
 * 이름이 다른 함수는 별칭으로 re-export.
 *
 * @deprecated 직접 @/lib/color 에서 import 권장
 * @see lib/color/conversions.ts
 * @see lib/color/ciede2000.ts
 */

// 이름이 일치하는 함수: 직접 re-export
export {
  rgbToXyz,
  xyzToRgb,
  xyzToLab,
  labToXyz,
  rgbToLab,
  labToRgb,
  hexToRgb,
  rgbToHex,
  hexToLab,
  labToHex,
} from '@/lib/color';

// 이름이 다른 함수: 별칭 re-export
export {
  calculateLabDistance as labDistanceCIE76,
  calculateCIEDE2000 as labDistanceCIEDE2000,
  calculateChroma as getChroma,
  calculateHue as getHue,
} from '@/lib/color';
