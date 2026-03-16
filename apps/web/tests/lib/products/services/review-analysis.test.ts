/**
 * AI 리뷰 분석 서비스 테스트
 * @description review-analysis.ts 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockReviewSummary,
  type ReviewAISummary,
  type ReviewAIKeyword,
} from '@/lib/products/services/review-analysis';

// =============================================================================
// generateMockReviewSummary 테스트
// =============================================================================

describe('generateMockReviewSummary', () => {
  it('should return valid ReviewAISummary structure', () => {
    const result = generateMockReviewSummary(20);

    expect(result).toBeDefined();
    expect(result.positiveKeywords).toBeInstanceOf(Array);
    expect(result.negativeKeywords).toBeInstanceOf(Array);
    expect(typeof result.summary).toBe('string');
    expect(result.pros).toBeInstanceOf(Array);
    expect(result.cons).toBeInstanceOf(Array);
    expect(typeof result.overallSentiment).toBe('string');
    expect(typeof result.analyzedCount).toBe('number');
  });

  it('should include positiveKeywords with text, count, sentiment', () => {
    const result = generateMockReviewSummary(30);

    expect(result.positiveKeywords.length).toBeGreaterThan(0);
    for (const kw of result.positiveKeywords) {
      expect(kw).toHaveProperty('text');
      expect(kw).toHaveProperty('count');
      expect(kw).toHaveProperty('sentiment');
      expect(typeof kw.text).toBe('string');
      expect(typeof kw.count).toBe('number');
      expect(kw.count).toBeGreaterThan(0);
      expect(kw.sentiment).toBe('positive');
    }
  });

  it('should include negativeKeywords with correct sentiment', () => {
    const result = generateMockReviewSummary(25);

    expect(result.negativeKeywords.length).toBeGreaterThan(0);
    for (const kw of result.negativeKeywords) {
      expect(kw.sentiment).toBe('negative');
      expect(kw.count).toBeGreaterThan(0);
    }
  });

  it('should set analyzedCount to the provided reviewCount', () => {
    const count = 42;
    const result = generateMockReviewSummary(count);
    expect(result.analyzedCount).toBe(count);
  });

  it('should have overallSentiment as one of valid values', () => {
    const result = generateMockReviewSummary(10);
    expect(['positive', 'mixed', 'negative']).toContain(result.overallSentiment);
  });

  it('should have pros and cons arrays with string items', () => {
    const result = generateMockReviewSummary(15);

    expect(result.pros.length).toBeGreaterThan(0);
    for (const p of result.pros) {
      expect(typeof p).toBe('string');
      expect(p.length).toBeGreaterThan(0);
    }

    expect(result.cons.length).toBeGreaterThan(0);
    for (const c of result.cons) {
      expect(typeof c).toBe('string');
      expect(c.length).toBeGreaterThan(0);
    }
  });

  it('should have summary as non-empty string', () => {
    const result = generateMockReviewSummary(20);
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('should scale keyword counts based on review count', () => {
    const smallResult = generateMockReviewSummary(10);
    const largeResult = generateMockReviewSummary(100);

    // 리뷰 수가 많을수록 키워드 count도 커야 함
    const smallMax = Math.max(...smallResult.positiveKeywords.map((k) => k.count));
    const largeMax = Math.max(...largeResult.positiveKeywords.map((k) => k.count));
    expect(largeMax).toBeGreaterThan(smallMax);
  });

  it('should handle very small review count (edge case)', () => {
    const result = generateMockReviewSummary(1);
    expect(result.analyzedCount).toBe(1);
    expect(result.positiveKeywords.length).toBeGreaterThan(0);
    // count가 최소 1 이상 (Math.ceil)
    for (const kw of result.positiveKeywords) {
      expect(kw.count).toBeGreaterThanOrEqual(1);
    }
  });

  it('should handle zero review count gracefully', () => {
    const result = generateMockReviewSummary(0);
    expect(result.analyzedCount).toBe(0);
    // 0개 리뷰여도 구조는 유지
    expect(result.positiveKeywords).toBeInstanceOf(Array);
    expect(result.negativeKeywords).toBeInstanceOf(Array);
  });
});

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
