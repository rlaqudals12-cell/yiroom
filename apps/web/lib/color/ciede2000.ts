/**
 * 색차 계산 모듈 (CIE76 & CIEDE2000)
 *
 * 4개 독립 CIEDE2000 구현을 CIE 142-2001 표준 기반으로 통합
 *
 * @module lib/color/ciede2000
 * @see CIE 142-2001
 * @see Sharma, G., Wu, W., & Dalal, E. N. (2005)
 * @see docs/principles/color-science.md
 * @see docs/adr/ADR-066-ssot-consolidation-strategy.md
 */

import type { LabColor, CIEDE2000Options } from './types';

// =============================================================================
// CIE76 색차 (유클리드 거리)
// =============================================================================

/**
 * CIE76 색차 계산 (유클리드 거리)
 *
 * deltaE = sqrt[(L1-L2)^2 + (a1-a2)^2 + (b1-b2)^2]
 *
 * | deltaE | 해석 |
 * |--------|------|
 * | < 1 | 구별 불가 |
 * | 1-2 | 미세한 차이 |
 * | 2-3.5 | 인지 가능 |
 * | 3.5-5 | 명확한 차이 |
 * | > 5 | 다른 색상 |
 *
 * @param lab1 - 첫 번째 Lab 색상
 * @param lab2 - 두 번째 Lab 색상
 * @returns 색차 (deltaE)
 */
export function calculateLabDistance(lab1: LabColor, lab2: LabColor): number {
  return Math.sqrt((lab1.L - lab2.L) ** 2 + (lab1.a - lab2.a) ** 2 + (lab1.b - lab2.b) ** 2);
}

// =============================================================================
// CIEDE2000 색차
// =============================================================================

/**
 * CIEDE2000 색차 계산 (CIE 142-2001 표준)
 *
 * 인간 지각과 가장 일치하는 색차 계산 공식
 * - SL, SC, SH 스케일링으로 명도/채도/색상 불균일성 보정
 * - RT 회전 항으로 청색 영역 문제 보정
 * - a' 보정으로 회색 근처 문제 해결
 *
 * | deltaE*00 | 해석 |
 * |-----------|------|
 * | < 1 | 구별 불가 |
 * | 1-2 | 미세한 차이 (전문가만 인식) |
 * | 2-3.5 | 인지 가능 |
 * | 3.5-5 | 명확한 차이 |
 * | > 5 | 다른 색상 |
 *
 * @param lab1 - 첫 번째 Lab 색상
 * @param lab2 - 두 번째 Lab 색상
 * @param options - 가중치 옵션 (kL, kC, kH 기본값 = 1)
 * @returns 색차 (deltaE*00)
 */
export function calculateCIEDE2000(
  lab1: LabColor,
  lab2: LabColor,
  options: CIEDE2000Options = {}
): number {
  const kL = options.kL ?? 1;
  const kC = options.kC ?? 1;
  const kH = options.kH ?? 1;

  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  // 1. 평균 명도
  const L_bar = (lab1.L + lab2.L) / 2;

  // 2. 채도 계산
  const C1 = Math.sqrt(lab1.a ** 2 + lab1.b ** 2);
  const C2 = Math.sqrt(lab2.a ** 2 + lab2.b ** 2);
  const C_bar = (C1 + C2) / 2;

  // 3. a' 조정 (회색 근처 문제 해결)
  const G = 0.5 * (1 - Math.sqrt(C_bar ** 7 / (C_bar ** 7 + 25 ** 7)));
  const a1_prime = lab1.a * (1 + G);
  const a2_prime = lab2.a * (1 + G);

  // 4. 조정된 채도
  const C1_prime = Math.sqrt(a1_prime ** 2 + lab1.b ** 2);
  const C2_prime = Math.sqrt(a2_prime ** 2 + lab2.b ** 2);
  const C_bar_prime = (C1_prime + C2_prime) / 2;

  // 5. 색상각 계산
  let h1 = Math.atan2(lab1.b, a1_prime) * (180 / Math.PI);
  let h2 = Math.atan2(lab2.b, a2_prime) * (180 / Math.PI);
  if (h1 < 0) h1 += 360;
  if (h2 < 0) h2 += 360;

  // 6. 평균 색상각
  let H_bar_prime: number;
  if (C1_prime * C2_prime === 0) {
    H_bar_prime = h1 + h2;
  } else if (Math.abs(h1 - h2) <= 180) {
    H_bar_prime = (h1 + h2) / 2;
  } else if (h1 + h2 < 360) {
    H_bar_prime = (h1 + h2 + 360) / 2;
  } else {
    H_bar_prime = (h1 + h2 - 360) / 2;
  }

  // 7. T 계산
  const T =
    1 -
    0.17 * Math.cos(toRad(H_bar_prime - 30)) +
    0.24 * Math.cos(toRad(2 * H_bar_prime)) +
    0.32 * Math.cos(toRad(3 * H_bar_prime + 6)) -
    0.2 * Math.cos(toRad(4 * H_bar_prime - 63));

  // 8. 델타 값들
  const delta_L_prime = lab2.L - lab1.L;
  const delta_C_prime = C2_prime - C1_prime;

  let delta_h_prime: number;
  if (C1_prime * C2_prime === 0) {
    delta_h_prime = 0;
  } else if (Math.abs(h2 - h1) <= 180) {
    delta_h_prime = h2 - h1;
  } else if (h2 - h1 > 180) {
    delta_h_prime = h2 - h1 - 360;
  } else {
    delta_h_prime = h2 - h1 + 360;
  }

  const delta_H_prime = 2 * Math.sqrt(C1_prime * C2_prime) * Math.sin(toRad(delta_h_prime / 2));

  // 9. SL, SC, SH 계산
  const SL = 1 + (0.015 * (L_bar - 50) ** 2) / Math.sqrt(20 + (L_bar - 50) ** 2);
  const SC = 1 + 0.045 * C_bar_prime;
  const SH = 1 + 0.015 * C_bar_prime * T;

  // 10. RT (회전 항) 계산 — 청색 영역 보정
  const delta_theta = 30 * Math.exp(-(((H_bar_prime - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(C_bar_prime ** 7 / (C_bar_prime ** 7 + 25 ** 7));
  const RT = -RC * Math.sin(toRad(2 * delta_theta));

  // 11. 최종 CIEDE2000 계산
  const deltaE = Math.sqrt(
    (delta_L_prime / (kL * SL)) ** 2 +
      (delta_C_prime / (kC * SC)) ** 2 +
      (delta_H_prime / (kH * SH)) ** 2 +
      RT * (delta_C_prime / (kC * SC)) * (delta_H_prime / (kH * SH))
  );

  return deltaE;
}
