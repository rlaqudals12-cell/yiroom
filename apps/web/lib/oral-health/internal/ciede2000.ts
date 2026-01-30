/**
 * CIEDE2000 색차 계산
 *
 * @module lib/oral-health/internal/ciede2000
 * @description ISO/CIE 11664-6:2014 표준 색차 공식
 * @see docs/principles/oral-health.md
 *
 * 임상적 의미:
 * - ΔE < 1.0: 인지 불가
 * - ΔE 1.0-2.7: 인지 가능, 허용 범위
 * - ΔE 2.7-3.3: 허용 경계
 * - ΔE > 3.3: 임상적으로 허용 불가
 */

import type { LabColor } from '@/types/oral-health';

/**
 * 라디안 → 도 변환
 */
function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

/**
 * 도 → 라디안 변환
 */
function degToRad(deg: number): number {
  return deg * Math.PI / 180;
}

/**
 * 색상각 계산
 */
function hueAngle(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  const h = radToDeg(Math.atan2(b, a));
  return h >= 0 ? h : h + 360;
}

/**
 * 색상각 차이 계산
 */
function hueDifference(h1: number, h2: number, C1: number, C2: number): number {
  if (C1 * C2 === 0) return 0;

  let dh = h2 - h1;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;

  return dh;
}

/**
 * 평균 색상각 계산
 */
function hueAverage(h1: number, h2: number, C1: number, C2: number): number {
  if (C1 * C2 === 0) return h1 + h2;

  let sum = h1 + h2;
  const diff = Math.abs(h1 - h2);

  if (diff > 180) {
    if (sum < 360) {
      sum += 360;
    } else {
      sum -= 360;
    }
  }

  return sum / 2;
}

/**
 * CIEDE2000 색차 계산
 *
 * @param lab1 - 첫 번째 Lab 색상
 * @param lab2 - 두 번째 Lab 색상
 * @param kL - 명도 가중치 (기본값 1)
 * @param kC - 채도 가중치 (기본값 1)
 * @param kH - 색상 가중치 (기본값 1)
 * @returns CIEDE2000 색차 값 (ΔE)
 *
 * @example
 * const deltaE = calculateCIEDE2000(
 *   { L: 71, a: 1.5, b: 15 },  // B1
 *   { L: 70, a: 2, b: 16 }     // A1
 * );
 * // deltaE ≈ 1.5 (인지 가능, 허용 범위)
 */
export function calculateCIEDE2000(
  lab1: LabColor,
  lab2: LabColor,
  kL: number = 1,
  kC: number = 1,
  kH: number = 1
): number {
  // Step 1: Calculate C' and h'
  const C1 = Math.sqrt(lab1.a ** 2 + lab1.b ** 2);
  const C2 = Math.sqrt(lab2.a ** 2 + lab2.b ** 2);
  const Cavg = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Cavg ** 7 / (Cavg ** 7 + 25 ** 7)));

  const a1p = lab1.a * (1 + G);
  const a2p = lab2.a * (1 + G);

  const C1p = Math.sqrt(a1p ** 2 + lab1.b ** 2);
  const C2p = Math.sqrt(a2p ** 2 + lab2.b ** 2);

  const h1p = hueAngle(a1p, lab1.b);
  const h2p = hueAngle(a2p, lab2.b);

  // Step 2: Calculate differences
  const dLp = lab2.L - lab1.L;
  const dCp = C2p - C1p;
  const dhp = hueDifference(h1p, h2p, C1p, C2p);
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(degToRad(dhp / 2));

  // Step 3: Calculate weighting functions
  const Lbarp = (lab1.L + lab2.L) / 2;
  const Cbarp = (C1p + C2p) / 2;
  const hbarp = hueAverage(h1p, h2p, C1p, C2p);

  const T = 1
    - 0.17 * Math.cos(degToRad(hbarp - 30))
    + 0.24 * Math.cos(degToRad(2 * hbarp))
    + 0.32 * Math.cos(degToRad(3 * hbarp + 6))
    - 0.20 * Math.cos(degToRad(4 * hbarp - 63));

  const SL = 1 + (0.015 * (Lbarp - 50) ** 2) / Math.sqrt(20 + (Lbarp - 50) ** 2);
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;

  const RC = 2 * Math.sqrt(Cbarp ** 7 / (Cbarp ** 7 + 25 ** 7));
  const dTheta = 30 * Math.exp(-(((hbarp - 275) / 25) ** 2));
  const RT = -RC * Math.sin(degToRad(2 * dTheta));

  // Step 4: Calculate total color difference
  const deltaE = Math.sqrt(
    (dLp / (kL * SL)) ** 2 +
    (dCp / (kC * SC)) ** 2 +
    (dHp / (kH * SH)) ** 2 +
    RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );

  return deltaE;
}

/**
 * 색차 해석
 */
export type ColorDifferenceInterpretation =
  | 'imperceptible'      // ΔE < 1.0
  | 'perceptible'        // ΔE 1.0-2.7
  | 'threshold'          // ΔE 2.7-3.3
  | 'clinically_unacceptable';  // ΔE > 3.3

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
