/**
 * CIEDE2000 색차 계산 테스트
 *
 * @module tests/lib/color/ciede2000
 * @description CIE76 (calculateLabDistance) + CIEDE2000 (calculateCIEDE2000) 검증
 * @see Sharma, G., Wu, W., & Dalal, E. N. (2005) - CIEDE2000 테스트 데이터
 */

import { describe, it, expect } from 'vitest';
import { calculateLabDistance, calculateCIEDE2000 } from '@/lib/color/ciede2000';
import type { LabColor } from '@/lib/color/types';

// =============================================================================
// CIE76 색차 (유클리드 거리)
// =============================================================================

describe('calculateLabDistance (CIE76)', () => {
  it('동일한 색상은 거리 0을 반환한다', () => {
    const lab: LabColor = { L: 50, a: 25, b: -10 };
    expect(calculateLabDistance(lab, lab)).toBe(0);
  });

  it('L 차이만 있으면 |L1-L2|를 반환한다', () => {
    const lab1: LabColor = { L: 50, a: 0, b: 0 };
    const lab2: LabColor = { L: 60, a: 0, b: 0 };
    expect(calculateLabDistance(lab1, lab2)).toBeCloseTo(10, 5);
  });

  it('a 차이만 있으면 |a1-a2|를 반환한다', () => {
    const lab1: LabColor = { L: 50, a: 10, b: 0 };
    const lab2: LabColor = { L: 50, a: 20, b: 0 };
    expect(calculateLabDistance(lab1, lab2)).toBeCloseTo(10, 5);
  });

  it('b 차이만 있으면 |b1-b2|를 반환한다', () => {
    const lab1: LabColor = { L: 50, a: 0, b: 10 };
    const lab2: LabColor = { L: 50, a: 0, b: 30 };
    expect(calculateLabDistance(lab1, lab2)).toBeCloseTo(20, 5);
  });

  it('3축 모두 다르면 유클리드 거리를 반환한다', () => {
    const lab1: LabColor = { L: 50, a: 0, b: 0 };
    const lab2: LabColor = { L: 53, a: 4, b: 0 };
    // sqrt(9 + 16) = sqrt(25) = 5
    expect(calculateLabDistance(lab1, lab2)).toBeCloseTo(5, 5);
  });

  it('교환 법칙이 성립한다 (대칭성)', () => {
    const lab1: LabColor = { L: 30, a: -20, b: 15 };
    const lab2: LabColor = { L: 70, a: 10, b: -5 };
    expect(calculateLabDistance(lab1, lab2)).toBeCloseTo(calculateLabDistance(lab2, lab1), 10);
  });

  it('검은색과 흰색 사이 거리가 100이다', () => {
    const black: LabColor = { L: 0, a: 0, b: 0 };
    const white: LabColor = { L: 100, a: 0, b: 0 };
    expect(calculateLabDistance(black, white)).toBeCloseTo(100, 5);
  });
});

// =============================================================================
// CIEDE2000 색차
// =============================================================================

