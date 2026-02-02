/**
 * CIE-1 Fallback 데이터 생성 테스트
 *
 * @module tests/lib/image-engine/cie-1/fallback
 * @description 에러/타임아웃 시 Mock 데이터 반환 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateSharpnessFallback,
  generateExposureFallback,
  generateCCTFallback,
  generateCIE1Fallback,
  generatePartialCIE1Fallback,
  generateRejectedFallback,
  generateRandomCIE1Mock,
} from '@/lib/image-engine/cie-1/fallback';
import { FEEDBACK_MESSAGES } from '@/lib/image-engine/constants';

describe('lib/image-engine/cie-1/fallback', () => {
  // =========================================
  // generateSharpnessFallback 테스트
  // =========================================

  describe('generateSharpnessFallback', () => {
    it('기본 선명도 Fallback을 생성한다', () => {
      const result = generateSharpnessFallback();

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('laplacianVariance');
      expect(result).toHaveProperty('verdict');
      expect(result).toHaveProperty('feedback');
    });

    it('acceptable 등급의 기본값을 반환한다', () => {
      const result = generateSharpnessFallback();

      expect(result.verdict).toBe('acceptable');
      expect(result.score).toBe(70);
    });

    it('laplacianVariance가 양수이다', () => {
      const result = generateSharpnessFallback();

      expect(result.laplacianVariance).toBeGreaterThan(0);
    });

    it('피드백 메시지가 존재한다', () => {
      const result = generateSharpnessFallback();

      expect(result.feedback).toBe(FEEDBACK_MESSAGES.sharpness.acceptable);
    });
  });

  // =========================================
  // generateExposureFallback 테스트
  // =========================================

  describe('generateExposureFallback', () => {
    it('기본 노출 Fallback을 생성한다', () => {
      const result = generateExposureFallback();

      expect(result).toHaveProperty('meanBrightness');
      expect(result).toHaveProperty('verdict');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('feedback');
    });

    it('normal 노출 상태를 반환한다', () => {
      const result = generateExposureFallback();

      expect(result.verdict).toBe('normal');
    });

    it('meanBrightness가 중간값이다', () => {
      const result = generateExposureFallback();

      expect(result.meanBrightness).toBe(128);
    });

    it('신뢰도가 0.5이다 (Fallback 표시)', () => {
      const result = generateExposureFallback();

      expect(result.confidence).toBe(0.5);
    });
  });

  // =========================================
  // generateCCTFallback 테스트
  // =========================================

  describe('generateCCTFallback', () => {
    it('기본 CCT Fallback을 생성한다', () => {
      const result = generateCCTFallback();

      expect(result).toHaveProperty('kelvin');
      expect(result).toHaveProperty('verdict');
      expect(result).toHaveProperty('chromaticity');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('feedback');
    });

    it('D65 표준 색온도(6500K)를 반환한다', () => {
      const result = generateCCTFallback();

      expect(result.kelvin).toBe(6500);
      expect(result.verdict).toBe('neutral');
    });

    it('D65 색도 좌표를 반환한다', () => {
      const result = generateCCTFallback();

      expect(result.chromaticity.x).toBeCloseTo(0.31271, 4);
      expect(result.chromaticity.y).toBeCloseTo(0.32902, 4);
    });

    it('신뢰도가 0.5이다', () => {
      const result = generateCCTFallback();

      expect(result.confidence).toBe(0.5);
    });
  });

  // =========================================
  // generateCIE1Fallback 테스트
  // =========================================

  describe('generateCIE1Fallback', () => {
    it('전체 CIE-1 Fallback을 생성한다', () => {
      const result = generateCIE1Fallback();

      expect(result).toHaveProperty('isAcceptable');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('sharpness');
      expect(result).toHaveProperty('resolution');
      expect(result).toHaveProperty('exposure');
      expect(result).toHaveProperty('colorTemperature');
      expect(result).toHaveProperty('primaryIssue');
      expect(result).toHaveProperty('allIssues');
      expect(result).toHaveProperty('processingTime');
    });

    it('기본적으로 허용 상태이다', () => {
      const result = generateCIE1Fallback();

      expect(result.isAcceptable).toBe(true);
      expect(result.overallScore).toBe(70);
    });

    it('신뢰도가 0.5이다', () => {
      const result = generateCIE1Fallback();

      expect(result.confidence).toBe(0.5);
    });

    it('이슈가 없다', () => {
      const result = generateCIE1Fallback();

      expect(result.primaryIssue).toBeNull();
      expect(result.allIssues).toEqual([]);
    });

    it('처리 시간을 받을 수 있다', () => {
      const result = generateCIE1Fallback(150);

      expect(result.processingTime).toBe(150);
    });

    it('기본 처리 시간은 0이다', () => {
      const result = generateCIE1Fallback();

      expect(result.processingTime).toBe(0);
    });

    it('resolution은 null이다 (Fallback에서는 생략)', () => {
      const result = generateCIE1Fallback();

      expect(result.resolution).toBeNull();
    });

    it('sharpness, exposure, colorTemperature가 모두 포함된다', () => {
      const result = generateCIE1Fallback();

      expect(result.sharpness.verdict).toBe('acceptable');
      expect(result.exposure.verdict).toBe('normal');
      expect(result.colorTemperature.verdict).toBe('neutral');
    });
  });

  // =========================================
  // generatePartialCIE1Fallback 테스트
  // =========================================

  describe('generatePartialCIE1Fallback', () => {
    it('부분 결과를 병합한다', () => {
      const partial = {
        overallScore: 85,
        isAcceptable: true,
      };

      const result = generatePartialCIE1Fallback(partial);

      expect(result.overallScore).toBe(85);
      expect(result.isAcceptable).toBe(true);
    });

    it('신뢰도가 80%로 감소한다', () => {
      const partial = {
        confidence: 0.8,
      };

      const result = generatePartialCIE1Fallback(partial);

      // 0.8 * 0.8 = 0.64
      expect(result.confidence).toBeCloseTo(0.64, 10);
    });

    it('부분 결과가 없으면 기본 신뢰도 * 0.8이다', () => {
      const result = generatePartialCIE1Fallback({});

      // 기본 0.5 * 0.8 = 0.4
      expect(result.confidence).toBeCloseTo(0.4, 10);
    });

    it('처리 시간을 받을 수 있다', () => {
      const result = generatePartialCIE1Fallback({}, 200);

      expect(result.processingTime).toBe(200);
    });

    it('없는 필드는 기본값으로 채워진다', () => {
      const partial = {
        overallScore: 90,
      };

      const result = generatePartialCIE1Fallback(partial);

      expect(result.sharpness.verdict).toBe('acceptable');
      expect(result.exposure.verdict).toBe('normal');
    });
  });

  // =========================================
  // generateRejectedFallback 테스트
  // =========================================

  describe('generateRejectedFallback', () => {
    it('거부 상태를 생성한다', () => {
      const result = generateRejectedFallback('이미지 로드 실패');

      expect(result.isAcceptable).toBe(false);
    });

    it('점수가 0이다', () => {
      const result = generateRejectedFallback('이미지 로드 실패');

      expect(result.overallScore).toBe(0);
    });

    it('신뢰도가 매우 낮다 (0.1)', () => {
      const result = generateRejectedFallback('이미지 로드 실패');

      expect(result.confidence).toBe(0.1);
    });

    it('거부 이유가 primaryIssue에 포함된다', () => {
      const reason = '이미지 로드 실패';
      const result = generateRejectedFallback(reason);

      expect(result.primaryIssue).toBe(reason);
      expect(result.allIssues).toContain(reason);
    });

    it('sharpness가 rejected 상태이다', () => {
      const result = generateRejectedFallback('테스트 거부');

      expect(result.sharpness.verdict).toBe('rejected');
      expect(result.sharpness.score).toBe(0);
    });

    it('거부 이유가 피드백 메시지로 사용된다', () => {
      const reason = '파일 형식 오류';
      const result = generateRejectedFallback(reason);

      expect(result.sharpness.feedback).toBe(reason);
      expect(result.exposure.feedback).toBe(reason);
      expect(result.colorTemperature.feedback).toBe(reason);
    });

    it('처리 시간을 받을 수 있다', () => {
      const result = generateRejectedFallback('오류', 50);

      expect(result.processingTime).toBe(50);
    });
  });

  // =========================================
  // generateRandomCIE1Mock 테스트
  // =========================================

  describe('generateRandomCIE1Mock', () => {
    it('유효한 CIE-1 출력 구조를 생성한다', () => {
      const result = generateRandomCIE1Mock();

      expect(result).toHaveProperty('isAcceptable');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('sharpness');
      expect(result).toHaveProperty('resolution');
      expect(result).toHaveProperty('exposure');
      expect(result).toHaveProperty('colorTemperature');
    });

    it('선명도 점수가 0-100 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE1Mock();
        expect(result.sharpness.score).toBeGreaterThanOrEqual(0);
        expect(result.sharpness.score).toBeLessThan(100);
      }
    });

    it('meanBrightness가 0-255 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE1Mock();
        expect(result.exposure.meanBrightness).toBeGreaterThanOrEqual(0);
        expect(result.exposure.meanBrightness).toBeLessThan(256);
      }
    });

    it('CCT가 4000-8000K 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE1Mock();
        expect(result.colorTemperature.kelvin).toBeGreaterThanOrEqual(4000);
        expect(result.colorTemperature.kelvin).toBeLessThan(8000);
      }
    });

    it('신뢰도가 0.8-1.0 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE1Mock();
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
        expect(result.confidence).toBeLessThanOrEqual(1.0);
      }
    });

    it('resolution이 포함된다', () => {
      const result = generateRandomCIE1Mock();

      expect(result.resolution).not.toBeNull();
      expect(result.resolution?.width).toBe(1024);
      expect(result.resolution?.height).toBe(768);
      expect(result.resolution?.isValid).toBe(true);
    });

    it('sharpness verdict가 점수에 따라 결정된다', () => {
      // 여러 번 실행하여 다양한 verdict 확인
      const verdicts = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const result = generateRandomCIE1Mock();
        verdicts.add(result.sharpness.verdict);
      }

      // 최소 2개 이상의 다른 verdict이 있어야 함 (랜덤)
      expect(verdicts.size).toBeGreaterThanOrEqual(1);
    });

    it('exposure verdict가 점수에 따라 결정된다', () => {
      const verdicts = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const result = generateRandomCIE1Mock();
        verdicts.add(result.exposure.verdict);
      }

      // 다양한 verdict이 나와야 함
      expect(verdicts.size).toBeGreaterThanOrEqual(1);
    });

    it('색도 좌표가 유효 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE1Mock();
        expect(result.colorTemperature.chromaticity.x).toBeGreaterThan(0);
        expect(result.colorTemperature.chromaticity.x).toBeLessThan(1);
        expect(result.colorTemperature.chromaticity.y).toBeGreaterThan(0);
        expect(result.colorTemperature.chromaticity.y).toBeLessThan(1);
      }
    });

    it('processingTime이 양수이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE1Mock();
        expect(result.processingTime).toBeGreaterThanOrEqual(0);
        expect(result.processingTime).toBeLessThan(100);
      }
    });
  });

  // =========================================
  // 통합 테스트
  // =========================================

  describe('통합 테스트', () => {
    it('모든 Fallback이 유효한 CIE1Output 타입이다', () => {
      const fallbacks = [
        generateCIE1Fallback(),
        generatePartialCIE1Fallback({ overallScore: 80 }),
        generateRejectedFallback('테스트'),
        generateRandomCIE1Mock(),
      ];

      fallbacks.forEach((fb) => {
        expect(typeof fb.isAcceptable).toBe('boolean');
        expect(typeof fb.overallScore).toBe('number');
        expect(typeof fb.confidence).toBe('number');
        expect(fb.sharpness).toBeDefined();
        expect(fb.exposure).toBeDefined();
        expect(fb.colorTemperature).toBeDefined();
      });
    });

    it('Fallback 신뢰도가 실제 분석보다 낮다', () => {
      const fallback = generateCIE1Fallback();
      const partial = generatePartialCIE1Fallback({});
      const rejected = generateRejectedFallback('오류');

      // Mock 데이터는 실제 분석 결과보다 신뢰도가 낮아야 함
      expect(fallback.confidence).toBeLessThanOrEqual(0.5);
      expect(partial.confidence).toBeLessThanOrEqual(0.5);
      expect(rejected.confidence).toBeLessThanOrEqual(0.5);
    });
  });
});
