/**
 * AI 채팅 컨텍스트 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockContext,
  summarizeContext,
  hasValidContext,
  detectRelatedAnalysis,
} from '@/lib/chat/context';

describe('Chat Context', () => {
  describe('generateMockContext', () => {
    it('Mock 컨텍스트를 생성한다', () => {
      const context = generateMockContext();

      expect(context).toBeDefined();
      expect(context.skinAnalysis).toBeDefined();
      expect(context.personalColor).toBeDefined();
      expect(context.bodyAnalysis).toBeDefined();
    });

    it('피부 분석 데이터가 유효하다', () => {
      const context = generateMockContext();

      expect(context.skinAnalysis?.skinType).toBeDefined();
      expect(context.skinAnalysis?.moisture).toBeGreaterThan(0);
      expect(context.skinAnalysis?.concerns.length).toBeGreaterThan(0);
    });
  });

  describe('summarizeContext', () => {
    it('컨텍스트를 요약한다', () => {
      const context = generateMockContext();
      const summary = summarizeContext(context);

      expect(summary).toContain('피부');
      expect(summary).toContain('컬러');
      expect(summary).toContain('체형');
    });

    it('빈 컨텍스트는 빈 문자열을 반환한다', () => {
      const summary = summarizeContext({});
      expect(summary).toBe('');
    });
  });

  describe('hasValidContext', () => {
    it('분석 결과가 있으면 true를 반환한다', () => {
      const context = generateMockContext();
      expect(hasValidContext(context)).toBe(true);
    });

    it('빈 컨텍스트는 false를 반환한다', () => {
      expect(hasValidContext({})).toBe(false);
    });

    it('피부 분석만 있어도 true를 반환한다', () => {
      expect(
        hasValidContext({
          skinAnalysis: {
            skinType: '건성',
            moisture: 30,
            concerns: [],
            recommendedIngredients: [],
            analyzedAt: '2025-01-01',
          },
        })
      ).toBe(true);
    });
  });

  describe('detectRelatedAnalysis', () => {
    it('피부 관련 키워드를 감지한다', () => {
      expect(detectRelatedAnalysis('피부 타입이 뭐야?')).toBe('skin');
      expect(detectRelatedAnalysis('보습제 추천해줘')).toBe('skin');
      expect(detectRelatedAnalysis('모공이 고민이에요')).toBe('skin');
    });

    it('컬러 관련 키워드를 감지한다', () => {
      expect(detectRelatedAnalysis('립 컬러 추천')).toBe('personal-color');
      expect(detectRelatedAnalysis('웜톤에 어울리는 색')).toBe('personal-color');
    });

    it('운동 관련 키워드를 감지한다', () => {
      expect(detectRelatedAnalysis('운동 루틴 알려줘')).toBe('workout');
      expect(detectRelatedAnalysis('근육 키우는 방법')).toBe('workout');
    });

    it('영양 관련 키워드를 감지한다', () => {
      expect(detectRelatedAnalysis('단백질 얼마나 먹어야 해?')).toBe('nutrition');
      expect(detectRelatedAnalysis('칼로리 계산')).toBe('nutrition');
    });

    it('체형 관련 키워드를 감지한다', () => {
      expect(detectRelatedAnalysis('체형에 맞는 옷')).toBe('body');
      expect(detectRelatedAnalysis('다이어트 방법')).toBe('body');
    });

    it('제품 관련 키워드를 감지한다', () => {
      expect(detectRelatedAnalysis('제품 추천해줘')).toBe('product');
      expect(detectRelatedAnalysis('이 성분 효과가 뭐야?')).toBe('product');
    });

    it('관련 없는 메시지는 null을 반환한다', () => {
      expect(detectRelatedAnalysis('안녕하세요')).toBeNull();
      expect(detectRelatedAnalysis('오늘 날씨 좋다')).toBeNull();
    });
  });
});
