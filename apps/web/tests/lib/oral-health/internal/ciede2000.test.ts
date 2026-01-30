/**
 * CIEDE2000 색차 계산 테스트
 *
 * @module tests/lib/oral-health/internal/ciede2000
 * @description ISO/CIE 11664-6:2014 표준 색차 공식 검증
 */

import { describe, it, expect } from 'vitest';
import { calculateCIEDE2000, interpretColorDifference } from '@/lib/oral-health/internal/ciede2000';
import type { LabColor } from '@/types/oral-health';

describe('lib/oral-health/internal/ciede2000', () => {
  describe('calculateCIEDE2000', () => {
    it('should return 0 for identical colors', () => {
      const lab: LabColor = { L: 50, a: 2.5, b: 0 };
      const deltaE = calculateCIEDE2000(lab, lab);

      expect(deltaE).toBe(0);
    });

    it('should calculate deltaE for VITA B1 vs A1', () => {
      // VITA B1: L=71, a=1.5, b=15
      // VITA A1: L=70, a=2, b=16
      const b1: LabColor = { L: 71, a: 1.5, b: 15 };
      const a1: LabColor = { L: 70, a: 2, b: 16 };

      const deltaE = calculateCIEDE2000(b1, a1);

      // 두 셰이드는 매우 가까움 (인지 가능, 허용 범위)
      expect(deltaE).toBeGreaterThan(0);
      expect(deltaE).toBeLessThan(3);
    });

    it('should calculate larger deltaE for distant shades', () => {
      // VITA B1: L=71, a=1.5, b=15
      // VITA A4: L=56.5, a=5.5, b=25.5
      const b1: LabColor = { L: 71, a: 1.5, b: 15 };
      const a4: LabColor = { L: 56.5, a: 5.5, b: 25.5 };

      const deltaE = calculateCIEDE2000(b1, a4);

      // 매우 다른 셰이드
      expect(deltaE).toBeGreaterThan(10);
    });

    it('should be symmetric (order should not matter)', () => {
      const lab1: LabColor = { L: 65, a: 3, b: 20 };
      const lab2: LabColor = { L: 70, a: 1, b: 15 };

      const deltaE1 = calculateCIEDE2000(lab1, lab2);
      const deltaE2 = calculateCIEDE2000(lab2, lab1);

      expect(deltaE1).toBeCloseTo(deltaE2, 10);
    });

    it('should handle pure lightness difference', () => {
      const lab1: LabColor = { L: 50, a: 0, b: 0 };
      const lab2: LabColor = { L: 60, a: 0, b: 0 };

      const deltaE = calculateCIEDE2000(lab1, lab2);

      expect(deltaE).toBeGreaterThan(0);
    });

    it('should handle pure chroma difference', () => {
      const lab1: LabColor = { L: 50, a: 5, b: 0 };
      const lab2: LabColor = { L: 50, a: 10, b: 0 };

      const deltaE = calculateCIEDE2000(lab1, lab2);

      expect(deltaE).toBeGreaterThan(0);
    });

    it('should handle pure hue difference', () => {
      const lab1: LabColor = { L: 50, a: 10, b: 0 };
      const lab2: LabColor = { L: 50, a: 0, b: 10 };

      const deltaE = calculateCIEDE2000(lab1, lab2);

      expect(deltaE).toBeGreaterThan(0);
    });

    it('should apply custom weighting factors', () => {
      const lab1: LabColor = { L: 50, a: 2.5, b: 0 };
      const lab2: LabColor = { L: 55, a: 2.5, b: 0 };

      const defaultDeltaE = calculateCIEDE2000(lab1, lab2);
      const weightedDeltaE = calculateCIEDE2000(lab1, lab2, 2, 1, 1);

      // kL=2 → 명도 차이 영향 감소
      expect(weightedDeltaE).toBeLessThan(defaultDeltaE);
    });

    it('should handle edge case with zero chroma', () => {
      const lab1: LabColor = { L: 50, a: 0, b: 0 };
      const lab2: LabColor = { L: 50, a: 0, b: 0 };

      const deltaE = calculateCIEDE2000(lab1, lab2);

      expect(deltaE).toBe(0);
    });

    it('should handle negative a* and b* values', () => {
      const lab1: LabColor = { L: 50, a: -5, b: -10 };
      const lab2: LabColor = { L: 50, a: 5, b: 10 };

      const deltaE = calculateCIEDE2000(lab1, lab2);

      expect(deltaE).toBeGreaterThan(0);
    });
  });

  describe('interpretColorDifference', () => {
    it('should return imperceptible for deltaE < 1.0', () => {
      const result = interpretColorDifference(0.5);

      expect(result.interpretation).toBe('imperceptible');
      expect(result.description).toBe('인지 불가능한 차이');
      expect(result.isAcceptable).toBe(true);
    });

    it('should return perceptible for deltaE 1.0-2.7', () => {
      const result = interpretColorDifference(2.0);

      expect(result.interpretation).toBe('perceptible');
      expect(result.description).toBe('인지 가능하지만 허용 범위');
      expect(result.isAcceptable).toBe(true);
    });

    it('should return threshold for deltaE 2.7-3.3', () => {
      const result = interpretColorDifference(3.0);

      expect(result.interpretation).toBe('threshold');
      expect(result.description).toBe('허용 경계선');
      expect(result.isAcceptable).toBe(false);
    });

    it('should return clinically_unacceptable for deltaE > 3.3', () => {
      const result = interpretColorDifference(5.0);

      expect(result.interpretation).toBe('clinically_unacceptable');
      expect(result.description).toBe('임상적으로 허용 불가');
      expect(result.isAcceptable).toBe(false);
    });

    it('should handle boundary value at 1.0 exactly', () => {
      const result = interpretColorDifference(1.0);

      expect(result.interpretation).toBe('perceptible');
    });

    it('should handle boundary value at 2.7 exactly', () => {
      const result = interpretColorDifference(2.7);

      expect(result.interpretation).toBe('threshold');
    });

    it('should handle boundary value at 3.3 exactly', () => {
      const result = interpretColorDifference(3.3);

      expect(result.interpretation).toBe('clinically_unacceptable');
    });

    it('should handle zero deltaE', () => {
      const result = interpretColorDifference(0);

      expect(result.interpretation).toBe('imperceptible');
      expect(result.isAcceptable).toBe(true);
    });
  });
});
