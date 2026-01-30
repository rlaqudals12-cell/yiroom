/**
 * C-2 체형 유형 분류 테스트
 *
 * @see docs/specs/SDD-BODY-ANALYSIS-v2.md
 * @see docs/principles/body-mechanics.md
 */

import { describe, it, expect } from 'vitest';
import {
  classifyBodyType,
  getBodyShapeInfo,
  getAllBodyShapeInfo,
  calculateClassificationConfidence,
  getStylingPriorities,
  getStylesToAvoid,
  BODY_SHAPE_INFO,
} from '@/lib/analysis/body-v2';
import type { BodyRatios, BodyShapeType } from '@/lib/analysis/body-v2';

// 테스트용 기본 비율 헬퍼 (실제 BodyRatios 인터페이스에 맞춤)
function createTestRatios(overrides: Partial<BodyRatios> = {}): BodyRatios {
  const shoulderWidth = overrides.shoulderWidth ?? 40;
  const waistWidth = overrides.waistWidth ?? 36;
  const hipWidth = overrides.hipWidth ?? 40;
  const upperBodyLength = overrides.upperBodyLength ?? 50;
  const lowerBodyLength = overrides.lowerBodyLength ?? 80;
  const armLength = overrides.armLength ?? 60;
  const legLength = overrides.legLength ?? 80;

  return {
    shoulderWidth,
    waistWidth,
    hipWidth,
    shoulderToWaistRatio: shoulderWidth / waistWidth,
    waistToHipRatio: waistWidth / hipWidth,
    upperBodyLength,
    lowerBodyLength,
    upperToLowerRatio: upperBodyLength / lowerBodyLength,
    armLength,
    legLength,
    armToTorsoRatio: armLength / upperBodyLength,
    ...overrides,
  };
}

