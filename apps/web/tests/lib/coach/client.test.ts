/**
 * Coach 클라이언트 모듈 테스트
 *
 * @module tests/lib/coach/client
 * @description 클라이언트 전용 export 확인 및 타입 정합성 테스트
 */

import { describe, it, expect } from 'vitest';
import * as clientModule from '@/lib/coach/client';

describe('lib/coach/client (Client Exports)', () => {
  // =========================================
  // Types re-exports
  // =========================================

  describe('types re-exports', () => {
    it('summarizeContext 함수를 export한다', () => {
      expect(clientModule.summarizeContext).toBeDefined();
      expect(typeof clientModule.summarizeContext).toBe('function');
    });

    it('summarizeContext는 정상 작동한다', () => {
      const result = clientModule.summarizeContext(null);
      expect(result).toBe('컨텍스트 없음');
    });
  });

  // =========================================
  // Prompts re-exports
  // =========================================

  describe('prompts re-exports', () => {
    it('QUICK_QUESTIONS 상수를 export한다', () => {
      expect(clientModule.QUICK_QUESTIONS).toBeDefined();
      expect(Array.isArray(clientModule.QUICK_QUESTIONS)).toBe(true);
    });

    it('QUICK_QUESTIONS_BY_CATEGORY 상수를 export한다', () => {
      expect(clientModule.QUICK_QUESTIONS_BY_CATEGORY).toBeDefined();
      expect(typeof clientModule.QUICK_QUESTIONS_BY_CATEGORY).toBe('object');
    });

    it('getQuestionHint 함수를 export한다', () => {
      expect(clientModule.getQuestionHint).toBeDefined();
      expect(typeof clientModule.getQuestionHint).toBe('function');
    });

    it('getQuestionHint는 힌트 문자열을 반환한다', () => {
      const hint = clientModule.getQuestionHint('피부 관리');
      expect(typeof hint).toBe('string');
    });
  });

  // =========================================
  // CoachMessage 인터페이스 정합성 테스트
  // =========================================

  describe('CoachMessage 인터페이스 정합성', () => {
    it('유저 메시지 객체를 생성할 수 있다', () => {
      const userMessage: clientModule.CoachMessage = {
        id: 'msg_001',
        role: 'user',
        content: '피부 관리 어떻게 하면 좋을까요?',
        timestamp: new Date(),
      };

      expect(userMessage.id).toBe('msg_001');
      expect(userMessage.role).toBe('user');
      expect(userMessage.content).toContain('피부');
      expect(userMessage.timestamp).toBeInstanceOf(Date);
    });

    it('어시스턴트 메시지 객체를 생성할 수 있다', () => {
      const assistantMessage: clientModule.CoachMessage = {
        id: 'msg_002',
        role: 'assistant',
        content: '피부 타입에 맞는 관리법을 알려드릴게요.',
        timestamp: new Date(),
      };

      expect(assistantMessage.role).toBe('assistant');
    });

    it('role은 user 또는 assistant만 허용한다', () => {
      const validRoles: Array<'user' | 'assistant'> = ['user', 'assistant'];

      validRoles.forEach((role) => {
        const message: clientModule.CoachMessage = {
          id: 'test',
          role,
          content: 'test',
          timestamp: new Date(),
        };
        expect(['user', 'assistant']).toContain(message.role);
      });
    });
  });

  // =========================================
  // CoachChatResponse 인터페이스 정합성 테스트
  // =========================================

  describe('CoachChatResponse 인터페이스 정합성', () => {
    it('기본 응답 객체를 생성할 수 있다', () => {
      const response: clientModule.CoachChatResponse = {
        message: '안녕하세요! 무엇을 도와드릴까요?',
      };

      expect(response.message).toBeDefined();
      expect(response.suggestedQuestions).toBeUndefined();
    });

    it('추천 질문 포함 응답 객체를 생성할 수 있다', () => {
      const response: clientModule.CoachChatResponse = {
        message: '피부 타입을 분석해보셨나요?',
        suggestedQuestions: ['피부 분석 시작하기', '피부 관리 팁 알려줘', '오늘 날씨에 맞는 스킨케어는?'],
      };

      expect(response.message).toBeDefined();
      expect(response.suggestedQuestions).toBeDefined();
      expect(Array.isArray(response.suggestedQuestions)).toBe(true);
      expect(response.suggestedQuestions?.length).toBe(3);
    });

    it('빈 추천 질문 배열도 허용한다', () => {
      const response: clientModule.CoachChatResponse = {
        message: '답변입니다.',
        suggestedQuestions: [],
      };

      expect(response.suggestedQuestions).toEqual([]);
    });
  });

  // =========================================
  // Export 완전성 테스트
  // =========================================

  describe('export 완전성', () => {
    it('클라이언트에서 필요한 함수가 모두 export된다', () => {
      const expectedExports = ['summarizeContext', 'getQuestionHint'];

      expectedExports.forEach((name) => {
        expect(clientModule).toHaveProperty(name);
        expect(typeof (clientModule as Record<string, unknown>)[name]).toBe('function');
      });
    });

    it('클라이언트에서 필요한 상수가 모두 export된다', () => {
      const expectedConstants = ['QUICK_QUESTIONS', 'QUICK_QUESTIONS_BY_CATEGORY'];

      expectedConstants.forEach((name) => {
        expect(clientModule).toHaveProperty(name);
      });
    });

    it('서버 전용 함수는 export되지 않는다', () => {
      // client.ts는 서버 전용 함수를 export하지 않아야 함
      const serverOnlyFunctions = [
        'getUserContext',
        'buildCoachSystemPrompt',
        'generateCoachResponse',
        'generateCoachResponseStream',
        'createCoachSession',
        'saveCoachMessage',
      ];

      serverOnlyFunctions.forEach((name) => {
        expect((clientModule as Record<string, unknown>)[name]).toBeUndefined();
      });
    });
  });

  // =========================================
  // 메시지 생성 헬퍼 테스트
  // =========================================

  describe('메시지 유틸리티 패턴', () => {
    it('대화 배열을 생성할 수 있다', () => {
      const conversation: clientModule.CoachMessage[] = [
        {
          id: '1',
          role: 'user',
          content: '안녕하세요',
          timestamp: new Date('2026-01-01T10:00:00'),
        },
        {
          id: '2',
          role: 'assistant',
          content: '안녕하세요! 무엇을 도와드릴까요?',
          timestamp: new Date('2026-01-01T10:00:05'),
        },
        {
          id: '3',
          role: 'user',
          content: '피부 상담하고 싶어요',
          timestamp: new Date('2026-01-01T10:00:30'),
        },
      ];

      expect(conversation.length).toBe(3);
      expect(conversation[0].role).toBe('user');
      expect(conversation[1].role).toBe('assistant');
      expect(conversation[2].role).toBe('user');
    });

    it('메시지 시간순 정렬이 가능하다', () => {
      const messages: clientModule.CoachMessage[] = [
        { id: '2', role: 'assistant', content: 'B', timestamp: new Date('2026-01-01T10:01:00') },
        { id: '1', role: 'user', content: 'A', timestamp: new Date('2026-01-01T10:00:00') },
        { id: '3', role: 'user', content: 'C', timestamp: new Date('2026-01-01T10:02:00') },
      ];

      const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });
  });
});
