/**
 * Coach 모듈 Barrel Export 테스트
 *
 * @module tests/lib/coach/index
 * @description 모든 공개 API가 올바르게 export되는지 확인
 */

import { describe, it, expect } from 'vitest';
import * as coachModule from '@/lib/coach';

describe('lib/coach/index (Barrel Export)', () => {
  // =========================================
  // Context exports
  // =========================================

  describe('context exports', () => {
    it('getUserContext 함수를 export한다', () => {
      expect(coachModule.getUserContext).toBeDefined();
      expect(typeof coachModule.getUserContext).toBe('function');
    });

    it('summarizeContext 함수를 export한다', () => {
      expect(coachModule.summarizeContext).toBeDefined();
      expect(typeof coachModule.summarizeContext).toBe('function');
    });
  });

  // =========================================
  // Prompts exports
  // =========================================

  describe('prompts exports', () => {
    it('buildCoachSystemPrompt 함수를 export한다', () => {
      expect(coachModule.buildCoachSystemPrompt).toBeDefined();
      expect(typeof coachModule.buildCoachSystemPrompt).toBe('function');
    });

    it('getQuestionHint 함수를 export한다', () => {
      expect(coachModule.getQuestionHint).toBeDefined();
      expect(typeof coachModule.getQuestionHint).toBe('function');
    });

    it('QUICK_QUESTIONS 상수를 export한다', () => {
      expect(coachModule.QUICK_QUESTIONS).toBeDefined();
      expect(Array.isArray(coachModule.QUICK_QUESTIONS)).toBe(true);
    });

    it('QUICK_QUESTIONS_BY_CATEGORY 상수를 export한다', () => {
      expect(coachModule.QUICK_QUESTIONS_BY_CATEGORY).toBeDefined();
      expect(typeof coachModule.QUICK_QUESTIONS_BY_CATEGORY).toBe('object');
    });
  });

  // =========================================
  // Chat exports
  // =========================================

  describe('chat exports', () => {
    it('generateCoachResponse 함수를 export한다', () => {
      expect(coachModule.generateCoachResponse).toBeDefined();
      expect(typeof coachModule.generateCoachResponse).toBe('function');
    });

    it('generateCoachResponseStream 함수를 export한다', () => {
      expect(coachModule.generateCoachResponseStream).toBeDefined();
      expect(typeof coachModule.generateCoachResponseStream).toBe('function');
    });
  });

  // =========================================
  // History exports
  // =========================================

  describe('history exports', () => {
    it('createCoachSession 함수를 export한다', () => {
      expect(coachModule.createCoachSession).toBeDefined();
      expect(typeof coachModule.createCoachSession).toBe('function');
    });

    it('saveCoachMessage 함수를 export한다', () => {
      expect(coachModule.saveCoachMessage).toBeDefined();
      expect(typeof coachModule.saveCoachMessage).toBe('function');
    });

    it('getCoachSessions 함수를 export한다', () => {
      expect(coachModule.getCoachSessions).toBeDefined();
      expect(typeof coachModule.getCoachSessions).toBe('function');
    });

    it('getSessionMessages 함수를 export한다', () => {
      expect(coachModule.getSessionMessages).toBeDefined();
      expect(typeof coachModule.getSessionMessages).toBe('function');
    });

    it('deleteCoachSession 함수를 export한다', () => {
      expect(coachModule.deleteCoachSession).toBeDefined();
      expect(typeof coachModule.deleteCoachSession).toBe('function');
    });

    it('updateSessionCategory 함수를 export한다', () => {
      expect(coachModule.updateSessionCategory).toBeDefined();
      expect(typeof coachModule.updateSessionCategory).toBe('function');
    });
  });

  // =========================================
  // Export 완전성 테스트
  // =========================================

  describe('export 완전성', () => {
    it('예상되는 모든 함수가 export된다', () => {
      const expectedFunctions = [
        // context
        'getUserContext',
        'summarizeContext',
        // prompts
        'buildCoachSystemPrompt',
        'getQuestionHint',
        // chat
        'generateCoachResponse',
        'generateCoachResponseStream',
        // history
        'createCoachSession',
        'saveCoachMessage',
        'getCoachSessions',
        'getSessionMessages',
        'deleteCoachSession',
        'updateSessionCategory',
      ];

      expectedFunctions.forEach((fnName) => {
        expect(coachModule).toHaveProperty(fnName);
        expect(typeof (coachModule as Record<string, unknown>)[fnName]).toBe('function');
      });
    });

    it('예상되는 모든 상수가 export된다', () => {
      const expectedConstants = ['QUICK_QUESTIONS', 'QUICK_QUESTIONS_BY_CATEGORY'];

      expectedConstants.forEach((constName) => {
        expect(coachModule).toHaveProperty(constName);
      });
    });

    it('QUICK_QUESTIONS는 비어있지 않다', () => {
      expect(coachModule.QUICK_QUESTIONS.length).toBeGreaterThan(0);
    });

    it('QUICK_QUESTIONS_BY_CATEGORY는 카테고리별 질문을 포함한다', () => {
      const categories = Object.keys(coachModule.QUICK_QUESTIONS_BY_CATEGORY);
      expect(categories.length).toBeGreaterThan(0);

      // 각 카테고리에 질문이 있어야 함
      categories.forEach((category) => {
        const questions =
          coachModule.QUICK_QUESTIONS_BY_CATEGORY[
            category as keyof typeof coachModule.QUICK_QUESTIONS_BY_CATEGORY
          ];
        expect(Array.isArray(questions)).toBe(true);
      });
    });
  });

  // =========================================
  // 함수 시그니처 기본 테스트
  // =========================================

  describe('함수 시그니처 기본 검증', () => {
    it('getQuestionHint는 문자열을 반환한다', () => {
      const hint = coachModule.getQuestionHint('test question');
      expect(typeof hint).toBe('string');
    });

    it('summarizeContext는 null 입력 시 문자열을 반환한다', () => {
      const summary = coachModule.summarizeContext(null);
      expect(typeof summary).toBe('string');
      expect(summary).toBe('컨텍스트 없음');
    });

    it('summarizeContext는 빈 객체 입력 시 문자열을 반환한다', () => {
      const summary = coachModule.summarizeContext({});
      expect(typeof summary).toBe('string');
      expect(summary).toBe('기본 정보만');
    });
  });
});