describe('C-2 Body Type Classifier', () => {
  // ==========================================================================
  // classifyBodyType
  // ==========================================================================
  describe('classifyBodyType', () => {
    it('should classify hourglass shape', () => {
      // 모래시계: 어깨-힙 비슷, 허리 잘록 (75% 이하)
      const ratios = createTestRatios({
        shoulderWidth: 40,
        waistWidth: 28, // 70% of shoulder/hip avg
        hipWidth: 40,
      });

      const result = classifyBodyType(ratios);

      expect(result).toBe('hourglass');
    });

    it('should classify inverted triangle shape', () => {
      // 역삼각형: 어깨 넓고 힙 좁음 (어깨가 힙보다 10%+ 넓음)
      const ratios = createTestRatios({
        shoulderWidth: 48,
        waistWidth: 38,
        hipWidth: 40, // 어깨가 힙보다 20% 넓음
      });

      const result = classifyBodyType(ratios);

      expect(result).toBe('inverted-triangle');
    });

    it('should classify triangle shape', () => {
      // 삼각형: 힙이 어깨보다 10%+ 넓음
      const ratios = createTestRatios({
        shoulderWidth: 36,
        waistWidth: 32,
        hipWidth: 44, // 힙이 어깨보다 22% 넓음
      });

      const result = classifyBodyType(ratios);

      expect(result).toBe('triangle');
    });

    it('should classify oval shape', () => {
      // 타원형: 허리가 가장 넓음
      const ratios = createTestRatios({
        shoulderWidth: 40,
        waistWidth: 45, // 허리가 어깨/힙보다 넓음
        hipWidth: 40,
      });

      const result = classifyBodyType(ratios);

      expect(result).toBe('oval');
    });

    it('should classify rectangle shape as default', () => {
      // 직사각형: 어깨-허리-힙 비슷
      const ratios = createTestRatios({
        shoulderWidth: 40,
        waistWidth: 38,
        hipWidth: 40,
      });

      const result = classifyBodyType(ratios);

      expect(result).toBe('rectangle');
    });
  });

  // ==========================================================================
  // getBodyShapeInfo
  // ==========================================================================
  describe('getBodyShapeInfo', () => {
    it('should return info for valid body shape', () => {
      const info = getBodyShapeInfo('hourglass');

      expect(info).toBeDefined();
      expect(info.label).toBe('모래시계형');
      expect(info.characteristics).toContain('균형 잡힌 상하체');
      expect(info.stylingTips).toBeDefined();
      expect(info.stylingTips.length).toBeGreaterThan(0);
    });

    it('should have info for all 5 body types', () => {
      const types: BodyShapeType[] = [
        'hourglass',
        'inverted-triangle',
        'triangle',
        'rectangle',
        'oval',
      ];

      types.forEach((type) => {
        const info = getBodyShapeInfo(type);
        expect(info).toBeDefined();
        expect(info.type).toBe(type);
        expect(info.label).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // getAllBodyShapeInfo
  // ==========================================================================
  describe('getAllBodyShapeInfo', () => {
    it('should return all 5 body shape infos as array', () => {
      const allInfo = getAllBodyShapeInfo();

      expect(Array.isArray(allInfo)).toBe(true);
      expect(allInfo.length).toBe(5);

      // 모든 체형 타입이 포함되어 있는지 확인
      const types = allInfo.map((info) => info.type);
      expect(types).toContain('hourglass');
      expect(types).toContain('inverted-triangle');
      expect(types).toContain('triangle');
      expect(types).toContain('rectangle');
      expect(types).toContain('oval');
    });
  });

  // ==========================================================================
  // calculateClassificationConfidence
  // ==========================================================================
  describe('calculateClassificationConfidence', () => {
    it('should return high confidence for clear hourglass', () => {
      const ratios = createTestRatios({
        shoulderWidth: 40,
        waistWidth: 26, // 매우 잘록
        hipWidth: 40,
      });

      const confidence = calculateClassificationConfidence(ratios, 'hourglass');

      expect(confidence).toBeGreaterThanOrEqual(80);
    });

    it('should return confidence between 0 and 100', () => {
      const ratios = createTestRatios({
        shoulderWidth: 40,
        waistWidth: 36, // 경계선
        hipWidth: 40,
      });

      const confidence = calculateClassificationConfidence(ratios, 'rectangle');

      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================================================
  // getStylingPriorities
  // ==========================================================================
  describe('getStylingPriorities', () => {
    it('should return styling priorities for body type', () => {
      const priorities = getStylingPriorities('inverted-triangle');

      expect(priorities).toBeDefined();
      expect(priorities.length).toBeGreaterThan(0);
      // 역삼각형은 하체 볼륨 추가가 우선
      expect(
        priorities.some(
          (p) =>
            p.toLowerCase().includes('와이드') ||
            p.toLowerCase().includes('a라인')
        )
      ).toBe(true);
    });

    it('should return priorities for all valid types', () => {
      const types: BodyShapeType[] = [
        'hourglass',
        'inverted-triangle',
        'triangle',
        'rectangle',
        'oval',
      ];

      types.forEach((type) => {
        const priorities = getStylingPriorities(type);
        expect(priorities).toBeDefined();
        expect(Array.isArray(priorities)).toBe(true);
        expect(priorities.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // getStylesToAvoid
  // ==========================================================================
  describe('getStylesToAvoid', () => {
    it('should return styles to avoid for body type', () => {
      const avoid = getStylesToAvoid('oval');

      expect(avoid).toBeDefined();
      expect(avoid.length).toBeGreaterThan(0);
      // 타원형은 타이트핏 피해야 함
      expect(
        avoid.some(
          (s) =>
            s.toLowerCase().includes('타이트') ||
            s.toLowerCase().includes('가로줄')
        )
      ).toBe(true);
    });

    it('should return avoid list for all valid types', () => {
      const types: BodyShapeType[] = [
        'hourglass',
        'inverted-triangle',
        'triangle',
        'rectangle',
        'oval',
      ];

      types.forEach((type) => {
        const avoid = getStylesToAvoid(type);
        expect(avoid).toBeDefined();
        expect(Array.isArray(avoid)).toBe(true);
        expect(avoid.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // BODY_SHAPE_INFO Constant
  // ==========================================================================
  describe('BODY_SHAPE_INFO', () => {
    it('should have all 5 body types', () => {
      expect(BODY_SHAPE_INFO.hourglass).toBeDefined();
      expect(BODY_SHAPE_INFO['inverted-triangle']).toBeDefined();
      expect(BODY_SHAPE_INFO.triangle).toBeDefined();
      expect(BODY_SHAPE_INFO.rectangle).toBeDefined();
      expect(BODY_SHAPE_INFO.oval).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle zero values gracefully', () => {
      const ratios = createTestRatios({
        shoulderWidth: 0,
        waistWidth: 0,
        hipWidth: 0,
      });

      // 0으로 나누기 오류 없이 기본값 반환
      expect(() => classifyBodyType(ratios)).not.toThrow();
    });

    it('should handle very small ratios', () => {
      const ratios = createTestRatios({
        shoulderWidth: 0.1,
        waistWidth: 0.1,
        hipWidth: 0.1,
      });

      expect(() => classifyBodyType(ratios)).not.toThrow();
      expect(classifyBodyType(ratios)).toBeDefined();
    });

    it('should handle negative values without crashing', () => {
      const ratios = createTestRatios({
        shoulderWidth: -40,
        waistWidth: -30,
        hipWidth: -40,
      });

      expect(() => classifyBodyType(ratios)).not.toThrow();
    });

    it('should handle NaN values without crashing', () => {
      const ratios = createTestRatios({
        shoulderWidth: NaN,
        waistWidth: NaN,
        hipWidth: NaN,
      });

      expect(() => classifyBodyType(ratios)).not.toThrow();
    });

    it('should handle Infinity values without crashing', () => {
      const ratios = createTestRatios({
        shoulderWidth: Infinity,
        waistWidth: 40,
        hipWidth: Infinity,
      });

      expect(() => classifyBodyType(ratios)).not.toThrow();
    });

    it('should handle very large values', () => {
      const ratios = createTestRatios({
        shoulderWidth: 1000000,
        waistWidth: 750000, // 75%
        hipWidth: 1000000,
      });

      expect(() => classifyBodyType(ratios)).not.toThrow();
      // 비율이 맞으면 hourglass
      expect(classifyBodyType(ratios)).toBe('hourglass');
    });
  });

  // ==========================================================================
  // Boundary Value Tests (BODY_SHAPE_THRESHOLDS 기준)
  // ==========================================================================
  describe('Boundary Value Tests', () => {
    describe('hourglass boundary (waist <= 75% of avg shoulder/hip)', () => {
      it('should classify as hourglass when waist is exactly 75%', () => {
        // 허리가 정확히 75%
        const ratios = createTestRatios({
          shoulderWidth: 40,
          waistWidth: 30, // 30 / 40 = 75%
          hipWidth: 40,
        });

        expect(classifyBodyType(ratios)).toBe('hourglass');
      });

      it('should NOT classify as hourglass when waist is 76%', () => {
        // 허리가 76% (임계값 초과)
        const ratios = createTestRatios({
          shoulderWidth: 40,
          waistWidth: 30.4, // 76%
          hipWidth: 40,
        });

        expect(classifyBodyType(ratios)).not.toBe('hourglass');
      });

      it('should classify as hourglass when waist is 74%', () => {
        // 허리가 74% (임계값 미만)
        const ratios = createTestRatios({
          shoulderWidth: 40,
          waistWidth: 29.6, // 74%
          hipWidth: 40,
        });

        expect(classifyBodyType(ratios)).toBe('hourglass');
      });
    });

    describe('inverted-triangle boundary (shoulder >= 110% of hip)', () => {
      it('should classify as inverted-triangle when shoulder is exactly 110%', () => {
        const ratios = createTestRatios({
          shoulderWidth: 44, // 110% of 40
          waistWidth: 38, // 너무 잘록하지 않게
          hipWidth: 40,
        });

        expect(classifyBodyType(ratios)).toBe('inverted-triangle');
      });

      it('should NOT classify as inverted-triangle when shoulder is 109%', () => {
        const ratios = createTestRatios({
          shoulderWidth: 43.6, // 109%
          waistWidth: 38,
          hipWidth: 40,
        });

        expect(classifyBodyType(ratios)).not.toBe('inverted-triangle');
      });

      it('should classify as inverted-triangle when shoulder is 120%', () => {
        // waist는 shoulder/hip보다 작아야 oval 조건 회피
        const ratios = createTestRatios({
          shoulderWidth: 48, // 120% of hip
          waistWidth: 35, // < shoulder AND < hip (oval 회피)
          hipWidth: 40,
        });

        expect(classifyBodyType(ratios)).toBe('inverted-triangle');
      });
    });

    describe('triangle boundary (hip >= 110% of shoulder)', () => {
      it('should classify as triangle when hip is exactly 110%', () => {
        const ratios = createTestRatios({
          shoulderWidth: 36,
          waistWidth: 34,
          hipWidth: 39.6, // 110% of 36
        });

        expect(classifyBodyType(ratios)).toBe('triangle');
      });

      it('should NOT classify as triangle when hip is 109%', () => {
        const ratios = createTestRatios({
          shoulderWidth: 36,
          waistWidth: 34,
          hipWidth: 39.24, // 109%
        });

        expect(classifyBodyType(ratios)).not.toBe('triangle');
      });

      it('should classify as triangle when hip is 125%', () => {
        const ratios = createTestRatios({
          shoulderWidth: 32,
          waistWidth: 30,
          hipWidth: 40, // 125%
        });

        expect(classifyBodyType(ratios)).toBe('triangle');
      });
    });

    describe('oval boundary (waist >= shoulder or hip)', () => {
      it('should classify as oval when waist equals shoulder', () => {
        const ratios = createTestRatios({
          shoulderWidth: 40,
          waistWidth: 40, // 100%
          hipWidth: 38,
        });

        expect(classifyBodyType(ratios)).toBe('oval');
      });

      it('should classify as oval when waist exceeds both', () => {
        const ratios = createTestRatios({
          shoulderWidth: 38,
          waistWidth: 42,
          hipWidth: 38,
        });

        expect(classifyBodyType(ratios)).toBe('oval');
      });

      it('should NOT classify as oval when waist is 99%', () => {
        const ratios = createTestRatios({
          shoulderWidth: 40,
          waistWidth: 39.6, // 99%
          hipWidth: 40,
        });

        expect(classifyBodyType(ratios)).not.toBe('oval');
      });
    });
  });

  // ==========================================================================
  // Classification Priority Tests
  // ==========================================================================
  describe('Classification Priority', () => {
    it('hourglass takes priority when both hourglass and inverted-triangle conditions met', () => {
      // 어깨 > 힙 (역삼각형 조건) + 허리 잘록 (모래시계 조건)
      const ratios = createTestRatios({
        shoulderWidth: 44, // 110% of hip
        waistWidth: 27, // 61% of avg (잘록)
        hipWidth: 40,
      });

      // 모래시계가 먼저 체크되므로 모래시계 우선
      expect(classifyBodyType(ratios)).toBe('hourglass');
    });

    it('oval takes priority over inverted-triangle when conditions overlap', () => {
      // 어깨 넓음 + 허리도 넓음
      const ratios = createTestRatios({
        shoulderWidth: 44,
        waistWidth: 45, // 허리가 가장 넓음
        hipWidth: 40,
      });

      // 타원형이 역삼각형보다 먼저 체크됨
      expect(classifyBodyType(ratios)).toBe('oval');
    });

    it('rectangle is default when no other conditions met', () => {
      // 모든 비율이 비슷
      const ratios = createTestRatios({
        shoulderWidth: 40,
        waistWidth: 37, // 92.5% - 허리가 살짝 잘록하지만 75% 이하 아님
        hipWidth: 40,
      });

      expect(classifyBodyType(ratios)).toBe('rectangle');
    });
  });

  // ==========================================================================
  // Confidence Edge Cases
  // ==========================================================================
  describe('Confidence Edge Cases', () => {
    it('should return max 100 even with extreme values', () => {
      const ratios = createTestRatios({
        shoulderWidth: 40,
        waistWidth: 15, // 매우 잘록
        hipWidth: 40,
      });

      const confidence = calculateClassificationConfidence(ratios, 'hourglass');
      expect(confidence).toBeLessThanOrEqual(100);
    });

    it('should return min 0 even with mismatched classification', () => {
      const ratios = createTestRatios({
        shoulderWidth: 40,
        waistWidth: 50, // 허리가 가장 넓음 (oval)
        hipWidth: 40,
      });

      const confidence = calculateClassificationConfidence(ratios, 'hourglass');
      expect(confidence).toBeGreaterThanOrEqual(0);
    });

    it('should have higher confidence for clearer body types', () => {
      // 명확한 역삼각형
      const clearInverted = createTestRatios({
        shoulderWidth: 52, // 130% of hip
        waistWidth: 40,
        hipWidth: 40,
      });

      // 경계선 역삼각형
      const borderlineInverted = createTestRatios({
        shoulderWidth: 44.1, // 110.25% of hip
        waistWidth: 40,
        hipWidth: 40,
      });

      const clearConfidence = calculateClassificationConfidence(clearInverted, 'inverted-triangle');
      const borderlineConfidence = calculateClassificationConfidence(borderlineInverted, 'inverted-triangle');

      expect(clearConfidence).toBeGreaterThan(borderlineConfidence);
    });
  });
});