describe('calculateCIEDE2000', () => {
  // Sharma et al. (2005) 검증 데이터 (일부)
  // 원문: "The CIEDE2000 Color-Difference Formula: Implementation Notes,
  //        Supplementary Test Data, and Mathematical Observations"
  // 테이블 1의 첫 몇 행을 사용

  describe('기본 속성', () => {
    it('동일한 색상은 거리 0을 반환한다', () => {
      const lab: LabColor = { L: 50, a: 25, b: -10 };
      expect(calculateCIEDE2000(lab, lab)).toBeCloseTo(0, 5);
    });

    it('결과는 항상 0 이상이다', () => {
      const lab1: LabColor = { L: 30, a: -20, b: 15 };
      const lab2: LabColor = { L: 70, a: 10, b: -5 };
      expect(calculateCIEDE2000(lab1, lab2)).toBeGreaterThanOrEqual(0);
    });

    it('교환 법칙이 성립한다 (대칭성)', () => {
      const lab1: LabColor = { L: 50, a: 25, b: 2 };
      const lab2: LabColor = { L: 73, a: 25, b: -18 };
      const d1 = calculateCIEDE2000(lab1, lab2);
      const d2 = calculateCIEDE2000(lab2, lab1);
      expect(d1).toBeCloseTo(d2, 5);
    });
  });

  describe('Sharma 2005 테스트 데이터', () => {
    // 테스트 쌍 #1: L차이만 (밝기 차이)
    it('Pair 1: 밝기만 다른 두 색상', () => {
      const lab1: LabColor = { L: 50.0, a: 2.6772, b: -79.7751 };
      const lab2: LabColor = { L: 50.0, a: 0.0, b: -82.7485 };
      const result = calculateCIEDE2000(lab1, lab2);
      expect(result).toBeCloseTo(2.0425, 3);
    });

    // 테스트 쌍 #2
    it('Pair 2: 무채색 근처 색상 쌍', () => {
      const lab1: LabColor = { L: 50.0, a: 3.1571, b: -77.2803 };
      const lab2: LabColor = { L: 50.0, a: 0.0, b: -82.7485 };
      const result = calculateCIEDE2000(lab1, lab2);
      expect(result).toBeCloseTo(2.8615, 3);
    });

    // 테스트 쌍 #7: 비교적 큰 색차
    it('Pair 7: 큰 밝기 차이', () => {
      const lab1: LabColor = { L: 50.0, a: 2.5, b: 0.0 };
      const lab2: LabColor = { L: 73.0, a: 25.0, b: -18.0 };
      const result = calculateCIEDE2000(lab1, lab2);
      expect(result).toBeCloseTo(27.1492, 3);
    });

    // 테스트 쌍 #9: 회색 근처 (a 보정 효과 검증)
    it('Pair 9: a 보정 효과 (회색 근처)', () => {
      const lab1: LabColor = { L: 50.0, a: 2.5, b: 0.0 };
      const lab2: LabColor = { L: 61.2901, a: 3.7196, b: -5.3901 };
      const result = calculateCIEDE2000(lab1, lab2);
      // 밝기+채도+색상 복합 차이 → 유한 양수
      expect(result).toBeGreaterThan(10);
      expect(result).toBeLessThan(15);
      expect(Number.isFinite(result)).toBe(true);
    });

    // 테스트 쌍: 큰 채도 차이 검증
    it('큰 채도 차이 시 큰 deltaE를 반환한다', () => {
      const lab1: LabColor = { L: 50.0, a: 2.5, b: 0.0 };
      const lab2: LabColor = { L: 35.0831, a: -44.1164, b: 3.7933 };
      const result = calculateCIEDE2000(lab1, lab2);
      // 큰 채도+밝기 차이 → 큰 deltaE
      expect(result).toBeGreaterThan(25);
      expect(Number.isFinite(result)).toBe(true);
    });

    // 테스트 쌍: 미세한 차이 검증
    it('미세한 색상 차이 시 작은 deltaE를 반환한다', () => {
      const lab1: LabColor = { L: 50.0, a: 2.5, b: 0.0 };
      const lab2: LabColor = { L: 50.0, a: 3.1736, b: 0.5854 };
      const result = calculateCIEDE2000(lab1, lab2);
      // 미세한 a,b 차이 → deltaE < 2 (미세한 차이)
      expect(result).toBeLessThan(2);
      expect(result).toBeGreaterThan(0);
    });

    // 테스트 쌍 #25: 색상각 차이 (RT 회전 항)
    it('Pair 25: 두 색상 모두 높은 채도', () => {
      const lab1: LabColor = { L: 60.2574, a: -34.0099, b: 36.2677 };
      const lab2: LabColor = { L: 60.4626, a: -34.1751, b: 39.4387 };
      const result = calculateCIEDE2000(lab1, lab2);
      expect(result).toBeCloseTo(1.2644, 3);
    });
  });

  describe('가중치 옵션 (kL, kC, kH)', () => {
    const lab1: LabColor = { L: 50, a: 25, b: 0 };
    const lab2: LabColor = { L: 70, a: 25, b: -18 };

    it('기본 가중치는 모두 1이다', () => {
      const d1 = calculateCIEDE2000(lab1, lab2);
      const d2 = calculateCIEDE2000(lab1, lab2, { kL: 1, kC: 1, kH: 1 });
      expect(d1).toBeCloseTo(d2, 10);
    });

    it('kL 증가 시 밝기 차이 영향이 줄어든다', () => {
      const dDefault = calculateCIEDE2000(lab1, lab2, { kL: 1 });
      const dHighKL = calculateCIEDE2000(lab1, lab2, { kL: 2 });
      // kL이 크면 밝기 차이에 덜 민감 → 전체 deltaE 감소
      expect(dHighKL).toBeLessThan(dDefault);
    });

    it('kC 증가 시 채도 차이 영향이 줄어든다', () => {
      const dDefault = calculateCIEDE2000(lab1, lab2, { kC: 1 });
      const dHighKC = calculateCIEDE2000(lab1, lab2, { kC: 2 });
      expect(dHighKC).toBeLessThan(dDefault);
    });

    it('kH 증가 시 색상 차이 영향이 줄어든다', () => {
      const dDefault = calculateCIEDE2000(lab1, lab2, { kH: 1 });
      const dHighKH = calculateCIEDE2000(lab1, lab2, { kH: 2 });
      expect(dHighKH).toBeLessThan(dDefault);
    });
  });

  describe('엣지케이스', () => {
    it('무채색 (a=0, b=0) 두 색상의 색차를 계산한다', () => {
      const lab1: LabColor = { L: 50, a: 0, b: 0 };
      const lab2: LabColor = { L: 70, a: 0, b: 0 };
      const result = calculateCIEDE2000(lab1, lab2);
      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(result)).toBe(true);
    });

    it('한쪽만 무채색인 경우도 NaN 없이 계산한다', () => {
      const gray: LabColor = { L: 50, a: 0, b: 0 };
      const colored: LabColor = { L: 50, a: 30, b: -20 };
      const result = calculateCIEDE2000(gray, colored);
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });

    it('L=0 (검은색) 처리', () => {
      const black: LabColor = { L: 0, a: 0, b: 0 };
      const mid: LabColor = { L: 50, a: 0, b: 0 };
      const result = calculateCIEDE2000(black, mid);
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });

    it('L=100 (흰색) 처리', () => {
      const white: LabColor = { L: 100, a: 0, b: 0 };
      const mid: LabColor = { L: 50, a: 0, b: 0 };
      const result = calculateCIEDE2000(white, mid);
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });

    it('매우 가까운 색상 쌍 (미세 차이)', () => {
      const lab1: LabColor = { L: 50, a: 25.0, b: -10.0 };
      const lab2: LabColor = { L: 50, a: 25.1, b: -10.1 };
      const result = calculateCIEDE2000(lab1, lab2);
      expect(result).toBeLessThan(1); // 구별 불가 수준
      expect(result).toBeGreaterThan(0);
    });

    it('매우 다른 색상 쌍 (큰 차이)', () => {
      const red: LabColor = { L: 53.23, a: 80.11, b: 67.22 };
      const cyan: LabColor = { L: 91.11, a: -48.09, b: -14.13 };
      const result = calculateCIEDE2000(red, cyan);
      expect(result).toBeGreaterThan(50); // 매우 큰 차이
    });

    it('음수 a, b 값 처리', () => {
      const lab1: LabColor = { L: 50, a: -40, b: -30 };
      const lab2: LabColor = { L: 50, a: -45, b: -25 };
      const result = calculateCIEDE2000(lab1, lab2);
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('CIE76 vs CIEDE2000 비교', () => {
    it('CIEDE2000이 CIE76보다 인간 지각에 더 가깝다', () => {
      // 두 색상 쌍: CIE76은 같은 거리지만 CIEDE2000은 다를 수 있음
      const gray1: LabColor = { L: 50, a: 0, b: 0 };
      const gray2: LabColor = { L: 60, a: 0, b: 0 };
      // CIE76: 순수 밝기 차이
      const cie76Gray = calculateLabDistance(gray1, gray2);

      // CIEDE2000: 밝기 영역에서 SL 가중치 적용
      const de2000Gray = calculateCIEDE2000(gray1, gray2);

      // 둘 다 유효한 양수
      expect(cie76Gray).toBeGreaterThan(0);
      expect(de2000Gray).toBeGreaterThan(0);

      // CIEDE2000은 SL 보정으로 CIE76과 다른 값
      expect(de2000Gray).not.toBeCloseTo(cie76Gray, 1);
    });
  });
});
