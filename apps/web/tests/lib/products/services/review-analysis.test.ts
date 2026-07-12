/**
 * AI 리뷰 분석 서비스 테스트
 * @description review-analysis.ts 단위 테스트
 *
 * generateMockReviewSummary는 2026-07-12 정직성 감사로 제거됨 —
 * 조작된 요약을 "AI 리뷰 분석"으로 표시하는 기만 표면이었음 (실패 시 null 반환으로 대체).
 */

import { describe, it, expect } from 'vitest';
import type { ReviewAISummary, ReviewAIKeyword } from '@/lib/products/services/review-analysis';

// =============================================================================
// ReviewAISummary 타입 검증
// =============================================================================

describe('ReviewAISummary type validation', () => {
  it('should conform to ReviewAISummary interface', () => {
    const summary: ReviewAISummary = {
      positiveKeywords: [{ text: '좋아요', count: 10, sentiment: 'positive' }],
      negativeKeywords: [{ text: '별로예요', count: 3, sentiment: 'negative' }],
      summary: '테스트 요약이에요.',
      pros: ['장점1'],
      cons: ['단점1'],
      overallSentiment: 'positive',
      analyzedCount: 13,
    };

    expect(summary.positiveKeywords[0].text).toBe('좋아요');
    expect(summary.negativeKeywords[0].sentiment).toBe('negative');
    expect(summary.overallSentiment).toBe('positive');
  });

  it('should validate ReviewAIKeyword type', () => {
    const keyword: ReviewAIKeyword = {
      text: '촉촉함',
      count: 42,
      sentiment: 'positive',
    };

    expect(keyword.text).toBe('촉촉함');
    expect(keyword.count).toBe(42);
    expect(keyword.sentiment).toBe('positive');
  });

  it('should accept all valid overallSentiment values', () => {
    const sentiments: ReviewAISummary['overallSentiment'][] = ['positive', 'mixed', 'negative'];

    for (const sentiment of sentiments) {
      const summary: ReviewAISummary = {
        positiveKeywords: [],
        negativeKeywords: [],
        summary: '',
        pros: [],
        cons: [],
        overallSentiment: sentiment,
        analyzedCount: 0,
      };
      expect(summary.overallSentiment).toBe(sentiment);
    }
  });
});
