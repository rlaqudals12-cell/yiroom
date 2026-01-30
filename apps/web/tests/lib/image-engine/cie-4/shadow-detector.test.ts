/**
 * CIE-4 그림자 감지 모듈 테스트
 *
 * @module tests/lib/image-engine/cie-4/shadow-detector
 * @description 그림자 패턴 분석 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  detectShadowDirection,
  calculateShadowIntensity,
  calculateDarkAreaRatio,
  calculateOverexposedRatio,
  shadowToScore,
  SHADOW_THRESHOLDS,
} from '@/lib/image-engine/cie-4/shadow-detector';
import type { ShadowAnalysis } from '@/lib/image-engine/types';

describe('lib/image-engine/cie-4/shadow-detector', () => {
  // =========================================
  // detectShadowDirection 테스트
  // =========================================

  describe('detectShadowDirection', () => {
    it('균일한 밝기에서 none을 반환한다', () => {
      const uniform = [100, 100, 100, 100, 100, 100];
      expect(detectShadowDirection(uniform)).toBe('none');
    });

    it('왼쪽이 어두우면 left를 반환한다', () => {
      // 왼쪽(0, 2, 4)이 어둡고 오른쪽(1, 3, 5)이 밝음
      const leftDark = [50, 150, 50, 150, 50, 150];
      expect(detectShadowDirection(leftDark)).toBe('left');
    });

    it('오른쪽이 어두우면 right를 반환한다', () => {
      // 오른쪽(1, 3, 5)이 어둡고 왼쪽(0, 2, 4)이 밝음
      const rightDark = [150, 50, 150, 50, 150, 50];
      expect(detectShadowDirection(rightDark)).toBe('right');
    });

    it('위쪽이 어두우면 top을 반환한다', () => {
      // 위쪽(0, 1)이 어둡고 아래쪽(4, 5)이 밝음
      const topDark = [50, 50, 100, 100, 150, 150];
      expect(detectShadowDirection(topDark)).toBe('top');
    });

    it('아래쪽이 어두우면 bottom을 반환한다', () => {
      // 아래쪽(4, 5)이 어둡고 위쪽(0, 1)이 밝음
      const bottomDark = [150, 150, 100, 100, 50, 50];
      expect(detectShadowDirection(bottomDark)).toBe('bottom');
    });

    it('잘못된 배열 길이에서 none을 반환한다', () => {
      expect(detectShadowDirection([])).toBe('none');
      expect(detectShadowDirection([100, 100, 100])).toBe('none');
    });

    it('좌우 차이가 상하 차이보다 크면 좌우 방향을 우선한다', () => {
      // 좌우 차이: 100, 상하 차이: 30
      const mixed = [50, 150, 50, 150, 65, 135];
      const result = detectShadowDirection(mixed);
      expect(result === 'left' || result === 'right').toBe(true);
    });
  });

  // =========================================
  // calculateShadowIntensity 테스트
  // =========================================

  describe('calculateShadowIntensity', () => {
    it('균일한 밝기에서 0을 반환한다', () => {
      const uniform = [100, 100, 100, 100, 100, 100];
      expect(calculateShadowIntensity(uniform)).toBe(0);
    });

    it('최대 명암비에서 1에 가까운 값을 반환한다', () => {
      // max=255, min=0 → intensity = 1
      const maxContrast = [0, 255, 50, 200, 100, 150];
      expect(calculateShadowIntensity(maxContrast)).toBeCloseTo(1, 2);
    });

    it('중간 명암비에서 중간 값을 반환한다', () => {
      // max=200, min=100 → intensity = 100/200 = 0.5
      const mediumContrast = [100, 200, 150, 150, 120, 180];
      const intensity = calculateShadowIntensity(mediumContrast);
      expect(intensity).toBeGreaterThan(0.3);
      expect(intensity).toBeLessThan(0.7);
    });

    it('빈 배열에서 0을 반환한다', () => {
      expect(calculateShadowIntensity([])).toBe(0);
    });

    it('max가 0이면 0을 반환한다', () => {
      const allZero = [0, 0, 0, 0, 0, 0];
      expect(calculateShadowIntensity(allZero)).toBe(0);
    });
  });

  // =========================================
  // calculateDarkAreaRatio 테스트
  // =========================================

  describe('calculateDarkAreaRatio', () => {
    it('모두 밝으면 0을 반환한다', () => {
      const bright = [150, 150, 150, 150, 150, 150];
      expect(calculateDarkAreaRatio(bright)).toBe(0);
    });

    it('모두 어두우면 1을 반환한다', () => {
      const dark = [50, 50, 50, 50, 50, 50]; // 모두 darkThreshold(80) 미만
      expect(calculateDarkAreaRatio(dark)).toBe(1);
    });

    it('절반이 어두우면 0.5를 반환한다', () => {
      const mixed = [50, 50, 50, 150, 150, 150]; // 3개가 80 미만
      expect(calculateDarkAreaRatio(mixed)).toBeCloseTo(0.5, 2);
    });

    it('빈 배열에서 0을 반환한다', () => {
      expect(calculateDarkAreaRatio([])).toBe(0);
    });

    it('임계값 경계에서 올바르게 판정한다', () => {
      const boundary = [79, 80, 81]; // 79만 dark
      expect(calculateDarkAreaRatio(boundary)).toBeCloseTo(1 / 3, 2);
    });
  });

  // =========================================
  // calculateOverexposedRatio 테스트
  // =========================================

  describe('calculateOverexposedRatio', () => {
    it('모두 정상 밝기이면 0을 반환한다', () => {
      const normal = [150, 150, 150, 150, 150, 150];
      expect(calculateOverexposedRatio(normal)).toBe(0);
    });

    it('모두 과노출이면 1을 반환한다', () => {
      const overexposed = [200, 220, 240, 250, 255, 255]; // 모두 brightThreshold(180) 초과
      expect(calculateOverexposedRatio(overexposed)).toBe(1);
    });

    it('일부 과노출이면 올바른 비율을 반환한다', () => {
      const mixed = [100, 100, 200, 200, 255, 255]; // 4개가 180 초과
      expect(calculateOverexposedRatio(mixed)).toBeCloseTo(4 / 6, 2);
    });

    it('빈 배열에서 0을 반환한다', () => {
      expect(calculateOverexposedRatio([])).toBe(0);
    });
  });

  // =========================================
  // shadowToScore 테스트
  // =========================================

  describe('shadowToScore', () => {
    it('그림자가 없으면 100점을 반환한다', () => {
      const noShadow: ShadowAnalysis = {
        hasShadow: false,
        direction: 'none',
        intensity: 0,
        severity: 'none',
        darkAreaRatio: 0,
        overexposedRatio: 0,
        recommendation: '조명 상태가 양호합니다.',
      };

      expect(shadowToScore(noShadow)).toBe(100);
    });

    it('경미한 그림자는 높은 점수를 반환한다', () => {
      const mildShadow: ShadowAnalysis = {
        hasShadow: true,
        direction: 'left',
        intensity: 0.25,
        severity: 'mild',
        darkAreaRatio: 0.1,
        overexposedRatio: 0,
        recommendation: '',
      };

      const score = shadowToScore(mildShadow);
      expect(score).toBeGreaterThan(70);
      expect(score).toBeLessThanOrEqual(80);
    });

    it('중간 그림자는 중간 점수를 반환한다', () => {
      const moderateShadow: ShadowAnalysis = {
        hasShadow: true,
        direction: 'right',
        intensity: 0.4,
        severity: 'moderate',
        darkAreaRatio: 0.2,
        overexposedRatio: 0.1,
        recommendation: '',
      };

      const score = shadowToScore(moderateShadow);
      expect(score).toBeGreaterThan(30);
      expect(score).toBeLessThan(60);
    });

    it('심한 그림자는 낮은 점수를 반환한다', () => {
      const severeShadow: ShadowAnalysis = {
        hasShadow: true,
        direction: 'top',
        intensity: 0.6,
        severity: 'severe',
        darkAreaRatio: 0.4,
        overexposedRatio: 0.2,
        recommendation: '',
      };

      const score = shadowToScore(severeShadow);
      expect(score).toBeLessThan(30);
    });

    it('어두운/과노출 영역 비율에 따라 점수가 감소한다', () => {
      const baseAnalysis: ShadowAnalysis = {
        hasShadow: true,
        direction: 'left',
        intensity: 0.3,
        severity: 'mild',
        darkAreaRatio: 0,
        overexposedRatio: 0,
        recommendation: '',
      };

      const withDarkArea: ShadowAnalysis = {
        ...baseAnalysis,
        darkAreaRatio: 0.5,
      };

      expect(shadowToScore(withDarkArea)).toBeLessThan(shadowToScore(baseAnalysis));
    });

    it('점수는 0 미만이 되지 않는다', () => {
      const worstCase: ShadowAnalysis = {
        hasShadow: true,
        direction: 'bottom',
        intensity: 1,
        severity: 'severe',
        darkAreaRatio: 1,
        overexposedRatio: 1,
        recommendation: '',
      };

      expect(shadowToScore(worstCase)).toBeGreaterThanOrEqual(0);
    });
  });

  // =========================================
  // SHADOW_THRESHOLDS 상수 테스트
  // =========================================

  describe('SHADOW_THRESHOLDS', () => {
    it('올바른 임계값이 정의되어 있다', () => {
      expect(SHADOW_THRESHOLDS.darkThreshold).toBeDefined();
      expect(SHADOW_THRESHOLDS.brightThreshold).toBeDefined();
      expect(SHADOW_THRESHOLDS.asymmetryWarning).toBeDefined();
      expect(SHADOW_THRESHOLDS.asymmetrySevere).toBeDefined();
    });

    it('darkThreshold < brightThreshold', () => {
      expect(SHADOW_THRESHOLDS.darkThreshold).toBeLessThan(SHADOW_THRESHOLDS.brightThreshold);
    });

    it('asymmetryWarning < asymmetrySevere', () => {
      expect(SHADOW_THRESHOLDS.asymmetryWarning).toBeLessThan(SHADOW_THRESHOLDS.asymmetrySevere);
    });
  });
});
