/**
 * OH-1 구강건강 모듈 Barrel Export 테스트
 *
 * @module tests/lib/oral-health/index
 * @description 모든 공개 API가 올바르게 export되는지 확인
 */

import { describe, it, expect } from 'vitest';
import * as oralHealthModule from '@/lib/oral-health';

describe('lib/oral-health/index (Barrel Export)', () => {
  // =========================================
  // 치아 색상 분석 exports
  // =========================================

  describe('tooth color exports', () => {
    it('analyzeToothColor 함수를 export한다', () => {
      expect(oralHealthModule.analyzeToothColor).toBeDefined();
      expect(typeof oralHealthModule.analyzeToothColor).toBe('function');
    });

    it('generateToothColorSummary 함수를 export한다', () => {
      expect(oralHealthModule.generateToothColorSummary).toBeDefined();
      expect(typeof oralHealthModule.generateToothColorSummary).toBe('function');
    });
  });

  // =========================================
  // 잇몸 건강 분석 exports
  // =========================================

  describe('gum health exports', () => {
    it('analyzeGumHealth 함수를 export한다', () => {
      expect(oralHealthModule.analyzeGumHealth).toBeDefined();
      expect(typeof oralHealthModule.analyzeGumHealth).toBe('function');
    });

    it('getGumHealthGrade 함수를 export한다', () => {
      expect(oralHealthModule.getGumHealthGrade).toBeDefined();
      expect(typeof oralHealthModule.getGumHealthGrade).toBe('function');
    });

    it('generateGumHealthSummary 함수를 export한다', () => {
      expect(oralHealthModule.generateGumHealthSummary).toBeDefined();
      expect(typeof oralHealthModule.generateGumHealthSummary).toBe('function');
    });
  });

  // =========================================
  // 미백 목표 계산 exports
  // =========================================

  describe('whitening goal exports', () => {
    it('calculateWhiteningGoal 함수를 export한다', () => {
      expect(oralHealthModule.calculateWhiteningGoal).toBeDefined();
      expect(typeof oralHealthModule.calculateWhiteningGoal).toBe('function');
    });

    it('trackWhiteningProgress 함수를 export한다', () => {
      expect(oralHealthModule.trackWhiteningProgress).toBeDefined();
      expect(typeof oralHealthModule.trackWhiteningProgress).toBe('function');
    });

    it('generateWhiteningPrecautions 함수를 export한다', () => {
      expect(oralHealthModule.generateWhiteningPrecautions).toBeDefined();
      expect(typeof oralHealthModule.generateWhiteningPrecautions).toBe('function');
    });

    it('generateWhiteningGoalSummary 함수를 export한다', () => {
      expect(oralHealthModule.generateWhiteningGoalSummary).toBeDefined();
      expect(typeof oralHealthModule.generateWhiteningGoalSummary).toBe('function');
    });
  });

  // =========================================
  // 제품 추천 exports
  // =========================================

  describe('product recommendation exports', () => {
    it('recommendOralProducts 함수를 export한다', () => {
      expect(oralHealthModule.recommendOralProducts).toBeDefined();
      expect(typeof oralHealthModule.recommendOralProducts).toBe('function');
    });

    it('generateProductRecommendationSummary 함수를 export한다', () => {
      expect(oralHealthModule.generateProductRecommendationSummary).toBeDefined();
      expect(typeof oralHealthModule.generateProductRecommendationSummary).toBe('function');
    });
  });

  // =========================================
  // Export 완전성 테스트
  // =========================================

  describe('export 완전성', () => {
    it('예상되는 모든 함수가 export된다', () => {
      const expectedFunctions = [
        // tooth color
        'analyzeToothColor',
        'generateToothColorSummary',
        // gum health
        'analyzeGumHealth',
        'getGumHealthGrade',
        'generateGumHealthSummary',
        // whitening goal
        'calculateWhiteningGoal',
        'trackWhiteningProgress',
        'generateWhiteningPrecautions',
        'generateWhiteningGoalSummary',
        // product recommendation
        'recommendOralProducts',
        'generateProductRecommendationSummary',
      ];

      expectedFunctions.forEach((fnName) => {
        expect(oralHealthModule).toHaveProperty(fnName);
        expect(typeof (oralHealthModule as Record<string, unknown>)[fnName]).toBe('function');
      });
    });
  });

  // =========================================
  // 함수 시그니처 기본 테스트
  // =========================================

  describe('함수 시그니처 기본 검증', () => {
    it('getGumHealthGrade는 올바른 등급 객체를 반환한다', () => {
      const grade = oralHealthModule.getGumHealthGrade(15);
      expect(grade).toHaveProperty('grade');
      expect(grade).toHaveProperty('label');
      expect(grade).toHaveProperty('description');
      expect(grade.grade).toBe('A');
    });

    it('generateWhiteningPrecautions는 배열을 반환한다', () => {
      const precautions = oralHealthModule.generateWhiteningPrecautions('spring', 2);
      expect(Array.isArray(precautions)).toBe(true);
      expect(precautions.length).toBeGreaterThan(0);
    });
  });
});
