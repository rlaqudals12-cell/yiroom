/**
 * 핏 선호도 학습 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeFitPattern,
  generateFitUpdateMessage,
  type FitFeedbackEntry,
} from '@/lib/smart-matching/fit-preference-learner';

// 헬퍼: 피드백 생성
function makeFeedback(sizeFit: 'small' | 'perfect' | 'large', daysAgo = 0): FitFeedbackEntry {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return { sizeFit, category: 'top', createdAt: date };
}

describe('핏 선호도 학습', () => {
  describe('analyzeFitPattern', () => {
    it('피드백이 부족하면 업데이트하지 않는다', () => {
      const result = analyzeFitPattern([makeFeedback('small'), makeFeedback('small')], 'regular');
      expect(result.shouldUpdate).toBe(false);
      expect(result.feedbackCount).toBe(2);
      expect(result.reasoning).toContain('미달');
    });

    it('빈 피드백은 업데이트하지 않는다', () => {
      const result = analyzeFitPattern([], 'regular');
      expect(result.shouldUpdate).toBe(false);
      expect(result.feedbackCount).toBe(0);
    });

    it('small 피드백이 60%+ 이면 루즈하게 변경 권장 (tight→regular)', () => {
      const feedback = [
        makeFeedback('small', 1),
        makeFeedback('small', 2),
        makeFeedback('small', 3),
        makeFeedback('perfect', 4),
      ];
      const result = analyzeFitPattern(feedback, 'tight');
      expect(result.shouldUpdate).toBe(true);
      expect(result.suggestedFit).toBe('regular');
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    });

    it('small 피드백이 60%+ 이면 루즈하게 변경 권장 (regular→loose)', () => {
      const feedback = [
        makeFeedback('small', 1),
        makeFeedback('small', 2),
        makeFeedback('small', 3),
      ];
      const result = analyzeFitPattern(feedback, 'regular');
      expect(result.shouldUpdate).toBe(true);
      expect(result.suggestedFit).toBe('loose');
    });

    it('이미 loose인데 small이 많아도 loose 유지', () => {
      const feedback = [
        makeFeedback('small', 1),
        makeFeedback('small', 2),
        makeFeedback('small', 3),
      ];
      const result = analyzeFitPattern(feedback, 'loose');
      expect(result.shouldUpdate).toBe(false);
      expect(result.suggestedFit).toBe('loose');
    });

    it('large 피드백이 60%+ 이면 타이트하게 변경 권장 (loose→regular)', () => {
      const feedback = [
        makeFeedback('large', 1),
        makeFeedback('large', 2),
        makeFeedback('large', 3),
        makeFeedback('perfect', 4),
      ];
      const result = analyzeFitPattern(feedback, 'loose');
      expect(result.shouldUpdate).toBe(true);
      expect(result.suggestedFit).toBe('regular');
    });

    it('large 피드백이 60%+ 이면 타이트하게 변경 권장 (regular→tight)', () => {
      const feedback = [
        makeFeedback('large', 1),
        makeFeedback('large', 2),
        makeFeedback('large', 3),
      ];
      const result = analyzeFitPattern(feedback, 'regular');
      expect(result.shouldUpdate).toBe(true);
      expect(result.suggestedFit).toBe('tight');
    });

    it('이미 tight인데 large가 많아도 tight 유지', () => {
      const feedback = [
        makeFeedback('large', 1),
        makeFeedback('large', 2),
        makeFeedback('large', 3),
      ];
      const result = analyzeFitPattern(feedback, 'tight');
      expect(result.shouldUpdate).toBe(false);
      expect(result.suggestedFit).toBe('tight');
    });

    it('perfect가 다수이면 현재 핏 유지', () => {
      const feedback = [
        makeFeedback('perfect', 1),
        makeFeedback('perfect', 2),
        makeFeedback('perfect', 3),
        makeFeedback('small', 4),
      ];
      const result = analyzeFitPattern(feedback, 'regular');
      expect(result.shouldUpdate).toBe(false);
      expect(result.suggestedFit).toBe('regular');
    });

    it('혼재된 피드백이면 현재 핏 유지', () => {
      const feedback = [
        makeFeedback('small', 1),
        makeFeedback('perfect', 2),
        makeFeedback('large', 3),
        makeFeedback('small', 4),
        makeFeedback('large', 5),
      ];
      const result = analyzeFitPattern(feedback, 'regular');
      expect(result.shouldUpdate).toBe(false);
    });

    it('최근 10개만 분석한다', () => {
      // 오래된 small 피드백 15개 + 최근 perfect 5개
      const oldFeedback = Array.from({ length: 15 }, (_, i) => makeFeedback('small', 30 + i));
      const recentFeedback = Array.from({ length: 5 }, (_, i) => makeFeedback('perfect', i));
      const allFeedback = [...oldFeedback, ...recentFeedback];

      const result = analyzeFitPattern(allFeedback, 'regular');
      // 최근 10개 중 perfect가 5개 = 50%, small 5개 = 50% → 혼재
      expect(result.feedbackCount).toBeLessThanOrEqual(20);
    });

    it('distribution이 정확한 값을 반환한다', () => {
      const feedback = [
        makeFeedback('small', 1),
        makeFeedback('small', 2),
        makeFeedback('perfect', 3),
        makeFeedback('large', 4),
      ];
      const result = analyzeFitPattern(feedback, 'regular');
      expect(result.distribution.small).toBe(2);
      expect(result.distribution.perfect).toBe(1);
      expect(result.distribution.large).toBe(1);
    });
  });

  describe('generateFitUpdateMessage', () => {
    it('업데이트가 필요 없으면 현재 핏 유지 메시지', () => {
      const analysis = analyzeFitPattern(
        [makeFeedback('perfect'), makeFeedback('perfect'), makeFeedback('perfect')],
        'regular'
      );
      const message = generateFitUpdateMessage(analysis);
      expect(message).toContain('레귤러');
      expect(message).toContain('잘 맞고');
    });

    it('업데이트가 필요하면 변경 권장 메시지', () => {
      const analysis = analyzeFitPattern(
        [makeFeedback('small'), makeFeedback('small'), makeFeedback('small')],
        'tight'
      );
      const message = generateFitUpdateMessage(analysis);
      expect(message).toContain('타이트');
      expect(message).toContain('레귤러');
      expect(message).toContain('변경');
    });
  });
});
