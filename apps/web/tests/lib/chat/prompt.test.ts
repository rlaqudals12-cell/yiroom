/**
 * AI 채팅 프롬프트 빌더 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  SYSTEM_PROMPT,
  buildContextPrompt,
  buildHistoryPrompt,
  buildFullPrompt,
  parseProductRecommendations,
} from '@/lib/chat/prompt';
import type { ChatContext, ChatMessage } from '@/types/chat';

describe('Chat Prompt', () => {
  describe('SYSTEM_PROMPT', () => {
    it('시스템 프롬프트가 정의되어 있다', () => {
      expect(SYSTEM_PROMPT).toBeDefined();
      expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });

    it('시스템 프롬프트에 역할 정의가 포함되어 있다', () => {
      expect(SYSTEM_PROMPT).toContain('이룸');
      expect(SYSTEM_PROMPT).toContain('웰니스');
    });

    it('시스템 프롬프트에 금지 사항이 포함되어 있다', () => {
      expect(SYSTEM_PROMPT).toContain('금지');
      expect(SYSTEM_PROMPT).toContain('의료');
    });
  });

  describe('buildContextPrompt', () => {
    it('빈 컨텍스트는 기본 헤더만 반환한다', () => {
      const context: ChatContext = {};
      const prompt = buildContextPrompt(context);

      expect(prompt).toContain('사용자 분석 결과');
    });

    it('피부 분석 결과를 포함한다', () => {
      const context: ChatContext = {
        skinAnalysis: {
          skinType: '복합성',
          moisture: 42,
          concerns: ['모공', '건조'],
          recommendedIngredients: ['히알루론산'],
          analyzedAt: '2025-01-15',
        },
      };
      const prompt = buildContextPrompt(context);

      expect(prompt).toContain('피부 분석');
      expect(prompt).toContain('복합성');
      expect(prompt).toContain('42%');
      expect(prompt).toContain('낮음');
    });

    it('퍼스널컬러 결과를 포함한다', () => {
      const context: ChatContext = {
        personalColor: {
          season: '봄',
          tone: '웜톤',
          bestColors: ['코랄', '피치'],
          worstColors: ['블랙'],
          analyzedAt: '2025-01-10',
        },
      };
      const prompt = buildContextPrompt(context);

      expect(prompt).toContain('퍼스널컬러');
      expect(prompt).toContain('봄 웜톤');
      expect(prompt).toContain('코랄');
    });

    it('운동 계획을 포함한다', () => {
      const context: ChatContext = {
        workoutPlan: {
          goal: '근력 강화',
          level: '중급',
          frequency: 4,
        },
      };
      const prompt = buildContextPrompt(context);

      expect(prompt).toContain('운동 계획');
      expect(prompt).toContain('근력 강화');
      expect(prompt).toContain('주 4회');
    });
  });

  describe('buildHistoryPrompt', () => {
    it('빈 히스토리는 빈 문자열을 반환한다', () => {
      const history: ChatMessage[] = [];
      const prompt = buildHistoryPrompt(history);

      expect(prompt).toBe('');
    });

    it('대화 히스토리를 포맷팅한다', () => {
      const history: ChatMessage[] = [
        { id: '1', role: 'user', content: '안녕', timestamp: new Date() },
        { id: '2', role: 'assistant', content: '안녕하세요!', timestamp: new Date() },
      ];
      const prompt = buildHistoryPrompt(history);

      expect(prompt).toContain('이전 대화');
      expect(prompt).toContain('사용자: 안녕');
      expect(prompt).toContain('AI: 안녕하세요!');
    });

    it('최대 메시지 수를 제한한다', () => {
      const history: ChatMessage[] = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        role: 'user' as const,
        content: `메시지 ${i}`,
        timestamp: new Date(),
      }));
      const prompt = buildHistoryPrompt(history, 5);

      expect(prompt).toContain('메시지 10');
      expect(prompt).toContain('메시지 14');
      expect(prompt).not.toContain('메시지 0');
    });
  });

  describe('buildFullPrompt', () => {
    it('전체 프롬프트를 조합한다', () => {
      const context: ChatContext = {
        skinAnalysis: {
          skinType: '건성',
          moisture: 30,
          concerns: ['건조'],
          recommendedIngredients: ['세라마이드'],
          analyzedAt: '2025-01-15',
        },
      };
      const history: ChatMessage[] = [];
      const prompt = buildFullPrompt('보습제 추천해줘', context, history);

      expect(prompt).toContain(SYSTEM_PROMPT);
      expect(prompt).toContain('피부 분석');
      expect(prompt).toContain('현재 질문');
      expect(prompt).toContain('보습제 추천해줘');
    });
  });

  describe('parseProductRecommendations', () => {
    it('제품 추천 태그를 파싱한다', () => {
      const response = '이 제품을 추천드려요. [PRODUCT:prod_001:세라마이드 크림:건성 피부에 효과적]';
      const result = parseProductRecommendations(response);

      expect(result.products.length).toBe(1);
      expect(result.products[0].productId).toBe('prod_001');
      expect(result.products[0].productName).toBe('세라마이드 크림');
      expect(result.products[0].reason).toBe('건성 피부에 효과적');
    });

    it('태그가 제거된 응답을 반환한다', () => {
      const response = '추천드려요. [PRODUCT:p1:크림:좋아요] 사용해보세요.';
      const result = parseProductRecommendations(response);

      expect(result.cleanedResponse).toBe('추천드려요.  사용해보세요.');
      expect(result.cleanedResponse).not.toContain('[PRODUCT');
    });

    it('여러 제품 추천을 파싱한다', () => {
      const response = '[PRODUCT:p1:제품1:이유1] 그리고 [PRODUCT:p2:제품2:이유2]';
      const result = parseProductRecommendations(response);

      expect(result.products.length).toBe(2);
    });

    it('태그가 없으면 빈 배열을 반환한다', () => {
      const response = '일반 응답입니다.';
      const result = parseProductRecommendations(response);

      expect(result.products.length).toBe(0);
      expect(result.cleanedResponse).toBe('일반 응답입니다.');
    });
  });
});
