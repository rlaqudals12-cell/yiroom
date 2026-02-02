/**
 * CIE-4 Fallback 데이터 생성 테스트
 *
 * @module tests/lib/image-engine/cie-4/fallback
 * @description 에러/타임아웃 시 Mock 데이터 반환 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateZoneAnalysisFallback,
  generateShadowAnalysisFallback,
  generateCIE4Fallback,
  generateErrorCIE4Fallback,
  generateRandomCIE4Mock,
  generateConditionedCIE4Mock,
} from '@/lib/image-engine/cie-4/fallback';
import { D65_CCT } from '@/lib/image-engine/constants';

describe('lib/image-engine/cie-4/fallback', () => {
  // =========================================
  // generateZoneAnalysisFallback 테스트
  // =========================================

  describe('generateZoneAnalysisFallback', () => {
    it('기본 6존 분석 Fallback을 생성한다', () => {
      const result = generateZoneAnalysisFallback();

      expect(result).toHaveProperty('zones');
      expect(result).toHaveProperty('uniformity');
      expect(result).toHaveProperty('leftRightBalance');
      expect(result).toHaveProperty('verticalGradient');
    });

    it('6개 존이 모두 포함된다', () => {
      const result = generateZoneAnalysisFallback();

      expect(result.zones).toHaveLength(6);

      const zoneNames = result.zones.map((z) => z.name);
      expect(zoneNames).toContain('forehead_left');
      expect(zoneNames).toContain('forehead_right');
      expect(zoneNames).toContain('cheek_left');
      expect(zoneNames).toContain('cheek_right');
      expect(zoneNames).toContain('chin_left');
      expect(zoneNames).toContain('chin_right');
    });

    it('모든 존의 상태가 normal이다', () => {
      const result = generateZoneAnalysisFallback();

      result.zones.forEach((zone) => {
        expect(zone.status).toBe('normal');
      });
    });

    it('균일성이 높다 (0.9)', () => {
      const result = generateZoneAnalysisFallback();

      expect(result.uniformity).toBe(0.9);
    });

    it('좌우 밸런스가 완벽하다 (1.0)', () => {
      const result = generateZoneAnalysisFallback();

      expect(result.leftRightBalance).toBe(1.0);
    });

    it('수직 그라디언트가 거의 없다', () => {
      const result = generateZoneAnalysisFallback();

      expect(result.verticalGradient).toBeCloseTo(-0.05, 2);
    });

    it('밝기 값이 합리적 범위이다', () => {
      const result = generateZoneAnalysisFallback();

      result.zones.forEach((zone) => {
        expect(zone.brightness).toBeGreaterThanOrEqual(100);
        expect(zone.brightness).toBeLessThanOrEqual(140);
      });
    });
  });

  // =========================================
  // generateShadowAnalysisFallback 테스트
  // =========================================

  describe('generateShadowAnalysisFallback', () => {
    it('기본 그림자 분석 Fallback을 생성한다', () => {
      const result = generateShadowAnalysisFallback();

      expect(result).toHaveProperty('hasShadow');
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('intensity');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('darkAreaRatio');
      expect(result).toHaveProperty('overexposedRatio');
      expect(result).toHaveProperty('recommendation');
    });

    it('그림자가 없다', () => {
      const result = generateShadowAnalysisFallback();

      expect(result.hasShadow).toBe(false);
      expect(result.direction).toBe('none');
      expect(result.intensity).toBe(0);
      expect(result.severity).toBe('none');
    });

    it('어두운 영역 비율이 0이다', () => {
      const result = generateShadowAnalysisFallback();

      expect(result.darkAreaRatio).toBe(0);
    });

    it('과노출 영역 비율이 0이다', () => {
      const result = generateShadowAnalysisFallback();

      expect(result.overexposedRatio).toBe(0);
    });

    it('긍정적인 피드백 메시지를 반환한다', () => {
      const result = generateShadowAnalysisFallback();

      expect(result.recommendation).toBe('조명 상태가 양호합니다.');
    });
  });

  // =========================================
  // generateCIE4Fallback 테스트
  // =========================================

  describe('generateCIE4Fallback', () => {
    it('전체 CIE-4 Fallback을 생성한다', () => {
      const result = generateCIE4Fallback();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('isSuitable');
      expect(result).toHaveProperty('estimatedCCT');
      expect(result).toHaveProperty('lightingType');
      expect(result).toHaveProperty('cctSuitability');
      expect(result).toHaveProperty('requiresCorrection');
      expect(result).toHaveProperty('zoneAnalysis');
      expect(result).toHaveProperty('shadowAnalysis');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('metadata');
    });

    it('성공 상태를 반환한다', () => {
      const result = generateCIE4Fallback();

      expect(result.success).toBe(true);
      expect(result.isSuitable).toBe(true);
    });

    it('D65 색온도를 반환한다', () => {
      const result = generateCIE4Fallback();

      expect(result.estimatedCCT).toBe(D65_CCT);
      expect(result.lightingType).toBe('neutral');
    });

    it('보정이 필요하지 않다', () => {
      const result = generateCIE4Fallback();

      expect(result.requiresCorrection).toBe(false);
    });

    it('zoneAnalysis와 shadowAnalysis가 null이다 (Fallback에서 생략)', () => {
      const result = generateCIE4Fallback();

      expect(result.zoneAnalysis).toBeNull();
      expect(result.shadowAnalysis).toBeNull();
    });

    it('전체 점수가 80이다', () => {
      const result = generateCIE4Fallback();

      expect(result.overallScore).toBe(80);
    });

    it('CCT 적합도가 90이다', () => {
      const result = generateCIE4Fallback();

      expect(result.cctSuitability).toBe(90);
    });

    it('피드백이 있다', () => {
      const result = generateCIE4Fallback();

      expect(result.feedback).toHaveLength(1);
      expect(result.feedback[0]).toContain('기본값');
    });

    it('metadata에 신뢰도 0.5가 있다', () => {
      const result = generateCIE4Fallback();

      expect(result.metadata.confidence).toBe(0.5);
      expect(result.metadata.hasFaceRegion).toBe(false);
    });

    it('처리 시간을 받을 수 있다', () => {
      const result = generateCIE4Fallback(150);

      expect(result.metadata.processingTime).toBe(150);
    });

    it('기본 처리 시간은 0이다', () => {
      const result = generateCIE4Fallback();

      expect(result.metadata.processingTime).toBe(0);
    });
  });

  // =========================================
  // generateErrorCIE4Fallback 테스트
  // =========================================

  describe('generateErrorCIE4Fallback', () => {
    it('에러 상태를 생성한다', () => {
      const result = generateErrorCIE4Fallback('조명 분석 실패');

      expect(result.success).toBe(false);
      expect(result.isSuitable).toBe(false);
    });

    it('에러 메시지가 피드백에 포함된다', () => {
      const errorMessage = '메모리 부족';
      const result = generateErrorCIE4Fallback(errorMessage);

      expect(result.feedback).toHaveLength(1);
      expect(result.feedback[0]).toContain(errorMessage);
    });

    it('D65 색온도를 반환한다 (기본값)', () => {
      const result = generateErrorCIE4Fallback('오류');

      expect(result.estimatedCCT).toBe(D65_CCT);
    });

    it('신뢰도가 0이다', () => {
      const result = generateErrorCIE4Fallback('오류');

      expect(result.metadata.confidence).toBe(0);
    });

    it('전체 점수가 50이다', () => {
      const result = generateErrorCIE4Fallback('오류');

      expect(result.overallScore).toBe(50);
      expect(result.cctSuitability).toBe(50);
    });

    it('보정이 필요하지 않다', () => {
      const result = generateErrorCIE4Fallback('오류');

      expect(result.requiresCorrection).toBe(false);
    });

    it('zoneAnalysis와 shadowAnalysis가 null이다', () => {
      const result = generateErrorCIE4Fallback('오류');

      expect(result.zoneAnalysis).toBeNull();
      expect(result.shadowAnalysis).toBeNull();
    });

    it('처리 시간을 받을 수 있다', () => {
      const result = generateErrorCIE4Fallback('오류', 50);

      expect(result.metadata.processingTime).toBe(50);
    });
  });

  // =========================================
  // generateRandomCIE4Mock 테스트
  // =========================================

  describe('generateRandomCIE4Mock', () => {
    it('유효한 CIE-4 출력 구조를 생성한다', () => {
      const result = generateRandomCIE4Mock();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('isSuitable');
      expect(result).toHaveProperty('estimatedCCT');
      expect(result).toHaveProperty('lightingType');
      expect(result).toHaveProperty('zoneAnalysis');
      expect(result).toHaveProperty('shadowAnalysis');
    });

    it('항상 성공 상태이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE4Mock();
        expect(result.success).toBe(true);
      }
    });

    it('CCT가 4500-8000K 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE4Mock();
        expect(result.estimatedCCT).toBeGreaterThanOrEqual(4500);
        expect(result.estimatedCCT).toBeLessThan(8000);
      }
    });

    it('lightingType이 유효한 값이다', () => {
      const validTypes = ['warm', 'neutral', 'cool'];

      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE4Mock();
        expect(validTypes).toContain(result.lightingType);
      }
    });

    it('zoneAnalysis가 6개 존을 포함한다', () => {
      for (let i = 0; i < 5; i++) {
        const result = generateRandomCIE4Mock();
        expect(result.zoneAnalysis).not.toBeNull();
        expect(result.zoneAnalysis?.zones).toHaveLength(6);
      }
    });

    it('shadowAnalysis가 유효한 값을 가진다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE4Mock();
        expect(result.shadowAnalysis).not.toBeNull();
        expect(typeof result.shadowAnalysis?.hasShadow).toBe('boolean');
      }
    });

    it('균일성이 0.6-1.0 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE4Mock();
        expect(result.zoneAnalysis?.uniformity).toBeGreaterThanOrEqual(0.6);
        expect(result.zoneAnalysis?.uniformity).toBeLessThanOrEqual(1.0);
      }
    });

    it('그림자 감지가 약 30% 확률이다', () => {
      let shadowCount = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const result = generateRandomCIE4Mock();
        if (result.shadowAnalysis?.hasShadow) shadowCount++;
      }

      // 30%에 가까워야 함 (10-50 범위 허용)
      expect(shadowCount).toBeGreaterThan(10);
      expect(shadowCount).toBeLessThan(50);
    });

    it('전체 점수가 60-100 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE4Mock();
        expect(result.overallScore).toBeGreaterThanOrEqual(60);
        expect(result.overallScore).toBeLessThanOrEqual(100);
      }
    });

    it('신뢰도가 0.7-1.0 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE4Mock();
        expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.7);
        expect(result.metadata.confidence).toBeLessThanOrEqual(1.0);
      }
    });

    it('hasFaceRegion이 true이다', () => {
      for (let i = 0; i < 5; i++) {
        const result = generateRandomCIE4Mock();
        expect(result.metadata.hasFaceRegion).toBe(true);
      }
    });

    it('requiresCorrection이 CCT에 따라 결정된다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE4Mock();
        const needsCorrection = result.estimatedCCT < 4500 || result.estimatedCCT > 7500;
        expect(result.requiresCorrection).toBe(needsCorrection);
      }
    });
  });

  // =========================================
  // generateConditionedCIE4Mock 테스트
  // =========================================

  describe('generateConditionedCIE4Mock', () => {
    it('optimal 조건에서 높은 점수를 반환한다', () => {
      const result = generateConditionedCIE4Mock('optimal');

      expect(result.estimatedCCT).toBe(6500);
      expect(result.lightingType).toBe('neutral');
      expect(result.cctSuitability).toBe(95);
      expect(result.overallScore).toBe(90);
      expect(result.isSuitable).toBe(true);
      expect(result.requiresCorrection).toBe(false);
    });

    it('warm_light 조건에서 낮은 CCT를 반환한다', () => {
      const result = generateConditionedCIE4Mock('warm_light');

      expect(result.estimatedCCT).toBe(3500);
      expect(result.lightingType).toBe('warm');
      expect(result.isSuitable).toBe(false);
      expect(result.requiresCorrection).toBe(true);
    });

    it('cool_light 조건에서 높은 CCT를 반환한다', () => {
      const result = generateConditionedCIE4Mock('cool_light');

      expect(result.estimatedCCT).toBe(8500);
      expect(result.lightingType).toBe('cool');
      expect(result.isSuitable).toBe(false);
      expect(result.requiresCorrection).toBe(true);
    });

    it('harsh_shadow 조건에서 낮은 점수를 반환한다', () => {
      const result = generateConditionedCIE4Mock('harsh_shadow');

      expect(result.overallScore).toBe(45);
      expect(result.isSuitable).toBe(false);
    });

    it('dark 조건에서 가장 낮은 점수를 반환한다', () => {
      const result = generateConditionedCIE4Mock('dark');

      expect(result.overallScore).toBe(35);
      expect(result.isSuitable).toBe(false);
    });

    it('각 조건에 적절한 피드백이 있다', () => {
      const conditions = [
        'optimal',
        'warm_light',
        'cool_light',
        'harsh_shadow',
        'dark',
      ] as const;

      conditions.forEach((condition) => {
        const result = generateConditionedCIE4Mock(condition);
        expect(result.feedback).toHaveLength(1);
        expect(result.feedback[0].length).toBeGreaterThan(0);
      });
    });

    it('모든 조건에서 success는 true이다', () => {
      const conditions = [
        'optimal',
        'warm_light',
        'cool_light',
        'harsh_shadow',
        'dark',
      ] as const;

      conditions.forEach((condition) => {
        const result = generateConditionedCIE4Mock(condition);
        expect(result.success).toBe(true);
      });
    });
  });

  // =========================================
  // 통합 테스트
  // =========================================

  describe('통합 테스트', () => {
    it('모든 Fallback이 유효한 CIE4Output 타입이다', () => {
      const fallbacks = [
        generateCIE4Fallback(),
        generateErrorCIE4Fallback('테스트'),
        generateRandomCIE4Mock(),
        generateConditionedCIE4Mock('optimal'),
      ];

      fallbacks.forEach((fb) => {
        expect(typeof fb.success).toBe('boolean');
        expect(typeof fb.isSuitable).toBe('boolean');
        expect(typeof fb.estimatedCCT).toBe('number');
        expect(typeof fb.overallScore).toBe('number');
        expect(fb.metadata).toBeDefined();
      });
    });

    it('Fallback 신뢰도가 실제 분석보다 낮다', () => {
      const fallback = generateCIE4Fallback();
      const error = generateErrorCIE4Fallback('오류');

      expect(fallback.metadata.confidence).toBeLessThanOrEqual(0.5);
      expect(error.metadata.confidence).toBe(0);
    });

    it('에러 상태만 success가 false이다', () => {
      expect(generateCIE4Fallback().success).toBe(true);
      expect(generateRandomCIE4Mock().success).toBe(true);
      expect(generateConditionedCIE4Mock('dark').success).toBe(true);
      expect(generateErrorCIE4Fallback('오류').success).toBe(false);
    });

    it('CCT와 lightingType이 일관성 있다', () => {
      // warm
      const warm = generateConditionedCIE4Mock('warm_light');
      expect(warm.estimatedCCT).toBeLessThan(5000);
      expect(warm.lightingType).toBe('warm');

      // cool
      const cool = generateConditionedCIE4Mock('cool_light');
      expect(cool.estimatedCCT).toBeGreaterThan(7000);
      expect(cool.lightingType).toBe('cool');

      // neutral
      const neutral = generateConditionedCIE4Mock('optimal');
      expect(neutral.estimatedCCT).toBeGreaterThanOrEqual(5500);
      expect(neutral.estimatedCCT).toBeLessThanOrEqual(7000);
      expect(neutral.lightingType).toBe('neutral');
    });

    it('isSuitable과 overallScore가 일관성 있다', () => {
      const optimal = generateConditionedCIE4Mock('optimal');
      const dark = generateConditionedCIE4Mock('dark');

      // 높은 점수 = suitable
      expect(optimal.overallScore).toBeGreaterThanOrEqual(80);
      expect(optimal.isSuitable).toBe(true);

      // 낮은 점수 = not suitable
      expect(dark.overallScore).toBeLessThan(50);
      expect(dark.isSuitable).toBe(false);
    });
  });
});
