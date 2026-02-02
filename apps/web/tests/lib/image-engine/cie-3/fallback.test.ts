/**
 * CIE-3 Fallback 데이터 생성 테스트
 *
 * @module tests/lib/image-engine/cie-3/fallback
 * @description 에러/타임아웃 시 Mock 데이터 반환 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateAWBCorrectionFallback,
  generateCIE3Fallback,
  generateCorrectedFallback,
  generateErrorCIE3Fallback,
  generateRandomCIE3Mock,
} from '@/lib/image-engine/cie-3/fallback';

describe('lib/image-engine/cie-3/fallback', () => {
  // =========================================
  // generateAWBCorrectionFallback 테스트
  // =========================================

  describe('generateAWBCorrectionFallback', () => {
    it('기본 AWB 보정 Fallback을 생성한다', () => {
      const result = generateAWBCorrectionFallback();

      expect(result).toHaveProperty('correctedImage');
      expect(result).toHaveProperty('gains');
      expect(result).toHaveProperty('originalCCT');
      expect(result).toHaveProperty('correctedCCT');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('confidence');
    });

    it('게인 값이 1 (보정 없음)이다', () => {
      const result = generateAWBCorrectionFallback();

      expect(result.gains.r).toBe(1);
      expect(result.gains.g).toBe(1);
      expect(result.gains.b).toBe(1);
    });

    it('D65 색온도(6500K)를 반환한다', () => {
      const result = generateAWBCorrectionFallback();

      expect(result.originalCCT).toBe(6500);
      expect(result.correctedCCT).toBe(6500);
    });

    it('method가 none이다', () => {
      const result = generateAWBCorrectionFallback();

      expect(result.method).toBe('none');
    });

    it('신뢰도가 0.5이다 (Fallback 표시)', () => {
      const result = generateAWBCorrectionFallback();

      expect(result.confidence).toBe(0.5);
    });

    it('correctedImage가 빈 데이터이다', () => {
      const result = generateAWBCorrectionFallback();

      expect(result.correctedImage.data).toBeInstanceOf(Uint8Array);
      expect(result.correctedImage.data.length).toBe(0);
      expect(result.correctedImage.width).toBe(0);
      expect(result.correctedImage.height).toBe(0);
      expect(result.correctedImage.channels).toBe(3);
    });
  });

  // =========================================
  // generateCIE3Fallback 테스트
  // =========================================

  describe('generateCIE3Fallback', () => {
    it('전체 CIE-3 Fallback을 생성한다', () => {
      const result = generateCIE3Fallback();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('correctionApplied');
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('skinDetection');
      expect(result).toHaveProperty('metadata');
    });

    it('성공 상태이지만 보정 미적용이다', () => {
      const result = generateCIE3Fallback();

      expect(result.success).toBe(true);
      expect(result.correctionApplied).toBe(false);
    });

    it('result가 null이다 (보정 없음)', () => {
      const result = generateCIE3Fallback();

      expect(result.result).toBeNull();
    });

    it('피부 감지 결과가 없다', () => {
      const result = generateCIE3Fallback();

      expect(result.skinDetection.detected).toBe(false);
      expect(result.skinDetection.coverage).toBe(0);
      expect(result.skinDetection.mask).toBeNull();
    });

    it('metadata에 fallback 정보가 있다', () => {
      const result = generateCIE3Fallback();

      expect(result.metadata.methodUsed).toBe('fallback');
      expect(result.metadata.confidence).toBe(0.5);
    });

    it('처리 시간을 받을 수 있다', () => {
      const result = generateCIE3Fallback(150);

      expect(result.metadata.processingTime).toBe(150);
    });

    it('기본 처리 시간은 0이다', () => {
      const result = generateCIE3Fallback();

      expect(result.metadata.processingTime).toBe(0);
    });
  });

  // =========================================
  // generateCorrectedFallback 테스트
  // =========================================

  describe('generateCorrectedFallback', () => {
    it('보정 성공 상태를 생성한다', () => {
      const result = generateCorrectedFallback(5000);

      expect(result.success).toBe(true);
      expect(result.correctionApplied).toBe(true);
    });

    it('원본 CCT를 받아서 사용한다', () => {
      const originalCCT = 4500;
      const result = generateCorrectedFallback(originalCCT);

      expect(result.result?.originalCCT).toBe(originalCCT);
    });

    it('보정 후 CCT는 6500K (D65)이다', () => {
      const result = generateCorrectedFallback(4500);

      expect(result.result?.correctedCCT).toBe(6500);
    });

    it('게인 값이 보정됨을 나타낸다', () => {
      const result = generateCorrectedFallback(4500);

      expect(result.result?.gains.r).toBe(1.1);
      expect(result.result?.gains.g).toBe(1.0);
      expect(result.result?.gains.b).toBe(0.9);
    });

    it('method가 gray_world이다', () => {
      const result = generateCorrectedFallback(4500);

      expect(result.result?.method).toBe('gray_world');
    });

    it('피부가 감지된 상태이다', () => {
      const result = generateCorrectedFallback(4500);

      expect(result.skinDetection.detected).toBe(true);
      expect(result.skinDetection.coverage).toBe(0.15);
    });

    it('처리 시간을 받을 수 있다', () => {
      const result = generateCorrectedFallback(5000, 200);

      expect(result.metadata.processingTime).toBe(200);
    });

    it('신뢰도가 0.7이다', () => {
      const result = generateCorrectedFallback(5000);

      expect(result.metadata.confidence).toBe(0.7);
      expect(result.result?.confidence).toBe(0.7);
    });
  });

  // =========================================
  // generateErrorCIE3Fallback 테스트
  // =========================================

  describe('generateErrorCIE3Fallback', () => {
    it('에러 상태를 생성한다', () => {
      const result = generateErrorCIE3Fallback('AWB 처리 실패');

      expect(result.success).toBe(false);
      expect(result.correctionApplied).toBe(false);
    });

    it('result가 null이다', () => {
      const result = generateErrorCIE3Fallback('오류');

      expect(result.result).toBeNull();
    });

    it('피부 감지가 없다', () => {
      const result = generateErrorCIE3Fallback('오류');

      expect(result.skinDetection.detected).toBe(false);
      expect(result.skinDetection.coverage).toBe(0);
      expect(result.skinDetection.mask).toBeNull();
    });

    it('신뢰도가 0이다', () => {
      const result = generateErrorCIE3Fallback('오류');

      expect(result.metadata.confidence).toBe(0);
    });

    it('methodUsed가 error이다', () => {
      const result = generateErrorCIE3Fallback('오류');

      expect(result.metadata.methodUsed).toBe('error');
    });

    it('처리 시간을 받을 수 있다', () => {
      const result = generateErrorCIE3Fallback('오류', 50);

      expect(result.metadata.processingTime).toBe(50);
    });

    it('기본 처리 시간은 0이다', () => {
      const result = generateErrorCIE3Fallback('오류');

      expect(result.metadata.processingTime).toBe(0);
    });
  });

  // =========================================
  // generateRandomCIE3Mock 테스트
  // =========================================

  describe('generateRandomCIE3Mock', () => {
    it('유효한 CIE-3 출력 구조를 생성한다', () => {
      const result = generateRandomCIE3Mock();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('correctionApplied');
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('skinDetection');
      expect(result).toHaveProperty('metadata');
    });

    it('항상 성공 상태이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE3Mock();
        expect(result.success).toBe(true);
      }
    });

    it('correctionApplied가 랜덤이다 (약 70% 적용)', () => {
      let appliedCount = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const result = generateRandomCIE3Mock();
        if (result.correctionApplied) appliedCount++;
      }

      // 70%에 가까워야 함 (50-90 범위 허용)
      expect(appliedCount).toBeGreaterThan(50);
      expect(appliedCount).toBeLessThan(90);
    });

    it('보정 적용 시 result가 있다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateRandomCIE3Mock();
        if (result.correctionApplied) {
          expect(result.result).not.toBeNull();
          expect(result.result?.gains).toBeDefined();
          expect(result.result?.originalCCT).toBeDefined();
        }
      }
    });

    it('보정 미적용 시 result가 null이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateRandomCIE3Mock();
        if (!result.correctionApplied) {
          expect(result.result).toBeNull();
        }
      }
    });

    it('원본 CCT가 4000-8000K 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE3Mock();
        if (result.result) {
          expect(result.result.originalCCT).toBeGreaterThanOrEqual(4000);
          expect(result.result.originalCCT).toBeLessThan(8000);
        }
      }
    });

    it('게인 값이 합리적 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE3Mock();
        if (result.result) {
          expect(result.result.gains.r).toBeGreaterThanOrEqual(0.8);
          expect(result.result.gains.r).toBeLessThanOrEqual(1.2);
          expect(result.result.gains.g).toBeGreaterThanOrEqual(0.9);
          expect(result.result.gains.g).toBeLessThanOrEqual(1.1);
          expect(result.result.gains.b).toBeGreaterThanOrEqual(0.8);
          expect(result.result.gains.b).toBeLessThanOrEqual(1.2);
        }
      }
    });

    it('피부 커버리지가 0-0.4 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE3Mock();
        expect(result.skinDetection.coverage).toBeGreaterThanOrEqual(0);
        expect(result.skinDetection.coverage).toBeLessThan(0.4);
      }
    });

    it('피부 감지 여부가 커버리지에 따라 결정된다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE3Mock();
        if (result.skinDetection.coverage > 0.05) {
          expect(result.skinDetection.detected).toBe(true);
        } else {
          expect(result.skinDetection.detected).toBe(false);
        }
      }
    });

    it('신뢰도가 0.6-1.0 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE3Mock();
        expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.6);
        expect(result.metadata.confidence).toBeLessThanOrEqual(1.0);
      }
    });

    it('method가 유효한 값이다', () => {
      const validMethods = ['gray_world', 'von_kries', 'skin_aware', 'none'];

      for (let i = 0; i < 20; i++) {
        const result = generateRandomCIE3Mock();
        expect(validMethods).toContain(result.metadata.methodUsed);
      }
    });

    it('processingTime이 합리적 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE3Mock();
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
        expect(result.metadata.processingTime).toBeLessThan(300);
      }
    });
  });

  // =========================================
  // 통합 테스트
  // =========================================

  describe('통합 테스트', () => {
    it('모든 Fallback이 유효한 CIE3Output 타입이다', () => {
      const fallbacks = [
        generateCIE3Fallback(),
        generateCorrectedFallback(5000),
        generateErrorCIE3Fallback('테스트'),
        generateRandomCIE3Mock(),
      ];

      fallbacks.forEach((fb) => {
        expect(typeof fb.success).toBe('boolean');
        expect(typeof fb.correctionApplied).toBe('boolean');
        expect(fb.skinDetection).toBeDefined();
        expect(fb.metadata).toBeDefined();
        expect(typeof fb.metadata.processingTime).toBe('number');
        expect(typeof fb.metadata.confidence).toBe('number');
      });
    });

    it('Fallback 신뢰도가 실제 분석보다 낮다', () => {
      const fallback = generateCIE3Fallback();
      const corrected = generateCorrectedFallback(5000);
      const error = generateErrorCIE3Fallback('오류');

      expect(fallback.metadata.confidence).toBeLessThanOrEqual(0.5);
      expect(corrected.metadata.confidence).toBeLessThanOrEqual(0.7);
      expect(error.metadata.confidence).toBe(0);
    });

    it('에러 상태만 success가 false이다', () => {
      expect(generateCIE3Fallback().success).toBe(true);
      expect(generateCorrectedFallback(5000).success).toBe(true);
      expect(generateErrorCIE3Fallback('오류').success).toBe(false);
    });

    it('correctionApplied와 result의 일관성', () => {
      const fallback = generateCIE3Fallback();
      const corrected = generateCorrectedFallback(5000);

      // 보정 미적용 -> result null
      expect(fallback.correctionApplied).toBe(false);
      expect(fallback.result).toBeNull();

      // 보정 적용 -> result 존재
      expect(corrected.correctionApplied).toBe(true);
      expect(corrected.result).not.toBeNull();
    });
  });
});
