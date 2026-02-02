/**
 * CIE-2 Fallback 데이터 생성 테스트
 *
 * @module tests/lib/image-engine/cie-2/fallback
 * @description 에러/타임아웃 시 Mock 데이터 반환 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateFrontalityFallback,
  generateCIE2Fallback,
  generateNoFaceFallback,
  generateErrorFallback,
  generateRandomCIE2Mock,
} from '@/lib/image-engine/cie-2/fallback';
import { FEEDBACK_MESSAGES } from '@/lib/image-engine/constants';

describe('lib/image-engine/cie-2/fallback', () => {
  // =========================================
  // generateFrontalityFallback 테스트
  // =========================================

  describe('generateFrontalityFallback', () => {
    it('기본 정면성 Fallback을 생성한다', () => {
      const result = generateFrontalityFallback();

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('angleDeviations');
      expect(result).toHaveProperty('feedback');
    });

    it('유효한 정면성 상태를 반환한다', () => {
      const result = generateFrontalityFallback();

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(85);
    });

    it('각도 편차가 임계값 이내이다', () => {
      const result = generateFrontalityFallback();

      expect(result.angleDeviations.pitch).toBeLessThanOrEqual(10);
      expect(result.angleDeviations.yaw).toBeLessThanOrEqual(15);
      expect(result.angleDeviations.roll).toBeLessThanOrEqual(20);
    });

    it('피드백 메시지가 있다', () => {
      const result = generateFrontalityFallback();

      expect(result.feedback).toBe('얼굴 각도가 적절합니다.');
    });
  });

  // =========================================
  // generateCIE2Fallback 테스트
  // =========================================

  describe('generateCIE2Fallback', () => {
    it('전체 CIE-2 Fallback을 생성한다', () => {
      const result = generateCIE2Fallback();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('faceDetected');
      expect(result).toHaveProperty('faceCount');
      expect(result).toHaveProperty('validation');
      expect(result).toHaveProperty('metadata');
    });

    it('성공 상태를 반환한다', () => {
      const result = generateCIE2Fallback();

      expect(result.success).toBe(true);
      expect(result.faceDetected).toBe(true);
      expect(result.faceCount).toBe(1);
    });

    it('selectedFace와 faceRegion은 undefined이다 (Fallback에서는 생략)', () => {
      const result = generateCIE2Fallback();

      expect(result.selectedFace).toBeUndefined();
      expect(result.faceRegion).toBeUndefined();
    });

    it('validation 정보가 유효하다', () => {
      const result = generateCIE2Fallback();

      expect(result.validation.isAngleValid).toBe(true);
      expect(result.validation.frontalityResult.isValid).toBe(true);
    });

    it('metadata에 fallback 버전이 표시된다', () => {
      const result = generateCIE2Fallback();

      expect(result.metadata.modelVersion).toBe('fallback');
      expect(result.metadata.confidence).toBe(0.5);
    });

    it('처리 시간을 받을 수 있다', () => {
      const result = generateCIE2Fallback(150);

      expect(result.metadata.processingTime).toBe(150);
    });

    it('기본 처리 시간은 0이다', () => {
      const result = generateCIE2Fallback();

      expect(result.metadata.processingTime).toBe(0);
    });
  });

  // =========================================
  // generateNoFaceFallback 테스트
  // =========================================

  describe('generateNoFaceFallback', () => {
    it('얼굴 미감지 상태를 생성한다', () => {
      const result = generateNoFaceFallback();

      expect(result.success).toBe(true);
      expect(result.faceDetected).toBe(false);
      expect(result.faceCount).toBe(0);
    });

    it('validation이 무효 상태이다', () => {
      const result = generateNoFaceFallback();

      expect(result.validation.isAngleValid).toBe(false);
      expect(result.validation.frontalityResult.isValid).toBe(false);
    });

    it('신뢰도가 0이다', () => {
      const result = generateNoFaceFallback();

      expect(result.metadata.confidence).toBe(0);
    });

    it('피드백 메시지가 얼굴 미감지 안내이다', () => {
      const result = generateNoFaceFallback();

      expect(result.validation.angleFeedback).toBe(FEEDBACK_MESSAGES.face.notDetected);
    });

    it('처리 시간을 받을 수 있다', () => {
      const result = generateNoFaceFallback(200);

      expect(result.metadata.processingTime).toBe(200);
    });

    it('정면성 점수가 0이다', () => {
      const result = generateNoFaceFallback();

      expect(result.validation.frontalityResult.score).toBe(0);
    });

    it('각도 편차가 모두 0이다', () => {
      const result = generateNoFaceFallback();

      expect(result.validation.frontalityResult.angleDeviations.pitch).toBe(0);
      expect(result.validation.frontalityResult.angleDeviations.yaw).toBe(0);
      expect(result.validation.frontalityResult.angleDeviations.roll).toBe(0);
    });
  });

  // =========================================
  // generateErrorFallback 테스트
  // =========================================

  describe('generateErrorFallback', () => {
    it('에러 상태를 생성한다', () => {
      const result = generateErrorFallback('MediaPipe 초기화 실패');

      expect(result.success).toBe(false);
      expect(result.faceDetected).toBe(false);
    });

    it('에러 메시지가 피드백에 포함된다', () => {
      const errorMessage = 'GPU 메모리 부족';
      const result = generateErrorFallback(errorMessage);

      expect(result.validation.angleFeedback).toBe(errorMessage);
      expect(result.validation.frontalityResult.feedback).toBe(errorMessage);
    });

    it('신뢰도가 0이다', () => {
      const result = generateErrorFallback('오류');

      expect(result.metadata.confidence).toBe(0);
    });

    it('modelVersion이 error이다', () => {
      const result = generateErrorFallback('오류');

      expect(result.metadata.modelVersion).toBe('error');
    });

    it('처리 시간을 받을 수 있다', () => {
      const result = generateErrorFallback('오류', 50);

      expect(result.metadata.processingTime).toBe(50);
    });

    it('faceCount가 0이다', () => {
      const result = generateErrorFallback('오류');

      expect(result.faceCount).toBe(0);
    });

    it('validation이 무효 상태이다', () => {
      const result = generateErrorFallback('오류');

      expect(result.validation.isAngleValid).toBe(false);
      expect(result.validation.frontalityResult.isValid).toBe(false);
    });
  });

  // =========================================
  // generateRandomCIE2Mock 테스트
  // =========================================

  describe('generateRandomCIE2Mock', () => {
    it('유효한 CIE-2 출력 구조를 생성한다', () => {
      const result = generateRandomCIE2Mock();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('faceDetected');
      expect(result).toHaveProperty('faceCount');
      expect(result).toHaveProperty('validation');
      expect(result).toHaveProperty('metadata');
    });

    it('대부분 얼굴이 감지된다 (90% 확률)', () => {
      let detectedCount = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const result = generateRandomCIE2Mock();
        if (result.faceDetected) detectedCount++;
      }

      // 90%에 가까워야 함 (70-100 범위 허용)
      expect(detectedCount).toBeGreaterThan(70);
    });

    it('정면성 점수가 60-100 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE2Mock();
        const score = result.validation.frontalityResult.score;
        expect(score).toBeGreaterThanOrEqual(60);
        expect(score).toBeLessThanOrEqual(100);
      }
    });

    it('각도 편차가 합리적 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE2Mock();
        const { pitch, yaw, roll } = result.validation.frontalityResult.angleDeviations;

        expect(pitch).toBeGreaterThanOrEqual(0);
        expect(pitch).toBeLessThan(15);
        expect(yaw).toBeGreaterThanOrEqual(0);
        expect(yaw).toBeLessThan(20);
        expect(roll).toBeGreaterThanOrEqual(0);
        expect(roll).toBeLessThan(25);
      }
    });

    it('신뢰도가 0.8-1.0 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE2Mock();
        expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.8);
        expect(result.metadata.confidence).toBeLessThanOrEqual(1.0);
      }
    });

    it('modelVersion이 mock이다', () => {
      const result = generateRandomCIE2Mock();

      expect(result.metadata.modelVersion).toBe('mock');
    });

    it('processingTime이 합리적 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE2Mock();
        expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
        expect(result.metadata.processingTime).toBeLessThan(500);
      }
    });

    it('faceCount가 faceDetected와 일치한다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE2Mock();
        if (result.faceDetected) {
          expect(result.faceCount).toBe(1);
        } else {
          expect(result.faceCount).toBe(0);
        }
      }
    });

    it('isAngleValid가 각도 편차에 따라 결정된다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateRandomCIE2Mock();
        const { pitch, yaw, roll } = result.validation.frontalityResult.angleDeviations;
        const isValid = pitch < 10 && yaw < 15 && roll < 20;

        expect(result.validation.isAngleValid).toBe(isValid);
        expect(result.validation.frontalityResult.isValid).toBe(isValid);
      }
    });
  });

  // =========================================
  // 통합 테스트
  // =========================================

  describe('통합 테스트', () => {
    it('모든 Fallback이 유효한 CIE2Output 타입이다', () => {
      const fallbacks = [
        generateCIE2Fallback(),
        generateNoFaceFallback(),
        generateErrorFallback('테스트'),
        generateRandomCIE2Mock(),
      ];

      fallbacks.forEach((fb) => {
        expect(typeof fb.success).toBe('boolean');
        expect(typeof fb.faceDetected).toBe('boolean');
        expect(typeof fb.faceCount).toBe('number');
        expect(fb.validation).toBeDefined();
        expect(fb.metadata).toBeDefined();
      });
    });

    it('Fallback 신뢰도가 실제 분석보다 낮다', () => {
      const fallback = generateCIE2Fallback();
      const noFace = generateNoFaceFallback();
      const error = generateErrorFallback('오류');

      expect(fallback.metadata.confidence).toBeLessThanOrEqual(0.5);
      expect(noFace.metadata.confidence).toBe(0);
      expect(error.metadata.confidence).toBe(0);
    });

    it('성공/실패 상태가 올바르게 설정된다', () => {
      expect(generateCIE2Fallback().success).toBe(true);
      expect(generateNoFaceFallback().success).toBe(true); // 얼굴 미감지도 성공
      expect(generateErrorFallback('오류').success).toBe(false); // 에러만 실패
    });
  });
});
