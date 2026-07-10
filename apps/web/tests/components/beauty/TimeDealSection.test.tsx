/**
 * TimeDealSection 테스트
 *
 * 가짜 평점 정리(2026-07-11 배치 C):
 * - rating 없는 제품에 `?? 4.5` 하드코딩 폴백을 채워 "★4.5"로 렌더하던 문제 제거 —
 *   실측 평점이 없으면 별점 UI 자체를 렌더하지 않는다 (0점·기본값 폴백 금지)
 * - rating/review_count 정렬을 nulls last로 — 평점 없는 행이 "인기 제품" 상단 점유 금지
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

// Supabase 체이너블 쿼리 mock — order 호출 인자를 기록해 nulls last 재발 방지 단언
type Row = {
  id: string;
  name: string;
  brand: string;
  price_krw: number | null;
  rating: number | null;
  review_count: number | null;
  image_url: string | null;
};

let mockRows: Row[] = [];
const orderCalls: { column: string; options: unknown }[] = [];

function createQueryMock() {
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'limit']) {
    query[method] = vi.fn(() => query);
  }
  query.order = vi.fn((column: string, options: unknown) => {
    orderCalls.push({ column, options });
    return query;
  });
  // await query → { data, error }
  (query as { then?: unknown }).then = (resolve: (value: { data: Row[]; error: null }) => void) =>
    resolve({ data: mockRows, error: null });
  return query;
}

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: () => createQueryMock() }),
}));

import { TimeDealSection } from '@/components/beauty/TimeDealSection';

describe('TimeDealSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderCalls.length = 0;
    mockRows = [];
  });

  it('rating이 null인 제품은 별점 UI를 렌더하지 않아야 함 (4.5 폴백 금지 — 재발 방지)', async () => {
    mockRows = [
      {
        id: 'p-null',
        name: '평점 없는 세럼',
        brand: '구달',
        price_krw: 18000,
        rating: null,
        review_count: null,
        image_url: null,
      },
    ];

    render(<TimeDealSection />);
    await screen.findByTestId('time-deal-section');

    // 제품 카드 자체는 렌더되지만
    expect(screen.getByText('평점 없는 세럼')).toBeInTheDocument();
    // 지어낸 폴백 평점("4.5")이 어디에도 없어야 한다
    expect(screen.queryByText('4.5')).toBeNull();
    // 별점 행의 리뷰 수 표기("(0)")도 없어야 한다
    expect(screen.queryByText('(0)')).toBeNull();
  });

  it('실측 rating이 있는 제품만 평점을 렌더해야 함', async () => {
    mockRows = [
      {
        id: 'p-real',
        name: '실평점 크림',
        brand: '토리든',
        price_krw: 21000,
        rating: 4.2,
        review_count: 132,
        image_url: null,
      },
      {
        id: 'p-null',
        name: '평점 없는 토너',
        brand: '라운드랩',
        price_krw: 15000,
        rating: null,
        review_count: null,
        image_url: null,
      },
    ];

    render(<TimeDealSection />);
    await screen.findByTestId('time-deal-section');

    expect(screen.getByText('4.2')).toBeInTheDocument();
    expect(screen.getByText('(132)')).toBeInTheDocument();
    // null 제품에는 폴백 평점이 붙지 않는다
    expect(screen.queryByText('4.5')).toBeNull();
  });

  it('rating/review_count 정렬은 nulls last여야 함 (평점 없는 행이 상단 점유 금지)', async () => {
    mockRows = [
      {
        id: 'p-1',
        name: '아무 제품',
        brand: 'A',
        price_krw: 10000,
        rating: null,
        review_count: null,
        image_url: null,
      },
    ];

    render(<TimeDealSection />);
    await screen.findByTestId('time-deal-section');

    // StrictMode 등으로 effect가 재실행될 수 있어 호출 횟수 대신 "모든 호출의 형태"를 단언
    const ratingOrders = orderCalls.filter((c) => c.column === 'rating');
    const reviewOrders = orderCalls.filter((c) => c.column === 'review_count');
    expect(ratingOrders.length).toBeGreaterThan(0);
    expect(reviewOrders.length).toBeGreaterThan(0);
    for (const call of [...ratingOrders, ...reviewOrders]) {
      expect(call.options).toEqual({ ascending: false, nullsFirst: false });
    }
  });

  it('제품이 없으면 섹션 자체를 렌더하지 않아야 함', async () => {
    mockRows = [];

    const { container } = render(<TimeDealSection />);
    // fetch 완료 대기 (마이크로태스크 소진)
    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="time-deal-section"]')).toBeNull();
    });
  });
});
