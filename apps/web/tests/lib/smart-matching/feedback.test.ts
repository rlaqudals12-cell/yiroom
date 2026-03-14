/**
 * 사용자 피드백 Repository 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  smartMatchingLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';
import {
  getFeedbackList,
  getFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getProductAverageRating,
  getProductSizeFitStats,
  getRecommendationAccuracy,
} from '@/lib/smart-matching/feedback';

const NOW_ISO = '2026-01-15T10:00:00Z';

function createMockFeedbackDB(overrides = {}) {
  return {
    id: 'fb-1',
    clerk_user_id: 'user-1',
    feedback_type: 'purchase_review',
    product_id: 'prod-1',
    recommendation_id: null,
    rating: 4,
    size_fit: null,
    color_accuracy: null,
    would_recommend: true,
    comment: '좋아요',
    pros: ['품질 좋음'],
    cons: null,
    photos: null,
    created_at: NOW_ISO,
    ...overrides,
  };
}

describe('피드백 Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFeedbackList', () => {
    it('사용자의 피드백 목록을 반환한다', async () => {
      const mockRows = [createMockFeedbackDB()];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
          }),
        }),
      } as never);

      const result = await getFeedbackList('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('fb-1');
      expect(result[0].feedbackType).toBe('purchase_review');
      expect(result[0].rating).toBe(4);
    });

    it('타입 필터를 적용한다', async () => {
      const mockRows = [createMockFeedbackDB({ feedback_type: 'size_feedback' })];
      const mockEq2 = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq1,
        }),
      } as never);

      const result = await getFeedbackList('user-1', { type: 'size_feedback' });

      expect(result).toHaveLength(1);
      expect(result[0].feedbackType).toBe('size_feedback');
    });

    it('limit 옵션을 적용한다', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: mockLimit,
            }),
          }),
        }),
      } as never);

      await getFeedbackList('user-1', { limit: 5 });

      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('에러 시 빈 배열을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
          }),
        }),
      } as never);

      const result = await getFeedbackList('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getFeedback', () => {
    it('특정 피드백을 반환한다', async () => {
      const mockRow = createMockFeedbackDB();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
          }),
        }),
      } as never);

      const result = await getFeedback('fb-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('fb-1');
      expect(result!.comment).toBe('좋아요');
    });

    it('존재하지 않는 피드백은 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as never);

      const result = await getFeedback('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createFeedback', () => {
    it('피드백을 생성하고 결과를 반환한다', async () => {
      const mockRow = createMockFeedbackDB();
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
          }),
        }),
      } as never);

      const result = await createFeedback({
        clerkUserId: 'user-1',
        feedbackType: 'purchase_review',
        productId: 'prod-1',
        rating: 4,
        comment: '좋아요',
        pros: ['품질 좋음'],
      });

      expect(result).not.toBeNull();
      expect(result!.feedbackType).toBe('purchase_review');
    });

    it('에러 시 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
          }),
        }),
      } as never);

      const result = await createFeedback({
        clerkUserId: 'user-1',
        feedbackType: 'purchase_review',
      });

      expect(result).toBeNull();
    });

    it('선택적 필드 없이 최소 데이터로 생성한다', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createMockFeedbackDB({
              product_id: null,
              recommendation_id: null,
              rating: null,
              comment: null,
            }),
            error: null,
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as never);

      await createFeedback({
        clerkUserId: 'user-1',
        feedbackType: 'match_feedback',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          clerk_user_id: 'user-1',
          feedback_type: 'match_feedback',
          product_id: null,
          rating: null,
        })
      );
    });
  });

  describe('updateFeedback', () => {
    it('피드백을 업데이트하고 true를 반환한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      const result = await updateFeedback('fb-1', {
        rating: 5,
        comment: '최고예요',
      });

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 5,
          comment: '최고예요',
        })
      );
    });

    it('sizeFit를 snake_case로 변환하여 업데이트한다', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      await updateFeedback('fb-1', { sizeFit: 'perfect' });

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ size_fit: 'perfect' }));
    });

    it('에러 시 false를 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
        }),
      } as never);

      const result = await updateFeedback('fb-1', { rating: 5 });

      expect(result).toBe(false);
    });
  });

  describe('deleteFeedback', () => {
    it('피드백을 삭제하고 true를 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);

      const result = await deleteFeedback('fb-1');

      expect(result).toBe(true);
    });

    it('에러 시 false를 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
        }),
      } as never);

      const result = await deleteFeedback('fb-1');

      expect(result).toBe(false);
    });
  });

  describe('getProductAverageRating', () => {
    it('제품의 평균 평점을 반환한다', async () => {
      const mockData = [{ rating: 4 }, { rating: 5 }, { rating: 3 }];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({ data: mockData, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await getProductAverageRating('prod-1');

      expect(result).not.toBeNull();
      expect(result!.averageRating).toBe(4);
      expect(result!.totalCount).toBe(3);
    });

    it('데이터가 없으면 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      } as never);

      const result = await getProductAverageRating('prod-1');

      expect(result).toBeNull();
    });

    it('에러 시 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
            }),
          }),
        }),
      } as never);

      const result = await getProductAverageRating('prod-1');

      expect(result).toBeNull();
    });
  });

  describe('getProductSizeFitStats', () => {
    it('사이즈 핏 통계를 반환한다', async () => {
      const mockData = [
        { size_fit: 'small' },
        { size_fit: 'perfect' },
        { size_fit: 'perfect' },
        { size_fit: 'large' },
      ];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({ data: mockData, error: null }),
            }),
          }),
        }),
      } as never);

      const result = await getProductSizeFitStats('prod-1');

      expect(result).not.toBeNull();
      expect(result!.small).toBe(1);
      expect(result!.perfect).toBe(2);
      expect(result!.large).toBe(1);
      expect(result!.total).toBe(4);
    });

    it('데이터가 없으면 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      } as never);

      const result = await getProductSizeFitStats('prod-1');

      expect(result).toBeNull();
    });
  });

  describe('getRecommendationAccuracy', () => {
    it('추천 정확도를 계산한다', async () => {
      const mockData = [
        { rating: 5, would_recommend: true },
        { rating: 4, would_recommend: false },
        { rating: 2, would_recommend: false },
        { rating: 1, would_recommend: null },
      ];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      } as never);

      const result = await getRecommendationAccuracy('user-1');

      expect(result).not.toBeNull();
      expect(result!.totalRecommendations).toBe(4);
      // would_recommend=true(1) + rating>=4(1 extra: rating=4) = 2
      expect(result!.positiveRatings).toBe(2);
      expect(result!.accuracyPercent).toBe(50);
    });

    it('데이터가 없으면 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as never);

      const result = await getRecommendationAccuracy('user-1');

      expect(result).toBeNull();
    });

    it('에러 시 null을 반환한다', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
          }),
        }),
      } as never);

      const result = await getRecommendationAccuracy('user-1');

      expect(result).toBeNull();
    });
  });
});
