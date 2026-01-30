/**
 * CIE-3 AWB 신뢰도 계산 테스트
 *
 * @module tests/lib/image-engine/cie-3/confidence
 * @description AWB 보정 신뢰도 계산 검증
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGainScore,
  calculateCCTScore,
  calculateNonSkinScore,
  calculateConfidence,
  calculateConfidenceDetails,
  calculateAWBConfidence,
  getMethodDefaultConfidence,
  adjustConfidenceForFallback,
  type ColorStats,
} from '@/lib/image-engine/cie-3/confidence';
import type { AWBGains } from '@/lib/image-engine/types';

describe('lib/image-engine/cie-3/confidence', () => {
  // =========================================
  // calculateGainScore 테스트
  // =========================================

  describe('calculateGainScore', () => {
    it('이상적인 게인 범위(0.7-1.5)에서 높은 점수를 반환한다', () => {
      const gains: AWBGains = { r: 1.0, g: 1.0, b: 1.0 };
      expect(calculateGainScore(gains)).toBe(1.0);
    });

    it('수용 가능한 게인 범위(0.5-2.0)에서 중간 점수를 반환한다', () => {
      const gains: AWBGains = { r: 0.6, g: 0.6, b: 0.6 };
      expect(calculateGainScore(gains)).toBeCloseTo(0.7, 5);
    });

    it('범위를 벗어난 게인에서 낮은 점수를 반환한다', () => {
      const gains: AWBGains = { r: 0.3, g: 0.3, b: 0.3 };
      expect(calculateGainScore(gains)).toBe(0.3);
    });

    it('혼합 게인 값도 처리한다', () => {
      const gains: AWBGains = { r: 1.0, g: 0.6, b: 0.3 };
      // (1.0 + 0.7 + 0.3) / 3 ≈ 0.667
      const score = calculateGainScore(gains);
      expect(score).toBeGreaterThan(0.6);
      expect(score).toBeLessThan(0.7);
    });
  });

  // =========================================
  // calculateCCTScore 테스트
  // =========================================

  describe('calculateCCTScore', () => {
    it('목표 색온도와 동일하면 최고 점수를 반환한다', () => {
      expect(calculateCCTScore(6500, 6500)).toBe(1.0);
    });

    it('<500K 차이는 우수(1.0)를 반환한다', () => {
      expect(calculateCCTScore(6200, 6500)).toBe(1.0);
    });

    it('<1500K 차이는 양호(0.8)를 반환한다', () => {
      expect(calculateCCTScore(5500, 6500)).toBe(0.8);
    });

    it('<3000K 차이는 수용 가능(0.6)을 반환한다', () => {
      expect(calculateCCTScore(4000, 6500)).toBe(0.6);
    });

    it('>3000K 차이는 불량(0.4)을 반환한다', () => {
      expect(calculateCCTScore(2500, 6500)).toBe(0.4);
    });

    it('기본 목표 색온도는 6500K이다', () => {
      expect(calculateCCTScore(6500)).toBe(1.0);
    });
  });

  // =========================================
  // calculateNonSkinScore 테스트
  // =========================================

  describe('calculateNonSkinScore', () => {
    it('30% 이상 비피부 영역은 최고 점수를 반환한다', () => {
      expect(calculateNonSkinScore(0.5)).toBe(1.0);
      expect(calculateNonSkinScore(0.3)).toBe(1.0);
    });

    it('10-30% 비피부 영역은 중간 점수를 반환한다', () => {
      expect(calculateNonSkinScore(0.2)).toBe(0.7);
      expect(calculateNonSkinScore(0.1)).toBe(0.7);
    });

    it('10% 미만 비피부 영역은 낮은 점수를 반환한다', () => {
      expect(calculateNonSkinScore(0.05)).toBe(0.4);
      expect(calculateNonSkinScore(0)).toBe(0.4);
    });
  });

  // =========================================
  // calculateConfidence 테스트
  // =========================================

  describe('calculateConfidence', () => {
    it('이상적인 조건에서 높은 신뢰도를 반환한다', () => {
      const confidence = calculateConfidence({ r: 1.0, g: 1.0, b: 1.0 }, 6500, 6500, 0.5);
      expect(confidence).toBe(1.0);
    });

    it('좋지 않은 조건에서 낮은 신뢰도를 반환한다', () => {
      const confidence = calculateConfidence({ r: 0.3, g: 0.3, b: 0.3 }, 2000, 6500, 0.05);
      expect(confidence).toBeLessThan(0.5);
    });

    it('기본값이 올바르게 적용된다', () => {
      // 기본 targetCCT = 6500, nonSkinRatio = 0.5
      const confidence = calculateConfidence({ r: 1.0, g: 1.0, b: 1.0 }, 6500);
      expect(confidence).toBe(1.0);
    });
  });

  // =========================================
  // calculateConfidenceDetails 테스트
  // =========================================

  describe('calculateConfidenceDetails', () => {
    it('상세 결과를 반환한다', () => {
      const details = calculateConfidenceDetails({ r: 1.0, g: 1.0, b: 1.0 }, 6500, 6500, 0.5);

      expect(details.total).toBe(1.0);
      expect(details.gainScore).toBe(1.0);
      expect(details.cctScore).toBe(1.0);
      expect(details.nonSkinScore).toBe(1.0);
    });

    it('각 점수에 가중치가 적용된다', () => {
      // 가중치: gain 40%, cct 30%, nonSkin 30%
      const details = calculateConfidenceDetails(
        { r: 1.0, g: 1.0, b: 1.0 }, // gainScore = 1.0
        5500, // cctScore = 0.8 (1000K 차이)
        6500,
        0.5 // nonSkinScore = 1.0
      );

      // total = 1.0 * 0.4 + 0.8 * 0.3 + 1.0 * 0.3 = 0.4 + 0.24 + 0.3 = 0.94
      expect(details.total).toBeCloseTo(0.94, 2);
    });
  });

  // =========================================
  // calculateAWBConfidence 테스트
  // =========================================

  describe('calculateAWBConfidence', () => {
    it('보정 전후 통계로 신뢰도를 계산한다', () => {
      const beforeStats: ColorStats = {
        avgRGB: { r: 200, g: 180, b: 160 },
        cct: 5500,
        nonSkinRatio: 0.4,
      };

      const afterStats: ColorStats = {
        avgRGB: { r: 220, g: 200, b: 180 },
        cct: 6500,
      };

      const confidence = calculateAWBConfidence(beforeStats, afterStats);

      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('기본 목표 색온도를 사용한다', () => {
      const beforeStats: ColorStats = {
        avgRGB: { r: 100, g: 100, b: 100 },
        cct: 6500,
      };

      const afterStats: ColorStats = {
        avgRGB: { r: 100, g: 100, b: 100 },
        cct: 6500,
      };

      const confidence = calculateAWBConfidence(beforeStats, afterStats);
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('0으로 나누는 것을 방지한다', () => {
      const beforeStats: ColorStats = {
        avgRGB: { r: 0, g: 0, b: 0 },
        cct: 6500,
      };

      const afterStats: ColorStats = {
        avgRGB: { r: 100, g: 100, b: 100 },
        cct: 6500,
      };

      // 0으로 나누지 않고 정상 작동해야 함
      const confidence = calculateAWBConfidence(beforeStats, afterStats);
      expect(confidence).toBeDefined();
    });
  });

  // =========================================
  // getMethodDefaultConfidence 테스트
  // =========================================

  describe('getMethodDefaultConfidence', () => {
    it('각 방법에 대한 기본 신뢰도를 반환한다', () => {
      expect(getMethodDefaultConfidence('skin_aware')).toBe(0.85);
      expect(getMethodDefaultConfidence('von_kries')).toBe(0.8);
      expect(getMethodDefaultConfidence('gray_world')).toBe(0.75);
      expect(getMethodDefaultConfidence('none')).toBe(0.9);
    });
  });

  // =========================================
  // adjustConfidenceForFallback 테스트
  // =========================================

  describe('adjustConfidenceForFallback', () => {
    it('cct_estimation_failed에 대해 신뢰도를 감소시킨다', () => {
      expect(adjustConfidenceForFallback(1.0, 'cct_estimation_failed')).toBe(0.85);
    });

    it('skin_mask_failed에 대해 신뢰도를 감소시킨다', () => {
      expect(adjustConfidenceForFallback(1.0, 'skin_mask_failed')).toBe(0.9);
    });

    it('von_kries_failed에 대해 신뢰도를 감소시킨다', () => {
      expect(adjustConfidenceForFallback(1.0, 'von_kries_failed')).toBe(0.8);
    });

    it('clipping_detected에 대해 신뢰도를 감소시킨다', () => {
      expect(adjustConfidenceForFallback(1.0, 'clipping_detected')).toBe(0.9);
    });

    it('최소값 0을 보장한다', () => {
      expect(adjustConfidenceForFallback(0.1, 'von_kries_failed')).toBe(0);
    });
  });
});
