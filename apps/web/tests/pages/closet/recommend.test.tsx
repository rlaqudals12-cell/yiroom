/**
 * 옷장 추천 페이지 에러 분기 테스트
 * @description 조회 실패가 "옷장이 비어있어요"(정상 0개)로 위장되지 않는지 검증.
 *   과거 catch가 console.error만 하고 빈 상태를 렌더해 오류가 빈 옷장으로 보였다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const { mockSupabaseFrom, stableClient } = vi.hoisted(() => {
  const from = vi.fn();
  return { mockSupabaseFrom: from, stableClient: { from } };
});

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => stableClient,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('@/lib/weather', () => ({
  getWeatherWithGeolocation: vi.fn().mockResolvedValue(null),
}));

import ClosetRecommendPage from '@/app/(main)/closet/recommend/page';

type QueryResult = { data: unknown; error: unknown };

// 테스트 중 갱신 가능한 user_inventory 응답 (재시도 시나리오용)
const state: { inventory: QueryResult } = {
  inventory: { data: [], error: null },
};

function makeChain(getResult: () => QueryResult) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(async () => getResult()),
    then: (onF: (v: QueryResult) => unknown, onR?: (e: unknown) => unknown) =>
      Promise.resolve(getResult()).then(onF, onR),
  };
  return chain;
}

describe('ClosetRecommendPage 에러 분기', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.inventory = { data: [], error: null };
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'user_inventory') return makeChain(() => state.inventory);
      // 프로필 조회(personal_color_assessments/body_analyses)는 빈 응답
      return makeChain(() => ({ data: null, error: null }));
    });
  });

  it('조회 실패 시 오류 UI를 표시하고 빈 옷장으로 위장하지 않는다', async () => {
    state.inventory = { data: null, error: { message: 'DB down' } };

    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('closet-error-state')).toBeInTheDocument();
    });
    expect(screen.getByText('옷장을 불러오지 못했어요')).toBeInTheDocument();
    // 재발 방지: 오류가 "옷장이 비어있어요"(정상 빈 상태)로 렌더되면 안 됨
    expect(screen.queryByTestId('closet-empty-state')).not.toBeInTheDocument();
    expect(screen.queryByText('옷장이 비어있어요')).not.toBeInTheDocument();
    // 복구 경로(재시도 버튼) 존재
    expect(screen.getByTestId('closet-error-retry')).toBeInTheDocument();
  });

  it('재시도 성공 시 오류 UI가 사라지고 정상 상태를 렌더한다', async () => {
    state.inventory = { data: null, error: { message: 'DB down' } };

    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('closet-error-state')).toBeInTheDocument();
    });

    // 다음 조회는 성공 (정상 빈 옷장)
    state.inventory = { data: [], error: null };
    fireEvent.click(screen.getByTestId('closet-error-retry'));

    await waitFor(() => {
      expect(screen.getByTestId('closet-empty-state')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('closet-error-state')).not.toBeInTheDocument();
  });

  it('정상 빈 옷장(0개)은 오류가 아니라 빈 상태로 렌더한다', async () => {
    state.inventory = { data: [], error: null };

    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('closet-empty-state')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('closet-error-state')).not.toBeInTheDocument();
  });
});
