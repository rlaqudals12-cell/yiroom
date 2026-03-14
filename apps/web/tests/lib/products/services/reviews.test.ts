/**
 * 제품 리뷰 서비스 테스트
 *
 * @module tests/lib/products/services/reviews
 * @description 리뷰 CRUD, 도움됨 토글, 별점 유틸리티, 요약 통계 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted로 mock 객체를 vi.mock 팩토리보다 먼저 초기화
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/lib/utils/logger', () => ({
  productLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  getRatingText,
  getRatingColor,
  getReviewSummary,
  getProductReviews,
  hasUserReviewed,
  createReview,
  toggleReviewHelpful,
  getUserReviews,
  deleteReview,
  updateReview,
} from '@/lib/products/services/reviews';
import {
  toProductReview,
  calculateReviewSummary,
  type ProductReviewRow,
  type ProductReview,
  type Rating,
} from '@/types/review';

// 테스트용 리뷰 Row 헬퍼
function createMockReviewRow(overrides: Partial<ProductReviewRow> = {}): ProductReviewRow {
  return {
    id: 'review-1',
    clerk_user_id: 'user-1',
    product_type: 'cosmetic',
    product_id: 'product-1',
    rating: 5,
    title: '좋은 제품',
    content: '피부에 잘 맞아요',
    helpful_count: 10,
    verified_purchase: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function createMockReview(rating: Rating): ProductReview {
  return {
    id: `review-${Math.random().toString(36).slice(2)}`,
    clerkUserId: 'user-1',
    productType: 'cosmetic',
    productId: 'product-1',
    rating,
    helpfulCount: 0,
    verifiedPurchase: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

// 인증된 Supabase 클라이언트 mock (쓰기 함수용)
function createMockAuthClient(options?: {
  insertResult?: { data: unknown; error: unknown };
  updateResult?: { data: unknown; error: unknown };
  deleteResult?: { error: unknown };
}): unknown {
  const client = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  if (options?.insertResult) {
    client.single.mockResolvedValue(options.insertResult);
  } else if (options?.updateResult) {
    client.single.mockResolvedValue(options.updateResult);
  } else if (options?.deleteResult) {
    client.eq.mockResolvedValue(options.deleteResult);
  }

  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
  // 기본 체이닝 재설정
  mockSupabase.from.mockReturnThis();
  mockSupabase.select.mockReturnThis();
  mockSupabase.insert.mockReturnThis();
  mockSupabase.update.mockReturnThis();
  mockSupabase.delete.mockReturnThis();
  mockSupabase.eq.mockReturnThis();
  mockSupabase.in.mockReturnThis();
  mockSupabase.or.mockReturnThis();
  mockSupabase.order.mockReturnThis();
  mockSupabase.range.mockResolvedValue({ data: [], error: null });
  mockSupabase.limit.mockResolvedValue({ data: [], error: null });
  mockSupabase.single.mockResolvedValue({ data: null, error: null });
});

// ================================================
// getRatingText 테스트
// ================================================

describe('getRatingText', () => {
  it('별점 5점은 "최고예요"를 반환한다', () => {
    expect(getRatingText(5)).toBe('최고예요');
  });

  it('별점 4점은 "좋아요"를 반환한다', () => {
    expect(getRatingText(4)).toBe('좋아요');
  });

  it('별점 3점은 "보통이에요"를 반환한다', () => {
    expect(getRatingText(3)).toBe('보통이에요');
  });

  it('별점 2점은 "별로예요"를 반환한다', () => {
    expect(getRatingText(2)).toBe('별로예요');
  });

  it('별점 1점은 "최악이에요"를 반환한다', () => {
    expect(getRatingText(1)).toBe('최악이에요');
  });

  it('범위 밖의 값은 빈 문자열을 반환한다', () => {
    // @ts-expect-error - 범위 밖 테스트
    expect(getRatingText(0)).toBe('');
    // @ts-expect-error - 범위 밖 테스트
    expect(getRatingText(6)).toBe('');
  });
});

// ================================================
// getRatingColor 테스트
// ================================================

describe('getRatingColor', () => {
  it('4.5 이상은 green-500을 반환한다', () => {
    expect(getRatingColor(4.5)).toBe('text-green-500');
    expect(getRatingColor(5)).toBe('text-green-500');
  });

  it('3.5~4.4는 blue-500을 반환한다', () => {
    expect(getRatingColor(3.5)).toBe('text-blue-500');
    expect(getRatingColor(4.4)).toBe('text-blue-500');
  });

  it('2.5~3.4는 yellow-500을 반환한다', () => {
    expect(getRatingColor(2.5)).toBe('text-yellow-500');
    expect(getRatingColor(3.4)).toBe('text-yellow-500');
  });

  it('1.5~2.4는 orange-500을 반환한다', () => {
    expect(getRatingColor(1.5)).toBe('text-orange-500');
    expect(getRatingColor(2.4)).toBe('text-orange-500');
  });

  it('1.5 미만은 red-500을 반환한다', () => {
    expect(getRatingColor(1)).toBe('text-red-500');
    expect(getRatingColor(1.4)).toBe('text-red-500');
    expect(getRatingColor(0)).toBe('text-red-500');
  });

  it('경계값을 정확히 처리한다', () => {
    expect(getRatingColor(4.5)).toBe('text-green-500');
    expect(getRatingColor(3.5)).toBe('text-blue-500');
    expect(getRatingColor(2.5)).toBe('text-yellow-500');
    expect(getRatingColor(1.5)).toBe('text-orange-500');
  });
});

// ================================================
// toProductReview 테스트 (types/review.ts 유틸리티)
// ================================================

describe('toProductReview', () => {
  const mockRow = createMockReviewRow();

  it('DB row를 ProductReview로 변환한다', () => {
    const result = toProductReview(mockRow);

    expect(result.id).toBe('review-1');
    expect(result.clerkUserId).toBe('user-1');
    expect(result.productType).toBe('cosmetic');
    expect(result.productId).toBe('product-1');
    expect(result.rating).toBe(5);
    expect(result.title).toBe('좋은 제품');
    expect(result.content).toBe('피부에 잘 맞아요');
    expect(result.helpfulCount).toBe(10);
    expect(result.verifiedPurchase).toBe(true);
  });

  it('null 필드를 undefined로 변환한다', () => {
    const rowWithNulls = createMockReviewRow({ title: null, content: null });
    const result = toProductReview(rowWithNulls);

    expect(result.title).toBeUndefined();
    expect(result.content).toBeUndefined();
  });

  it('user 정보가 있으면 포함한다', () => {
    const user = { name: '홍길동', profileImageUrl: 'https://example.com/avatar.jpg' };
    const result = toProductReview(mockRow, user);

    expect(result.user).toEqual(user);
  });

  it('isHelpfulByMe 플래그를 설정한다', () => {
    const result = toProductReview(mockRow, undefined, true);

    expect(result.isHelpfulByMe).toBe(true);
  });
});

// ================================================
// calculateReviewSummary 테스트 (types/review.ts 유틸리티)
// ================================================

describe('calculateReviewSummary', () => {
  it('빈 리뷰 배열에서 0을 반환한다', () => {
    const result = calculateReviewSummary([]);

    expect(result.averageRating).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.ratingDistribution).toEqual({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  });

  it('평균 별점을 올바르게 계산한다', () => {
    const reviews = [createMockReview(5), createMockReview(4), createMockReview(3)];

    const result = calculateReviewSummary(reviews);

    expect(result.averageRating).toBe(4); // (5+4+3)/3 = 4
    expect(result.totalCount).toBe(3);
  });

  it('별점 분포를 올바르게 계산한다', () => {
    const reviews = [
      createMockReview(5),
      createMockReview(5),
      createMockReview(4),
      createMockReview(3),
      createMockReview(1),
    ];

    const result = calculateReviewSummary(reviews);

    expect(result.ratingDistribution).toEqual({
      5: 2,
      4: 1,
      3: 1,
      2: 0,
      1: 1,
    });
  });

  it('평균 별점을 소수점 1자리로 반올림한다', () => {
    const reviews = [createMockReview(5), createMockReview(5), createMockReview(4)];

    const result = calculateReviewSummary(reviews);

    // (5+5+4)/3 = 4.666... -> 4.7
    expect(result.averageRating).toBe(4.7);
  });
});

// ================================================
// getReviewSummary 테스트 (Supabase 연동)
// ================================================

describe('getReviewSummary', () => {
  it('리뷰가 없으면 모든 값이 0인 요약을 반환한다', async () => {
    // .eq().eq() 체이닝: 첫 번째 eq는 this 반환, 두 번째 eq는 결과 반환
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ data: [], error: null });

    const result = await getReviewSummary('cosmetic', 'product-1');

    expect(result.averageRating).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.ratingDistribution).toEqual({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  });

  it('리뷰 요약을 올바르게 계산한다', async () => {
    mockSupabase.eq.mockReturnValueOnce(mockSupabase).mockResolvedValueOnce({
      data: [{ rating: 5 }, { rating: 4 }, { rating: 4 }, { rating: 3 }],
      error: null,
    });

    const result = await getReviewSummary('cosmetic', 'product-1');

    expect(result.totalCount).toBe(4);
    expect(result.averageRating).toBe(4); // (5+4+4+3)/4 = 4
    expect(result.ratingDistribution[5]).toBe(1);
    expect(result.ratingDistribution[4]).toBe(2);
    expect(result.ratingDistribution[3]).toBe(1);
  });

  it('Supabase 에러 시 기본값을 반환한다', async () => {
    mockSupabase.eq.mockReturnValueOnce(mockSupabase).mockResolvedValueOnce({
      data: null,
      error: { message: 'DB error' },
    });

    const result = await getReviewSummary('cosmetic', 'product-1');

    expect(result.averageRating).toBe(0);
    expect(result.totalCount).toBe(0);
  });
});

// ================================================
// getProductReviews 테스트 (Supabase 연동)
// ================================================

describe('getProductReviews', () => {
  it('리뷰 목록을 반환한다', async () => {
    const mockRows = [
      createMockReviewRow({ id: 'r1', rating: 5 }),
      createMockReviewRow({ id: 'r2', rating: 4 }),
    ];
    mockSupabase.range.mockResolvedValue({ data: mockRows, error: null });

    const results = await getProductReviews('cosmetic', 'product-1');

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('r1');
    expect(results[1].id).toBe('r2');
  });

  it('에러 시 빈 배열을 반환한다', async () => {
    mockSupabase.range.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });

    const results = await getProductReviews('cosmetic', 'product-1');

    expect(results).toEqual([]);
  });

  it('정렬 옵션 recent는 created_at 내림차순이다', async () => {
    mockSupabase.range.mockResolvedValue({ data: [], error: null });

    await getProductReviews('cosmetic', 'product-1', { sortBy: 'recent' });

    expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('정렬 옵션 helpful은 helpful_count 내림차순이다', async () => {
    mockSupabase.range.mockResolvedValue({ data: [], error: null });

    await getProductReviews('cosmetic', 'product-1', { sortBy: 'helpful' });

    expect(mockSupabase.order).toHaveBeenCalledWith('helpful_count', { ascending: false });
  });

  it('정렬 옵션 rating_high는 rating 내림차순이다', async () => {
    mockSupabase.range.mockResolvedValue({ data: [], error: null });

    await getProductReviews('cosmetic', 'product-1', { sortBy: 'rating_high' });

    expect(mockSupabase.order).toHaveBeenCalledWith('rating', { ascending: false });
  });

  it('정렬 옵션 rating_low는 rating 오름차순이다', async () => {
    mockSupabase.range.mockResolvedValue({ data: [], error: null });

    await getProductReviews('cosmetic', 'product-1', { sortBy: 'rating_low' });

    expect(mockSupabase.order).toHaveBeenCalledWith('rating', { ascending: true });
  });

  it('currentUserId가 있으면 도움됨 표시를 조회한다', async () => {
    const mockRows = [createMockReviewRow({ id: 'r1' })];
    mockSupabase.range.mockResolvedValueOnce({ data: mockRows, error: null });
    // review_helpful 조회 결과
    mockSupabase.in.mockResolvedValueOnce({
      data: [{ review_id: 'r1' }],
      error: null,
    });

    const results = await getProductReviews('cosmetic', 'product-1', undefined, 'user-1');

    expect(results[0].isHelpfulByMe).toBe(true);
  });

  it('리뷰가 없으면 도움됨 조회를 하지 않는다', async () => {
    mockSupabase.range.mockResolvedValue({ data: [], error: null });

    await getProductReviews('cosmetic', 'product-1', undefined, 'user-1');

    // from이 product_reviews만 호출되고 review_helpful은 호출 안 됨
    // range가 빈 배열 반환하므로 in이 호출되지 않아야 함
    expect(mockSupabase.in).not.toHaveBeenCalled();
  });
});

// ================================================
// hasUserReviewed 테스트
// ================================================

describe('hasUserReviewed', () => {
  // hasUserReviewed는 .eq().eq().eq() 3번 체이닝
  it('리뷰가 있으면 true를 반환한다', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase) // .eq('product_type', ...)
      .mockReturnValueOnce(mockSupabase) // .eq('product_id', ...)
      .mockResolvedValueOnce({ count: 1, error: null }); // .eq('clerk_user_id', ...)

    const result = await hasUserReviewed('cosmetic', 'product-1', 'user-1');

    expect(result).toBe(true);
  });

  it('리뷰가 없으면 false를 반환한다', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ count: 0, error: null });

    const result = await hasUserReviewed('cosmetic', 'product-1', 'user-1');

    expect(result).toBe(false);
  });

  it('count가 null이면 false를 반환한다', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ count: null, error: null });

    const result = await hasUserReviewed('cosmetic', 'product-1', 'user-1');

    expect(result).toBe(false);
  });

  it('에러 시 false를 반환한다', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({
        count: null,
        error: { message: 'DB error' },
      });

    const result = await hasUserReviewed('cosmetic', 'product-1', 'user-1');

    expect(result).toBe(false);
  });
});

// ================================================
// createReview 테스트
// ================================================

describe('createReview', () => {
  it('리뷰를 성공적으로 생성하고 반환한다', async () => {
    const mockRow = createMockReviewRow();
    const authClient = createMockAuthClient({
      insertResult: { data: mockRow, error: null },
    });

    const result = await createReview(authClient as never, 'user-1', {
      productType: 'cosmetic',
      productId: 'product-1',
      rating: 5,
      title: '좋은 제품',
      content: '피부에 잘 맞아요',
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBe('review-1');
    expect(result?.rating).toBe(5);
  });

  it('에러 시 null을 반환한다', async () => {
    const authClient = createMockAuthClient({
      insertResult: { data: null, error: { message: 'Insert failed' } },
    });

    const result = await createReview(authClient as never, 'user-1', {
      productType: 'cosmetic',
      productId: 'product-1',
      rating: 5,
    });

    expect(result).toBeNull();
  });

  it('title과 content가 없으면 null로 삽입한다', async () => {
    const mockRow = createMockReviewRow({ title: null, content: null });
    const authClient = createMockAuthClient({
      insertResult: { data: mockRow, error: null },
    });

    const result = await createReview(authClient as never, 'user-1', {
      productType: 'cosmetic',
      productId: 'product-1',
      rating: 4,
    });

    expect(result).not.toBeNull();
    expect(result?.title).toBeUndefined();
    expect(result?.content).toBeUndefined();
  });
});

// ================================================
// toggleReviewHelpful 테스트
// ================================================

describe('toggleReviewHelpful', () => {
  it('도움됨 추가에 성공하면 true를 반환한다', async () => {
    const authClient = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    const result = await toggleReviewHelpful(authClient as never, 'review-1', 'user-1', true);

    expect(result).toBe(true);
  });

  it('이미 도움됨이 있으면 (23505) true를 반환한다', async () => {
    const authClient = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: { code: '23505' } }),
    };

    const result = await toggleReviewHelpful(authClient as never, 'review-1', 'user-1', true);

    expect(result).toBe(true);
  });

  it('도움됨 추가 중 다른 에러 시 false를 반환한다', async () => {
    const authClient = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: { code: '42501', message: 'Permission denied' } }),
    };

    const result = await toggleReviewHelpful(authClient as never, 'review-1', 'user-1', true);

    expect(result).toBe(false);
  });

  it('도움됨 제거에 성공하면 true를 반환한다', async () => {
    const authClient = {
      from: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };
    // .eq('review_id', ...) -> this, .eq('clerk_user_id', ...) -> result
    authClient.eq.mockReturnValueOnce(authClient).mockResolvedValueOnce({ error: null });

    const result = await toggleReviewHelpful(authClient as never, 'review-1', 'user-1', false);

    expect(result).toBe(true);
  });

  it('도움됨 제거 중 에러 시 false를 반환한다', async () => {
    const authClient = {
      from: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };
    authClient.eq
      .mockReturnValueOnce(authClient)
      .mockResolvedValueOnce({ error: { message: 'Delete failed' } });

    const result = await toggleReviewHelpful(authClient as never, 'review-1', 'user-1', false);

    expect(result).toBe(false);
  });
});

// ================================================
// getUserReviews 테스트
// ================================================

describe('getUserReviews', () => {
  it('사용자의 리뷰 목록을 반환한다', async () => {
    const mockRows = [createMockReviewRow({ id: 'r1' }), createMockReviewRow({ id: 'r2' })];
    mockSupabase.limit.mockResolvedValue({ data: mockRows, error: null });

    const results = await getUserReviews('user-1');

    expect(results).toHaveLength(2);
  });

  it('에러 시 빈 배열을 반환한다', async () => {
    mockSupabase.limit.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });

    const results = await getUserReviews('user-1');

    expect(results).toEqual([]);
  });

  it('기본 limit은 20이다', async () => {
    mockSupabase.limit.mockResolvedValue({ data: [], error: null });

    await getUserReviews('user-1');

    expect(mockSupabase.limit).toHaveBeenCalledWith(20);
  });
});

// ================================================
// deleteReview 테스트
// ================================================

describe('deleteReview', () => {
  it('삭제 성공 시 true를 반환한다', async () => {
    const authClient = {
      from: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    const result = await deleteReview(authClient as never, 'review-1');

    expect(result).toBe(true);
  });

  it('삭제 에러 시 false를 반환한다', async () => {
    const authClient = {
      from: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
    };

    const result = await deleteReview(authClient as never, 'review-1');

    expect(result).toBe(false);
  });
});

// ================================================
// updateReview 테스트
// ================================================

describe('updateReview', () => {
  it('수정 성공 시 업데이트된 리뷰를 반환한다', async () => {
    const updatedRow = createMockReviewRow({ rating: 4, title: '수정됨' });
    const authClient = createMockAuthClient({
      updateResult: { data: updatedRow, error: null },
    });

    const result = await updateReview(authClient as never, 'review-1', {
      rating: 4,
      title: '수정됨',
    });

    expect(result).not.toBeNull();
    expect(result?.rating).toBe(4);
    expect(result?.title).toBe('수정됨');
  });

  it('수정 에러 시 null을 반환한다', async () => {
    const authClient = createMockAuthClient({
      updateResult: { data: null, error: { message: 'Update failed' } },
    });

    const result = await updateReview(authClient as never, 'review-1', { rating: 3 });

    expect(result).toBeNull();
  });
});
