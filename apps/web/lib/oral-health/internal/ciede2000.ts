/**
 * CIEDE2000 색차 계산 (SSOT 위임)
 *
 * 핵심 색차 계산은 lib/color/ 통합 모듈에 위치.
 * 이 파일은 하위 호환 re-export + 구강건강 도메인 해석 함수를 제공.
 *
 * @module lib/oral-health/internal/ciede2000
 * @see lib/color/ciede2000.ts
 *
 * 임상적 의미:
 * - ΔE < 1.0: 인지 불가
 * - ΔE 1.0-2.7: 인지 가능, 허용 범위
 * - ΔE 2.7-3.3: 허용 경계
 * - ΔE > 3.3: 임상적으로 허용 불가
 */

// SSOT: CIEDE2000 색차 계산은 @/lib/color에서 위임
import type { LabColor } from '@/lib/color';
import { calculateCIEDE2000 as _calculateCIEDE2000 } from '@/lib/color';

/**
 * CIEDE2000 색차 계산 (하위 호환 래퍼)
 *
 * 기존 (lab1, lab2, kL, kC, kH) 시그니처를 유지하면서
 * 내부적으로 lib/color의 options 기반 구현에 위임
 */
export function calculateCIEDE2000(
  lab1: LabColor,
  lab2: LabColor,
  kL: number = 1,
  kC: number = 1,
  kH: number = 1
): number {
  return _calculateCIEDE2000(lab1, lab2, { kL, kC, kH });
}

/**
 * 색차 해석 (구강건강 도메인 전용)
 *
 * 이 타입과 함수는 lib/color에 없는 고유 기능이므로 로컬에 유지
 */
export type ColorDifferenceInterpretation =
  | 'imperceptible' // ΔE < 1.0
  | 'perceptible' // ΔE 1.0-2.7
  | 'threshold' // ΔE 2.7-3.3
  | 'clinically_unacceptable'; // ΔE > 3.3

/**
 * 색차 값 해석
 *
 * @param deltaE - CIEDE2000 색차 값
 * @returns 해석 결과
 */
export function interpretColorDifference(deltaE: number): {
  interpretation: ColorDifferenceInterpretation;
  description: string;
  isAcceptable: boolean;
} {
  if (deltaE < 1.0) {
    return {
      interpretation: 'imperceptible',
      description: '인지 불가능한 차이',
      isAcceptable: true,
    };
  } else if (deltaE < 2.7) {
    return {
      interpretation: 'perceptible',
      description: '인지 가능하지만 허용 범위',
      isAcceptable: true,
    };
  } else if (deltaE < 3.3) {
    return {
      interpretation: 'threshold',
      description: '허용 경계선',
      isAcceptable: false,
    };
  } else {
    return {
      interpretation: 'clinically_unacceptable',
      description: '임상적으로 허용 불가',
      isAcceptable: false,
    };
  }
}
